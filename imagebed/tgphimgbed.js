// Github @BlueSkyXN
// Code https://gist.github.com/BlueSkyXN/8d261d13d79e7a7672999f9935acdfe9
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
      const apiOption = formData.get('apiOption') || 'api-tgph-official';
  
      let apiUrl = 'https://telegra.ph/upload';
  
      if (apiOption === 'api-tgph-cachefly') {
        apiUrl = 'https://telegraph.cachefly.net/upload';
      } else if (apiOption === 'api-tgph-other') {
        apiUrl = 'https://telegra.ph/upload';
      }
  
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
  
      let imageUrl = 'https://telegra.ph' + data[0].src;
  
      return new Response(JSON.stringify({ imageUrl }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  const html = `<!DOCTYPE html>
  <html>
  <head>
    <title>TGPH Image Hosting</title>
    <meta charset="UTF-8">
    <!-- 
    // 仅供学习CloudFlare Worker开发使用，违规使用后果自负
    // License @GPLv3
    -->
    <style>
      footer {
        font-size: 12px; /* 小一点的字号 */
      }
      hr {
        margin-top: 20px;
        margin-bottom: 20px;
      }
    </style>
  </head>
  <body>
    <h1>TGPH Image Hosting</h1>
    <hr> <!-- 分隔符 -->
    <form id="uploadForm">
      <input type="file" name="file" id="fileInput" required />
      <select name="apiOption" id="apiOption">
        <option value="api-tgph-official">TGPH-Official</option>
        <option value="api-tgph-cachefly">TGPH-Cachefly</option>
      </select>
      <button type="submit">Upload</button>
    </form>
    <input type="checkbox" id="subOption" onclick="toggleSubUrls()" />
    <label for="subOption">Enable TGPH-SUB</label>
    <hr> <!-- 分隔符 -->
    <div id="result"></div>
    <button id="copyButton">Copy</button>
    <script>
      let imageUrl = '';
      document.getElementById('uploadForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData();
        formData.append('file', document.getElementById('fileInput').files[0]);
        formData.append('apiOption', document.getElementById('apiOption').value);
        const response = await fetch('/', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        imageUrl = data.imageUrl;
        toggleSubUrls();
      });
  
      function toggleSubUrls() {
        let resultHTML = '';
        if (document.getElementById('subOption').checked) {
          const urls = generateSubUrls(imageUrl);
          urls.forEach((url, index) => {
            resultHTML += '<div>URL: <a href="' + url + '" target="_blank">' + url + '</a> <button class="copy-button" data-url="' + url + '" id="copyButton' + index + '">Copy</button></div>';
          });
        } else {
          resultHTML = 'URL: <a href="' + imageUrl + '" target="_blank">' + imageUrl + '</a> <button id="copyButton">Copy</button>';
        }
        document.getElementById('result').innerHTML = resultHTML;
      
        // 添加事件监听器
        const copyButtons = document.querySelectorAll('.copy-button');
        copyButtons.forEach((button, index) => {
          button.addEventListener('click', function() {
            const urlToCopy = button.getAttribute('data-url');
            navigator.clipboard.writeText(urlToCopy);
          });
        });
      
        document.getElementById('copyButton')?.addEventListener('click', function() {
          navigator.clipboard.writeText(imageUrl);
        });
      }
      
    
  
      function generateSubUrls(imageUrl) {
        return [
          imageUrl,
          imageUrl.replace('https://telegra.ph', 'https://telegraph.cachefly.net'),
          imageUrl.replace('https://telegra.ph', 'https://i0.wp.com/telegra.ph'),
          imageUrl.replace('https://telegra.ph', 'https://i1.wp.com/telegraph.cachefly.net'),
          imageUrl.replace('https://telegra.ph', 'https://i2.wp.com/im.gurl.eu.org'),
          imageUrl.replace('https://telegra.ph', 'https://i3.wp.com/missuo.ru'),
          imageUrl.replace('https://telegra.ph', 'https://im.gurl.eu.org'),
          imageUrl.replace('https://telegra.ph', 'https://image.196629.xyz'),
          imageUrl.replace('https://telegra.ph', 'https://img1.131213.xyz'),
          imageUrl.replace('https://telegra.ph', 'https://missuo.ru')
        ];
      }
    </script>
  </body>
  <hr> <!-- 分隔符 -->
  <footer>
    <p>建议上传5M以内的JPG/PNG/JPEG/GIF图像、MP4视频</p>
    <p>文件格式兼容：jpg/jpeg/png/gif/m4v/mp4/jfif/pjpeg</p>
    <p>注意不兼容webp/mkv等格式和非图像视频格式的文件、大于5MB的文件</p>
    <p>该源码开源，仅供学习JS使用，违规使用后果自负</p>
  </footer>
  </html>`;