async function handle58imgRequest(request) {
    // 验证请求方法
    if (request.method !== 'POST' || !request.headers.get('Content-Type')?.includes('multipart/form-data')) {
      return new Response('Invalid request', { status: 400 });
    }
  
    try {
      // 解析表单数据
      const formData = await request.formData();
      const imageFile = formData.get('image');
      if (!imageFile) {
        return new Response('No image file found', { status: 400 });
      }
  
      // 第一步：获取上传URL
      const getUrlResponse = await fetch("https://im.58.com/msg/get_pic_upload_url?" + new URLSearchParams({
        "params": "LjAuMC4wJmFwcGlkPTEwMTQwLW1jcyU0MGppdG1vdVFyY0hzJmV4dGVuZF9mbGFnPTAmdW5yZWFkX2luZGV4PTEmc2RrX3ZlcnNpb249NjQzMiZkZXZpY2VfaWQ9NThBbm9ueW1vdXMxM2E1MTI2YS1hYWIxLTQxMjQtOTM2Mi05YjlhM2Q1Njg3ZjEmeHh6bF9zbWFydGlkPSZpZDU4PUNoQlBsMmVqUlhSbTdhTlFNTWRrQWclM0QlM0Q1dXNlcl9pZD01OEFub255bW91czEzYTUxMjZhLWFhYjEtNDEyNC05MzYyLTliOWEzZDU2ODdmMSZzb3VyY2U9MTQmaW1fdG9rZW49NThBbm9ueW1vdXMxM2E1MTI2YS1hYWIxLTQxMjQtOTM2Mi05YjlhM2Q1Njg3ZjEmY2xpZW50X3ZlcnNpb249MS4wJmNsaWVudF90eXBlPXBjd2ViJm9zX3R5cGU9Q2hyb21lJm9zX3ZlcnNpb249MTMy",
        "version": "j1.0"
      }), {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'text/plain;charset=UTF-8',
          'Origin': 'https://ai.58.com',
          'Referer': 'https://ai.58.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
        },
        body: 'cl9zb3VyY2UiOjE0LCJ0b19pZCI6IjEwMDAyIiwidG9fc291cmNlIjoxMDAsImZpbGVfc3VmZml4cyI6WyJwbmciXX01eyJzZW5kZXJfaWQiOiI1OEFub255bW91czEzYTUxMjZhLWFhYjEtNDEyNC05MzYyLTliOWEzZDU2ODdmMSIsInNlbmRl'
      });
  
      if (!getUrlResponse.ok) {
        throw new Error(`Failed to get upload URL: ${getUrlResponse.status}`);
      }
  
      const urlData = await getUrlResponse.json();
      if (urlData.error_code !== 0 || !urlData.data?.upload_info?.[0]?.url) {
        throw new Error('Invalid upload URL response');
      }
  
      const uploadUrl = urlData.data.upload_info[0].url;
  
      // 第二步：上传文件
      const fileContent = await imageFile.arrayBuffer();
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': imageFile.type || 'image/jpeg',
          'Origin': 'https://ai.58.com',
          'Referer': 'https://ai.58.com/'
        },
        body: fileContent
      });
  
      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }
  
      // 第三步：生成最终URL
      const baseUrl = uploadUrl.split('?')[0];
      const filePath = baseUrl.split('/').slice(3).join('/');
      const random_number = Math.floor(Math.random() * 8) + 1;
      const finalUrl = `https://pic${random_number}.58cdn.com.cn/${filePath}`;
  
      // 返回成功结果
      return new Response(finalUrl, {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
  
    } catch (error) {
      console.error('[58img] Error:', error);
      return new Response(`Upload failed: ${error.message}`, { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
  }