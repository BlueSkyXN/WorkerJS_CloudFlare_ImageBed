// ==UserScript==
// @name         IPFS Gateway Redirector with Fallback and Retry
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Redirects IPFS links to multiple fallback IPFS gateways with concurrent requests and retry mechanism
// @author       BlueSkyXN
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 定义多个 IPFS 网关，按优先级排列
    var ipfsGateways = [
        "https://gateway.pinata.cloud/ipfs/",
        "https://eth.sucks/ipfs/",
        "https://hardbin.com/ipfs/",
        "https://ipfs.raribleuserdata.com/ipfs/",
        "https://ipfs.crossbell.io/ipfs/",
        "https://ipfs.basedfellas.io/ipfs/",
        "https://ipfs.io/ipfs/"
    ];

    // 匹配 IPFS 链接的正则表达式
    var ipfsRegex = /\/ipfs\/(Qm\w+|baf\w+)/;

    // 处理所有的图片链接
    var imgs = document.querySelectorAll('img');

    // 自定义并发请求的网关数量
    var concurrentRequests = 2; 

    // 创建一个请求函数，返回一个 Promise
    function fetchFromGateway(gateway, hash) {
        return new Promise((resolve, reject) => {
            let img = new Image();
            img.src = gateway + hash;

            // 成功加载图片时解析 Promise
            img.onload = () => {
                resolve(gateway + hash);
            };

            // 图片加载失败时拒绝 Promise
            img.onerror = () => {
                reject("Failed to load from: " + gateway);
            };
        });
    }

    // 逐步按组并发请求网关
    async function tryIpfsGatewaysSequentially(img, hash, gateways) {
        let remainingGateways = gateways.slice(); // 复制网关列表
        let originalSrc = img.src;  // 保存原始 URL

        while (remainingGateways.length > 0) {
            // 取出一组并发网关
            let gatewaysToTry = remainingGateways.splice(0, concurrentRequests);
            
            try {
                // 并发请求多个网关，并返回第一个成功的
                let successfulUrl = await Promise.race(gatewaysToTry.map(gateway => fetchFromGateway(gateway, hash)));
                img.src = successfulUrl; // 设置为第一个成功的 URL
                console.log("Successfully loaded from:", successfulUrl);
                return; // 请求成功则停止
            } catch (error) {
                console.error(error); // 记录错误
            }
        }

        // 如果所有网关都失败了，再次尝试一次所有网关
        try {
            let successfulUrl = await Promise.race(gateways.map(gateway => fetchFromGateway(gateway, hash)));
            img.src = successfulUrl; // 设置为成功的 URL
            console.log("Second attempt successfully loaded from:", successfulUrl);
        } catch (error) {
            console.error("All gateways failed in second attempt. Returning to original URL.");
            img.src = originalSrc;  // 所有都失败后恢复原始 URL
        }
    }

    // 遍历每个图片链接
    for (var i = 0; i < imgs.length; i++) {
        var imgSrc = imgs[i].src;

        // 检查是否匹配 IPFS 链接
        var match = imgSrc.match(ipfsRegex);
        if (match) {
            var ipfsHash = match[1];  // 提取IPFS哈希值
            tryIpfsGatewaysSequentially(imgs[i], ipfsHash, ipfsGateways);  // 尝试按组并发请求网关
        }
    }

})();
