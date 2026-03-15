/**
 * @fileoverview Integrasi API
 */

const API_URL = "https://newsapi.org/v2/everything?q=environment+recycling&language=en&sortBy=publishedAt";

const fetchEnvironmentalNews = async () => {
    const API_KEY = process.env.NEWS_API_KEY; 

    if (!API_KEY) {
        throw new Error("SERVER_CONFIG_ERROR: NEWS_API_KEY tidak ditemukan di .env");
    }

    try {
        const response = await fetch(`${API_URL}&apiKey=${API_KEY}`);
        
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(`UPSTREAM_ERROR_${response.status}: ${errorBody.message || response.statusText}`);
        }
        
        const data = await response.json();

        if (!data.articles || !Array.isArray(data.articles)) {
            throw new Error("UPSTREAM_ERROR: Format data dari NewsAPI tidak sesuai ekspektasi.");
        }

        const validArticles = data.articles
            .filter(article => article.urlToImage && article.title && article.url)
            .slice(0, 50) 
            .map(article => ({
                title: article.title,
                source: article.source.name || "Sumber Tidak Diketahui",
                url: article.url,
                publishedAt: article.publishedAt,
                imageUrl: article.urlToImage, 
                description: article.description
            }));

        return validArticles;

    } catch (error) {
        console.error("[NewsService Error]:", error.message);
        throw error; 
    }
};

module.exports = { fetchEnvironmentalNews };