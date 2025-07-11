# CloudFlare 无服务器图床部署指南

## 概述

本项目基于 CloudFlare Pages + Worker 的完全无服务器架构，提供前后端分离的图床解决方案。

## 项目架构

### 核心文件

| 文件 | 用途 | 部署位置 |
|------|------|----------|
| `cloudflare-page/OneAPI-imgbed-MIX.html` | 集成前端界面 | CloudFlare Pages |
| `cloudflare-worker-js-api/worker.js` | 后端API服务 | CloudFlare Worker |

### 辅助工具

| 文件 | 功能 | 部署位置 |
|------|------|----------|
| `cloudflare-page/Tools-TGPH.html` | Telegraph图片加速转换器 | CloudFlare Pages |
| `cloudflare-page/Tools-IMGProxy.html` | 通用图片加速转换器 | CloudFlare Pages |
| `cloudflare-page/Tools-GoogleCache.html` | 谷歌缓存页面计算器 | CloudFlare Pages |

## 后端部署 (Worker)

### 使用场景
- 需要大量API操作
- 测试公共API失效时的备用方案
- 需要自定义配置

### 部署步骤

1. **创建Worker项目**
   - 登录CloudFlare控制台，创建新的Worker项目
   - 复制 `cloudflare-worker-js-api/worker.js` 内容到编辑器

2. **配置环境变量**
   - 变量名: `API_PASSWORD`
   - 值: 自定义密码（明文）
   - 默认密码: `123456`

3. **部署访问**
   - 保存并部署Worker
   - 记录Worker URL（无需结尾斜杠）

### 技术规范
- **认证方式**: Bearer Token (通过Authorization头)
- **上传格式**: 二进制文件，字段名为 `image`
- **文件限制**: 不校验文件类型和文件名
- **响应格式**: 返回可访问的图片URL

## 前端部署 (Pages)

### 使用场景
- 需要修改默认API接口配置
- 需要自定义密码预设
- 需要品牌化定制

### 部署方案

#### 方案一：青春版 (静态HTML)

**适用场景**: 快速部署，无需构建过程

**部署步骤**:
1. 创建新的Git仓库
2. 将 `cloudflare-page/OneAPI-imgbed-MIX.html` 重命名为 `index.html`
3. 修改配置参数（第106行和111行）:
   - `{{API_ENDPOINT_BASE64}}`: Base64编码的API接口地址
   - `{{API_PASSWORD_BASE64}}`: Base64编码的API密码
4. (可选) 添加TGPH转换器到 `tools/tgph.html`

**CloudFlare Pages配置**:
- 构建命令: 留空
- 输出目录: `/`
- 根目录: `/`

#### 方案二：标准版 (构建版本)

**适用场景**: 需要构建优化，支持环境变量

**部署步骤**:
1. 复制所需文件到新仓库:
   - 核心文件（见项目架构）
   - `cloudflare-page-build/` 目录
   - `package.json`

**CloudFlare Pages配置**:
- 构建命令: `npm run build`
- 输出目录: `/dist`
- 根目录: `/`

**环境变量配置**:
| 变量名 | 优先级 | 说明 | 示例 |
|--------|--------|------|------|
| `API_ENDPOINT_BASE64` | 高 | Base64编码的API接口 | - |
| `API_ENDPOINT` | 低 | 原始API接口地址 | `https://api.test.workers.dev` |
| `API_PASSWORD_BASE64` | 高 | Base64编码的API密码 | - |
| `API_PASSWORD` | 低 | 原始API密码 | `123456` |

#### 方案三：完整版 (Fork仓库)

**适用场景**: 完整功能，持续更新

**部署步骤**:
1. Fork完整仓库
2. 在CloudFlare Pages中连接仓库
3. 配置构建设置（同标准版）
4. 设置环境变量（同标准版）

## 快速开始

### 仅使用前端
直接访问: https://imgup.pages.dev
- 填入自己的API接口地址
- 输入对应的密码
- 开始使用

### 完整部署
1. 先部署Worker后端（获取API地址）
2. 再部署Pages前端（配置API地址）
3. 测试上传功能

## 注意事项

- Worker免费版有请求次数限制
- 环境变量中Base64编码的配置优先级更高
- 密码需要明文存储在环境变量中
- 所有图床API都通过统一接口访问
