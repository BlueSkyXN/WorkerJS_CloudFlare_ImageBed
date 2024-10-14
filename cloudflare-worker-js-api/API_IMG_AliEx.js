export default {
  async fetch(request, env) {
    return handleAliExpressRequest(request, env);
  }
};

async function handleAliExpressRequest(request, env) {
  try {
    // 确保请求方法为 POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // 解析 multipart/form-data
    const formData = await request.formData();
    const imageFile = formData.get('image'); // 假设前端发送的字段名是 'image'
    if (!imageFile) {
      return new Response('No image file found in the request', { status: 400 });
    }

    // 从 Cloudflare KV 中读取 Cookie
    const cookie = await env.WORKER_IMGBED.get('ali_express_cookie');
    if (!cookie) {
      return new Response('Missing required cookie in KV storage', { status: 500 });
    }

    // 准备发送到 AliExpress 的 FormData
    const uploadFormData = new FormData();
    uploadFormData.append('file', imageFile, imageFile.name);
    uploadFormData.append('bizCode', 'ae_profile_avatar_upload');

    // AliExpress 的上传 URL
    const uploadUrl = 'https://filebroker.aliexpress.com/x/upload?jiketuchuang=1';

    // 发送请求到 AliExpress 接口
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: uploadFormData,
      headers: {
        'Origin': 'https://filebroker.aliexpress.com',
        'Cookie': cookie
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.url) {
      // 如果成功，返回图片 URL
      return new Response(result.url, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    } else {
      // 如果没有返回 URL，则可能上传失败
      return new Response('Upload failed: No URL returned', { status: 500 });
    }
  } catch (error) {
    console.error('Error in handleAliExpressRequest:', error);
    return new Response(`Upload failed: ${error.message}`, { status: 500 });
  }
}

// KV 命名空间设计
// 在 Cloudflare 中创建一个名为 "WORKER_IMGBED" 的 KV 命名空间，用于存储不同接口所需的 Cookie。
// 使用 "WORKER_IMGBED" 的键 "ali_express_cookie" 来存储具体的 AliExpress Cookie 字符串。

// 例如，在 wrangler.toml 文件中添加：
// [[kv_namespaces]]
// binding = "WORKER_IMGBED"
// id = "<your_kv_namespace_id>"