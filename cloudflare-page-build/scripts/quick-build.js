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

    let finalApiEndpoint;
    // 检查API_ENDPOINT_BASE64环境变量是否存在
    if (process.env.API_ENDPOINT_BASE64) {
        // 如果存在，直接使用API_ENDPOINT_BASE64的值
        finalApiEndpoint = process.env.API_ENDPOINT_BASE64;
    } else if (process.env.API_ENDPOINT) {
        // 如果API_ENDPOINT_BASE64不存在，但API_ENDPOINT存在，将API_ENDPOINT的值转换为Base64编码
        finalApiEndpoint = Buffer.from(process.env.API_ENDPOINT).toString('base64');
    } else {
        // 如果两者都不存在，使用默认值并转换为Base64编码
        finalApiEndpoint = Buffer.from('https://github.com/BlueSkyXN/WorkerJS_CloudFlare_ImageBed').toString('base64');
    }

    // 在HTML文件内容中查找{{API_ENDPOINT_BASE64}}占位符，并用最终确定的Base64编码值替换它
    const result = data.replace(/{{API_ENDPOINT_BASE64}}/g, finalApiEndpoint);

    // 将修改后的内容写回文件
    fs.writeFile(destPath, result, 'utf8', function (err) {
         if (err) return console.log(err);
         // 解码finalApiEndpoint以显示实际URL
         const actualUrl = Buffer.from(finalApiEndpoint, 'base64').toString('utf8');
         console.log(`API_ENDPOINT_BASE64已替换为: ${finalApiEndpoint}, 实际URL是: ${actualUrl} 并保存到: ${destPath}`);
    });
});
