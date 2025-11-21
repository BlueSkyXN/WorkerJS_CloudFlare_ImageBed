addEventListener('fetch', event => {
  event.respondWith(handleTgphimgRequest(event.request));
})

/* 
  接口来自 TGPH的原通道，后来在TG老板被抓后取消
*/

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
  const targetUrl = 'https://telegra.ph/upload?source=bugtracker';

  // 为了与 Telegra.ph 接口兼容，我们保留表单数据的格式并直接转发
  const response = await fetch(targetUrl, {
    method: 'POST',
    body: formData
  });

  // 处理响应
  if (!response.ok) {
    return new Response('Error: ' + await response.text(), { status: response.status });
  }

  const rawBody = await response.text();
  let result;
  try {
    result = JSON.parse(rawBody);
  } catch (error) {
    console.error('Failed to parse TGPH response:', rawBody);
    return new Response(rawBody, {
      status: 500,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    });
  }

  const src = Array.isArray(result)
    ? result[0]?.src
    : result?.src || result?.[0]?.src;

  if (!src) {
    console.error('TGPH upload succeeded but no src found:', result);
    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    });
  }

  const normalizedSrc = src.replace(/\\/g, '');
  const imageUrl = `https://telegra.ph${normalizedSrc.startsWith('/') ? normalizedSrc : `/${normalizedSrc}`}`;

  return new Response(imageUrl, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
