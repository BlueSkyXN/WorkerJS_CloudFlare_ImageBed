// IPFS 网关列表
const IPFS_GATEWAYS = [
    "https://ipfs.io/ipfs/",          // 优先级高的网关放前面
    "https://gateway.ipfsscan.io/ipfs/",
    "https://gateway.pinata.cloud/ipfs/",
    "https://eth.sucks/ipfs/",
    "https://hardbin.com/ipfs/",
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
    TIMEOUT_MS: 20000,        // 总超时 20 秒
    GATEWAY_TIMEOUT: 10000,   // 单网关超时 10 秒
};

// CID 格式验证
function isValidCID(cid) {
    // V0: Qm 开头，后跟44个base58字符
    const isV0 = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/.test(cid);
    // V1: bafy 开头，后跟55个base32字符
    const isV1 = /^bafy[a-zA-Z2-7]{55}$/.test(cid);
    return isV0 || isV1;
}

function getCIDVersion(cid) {
    return cid.startsWith('Qm') ? 'v0' : 'v1';
}

// 错误分类统计
function getErrorStats(failedGateways) {
    return {
        timeout: failedGateways.filter(g => g.error === 'timeout').length,
        forbidden: failedGateways.filter(g => g.status === 403).length,
        serverError: failedGateways.filter(g => g.status >= 500).length,
        other: failedGateways.filter(g => !g.error && g.status < 500).length
    };
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
            performance: Date.now() - startTime < 1000 ? 'fast' : 
                        Date.now() - startTime < 3000 ? 'medium' : 'slow'
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

        if (pathParts[0] !== 'check' || !pathParts[1]) {
            return new Response('Usage: /check/{cid}', { 
                status: 404,
                headers: { 'Content-Type': 'text/plain' }
            });
        }

        const cid = pathParts[1];
        if (!isValidCID(cid)) {
            return new Response(JSON.stringify({
                error: 'Invalid CID format',
                message: 'CID must be either IPFS v0 (Qm...) or v1 (bafy...) format',
                example: {
                    v0: 'QmcTUUeqUK1n4SbR1Nni525JJeKNiChCiaXHbY3dg5GG4C',
                    v1: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
                }
            }), { 
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        try {
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

                successfulGateways.sort((a, b) => a.latency - b.latency);
                failedGateways.sort((a, b) => a.latency - b.latency);

                const response = {
                    cid,
                    cidVersion: getCIDVersion(cid),
                    timestamp: new Date().toISOString(),
                    summary: {
                        total: IPFS_GATEWAYS.length,
                        successful: successfulGateways.length,
                        failed: failedGateways.length,
                        firstSuccess: successfulGateways[0] || null,
                        totalTime: Date.now() - startTime,
                        averageLatency: successfulGateways.length > 0
                            ? Math.round(successfulGateways.reduce((sum, r) => sum + r.latency, 0) / successfulGateways.length)
                            : null,
                        errorStats: getErrorStats(failedGateways),
                        performanceBreakdown: {
                            fast: successfulGateways.filter(g => g.performance === 'fast').length,
                            medium: successfulGateways.filter(g => g.performance === 'medium').length,
                            slow: successfulGateways.filter(g => g.performance === 'slow').length
                        }
                    },
                    successful: successfulGateways,
                    failed: failedGateways
                };

                return new Response(JSON.stringify(response, null, 2), {
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*',
                        'Cache-Control': 'no-cache'
                    }
                });

            } catch (error) {
                clearTimeout(timeout);
                throw error;
            }

        } catch (error) {
            return new Response(JSON.stringify({
                error: 'Request failed',
                message: error.message,
                cid: cid,
                cidVersion: getCIDVersion(cid)
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }
    }
};
