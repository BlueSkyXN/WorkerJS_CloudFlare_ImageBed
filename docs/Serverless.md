# 项目基本架构
对于最新的Page+Worker完全无服务器前后端实现方案来说
主要的文件包括
- `cloudflare-page/OneAPI-imgbed-MIX.html` 集成前端HTML，需要放在CloudFlare Page上
- `cloudflare-page/Tools-TGPH.html` 用于转换TGPH加速文件的转换器，需要放在CloudFlare Page上
- `cloudflare-worker-js-api/worker.js` All in One的后端JS，需要放在CloudFlare Worker上，受到Worker免费次数限制，建议自行搭建

# 后端部署
前端可以直接用我的 https://imgup.pages.dev 自己填写API接口和对应的密码

- 任意起一个Worker项目，复制 `cloudflare-worker-js-api/worker.js` 的文件内容进去，cf账号没什么要求，新号都行，无需付费

- 然后记住你的worker的url，不需要带结尾的斜杠/

- 然后在环境变量处，新增你的密码，密码要求明文，密码的变量名默认是 `API_PASSWORD`, 前端默认密码是123456

- 该JS的上传对接需要在Authorization通过Bearer附带验证TOKEN，也就是密码

- 该JS的上传统一是上传二进制文件，JS自行重新计算上传方法并返回有效URL

# 前端部署

## 青春版
- `cloudflare-page/OneAPI-imgbed-MIX.html` 放在你新建的GIT仓库
- `cloudflare-page/OneAPI-imgbed-MIX.html` 重命名为index.html
- 修改106行左右的 `{{API_ENDPOINT_BASE64}}`和111行左右的`{{API_PASSWORD_BASE64}}`，这两个需要是Base64后的值
- 需要TGPH转换器的，把`cloudflare-worker-js-api/worker.js`放在新建的`tools`目录下，并重命名为`tgph.html`
- cloudflare page 构建无需任何命令，空即可，同样适用于任何可执行HTML和JS的环境

## 标准版

- 复制开头的基本架构中指出的主要文件到一致的相对路径
- 复制`cloudflare-page-build`目录和它的全部下属文件到一致的相对路径
- 复制`package.json` 到新仓库的根目录
- cloudflare page 构建命令 `npm run build`
- cloudflare page 构建输出目录 `/dist`
- cloudflare page 构建根目录 `/`
- cloudflare page 环境变量`API_ENDPOINT_BASE64`或者`API_ENDPOINT`，前者优先，存放预设API接口，原始信息比如 `https://api.test.workers.dev`
- cloudflare page 环境变量`API_PASSWORD_BASE64`或者`API_PASSWORD`，前者优先，存放预设API密码，原始信息比如 `123456`