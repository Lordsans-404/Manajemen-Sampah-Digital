const ImpactStats = {
    async init() {
        await this.fetchData();
    },

    async fetchData() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/stats`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const result = await response.json();
            if (result.success && result.data) {
                this.updateUI(result.data);
            }
        } catch (error) {
            console.error('[ImpactStats] Gagal memuat data statistik:', error);
            document.getElementById('stat-narrative').textContent = 
                "Mari mulai memilah sampah dan lihat dampak nyatanya bagi lingkungan kita.";
        }
    },

    updateUI(data) {
        const { raw, narrative } = data;

        document.getElementById('stat-narrative').textContent = narrative;
        document.getElementById('stat-users').textContent = `Berdasarkan kalkulasi dari ${raw.totalCalculations} pahlawan bumi.`;

        document.getElementById('stat-co2').setAttribute('data-target', raw.totalCO2Saved_Kg.toFixed(1));
        document.getElementById('stat-energy').setAttribute('data-target', raw.totalEnergySaved_Kwh.toFixed(1));
        document.getElementById('stat-water').setAttribute('data-target', raw.totalWaterSaved_Liters.toFixed(1));
        document.getElementById('stat-money').setAttribute('data-target', raw.totalFinancial_IDR);

        this.initCounterAnimation();
    },

    initCounterAnimation() {
        const counters = document.querySelectorAll('.stat-counter');
        const duration = 2500; 

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = +counter.getAttribute('data-target');
                    const isCurrency = counter.getAttribute('data-is-currency') === 'true';

                    let startTime = null;

                    const step = (timestamp) => {
                        if (!startTime) startTime = timestamp;
                        
                        const progress = Math.min((timestamp - startTime) / duration, 1);
                        
                        const easeProgress = progress * (2 - progress); 
                        const currentCount = target * easeProgress;

                        if (isCurrency) {
                            counter.innerText = `Rp ${Math.ceil(currentCount).toLocaleString('id-ID')}`;
                        } else {
                            counter.innerText = currentCount.toFixed(1);
                        }

                        if (progress < 1) {
                            window.requestAnimationFrame(step);
                        } else {
                            if (isCurrency) {
                                counter.innerText = `Rp ${Math.ceil(target).toLocaleString('id-ID')}`;
                            } else {
                                counter.innerText = target.toFixed(1);
                            }
                        }
                    };

                    window.requestAnimationFrame(step);
                    observer.unobserve(counter); 
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => observer.observe(counter));
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ImpactStats.init();
});