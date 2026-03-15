/**
 * @fileoverview Logic Calculator udah terintegrasi sama AI gemini biar lebih fleksibel nerima inputnya
 */

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/**
 * @param {Array<string>} inputItems 
 * @returns {Promise<Array<Object|null>>} 
 */
const identifyWasteBatchWithAI = async (inputItems) => {
    const rawKey = process.env.GEMINI_API_KEY || '';
    const apiKey = rawKey.replace(/^['"]|['"]$/g, '').trim();
    
    if (!apiKey) {
        throw new Error("SERVER_CONFIG_ERROR: GEMINI_API_KEY hilang atau kosong di sistem.");
    }

    const promptText = `Kamu adalah sistem klasifikasi sampah daur ulang di Indonesia.
Tugasmu: identifikasi array berisi jenis sampah dari input user dan berikan estimasi metrik lingkungannya.

Kategori yang tersedia: plastik, kertas, kaca, logam, elektronik.
Kalau input tidak jelas, tebak kategori yang paling mendekati.
Kalau benar-benar tidak bisa diklasifikasikan sebagai sampah daur ulang (misal: tanah, makanan busuk), set category menjadi null.

Input user: ${JSON.stringify(inputItems)}

Jawab HANYA dengan JSON Array of Objects sesuai skema berikut, pastikan urutannya sama persis dengan input user:
[
  {
    "originalInput": "botol aqua bekas",
    "category": "plastik",
    "label": "Botol Plastik",
    "price": 3000,
    "co2Saved": 1.5,
    "energySaved": 5.7,
    "waterSaved": 0,
    "confidence": "high"
  }
]

Keterangan field:
- originalInput: string persis dari input user
- category: [plastik, kertas, kaca, logam, elektronik] atau null
- label: nama spesifik item
- price: estimasi harga per kg (IDR)
- co2Saved: kg CO2 dicegah per kg
- energySaved: kWh energi dihemat per kg
- waterSaved: liter air dihemat per kg
- confidence: "high" | "medium" | "low"`;

    const response = await fetch(`${GEMINI_BASE_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: promptText }]
            }],
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.1 
            }
        })
    });

    if (!response.ok) {
        const errBody = await response.json();
        console.error('Gemini Error Detail:', JSON.stringify(errBody, null, 2));
        
        if (response.status === 400 && errBody.error?.message?.includes("API key")) {
            throw new Error("UPSTREAM_ERROR_401: Invalid Gemini API Key.");
        }
        throw new Error(`UPSTREAM_ERROR_${response.status}: Gagal menghubungi AI Gemini.`);
    }

    const data = await response.json();
    
    try {
        const rawJsonText = data.candidates[0].content.parts[0].text;
        return JSON.parse(rawJsonText);
    } catch (error) {
        console.error("Gagal parsing JSON dari Gemini:", data);
        throw new Error("AI_PARSING_ERROR: Format respons AI tidak sesuai skema.");
    }
};

/**
 * Kalkulasi total finansial dan dampak lingkunganzz
 * @param {Array} 
 * @returns {Object} 
 */
const calculateImpact = async (items) => {
    const validInputs = [];
    const invalidItems = [];
    const itemMap = new Map();

    items.forEach((item, index) => {
        const weight = Number(item.weight);
        if (isNaN(weight) || weight <= 0) {
            invalidItems.push({ index, originalInput: item.type, reason: `Berat tidak valid: '${item.weight}'` });
        } else {
            validInputs.push(item.type);
            itemMap.set(item.type, { index, weight });
        }
    });

    if (validInputs.length === 0) {
        throw new Error("CLIENT_ERROR: Tidak ada item dengan format berat yang valid untuk diproses.");
    }

    const aiResults = await identifyWasteBatchWithAI(validInputs);

    let totalFinancialSavings = 0;
    let totalCO2Saved         = 0;
    let totalEnergySaved      = 0;
    let totalWaterSaved       = 0;
    const details = [];

    aiResults.forEach((metrics) => {
        const originalInput = metrics.originalInput;
        const originalData = itemMap.get(originalInput);
        
        if (!originalData) return; 

        if (!metrics.category) {
            invalidItems.push({
                index: originalData.index,
                originalInput,
                reason: `'${originalInput}' tidak dapat diklasifikasikan sebagai sampah daur ulang`
            });
            return;
        }

        const weight = originalData.weight;
        const subtotalPrice  = metrics.price * weight;
        const subtotalCO2    = metrics.co2Saved * weight;
        const subtotalEnergy = metrics.energySaved * weight;
        const subtotalWater  = metrics.waterSaved * weight;

        totalFinancialSavings += subtotalPrice;
        totalCO2Saved         += subtotalCO2;
        totalEnergySaved      += subtotalEnergy;
        totalWaterSaved       += subtotalWater;

        details.push({
            type:          metrics.category,
            label:         metrics.label,
            originalInput,
            confidence:    metrics.confidence,
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
        throw new Error(`CLIENT_ERROR: Tidak ada item valid. Detail: ${invalidItems.map(i => i.reason).join('; ')}`);
    }

    return {
        summary: {
            totalFinancial_IDR: totalFinancialSavings,
            totalEnvironmentalImpact: {
                co2Saved_Kg:       Number(totalCO2Saved.toFixed(2)),
                energySaved_Kwh:   Number(totalEnergySaved.toFixed(2)),
                waterSaved_Liters: Number(totalWaterSaved.toFixed(2))
            }
        },
        details,
        ...(invalidItems.length > 0 && { warnings: invalidItems })
    };
};

const getWasteTypes = () => {
    return [
        { value: 'plastik',    label: 'Plastik',    examples: ['botol', 'kresek', 'sedotan', 'ember'] },
        { value: 'kertas',     label: 'Kertas',     examples: ['kardus', 'koran', 'majalah', 'dus'] },
        { value: 'kaca',       label: 'Kaca',       examples: ['botol kaca', 'cermin', 'gelas kaca'] },
        { value: 'logam',      label: 'Logam/Besi', examples: ['kaleng', 'besi', 'aluminium', 'kawat'] },
        { value: 'elektronik', label: 'Elektronik', examples: ['baterai', 'hp', 'charger', 'laptop'] },
    ];
};

module.exports = { calculateImpact, getWasteTypes };