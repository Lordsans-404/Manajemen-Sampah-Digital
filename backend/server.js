/**
 * @fileoverview Entry point server HTTP
 */
const http = require('http');
const { calculateImpact, getWasteTypes }  = require('./features/wasteCalculator');
const { fetchEnvironmentalNews }          = require('./features/newsService');
const { accumulateStats, getStats }       = require('./features/impactStats');

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
            if (body.length > 1e6) {
                req.connection.destroy();
                reject(new Error("CLIENT_ERROR: Payload terlalu besar"));
            }
        });
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (error) {
                reject(new Error("CLIENT_ERROR: Format JSON tidak valid"));
            }
        });
        req.on('error', (err) => reject(new Error("SERVER_ERROR: Gagal membaca request")));
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

    if (urlPath === '/api/waste/types' && req.method === 'GET') {
        return sendJSON(res, 200, { success: true, data: getWasteTypes() });
    }

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
            const errorMsg = error.message;
            
            // Logika Status Code Berdasarkan Tipe Error
            if (errorMsg.includes("CLIENT_ERROR")) {
                return sendJSON(res, 400, { success: false, message: errorMsg.replace("CLIENT_ERROR: ", "") });
            } else if (errorMsg.includes("UPSTREAM_ERROR")) {
                return sendJSON(res, 502, { success: false, message: "Bad Gateway: Layanan AI tidak tersedia atau konfigurasi salah." });
            } else if (errorMsg.includes("SERVER_CONFIG_ERROR")) {
                return sendJSON(res, 500, { success: false, message: "Internal Server Error: Konfigurasi server tidak lengkap." });
            } else {
                return sendJSON(res, 500, { success: false, message: "Internal Server Error: Terjadi kesalahan yang tidak terduga." });
            }
        }
    } 
    
    else if (urlPath === '/api/news' && req.method === 'GET') {
        try {
            const news = await fetchEnvironmentalNews();
            return sendJSON(res, 200, { success: true, data: news });
        } catch (error) {
            return sendJSON(res, 502, { success: false, message: "Server error saat mengambil berita" });
        }
    } 

    else if (urlPath === '/api/stats' && req.method === 'GET') {
        return sendJSON(res, 200, { success: true, data: getStats() });
    }
    
    else {
        return sendJSON(res, 404, { success: false, message: "Endpoint tidak ditemukan" });
    }
});

const PORT = 3000; 
server.listen(PORT, () => {
    console.log(`Server is running robustly on http://localhost:${PORT}`);
});