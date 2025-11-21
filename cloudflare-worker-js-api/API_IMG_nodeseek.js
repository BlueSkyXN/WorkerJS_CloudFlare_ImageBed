
async function handleNodeseekRequest(request) {
    // 验证请求方法
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    // 验证 Content-Type
    const contentType = request.headers.get('Content-Type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
        return new Response('Invalid Content-Type', { status: 400 });
    }

    try {
        // 从 KV 中获取 API Key
        // 优先从 Header 获取 API Key (统一使用 X-EXTRA-SECRET)，否则从 KV 获取
        let apiKey = request.headers.get('X-EXTRA-SECRET');
        if (!apiKey) {
            apiKey = await WORKER_IMGBED.get('NODESEEK_APIKEY');
        }
        if (!apiKey) {
            console.error('Missing Secret: NodeSeek API Key (KV: NODESEEK_APIKEY or Header: X-EXTRA-SECRET)');
            return new Response('Missing Secret: NodeSeek API Key (KV: NODESEEK_APIKEY or Header: X-EXTRA-SECRET)', { status: 500 });
        }

        // 解析表单数据
        const formData = await request.formData();
        const imageFile = formData.get('image');

        if (!imageFile) {
            return new Response('No image file found', { status: 400 });
        }

        // 构造上传到 NodeSeek 的表单
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageFile);

        // 发送请求
        const response = await fetch('https://api.nodeimage.com/api/upload', {
            method: 'POST',
            headers: {
                'X-API-Key': apiKey,
                // 注意：fetch 会自动设置 multipart/form-data 的 boundary，不要手动设置 Content-Type
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: uploadFormData
        });

        const responseText = await response.text();
        let result;

        try {
            result = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse NodeSeek response:', responseText);
            return new Response('Upstream Error: Invalid JSON response', { status: 502 });
        }

        if (response.ok) {
            // 尝试多种可能的字段获取 URL (根据常见的图床 API 结构)
            // NodeImage (Chevereto based?) 通常是 data.url 或 image.url
            const imageUrl = result.data?.url || result.url || result.image?.url;

            if (imageUrl) {
                return new Response(imageUrl, {
                    status: 200,
                    headers: { 'Content-Type': 'text/plain;charset=UTF-8' }
                });
            } else {
                console.error('NodeSeek upload success but no URL found:', result);
                return new Response(JSON.stringify(result), {
                    status: 502,
                    headers: { 'Content-Type': 'application/json;charset=UTF-8' }
                });
            }
        } else {
            console.error('NodeSeek upload failed:', result);
            return new Response(JSON.stringify(result), {
                status: response.status,
                headers: { 'Content-Type': 'application/json;charset=UTF-8' }
            });
        }

    } catch (error) {
        console.error('Error in handleNodeseekRequest:', error);
        return new Response(`Internal Error: ${error.message}`, { status: 500 });
    }
}
