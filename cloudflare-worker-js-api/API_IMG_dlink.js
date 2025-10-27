addEventListener('fetch', event => {
  event.respondWith(handleDlinkRequest(event.request))
})

/*
  DLink 图床接口
  前端使用 POST 方法上传 multipart/form-data
  后端转换为 PUT 方法上传图片二进制数据到 DLink API
*/

async function handleDlinkRequest(request) {
  // 确认请求方法为 POST 并且内容类型正确
  if (request.method !== 'POST' || !request.headers.get('Content-Type').includes('multipart/form-data')) {
    return new Response('Invalid request', { status: 400 });
  }

  try {
    // 解析表单数据
    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!imageFile) {
      return new Response('No file uploaded', { status: 400 });
    }

    console.log(`File received: ${imageFile.name}, size: ${imageFile.size}, type: ${imageFile.type}`);

    // 使用上传的文件名
    const fileName = imageFile.name;

    // 读取文件数据
    const imageData = await imageFile.arrayBuffer();

    // 目标上传 URL
    const uploadUrl = `https://www.dlink666.com/api/upload?name=${encodeURIComponent(fileName)}`;

    // 发送 PUT 请求到 DLink 上传接口
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
      },
      body: imageData,
    });

    // 处理响应
    if (response.ok) {
      const imageUrl = await response.text();
      console.log(`Upload successful: ${imageUrl}`);

      // 返回纯文本格式的图片 URL
      return new Response(imageUrl, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else {
      const errorText = await response.text();
      console.error(`Upload failed: ${response.status}, ${errorText}`);
      return new Response(`Upload failed: ${response.status}`, { status: response.status });
    }

  } catch (error) {
    console.error('Error in handleDlinkRequest:', error);
    return new Response(`Internal server error: ${error.message}`, { status: 500 });
  }
}
