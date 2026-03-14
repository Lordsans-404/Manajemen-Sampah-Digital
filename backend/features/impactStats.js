/**
 * @fileoverview Statistik dampak lingkungan kumulatif [opsional guys, ide fitur baru aja ini, kalau mau dipake gas kalau tak nak tak apa]
 * Nyimpen total dampak dari semua kalkulasi semua user ke file json 
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
 * Akumulasi hasil kalkulasi yg baru ke total/ke jsonnya
 */
const accumulateStats = (calculationResult) => {
    const current = readStats();
    const { summary } = calculationResult;

    const updated = {
        totalCO2Saved_Kg:       current.totalCO2Saved_Kg      + summary.totalEnvironmentalImpact.co2Saved_Kg,
        totalEnergySaved_Kwh:   current.totalEnergySaved_Kwh  + summary.totalEnvironmentalImpact.energySaved_Kwh,
        totalWaterSaved_Liters: current.totalWaterSaved_Liters + summary.totalEnvironmentalImpact.waterSaved_Liters,
        totalFinancial_IDR:     current.totalFinancial_IDR     + summary.totalFinancial_IDR,
        totalCalculations:      current.totalCalculations      + 1,
        lastUpdated:            new Date().toISOString()
    };

    writeStats(updated);
    return updated;
};

const buildNarrative = (stats) => {
    const trees   = (stats.totalCO2Saved_Kg   * CONVERSION.co2ToTrees  ).toFixed(1);
    const km      = (stats.totalCO2Saved_Kg   * CONVERSION.co2ToKm     ).toFixed(1);
    const bottles = (stats.totalWaterSaved_Liters * CONVERSION.waterToBottle).toFixed(0);

    return `Bersama, kita telah mencegah emisi setara ${trees} pohon ditanam, atau menghemat ${km} km perjalanan mobil, dan ${bottles} botol air minum.`;
};

/**
 * buat endpoint getnya
 */
const getStats = () => {
    const stats = readStats();

    return {
        raw: stats,
        conversions: {
            treesEquivalent:   Number((stats.totalCO2Saved_Kg      * CONVERSION.co2ToTrees  ).toFixed(1)),
            kmEquivalent:      Number((stats.totalCO2Saved_Kg      * CONVERSION.co2ToKm     ).toFixed(1)),
            bottlesEquivalent: Number((stats.totalWaterSaved_Liters * CONVERSION.waterToBottle).toFixed(0))
        },
        narrative: buildNarrative(stats)
    };
};

module.exports = { accumulateStats, getStats };