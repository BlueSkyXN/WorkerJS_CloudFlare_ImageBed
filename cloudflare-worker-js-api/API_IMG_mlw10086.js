addEventListener('fetch', event => {
  event.respondWith(handle10086Request(event.request));
})


/* 
  示例格式 https://g.gtimg.cn/music/photo_new/T053XD001002t28e44Qc1ka.jpg
  兼容 https://qqq.gtimg.cn/music/photo_new/T053XD001002t28e44Qc1ka.jpg
  兼容 https://os.i.gtimg.cn/music/photo_new/T053XD001002t28e44Qc1ka.jpg
  兼容 https://vac.gtimg.cn/music/photo_new/T053XD001002t28e44Qc1ka.jpg
  兼容 https://offline.gtimg.cn/music/photo_new/T053XD001002t28e44Qc1ka.jpg
  似乎屏蔽了CF的IP或者其他原因
*/

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