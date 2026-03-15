// Data dummy bank sampah
const bankSampahData = [
{
name: "Bank Sampah Bersih Desa",
address: "Jl. Merpati No. 45, Jakarta Selatan",
distance: "1.2 km",
phone: "0812-3456-7890",
lat: -6.2088,
lng: 106.8456
},
{
name: "Bank Sampah Hijau Muda",
address: "Jl. Cendrawasih No. 23, Jakarta Selatan",
distance: "2.5 km",
phone: "0813-4567-8901",
lat: -6.2150,
lng: 106.8300
},
{
name: "Bank Sampah Sejahtera",
address: "Jl. Kertajaya No. 12, Jakarta Selatan",
distance: "3.8 km",
phone: "0814-5678-9012",
lat: -6.2000,
lng: 106.8500
}
];

// Harga sampah per kg
const hargaSampah = {
    plastik: 2000,
    kertas: 1000,
    kardus: 1500,
    logam: 5000
};

// Pencarian bank sampah
function searchBankSampah() {
    const location = document.getElementById('userLocation').value;
    const resultsContainer = document.getElementById('searchResults');
    const mapContainer = document.getElementById('mapContainer');
    
    if (!location) {
        alert('Masukkan lokasi Anda terlebih dahulu!');
        return;
    }
    
    // Tampilkan hasil pencarian
    resultsContainer.innerHTML = `
        <h3 style="margin-bottom: 1.5rem; color: #4CAF50;">
            <i class="fas fa-map-marker-alt"></i> Bank sampah terdekat dari "${location}"
        </h3>
    `;
    
    bankSampahData.forEach((bank, index) => {
        resultsContainer.innerHTML += `
            <div class="bank-result">
                <div class="bank-icon">
                    <i class="fas fa-recycle"></i>
                </div>
                <div class="bank-info">
                    <h4>${bank.name}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${bank.address}</p>
                    <p><i class="fas fa-route"></i> ${bank.distance} dari lokasi Anda</p>
                    <p><i class="fas fa-phone"></i> ${bank.phone}</p>
                    <a href="#" onclick="showMap(${index})" style="color: #4CAF50; font-weight: 600;">
                        <i class="fas fa-map"></i> Lihat di peta
                    </a>
                </div>
            </div>
        `;
    });
    
    // Tampilkan map container
    mapContainer.style.display = 'block';
    mapContainer.innerHTML = `
        <h3 style="margin-bottom: 1rem; color: #4CAF50;">
            <i class="fas fa-map"></i> Peta Lokasi Bank Sampah
        </h3>
        <div style="height: 300px; background: linear-gradient(45deg, #4CAF50, #45a049); 
                    border-radius: 15px; display: flex; align-items: center; justify-content: center; 
                    color: white; font-size: 1.2rem;">
            📍 Klik "Lihat di peta" untuk membuka Google Maps
        </div>
    `;
    
    // Smooth scroll ke hasil
    resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// Tampilkan maps
function showMap(index) {
    const bank = bankSampahData[index];
    
    document.getElementById('mapContainer').innerHTML = `
        <h3 style="margin-bottom: 1rem; color: #4CAF50;">
            <i class="fas fa-map"></i> ${bank.name}
        </h3>
        <iframe 
            width="100%" 
            height="400" 
            frameborder="0" 
            style="border:0; border-radius: 15px;"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.496947529!2d${bank.lng}!3d${bank.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNijCsDEyJzMxLjQiUyAxMDbCsDUwJzQ0LjIiRQ!5e0!3m2!1sid!2sid!4v1699999999999" 
            allowfullscreen>
        </iframe>
        <p style="margin-top: 1rem; text-align: center; color: #666;">
            📍 ${bank.distance} dari lokasi Anda
        </p>
    `;
}

// Kalkulator potensi tabungan
function calculateSavings() {
    const wasteType = document.getElementById('wasteType').value;
    const weight = parseFloat(document.getElementById('wasteWeight').value);
    const frequency = parseInt(document.getElementById('frequency').value);
    
    if (!weight || weight <= 0) {
        alert('Masukkan berat sampah yang valid!');
        return;
    }
    
    // Hitung potensi tabungan
    const weeklySavings = (weight * hargaSampah[wasteType] * frequency);
    const monthlySavings = Math.round(weeklySavings * 4);
    const yearlySavings = Math.round(monthlySavings * 12);
    
    const resultContainer = document.getElementById('calcResult');
    
    resultContainer.innerHTML = `
        <div class="result-amount">Rp ${monthlySavings.toLocaleString('id-ID')}</div>
        <p><strong>Potensi tabungan per bulan</strong></p>
        <div style="margin-top: 1.5rem; font-size: 1.1rem; opacity: 0.9;">
            <p><i class="fas fa-calendar-week"></i> Mingguan: Rp ${weeklySavings.toLocaleString('id-ID')}</p>
            <p><i class="fas fa-calendar-month"></i> Bulanan: Rp ${monthlySavings.toLocaleString('id-ID')}</p>
            <p><i class="fas fa-calendar-alt"></i> Tahunan: Rp ${yearlySavings.toLocaleString('id-ID')}</p>
        </div>
        <p style="margin-top: 1rem; font-size: 0.9rem;">
            💡 Setiap ${weight}kg ${wasteType} ${frequency}x/minggu = tabungan nyata!
        </p>
    `;
    
    resultContainer.style.display = 'block';
    
    // Smooth scroll ke hasil
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

// Smooth scrolling untuk navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Enter key support untuk search
document.getElementById('userLocation').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchBankSampah();
    }
});

// Enter key support untuk calculator
document.getElementById('wasteWeight').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        calculateSavings();
    }
});