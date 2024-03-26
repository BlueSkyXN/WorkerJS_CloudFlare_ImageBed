addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
  })
  
  async function handleRequest(request) {
    const url = new URL(request.url);
    
    // 根据请求路径调用相应的处理函数
    switch (url.pathname) {
      case '/upload/API_IMG_58img':
        return handle58imgRequest(request);
      case '/upload/API_IMG_tgphimg':
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
    // 此处省略了58img的处理逻辑，直接复制自 API_IMG_58img.js
  }
  
  async function handleTgphimgRequest(request) {
    // 确认请求方法为 POST 并且内容类型正确
    if (request.method !== 'POST' || !request.headers.get('Content-Type').includes('multipart/form-data')) {
      return new Response('Invalid request', { status: 400 });
    }
    // 此处省略了tgphimg的处理逻辑，直接复制自 API_IMG_tgphimg.js
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
  