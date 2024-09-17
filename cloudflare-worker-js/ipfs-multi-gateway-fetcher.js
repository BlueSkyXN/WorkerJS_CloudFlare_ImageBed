addEventListener("fetch", event => {
    event.respondWith(handleRequest(event.request));
});

const ipfsGateways = [
    "https://gateway.pinata.cloud/ipfs/",
    "https://eth.sucks/ipfs/",
    "https://hardbin.com/ipfs/",
    "https://ipfs.raribleuserdata.com/ipfs/",
    "https://ipfs.crossbell.io/ipfs/",
    "https://ipfs.basedfellas.io/ipfs/",
    "https://ipfs.io/ipfs/"
];

/**
 * 处理传入请求
 * @param {Request} request
 */
async function handleRequest(request) {
    // 从 URL 提取 IPFS hash
    const url = new URL(request.url);
    const ipfsHash = url.pathname.replace("/", ""); // 提取 URL 路径中的 IPFS hash
    if (!ipfsHash) {
        return new Response("IPFS hash is missing.", { status: 400 });
    }

    // 生成并发请求
    const gatewayPromises = ipfsGateways.map(gateway => fetchGateway(gateway, ipfsHash));

    // 并发所有请求，返回最早的结果
    const results = await Promise.all(gatewayPromises);

    // 构造响应，返回请求结果
    const responseBody = JSON.stringify(results, null, 2);
    return new Response(responseBody, {
        headers: { "Content-Type": "application/json" },
    });
}

/**
 * 向指定 IPFS 网关发起请求，并返回状态信息
 * @param {string} gateway
 * @param {string} hash
 */
async function fetchGateway(gateway, hash) {
    const url = gateway + hash;
    const startTime = Date.now();

    try {
        // 首先尝试使用 HEAD 请求
        let response = await fetch(url, { method: "HEAD" });
        const elapsedTime = Date.now() - startTime;
        return {
            gateway: url,
            status: response.status,
            time: `${elapsedTime}ms`,
            method: "HEAD"
        };
    } catch (error) {
        // 如果 HEAD 请求失败，使用 GET 请求进行回退
        try {
            let response = await fetch(url, { method: "GET", headers: { "Range": "bytes=0-0" } }); // 仅请求文件的前1个字节
            const elapsedTime = Date.now() - startTime;
            return {
                gateway: url,
                status: response.status,
                time: `${elapsedTime}ms`,
                method: "GET with Range"
            };
        } catch (getError) {
            const elapsedTime = Date.now() - startTime;
            return {
                gateway: url,
                status: "Failed",
                time: `${elapsedTime}ms`,
                error: getError.toString()
            };
        }
    }
}
