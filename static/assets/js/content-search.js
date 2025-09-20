//关键词sug
var hotList = 0;
var searchType = "baidu"; // 默认搜索引擎
var thisSearch = "https://www.baidu.com/s?wd="; // 默认搜索引擎URL

$(function() {
    // 监听搜索类型变化
    $('.search-type input').on('change', function() {
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
    $('#search-text').keyup(function() {
        var keywords = $(this).val();
        if (keywords == '') { $('#word').hide(); return };
        
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
            beforeSend: function() {
                // $('#word').append('<li>正在加载。。。</li>');
            },
            success: function(res) {
                $('#word').empty().show();
                hotList = res.s.length;
                if (hotList) {
                    $("#word").css("display", "block");
                    for (var i = 0; i < hotList-1; i++) {
                        if (i===hotList-1){
                            $("#word").append('<li id="lastHot"><span>' + (i + 1) + "</span>" + res.s[i] + "</li>");
                        }
                        else{
                            $("#word").append("<li><span>" + (i + 1) + "</span>" + res.s[i] + "</li>");
                        }
                        $("#word li").eq(i).click(function() {
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
            error: function() {
                $('#word').empty().show();
                //$('#word').append('<div class="click_work">Fail "' + keywords + '"</div>');
                $('#word').hide();
            }
        })
    })

    // 点击搜索数据复制给搜索框
    $(document).on('click', '#word li', function() {
        var word = $(this).text().replace(/^[0-9]/, '');
        $('#search-text').val(word);
        $('#word').empty();
        $('#word').hide();
        //$("form").submit();
         $('.submit').trigger('click');//触发搜索事件
    })
    
    // 表单提交事件
    $('.super-search-fm').on('submit', function(e) {
        var keywords = $('#search-text').val();
        if (searchType === 'site') {
            e.preventDefault();
            performSiteSearch(keywords);
        }
    });
    
    // 点击搜索按钮事件
    $('.submit').on('click', function() {
        var keywords = $('#search-text').val();
        if (searchType === 'site') {
            performSiteSearch(keywords);
            return false;
        }
    });
    
    //$(document).on('click', '.container,.banner-video,nav', function() {
    $(document).on('click', '.io-grey-mode', function() {
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