class SiteSearch {
    constructor() {
        this.index = null;
        this.init();
    }

    async init() {
        try {
            console.log('正在加载搜索索引...');
            const response = await fetch('/index.json');
            this.index = await response.json();
            console.log('搜索索引加载完成:', this.index);
            this.bindEvents();
        } catch (error) {
            console.error('Failed to load search index:', error);
        }
    }

    bindEvents() {
        const searchInput = document.getElementById('search-text');
        const searchModalInput = document.getElementById('m_search-text');
        const searchResults = document.getElementById('search-results');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.performSearch(e.target.value));
        }

        if (searchModalInput) {
            searchModalInput.addEventListener('input', (e) => this.performSearch(e.target.value));
        }

        // 处理模态框搜索
        const searchModal = document.getElementById('search-modal');
        if (searchModal) {
            searchModal.addEventListener('shown.bs.modal', () => {
                if (searchModalInput) {
                    searchModalInput.focus();
                }
            });
        }

        // 处理表单提交事件，支持站内搜索
        const searchForm = document.querySelector('.super-search-fm');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
    }

    handleFormSubmit(e) {
        const searchInput = document.querySelector('.search-key');
        if (searchInput && searchInput.getAttribute('zhannei') === 'true') {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query.length >= 2) {
                this.performSearch(query);
                // 滚动到搜索结果区域
                const searchResults = document.getElementById('search-results');
                if (searchResults) {
                    searchResults.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    }

    performSearch(query) {
        console.log('执行搜索:', query);
        if (!query || query.length < 2) {
            this.clearResults();
            return;
        }

        const results = this.search(query);
        this.displayResults(results, query);
    }

    search(query) {
        if (!this.index || !this.index.pages) return [];

        const terms = query.toLowerCase().split(' ');
        const results = [];

        this.index.pages.forEach(page => {
            const title = (page.title || '').toLowerCase();
            const content = (page.content || '').toLowerCase();
            const description = (page.description || '').toLowerCase();
            
            let score = 0;
            
            terms.forEach(term => {
                // 在标题中匹配权重更高
                const titleMatches = (title.match(new RegExp(term, 'g')) || []).length;
                score += titleMatches * 10;
                
                // 在内容中匹配
                const contentMatches = (content.match(new RegExp(term, 'g')) || []).length;
                score += contentMatches;
                
                // 在描述中匹配
                const descriptionMatches = (description.match(new RegExp(term, 'g')) || []).length;
                score += descriptionMatches * 5;
            });

            if (score > 0) {
                results.push({
                    ...page,
                    score
                });
            }
        });

        // 按分数排序
        return results.sort((a, b) => b.score - a.score).slice(0, 10);
    }

    displayResults(results, query) {
        const searchResultsContainer = document.getElementById('search-results');
        if (!searchResultsContainer) return;

        if (results.length === 0) {
            searchResultsContainer.innerHTML = '<div class="text-center text-muted py-5">未找到相关结果</div>';
            return;
        }

        let html = '';
        results.forEach(result => {
            // 高亮关键词
            const highlightedTitle = this.highlightText(result.title, query);
            const highlightedDescription = result.description ? 
                this.highlightText(result.description, query) : 
                this.truncateText(result.content, 120);

            html += `
                <a href="${result.url}" class="search-result-item" target="_blank">
                    <div class="search-result-title">${highlightedTitle}</div>
                    <div class="search-result-description">${highlightedDescription}</div>
                </a>
            `;
        });

        searchResultsContainer.innerHTML = html;
    }

    highlightText(text, query) {
        if (!text || !query) return text || '';
        
        const terms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        let highlightedText = text;
        
        terms.forEach(term => {
            const regex = new RegExp(`(${this.escapeRegExp(term)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark class="bg-warning">$1</mark>');
        });
        
        return highlightedText;
    }

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    truncateText(text, length) {
        if (!text) return '';
        return text.length > length ? text.substring(0, length) + '...' : text;
    }

    clearResults() {
        const searchResultsContainer = document.getElementById('search-results');
        if (searchResultsContainer) {
            searchResultsContainer.innerHTML = '';
        }
    }
}

// 初始化搜索功能
document.addEventListener('DOMContentLoaded', function() {
    console.log('正在初始化站内搜索功能...');
    window.siteSearch = new SiteSearch();
});