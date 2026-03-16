const fs = require('fs');
const path = require('path');

let bankSampahCache = [];

// loas dataset
const initBankSampahData = () => {
    try {
        const csvPath = path.join(__dirname, '../data/BankSampah.csv');
        const data = fs.readFileSync(csvPath, 'utf8');
        
        const lines = data.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

        bankSampahCache = lines.slice(1).map(line => {
            const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (!values) return null;

            let obj = {};
            headers.forEach((header, i) => {
                obj[header] = values[i] ? values[i].replace(/"/g, '').trim() : '';
            });
            return obj;
        }).filter(item => item !== null);

        console.log(`📦 Database Ready: ${bankSampahCache.length} data bank sampah dimuat.`);
    } catch (err) {
        console.error('❌ Error loading CSV:', err.message);
    }
};

initBankSampahData();

const getBankSampah = (queryWilayah) => {
    if (!queryWilayah) return bankSampahCache;
    return bankSampahCache.filter(item => 
        item.wilayah.toLowerCase().includes(queryWilayah.toLowerCase())
    );
};

const getUniqueWilayah = () => {
    const wilayahSet = new Set(bankSampahCache.map(item => item.wilayah));
    return Array.from(wilayahSet).filter(w => w).sort();
};

const getUniqueKecamatan = (wilayah) => {
    if (!wilayah) return [];
    const kecamatanSet = new Set(
        bankSampahCache
            .filter(item => item.wilayah === wilayah)
            .map(item => item.kecamatan)
    );
    return Array.from(kecamatanSet).filter(k => k).sort();
};

module.exports = { getBankSampah, getUniqueWilayah, getUniqueKecamatan };