async function handlejdkfRequest(request) {
    console.log('Request received for jdkf upload:', request.url);
  
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
  
      // 创建新的 FormData，用于发送到目标接口
      const newFormData = new FormData();
      newFormData.append('files', file, file.name); // 目标接口要求字段名为 'files'
  
      // 设置目标接口所需的头部信息
      const targetHeaders = {
        'Accept': 'application/json',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,zh-TW;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Priority': 'u=1, i',
        'Sec-CH-UA': '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
        'Sec-CH-UA-Mobile': '?0',
        'Sec-CH-UA-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'none',
        'X-Requested-With': 'XMLHttpRequest'
      };
  
      // 目标上传接口的 URL
      const targetUrl = 'https://kefu-jtalk.jd.com/jtalk/hfive/resource/image/upload';
  
      // 发送请求到目标接口
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
  
      // 解析目标接口的响应
      const responseData = await response.json();
      console.log('Response from jdkf API:', responseData);
  
      // 从响应中提取图片 URL
      const uploadUrl = responseData?.data?.[0]?.url;
  
      if (uploadUrl) {
        // 成功，返回图片 URL
        return new Response(uploadUrl, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*' // 根据需要调整 CORS 策略
          }
        });
      } else {
        console.error('URL not found in response:', responseData);
        return new Response('Upload succeeded but no URL returned', { status: 500 });
      }
    } catch (error) {
      console.error('Error in handleJdkfRequest:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
  