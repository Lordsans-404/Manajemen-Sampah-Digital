/**
 * @fileoverview Logic Calculatornya
 * FYI, sumber data harganya diambil dari rata-rata harga bank sampah Jabodetabek 
 */

const { WASTE_ALIASES } = require('./wasteAliases');

const WASTE_METRICS = {
    plastik:    { label: 'Plastik',    price: 3000,  co2Saved: 1.5, energySaved: 5.7, waterSaved: 0  },
    kertas:     { label: 'Kertas',     price: 2000,  co2Saved: 0.9, energySaved: 4.0, waterSaved: 26 },
    kaca:       { label: 'Kaca',       price: 1500,  co2Saved: 0.3, energySaved: 0.1, waterSaved: 0  },
    logam:      { label: 'Logam/Besi', price: 5000,  co2Saved: 2.0, energySaved: 3.5, waterSaved: 0  },
    elektronik: { label: 'Elektronik', price: 10000, co2Saved: 1.2, energySaved: 2.0, waterSaved: 0  }
};

/**
 * @param {string} input
 * @returns {string|null}
 * ini function untuk nerjemahin yg user ketik/input jadi salah satu key di WASTE_METRICS
 */
const resolveWasteType = (input) => {
    if (typeof input !== 'string') return null;

    const normalized = input.trim().toLowerCase();

    if (WASTE_METRICS[normalized]) return normalized;

    if (WASTE_ALIASES[normalized]) return WASTE_ALIASES[normalized];

    for (const [alias, type] of Object.entries(WASTE_ALIASES)) {
        if (normalized.includes(alias) || alias.includes(normalized)) {
            return type;
        }
    }

    return null;
};

/**
 * @returns {Array}
 * kalau FE mau ambil/GET daftar kategori sampah (kalau mau bikin dropdown, jadi user  hanya milih jenisnya apa di dropdown, bisa manggil function ini) - opsional
 */
const getWasteTypes = () => {
    return Object.entries(WASTE_METRICS).map(([key, val]) => ({
        value:      key,
        label:      val.label,
        pricePerKg: val.price,
        aliases:    Object.keys(WASTE_ALIASES).filter(a => WASTE_ALIASES[a] === key)
    }));
};

/**
 * @param {Array}
 * @returns {Object} 
 * Core logicnya - itung total uang n dampak lingkungan dari yg inputan user
 */
const calculateImpact = async (items) => {
    if (!Array.isArray(items)) {
        throw new Error("Input items harus berupa array.");
    }

    let totalFinancialSavings = 0;
    let totalCO2Saved         = 0;
    let totalEnergySaved      = 0;
    let totalWaterSaved       = 0;
    const details      = [];
    const invalidItems = [];

    items.forEach((item, index) => {
        const resolvedType  = resolveWasteType(item.type);
        const weight        = Number(item.weight);
        const originalInput = item.type;

        if (!resolvedType || isNaN(weight) || weight <= 0) {
            invalidItems.push({
                index,
                originalInput,
                reason: !resolvedType
                    ? `'${originalInput}' tidak dikenali sebagai jenis sampah yang dapat didaur ulang`
                    : `Berat tidak valid: '${item.weight}'`
            });
            return;
        }

        const metrics        = WASTE_METRICS[resolvedType];
        const subtotalPrice  = metrics.price      * weight;
        const subtotalCO2    = metrics.co2Saved    * weight;
        const subtotalEnergy = metrics.energySaved * weight;
        const subtotalWater  = metrics.waterSaved  * weight;

        totalFinancialSavings += subtotalPrice;
        totalCO2Saved         += subtotalCO2;
        totalEnergySaved      += subtotalEnergy;
        totalWaterSaved       += subtotalWater;

        details.push({
            type:          resolvedType,
            originalInput: originalInput !== resolvedType ? originalInput : undefined,
            weight,
            financial: {
                pricePerKg: metrics.price,
                subtotal:   subtotalPrice
            },
            environmental: {
                co2SavedKg:       Number(subtotalCO2.toFixed(2)),
                energySavedKwh:   Number(subtotalEnergy.toFixed(2)),
                waterSavedLiters: Number(subtotalWater.toFixed(2))
            }
        });
    });

    if (details.length === 0) {
        throw new Error(
            `Tidak ada item valid yang dapat diproses. ` +
            `Detail: ${invalidItems.map(i => i.reason).join('; ')}`
        );
    }

    return {
        summary: {
            totalFinancial_IDR: totalFinancialSavings,
            totalEnvironmentalImpact: {
                co2Saved_Kg:      Number(totalCO2Saved.toFixed(2)),
                energySaved_Kwh:  Number(totalEnergySaved.toFixed(2)),
                waterSaved_Liters: Number(totalWaterSaved.toFixed(2))
            }
        },
        details,
        ...(invalidItems.length > 0 && { warnings: invalidItems })
    };
};

module.exports = { calculateImpact, getWasteTypes };