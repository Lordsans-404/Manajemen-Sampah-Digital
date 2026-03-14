/**
 * @fileoverview Integrasi API pihak ketiga (NewsAPI).
 */

const API_URL = "https://newsapi.org/v2/everything?q=environment+recycling&language=en&sortBy=publishedAt";
const API_KEY = process.env.NEWS_API_KEY; 

const fetchEnvironmentalNews = async () => {
    try {
        const response = await fetch(`${API_URL}&apiKey=${API_KEY}`);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const data = await response.json();
        return data.articles.slice(0, 5).map(article => ({
            title: article.title,
            source: article.source.name,
            url: article.url,
            publishedAt: article.publishedAt
        }));
    } catch (error) {
        console.error("News API Error:", error.message);
        return [{ title: "Sistem Daur Ulang Lokal Ditingkatkan", source: "Sistem Internal", url: "#" }];
    }
};

module.exports = { fetchEnvironmentalNews };