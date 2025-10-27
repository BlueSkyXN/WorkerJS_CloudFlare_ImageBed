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

    // 智能后缀处理
    let fileName = imageFile.name;
    const nameParts = fileName.split('.');
    const ext = nameParts.length > 1 ? nameParts.pop().toLowerCase() : '';
    const baseName = nameParts.join('.');

    // 已知支持的格式（不修改）
    const supportedFormats = ['jpg', 'jpeg', 'png', 'webp', 'mp4'];

    // 已知不支持的格式 -> 替换为 png
    const unsupportedFormats = ['heic', 'avif', 'heif'];

    if (unsupportedFormats.includes(ext)) {
      // 明确不支持的格式，替换为 png
      fileName = `${baseName}.png`;
      console.log(`Format ${ext} not supported, renamed to: ${fileName}`);
    }
    // 已知支持的格式和其他未知格式，保持不变（由 403 重试机制处理）

    // 读取文件数据
    const imageData = await imageFile.arrayBuffer();

    // 上传函数（支持重试）
    const uploadToServer = async (name) => {
      const uploadUrl = `https://www.dlink666.com/api/upload?name=${encodeURIComponent(name)}`;
      return await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        },
        body: imageData,
      });
    };

    // 首次上传尝试
    let response = await uploadToServer(fileName);

    // 如果返回 403，自动更换后缀重试
    if (response.status === 403) {
      console.log(`Upload with ${fileName} got 403, retrying with fallback extension...`);

      // 判断文件类型，选择回退后缀
      const isImageType = imageFile.type && imageFile.type.startsWith('image/');
      const fallbackExt = isImageType ? 'png' : 'mp4';
      const fallbackName = `${baseName}.${fallbackExt}`;

      console.log(`Retrying with: ${fallbackName}`);
      response = await uploadToServer(fallbackName);
    }

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
