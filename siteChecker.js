// site-checker.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const projectDir = path.join(__dirname,'./');
const outputPath = projectDir+'public/siteCheckResult.json';
const webstackPath = projectDir+'public/webstack.json';

async function checkSitesAvailability(sites) {
    const total = sites.length;
    let availableCount = 0;
    let unavailableCount = 0;
    let unknownCount = 0;
    const unavailableSites = [];
    let checkedCount = 0;

    console.log('开始检查网站可用性...');

    // 定义多种浏览器User-Agent，随机选择以增加真实性
    const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15'
    ];

    // 定义浏览器相关请求头
    const browserHeaders = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
    };

    // 重试机制
    async function retryRequest(fn, retries = 2) {
        try {
            return await fn();
        } catch (error) {
            if (retries > 0) {
                console.log(`  重试中... (剩余 ${retries} 次)`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒后重试
                return retryRequest(fn, retries - 1);
            }
            throw error;
        }
    }

    for (const site of sites) {
        // 去掉 URL 末尾的斜杠
        let cleanUrl = site.url;
        if (cleanUrl.endsWith('/')) {
            cleanUrl = cleanUrl.slice(0, -1);
        }
        
        try {
            // 随机选择User-Agent
            const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
            const headers = {
                'User-Agent': randomUserAgent,
                ...browserHeaders
            };

            // 首先尝试 HEAD 请求
            let response;
            try {
                response = await retryRequest(async () => {
                    return await axios.head(cleanUrl, {
                        timeout: 15000, // 15秒超时
                        headers: headers,
                        maxRedirects: 5, // 允许重定向
                        validateStatus: function (status) {
                            return status < 500; // 对于4xx状态码也resolve，稍后处理
                        }
                    });
                });
            } catch (headError) {
                // 如果 HEAD 请求失败，尝试 GET 请求但只接收状态码
                if (headError.code === 'ECONNABORTED' || headError.code === 'ETIMEDOUT') {
                    throw headError; // 超时错误直接抛出
                }
                
                // 使用另一种方式避免下载完整内容
                try {
                    // 尝试只获取头部，不获取响应体
                    response = await retryRequest(async () => {
                        return await axios.get(cleanUrl, {
                            timeout: 15000,
                            headers: headers,
                            responseType: 'stream', // 使用流模式
                            maxRedirects: 5,
                            validateStatus: function (status) {
                                return status < 500; // 对于4xx状态码也resolve，稍后处理
                            }
                        });
                    });
                    
                    // 只读取部分数据就终止连接
                    response.data.destroy();
                } catch (getResponseError) {
                    // 如果流式请求也失败，则重新抛出原始错误
                    throw headError;
                }
            }

            // 检查状态码
            if (response.status >= 200 && response.status < 400) {
                availableCount++;
                checkedCount++;
                console.log(`[${checkedCount}/${total}] ${site.title} (${cleanUrl}) - 可访问 (状态码: ${response.status})`);
            } else if (response.status >= 400 && response.status < 500) {
                // 特殊处理4xx错误，尝试使用不同配置再次验证
                try {
                    const altHeaders = {
                        'User-Agent': randomUserAgent,
                        'Accept': '*/*' // 更通用的Accept头
                    };
                    
                    const altResponse = await retryRequest(async () => {
                        return await axios.get(cleanUrl, {
                            timeout: 15000,
                            headers: altHeaders,
                            maxRedirects: 5,
                            // 只获取少量数据
                            responseType: 'stream',
                            validateStatus: function (status) {
                                return status < 500;
                            }
                        });
                    });
                    
                    altResponse.data.destroy();
                    
                    if (altResponse.status >= 200 && altResponse.status < 400) {
                        availableCount++;
                        checkedCount++;
                        console.log(`[${checkedCount}/${total}] ${site.title} (${cleanUrl}) - 可访问 (状态码: ${altResponse.status})`);
                    } else {
                        unavailableCount++;
                        checkedCount++;
                        unavailableSites.push({
                            title: site.title,
                            url: cleanUrl,
                            status: `HTTP错误: ${response.status}`
                        });
                        console.log(`[${checkedCount}/${total}] ${site.title} (${cleanUrl}) - 不可访问 (状态码: ${response.status})`);
                    }
                } catch (altError) {
                    unavailableCount++;
                    checkedCount++;
                    unavailableSites.push({
                        title: site.title,
                        url: cleanUrl,
                        status: `HTTP错误: ${response.status}`
                    });
                    console.log(`[${checkedCount}/${total}] ${site.title} (${cleanUrl}) - 不可访问 (状态码: ${response.status})`);
                }
            } else {
                // 5xx服务器错误
                unavailableCount++;
                checkedCount++;
                unavailableSites.push({
                    title: site.title,
                    url: cleanUrl,
                    status: `HTTP错误: ${response.status}`
                });
                console.log(`[${checkedCount}/${total}] ${site.title} (${cleanUrl}) - 不可访问 (状态码: ${response.status})`);
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
                // 超时情况
                unknownCount++;
                checkedCount++;
                unavailableSites.push({
                    title: site.title,
                    url: cleanUrl,
                    status: '检测超时'
                });
                console.log(`[${checkedCount}/${total}] ${site.title} (${cleanUrl}) - 检测超时`);
            } else if (error.message && error.message.includes('Hostname/IP does not match certificate')) {
                // SSL证书不匹配错误
                unknownCount++;
                checkedCount++;
                unavailableSites.push({
                    title: site.title,
                    url: cleanUrl,
                    status: 'SSL证书不匹配'
                });
                console.log(`[${checkedCount}/${total}] ${site.title} (${cleanUrl}) - SSL证书不匹配`);
            } else {
                // 其他错误情况
                unavailableCount++;
                checkedCount++;
                unavailableSites.push({
                    title: site.title,
                    url: cleanUrl,
                    status: error.message
                });
                console.log(`[${checkedCount}/${total}] ${site.title} (${cleanUrl}) - 不可访问: ${error.message}`);
            }
        }
    }

    // 输出总结
    console.log('\n检查完成:');
    console.log(`总网站数: ${total}`);
    console.log(`可访问: ${availableCount}`);
    console.log(`不可访问: ${unavailableCount}`);
    console.log(`状态未知: ${unknownCount}`);

    if (unavailableSites.length > 0) {
        console.log('\n可能不可访问的网站:');
        unavailableSites.forEach(site => {
            console.log(`- ${site.title}: ${site.url} (${site.status})`);
        });
    } else {
        console.log('\n所有网站均可正常访问！');
    }

    // 可选：将结果保存到文件
    const result = {
        timestamp: new Date().toISOString(),
        summary: {
            total,
            available: availableCount,
            unavailable: unavailableCount,
            unknown: unknownCount
        },
        unavailableSites
    };

    // 将结果保存到项目根目录
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log('\n结果已保存到 ',outputPath);
}

// 读取网站列表并执行检查
async function main() {
    try {
        // 从文件读取网站列表，或使用默认列表
        let sites;
        // 检查 public 目录下的 webstack.json
        if (fs.existsSync(webstackPath)) {
            const data = fs.readFileSync(webstackPath, 'utf8');
            sites = JSON.parse(data);
            console.log(`从 ${webstackPath} 加载了 ${sites.length} 个网站`);
        } else {
            console.log('未找到 webstack.json，使用默认测试数据');
            sites = [
                {title: 'GitHub', url: 'https://github.com'},
                {title: '百度', url: 'https://www.baidu.com'},
                {title: '语雀', url: 'https://www.yuque.com'},
                {title: '开源中国', url: 'https://www.oschina.net'},
                {title: 'GitHub 404', url: 'https://github.com/this-url-should-not-exist'}
            ];
        }

        await checkSitesAvailability(sites);
    } catch (error) {
        console.error('执行检查时出错:', error.message);
    }
}

main();