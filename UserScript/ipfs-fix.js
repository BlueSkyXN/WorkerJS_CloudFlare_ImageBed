// ==UserScript==
// @name         Custom IPFS Link Redirector
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Redirects IPFS links to a custom IPFS gateway
// @author       YourName
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 自定义 IPFS 网关地址
    var customIpfsGateway = "https://gateway.pinata.cloud/ipfs/";

    // 匹配 IPFS 链接的正则表达式
    var ipfsRegex = /\/ipfs\/(Qm\w+)/;

    // 处理所有的图片链接
    var imgs = document.querySelectorAll('img');

    for (var i = 0; i < imgs.length; i++) {
        var imgSrc = imgs[i].src;

        // 检查是否匹配 IPFS 链接
        var match = imgSrc.match(ipfsRegex);
        if (match) {
            var ipfsHash = match[1];  // 提取IPFS哈希值
            imgs[i].src = customIpfsGateway + ipfsHash;  // 替换为自定义网关链接
            console.log("Redirecting IPFS link to custom gateway:", imgs[i].src);
        }
    }

})();
