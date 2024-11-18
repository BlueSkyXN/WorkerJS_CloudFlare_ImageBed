/*  
  参考了即刻图床开源的 https://jiketuchuang.com/ 的 2024年11月17日：新增UCS免登录接口
  模仿上述接口，实现与 UCloud 图片上传接口的集成
*/

async function handleUCloudRequest(request) {
    console.log('Request received for UCloud upload:', request.url);

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        // 解析请求中的表单数据
        const formData = await request.formData();
        const file = formData.get('image'); // 前端上传的字段名为 'image'

        if (!file) {
            return new Response('No file uploaded', { status: 400 });
        }

        // 生成 UUID 随机文件名，保留原始扩展名
        const originalFilename = file.name;
        const extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
        const newFilename = `${crypto.randomUUID()}${extension}`;

        // 创建新的 FormData，用于发送到 UCloud 接口
        const newFormData = new FormData();
        newFormData.append('file', file, newFilename); // UCloud 接口要求字段名为 'file'

        // 设置 UCloud 接口所需的头部信息
        const targetHeaders = {
            'Accept': 'application/json',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7',
            'Authorization': 'UCloud TOKEN_12134567890', // 替换为你的实际令牌
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Priority': 'u=1, i',
            'Sec-CH-UA': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            'Sec-CH-UA-Mobile': '?0',
            'Sec-CH-UA-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'none',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest',
        };

        // UCloud 上传接口的 URL
        const targetUrl = 'https://spt.ucloud.cn/im/client/upload';

        // 发送请求到 UCloud 上传接口
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: targetHeaders,
            body: newFormData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Upload failed: Status ${response.status}, Body: ${errorText}`);
            return new Response(`Upload failed: ${errorText}`, { status: response.status });
        }

        // 解析 UCloud 接口的响应
        const responseData = await response.json();
        console.log('Response from UCloud API:', responseData);

        // 检查 RetCode
        if (responseData.RetCode !== 1) {
            const message = responseData.Message || '未知错误';
            console.error(`Upload failed, RetCode: ${responseData.RetCode}, Message: ${message}`);
            return new Response(`Upload failed, RetCode: ${responseData.RetCode}, Message: ${message}`, { status: 500 });
        }

        // 从响应中提取文件名
        const filesList = responseData.Files;
        if (!filesList || filesList.length === 0) {
            console.error('No files returned in response:', responseData);
            return new Response('Upload succeeded but no files returned', { status: 500 });
        }

        const uploadedFilename = filesList[0];
        const encodedFilename = encodeURIComponent(uploadedFilename);

        // 构建完整的文件 URL
        const fileUrl = `https://uchat.cn-bj.ufileos.com/${encodedFilename}`;

        // 成功，返回图片 URL
        return new Response(fileUrl, {
            status: 200,
            headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*' // 根据需要调整 CORS 策略
            }
        });
    } catch (error) {
        console.error('Error in handleUCloudRequest:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
