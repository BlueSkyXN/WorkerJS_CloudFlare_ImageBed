addEventListener('fetch', event => {
  event.respondWith(handles3filebaseRequest(event.request));
});

import { AwsClient } from 'aws4fetch';

async function handles3filebaseRequest(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image'); // 期待表单字段名为'image'
    if (!file) {
      return new Response('No file uploaded', { status: 400 });
    }

    // 将文件内容读取为ArrayBuffer
    const fileContent = await file.arrayBuffer();

    // 从环境变量中获取s3filebase_key，并解析出bucket_name、access_key和secret_key
    const s3filebaseKey = S3FILEBASE_KEY; // S3FILEBASE_KEY是您的环境变量
    const [bucketName, accessKeyId, secretAccessKey] = s3filebaseKey.split('|');

    // 检查是否成功解析
    if (!bucketName || !accessKeyId || !secretAccessKey) {
      return new Response('Server configuration error: Invalid S3FILEBASE_KEY', { status: 500 });
    }

    const region = 'us-east-1'; // Filebase默认使用'us-east-1'
    const service = 's3';
    const host = 's3.filebase.com';

    // 生成带时间戳的文件名
    const fileName = file.name || 'upload';
    const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const s3FileKey = `${fileName}_${timestamp}`;

    // 创建 AwsClient 实例
    const aws = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service,
      region,
    });

    // 构建上传文件的 URL
    const url = `https://${host}/${bucketName}/${s3FileKey}`;

    // 发起 PUT 请求上传文件
    const uploadResponse = await aws.fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: fileContent,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      return new Response(`Upload failed with status: ${uploadResponse.status}, error: ${errorText}`, { status: uploadResponse.status });
    }

    // 发起 HEAD 请求获取元数据以获得 CID
    const metadataResponse = await aws.fetch(url, {
      method: 'HEAD',
    });

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      return new Response(`Failed to retrieve metadata with status: ${metadataResponse.status}, error: ${errorText}`, { status: metadataResponse.status });
    }

    // 从元数据中提取 CID
    const cid = metadataResponse.headers.get('x-amz-meta-cid');
    if (!cid) {
      return new Response('CID not found in metadata.', { status: 500 });
    }

    // 构建访问 URL
    const accessUrl = `https://ipfs.filebase.io/ipfs/${cid}`;

    // 返回访问 URL
    return new Response(accessUrl, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
  }
}
