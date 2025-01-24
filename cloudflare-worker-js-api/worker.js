addEventListener('fetch', event => {
  const request = event.request;
  if (request.method.toUpperCase() === "OPTIONS") {
    // 处理预检请求
    event.respondWith(handleOptions(request));
  } else {
    // 处理常规请求
    event.respondWith(handleRequest(request));
  }
});

// 处理常规请求
async function handleRequest(request) {
  // 从环境变量中获取API密码（作为Token使用）
  const apiToken = API_PASSWORD; // Cloudflare Worker中直接使用环境变量名

  // 如果API_TOKEN存在且非空，则进行Token验证
  if (apiToken) {
    // 获取请求头中的Authorization字段
    const authHeader = request.headers.get('Authorization');
    
    // 检查Authorization头是否存在且格式正确
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 提取Token并验证
    const token = authHeader.split(' ')[1];
    if (token !== apiToken) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const url = new URL(request.url);

  let response;
  switch (url.pathname) {
    case '/upload/58img':
      response = await handle58imgRequest(request);
      break;
    case '/upload/ipfs':
      response = await  handleimg2ipfsRequest(request);
      break;
    case '/upload/tgphimg':
      response = await  handleTgphimgRequest(request);
      break;
    case '/upload/aliex':
      response = await  handleAliExpressRequest(request);
      break;
    case '/upload/ucloud':
      response = await  handleUCloudRequest(request);
      break;
    case '/upload/3001':
      response = await  handle3001Request(request);
      break;
    case '/upload/s3ipfs':
      response = await  handles3filebaseRequest(request);
      break;
    default:
      response = new Response('Not Found', { status: 404 });
      break;
  }

  // 添加 CORS 头到响应中
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}
  
  // 处理预检请求
  function handleOptions(request) {
    // 确保预检请求的访问控制请求头在允许的范围内
    let headers = request.headers;
    if (headers.get('Origin') !== null &&
        headers.get('Access-Control-Request-Method') !== null &&
        headers.get('Access-Control-Request-Headers') !== null) {
      // 处理 CORS 预检请求
      let respHeaders = new Headers({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': headers.get('Access-Control-Request-Headers'),
        'Access-Control-Max-Age': '86400', // 1 day
      });
  
      return new Response(null, { headers: respHeaders });
    } else {
      // 处理非预检请求
      return new Response(null, {
        headers: {
          'Allow': 'GET, POST, OPTIONS',
        },
      });
    }
  }

  async function handle58imgRequest(request) {
    // 确认请求方法为 POST 并且内容类型正确
    if (request.method !== 'POST' || !request.headers.get('Content-Type').includes('multipart/form-data')) {
      return new Response('Invalid request', { status: 400 });
    }
  
    // 解析表单数据
    const formData = await request.formData();
    const imageFile = formData.get('image'); // 假设字段名为 'image'
    if (!imageFile) return new Response('Image file not found', { status: 400 });
  
    // 将文件数据转换为 ArrayBuffer
    const arrayBuffer = await imageFile.arrayBuffer();
  
    // 将 ArrayBuffer 转换为 Base64
    const base64EncodedData = bufferToBase64(arrayBuffer);
  
    // 构建请求负载
    const payload = {
      "Pic-Size": "0*0",
      "Pic-Encoding": "base64",
      "Pic-Path": "/nowater/webim/big/",
      "Pic-Data": base64EncodedData
    };
  
    // 目标URL
    const targetUrl = "https://upload.58cdn.com.cn/json/nowater/webim/big/";
  
    // 发送POST请求
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  
    // 处理响应
    if (response.ok) {
      const result = await response.text();
      // 随机生成1到8之间的数字
      const random_number = Math.floor(Math.random() * 8) + 1;
      const finalUrl = `https://pic${random_number}.58cdn.com.cn/nowater/webim/big/${result}`;
      return new Response(finalUrl);
    } else {
      return new Response("Error: " + await response.text(), { status: response.status });
    }
  }

  // 复制自 API_IMG_58img.js 的辅助函数
  function bufferToBase64(buf) {
    var binary = '';
    var bytes = new Uint8Array(buf);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    // 使用 btoa 进行 Base64 编码
    return btoa(binary);
  } 
  
  async function handleimg2ipfsRequest(request) {
    console.log('Request received:', request.url);
  
    // 只允许 POST 请求
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
  
    try {
      // 解析表单数据
      const formData = await request.formData();
      const file = formData.get('image'); // 使用 'image' 字段名
      if (!file) {
        return new Response('No file uploaded', { status: 400 });
      }
  
      // 准备新的 FormData 发送到 IPFS 网关
      const newFormData = new FormData();
      newFormData.append('file', file, file.name);
  
      // IPFS 网关上传 URL
      const ipfsUrl = 'https://api.img2ipfs.org/api/v0/add?pin=false';
  
      // 使用 fetch API 发送文件到 IPFS 网关
      const response = await fetch(ipfsUrl, {
        method: 'POST',
        body: newFormData,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
        }
      });
  
      // 检查请求状态
      if (response.ok) {
        const result = await response.json();
        console.log("上传成功！");
  
        // 从返回结果中提取哈希值和文件名
        const fileName = result.Name;
        const fileHash = result.Hash;
        const fileSize = result.Size;
        
        console.log(`文件名: ${fileName}`);
        console.log(`哈希值: ${fileHash}`);
        console.log(`大小: ${fileSize} 字节`);
  
        // 构建图片访问链接
        //const accessUrl = `https://cdn.img2ipfs.com/ipfs/${fileHash}?filename=${fileName}`;
        const accessUrl = `https://i0.wp.com/i0.img2ipfs.com/ipfs/${fileHash}`;
        console.log(`图片访问链接: ${accessUrl}`);
  
        // 返回成功的链接
        return new Response(accessUrl, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      } else {
        console.error(`上传失败，状态码: ${response.status}`);
        return new Response(`Upload failed with status: ${response.status}`, { status: response.status });
      }
    } catch (error) {
      console.error('Error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
  

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
      const cookie = await WORKER_IMGBED.get('ali_express_cookie');
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

  async function handleUCloudRequest(request) {
  console.log('Request received for UCloud upload:', request.url);

  if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
  }

  try {
      // 解析请求中的表单数据
      const formData = await request.formData();
      const file = formData.get('image'); // 前端上传的字段名为 'image'

      if (!file) {
          return new Response('No file uploaded', { status: 400 });
      }

      // 生成 UUID 随机文件名，保留原始扩展名
      const originalFilename = file.name;
      const extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
      const newFilename = `${crypto.randomUUID()}${extension}`;

      // 创建新的 FormData，用于发送到 UCloud 接口
      const newFormData = new FormData();
      newFormData.append('file', file, newFilename); // UCloud 接口要求字段名为 'file'

      // 设置 UCloud 接口所需的头部信息
      const targetHeaders = {
          'Accept': 'application/json',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7',
          'Authorization': 'UCloud TOKEN_12134567890', // 替换为你的实际令牌
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Priority': 'u=1, i',
          'Sec-CH-UA': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          'Sec-CH-UA-Mobile': '?0',
          'Sec-CH-UA-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'none',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'X-Requested-With': 'XMLHttpRequest',
      };

      // UCloud 上传接口的 URL
      const targetUrl = 'https://spt.ucloud.cn/im/client/upload';

      // 发送请求到 UCloud 上传接口
      const response = await fetch(targetUrl, {
          method: 'POST',
          headers: targetHeaders,
          body: newFormData
      });

      if (!response.ok) {
          const errorText = await response.text();
          console.error(`Upload failed: Status ${response.status}, Body: ${errorText}`);
          return new Response(`Upload failed: ${errorText}`, { status: response.status });
      }

      // 解析 UCloud 接口的响应
      const responseData = await response.json();
      console.log('Response from UCloud API:', responseData);

      // 检查 RetCode
      if (responseData.RetCode !== 1) {
          const message = responseData.Message || '未知错误';
          console.error(`Upload failed, RetCode: ${responseData.RetCode}, Message: ${message}`);
          return new Response(`Upload failed, RetCode: ${responseData.RetCode}, Message: ${message}`, { status: 500 });
      }

      // 从响应中提取文件名
      const filesList = responseData.Files;
      if (!filesList || filesList.length === 0) {
          console.error('No files returned in response:', responseData);
          return new Response('Upload succeeded but no files returned', { status: 500 });
      }

      const uploadedFilename = filesList[0];
      const encodedFilename = encodeURIComponent(uploadedFilename);

      // 构建完整的文件 URL
      const fileUrl = `https://uchat.cn-bj.ufileos.com/${encodedFilename}`;

      // 成功，返回图片 URL
      return new Response(fileUrl, {
          status: 200,
          headers: {
              'Content-Type': 'text/plain',
              'Access-Control-Allow-Origin': '*' // 根据需要调整 CORS 策略
          }
      });
  } catch (error) {
      console.error('Error in handleUCloudRequest:', error);
      return new Response('Internal Server Error', { status: 500 });
  }
  }

  async function handle3001Request(request) {
    // 定义 CORS 头部
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // 根据需要调整
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    }
  
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      })
    }
  
    // 处理 GET 请求，返回说明信息
    if (request.method === 'GET') {
      return new Response('3001 图床服务，请使用 POST 方法上传图片。', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
          ...corsHeaders,
        },
      })
    }
  
    // 仅处理 POST 请求
    if (request.method === 'POST') {
      try {
        // 解析表单数据
        const formData = await request.formData()
        const imageFile = formData.get('image') // 前端发送的是 'image'
        const isBase64 = formData.get('is_base64') || '0'
  
        // 打印所有表单字段（调试用）
        for (const [key, value] of formData.entries()) {
          console.log(`Form field: ${key}`)
        }
  
        // 校验图片文件
        if (!imageFile || imageFile.size === 0) {
          return new Response('No image file found in the request', {
            status: 400,
            headers: {
              'Content-Type': 'text/plain;charset=UTF-8',
              ...corsHeaders,
            },
          })
        }
  
        // 从 KV 存储中获取 Authorization Token
        const authorizationToken = await WORKER_IMGBED.get('3001_auth')
        if (!authorizationToken) {
          console.error('Missing Authorization Token in KV storage')
          return new Response('Missing Authorization Token in KV storage', {
            status: 500,
            headers: {
              'Content-Type': 'text/plain;charset=UTF-8',
              ...corsHeaders,
            },
          })
        }
  
        // 构建上传表单数据，将 'image' 重命名为 'file'
        const uploadFormData = new FormData()
        uploadFormData.append('file', imageFile, imageFile.name)
        uploadFormData.append('is_base64', isBase64)
  
        const uploadUrl = 'https://www.freebuf.com/fapi/frontend/upload/image'
  
        // 设置请求头
        const headers = {
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7',
          'Authorization': `Bearer ${authorizationToken}`,
          'Referer': 'https://www.freebuf.com/write',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'X-Client-Type': 'web',
          'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          // 注意：不要手动设置 "Content-Type"，Fetch API 会自动处理 multipart/form-data 的边界
        }
  
        // 发送 POST 请求到 Freebuf 上传接口
        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: headers,
          body: uploadFormData,
        })
  
        // 处理响应
        if (response.status === 200) {
          let responseData
          try {
            responseData = await response.json()
          } catch (parseError) {
            console.error('Error parsing JSON response:', parseError)
            return new Response('上传失败：无法解析服务器响应。', {
              status: 500,
              headers: {
                'Content-Type': 'text/plain;charset=UTF-8',
                ...corsHeaders,
              },
            })
          }
  
          console.log('响应 JSON 内容:', JSON.stringify(responseData, null, 2))
  
          // 检查响应结构
          if (responseData.code === 200 && responseData.data.status) {
            let imageUrl = responseData.data.url || ''
  
            // 清理 URL
            imageUrl = imageUrl.replace(/\\/g, '').replace('!small', '')
            imageUrl = imageUrl.replace(/^https?:/, 'https:')
            imageUrl = imageUrl.replace(/([^:]\/)\/+/g, '$1')
  
            console.log(`图片上传成功: ${imageUrl}`)
  
            // 返回纯文本格式的图片 URL
            return new Response(imageUrl, {
              status: 200,
              headers: {
                'Content-Type': 'text/plain;charset=UTF-8',
                ...corsHeaders,
              },
            })
          } else {
            console.error(`上传失败，消息: ${responseData.msg || '未知错误'}`)
  
            // 返回原始 JSON 错误信息
            return new Response(JSON.stringify(responseData), {
              status: 500,
              headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                ...corsHeaders,
              },
            })
          }
        } else {
          // 尝试解析错误响应为 JSON
          let errorData
          try {
            errorData = await response.json()
          } catch {
            // 如果解析失败，获取纯文本
            const errorText = await response.text()
            console.error(`上传失败。状态码: ${response.status}, 响应内容: ${errorText}`)
            return new Response(`上传失败。状态码: ${response.status}`, {
              status: response.status,
              headers: {
                'Content-Type': 'text/plain;charset=UTF-8',
                ...corsHeaders,
              },
            })
          }
  
          console.error(`上传失败。状态码: ${response.status}, 响应内容: ${JSON.stringify(errorData)}`)
  
          // 返回原始 JSON 错误信息
          return new Response(JSON.stringify(errorData), {
            status: response.status,
            headers: {
              'Content-Type': 'application/json;charset=UTF-8',
              ...corsHeaders,
            },
          })
        }
      } catch (error) {
        console.error(`Error in handleRequest: ${error.stack}`)
        return new Response(`上传失败: ${error.message}`, {
          status: 500,
          headers: {
            'Content-Type': 'text/plain;charset=UTF-8',
            ...corsHeaders,
          },
        })
      }
    }
  
    // 如果方法不是 GET 或 POST，返回 405
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8',
        ...corsHeaders,
      },
    })
  }
  
  async function handles3filebaseRequest(request) {
    console.log('[S3-Filebase] Starting request handling');
    
    if (request.method !== 'POST' || !request.headers.get('Content-Type').includes('multipart/form-data')) {
        console.error('[S3-Filebase] Invalid request method or content type:', {
            method: request.method,
            contentType: request.headers.get('Content-Type')
        });
        return new Response('Invalid request', { status: 400 });
    }
  
    try {
        console.log('[S3-Filebase] Fetching configuration from KV store');
        const config = await WORKER_IMGBED.get('s3filebase_config', 'json');
        if (!config || !config.accessKey || !config.secretKey || !config.bucket) {
            console.error('[S3-Filebase] Invalid configuration:', {
                hasConfig: !!config,
                hasAccessKey: !!config?.accessKey,
                hasSecretKey: !!config?.secretKey,
                hasBucket: !!config?.bucket
            });
            throw new Error('Invalid S3 configuration');
        }
        console.log('[S3-Filebase] Configuration loaded successfully');
  
        const formData = await request.formData();
        const file = formData.get('image');
        if (!file) {
            console.error('[S3-Filebase] No file found in form data');
            return new Response('No file found', { status: 400 });
        }

        // 获取安全的文件名
        const originalName = file.name;
        const extension = originalName.split('.').pop() || '';
        const timestamp = new Date().toISOString()
            .replace(/[-:]/g, '')
            .split('.')[0]
            .replace('T', '_');
        
        // 生成安全的文件名：使用时间戳和随机字符串，避免中文和特殊字符
        const safeFileName = `${timestamp}_${Math.random().toString(36).substring(2, 15)}.${extension}`;
        console.log('[S3-Filebase] File details:', {
            originalName,
            safeFileName,
            type: file.type,
            size: file.size
        });
  
        const content = await file.arrayBuffer();
        console.log('[S3-Filebase] File content loaded:', {
            contentSize: content.byteLength
        });

        // AWS 签名所需的时间戳
        const now = new Date();
        const amzdate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
        const dateStamp = amzdate.slice(0, 8);
        
        // 计算内容哈希
        const contentHash = await crypto.subtle.digest('SHA-256', content)
            .then(buf => Array.from(new Uint8Array(buf))
                .map(b => b.toString(16).padStart(2, '0'))
                .join(''));
        
        // URI 编码的路径
        const encodedKey = encodeURIComponent(safeFileName).replace(/%20/g, '+');
        const canonicalUri = `/${config.bucket}/${encodedKey}`;
        
        // 准备签名所需的头部
        const uploadHeaders = {
            'Host': 's3.filebase.com',
            'Content-Type': file.type || 'application/octet-stream',
            'X-Amz-Content-SHA256': contentHash,
            'X-Amz-Date': amzdate
        };
        
        console.log('[S3-Filebase] Request preparation:', {
            canonicalUri,
            amzdate,
            contentHashPrefix: contentHash.substring(0, 16) + '...'
        });

        const algorithm = 'AWS4-HMAC-SHA256';
        const region = 'us-east-1';
        const service = 's3';
        const scope = `${dateStamp}/${region}/${service}/aws4_request`;
        
        // 准备规范请求
        const canonicalHeaders = Object.entries(uploadHeaders)
            .map(([k, v]) => `${k.toLowerCase()}:${v}\n`)
            .sort()
            .join('');
        const signedHeaders = Object.keys(uploadHeaders)
            .map(k => k.toLowerCase())
            .sort()
            .join(';');

        const canonicalRequest = [
            'PUT',
            canonicalUri,
            '',
            canonicalHeaders,
            signedHeaders,
            contentHash
        ].join('\n');

        console.log('[S3-Filebase] Canonical request prepared:', {
            method: 'PUT',
            uri: canonicalUri,
            signedHeaders
        });

        const stringToSign = [
            algorithm,
            amzdate,
            scope,
            await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalRequest))
                .then(buf => Array.from(new Uint8Array(buf))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join(''))
        ].join('\n');

        // 生成签名密钥
        let key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(`AWS4${config.secretKey}`),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        for (const msg of [dateStamp, region, service, 'aws4_request']) {
            key = await crypto.subtle.importKey(
                'raw',
                await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg)),
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );
        }

        // 计算最终签名
        const signature = await crypto.subtle.sign(
            'HMAC',
            key,
            new TextEncoder().encode(stringToSign)
        );

        // 构建授权头
        const credential = `${config.accessKey}/${dateStamp}/${region}/${service}/aws4_request`;
        const authorization = [
            `${algorithm} Credential=${credential}`,
            `SignedHeaders=${signedHeaders}`,
            `Signature=${Array.from(new Uint8Array(signature))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')}`
        ].join(', ');

        console.log('[S3-Filebase] Authorization prepared:', {
            credentialPrefix: credential.split('/')[0] + '/...',
            signedHeadersCount: signedHeaders.split(';').length
        });

        // 发送上传请求
        const uploadUrl = `https://s3.filebase.com${canonicalUri}`;
        console.log('[S3-Filebase] Sending upload request to:', uploadUrl);
        
        const uploadResponse = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                ...uploadHeaders,
                'Authorization': authorization
            },
            body: content
        });

        if (!uploadResponse.ok) {
            const errorBody = await uploadResponse.text();
            console.error('[S3-Filebase] Upload failed:', {
                status: uploadResponse.status,
                statusText: uploadResponse.statusText,
                responseBody: errorBody,
                headers: Object.fromEntries([...uploadResponse.headers])
            });
            throw new Error(`Upload failed with status ${uploadResponse.status}: ${errorBody}`);
        }

        console.log('[S3-Filebase] Upload successful');
        const cid = uploadResponse.headers.get('x-amz-meta-cid');
        if (!cid) {
            console.error('[S3-Filebase] CID not found in response headers:', 
                Object.fromEntries([...uploadResponse.headers]));
            throw new Error('CID not found in response');
        }

        const finalUrl = `https://i0.wp.com/i0.img2ipfs.com/ipfs/${cid}`;
        console.log('[S3-Filebase] Generated final URL:', finalUrl);
        return new Response(finalUrl);

    } catch (error) {
        console.error('[S3-Filebase] Error in request handling:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        return new Response(`Upload failed: ${error.message}`, { 
            status: 500,
            headers: {
                'Content-Type': 'text/plain',
                'X-Error-Details': error.message
            }
        });
    }
}