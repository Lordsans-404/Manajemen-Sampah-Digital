/**
 * @fileoverview
 * Gabungan News, AI Calculator, dan Recycle Locator (Peta Interaktif).
 */

const CONFIG = {
    API_BASE_URL: 'http://localhost:3000/api'
};

// Newssssss
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

    // fetch data news dari BE
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

    // render cardnya
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

// kalkulator dampak - pakai gemini ai biar lebih fleksibel wkwk
const AICalculator = {
    init() {
        this.form = document.getElementById('calculator-form');
        this.itemList = document.getElementById('item-list');
        this.resultContainer = document.getElementById('calculator-result');
        this.submitBtn = document.getElementById('submit-calc-btn');
        if (!this.form) return;
        this.bindEvents();
    },

    bindEvents() {
        document.getElementById('add-item-btn')?.addEventListener('click', () => {
            const row = document.createElement('div');
            row.className = 'row g-2 mb-2 item-row align-items-center';
            row.innerHTML = `
                <div class="col-7"><input type="text" class="form-control item-type bg-light border-0" placeholder="Item spesifik..." required></div>
                <div class="col-3"><input type="number" step="0.1" class="form-control item-weight bg-light border-0" placeholder="Kg" required></div>
                <div class="col-2 text-end"><button type="button" class="btn btn-sm text-danger remove-item-btn"><i class="fas fa-times"></i></button></div>`;
            this.itemList.appendChild(row);
        });

        this.itemList.addEventListener('click', (e) => {
            if (e.target.closest('.remove-item-btn')) e.target.closest('.item-row').remove();
        });

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.calculate();
        });
    },

    async calculate() {
        const rows = this.itemList.querySelectorAll('.item-row');
        const items = Array.from(rows).map(row => ({
            type: row.querySelector('.item-type').value,
            weight: row.querySelector('.item-weight').value
        }));

        this.submitBtn.disabled = true;
        this.submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menganalisis...';

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/waste/calculations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });
            const res = await response.json();
            if (res.success) this.renderResult(res.data);
            else alert("Gagal: " + res.message);
        } catch (error) {
            alert("Gagal koneksi ke server.");
        } finally {
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = 'Analisis Dampak Lingkungan';
        }
    },

    renderResult(data) {
        this.resultContainer.classList.remove('d-none');
        this.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        this.resultContainer.innerHTML = `
            <div class="bg-dark text-white p-3 p-md-4 rounded-4 shadow-sm border border-success text-start bank-result-anim">
                <h5 class="fw-bold text-success mb-3 small-mobile-title"><i class="fas fa-check-circle me-2"></i> Hasil Analisis</h5>
                <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-3 bg-secondary bg-opacity-25 p-3 rounded-3">
                    <span class="text-white small mb-1 mb-sm-0">Potensi Tabungan:</span>
                    <span class="fw-bold text-success fs-5">Rp ${data.summary.totalFinancial_IDR.toLocaleString('id-ID')}</span>
                </div>
                <div class="row text-center g-0 small mt-3 pt-3 border-top border-secondary">
                    <div class="col-4 px-1">
                        <div class="fs-4 mb-1">☁️</div>
                        <div class="fw-bold text-success x-small-mobile fs-5">${data.summary.totalEnvironmentalImpact.co2Saved_Kg}</div>
                        <div class="text-white-50 x-small">kg CO2</div>
                    </div>
                    <div class="col-4 px-1 border-start border-end border-secondary">
                        <div class="fs-4 mb-1">⚡</div>
                        <div class="fw-bold text-success x-small-mobile fs-5">${data.summary.totalEnvironmentalImpact.energySaved_Kwh}</div>
                        <div class="text-white-50 x-small">kWh Energi</div>
                    </div>
                    <div class="col-4 px-1">
                        <div class="fs-4 mb-1">💧</div>
                        <div class="fw-bold text-success x-small-mobile fs-5">${data.summary.totalEnvironmentalImpact.waterSaved_Liters}</div>
                        <div class="text-white-50 x-small">L Air</div>
                    </div>
                </div>
            </div>`;
    }
};

// Tabungan
const LocalModule = {
    searchResults: [],
    currentPage: 1,
    itemsPerPage: 5,
    map: null,
    markers: [],
    prices: { 
        'plastik': 2000, 'botol': 2000, 'aqua': 2000, 'gelas': 1500, 'kresek': 500,
        'kertas': 1000, 'koran': 1200, 'majalah': 1200, 'buku': 1000,
        'kardus': 1500, 'dus': 1500, 'karton': 1500,
        'logam': 5000, 'besi': 5000, 'baja': 6000, 'tembaga': 50000, 'aluminium': 12000, 'kaleng': 4000,
        'elektronik': 7000, 'baterai': 5000, 'kabel': 8000, 'hp': 15000, 'laptop': 50000
    },

    async initDropdowns() {
        const provinceSelect = document.getElementById('provinceSelect');
        if (!provinceSelect) return;
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/wilayah`);
            const { data } = await res.json();
            provinceSelect.innerHTML = '<option value="">Pilih Kota/Wilayah...</option>';
            data.forEach(w => {
                const opt = document.createElement('option');
                opt.value = w; opt.textContent = w;
                provinceSelect.appendChild(opt);
            });
        } catch (e) { console.error(e); }
    },

    initMap() {
        if (this.map) return;
        const container = document.getElementById('mapContainer');
        if (!container) return;
        container.classList.remove('d-none');
        this.map = L.map('mapContainer').setView([-6.2088, 106.8456], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
    },

    async search() {
        const wilayah = document.getElementById('provinceSelect').value;
        const container = document.getElementById('searchResults');
        if (!wilayah) return alert("Pilih wilayah!");
        this.initMap();
        container.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-success mb-3"></div><p>Mencari titik recycle...</p></div>`;
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/banksampah?wilayah=${encodeURIComponent(wilayah)}`);
            const { data } = await res.json();
            this.searchResults = data;
            this.currentPage = 1;
            this.renderResults();
            this.updateMarkers(wilayah);
        } catch (e) { container.innerHTML = `<div class="alert alert-danger">Gagal memuat data.</div>`; }
    },

    updateMarkers(wilayah) {
        const centers = {
            'Jakarta Pusat':[-6.18, 106.82], 'Jakarta Selatan':[-6.26, 106.81], 
            'Jakarta Barat':[-6.16, 106.76], 'Jakarta Utara':[-6.12, 106.88], 'Jakarta Timur':[-6.22, 106.9]
        };
        const pos = centers[wilayah] || [-6.20, 106.84];
        this.map.setView(pos, 13);
        
        this.markers.forEach(m => this.map.removeLayer(m));
        this.markers = [];

        const getStaticOffset = (str) => {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            return (hash % 100) / 2000; 
        };

        this.searchResults.slice(0, 50).forEach((item) => {
            const latOffset = getStaticOffset(item.alamat + "lat");
            const lngOffset = getStaticOffset(item.nama_bank_sampah + "lng");
            
            const marker = L.marker([pos[0] + latOffset, pos[1] + lngOffset]).addTo(this.map);
            marker.bindPopup(`
                <div style="font-family: 'Poppins', sans-serif;">
                    <b class="text-success">${item.nama_bank_sampah}</b><br>
                    <small class="text-muted">${item.alamat}</small><br>
                    <span class="badge bg-light text-dark mt-1 border">${item.status_kegiatan}</span>
                </div>
            `);
            this.markers.push(marker);
        });
    },

    renderResults() {
        const resultsContainer = document.getElementById('searchResults');
        if (this.searchResults.length === 0) {
            resultsContainer.innerHTML = `<div class="alert alert-warning text-center rounded-4">Data tidak ditemukan.</div>`;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const paginatedData = this.searchResults.slice(startIndex, startIndex + this.itemsPerPage);

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-3 px-1">
                <h6 class="fw-bold text-dark mb-0"><i class="fas fa-list text-success me-2"></i> ${this.searchResults.length} Lokasi</h6>
                <small class="text-muted">Hal ${this.currentPage}</small>
            </div>
            <div class="table-responsive bg-white rounded-4 shadow-sm border overflow-hidden">
                <table class="table table-hover align-middle mb-0" style="min-width: 600px;">
                    <thead class="bg-light">
                        <tr class="small text-uppercase text-muted">
                            <th class="ps-4 py-3">No</th>
                            <th class="py-3">Titik Recycle</th>
                            <th class="py-3">Kecamatan</th>
                            <th class="py-3">Status</th>
                            <th class="py-3 text-center">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>`;

        paginatedData.forEach((item, index) => {
            const gmapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.nama_bank_sampah + ' ' + item.alamat)}`;
            html += `
                <tr>
                    <td class="ps-4 text-muted small">${startIndex + index + 1}</td>
                    <td><div class="fw-bold text-dark">${item.nama_bank_sampah}</div><div class="x-small text-muted text-truncate" style="max-width:250px;">${item.alamat}</div></td>
                    <td><span class="badge bg-light text-dark fw-normal">${item.kecamatan}</span></td>
                    <td><span class="small ${item.status_kegiatan === 'Aktif' ? 'text-success' : 'text-secondary'}">● ${item.status_kegiatan}</span></td>
                    <td class="text-center"><a href="${gmapsLink}" target="_blank" class="btn btn-sm btn-outline-success rounded-pill px-3">Peta</a></td>
                </tr>`;
        });
        html += `</tbody></table></div>`;

        if (this.searchResults.length > this.itemsPerPage) {
            const totalPages = Math.ceil(this.searchResults.length / this.itemsPerPage);
            html += `
                <div class="d-flex justify-content-center align-items-center gap-3 mt-4">
                    <button class="btn btn-sm btn-white border shadow-sm rounded-pill px-3" ${this.currentPage === 1 ? 'disabled' : ''} onclick="LocalModule.changePage(${this.currentPage - 1})">Prev</button>
                    <span class="small fw-bold">${this.currentPage} / ${totalPages}</span>
                    <button class="btn btn-sm btn-white border shadow-sm rounded-pill px-3" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="LocalModule.changePage(${this.currentPage + 1})">Next</button>
                </div>`;
        }
        resultsContainer.innerHTML = html;
    },

    changePage(page) {
        this.currentPage = page;
        this.renderResults();
        document.getElementById('searchResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    calculateManual() {
        const input = document.getElementById('manualWasteInput').value.toLowerCase();
        const weight = parseFloat(document.getElementById('manualWeight').value);
        const freq = parseInt(document.getElementById('manualFreq').value) || 1;
        const resDiv = document.getElementById('manualCalcResult');
        if (!input || isNaN(weight)) return alert("Isi data!");
        let price = 500; 
        for (let k in this.prices) if (input.includes(k)) { price = this.prices[k]; break; }
        const monthly = weight * price * freq * 4;
        resDiv.style.display = 'block';
        resDiv.innerHTML = `<div class="bg-success text-white p-4 rounded-4 shadow mt-3 text-center"><small>Estimasi Tabungan/Bulan:</small><h2 class="fw-bold mb-0">Rp ${monthly.toLocaleString('id-ID')}</h2></div>`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => { navMenu.classList.toggle('active'); menuToggle.classList.toggle('active'); });
        document.addEventListener('click', (e) => { if (!menuToggle.contains(e.target) && !navMenu.contains(e.target)) { navMenu.classList.remove('active'); menuToggle.classList.remove('active'); } });
    }
    NewsModule.init();
    AICalculator.init();
    LocalModule.initDropdowns(); 
    window.searchBankSampah = () => LocalModule.search();
    window.calculateSavings = () => LocalModule.calculateManual();
});

async function loadEduContent() {
    const wasteContainer = document.getElementById('wasteCategories');
    const dailyContainer = document.getElementById('dailyGuides');
    
    // Only fetch if one of the containers exists on the page
    if (!wasteContainer && !dailyContainer) return;

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/edu`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();

        if (result.success) {
            renderWasteCategories(result.data.wasteCategories);
            renderDailyGuides(result.data.dailyGuides);
        }
    } catch (error) {
        console.error('[EduService] Gagal memuat data edukasi:', error);
    }
}

function renderWasteCategories(categories) {
    const container = document.getElementById('wasteCategories');
    if (!container) return;
    container.innerHTML = '';

    categories.forEach(cat => {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-4';

        col.innerHTML = `
            <div class="card-guide shadow-sm h-100">
                <span class="badge-category mb-3">Kategori</span>
                <h3 class="fw-bold"><i class="fas fa-recycle"></i> ${cat.name}</h3>
                <p class="text-secondary small mb-3">${cat.description}</p>

                <div class="mb-3">
                    <strong class="d-block mb-1"><i class="fas fa-list-ul me-2 text-success"></i>Contoh:</strong>
                    <ul class="small mb-0">
                        ${cat.examples.map(ex => `<li>${ex}</li>`).join('')}
                    </ul>
                </div>

                <div class="management-info">
                    <strong class="small d-block text-success uppercase mb-1">Cara Pengelolaan:</strong>
                    <p class="small mb-0 text-dark">${cat.management}</p>
                </div>
                
                <div class="sdg-info border-top pt-2">
                    <i class="fas fa-leaf me-1 text-success"></i> ${cat.sdg_impact}
                </div>
            </div>
        `;

        container.appendChild(col);
    });
}

function renderDailyGuides(guides) {
    const container = document.getElementById('dailyGuides');
    if (!container) return;
    container.innerHTML = '';

    guides.forEach(guide => {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6';

        let content = `
            <div class="card-guide shadow-sm h-100">
                <h3 class="fw-bold border-bottom pb-2 mb-3"><i class="fas fa-lightbulb"></i> ${guide.title}</h3>
        `;

        if (guide.steps) {
            content += `<div class="steps-container">`;
            guide.steps.forEach(step => {
                content += `
                    <div class="step-item">
                        <strong>${step.principle}</strong>
                        <span>${step.action}</span>
                    </div>
                `;
            });
            content += `</div>`;
        }

        if (guide.tips) {
            content += `<ul class="tip-list mt-3">`;
            guide.tips.forEach(tip => {
                content += `<li>${tip}</li>`;
            });
            content += `</ul>`;
        }

        content += `</div>`;
        col.innerHTML = content;
        container.appendChild(col);
    });
}

document.addEventListener('DOMContentLoaded', loadEduContent);