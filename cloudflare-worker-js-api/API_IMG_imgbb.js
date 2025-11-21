// ImgBB 图床 API 接口
async function handleImgbbRequest(request) {
    console.log('ImgBB Request received:', request.url);

    // 只允许 POST 请求
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    // 验证请求内容类型
    if (!request.headers.get('Content-Type')?.includes('multipart/form-data')) {
        return new Response('Invalid content type', { status: 400 });
    }

    try {
        // 解析表单数据
        const formData = await request.formData();
        const file = formData.get('image');

        if (!file) {
            return new Response('No file uploaded', { status: 400 });
        }

        console.log(`File received: ${file.name}, size: ${file.size}, type: ${file.type}`);

        // 构建发送到 ImgBB 的表单数据
        const imgbbFormData = new FormData();
        imgbbFormData.append('source', file, file.name);
        imgbbFormData.append('type', 'file');
        imgbbFormData.append('action', 'upload');

        // 发送请求到 ImgBB
        const response = await fetch('https://zh-cn.imgbb.com/json', {
            method: 'POST',
            body: imgbbFormData,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                'Referer': 'https://zh-cn.imgbb.com/',
                'Origin': 'https://zh-cn.imgbb.com'
            }
        });

        if (!response.ok) {
            console.error(`ImgBB API error: ${response.status} ${response.statusText}`);
            const errorBody = await response.text();
            return new Response(errorBody, { status: response.status });
        }

        // 解析响应
        const result = await response.json();
        console.log('ImgBB response:', JSON.stringify(result, null, 2));

        // 检查上传是否成功
        if (result.status_code === 200 && result.success && result.image && result.image.url) {
            const imageUrl = result.image.url;
            console.log(`Upload successful: ${imageUrl}`);

            // 返回图片URL（纯文本格式，符合项目规范）
            return new Response(imageUrl, {
                status: 200,
                headers: {
                    'Content-Type': 'text/plain',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        } else {
            console.error('ImgBB upload failed:', result);
            return new Response(JSON.stringify(result), { status: 500 });
        }

    } catch (error) {
        console.error('Error in handleImgbbRequest:', error);
        return new Response(`Internal server error: ${error.message}`, { status: 500 });
    }
}