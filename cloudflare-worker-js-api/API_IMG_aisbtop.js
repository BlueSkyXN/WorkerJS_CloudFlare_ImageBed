addEventListener('fetch', event => {
    event.respondWith(handleaisbtopRequest(event.request));
  })
  
  async function handleaisbtopRequest(request) {
    if (request.method !== 'POST' || !request.headers.get('Content-Type').includes('multipart/form-data')) {
      return new Response('Invalid request', { status: 400 });
    }
  
    const formData = await request.formData();
    const imageFile = formData.get('image');
    if (!imageFile) return new Response('Image file not found', { status: 400 });
  
    const buffer = await imageFile.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  
    const body = JSON.stringify({ src: base64Image });
    const headers = {
      "Accept": "*/*",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7",
      "Authorization": AISBTOP_TOKEN, // 从环境变量中读取
      "Cache-Control": "no-cache",
      "Content-Type": "application/json",
      "DNT": "1",
      "Origin": "https://aisb.top",
      "Pragma": "no-cache",
      "Referer": "https://aisb.top/",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "sec-ch-ua": "\"Google Chrome\";v=\"123\", \"Not:A-Brand\";v=\"8\", \"Chromium\";v=\"123\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
    };
  
    const response = await fetch("https://aisb.top/api/upload", {
      method: 'POST',
      body: body,
      headers: headers
    });
  
    if (response.ok) {
      const result = await response.json();
      if (result && result.url) {
        return new Response(result.url);
      } else {
        return new Response('Error: Unexpected response format', { status: 500 });
      }
    } else {
      return new Response('Error: ' + await response.text(), { status: response.status });
    }
  }
  