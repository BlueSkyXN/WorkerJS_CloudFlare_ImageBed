/* 
  这个试验我放在了KV库
  你需要创建和绑定名为 WORKER_IMGBED 的库，其中新建 K 字段，名为 3001_auth 然后在V中复制进去浏览器F12得到的完整Authorization即可
  Authorization需要你注册登录 https://www.freebuf.com/ 获取，有效期不详，也许是一个月
*/

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/**
 * 处理传入的请求
 * @param {Request} request
 */
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
      // 优先从 Header 获取 Token (统一使用 X-EXTRA-SECRET)，否则从 KV 获取
      let authorizationToken = request.headers.get('X-EXTRA-SECRET');
      if (!authorizationToken) {
        authorizationToken = await WORKER_IMGBED.get('3001_auth');
      }
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
