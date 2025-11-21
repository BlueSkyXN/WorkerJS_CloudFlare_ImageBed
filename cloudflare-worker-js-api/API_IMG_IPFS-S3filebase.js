/* 
  接口来自 https://docs.filebase.com/ipfs-pinning/pinning-files#using-the-s3-compatible-api
  注册免费账号即可，无需信用卡手机号，支持免费PLAN，包括1000文件数和5GB空间，平均5MB足够使用
  管理时也可以直接用Alist等S3对接实现
  本JS实现了在Cloudflare Worker中使用Filebase的S3 API上传文件到IPFS存储桶并返回IPFS CID以制作URL
  需要的KV库是的名字是WORKER_IMGBED，KV库的内容是JSON格式的配置，包括accessKey、secretKey和bucket
  bucket是存储桶名（自定义），accessKey和secretKey是Filebase的S3 API的凭证（随机分配，来自 https://console.filebase.com/keys 的key和Secret
*/

async function handles3filebaseRequest(request) {
    console.log('[S3-Filebase] Starting request handling');

    if (request.method !== 'POST' || !request.headers.get('Content-Type').includes('multipart/form-data')) {
        console.error('[S3-Filebase] Invalid request method or content type:', {
            method: request.method,
            contentType: request.headers.get('Content-Type')
        });
        return new Response('Invalid request', { status: 400 });
    }

    try {
        console.log('[S3-Filebase] Fetching configuration');

        // 优先尝试从 Header 获取配置 (JSON 字符串，统一使用 X-EXTRA-SECRET)
        let config;
        const headerConfig = request.headers.get('X-EXTRA-SECRET');
        if (headerConfig) {
            try {
                config = JSON.parse(headerConfig);
                console.log('[S3-Filebase] Configuration loaded from Header');
            } catch (e) {
                console.error('[S3-Filebase] Invalid JSON in X-EXTRA-SECRET header');
            }
        }

        // 如果 Header 没有或无效，从 KV 获取
        if (!config) {
            config = await WORKER_IMGBED.get('S3_FILEBASE_CONFIG', 'json');
            if (config) {
                console.log('[S3-Filebase] Configuration loaded from KV');
            }
        }
        if (!config || !config.accessKey || !config.secretKey || !config.bucket) {
            console.error('[S3-Filebase] Invalid configuration:', {
                hasConfig: !!config,
                hasAccessKey: !!config?.accessKey,
                hasSecretKey: !!config?.secretKey,
                hasBucket: !!config?.bucket
            });
            return new Response('Missing Secret: S3 Config (KV: S3_FILEBASE_CONFIG or Header: X-EXTRA-SECRET)', { status: 500 });
        }
        console.log('[S3-Filebase] Configuration loaded successfully');

        const formData = await request.formData();
        const file = formData.get('image');
        if (!file) {
            console.error('[S3-Filebase] No file found in form data');
            return new Response('No file found', { status: 400 });
        }

        // 获取安全的文件名
        const originalName = file.name;
        const extension = originalName.split('.').pop() || '';
        const timestamp = new Date().toISOString()
            .replace(/[-:]/g, '')
            .split('.')[0]
            .replace('T', '_');

        // 生成安全的文件名：使用时间戳和随机字符串，避免中文和特殊字符
        const safeFileName = `${timestamp}_${Math.random().toString(36).substring(2, 15)}.${extension}`;
        console.log('[S3-Filebase] File details:', {
            originalName,
            safeFileName,
            type: file.type,
            size: file.size
        });

        const content = await file.arrayBuffer();
        console.log('[S3-Filebase] File content loaded:', {
            contentSize: content.byteLength
        });

        // AWS 签名所需的时间戳
        const now = new Date();
        const amzdate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
        const dateStamp = amzdate.slice(0, 8);

        // 计算内容哈希
        const contentHash = await crypto.subtle.digest('SHA-256', content)
            .then(buf => Array.from(new Uint8Array(buf))
                .map(b => b.toString(16).padStart(2, '0'))
                .join(''));

        // URI 编码的路径
        const encodedKey = encodeURIComponent(safeFileName).replace(/%20/g, '+');
        const canonicalUri = `/${config.bucket}/${encodedKey}`;

        // 准备签名所需的头部
        const uploadHeaders = {
            'Host': 's3.filebase.com',
            'Content-Type': file.type || 'application/octet-stream',
            'X-Amz-Content-SHA256': contentHash,
            'X-Amz-Date': amzdate
        };

        console.log('[S3-Filebase] Request preparation:', {
            canonicalUri,
            amzdate,
            contentHashPrefix: contentHash.substring(0, 16) + '...'
        });

        const algorithm = 'AWS4-HMAC-SHA256';
        const region = 'us-east-1';
        const service = 's3';
        const scope = `${dateStamp}/${region}/${service}/aws4_request`;

        // 准备规范请求
        const canonicalHeaders = Object.entries(uploadHeaders)
            .map(([k, v]) => `${k.toLowerCase()}:${v}\n`)
            .sort()
            .join('');
        const signedHeaders = Object.keys(uploadHeaders)
            .map(k => k.toLowerCase())
            .sort()
            .join(';');

        const canonicalRequest = [
            'PUT',
            canonicalUri,
            '',
            canonicalHeaders,
            signedHeaders,
            contentHash
        ].join('\n');

        console.log('[S3-Filebase] Canonical request prepared:', {
            method: 'PUT',
            uri: canonicalUri,
            signedHeaders
        });

        const stringToSign = [
            algorithm,
            amzdate,
            scope,
            await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest))
                .then(buf => Array.from(new Uint8Array(buf))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join(''))
        ].join('\n');

        // 生成签名密钥
        let key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(`AWS4${config.secretKey}`),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        for (const msg of [dateStamp, region, service, 'aws4_request']) {
            key = await crypto.subtle.importKey(
                'raw',
                await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg)),
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );
        }

        // 计算最终签名
        const signature = await crypto.subtle.sign(
            'HMAC',
            key,
            new TextEncoder().encode(stringToSign)
        );

        // 构建授权头
        const credential = `${config.accessKey}/${dateStamp}/${region}/${service}/aws4_request`;
        const authorization = [
            `${algorithm} Credential=${credential}`,
            `SignedHeaders=${signedHeaders}`,
            `Signature=${Array.from(new Uint8Array(signature))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')}`
        ].join(', ');

        console.log('[S3-Filebase] Authorization prepared:', {
            credentialPrefix: credential.split('/')[0] + '/...',
            signedHeadersCount: signedHeaders.split(';').length
        });

        // 发送上传请求
        const uploadUrl = `https://s3.filebase.com${canonicalUri}`;
        console.log('[S3-Filebase] Sending upload request to:', uploadUrl);

        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                ...uploadHeaders,
                'Authorization': authorization
            },
            body: content
        });

        if (!uploadResponse.ok) {
            const errorBody = await uploadResponse.text();
            console.error('[S3-Filebase] Upload failed:', {
                status: uploadResponse.status,
                statusText: uploadResponse.statusText,
                responseBody: errorBody,
                headers: Object.fromEntries([...uploadResponse.headers])
            });
            throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorBody}`);
        }

        console.log('[S3-Filebase] Upload successful');
        const cid = uploadResponse.headers.get('x-amz-meta-cid');
        if (!cid) {
            console.error('[S3-Filebase] CID not found in response headers:',
                Object.fromEntries([...uploadResponse.headers]));
            throw new Error('CID not found in response');
        }

        const finalUrl = `https://ipfs.io/ipfs/${cid}`;
        console.log('[S3-Filebase] Generated final URL:', finalUrl);
        return new Response(finalUrl);

    } catch (error) {
        console.error('[S3-Filebase] Error in request handling:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        return new Response(`Upload failed: ${error.message}`, {
            status: 500,
            headers: {
                'Content-Type': 'text/plain',
                'X-Error-Details': error.message
            }
        });
    }
}