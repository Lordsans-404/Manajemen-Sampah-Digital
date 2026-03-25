/**
 * @fileoverview Logic Calculator Terpadu with AI Gemini (Impact + Price + Reasoning)
 */

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const identifyWasteBatchWithAI = async (inputItems) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("SERVER_CONFIG_ERROR: GEMINI_API_KEY tidak ditemukan");

    // Prompt lebih ketat & minta alasan singkat buat edukasi
    const promptText = `Analisis list sampah berikut: ${JSON.stringify(inputItems)}.
Berikan data per 1 kg dalam format JSON array of objects.
Skema: [{"originalInput": "nama", "label": "Nama Spesifik", "category": "plastik|kertas|logam|kaca|lainnya", "price": estimasi_harga_idr, "co2Saved": kg_co2, "energySaved": kwh, "waterSaved": liter, "reasoning": "penjelasan singkat 1 kalimat kenapa sampah ini berdampak segitu"}]`;

    try {
        const response = await fetch(`${GEMINI_BASE_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
        });

        if (!response.ok) throw new Error(`Gemini Error ${response.status}`);
        
        const data = await response.json();
        return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (error) {
        console.error('Gemini Error:', error.message);
        throw error;
    }
};

const calculateImpact = async (items) => {
    const validInputs = items.filter(i => Number(i.weight) > 0);
    if (validInputs.length === 0) throw new Error("CLIENT_ERROR: Masukkan berat yang valid");

    const aiResults = await identifyWasteBatchWithAI(validInputs.map(i => i.type));

    let totalCO2 = 0, totalEnergy = 0, totalWater = 0, totalMonthlyIncome = 0;
    const details = [];

    aiResults.forEach((metrics) => {
        const userInput = items.find(i => i.type === metrics.originalInput);
        if (!userInput) return;

        const weight = Number(userInput.weight);
        const freq = Number(userInput.frequency || 1); // Default 1x/minggu

        // Hitung subtotal dampak (sekali setor)
        const subCO2 = metrics.co2Saved * weight;
        const subEnergy = metrics.energySaved * weight;
        const subWater = metrics.waterSaved * weight;
        
        // Hitung estimasi tabungan bulanan (4 minggu)
        const subPrice = metrics.price * weight * freq * 4;

        totalCO2 += subCO2;
        totalEnergy += subEnergy;
        totalWater += subWater;
        totalMonthlyIncome += subPrice;

        details.push({
            label: metrics.label,
            weight,
            frequency: freq,
            reasoning: metrics.reasoning,
            monthlyIncome: subPrice,
            impacts: {
                co2: subCO2.toFixed(2),
                energy: subEnergy.toFixed(2),
                water: subWater.toFixed(2)
            }
        });
    });

    return {
        summary: {
            totalMonthlyIncome,
            totalImpacts: {
                co2: totalCO2.toFixed(2),
                energy: totalEnergy.toFixed(2),
                water: totalWater.toFixed(2)
            }
        },
        details
    };
};

module.exports = { calculateImpact };