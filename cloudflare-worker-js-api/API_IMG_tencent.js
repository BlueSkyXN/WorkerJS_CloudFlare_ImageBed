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
