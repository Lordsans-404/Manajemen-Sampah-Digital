/**
 * @fileoverview 
 * Entry point server HTTP
 */
const http = require('http');
const { calculateImpact, getWasteTypes } = require('./features/wasteCalculator');
const { fetchEnvironmentalNews }          = require('./features/newsService');
const { accumulateStats, getStats } = require('./features/impactStats');

const sendJSON = (res, statusCode, payload) => {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Nanti bisa diganti sama domain nyang bener
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
            // Proteksi memory leak / payload berlebih
            if (body.length > 1e6) {
                req.connection.destroy();
                reject(new Error("Payload terlalu besar"));
            }
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(new Error("Format JSON tidak valid"));
            }
        });
        req.on('error', (err) => reject(err));
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

    // GET /api/waste/types 
    if (urlPath === '/api/waste/types' && req.method === 'GET') {
        return sendJSON(res, 200, { success: true, data: getWasteTypes() });
    }

    // POST /api/waste/calculations 
    else if (urlPath === '/api/waste/calculations' && req.method === 'POST') {
        try {
            const body = await parseJSONBody(req);
            
            if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
                return sendJSON(res, 400, {
                    success: false,
                    message: "Format request salah. 'items' harus berupa array yang tidak kosong."
                });
            }

            const result = await calculateImpact(body.items);
            accumulateStats(result); 
            return sendJSON(res, 200, { success: true, data: result });

        } catch (error) {
            return sendJSON(res, 400, { success: false, message: error.message });
        }
    } 
    
    // GET /api/news 
    else if (urlPath === '/api/news' && req.method === 'GET') {
        try {
            const news = await fetchEnvironmentalNews();
            return sendJSON(res, 200, { success: true, data: news });
        } catch (error) {
            return sendJSON(res, 500, { success: false, message: "Server error saat mengambil berita" });
        }
    } 

    // GET /api/stats 
    if (urlPath === '/api/stats' && req.method === 'GET') {
        return sendJSON(res, 200, { success: true, data: getStats() });
    }
    
    else {
        return sendJSON(res, 404, { success: false, message: "Endpoint tidak ditemukan" });
    }
});

// kalau mau nyalain backend masuk ke folder backend n jalanin node server.js aja (di terminal)
const PORT = 3000; 
server.listen(PORT, () => {
    console.log(`Running on http://localhost:${PORT}`);
});