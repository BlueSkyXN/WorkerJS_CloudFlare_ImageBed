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
  // 从环境变量中获取API密码（作为Token使用）
  const apiToken = API_PASSWORD; // Cloudflare Worker中直接使用环境变量名

  // 如果API_TOKEN存在且非空，则进行Token验证
  if (apiToken) {
    // 获取请求头中的Authorization字段
    const authHeader = request.headers.get('Authorization');
    
    // 检查Authorization头是否存在且格式正确
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 提取Token并验证
    const token = authHeader.split(' ')[1];
    if (token !== apiToken) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const url = new URL(request.url);

  let response;
  switch (url.pathname) {
    case '/upload/58img':
      response = await handle58imgRequest(request);
      break;
    case '/upload/aagmoe':
      response = await handleaagmoeRequest(request);
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

  addEventListener('fetch', event => {
    event.respondWith(handleaagmoeRequest(event.request));
  })
  
  async function handleaagmoeRequest(request) {
    try {
      // 确认请求方法为 POST 并且内容类型正确
      if (request.method !== 'POST' || !request.headers.get('Content-Type').includes('multipart/form-data')) {
        return new Response('Invalid request', { status: 400 });
      }
  
      // 解析表单数据
      const formData = await request.formData();
      const imageFile = formData.get('image'); // 假设字段名为 'image'
      if (!imageFile) return new Response('Image file not found', { status: 400 });
  
      // ihs.aag.moe 的上传接口
      const targetUrl = 'https://ihs.aag.moe/upload.php';
  
      // 为了与 ihs.aag.moe 接口兼容，我们保留表单数据的格式并直接转发
      const response = await fetch(targetUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7',
          'Cache-Control': 'no-cache',
          'Content-Type': request.headers.get('Content-Type'),
          'Origin': 'https://ihs.aag.moe',
          'Pragma': 'no-cache',
          'Referer': 'https://ihs.aag.moe/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Sec-CH-UA': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          'Sec-CH-UA-Mobile': '?0',
          'Sec-CH-UA-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'DNT': '1'
        }
      });
  
      // 处理响应
      if (response.ok) {
        const result = await response.json();
        if (result && result.success && result.file_url) {
          return new Response(result.file_url, { status: 200 });
        } else {
          return new Response('Error: Unexpected response format or upload failed', { status: 500 });
        }
      } else {
        return new Response('Error: ' + await response.text(), { status: response.status });
      }
    } catch (error) {
      console.error('Caught an error:', error);
      return new Response('Server Error', { status: 500 });
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
  