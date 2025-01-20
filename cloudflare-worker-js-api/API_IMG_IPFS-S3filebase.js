async function handles3filebaseRequest(request) {
    if (request.method !== 'POST' || !request.headers.get('Content-Type').includes('multipart/form-data')) {
      return new Response('Invalid request', { status: 400 });
    }
  
    try {
      // 从 KV 获取配置
      const config = await WORKER_IMGBED.get('s3filebase_config', 'json');
      if (!config || !config.accessKey || !config.secretKey || !config.bucket) {
        throw new Error('Invalid S3 configuration');
      }
  
      const formData = await request.formData();
      const file = formData.get('image');
      if (!file) {
        return new Response('No file found', { status: 400 });
      }
  
      const now = new Date();
      const timestamp = now.toISOString()
        .replace(/[-:]/g, '')
        .split('.')[0]
        .replace('T', '_');
      
      const fileName = file.name.split('.')[0];
      const extension = file.name.split('.').pop() || '';
      const s3Key = `${fileName}_${timestamp}.${extension}`;
      const content = await file.arrayBuffer();
  
      const amzdate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
      const dateStamp = amzdate.slice(0, 8);
      const contentHash = await crypto.subtle.digest('SHA-256', content)
        .then(buf => Array.from(new Uint8Array(buf))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(''));
  
      const canonicalUri = `/${config.bucket}/${s3Key}`;
      const uploadHeaders = {
        'Host': 's3.filebase.com',
        'Content-Type': file.type || 'application/octet-stream',
        'X-Amz-Content-SHA256': contentHash,
        'X-Amz-Date': amzdate
      };
  
      const algorithm = 'AWS4-HMAC-SHA256';
      const region = 'us-east-1';
      const service = 's3';
      const scope = `${dateStamp}/${region}/${service}/aws4_request`;
  
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
  
      const stringToSign = [
        algorithm,
        amzdate,
        scope,
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest))
          .then(buf => Array.from(new Uint8Array(buf))
            .map(b => b.toString(16).padStart(2, '0'))
            .join(''))
      ].join('\n');
  
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
  
      const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(stringToSign)
      );
  
      const authorization = 
        `${algorithm} ` +
        `Credential=${config.accessKey}/${scope}, ` +
        `SignedHeaders=${signedHeaders}, ` +
        `Signature=${Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')}`;
  
      const uploadResponse = await fetch(`https://s3.filebase.com${canonicalUri}`, {
        method: 'PUT',
        headers: {
          ...uploadHeaders,
          'Authorization': authorization
        },
        body: content
      });
  
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }
  
      const cid = uploadResponse.headers.get('x-amz-meta-cid');
      if (!cid) {
        throw new Error('CID not found in response');
      }
  
      return new Response(`https://i0.wp.com/i0.img2ipfs.com/ipfs/${cid}`);
  
    } catch (error) {
      return new Response(`Upload failed: ${error.message}`, { status: 500 });
    }
  }