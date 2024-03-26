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
