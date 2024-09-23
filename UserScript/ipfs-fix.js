// ==UserScript==
// @name         IPFS Gateway Redirector with Fallback and Retry
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Redirects IPFS links to multiple fallback IPFS gateways with concurrent requests and retry mechanism
// @author       BlueSkyXN
// @match        *://*/*
// @grant        none
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/BlueSkyXN/WorkerJS_CloudFlare_ImageBed/main/UserScript/ipfs-fix.js
// @downloadURL  https://raw.githubusercontent.com/BlueSkyXN/WorkerJS_CloudFlare_ImageBed/main/UserScript/ipfs-fix.js
// ==/UserScript==

(function() {
    'use strict';

    // 定义多个 IPFS 网关，按优先级排列
    var ipfsGateways = [
        "https://gateway.pinata.cloud/ipfs/",
        "https://eth.sucks/ipfs/",
        "https://hardbin.com/ipfs/",
        "https://gateway.ipfsscan.io/ipfs/",
        "https://i0.img2ipfs.com/ipfs/",
        "https://ipfs.raribleuserdata.com/ipfs/",
        "https://ipfs.crossbell.io/ipfs/",
        "https://ipfs.basedfellas.io/ipfs/",
        "https://ipfs.io/ipfs/",
        "https://ipfs.interface.social/ipfs/",
        "https://ipfs.4everland.io/ipfs/",
        "https://ipfs.le7el.com/ipfs/",
        "https://gw-seattle.crustcloud.io/ipfs/",
        "https://ipfs.decentralized-content.com/ipfs/",
        "https://4everland.io/ipfs/",
        "https://c4rex.co/ipfs/",
        "https://ipfs.omakasea.com/ipfs/"
    ];

    // 匹配 IPFS 链接的正则表达式
    var ipfsRegex = /\/ipfs\/(Qm\w+|baf\w+)/;

    // 处理所有的图片链接
    var imgs = document.querySelectorAll('img');

    // 自定义并发请求的网关数量
    var concurrentRequests = 4; 

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
                console.error(`Failed to load from: ${gateway + hash}`);
                reject("Failed to load from: " + gateway);
            };
        });
    }

    // 逐步按组并发请求网关
    async function tryIpfsGatewaysSequentially(img, hash, gateways) {
        let remainingGateways = gateways.slice(); // 复制网关列表
        let originalSrc = img.src;  // 保存原始 URL
        console.log(`Original URL: ${originalSrc}`);

        while (remainingGateways.length > 0) {
            // 取出一组并发网关
            let gatewaysToTry = remainingGateways.splice(0, concurrentRequests);
            console.log(`Trying gateways: ${gatewaysToTry.join(', ')}`);

            try {
                // 并发请求多个网关，并返回第一个成功的
                let successfulUrl = await Promise.race(gatewaysToTry.map(gateway => fetchFromGateway(gateway, hash)));
                img.src = successfulUrl; // 设置为第一个成功的 URL
                console.log(`Successfully loaded from: ${successfulUrl}`);
                return; // 请求成功则停止
            } catch (error) {
                console.error(`Failed to load from current group of gateways: ${gatewaysToTry.join(', ')}`);
            }
        }

        // 如果所有网关都失败了，再次尝试一次所有网关
        console.log("All initial attempts failed, trying all gateways again...");
        try {
            let successfulUrl = await Promise.race(gateways.map(gateway => fetchFromGateway(gateway, hash)));
            img.src = successfulUrl; // 设置为成功的 URL
            console.log(`Second attempt successfully loaded from: ${successfulUrl}`);
        } catch (error) {
            console.error("All gateways failed in second attempt. Returning to original URL.");
            img.src = originalSrc;  // 所有都失败后恢复原始 URL
            console.log(`Restored original URL: ${originalSrc}`);
        }
    }

    // 遍历每个图片链接
    for (var i = 0; i < imgs.length; i++) {
        var imgSrc = imgs[i].src;

        // 检查是否匹配 IPFS 链接
        var match = imgSrc.match(ipfsRegex);
        if (match) {
            var ipfsHash = match[1];  // 提取IPFS哈希值
            console.log(`Found IPFS hash: ${ipfsHash}`);
            tryIpfsGatewaysSequentially(imgs[i], ipfsHash, ipfsGateways);  // 尝试按组并发请求网关
        }
    }

})();
