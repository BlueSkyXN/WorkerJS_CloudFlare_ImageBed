# WorkerJS_CloudFlare_ImageBed

基于JS+HTML的图床项目开发框架，包括前端（pages，html）和后端（worker，js）等。

以及测试用py上传工具和构建、脚本。

仅供学习Worker开发使用，违规使用后果自负。

大部分接口不一定可用，仅供教学学习测试验证。

## 项目结构

- **后端API** (`cloudflare-worker-js-api/`)
  - `worker.js` - 单文件集成版本，可直接部署到CloudFlare Worker
  - `index.js` - 基础框架，包含路由、授权和CORS处理
  - `API_IMG_{NAME}.js` - 各图床服务的独立实现模块

- **前端界面** (`cloudflare-page/`)
  - `OneAPI-imgbed-MIX.html` - 主要上传界面
  - `Tools-*.html` - 辅助工具（TGPH转换器、图片代理、缓存计算器等）

- **构建系统** (`cloudflare-page-build/`)
  - 自动化构建脚本，支持环境变量配置

- **测试工具**
  - `python-uploader/` - Python上传测试脚本
  - `UserScript/` - 浏览器用户脚本工具

## 快速开始

### 在线使用
直接访问部署好的服务，无需自己部署：
- 前端界面：填入API接口地址和密码即可使用

### API接口
支持的图床服务端点：
- `/upload/tgphimg` - Telegraph 图床
- `/upload/58img` - 58图床
- `/upload/ipfs` - IPFS存储
- `/upload/3001` - 3001图床
- `/upload/imgbb` - ImgBB图床
- `/upload/aliex` - 阿里云图床
- `/upload/ucloud` - UCloud图床
- `/upload/s3ipfs` - S3 IPFS存储

### 认证方式
```bash
Authorization: Bearer {API_PASSWORD}
```

### 上传示例
```bash
curl -X POST \
  -H "Authorization: Bearer 123456" \
  -F "image=@/path/to/image.jpg" \
  https://your-worker.your-subdomain.workers.dev/upload/tgphimg
```

# 部署

## CloudFlare Pages部署

[![Use EdgeOne Pages to deploy](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://edgeone.ai/pages/new?repository-url=https%3A%2F%2Fgithub.com%2FBlueSkyXN%2FWorkerJS_CloudFlare_ImageBed%2F&project-name=WorkerJS-ImageBed&install-command=npm%20install&build-command=npm%20run%20build&output-directory=dist)

[![使用 EdgeOne Pages 部署](https://cdnstatic.tencentcs.com/edgeone/pages/deploy.svg)](https://console.cloud.tencent.com/edgeone/pages/new?repository-url=https%3A%2F%2Fgithub.com%2FBlueSkyXN%2FWorkerJS_CloudFlare_ImageBed%2F&project-name=WorkerJS-ImageBed&install-command=npm%20install&build-command=npm%20run%20build&output-directory=dist)

### 部署配置
- **构建命令**: `npm run build`
- **输出目录**: `dist`
- **根目录**: `/`

### 环境变量配置
| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `API_ENDPOINT` | API接口地址 | - |
| `API_ENDPOINT_BASE64` | Base64编码的API接口地址（优先级更高） | - |
| `API_PASSWORD` | API访问密码 | `123456` |
| `API_PASSWORD_BASE64` | Base64编码的API密码（优先级更高） | - |

## CloudFlare Worker部署

### 后端API部署
1. 创建新的CloudFlare Worker项目
2. 复制 `cloudflare-worker-js-api/worker.js` 内容到编辑器
3. 设置环境变量 `API_PASSWORD`（默认：`123456`）
4. 保存并部署

### Worker环境变量
- `API_PASSWORD`: API访问密码，用于Bearer Token验证

## 功能特性

### 前端工具
- **主界面** (`/`) - 多API图床上传工具
- **TGPH转换器** (`/tools/tgph`) - Telegraph图片链接转换
- **图片代理** (`/tools/imgproxy`) - 图片代理和优化工具  
- **缓存计算器** (`/tools/googlecache`) - Google缓存页面计算
- **图片测试** (`/tools/test`) - 图片链接有效性测试

### 后端API规范
- **请求方法**: `POST`
- **Content-Type**: `multipart/form-data`
- **文件字段**: `image` (部分接口使用 `file`)
- **认证方式**: `Authorization: Bearer {密码}`
- **响应格式**: 纯文本URL（非JSON）
- **CORS支持**: 支持跨域请求

### 开发工具
- **Python上传器**: 各图床服务的测试脚本
- **UserScript**: 浏览器扩展脚本（IPFS相关）
- **构建系统**: 自动化前端构建和配置

# 文档

- [无服务器项目开发和部署学习文档](https://github.com/BlueSkyXN/WorkerJS_CloudFlare_ImageBed/blob/main/docs/Serverless.md)
- [API规范文档](https://github.com/BlueSkyXN/WorkerJS_CloudFlare_ImageBed/blob/main/docs/WorkerAPI-STD.md)
- [里程碑](https://github.com/BlueSkyXN/WorkerJS_CloudFlare_ImageBed/blob/main/docs/History.md)
