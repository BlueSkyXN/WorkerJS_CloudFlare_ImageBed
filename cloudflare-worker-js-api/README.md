# 结构
主文件 仅有 `cloudflare-worker-js-api/worker.js `，由其他文件拼接而来，已整合成单文件函数，超级简单部署，直接丢到cloudflare worker即可

`cloudflare-worker-js-api/index.js ` 是基本框架，包括路由和授权规则

`cloudflare-worker-js-api/API_IMG_{NAME}.js ` 是不同的接口的统一实现

# 输出规范

正常成功上传的响应体是纯URL，非JSON，可直接直链接访问

# 输入规范

- 在Authorization通过Bearer附带验证TOKEN，也就是密码，参考 `cloudflare-worker-js-api/index.js `的第15行，在WorkerJS中变量名为 API_PASSWORD
- 执行二进制上传，文件字段名为 `image`（部分其他图床用的是file而不是image，需要注意）
- 不校验文件名和文件类型
