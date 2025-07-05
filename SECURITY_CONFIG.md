# 安全配置建议 (Security Configuration Recommendations)

## Content Security Policy (CSP) 头配置
建议在所有HTML页面中添加以下CSP头：

```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://js.wpadmngr.com;
    style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
    img-src 'self' data: https: http:;
    connect-src 'self' https:;
    font-src 'self' https://cdnjs.cloudflare.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
">
```

## CloudFlare Worker 安全头配置
在Worker响应中添加安全头：

```javascript
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// 在响应中添加这些头
Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
});
```

## 输入验证示例
```javascript
// 文件类型验证
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp'
];

function validateFile(file) {
    // 检查MIME类型
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new Error('不支持的文件类型');
    }
    
    // 检查文件大小 (例如：最大10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
        throw new Error('文件大小超过限制');
    }
    
    return true;
}
```

## CORS 安全配置
```javascript
// 生产环境中应该限制CORS源
const ALLOWED_ORIGINS = [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
];

function getCorsHeaders(origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
        return {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        };
    }
    return {};
}
```

## 环境变量安全
在CloudFlare Worker中设置：
- `API_PASSWORD`: 使用强密码，不要使用默认的"123456"
- `NODE_ENV`: 设置为"production"以禁用调试信息
- 避免在环境变量中存储敏感的Cookie，考虑使用加密存储

## 日志安全
- 生产环境中移除或过滤敏感信息的日志输出
- 使用结构化日志格式
- 实施日志监控和异常报警

## 文件上传安全
1. 验证文件MIME类型和扩展名
2. 限制文件大小
3. 检查文件内容（防止恶意文件）
4. 使用病毒扫描API（如VirusTotal）
5. 在CDN层面实施访问控制

## API安全
1. 实施速率限制
2. 使用JWT或其他安全的认证方式
3. 添加API版本控制
4. 实施请求签名验证