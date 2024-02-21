// Giithub @BlueSkyXN
// Code: Modified based on the original
// 仅供学习CloudFlare Worker开发使用，违规使用后果自负
// License @GPLv3

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
  
      const response = await fetch("https://community.codewave.163.com/gateway/lowcode/api/v1/app/upload", {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
          'Referer': 'https://community.codewave.163.com'
        },
        body: formData
      })
  
      const data = await response.json()
  
      let uploadUrl = data.result;
  
      // Calculate the equivalent URL
      const originalBase = "https://lcap-static-saas.nos-eastchina1.126.net/";
      const newBase = "https://community.codewave.163.com/upload/";
      let equivalentUrl = uploadUrl.replace(originalBase, newBase);
  
      return new Response(JSON.stringify({ uploadUrl, equivalentUrl }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>163免费文件床</title>
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
    <h1>163免费文件床</h1>
    <input type="file" id="fileInput" />
    <button onclick="uploadFile()">上传</button>
    <hr>
    <p>该源码开源，仅供学习JS使用，违规使用后果自负</p>
    <hr>
    <p id="resultUrl1">URL: <a href="#" id="urlLink1" target="_blank"></a></p>
    <p id="resultUrl2">URL: <a href="#" id="urlLink2" target="_blank"></a></p>
  
    <footer>
      <hr>
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
        const resultUrl1 = document.getElementById('urlLink1');
        const resultUrl2 = document.getElementById('urlLink2');
        
        resultUrl1.href = data.uploadUrl;
        resultUrl1.textContent = data.uploadUrl;
        
        resultUrl2.href = data.equivalentUrl;
        resultUrl2.textContent = data.equivalentUrl;
      }
    </script>
  </body>
  </html>
  `