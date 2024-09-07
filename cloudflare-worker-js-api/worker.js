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
    case '/upload/10086':
      response = await  handle10086Request(request);
      break;
    case '/upload/tencent':
      response = await  handleTencentRequest(request);
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
  
      // 创建新的 FormData 对象，并将 'image' 字段重命名为 'file'
      const newFormData = new FormData();
      newFormData.append('file', imageFile); // 使用目标接口的字段名 'file'
  
      // ihs.aag.moe 的上传接口
      const targetUrl = 'https://ihs.aag.moe/upload.php';
  
      // 为了与 ihs.aag.moe 接口兼容，我们保留表单数据的格式并直接转发
      const response = await fetch(targetUrl, {
        method: 'POST',
        body: newFormData, // 使用新的 FormData 对象
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7',
          'Cache-Control': 'no-cache',
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

  async function handle10086Request(request) {
    console.log('Request received:', request.url);
  
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
  
    try {
      const formData = await request.formData();
      const file = formData.get('image'); // 使用 'image' 字段名
      if (!file) {
        return new Response('No file uploaded', { status: 400 });
      }
  
      const newFormData = new FormData();
      newFormData.append('file', file, file.name); // 上传到目标服务器时使用 'file'
  
      const targetUrl = 'https://mlw10086.serv00.net/upload.php';
  
      const response = await fetch(targetUrl, {
        method: 'POST',
        body: newFormData,
        headers: {
          'Accept': '*/*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7',
          'Cache-Control': 'no-cache',
          'DNT': '1',
          'Origin': 'https://mlw10086.serv00.net',
          'Pragma': 'no-cache',
          'Referer': 'https://mlw10086.serv00.net/',
          'Sec-Ch-Ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
        }
      });
  
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response body:', responseText);
  
      try {
        const jsonResponse = JSON.parse(responseText);
        if (jsonResponse.code === 200 && jsonResponse.url) {
          return new Response(jsonResponse.url, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      } catch (e) {
        console.error('Failed to parse JSON:', e);
      }
  
      return new Response(responseText, {
        status: response.status,
        headers: response.headers
      });
    } catch (error) {
      console.error('Error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  async function handleTencentRequest(request) {
    try {
      // 确保请求方法为 POST
      if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
      }
  
      // 解析multipart/form-data
      const formData = await request.formData();
      const imageFile = formData.get('image'); // 假设前端发送的字段名是 'image'
      if (!imageFile) {
        return new Response('No image file found in the request', { status: 400 });
      }
  
      // 准备发送到腾讯接口的FormData
      const uploadFormData = new FormData();
      uploadFormData.append('media', imageFile, imageFile.name);
  
      // 腾讯的上传URL
      const uploadUrl = "https://openai.weixin.qq.com/weixinh5/webapp/h774yvzC2xlB4bIgGfX2stc4kvC85J/cos/upload";
  
      // 发送请求到腾讯接口
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: uploadFormData
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
  
      if (result.url) {
        // 如果成功，返回图片URL
        return new Response(result.url, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      } else {
        // 如果没有返回URL，则可能上传失败
        return new Response('Upload failed: No URL returned', { status: 500 });
      }
  
    } catch (error) {
      console.error('Error in handleTencentRequest:', error);
      return new Response(`Upload failed: ${error.message}`, { status: 500 });
    }
  }
  