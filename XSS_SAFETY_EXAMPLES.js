// XSS 安全修复示例 (XSS Security Fix Examples)

// 🔴 不安全的代码 (Unsafe Code)
// resultItem.innerHTML = resultContent; // 可能导致XSS

// ✅ 安全的代码 (Safe Code)
function createResultItem(file, data, enablePreview) {
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    
    // 创建结构而不是使用innerHTML
    const buttonContainer = document.createElement('div');
    
    const copyButton = document.createElement('button');
    copyButton.className = 'btn btn-success mr-2 copy-button';
    copyButton.textContent = 'COPY URL';
    copyButton.onclick = function() { copyUrl(this); };
    
    const fileName = document.createElement('span');
    fileName.className = 'mr-2 file-name';
    fileName.textContent = file.name; // 使用textContent而不是innerHTML
    
    buttonContainer.appendChild(copyButton);
    buttonContainer.appendChild(fileName);
    
    const urlContainer = document.createElement('div');
    urlContainer.className = 'file-url';
    
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.className = 'form-control';
    urlInput.value = data; // 使用value属性，浏览器会自动转义
    urlInput.readOnly = true;
    
    urlContainer.appendChild(urlInput);
    
    resultItem.appendChild(buttonContainer);
    resultItem.appendChild(urlContainer);
    
    // 如果启用预览
    if (enablePreview) {
        const preview = document.createElement('div');
        preview.className = 'preview-container';
        
        const previewImg = document.createElement('img');
        previewImg.src = data; // 注意：这里仍需要验证URL的安全性
        previewImg.className = 'preview-img';
        previewImg.alt = '图片预览';
        
        // 添加错误处理
        previewImg.onerror = function() {
            this.style.display = 'none';
            const errorMsg = document.createElement('div');
            errorMsg.textContent = '预览加载失败';
            errorMsg.className = 'preview-error';
            preview.appendChild(errorMsg);
        };
        
        preview.appendChild(previewImg);
        resultItem.appendChild(preview);
    }
    
    return resultItem;
}

// HTML转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// URL验证函数
function isValidImageUrl(url) {
    try {
        const parsedUrl = new URL(url);
        // 只允许https协议
        if (parsedUrl.protocol !== 'https:') {
            return false;
        }
        // 检查域名白名单（可选）
        const allowedDomains = [
            'pic1.58cdn.com.cn',
            'pic2.58cdn.com.cn',
            // ... 其他允许的域名
        ];
        // 这里可以根据需要添加域名检查
        return true;
    } catch (e) {
        return false;
    }
}

// 安全的状态更新函数
function updateStatus(statusElement, message, isError = false) {
    // 清除之前的类
    statusElement.className = statusElement.className.replace(/\b(ok|error)\b/g, '');
    
    // 安全地设置文本内容
    statusElement.textContent = message;
    
    // 添加相应的状态类
    if (isError) {
        statusElement.classList.add('error');
    } else {
        statusElement.classList.add('ok');
    }
}