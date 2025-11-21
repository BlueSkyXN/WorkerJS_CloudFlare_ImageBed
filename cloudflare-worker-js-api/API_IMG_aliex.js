export default {
  async fetch(request, env) {
    return handleAliExpressRequest(request, env);
  }
};

/* 
  参考了即刻图床开源的阿里接口 https://jike.info/topic/36748
  需要使用美国等地访问 https://www.aliexpress.com/ 并使用第三方直接注册和登录，比如谷歌，如果访问地异常则不会出现第三方登录
  该模块需要阿里国际账号，虽然不需要实名、可以随便注册但需要Cookie。有效期不清楚，有点像一个月。
  这个试验我放在了KV库理论上也可以用D1库，不用Env直接装载是因为Cookie有点长，大概3KB，而Env最大就5KB好像（对于免费用户）
  你需要创建和绑定名为 WORKER_IMGBED 的库，其中新建 K 字段，名为 ali_express_cookie 然后在V中复制进去浏览器F12得到的完整Cookie即可
  返回图片示例为 https://ae01.alicdn.com/kf 的域名
*/

async function handleAliExpressRequest(request) {
  try {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', {
        status: 405,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const formData = await request.formData();
    const imageFile = formData.get('image');
    if (!imageFile) {
      return new Response('No image file found in the request', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 从 KV 中获取 Cookie
    // 优先从 Header 获取 (统一使用 X-EXTRA-SECRET)，否则从 KV 获取
    let cookie = request.headers.get('X-EXTRA-SECRET');
    if (!cookie) {
      cookie = await WORKER_IMGBED.get('ali_express_cookie');
    }
    if (!cookie) {
      console.error('Missing required cookie in KV storage');
      return new Response('Missing required cookie in KV storage', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    console.log(`Retrieved Cookie from KV: ${cookie}`);

    // 构建上传表单数据
    const uploadFormData = new FormData();
    uploadFormData.append('file', imageFile, imageFile.name);
    uploadFormData.append('bizCode', 'ae_profile_avatar_upload');

    const uploadUrl = 'https://filebroker.aliexpress.com/x/upload?jiketuchuang=1';

    // 发送 POST 请求到 AliExpress API
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: uploadFormData,
      headers: {
        'Origin': 'https://filebroker.aliexpress.com',
        'Cookie': cookie, // 使用 KV 中的 Cookie
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Upload failed: Status ${response.status}, Body: ${errorText}`);
      return new Response(`Upload failed: HTTP error! Status: ${response.status}`, {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const resultText = await response.text();
    let result;
    try {
      result = JSON.parse(resultText);
    } catch (parseError) {
      console.error(`Error parsing response: ${parseError.message}, Response Text: ${resultText}`);
      return new Response(`Upload failed: Error parsing response - ${parseError.message}`, {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    if (result.url) {
      console.log(`Upload successful: ${result.url}`);
      return new Response(result.url, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } else {
      console.error(`Upload failed: No URL returned, Response: ${resultText}`);
      return new Response('Upload failed: No URL returned', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (error) {
    console.error(`Error in handleAliExpressRequest: ${error.stack}`);
    return new Response(`Upload failed: ${error.message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

