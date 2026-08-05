const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });
console.log("API Key loaded:", process.env.CLASH_API_KEY ? "YES" : "NO");
console.log("API Key length:", process.env.CLASH_API_KEY?.length);
console.log("First 20 chars:", process.env.CLASH_API_KEY?.substring(0, 20));

const app = express();

app.use(cors());

app.get("/player/:tag", async (req, res) => {
    try {
        const tag = `%23${req.params.tag.replace("#", "")}`;
        const apiKey = process.env.CLASH_API_KEY?.trim();
        console.log("Using API key:", apiKey ? `YES (${apiKey.substring(0, 20)}...)` : "NO");
        console.log("Authorization header:", apiKey ? `Bearer ${apiKey.substring(0, 20)}...` : "NONE");

        const response = await axios.get(
            `https://api.clashofclans.com/v1/players/${tag}`,
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`
                }
            }
        );

        res.json(response.data);

    } catch (err) {
        console.error("Clash API error status:", err.response?.status);
        console.error("Clash API error data:", err.response?.data || err.message);
        res.status(err.response?.status || 500).json(err.response?.data || err.message);
    }
});

app.listen(process.env.PORT, () => {
    console.log("Server running on port 5000");
});
