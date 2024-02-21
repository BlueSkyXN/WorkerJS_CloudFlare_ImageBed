// Giithub @BlueSkyXN
// Code https://gist.github.com/BlueSkyXN/cf009388660348915be2166f6080e02d
// 仅供学习CloudFlare Worker开发使用，违规使用后果自负
// License @GPLv3
// 目前该地址经过实验不需要认证，不需要UA、Cookie、Content-Type、Authorization: Bearer等信息，直接上传都行
// 思路来源   https://tencentsb.xyz/md/ 和出处（需要登录或者用谷歌爬虫UA/快照访问） https://jike.info/topic/22192/
// 参考资料   https://www.freebuf.com/articles/system/227532.html
// 参考资料   https://github.com/yuolvv/Poor_image_upload


addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request) {
    if (request.method === 'GET') {
      return new Response(html, {
        headers: {
          'content-type': 'text/html;charset=UTF-8',
        },
      })
    } else if (request.method === 'POST') {
      const formData = await request.formData()
      const file = formData.get('file')
  
      const response = await fetch("https://www.freebuf.com/fapi/frontend/upload/image", {
        method: 'POST',
        headers: {
          "Accept": "application/json, text/plain, */*",
          "Referer": "https://www.freebuf.com/write",
          "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
        },
        body: formData
      })
      const data = await response.json()
  
      let imageUrl = data.data.url.replace(/\\/g, "").replace('!small', '');
  
      // 使用正则确保URL的开头是https:，并且没有重复的斜线
      imageUrl = imageUrl.replace(/^https?:/, 'https:');
      imageUrl = imageUrl.replace(/([^:]\/)\/+/g, "$1");
  
      return new Response(JSON.stringify({ imageUrl }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>3001免费图床</title>
    <!-- 
    // 仅供学习CloudFlare Worker开发使用，违规使用后果自负
    // License @GPLv3
    -->
    <style>
      body {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-family: Arial, sans-serif;
      }
      #resultUrl {
        margin-top: 20px;
      }
      hr {
        width: 100%;
        max-width: 500px;
      }
    </style>
  </head>
  <body>
    <h1>3001免费图床</h1>
    <input type="file" id="fileInput" />
    <button onclick="uploadFile()">上传</button>
    <hr>
    <p>建议上传10M以内的JPG/PNG/JPEG/ICO/WEBP/GIF文件，注意不兼容视频和其他非图像文件</p>
    <p>兼容格式：xbm/tif/jfif/ico/tiff/gif/svg/jpeg/svgz/jpg/webp/png/bmp/pjp/apng/pjpeg/avif</p>
    <p>该源码开源，仅供学习JS使用，违规使用后果自负</p>
    <hr>
    <p id="resultUrl">URL: <a href="#" id="urlLink" target="_blank"></a></p>
  
    <footer>
      <hr>
      <p>参考资料 <a href="https://webcache.googleusercontent.com/search?q=cache:K2CbBnVP490J:https://jike.info/topic/22192/%25E8%25BF%2598%25E6%2598%25AF%25E7%25AE%2580%25E5%258D%2595%25E6%25B5%258B%25E8%25AF%2595%25E4%25B8%2580%25E4%25B8%258B%25E5%259B%25BE%25E5%25BA%258A&cd=10&hl=zh-CN&ct=clnk&gl=us" target="_blank">https://jike.info/topic/22192/</a></p>
      <p>参考资料 <a href="https://www.freebuf.com/articles/system/227532.html" target="_blank">https://www.freebuf.com/articles/system/227532.html</a></p>
      <p>参考资料 <a href="https://github.com/yuolvv/Poor_image_upload" target="_blank">https://github.com/yuolvv/Poor_image_upload</a></p>
    </footer>
  
    <script>
      async function uploadFile() {
        const fileInput = document.getElementById('fileInput');
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
  
        const response = await fetch('/', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        const resultUrl = document.getElementById('urlLink');
        resultUrl.href = data.imageUrl;
        resultUrl.textContent = data.imageUrl;
      }
    </script>
  </body>
  </html>
  `
  