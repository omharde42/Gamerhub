const axios = require("axios");

async function getGamingNews(req, res) {
    try {
        const region = req.query.region || "global";

        let params = {
            apikey: process.env.GNEWS_API_KEY,
            lang: "en",
            max: 10,
            q: "gaming OR esports OR videogames"
        };

        if (region === "india") {
            params.country = "in";
        }

        const response = await axios.get(
            "https://gnews.io/api/v4/top-headlines",
            { params }
        );

        res.json({
            success: true,
            region,
            articles: response.data.articles
        });

    } catch (error) {
        console.error(
            "GNews error:",
            error.response?.data || error.message
        );

        res.status(500).json({
            success: false,
            message: "Unable to fetch gaming news"
        });
    }
}

module.exports = getGamingNews;