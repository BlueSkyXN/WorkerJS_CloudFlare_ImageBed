addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
})

async function handleRequest(request) {
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
