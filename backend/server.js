const http = require('http');
// For deployment purposes!
// const fs = require('fs');
const path = require('path');
const { calculateImpact }  = require('./features/wasteCalculator');
const { fetchEnvironmentalNews }          = require('./features/newsService');
const { accumulateStats, getStats }       = require('./features/impactStats');
const { getBankSampah, getUniqueWilayah, getUniqueKecamatan } = require('./features/bankSampah');
const { getEduContent } = require('./features/eduService');

// For deployment purposes!
// try {
//     const envPath = path.join(__dirname, '.env');
//     if (fs.existsSync(envPath)) {
//         const envContent = fs.readFileSync(envPath, 'utf8');
//         envContent.split(/\r?\n/).forEach(line => {
//             const trimmedLine = line.trim();
//             if (trimmedLine && !trimmedLine.startsWith('#')) {
//                 const [key, ...valueParts] = trimmedLine.split('=');
//                 const value = valueParts.join('=').trim().replace(/^['"]|['"]$/g, '');
//                 process.env[key.trim()] = value;
//             }
//         });
//         console.log('Environment variables loaded manually');
//     } else {
//         console.log('File .env tidak ditemukan');
//     }
// } catch (err) {
//     console.error('Gagal membaca .env:', err.message);
// }

const sendJSON = (res, statusCode, payload) => {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS, GET, POST',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(payload));
};

const parseJSONBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(new Error("CLIENT_ERROR: JSON tidak valid"));
            }
        });
    });
};

const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'OPTIONS, GET, POST',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        return res.end();
    }

    const urlPath = req.url.split('?')[0];

    if (urlPath === '/api/waste/calculations' && req.method === 'POST') {
        try {
            const body = await parseJSONBody(req);
            const result = await calculateImpact(body.items);
            accumulateStats(result);
            return sendJSON(res, 200, { success: true, data: result });
        } catch (error) {
            console.error('[Server Error]', error.message);
            if (error.message.includes("CLIENT_ERROR")) {
                return sendJSON(res, 400, { success: false, message: error.message });
            }
            return sendJSON(res, 502, { 
                success: false, 
                message: "API Error", 
                detail: error.message 
            });
        }
    } 
    else if (urlPath === '/api/news') {
        try {
            const news = await fetchEnvironmentalNews();
            return sendJSON(res, 200, { success: true, data: news });
        } catch (e) { 
            console.error('[News API Error]', e.message);
            return sendJSON(res, 502, { success: false, message: e.message }); 
        }
    }

    else if (urlPath === '/api/edu' && req.method === 'GET') {
        return sendJSON(res, 200, { success: true, data: getEduContent() });
    }

    if (urlPath === '/api/wilayah' && req.method === 'GET') {
        return sendJSON(res, 200, { success: true, data: getUniqueWilayah() });
    }

    else if (urlPath === '/api/kecamatan' && req.method === 'GET') {
        const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
        const wilayah = urlParams.get('wilayah');
        return sendJSON(res, 200, { success: true, data: getUniqueKecamatan(wilayah) });
    }

    else if (urlPath === '/api/banksampah' && req.method === 'GET') {
        const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
        const wilayah = urlParams.get('wilayah');
        const kecamatan = urlParams.get('kecamatan');
        
        let results = getBankSampah(wilayah);
        if (kecamatan) {
            results = results.filter(item => 
                item.kecamatan.toLowerCase().includes(kecamatan.toLowerCase())
            );
        }
        return sendJSON(res, 200, { success: true, data: results });
    }

    else if (urlPath === '/api/stats' && req.method === 'GET') {
        try {
            const stats = getStats(); 
            return sendJSON(res, 200, { success: true, data: stats });
        } catch (e) {
            console.error('[Stats API Error]', e.message);
            return sendJSON(res, 502, { success: false, message: e.message });
        }
    }
    else {
        sendJSON(res, 404, { message: "Not Found" });
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});