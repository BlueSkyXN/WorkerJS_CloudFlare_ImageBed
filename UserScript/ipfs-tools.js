// IPFS 网关列表
const IPFS_GATEWAYS = [
    "https://ipfs.io/ipfs/",
    "https://gateway.ipfsscan.io/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
    "https://eth.sucks/ipfs/",
    "https://hardbin.com/ipfs/",
    "https://gateway.ipfsscan.io/ipfs/",
    "https://i0.img2ipfs.com/ipfs/",
    "https://ipfs.raribleuserdata.com/ipfs/",
    "https://ipfs.crossbell.io/ipfs/",
    "https://ipfs.basedfellas.io/ipfs/",
    "https://gateway.v2ex.pro/ipfs/",
    "https://ipfs.interface.social/ipfs/",
    "https://ipfs.4everland.io/ipfs/",
    "https://ipfs.le7el.com/ipfs/",
    "https://gw-seattle.crustcloud.io/ipfs/",
    "https://ipfs.decentralized-content.com/ipfs/",
    "https://4everland.io/ipfs/",
    "https://c4rex.co/ipfs/",
    "https://ipfs.omakasea.com/ipfs/",
    "https://ipfs.joaoleitao.org/ipfs/",
    "https://proofs.filestar.info/ipfs/",
    "https://ipfs.eth.aragon.network/ipfs/",
    "https://ipfs.supremelegend.io/ipfs/",
    "https://pz-acyuix.meson.network/ipfs/",
    "https://trustless-gateway.link/ipfs/",
    "https://ipfs.cyou/ipfs/",
    "https://gw.ipfs-lens.dev/ipfs/",
    "https://ipfs.runfission.com/ipfs/",
    "https://nftstorage.link/ipfs/",
    "https://w3s.link/ipfs/",
    "https://dlunar.net/ipfs/",
    "https://storry.tv/ipfs/",
    "https://flk-ipfs.xyz/ipfs/"
];

const CONFIG = {
    TIMEOUT_MS: 20000,
    GATEWAY_TIMEOUT: 10000,
};

// HTML 模板
function getViewTemplate(cid, imageUrl) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>IPFS Content Viewer - ${cid}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: system-ui; padding: 2rem; max-width: 1200px; margin: 0 auto; }
                .content { margin: 2rem 0; }
                img, video { max-width: 100%; height: auto; }
                .meta { color: #666; font-size: 0.9rem; }
            </style>
        </head>
        <body>
            <h1>IPFS Content Viewer</h1>
            <div class="meta">CID: ${cid}</div>
            <div class="content">
                <img src="${imageUrl}" alt="IPFS Content" onerror="this.onerror=null; this.parentElement.innerHTML='<video src=\\'${imageUrl}\\' controls>不支持的内容格式</video>'">
            </div>
        </body>
        </html>
    `;
}

function getUrlsTemplate(cid, urls) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>IPFS Gateway URLs - ${cid}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: system-ui; padding: 2rem; max-width: 1200px; margin: 0 auto; }
                .url-list { margin: 2rem 0; }
                .url-item { padding: 0.5rem; border-bottom: 1px solid #eee; }
                .url-item:hover { background: #f5f5f5; }
                .copy-btn { float: right; padding: 0.25rem 0.5rem; }
            </style>
        </head>
        <body>
            <h1>IPFS Gateway URLs</h1>
            <div class="meta">CID: ${cid}</div>
            <div class="url-list">
                ${urls.map(url => `
                    <div class="url-item">
                        <button class="copy-btn" onclick="copyToClipboard('${url}')">Copy</button>
                        <a href="${url}" target="_blank">${url}</a>
                    </div>
                `).join('')}
            </div>
            <script>
                function copyToClipboard(text) {
                    navigator.clipboard.writeText(text).then(() => {
                        alert('URL copied!');
                    });
                }
            </script>
        </body>
        </html>
    `;
}

function getListTemplate(gateways) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>IPFS Gateway List</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { font-family: system-ui; padding: 2rem; max-width: 1200px; margin: 0 auto; }
                .gateway-list { margin: 2rem 0; }
                .gateway-item { padding: 0.5rem; border-bottom: 1px solid #eee; }
                .gateway-item:hover { background: #f5f5f5; }
            </style>
        </head>
        <body>
            <h1>IPFS Gateway List</h1>
            <div class="gateway-list">
                ${gateways.map((gateway, index) => `
                    <div class="gateway-item">
                        ${index + 1}. ${gateway}
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
    `;
}

// CID 格式验证
function isValidCID(cid) {
    const isV0 = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid);
    const isV1 = /^bafy[a-zA-Z2-7]{55}$/.test(cid);
    return isV0 || isV1;
}

async function checkGateway(gateway, cid, signal) {
    const startTime = Date.now();
    try {
        const response = await fetch(`${gateway}${cid}`, {
            method: 'HEAD',
            signal,
            headers: {
                'User-Agent': 'IPFS-Gateway-Checker/1.0',
            },
        });

        return {
            gateway,
            success: response.ok,
            status: response.status,
            latency: Date.now() - startTime,
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length'),
        };
    } catch (error) {
        return {
            gateway,
            success: false,
            latency: Date.now() - startTime,
            error: error.name === 'AbortError' ? 'timeout' : error.message
        };
    }
}

export default {
    async fetch(request) {
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/').filter(Boolean);
        const command = pathParts[0];
        const cid = pathParts[1];

        // 路由处理
        if (!command) {
            return new Response('Available endpoints: /check/{cid}, /view/{cid}, /urls/{cid}, /list', {
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        // 处理 /list 请求
        if (command === 'list') {
            return new Response(getListTemplate(IPFS_GATEWAYS), {
                headers: { 'Content-Type': 'text/html' }
            });
        }

        // 其他端点需要 CID
        if (!cid || !isValidCID(cid)) {
            return new Response(JSON.stringify({
                error: 'Invalid CID format',
                message: 'CID must be either IPFS v0 (Qm...) or v1 (bafy...) format'
            }), { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 处理不同的命令
        switch (command) {
            case 'check': {
                const startTime = Date.now();
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

                try {
                    const results = await Promise.allSettled(
                        IPFS_GATEWAYS.map(async gateway => {
                            const gatewayController = new AbortController();
                            const gatewayTimeout = setTimeout(
                                () => gatewayController.abort(), 
                                CONFIG.GATEWAY_TIMEOUT
                            );

                            try {
                                const result = await checkGateway(
                                    gateway, 
                                    cid, 
                                    gatewayController.signal
                                );
                                clearTimeout(gatewayTimeout);
                                return result;
                            } catch (error) {
                                clearTimeout(gatewayTimeout);
                                throw error;
                            }
                        })
                    );

                    clearTimeout(timeout);

                    const gatewayResults = results.map(r => 
                        r.status === 'fulfilled' ? r.value : {
                            gateway: r.reason.gateway,
                            success: false,
                            error: r.reason.message,
                            latency: 0
                        }
                    );

                    const successfulGateways = gatewayResults.filter(r => r.success);
                    const failedGateways = gatewayResults.filter(r => !r.success);

                    return new Response(JSON.stringify({
                        cid,
                        timestamp: new Date().toISOString(),
                        summary: {
                            total: IPFS_GATEWAYS.length,
                            successful: successfulGateways.length,
                            failed: failedGateways.length,
                            firstSuccess: successfulGateways[0] || null,
                            totalTime: Date.now() - startTime
                        },
                        successful: successfulGateways,
                        failed: failedGateways
                    }, null, 2), {
                        headers: {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        }
                    });
                } catch (error) {
                    return new Response(JSON.stringify({
                        error: 'Check failed',
                        message: error.message
                    }), { status: 500 });
                }
            }

            case 'view': {
                try {
                    // 快速检查一个可用网关
                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 5000);

                    const checkPromises = IPFS_GATEWAYS.map(async gateway => {
                        try {
                            const response = await fetch(`${gateway}${cid}`, {
                                method: 'HEAD',
                                signal: controller.signal
                            });
                            if (response.ok) return gateway;
                        } catch {
                            return null;
                        }
                    });

                    const availableGateway = await Promise.race(checkPromises);
                    clearTimeout(timeout);

                    if (!availableGateway) {
                        return new Response('No available gateway found', { status: 404 });
                    }

                    const imageUrl = `${availableGateway}${cid}`;
                    return new Response(getViewTemplate(cid, imageUrl), {
                        headers: { 'Content-Type': 'text/html' }
                    });
                } catch (error) {
                    return new Response('Failed to load content', { status: 500 });
                }
            }

            case 'urls': {
                const urls = IPFS_GATEWAYS.map(gateway => `${gateway}${cid}`);
                return new Response(getUrlsTemplate(cid, urls), {
                    headers: { 'Content-Type': 'text/html' }
                });
            }

            default:
                return new Response('Invalid endpoint', { status: 404 });
        }
    }
};
