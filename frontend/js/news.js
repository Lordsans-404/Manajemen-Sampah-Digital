/**
 * @fileoverview
 * News loading and pagination logic for news.html.
 */

const NewsModule = {
    allArticles: [],  
    currentPage: 1,
    itemsPerPage: 6,   

    async init() {
        this.container         = document.getElementById('news-container');
        this.loading           = document.getElementById('loading-state'); 
        this.error             = document.getElementById('error-state');   
        this.paginationWrapper = document.getElementById('pagination-wrapper');
        this.paginationList    = document.getElementById('pagination-container');
        
        if (!this.container) return; 
        await this.fetchData();
    },

    async fetchData() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/news`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const { data } = await response.json();
            this.allArticles = data;
            if (this.loading) this.loading.classList.add('d-none');
            
            if (this.allArticles.length === 0) {
                this.container.innerHTML = '<div class="col-12 text-center text-muted">Belum ada berita.</div>';
            } else {
                this.container.classList.remove('d-none');
                if (this.paginationWrapper) this.paginationWrapper.classList.remove('d-none');
                this.renderPage(this.currentPage);
            }
        } catch (error) {
            console.error('[NewsModule]', error);
            if (this.loading) this.loading.classList.add('d-none');
            if (this.error) this.error.classList.remove('d-none');
        }
    },

    renderPage(page) {
        this.currentPage = page;
        this.container.innerHTML = ''; 
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const articlesToShow = this.allArticles.slice(startIndex, startIndex + this.itemsPerPage);

        articlesToShow.forEach(article => {
            const card = document.createElement('div');
            card.className = 'col-12 col-md-6 col-lg-4 d-flex align-items-stretch';
            const fallbackImg = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=800&auto=format&fit=crop';
            card.innerHTML = `
                <div class="card shadow-sm news-card w-100 border-0 mb-4">
                    <div class="news-image-wrapper">
                        <img src="${article.imageUrl || fallbackImg}" alt="News" onerror="this.src='${fallbackImg}'">
                    </div>
                    <div class="news-card-body p-4 d-flex flex-column">
                        <span class="news-source text-success fw-bold small text-uppercase mb-2">${article.source}</span>
                        <h5 class="news-title fw-bold line-clamp-2">${article.title}</h5>
                        <p class="text-secondary small line-clamp-3 mb-4">${article.description || ''}</p>
                        <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                            <small class="text-muted">${this.formatDate(article.publishedAt)}</small>
                            <a href="${article.url}" target="_blank" class="btn btn-sm btn-outline-success rounded-pill px-3">Baca</a>
                        </div>
                    </div>
                </div>`;
            this.container.appendChild(card);
        });
        this.renderPaginationUI();
    },

    renderPaginationUI() {
        const totalPages = Math.ceil(this.allArticles.length / this.itemsPerPage);
        if (!this.paginationList || totalPages <= 1) return;
        this.paginationList.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `dot-item ${this.currentPage === i ? 'active' : ''}`;
            li.innerHTML = `<button class="dot-btn"></button>`;
            li.onclick = () => this.renderPage(i);
            this.paginationList.appendChild(li);
        }
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateStr));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    NewsModule.init();
});
