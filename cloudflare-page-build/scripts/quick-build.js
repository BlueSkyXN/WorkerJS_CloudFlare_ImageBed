const fs = require('fs');
const path = require('path');

// 设置源文件和目标文件的路径
const srcPath = path.join(__dirname, '..', '..', 'cloudflare-page', 'OneAPI-imgbed-MIX.html');
const destDir = path.join(__dirname, '..', '..', 'dist');
const destPath = path.join(destDir, 'index.html');

// 确保目标目录存在
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// 复制并重命名文件
fs.copyFileSync(srcPath, destPath);
console.log('文件已成功复制并重命名到:', destPath);

// 读取目标文件内容
fs.readFile(destPath, 'utf8', function (err, data) {
    if (err) {
        return console.log(err);
    }

    // 获取API_ENDPOINT环境变量的值，如果未设置，则使用默认值
    const apiEndpoint = process.env.API_ENDPOINT || 'https://github.com/BlueSkyXN/WorkerJS_CloudFlare_ImageBed';
    // 将API_ENDPOINT的值转换为Base64编码
    const encodedApiEndpoint = Buffer.from(apiEndpoint).toString('base64');

    // 在HTML文件内容中查找{{API_ENDPOINT_BASE64}}占位符，并用Base64编码后的API_ENDPOINT值替换它
    const result = data.replace(/{{API_ENDPOINT_BASE64}}/g, encodedApiEndpoint);

    // 将修改后的内容写回文件
    fs.writeFile(destPath, result, 'utf8', function (err) {
         if (err) return console.log(err);
         console.log('API_ENDPOINT已转换为Base64编码', encodedApiEndpoint, 'API_ENDPOINT已转换为', apiEndpoint, '并保存到:', destPath);
    });
});
