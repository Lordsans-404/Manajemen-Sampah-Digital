const SmartCalculator = {
    init() {
        this.form = document.getElementById('unified-calculator');
        this.rowsContainer = document.getElementById('item-rows');
        this.addRowBtn = document.getElementById('add-row-btn');
        this.submitBtn = document.getElementById('submit-btn');
        
        this.resultSection = document.getElementById('result-section');
        this.totalIncome = document.getElementById('total-income');
        this.totalCO2 = document.getElementById('total-co2');
        this.totalEnergy = document.getElementById('total-energy');
        this.totalWater = document.getElementById('total-water');
        this.breakdownList = document.getElementById('breakdown-list');

        if (!this.form) return;
        this.bindEvents();
    },

    bindEvents() {
        this.addRowBtn.addEventListener('click', () => this.addRow());
        
        this.rowsContainer.addEventListener('click', (e) => {
            if (e.target.closest('.remove-row')) {
                e.target.closest('.item-row').remove();
                this.updateRemoveButtons();
            }
        });

        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.processCalculation();
        });
    },

    addRow() {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'row gx-3 gy-2 align-items-center item-row position-relative p-3 p-md-0 rounded-4 rounded-md-0 bg-light bg-md-transparent';
        
        rowDiv.innerHTML = `
            <button type="button" class="btn btn-link text-danger p-0 remove-row d-md-none position-absolute top-0 end-0 mt-2 me-3" style="width: auto; height: auto;"><i class="fas fa-times fs-5"></i></button>
            <div class="col-12 col-md-5">
                <label class="d-block d-md-none text-muted small fw-bold mb-1">Jenis Sampah</label>
                <input type="text" class="form-control item-type bento-input px-4" style="padding-left: 1.5rem !important;" placeholder="Contoh: Kardus Bekas" required>
            </div>
            <div class="col-6 col-md-3">
                <label class="d-block d-md-none text-muted small fw-bold mb-1">Berat (kg)</label>
                <input type="number" step="0.1" class="form-control item-weight bento-input text-end pe-4" style="padding-left: 1rem !important;" placeholder="0.0" required>
            </div>
            <div class="col-6 col-md-3">
                <label class="d-block d-md-none text-muted small fw-bold mb-1">Setor/Mgg</label>
                <input type="number" class="form-control item-freq bento-input text-end pe-4" style="padding-left: 1rem !important;" value="1" min="1">
            </div>
            <div class="col-md-1 text-end d-none d-md-block">
                <button type="button" class="btn btn-link text-danger p-0 remove-row"><i class="fas fa-times fs-5"></i></button>
            </div>
        `;
        
        this.rowsContainer.appendChild(rowDiv);
        this.updateRemoveButtons();
    },

    updateRemoveButtons() {
        const rows = this.rowsContainer.querySelectorAll('.item-row');
        const removeBtns = this.rowsContainer.querySelectorAll('.remove-row');
        removeBtns.forEach(btn => {
            btn.disabled = (rows.length === 1);
        });
    },

    async processCalculation() {
        const rows = this.rowsContainer.querySelectorAll('.item-row');
        const items = Array.from(rows).map(row => ({
            type: row.querySelector('.item-type').value,
            weight: row.querySelector('.item-weight').value,
            frequency: row.querySelector('.item-freq').value
        }));

        this.setLoading(true);

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/waste/calculations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });
            const res = await response.json();
            
            if (res.success) {
                this.renderResults(res.data);
            } else {
                alert("Gagal menganalisis: " + res.message);
            }
        } catch (error) {
            alert("Koneksi bermasalah. Pastikan server berjalan.");
        } finally {
            this.setLoading(false);
        }
    },

    setLoading(isLoading) {
        this.submitBtn.disabled = isLoading;
        this.submitBtn.innerHTML = isLoading ? 
            '<span class="spinner-border spinner-border-sm me-2"></span>Menganalisis...' : 
            '<i class="fas fa-analytics"></i> Analisis Sekarang';
    },

    renderResults(data) {
        this.resultSection.classList.remove('d-none');
        this.resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        this.totalIncome.textContent = `Rp ${data.summary.totalMonthlyIncome.toLocaleString('id-ID')}`;
        this.totalCO2.textContent = data.summary.totalImpacts.co2;
        this.totalEnergy.textContent = data.summary.totalImpacts.energy;
        this.totalWater.textContent = data.summary.totalImpacts.water;

        this.breakdownList.innerHTML = data.details.map(item => `
            <li class="list-group-item p-4 border-bottom">
                <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
                    <h6 class="fw-bold mb-0 text-success headline-font fs-5">${item.label} (${item.weight}kg)</h6>
                    <span class="badge bg-success-subtle text-success rounded-pill px-3 py-2 fw-bold" style="width: fit-content;">Est. Rp ${item.monthlyIncome.toLocaleString('id-ID')}/bln</span>
                </div>
                <p class="text-muted small mb-3" style="line-height: 1.6;">
                    <i class="fas fa-lightbulb text-warning me-2"></i>${item.reasoning}
                </p>
                <div class="row g-2">
                    <div class="col-4"><div class="p-2 rounded-3 text-center small fw-bold" style="background-color: #f2f4f2;">☁️ ${item.impacts.co2} kg</div></div>
                    <div class="col-4"><div class="p-2 rounded-3 text-center small fw-bold" style="background-color: #f2f4f2;">⚡ ${item.impacts.energy} kWh</div></div>
                    <div class="col-4"><div class="p-2 rounded-3 text-center small fw-bold" style="background-color: #f2f4f2;">💧 ${item.impacts.water} L</div></div>
                </div>
            </li>
        `).join('');
    }
};

const LocalModule = {
    searchResults: [],
    currentPage: 1,
    itemsPerPage: 5,
    map: null,
    markers: [],

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
        if (!wilayah) return alert("Pilih wilayah terlebih dahulu!");
        
        this.initMap();
        container.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-success mb-3"></div><p>Mencari titik daur ulang...</p></div>`;
        
        try {
            const res = await fetch(`${CONFIG.API_BASE_URL}/banksampah?wilayah=${encodeURIComponent(wilayah)}`);
            const { data } = await res.json();
            this.searchResults = data;
            this.currentPage = 1;
            this.renderResults();
            this.updateMarkers(wilayah);
        } catch (e) { 
            container.innerHTML = `<div class="alert alert-danger m-4">Gagal memuat data dari server.</div>`; 
        }
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
            for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
            return (hash % 100) / 2000; 
        };

        this.searchResults.slice(0, 50).forEach((item) => {
            const latOffset = getStaticOffset(item.alamat + "lat");
            const lngOffset = getStaticOffset(item.nama_bank_sampah + "lng");
            
            const marker = L.marker([pos[0] + latOffset, pos[1] + lngOffset]).addTo(this.map);
            marker.bindPopup(`
                <div style="font-family: 'Poppins', sans-serif;">
                    <b style="color: #0f5238;">${item.nama_bank_sampah}</b><br>
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
            resultsContainer.innerHTML = `<div class="alert alert-warning text-center m-4 rounded-4">Data tidak ditemukan di wilayah ini.</div>`;
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const paginatedData = this.searchResults.slice(startIndex, startIndex + this.itemsPerPage);

        let html = `
            <div class="d-flex justify-content-between align-items-center mb-0 p-4 border-bottom">
                <h6 class="fw-bold text-dark mb-0 headline-font"><i class="fas fa-list text-success me-2"></i> ${this.searchResults.length} Lokasi Ditemukan</h6>
                <small class="text-muted fw-bold">Hal ${this.currentPage}</small>
            </div>
            <div class="table-responsive">
                <table class="table table-hover align-middle mb-0" style="min-width: 600px;">
                    <tbody>`;

        paginatedData.forEach((item, index) => {
            const gmapsLink = `https://maps.google.com/?q=${encodeURIComponent(item.nama_bank_sampah + ' ' + item.alamat)}`;
            html += `
                <tr>
                    <td class="ps-4 text-muted small" style="width: 50px;">${startIndex + index + 1}</td>
                    <td>
                        <div class="fw-bold text-dark headline-font">${item.nama_bank_sampah}</div>
                        <div class="small text-muted text-truncate" style="max-width:300px;">${item.alamat}</div>
                    </td>
                    <td><span class="badge bg-light text-dark fw-bold border">${item.kecamatan}</span></td>
                    <td><span class="small fw-bold ${item.status_kegiatan === 'Aktif' ? 'text-success' : 'text-secondary'}">● ${item.status_kegiatan}</span></td>
                    <td class="text-center pe-4">
                        <a href="${gmapsLink}" target="_blank" class="btn btn-sm btn-outline-success rounded-pill px-3 fw-bold">Peta</a>
                    </td>
                </tr>`;
        });
        html += `</tbody></table></div>`;

        if (this.searchResults.length > this.itemsPerPage) {
            const totalPages = Math.ceil(this.searchResults.length / this.itemsPerPage);
            html += `
                <div class="d-flex justify-content-center align-items-center gap-3 p-4 border-top">
                    <button class="btn btn-sm btn-light border rounded-pill px-3 fw-bold" ${this.currentPage === 1 ? 'disabled' : ''} onclick="window.changePage(${this.currentPage - 1})">Prev</button>
                    <span class="small fw-bold">${this.currentPage} / ${totalPages}</span>
                    <button class="btn btn-sm btn-light border rounded-pill px-3 fw-bold" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="window.changePage(${this.currentPage + 1})">Next</button>
                </div>`;
        }
        resultsContainer.innerHTML = html;
    },

    changePage(page) {
        this.currentPage = page;
        this.renderResults();
        document.getElementById('searchResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
};
document.addEventListener('DOMContentLoaded', () => {
    SmartCalculator.init();
    LocalModule.initDropdowns(); 
    
    window.searchBankSampah = () => LocalModule.search();
    window.changePage = (page) => LocalModule.changePage(page);
});