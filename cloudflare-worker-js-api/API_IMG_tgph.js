addEventListener('fetch', event => {
  event.respondWith(handleTgphimgRequest(event.request));
});

/* 
  接口来自 TGPH的Debug通道，随时可能取消，图片可能也没掉
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

  // 修改字段名为 'file'，以适应 Telegra.ph 的接口
  formData.append('file', imageFile);
  formData.delete('image'); // 删除原来的 'image' 字段

  // Telegra.ph 的上传接口
  const targetUrl = 'https://telegra.ph/upload?source=bugtracker';

  // 发送修改后的表单数据
  const response = await fetch(targetUrl, {
    method: 'POST',
    body: formData
  });

  // 处理响应
  if (response.ok) {
    const result = await response.json();
    if (result && result.src) {
      // 提取 src 并拼接成完整的 URL
      const imageUrl = `https://telegra.ph${result.src.replace(/\\/g, '')}`; // 处理反斜杠
      return new Response(imageUrl);
    } else {
      return new Response('Error: Unexpected response format', { status: 500 });
    }
  } else {
    return new Response('Error: ' + await response.text(), { status: response.status });
  }
}
