// 来自 https://www.nodeseek.com/post-188355-1
async function handleMtDpRequest(request) {
  console.log('Request received for DP upload:', request.url);

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

    // 获取文件信息
    const fileName = file.name;
    const fileType = file.type; // 如 'image/jpeg'
    const fileSize = file.size;

    // 生成新的文件名（使用 MD5 和随机数）
    const timeStamp = new Date().getTime().toString();
    const randomNum = Math.floor(Math.random() * 100000).toString();
    const hash = await crypto.subtle.digest('MD5', new TextEncoder().encode(timeStamp + randomNum));
    const hashArray = Array.from(new Uint8Array(hash));
    const md5Hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const newFileName = md5Hash + '.' + fileName.split('.').pop();

    // 获取文件的最后修改时间（GMT 格式）
    const lastModifiedDate = new Date().toUTCString();

    // 创建新的 FormData，用于发送到大众点评的接口
    const dpFormData = new FormData();
    dpFormData.append('id', 'WU_FILE_0'); // 固定值
    dpFormData.append('name', newFileName);
    dpFormData.append('type', fileType);
    dpFormData.append('lastModifiedDate', lastModifiedDate);
    dpFormData.append('size', fileSize);
    dpFormData.append('file', file, newFileName); // 文件字段名为 'file'

    // 设置必要的头部信息
    const dpHeaders = {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    };

    // 大众点评的上传接口 URL
    const dpUrl = 'https://trust.dianping.com/upload.action';

    // 发送请求到大众点评接口
    const response = await fetch(dpUrl, {
      method: 'POST',
      headers: dpHeaders,
      body: dpFormData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Upload failed: Status ${response.status}, Body: ${errorText}`);
      return new Response(`Upload failed: ${errorText}`, { status: response.status });
    }

    // 解析大众点评接口的响应
    const responseData = await response.json();
    console.log('Response from DP API:', responseData);

    if (responseData && responseData.isSuccess) {
      let url = responseData.url;

      // 转为 HTTPS 协议
      url = url.replace('http://', 'https://');

      // 随机替换域名前缀
      const prefixes = ['img', 'p0', 'p1', 'p2'];
      const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      url = url.replace(/\/\/p0\./, `//${randomPrefix}.`);

      // 成功，返回图片 URL
      return new Response(url, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*' // 根据需要调整 CORS 策略
        }
      });
    } else {
      console.error('Upload failed:', responseData);
      return new Response('Upload failed', { status: 500 });
    }
  } catch (error) {
    console.error('Error in handleDpUploadRequest:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
