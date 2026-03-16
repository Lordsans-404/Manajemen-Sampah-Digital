/**
 * @fileoverview Logic Calculator terintegrasi with AI Gemini
 */

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * @param {Array<string>} inputItems 
 * @returns {Promise<Array<Object|null>>} 
 */
const identifyWasteBatchWithAI = async (inputItems) => {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        throw new Error("SERVER_CONFIG_ERROR: GEMINI_API_KEY tidak ditemukan di .env");
    }

    const promptText = `Identifikasi array sampah berikut dan berikan estimasi dampak lingkungannya per 1 kg dalam format JSON.
Gunakan data standar industri daur ulang global untuk estimasi:
1. co2Saved (Kg CO2 per kg sampah)
2. energySaved (kWh per kg sampah)
3. waterSaved (Liter air per kg sampah) - WAJIB BERIKAN ESTIMASI REALISTIS, JANGAN 0 KECUALI TIDAK ADA DATA SAMA SEKALI.
4. price (Estimasi harga pasar bank sampah di Indonesia dalam Rupiah per kg)

Input user: ${JSON.stringify(inputItems)}

HANYA berikan JSON array of objects dengan skema:
[{"originalInput": "nama", "category": "plastik|kertas|kaca|logam|elektronik", "label": "Nama Spesifik", "price": 3000, "co2Saved": 1.5, "energySaved": 5.7, "waterSaved": 15.0, "confidence": "high"}]`;

    try {
        const response = await fetch(`${GEMINI_BASE_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { 
                    responseMimeType: "application/json", 
                    temperature: 0.1 
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error Detail:', JSON.stringify(errorData, null, 2));
            throw new Error(`UPSTREAM_ERROR_${response.status}: ${errorData.error?.message || 'Gagal menghubungi Gemini'}`);
        }

        const data = await response.json();
        const rawJsonText = data.candidates[0].content.parts[0].text;
        return JSON.parse(rawJsonText);
    } catch (error) {
        console.error('Fetch Error:', error.message);
        throw error;
    }
};

// Total dampaknya
const calculateImpact = async (items) => {
    const validInputs = [];
    const itemMap = new Map();

    items.forEach((item, index) => {
        const weight = Number(item.weight);
        if (!isNaN(weight) && weight > 0) {
            validInputs.push(item.type);
            itemMap.set(item.type, { index, weight });
        }
    });

    if (validInputs.length === 0) {
        throw new Error("CLIENT_ERROR: Tidak ada item valid.");
    }

    const aiResults = await identifyWasteBatchWithAI(validInputs);

    let totalFinancialSavings = 0;
    let totalCO2Saved = 0;
    let totalEnergySaved = 0;
    let totalWaterSaved = 0;
    const details = [];

    aiResults.forEach((metrics) => {
        const originalData = itemMap.get(metrics.originalInput);
        if (!originalData) return;

        const weight = originalData.weight;
        const subtotalPrice = (Number(metrics.price) || 0) * weight;
        const subtotalCO2 = (Number(metrics.co2Saved) || 0) * weight;
        const subtotalEnergy = (Number(metrics.energySaved) || 0) * weight;
        const subtotalWater = (Number(metrics.waterSaved) || 0) * weight;

        totalFinancialSavings += subtotalPrice;
        totalCO2Saved += subtotalCO2;
        totalEnergySaved += subtotalEnergy;
        totalWaterSaved += subtotalWater;

        details.push({
            type: metrics.category,
            label: metrics.label,
            weight,
            financial: { subtotal: subtotalPrice },
            environmental: {
                co2Saved_Kg: Number(subtotalCO2.toFixed(2)),
                energySaved_Kwh: Number(subtotalEnergy.toFixed(2)),
                waterSaved_Liters: Number(subtotalWater.toFixed(2))
            }
        });
    });

    return {
        summary: {
            totalFinancial_IDR: totalFinancialSavings,
            totalEnvironmentalImpact: {
                co2Saved_Kg: Number(totalCO2Saved.toFixed(2)),
                energySaved_Kwh: Number(totalEnergySaved.toFixed(2)),
                waterSaved_Liters: Number(totalWaterSaved.toFixed(2))
            }
        },
        details
    };
};

module.exports = { calculateImpact };