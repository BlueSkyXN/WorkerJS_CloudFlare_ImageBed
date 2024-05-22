const fs = require('fs');
const path = require('path');

// 设置源文件和目标文件的路径
const srcDir = path.join(__dirname, '..', '..', 'cloudflare-page'); // cloudflare-page 目录的路径
const srcFilePath = path.join(srcDir, 'Tools-GoogleCache.html'); // 源文件路径
const destDir = path.join(__dirname, '..', '..', 'dist'); // 目标 dist 目录的路径
const destToolsDir = path.join(destDir, 'tools'); // 目标 tools 目录的路径
const destFilePath = path.join(destToolsDir, 'googlecache.html'); // 目标文件路径

// 确保目标目录存在
if (!fs.existsSync(destToolsDir)) {
    fs.mkdirSync(destToolsDir, { recursive: true });
}

// 检查源文件是否存在
if (fs.existsSync(srcFilePath)) {
    // 复制并重命名文件
    fs.copyFileSync(srcFilePath, destFilePath);
    console.log(`文件 ${srcFilePath} 已成功复制并重命名到 ${destFilePath}`);
} else {
    console.log(`源文件 ${srcFilePath} 不存在。`);
}
