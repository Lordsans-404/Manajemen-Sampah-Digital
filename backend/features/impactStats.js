/**
 * @fileoverview Statistik dampak lingkungan kumulatif
 * Menyimpan total dampak dari semua kalkulasi ke file JSON
 */

const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/impactStats.json');

const CONVERSION = {
    co2ToTrees  : 0.0167, 
    co2ToKm     : 4.03,   
    waterToBottle: 0.00167 
};

const readStats = () => {
    try {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch {
        return {
            totalCO2Saved_Kg:      0,
            totalEnergySaved_Kwh:  0,
            totalWaterSaved_Liters: 0,
            totalFinancial_IDR:    0,
            totalCalculations:     0,
            lastUpdated:           null
        };
    }
};

const writeStats = (data) => {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

/**
 * Akumulasi hasil kalkulasi baru ke JSON
 */
const accumulateStats = (calculationResult) => {
    const current = readStats();
    const { summary } = calculationResult;

    // Memastikan data di-parse menjadi float karena .toFixed() mengembalikan string
    // Menggunakan fallback (|| 0) untuk mencegah NaN jika struktur API berubah
    const updated = {
        totalCO2Saved_Kg:       current.totalCO2Saved_Kg       + parseFloat(summary.totalImpacts?.co2 || 0),
        totalEnergySaved_Kwh:   current.totalEnergySaved_Kwh   + parseFloat(summary.totalImpacts?.energy || 0),
        totalWaterSaved_Liters: current.totalWaterSaved_Liters + parseFloat(summary.totalImpacts?.water || 0),
        totalFinancial_IDR:     current.totalFinancial_IDR     + parseFloat(summary.totalMonthlyIncome || 0),
        totalCalculations:      current.totalCalculations      + 1,
        lastUpdated:            new Date().toISOString()
    };

    writeStats(updated);
    return updated;
};

const getStats = () => {
    const stats = readStats();

    return {
        raw: stats,
        conversions: {
            treesEquivalent:   Number((stats.totalCO2Saved_Kg      * CONVERSION.co2ToTrees  ).toFixed(1)),
            kmEquivalent:      Number((stats.totalCO2Saved_Kg      * CONVERSION.co2ToKm     ).toFixed(1)),
            bottlesEquivalent: Number((stats.totalWaterSaved_Liters * CONVERSION.waterToBottle).toFixed(0))
        }
    };
};

module.exports = { accumulateStats, getStats };