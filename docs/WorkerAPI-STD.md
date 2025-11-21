# CloudFlare Worker 图床 API 标准文档

## 项目结构

- **主文件**: `cloudflare-worker-js-api/worker.js` - 单文件集成版本，包含所有API实现，可直接部署到Cloudflare Worker
- **框架文件**: `cloudflare-worker-js-api/index.js` - 基础框架，包含路由、授权和CORS处理
- **API模块**: `cloudflare-worker-js-api/API_IMG_{NAME}.js` - 各图床服务的独立实现模块

## 部署配置

### 环境变量

- `API_PASSWORD`: API访问密码，用于Bearer Token验证

### 部署步骤

1. 将 `worker.js` 内容复制到Cloudflare Worker控制台
2. 设置环境变量 `API_PASSWORD` 
3. 部署即可使用

## 请求规范

### 认证方式
- **请求头**: `Authorization: Bearer {API_PASSWORD}`
- **位置**: 参考 `index.js:15` 行的实现

### 请求格式
- **方法**: `POST`
- **Content-Type**: `multipart/form-data`
- **文件字段**: `image` (注意：部分图床使用 `file` 字段)
- **文件限制**: 不校验文件名和文件类型

### CORS支持
- 支持跨域请求
- 自动处理OPTIONS预检请求
- 允许所有来源 (`Access-Control-Allow-Origin: *`)

## 响应规范

### 成功响应
- **格式**: 纯文本URL (非JSON格式)
- **状态码**: 200
- **内容**: 可直接访问的图片链接

### 错误响应
- **401**: 未授权 (Token验证失败)
- **400**: 请求格式错误或缺少图片文件
- **404**: API端点不存在

## 使用示例

```bash
# 上传图片到Telegraph
curl -X POST \
  -H "Authorization: Bearer your_api_password" \
  -F "image=@/path/to/image.jpg" \
  https://your-worker.your-subdomain.workers.dev/upload/tgphimg

# 响应示例
https://telegra.ph/file/1234567890abcdef.jpg
```

## 额外配置 (Channel Secret)

部分图床接口（如 NodeSeek, Freebuf, S3, AliExpress）需要额外的 API Key 或配置。你可以选择在 Cloudflare KV 中配置，也可以通过 HTTP Header `X-EXTRA-SECRET` 动态传入。

### 优先级
**Header (`X-EXTRA-SECRET`) > KV 配置**

### 使用方式

#### 1. NodeSeek 图床
- **Header**: `X-EXTRA-SECRET`
- **值**: 你的 NodeSeek API Key (字符串)
- **KV 键名**: `NODESEEK_APIKEY`

#### 2. Freebuf (3001) 图床
- **Header**: `X-EXTRA-SECRET`
- **值**: 你的 Freebuf Bearer Token (字符串)
- **KV 键名**: `3001_auth`

#### 3. S3 / Filebase 图床
- **Header**: `X-EXTRA-SECRET`
- **值**: JSON 配置字符串
  ```json
  {"accessKey":"你的AK","secretKey":"你的SK","bucket":"存储桶名"}
  ```
- **KV 键名**: `s3filebase_config`

#### 4. AliExpress (速卖通) 图床
- **Header**: `X-EXTRA-SECRET`
- **值**: 完整的 Cookie 字符串
- **KV 键名**: `ali_express_cookie`

### 示例 (cURL)

```bash
# 使用 Header 覆盖配置上传到 NodeSeek
curl -X POST \
  -H "Authorization: Bearer your_api_password" \
  -H "X-EXTRA-SECRET: your_nodeseek_api_key" \
  -F "image=@/path/to/image.jpg" \
  https://your-worker.workers.dev/upload/nodeseek
```
