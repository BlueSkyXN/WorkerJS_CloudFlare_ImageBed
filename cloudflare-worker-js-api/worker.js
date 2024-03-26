addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
  })
  
  async function handleRequest(request) {
    const url = new URL(request.url);
    
    // 根据请求路径调用相应的处理函数
    switch (url.pathname) {
      case '/upload/58img':
        return handle58imgRequest(request);
      case '/upload/tgphimg':
        return handleTgphimgRequest(request);
      default:
        return new Response('Not Found', { status: 404 });
    }
  }
  
  async function handle58imgRequest(request) {
    // 确认请求方法为 POST 并且内容类型正确
    if (request.method !== 'POST' || !request.headers.get('Content-Type').includes('multipart/form-data')) {
      return new Response('Invalid request', { status: 400 });
    }
      // 解析表单数据
      const formData = await request.formData();
      const imageFile = formData.get('image'); // 假设字段名为 'image'
      if (!imageFile) return new Response('Image file not found', { status: 400 });
    
      // 将文件数据转换为 ArrayBuffer
      const arrayBuffer = await imageFile.arrayBuffer();
    
      // 将 ArrayBuffer 转换为 Base64
      const base64EncodedData = bufferToBase64(arrayBuffer);
    
      // 构建请求负载
      const payload = {
        "Pic-Size": "0*0",
        "Pic-Encoding": "base64",
        "Pic-Path": "/nowater/webim/big/",
        "Pic-Data": base64EncodedData
      };
    
      // 目标URL
      const targetUrl = "https://upload.58cdn.com.cn/json/nowater/webim/big/";
    
      // 发送POST请求
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    
      // 处理响应
      if (response.ok) {
        const result = await response.text();
        // 随机生成1到8之间的数字
        const random_number = Math.floor(Math.random() * 8) + 1;
        const finalUrl = `https://pic${random_number}.58cdn.com.cn/nowater/webim/big/${result}`;
        return new Response(finalUrl);
      } else {
        return new Response("Error: " + await response.text(), { status: response.status });
      }
    
  }
  
  async function handleTgphimgRequest(request) {
    // 确认请求方法为 POST 并且内容类型正确
    if (request.method !== 'POST' || !request.headers.get('Content-Type').includes('multipart/form-data')) {
      return new Response('Invalid request', { status: 400 });
    }
    // 解析表单数据
    const formData = await request.formData();
    const imageFile = formData.get('image'); // 假设字段名为 'image'
    if (!imageFile) return new Response('Image file not found', { status: 400 });
  
    // Telegra.ph 的上传接口
    const targetUrl = 'https://telegra.ph/upload';
  
    // 为了与 Telegra.ph 接口兼容，我们保留表单数据的格式并直接转发
    const response = await fetch(targetUrl, {
      method: 'POST',
      body: formData
    });
  
    // 处理响应
    if (response.ok) {
      const result = await response.json();
      if (result && result[0] && result[0].src) {
        const imageUrl = `https://telegra.ph${result[0].src}`;
        // 直接返回图片 URL 而不是 JSON 对象
        return new Response(imageUrl);
      } else {
        return new Response('Error: Unexpected response format', { status: 500 });
      }
    } else {
      return new Response('Error: ' + await response.text(), { status: response.status });
    }
  }
  
  // 复制自 API_IMG_58img.js 的辅助函数
  function bufferToBase64(buf) {
    var binary = '';
    var bytes = new Uint8Array(buf);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    // 使用 btoa 进行 Base64 编码
    return btoa(binary);
  }
  