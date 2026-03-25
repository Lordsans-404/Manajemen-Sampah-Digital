async function loadEduContent() {
    const wasteContainer = document.getElementById('wasteCategories');
    if (!wasteContainer) return;

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/edu`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();

        if (result.success && result.data) {
            renderGuides(result.data);
        }
    } catch (error) {
        console.error('[EduService] Gagal memuat data edukasi:', error);
        wasteContainer.innerHTML = '<div class="alert alert-danger w-100 text-center rounded-4">Gagal memuat panduan.</div>';
    }
}

function renderGuides(data) {
    const categoriesContainer = document.getElementById('wasteCategories');
    const fiveRContainer = document.getElementById('fiveRContainer');
    const tipsContainer = document.getElementById('tipsContainer');

    if (categoriesContainer && data.wasteCategories?.length > 0) {
        categoriesContainer.innerHTML = data.wasteCategories.map(cat => {
            const id = cat.id.toLowerCase();
            const themeStr = id === 'organik' ? 'organik' : id === 'anorganik' ? 'anorganik' : 'b3';
            const iconName = id === 'organik' ? 'fa-leaf' : id === 'anorganik' ? 'fa-recycle' : 'fa-triangle-exclamation';

            return `
                <div class="col-md-4 fade-up mb-4 mb-md-0">
                    <div class="tw-card border-top-${themeStr}">
                        <div class="d-flex align-items-center gap-3 mb-4">
                            <div class="icon-circle bg-${themeStr}">
                                <i class="fas ${iconName}"></i>
                            </div>
                            <h3 class="fs-5 fw-bold mb-0 text-dark headline-font">${cat.name.replace('Sampah ', '')}</h3>
                        </div>
                        <div class="mb-4">
                            <h4 class="text-uppercase tracking-wider text-muted fw-bold mb-2" style="font-size: 0.75rem;">Contoh</h4>
                            <ul class="tw-list ${themeStr}-dot">
                                ${cat.examples.slice(0, 3).map(ex => `<li>${ex}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="mgmt-box">
                            <h4 class="text-uppercase tracking-wider text-dark fw-bold mb-2" style="font-size: 0.75rem;">Cara Pengelolaan</h4>
                            <p class="mb-0 text-muted" style="font-size: 0.85rem; line-height: 1.6;">${cat.management}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    if (fiveRContainer && data.dailyGuides?.length > 0) {
        const fiveRGuide = data.dailyGuides.find(g => g.title.includes('5R'));
        if (fiveRGuide && fiveRGuide.steps) {
            let stepsHtml = fiveRGuide.steps.map((step, index) => {
                const isActive = index === 0 ? 'active' : '';
                const opacityClass = index > 0 ? 'opacity-75' : '';
                return `
                    <div class="step-item ${isActive} group">
                        <div class="step-num">${index + 1}</div>
                        <div class="step-text">
                            <h3 class="fs-6 fs-md-5 fw-bold mb-1 text-dark ${opacityClass}">${step.principle}</h3>
                            <p class="mb-0 text-muted small ${opacityClass}">${step.action}</p>
                        </div>
                    </div>
                `;
            }).join('');

            fiveRContainer.innerHTML = `
                <div class="bento-left fade-up shadow-sm">
                    <div class="position-relative z-1">
                        <h2 class="fs-3 fs-md-2 fw-bolder mb-4 headline-font text-dark">Prinsip 5R dalam Keseharian</h2>
                        <div class="mb-0">${stepsHtml}</div>
                    </div>
                    <div class="blur-decor"></div>
                </div>
            `;
        }
    }

    if (tipsContainer && data.dailyGuides?.length > 0) {
        const tipsGuide = data.dailyGuides.find(g => g.title.includes('Tips Belanja'));
        if (tipsGuide && tipsGuide.tips) {
            let tipsHtml = tipsGuide.tips.map(tip => {
                return `
                    <li class="d-flex gap-2 gap-md-3 mb-3 mb-md-4">
                        <i class="fas fa-check-circle fs-5 mt-1" style="color: #91f78e; flex-shrink: 0;"></i>
                        <div>
                            <p class="fw-bold mb-1 headline-font text-white" style="font-size: 0.95rem;">${tip.title}</p>
                            <p class="mb-0" style="color: rgba(177, 240, 206, 0.8); font-size: 0.8rem;">${tip.description}</p>
                        </div>
                    </li>
                `;
            }).join('');

            tipsContainer.innerHTML = `
                <div class="bento-right-top shadow-sm fade-up" style="animation-delay: 0.1s;">
                    <i class="fas fa-shopping-basket fs-2 fs-md-1 mb-3 mb-md-4" style="color: #91f78e;"></i>
                    <h2 class="fs-4 fs-md-3 fw-bold mb-3 mb-md-4 headline-font">Tips Belanja Ramah Lingkungan</h2>
                    <ul class="list-unstyled mb-0">${tipsHtml}</ul>
                </div>
                
                <div class="bento-right-bottom shadow-sm fade-up mt-3 mt-lg-0" style="animation-delay: 0.2s;">
                    <div>
                        <p class="text-uppercase tracking-wider fw-bold mb-1" style="font-size: 0.7rem; color: #707973;">Mulai Sekarang</p>
                        <p class="fs-6 fs-md-5 fw-bold mb-0 text-dark headline-font">Cari Bank Sampah</p>
                    </div>
                    <div class="icon-circle" style="background-color: #006e1c; color: #fff; width: 40px; height: 40px; flex-shrink:0;">
                        <i class="fas fa-map-marker-alt" style="font-size: 1.1rem;"></i>
                    </div>
                </div>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', loadEduContent);