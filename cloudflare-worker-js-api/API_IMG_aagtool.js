addEventListener('fetch', event => {
  event.respondWith(handleaagtoolRequest(event.request));
})

async function handleaagtoolRequest(request) {
  // 确认请求方法为 POST 并且内容类型正确
  if (request.method !== 'POST' || !request.headers.get('Content-Type').includes('multipart/form-data')) {
    return new Response('Invalid request', { status: 400 });
  }

  // 解析表单数据
  const formData = await request.formData();
  const imageFile = formData.get('file'); // 假设字段名为 'file'
  if (!imageFile) return new Response('Image file not found', { status: 400 });

  // www.aagtool.top 的上传接口
  const targetUrl = 'https://www.aagtool.top/upload.php';

  // 为了与 www.aagtool.top 接口兼容，我们保留表单数据的格式并直接转发
  const response = await fetch(targetUrl, {
    method: 'POST',
    body: formData,
    headers: {
      // 可以添加必要的自定义头部，如果www.aagtool.top需要特定的头部信息
      'Accept': 'application/json',
      'Origin': 'https://www.aagtool.top'
    }
  });

  // 处理响应
  if (response.ok) {
    const result = await response.json();
    if (result && result.success && result.file_url) {
      // 直接返回图片 URL 而不是 JSON 对象
      return new Response(result.file_url, { status: 200 });
    } else {
      return new Response('Error: Unexpected response format or upload failed', { status: 500 });
    }
  } else {
    return new Response('Error: ' + await response.text(), { status: response.status });
  }
}
