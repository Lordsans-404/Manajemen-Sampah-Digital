const CONFIG = {
    API_BASE_URL: 'http://localhost:3000/api'
};

// Berita
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
        
        if (!this.container || !this.loading || !this.error) return; 
        
        await this.fetchData();
    },

    async fetchData() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/news`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const { data } = await response.json();
            
            if (!Array.isArray(data)) throw new Error("Format payload tidak valid.");

            this.allArticles = data;

            this.loading.classList.add('d-none');
            
            if (this.allArticles.length === 0) {
                this.container.innerHTML = '<div class="col-12 text-center text-muted fs-5">Belum ada berita.</div>';
                this.container.classList.remove('d-none');
            } else {
                this.container.classList.remove('d-none');
                this.paginationWrapper.classList.remove('d-none');
                this.renderPage(this.currentPage);
            }

        } catch (error) {
            console.error('[NewsModule]', error);
            this.loading.classList.add('d-none');
            this.error.classList.remove('d-none');
        }
    },

    renderPage(page) {
        this.currentPage = page;
        this.container.innerHTML = ''; 

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const articlesToShow = this.allArticles.slice(startIndex, endIndex);

        articlesToShow.forEach(article => {
            const card = document.createElement('div');
            card.className = 'col-12 col-md-6 col-lg-4 d-flex align-items-stretch';
            
            const fallbackImg = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=800&auto=format&fit=crop';
            const imgSrc = article.imageUrl ? article.imageUrl : fallbackImg;
            
            let descText = article.description ? this.escapeHTML(article.description) : 'Deskripsi tidak tersedia.';

            card.innerHTML = `
                <div class="card shadow-sm news-card w-100 border-0">
                    <div class="news-image-wrapper">
                        <img src="${imgSrc}" alt="Gambar Berita" onerror="this.src='${fallbackImg}'">
                    </div>
                    <div class="news-card-body">
                        <span class="news-source">${this.escapeHTML(article.source)}</span>
                        <h5 class="news-title line-clamp-2">${this.escapeHTML(article.title)}</h5>
                        <p class="card-text text-secondary small line-clamp-3 mb-4">${descText}</p>
                        
                        <div class="mt-auto d-flex justify-content-between align-items-center pt-3 border-top">
                            <small class="text-secondary fw-medium">${this.formatDate(article.publishedAt)}</small>
                            <a href="${article.url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-success rounded-pill px-3 fw-bold">
                                Baca
                            </a>
                        </div>
                    </div>
                </div>
            `;
            this.container.appendChild(card);
        });

        this.renderPaginationUI();
        
        // Scroll halus kembali ke atas container berita saat pindah halaman
        if (this.currentPage > 1) {
            window.scrollTo({ top: this.container.offsetTop - 100, behavior: 'smooth' });
        }
    },

    renderPaginationUI() {
        const totalPages = Math.ceil(this.allArticles.length / this.itemsPerPage);
        
        // Ganti class ul bawaan bootstrap dengan custom kita
        this.paginationList.className = 'dot-pagination mt-4 mb-2';
        this.paginationList.innerHTML = '';

        if (totalPages <= 1) {
            this.paginationWrapper.classList.add('d-none');
            return;
        }

        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `dot-item ${this.currentPage === i ? 'active' : ''}`;
            
            // Menggunakan aria-label demi aksesibilitas (Screen Reader)
            li.innerHTML = `<button class="dot-btn" aria-label="Halaman ${i}" title="Halaman ${i}"></button>`;
            
            li.onclick = () => this.renderPage(i);
            this.paginationList.appendChild(li);
        }
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
    },

    escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// ==========================================
// 2. MODUL STATISTIK (Impact Stats)
// ==========================================
const StatsModule = {
    async init() {
        this.container = document.getElementById('stats-narrative');
        if (!this.container) return;
        await this.fetchAndRender();
    },

    async fetchAndRender() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/stats`);
            if (!response.ok) return; // Silent fail untuk stats (karena ini opsional)
            
            const { data } = await response.json();
            
            if (data && data.narrative) {
                this.container.textContent = data.narrative;
                this.container.parentElement.classList.remove('d-none');
            }
        } catch (error) {
            console.error('[StatsModule]', error);
        }
    }
};

// ==========================================
// 3. MODUL KALKULATOR (AI Waste Calculator)
// ==========================================
const CalculatorModule = {
    init() {
        this.form = document.getElementById('calculator-form');
        this.itemList = document.getElementById('item-list');
        this.addBtn = document.getElementById('add-item-btn');
        this.resultContainer = document.getElementById('calculator-result');
        this.submitBtn = document.getElementById('submit-calc-btn');

        if (!this.form) return;

        this.bindEvents();
    },

    bindEvents() {
        // Event Delegation untuk tombol hapus baris
        this.itemList.addEventListener('click', (e) => {
            if (e.target.closest('.remove-item-btn')) {
                e.target.closest('.item-row').remove();
            }
        });

        // Tambah baris baru
        this.addBtn.addEventListener('click', () => this.addNewRow());

        // Submit form
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleCalculate();
        });
    },

    addNewRow() {
        const row = document.createElement('div');
        row.className = 'row g-2 mb-2 item-row align-items-center';
        row.innerHTML = `
            <div class="col-7">
                <input type="text" class="form-control item-type" placeholder="Contoh: Botol plastik aqua" required>
            </div>
            <div class="col-3">
                <input type="number" step="0.1" min="0.1" class="form-control item-weight" placeholder="Kg" required>
            </div>
            <div class="col-2 text-end">
                <button type="button" class="btn btn-outline-danger btn-sm remove-item-btn">&times;</button>
            </div>
        `;
        this.itemList.appendChild(row);
    },

    async handleCalculate() {
        // Ambil data dari form dinamis
        const rows = this.itemList.querySelectorAll('.item-row');
        const items = [];

        rows.forEach(row => {
            const type = row.querySelector('.item-type').value.trim();
            const weight = parseFloat(row.querySelector('.item-weight').value);
            if (type && weight > 0) {
                items.push({ type, weight });
            }
        });

        if (items.length === 0) {
            alert("Masukkan setidaknya 1 item dengan berat yang valid.");
            return;
        }

        // Set Loading State
        this.submitBtn.disabled = true;
        this.submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menghitung dengan AI...';
        this.resultContainer.innerHTML = '';
        this.resultContainer.classList.add('d-none');

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/waste/calculations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Gagal memproses kalkulasi');
            }

            this.renderResult(result.data);
            
            // Refresh stats karena data baru saja ditambahkan ke backend
            StatsModule.fetchAndRender(); 
            
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = 'Hitung Dampak';
        }
    },

    renderResult(data) {
        const { summary, details } = data;
        
        // Format Rupiah
        const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(num);

        let html = `
            <div class="alert alert-success mt-4">
                <h4 class="alert-heading fw-bold">Total Estimasi Pendapatan: ${formatIDR(summary.totalFinancial_IDR)}</h4>
                <hr>
                <div class="row text-center mt-3">
                    <div class="col-4">
                        <strong>☁️ CO2 Dicegah</strong><br>${summary.totalEnvironmentalImpact.co2Saved_Kg} Kg
                    </div>
                    <div class="col-4">
                        <strong>⚡ Energi Hemat</strong><br>${summary.totalEnvironmentalImpact.energySaved_Kwh} kWh
                    </div>
                    <div class="col-4">
                        <strong>💧 Air Hemat</strong><br>${summary.totalEnvironmentalImpact.waterSaved_Liters} L
                    </div>
                </div>
            </div>
            <h6 class="fw-bold mt-4">Detail Per Item (AI Analysis):</h6>
            <ul class="list-group">
        `;

        details.forEach(item => {
            html += `
                <li class="list-group-item d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto">
                        <div class="fw-bold text-capitalize">${item.originalInput} <span class="badge bg-secondary ms-1">${item.weight} Kg</span></div>
                        <small class="text-muted">Diklasifikasikan sebagai: <b>${item.label}</b> (${item.type})</small>
                    </div>
                    <span class="badge bg-success rounded-pill">${formatIDR(item.financial.subtotal)}</span>
                </li>
            `;
        });

        html += `</ul>`;
        
        this.resultContainer.innerHTML = html;
        this.resultContainer.classList.remove('d-none');
    }
};

// ==========================================
// INISIALISASI APLIKASI
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    StatsModule.init();
    CalculatorModule.init();
    NewsModule.init();
});