addEventListener('fetch', event => {
    const request = event.request;
    if (request.method.toUpperCase() === "OPTIONS") {
      // 处理预检请求
      event.respondWith(handleOptions(request));
    } else {
      // 处理常规请求
      event.respondWith(handleRequest(request));
    }
  });
  
  // 处理常规请求
  async function handleRequest(request) {
    const url = new URL(request.url);
  
    let response;
    switch (url.pathname) {
      case '/upload/58img':
        response = await handle58imgRequest(request);
        break;
      case '/upload/tgphimg':
        response = await handleTgphimgRequest(request);
        break;
      default:
        response = new Response('Not Found', { status: 404 });
        break;
    }
  
    // 添加 CORS 头到响应中
    response.headers.set('Access-Control-Allow-Origin', '*');
    return response;
  }
  
  // 处理预检请求
  function handleOptions(request) {
    // 确保预检请求的访问控制请求头在允许的范围内
    let headers = request.headers;
    if (headers.get('Origin') !== null &&
        headers.get('Access-Control-Request-Method') !== null &&
        headers.get('Access-Control-Request-Headers') !== null) {
      // 处理 CORS 预检请求
      let respHeaders = new Headers({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': headers.get('Access-Control-Request-Headers'),
        'Access-Control-Max-Age': '86400', // 1 day
      });
  
      return new Response(null, { headers: respHeaders });
    } else {
      // 处理非预检请求
      return new Response(null, {
        headers: {
          'Allow': 'GET, POST, OPTIONS',
        },
      });
    }
  }


    // 此处省略了58img的处理逻辑，直接复制自 API_IMG_58img.js

    // 此处省略了tgphimg的处理逻辑，直接复制自 API_IMG_tgphimg.js

  
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
  