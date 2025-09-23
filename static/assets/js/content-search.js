//关键词sug
var hotList = 0;
var searchType = "baidu"; // 默认搜索引擎
var thisSearch = "https://www.baidu.com/s?wd="; // 默认搜索引擎URL

$(function () {
    // 监听搜索类型变化
    $('.search-type input').on('change', function () {
        searchType = $(this).attr('id').replace('type-', '');
        thisSearch = $(this).val();

        // 如果是站内搜索，修改表单提交行为
        if (searchType === 'site') {
            $('.super-search-fm').attr('action', 'javascript:;');
            $('.super-search-fm').attr('target', '_self');
        } else {
            $('.super-search-fm').attr('action', thisSearch.split('?')[0]);
            $('.super-search-fm').attr('target', '_blank');
        }

        // 更新搜索框的占位符
        $('#search-text').attr('placeholder', $(this).attr('data-placeholder'));
    });

    // 当键盘键被松开时发送Ajax获取数据
    $('#search-text').keyup(function () {
        var keywords = $(this).val();
        if (keywords == '') {
            $('#word').hide();
            return
        }
        ;

        // 如果是站内搜索，不使用百度建议词
        if (searchType === 'site') {
            $('#word').hide();
            return;
        }

        $.ajax({
            url: 'https://suggestion.baidu.com/su?wd=' + keywords,
            dataType: 'jsonp',
            jsonp: 'cb', //回调函数的参数名(键值)key
            // jsonpCallback: 'fun', //回调函数名(值) value
            beforeSend: function () {
                // $('#word').append('<li>正在加载。。。</li>');
            },
            success: function (res) {
                $('#word').empty().show();
                hotList = res.s.length;
                if (hotList) {
                    $("#word").css("display", "block");
                    for (var i = 0; i < hotList - 1; i++) {
                        if (i === hotList - 1) {
                            $("#word").append('<li id="lastHot"><span>' + (i + 1) + "</span>" + res.s[i] + "</li>");
                        } else {
                            $("#word").append("<li><span>" + (i + 1) + "</span>" + res.s[i] + "</li>");
                        }
                        $("#word li").eq(i).click(function () {
                            $('#search-text').val(this.childNodes[1].nodeValue);
                            if (searchType === 'site') {
                                performSiteSearch(this.childNodes[1].nodeValue);
                            } else {
                                window.open(thisSearch + this.childNodes[1].nodeValue);
                            }
                            $('#word').css('display', 'none')
                        });
                        if (i === 0) {
                            $("#word ul li").eq(i).css({
                                "border-top": "none"
                            });
                            $("#word ul span").eq(i).css({
                                "color": "#fff",
                                "background": "#f54545"
                            })
                        } else if (i === 1) {
                            $("#word ul span").eq(i).css({
                                "color": "#fff",
                                "background": "#ff8547"
                            })
                        } else if (i === 2) {
                            $("#word ul span").eq(i).css({
                                "color": "#fff",
                                "background": "#ffac38"
                            })
                        }
                    }
                } else {
                    $("#word").css("display", "none")
                }
            },
            error: function () {
                $('#word').empty().show();
                //$('#word').append('<div class="click_work">Fail "' + keywords + '"</div>');
                $('#word').hide();
            }
        })
    })

    // 点击搜索数据复制给搜索框
    $(document).on('click', '#word li', function () {
        var word = $(this).text().replace(/^[0-9]/, '');
        $('#search-text').val(word);
        $('#word').empty();
        $('#word').hide();
        //$("form").submit();
        $('.submit').trigger('click');//触发搜索事件
    })

    // 表单提交事件
    $('.super-search-fm').on('submit', function (e) {
        var keywords = $('#search-text').val();
        if (searchType === 'site') {
            e.preventDefault();
            performSiteSearch(keywords);
        }
    });

    // 点击搜索按钮事件
    $('.submit').on('click', function () {
        var keywords = $('#search-text').val();
        if (searchType === 'site') {
            performSiteSearch(keywords);
            return false;
        }
    });

    //$(document).on('click', '.container,.banner-video,nav', function() {
    $(document).on('click', '.io-grey-mode', function () {
        $('#word').empty();
        $('#word').hide();
    })

})

// 站内搜索函数
function performSiteSearch(keywords) {
    if (!keywords) return;

    // 创建一个新页面显示搜索结果
    var searchWindow = window.open('', '_blank');
    var searchContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>站内搜索: ${keywords}</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                margin: 20px;
                background-color: #f8f9fa;
            }
            .search-header {
                margin-bottom: 20px;
                padding: 15px;
                background: white;
                border-radius: 5px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .search-result { 
                margin-bottom: 20px; 
                padding: 15px; 
                border: 1px solid #ddd; 
                border-radius: 5px;
                background: white;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .search-title { 
                font-size: 18px; 
                font-weight: bold; 
                color: #1a0dab; 
                text-decoration: none;
                margin-bottom: 5px;
                display: block;
            }
            .search-title:hover {
                text-decoration: underline;
            }
            .search-url { 
                color: #006621; 
                font-size: 14px;
                margin-bottom: 5px;
            }
            .search-description { 
                color: #545454; 
                margin: 5px 0;
                line-height: 1.4;
            }
            .search-highlight { 
                background-color: yellow;
                font-weight: bold;
            }
            .no-results {
                text-align: center;
                padding: 40px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="search-header">
            <h1>站内搜索: "${keywords}"</h1>
        </div>
        <div id="search-results">正在搜索...</div>
        <script>
            (function() {
                // 模拟搜索结果
                var results = [
                    {
                        title: "WebStack-Hugo 网址导航",
                        url: "/",
                        description: "这是一个基于 Hugo 构建的静态网址导航主题，适配了大量网站，可以作为个人或团队的网址导航站点。"
                    },
                    {
                        title: "关于页面",
                        url: "/about",
                        description: "关于 WebStack-Hugo 项目的详细介绍和使用说明。"
                    }
                ];
                
                var resultsContainer = document.getElementById('search-results');
                
                if (results.length > 0) {
                    var html = '';
                    results.forEach(function(result) {
                        html += '<div class="search-result">';
                        html += '<a href="' + result.url + '" class="search-title">' + highlightKeywords(result.title, "${keywords}") + '</a>';
                        html += '<div class="search-url">' + result.url + '</div>';
                        html += '<div class="search-description">' + highlightKeywords(result.description, "${keywords}") + '</div>';
                        html += '</div>';
                    });
                    resultsContainer.innerHTML = html;
                } else {
                    resultsContainer.innerHTML = '<div class="no-results"><p>未找到与 "${keywords}" 相关的内容</p></div>';
                }
                
                function highlightKeywords(text, keywords) {
                    var regex = new RegExp('(' + keywords + ')', 'gi');
                    return text.replace(regex, '<span class="search-highlight">$1</span>');
                }
            })();
        <\/script>
    </body>
    </html>`;

    searchWindow.document.write(searchContent);
    searchWindow.document.close();
}


// 添加网站检查按钮的点击事件处理
function checkWebURL() {
    // 创建模态框显示检查结果
    var modalHtml = `
    <div class="modal fade" id="checkUrlModal" tabindex="-1" role="dialog" aria-labelledby="checkUrlModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="checkUrlModalLabel">网站可用性检查</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="progress">
                        <div id="checkProgress" class="progress-bar" role="progressbar" style="width: 0%"></div>
                    </div>
                    <div id="checkSummary" class="mt-3"></div>
                    <div id="checkResults" class="mt-3"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">关闭</button>
                </div>
            </div>
        </div>
    </div>`;

    if ($('#checkUrlModal').length === 0) {
        $('body').append(modalHtml);
    }

    $('#checkUrlModal').modal('show');

    // 初始化检查状态
    $('#checkProgress').css('width', '0%');
    $('#checkSummary').html('<p>正在检查网站可用性...</p>');
    $('#checkResults').empty();

    // 获取网站数据
    // 从webstack.json获取链接
    $.getJSON('/webstack.json', function (data) {
        var sites = data;
        checkSitesAvailability(sites);
    }).fail(function () {
        // 如果无法获取webstack.json，则使用默认测试链接
        var sites = [
            {title: 'GitHub', url: 'https://github.com'},
            {title: '百度', url: 'https://www.baidu.com'},
            {title: '语雀', url: 'https://www.yuque.com'},
            {title: '开源中国', url: 'https://www.oschina.net'},
            {title: 'GitHub 404', url: 'https://github.com/this-url-should-not-exist'}
        ];
        checkSitesAvailability(sites);
    });
}

function checkSitesAvailability(sites) {
    var total = sites.length;
    var availableCount = 0;
    var unavailableCount = 0;
    var unknownCount = 0; // 新增：无法确定状态的网站数量
    var unavailableSites = [];
    var checkedCount = 0;

    if (total === 0) {
        $('#checkSummary').html('<p class="text-warning">未找到网站链接进行检查。</p>');
        $('#checkProgress').css('width', '100%');
        return;
    }

    sites.forEach(function (site) {
        // 使用 fetch API 检查网站可用性
        // 去掉 URL 末尾的斜杠
        var cleanUrl = site.url;
        if (cleanUrl.endsWith('/')) {
            cleanUrl = cleanUrl.slice(0, -1);
        }
        var controller = new AbortController();
        var timeout = setTimeout(() => controller.abort(), 10000); // 10秒超时

        fetch(cleanUrl, {
            method: 'HEAD', // 使用 HEAD 请求以减少数据传输
            mode: 'no-cors', // 使用 no-cors 模式避免跨域问题
            signal: controller.signal
        })
            .then(response => {
                clearTimeout(timeout);
                // 对于 no-cors 模式，我们无法获取确切的状态码
                // 但只要能到达 then，就表示网站可以访问
                availableCount++;
                checkedCount++;
                updateCheckProgress(checkedCount, total, availableCount, unavailableCount, unknownCount, unavailableSites);
            })
            .catch(error => {
                clearTimeout(timeout);
                // 如果是超时错误
                if (error.name === 'AbortError') {
                    unknownCount++; // 改为未知状态而不是直接标记为不可访问
                    checkedCount++;
                    unavailableSites.push({
                        title: site.title,
                        url: cleanUrl,
                        status: '检测超时'
                    });
                    updateCheckProgress(checkedCount, total, availableCount, unavailableCount, unknownCount, unavailableSites);
                } else {
                    // 尝试检查 favicon 是否可以访问
                    var faviconUrl = cleanUrl + '/favicon.ico';
                    var faviconController = new AbortController();
                    var faviconTimeout = setTimeout(() => faviconController.abort(), 5000); // 5秒超时

                    fetch(faviconUrl, {
                        method: 'HEAD',
                        mode: 'no-cors',
                        signal: faviconController.signal
                    })
                        .then(faviconResponse => {
                            clearTimeout(faviconTimeout);
                            // 如果能成功获取 favicon，则认为网站可访问
                            availableCount++;
                            checkedCount++;
                            updateCheckProgress(checkedCount, total, availableCount, unavailableCount, unknownCount, unavailableSites);
                        })
                        .catch(faviconError => {
                            clearTimeout(faviconTimeout);
                            // 处理 favicon 请求被客户端阻止的情况
                            if (faviconError.name === 'TypeError' &&
                                (faviconError.message.includes('Failed to fetch') ||
                                    faviconError.message.includes('blocked'))) {
                                // 请求被阻止，这可能是因为浏览器扩展或安全设置
                                // 我们无法确定网站状态，标记为未知
                                unknownCount++;
                                checkedCount++;
                                unavailableSites.push({
                                    title: site.title,
                                    url: cleanUrl,
                                    status: '客户端阻止'
                                });
                                updateCheckProgress(checkedCount, total, availableCount, unavailableCount, unknownCount, unavailableSites);
                                return;
                            }

                            // favicon 也无法获取，尝试使用图片加载方式作为备选方案
                            var img = new Image();
                            var imgTimeout = setTimeout(function () {
                                unknownCount++; // 改为未知状态
                                checkedCount++;
                                unavailableSites.push({
                                    title: site.title,
                                    url: cleanUrl,
                                    status: '状态未知'
                                });
                                updateCheckProgress(checkedCount, total, availableCount, unavailableCount, unknownCount, unavailableSites);
                                img.onerror = img.onload = null;
                            }, 5000);

                            img.onerror = function () {
                                clearTimeout(imgTimeout);
                                // 即使图片加载失败，也不代表网站不可访问，标记为状态未知
                                unknownCount++;
                                checkedCount++;
                                unavailableSites.push({
                                    title: site.title,
                                    url: cleanUrl,
                                    status: '状态未知'
                                });
                                updateCheckProgress(checkedCount, total, availableCount, unavailableCount, unknownCount, unavailableSites);
                            };

                            img.onload = function () {
                                clearTimeout(imgTimeout);
                                availableCount++;
                                checkedCount++;
                                updateCheckProgress(checkedCount, total, availableCount, unavailableCount, unknownCount, unavailableSites);
                            };

                            // 尝试加载网站的favicon作为备选测试
                            img.src = faviconUrl + '?' + new Date().getTime();
                        });
                }
            });
    });
}

function updateCheckProgress(checkedCount, total, availableCount, unavailableCount, unknownCount, unavailableSites) {
    var progress = Math.round((checkedCount / total) * 100);
    $('#checkProgress').css('width', progress + '%');

    var summaryHtml = `
        <p>检查进度: ${checkedCount}/${total}</p>
        <p>可访问: <span class="text-success">${availableCount}</span> 个网站</p>
        <p>不可访问: <span class="text-danger">${unavailableCount}</span> 个网站</p>
        <p>状态未知: <span class="text-warning">${unknownCount}</span> 个网站</p>
    `;

    $('#checkSummary').html(summaryHtml);

    // 检查完成时显示详细结果
    if (checkedCount === total) {
        var resultsHtml = '';
        if (unavailableSites.length > 0) {
            resultsHtml += '<h5>可能不可访问的网站:</h5><ul class="list-group">';
            unavailableSites.forEach(function (site) {
                var badgeClass = 'badge-danger';
                if (site.status === '检测超时' || site.status === '状态未知') {
                    badgeClass = 'badge-warning';
                } else if (site.status === '客户端阻止') {
                    badgeClass = 'badge-info';
                }

                resultsHtml += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${site.title}
                        <span>
                            <a href="${site.url}" target="_blank">${site.url}</a>
                            <span class="badge ${badgeClass} badge-pill ml-2">${site.status}</span>
                        </span>
                    </li>
                `;
            });
            resultsHtml += '</ul>';
            resultsHtml += '<div class="alert alert-info mt-3"><strong>提示:</strong> 标记为"状态未知"、"检测超时"或"客户端阻止"的网站可能仍然可以正常访问，建议手动检查确认。<br>"客户端阻止"表示请求被浏览器扩展或安全设置阻止。</div>';
        } else {
            resultsHtml += '<p class="text-success">所有网站均可正常访问！</p>';
        }

        $('#checkResults').html(resultsHtml);
    }
}
