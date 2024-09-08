addEventListener('fetch', event => {
  event.respondWith(handleVviptuangouRequest(event.request));
});

async function handleVviptuangouRequest(request) {
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

    const targetUrl = 'https://api.vviptuangou.com/api/upload';

    const response = await fetch(targetUrl, {
      method: 'POST',
      body: newFormData,
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7',
        'Branchid': '1002',
        'Cache-Control': 'no-cache',
        'DNT': '1',
        'Origin': 'https://mlw10086.serv00.net',
        'Pragma': 'no-cache',
        'Priority': 'u=1, i',
        'Referer': 'https://mlw10086.serv00.net/',
        'Sec-Ch-Ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'Sign': 'e346dedcb06bace9cd7ccc6688dd7ca1', // 替换为动态生成的sign值
        'Source': 'h5',
        'Tenantid': '3',
        'Timestamp': '1725792862411', // 替换为动态生成的timestamp值
        'Token': 'b3bc3a220db6317d4a08284c6119d136', // 请替换成有效的 token
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
      }
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);

    try {
      const jsonResponse = JSON.parse(responseText);
      if (jsonResponse.status === 1 && jsonResponse.imgurl) {
        // 根据 imgurl 构建正确的图片链接
        const correctImageUrl = `https://assets.vviptuangou.com/${jsonResponse.imgurl}`;
        return new Response(correctImageUrl, {
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
