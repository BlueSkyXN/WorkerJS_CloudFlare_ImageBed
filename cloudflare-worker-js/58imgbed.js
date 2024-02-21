// Github @BlueSkyXN
// Code https://gist.github.com/BlueSkyXN/0be89e736cd2fe0418f77c034538c502
// 仅供学习CloudFlare Worker开发使用，违规使用后果自负
// License @GPLv3
// 记得修改98行左右的域名/URL为你的Worker的API节点，注意58图床会删图，只能临时、短期学习使用


addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    if (request.method === 'POST') {
        try {
            const requestBody = await request.json();
            const base64Data = requestBody.base64Data;

            const targetURL = "https://upload.58cdn.com.cn/json";
            const payload = {
                "Pic-Size": "0*0",
                "Pic-Encoding": "base64",
                "Pic-Path": "/nowater/webim/big/",
                "Pic-Data": base64Data
            };

            const targetResponse = await fetch(targetURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await targetResponse.text();
            return new Response('https://pic1.58cdn.com.cn/nowater/webim/big/' + result, {
                headers: { 'content-type': 'text/plain' },
            });
        } catch (error) {
            return new Response('Error processing request: ' + error.message, { status: 500 });
        }
    } else if (request.method === 'GET') {
        return new Response(htmlContent, {
            headers: { 'content-type': 'text/html' },
        });
    }
}

const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>58免费图床</title>
      <!-- 
        // 仅供学习CloudFlare Worker开发使用，违规使用后果自负
        // License @GPLv3
        -->
    <style>
        body {
            text-align: center;
        }
        #title {
            color: blue;
            font-size: 24px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div id="title">58免费图床</div>
    <input type="file" id="fileInput">
    <button onclick="uploadFile()">上传</button>
    <hr>
    <div id="tips">
        <div>建议上传5M以内的JPG/PNG文件</div>
        <div>该图床会在一定时间后删除图片</div>
        <div>图床支持pic1-8之间的任意子域名</div>
        <div>该源码开源，仅供学习JS使用，违规使用后果自负</div>
    </div>
    <hr>
    <div id="result">
        <a href="" id="resultLink" target="_blank"></a>
    </div>

    <script>
        async function uploadFile() {
            const fileInput = document.getElementById('fileInput');
            const file = fileInput.files[0];

            if (!file) {
                alert('请先选择一个文件');
                return;
            }

            const reader = new FileReader();

            reader.onloadend = async function() {
                try {
                    const base64String = reader.result.replace(/^data:.+;base64,/, '');
                    const response = await fetch('https://58imgbed.yourname.workers.dev/', {
                        method: 'POST',
                        body: JSON.stringify({ base64Data: base64String })
                    });
                    const resultUrl = await response.text();
                    document.getElementById('resultLink').href = resultUrl;
                    document.getElementById('resultLink').innerText = resultUrl;
                } catch (error) {
                    alert('上传失败，请重试。');
                }
            }

            reader.readAsDataURL(file);
        }
    </script>
</body>
</html>
`;
