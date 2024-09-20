addEventListener('fetch', event => {
  event.respondWith(handles3filebaseRequest(event.request));
});

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
      console.error('Failed to parse S3FILEBASE_KEY environment variable.');
      return new Response('Server configuration error.', { status: 500 });
    }

    const region = 'us-east-1'; // Filebase默认使用'us-east-1'
    const service = 's3';
    const host = 's3.filebase.com';

    // 生成带时间戳的文件名
    const fileName = file.name || 'upload';
    const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, '');
    const s3FileKey = `${fileName}_${timestamp}`;

    // 准备请求细节
    const method = 'PUT';
    const canonicalUri = `/${bucketName}/${s3FileKey}`;
    const canonicalQueryString = '';
    const payloadHash = await sha256(fileContent);
    const amzDate = getAmzDate();
    const dateStamp = amzDate.substring(0, 8);
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

    // 准备请求头
    let headers = {
      Host: host,
      'X-Amz-Date': amzDate,
      'Content-Type': 'application/octet-stream',
      'Content-Length': fileContent.byteLength.toString(),
    };

    // 创建规范请求
    const signedHeaders = getSignedHeaders(headers);
    const canonicalHeaders = getCanonicalHeaders(headers);
    const canonicalRequest = [
      method,
      canonicalUri,
      canonicalQueryString,
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    // 创建待签名字符串
    const canonicalRequestHash = await sha256(canonicalRequest);
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      canonicalRequestHash,
    ].join('\n');

    // 计算签名
    const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
    const signature = await hmacHex(signingKey, stringToSign);

    // 添加授权头
    headers['Authorization'] = [
      `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(', ');

    // 发起PUT请求上传文件
    const url = `https://${host}${canonicalUri}`;
    const uploadResponse = await fetch(url, {
      method: method,
      headers: headers,
      body: fileContent,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`上传失败: ${uploadResponse.status} - ${errorText}`);
      return new Response(`Upload failed with status: ${uploadResponse.status}`, { status: uploadResponse.status });
    }

    console.log('文件上传成功！');

    // 现在，获取元数据以获得CID
    const metadataResponse = await getObjectMetadata(
      accessKeyId,
      secretAccessKey,
      bucketName,
      s3FileKey,
      region,
      service,
      host
    );

    if (!metadataResponse.ok) {
      const errorText = await metadataResponse.text();
      console.error(`获取元数据失败: ${metadataResponse.status} - ${errorText}`);
      return new Response(`Failed to retrieve metadata with status: ${metadataResponse.status}`, { status: metadataResponse.status });
    }

    // 从元数据中提取CID
    const cid = metadataResponse.headers.get('x-amz-meta-cid');
    if (!cid) {
      console.error('在元数据中未找到CID。');
      return new Response('CID not found in metadata.', { status: 500 });
    }

    console.log(`CID: ${cid}`);

    // 构建访问URL
    const accessUrl = `https://ipfs.filebase.io/ipfs/${cid}`;

    // 返回访问URL
    return new Response(accessUrl, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// 辅助函数

function getAmzDate() {
  const now = new Date();
  return now.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function getSignedHeaders(headers) {
  return Object.keys(headers)
    .map(key => key.toLowerCase())
    .sort()
    .join(';');
}

function getCanonicalHeaders(headers) {
  return Object.keys(headers)
    .map(key => key.toLowerCase() + ':' + headers[key].trim() + '\n')
    .sort()
    .join('');
}

async function sha256(message) {
  let buffer;
  if (message instanceof ArrayBuffer || message instanceof Uint8Array) {
    buffer = message;
  } else {
    const encoder = new TextEncoder();
    buffer = encoder.encode(message);
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return arrayBufferToHex(hashBuffer);
}

async function hmac(key, message) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key instanceof Uint8Array ? key : new Uint8Array(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return signature;
}

async function hmacHex(key, message) {
  const encoder = new TextEncoder();
  const keyData = key instanceof Uint8Array ? key : encoder.encode(key);
  const messageData = message instanceof Uint8Array ? message : encoder.encode(message);
  const signature = await hmac(keyData, messageData);
  return arrayBufferToHex(signature);
}

function arrayBufferToHex(buffer) {
  const byteArray = new Uint8Array(buffer);
  return Array.from(byteArray)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const encoder = new TextEncoder();
  const kDate = await hmac(encoder.encode('AWS4' + key), encoder.encode(dateStamp));
  const kRegion = await hmac(kDate, encoder.encode(regionName));
  const kService = await hmac(kRegion, encoder.encode(serviceName));
  const kSigning = await hmac(kService, encoder.encode('aws4_request'));
  return kSigning;
}

// 获取对象元数据的函数（HEAD请求）
async function getObjectMetadata(accessKeyId, secretAccessKey, bucketName, objectKey, region, service, host) {
  const method = 'HEAD';
  const canonicalUri = `/${bucketName}/${objectKey}`;
  const canonicalQueryString = '';
  const payloadHash = await sha256('');
  const amzDate = getAmzDate();
  const dateStamp = amzDate.substring(0, 8);
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  // 准备请求头
  let headers = {
    Host: host,
    'X-Amz-Date': amzDate,
  };

  // 创建规范请求
  const signedHeaders = getSignedHeaders(headers);
  const canonicalHeaders = getCanonicalHeaders(headers);
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  // 创建待签名字符串
  const canonicalRequestHash = await sha256(canonicalRequest);
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    canonicalRequestHash,
  ].join('\n');

  // 计算签名
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = await hmacHex(signingKey, stringToSign);

  // 添加授权头
  headers['Authorization'] = [
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(', ');

  // 发起HEAD请求
  const url = `https://${host}${canonicalUri}`;
  const response = await fetch(url, {
    method: method,
    headers: headers,
  });

  return response;
}
