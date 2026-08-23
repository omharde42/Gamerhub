const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const getGamingNews = require("./news");

const app = express();

// Restrict CORS to the configured frontend origin(s) instead of allowing every
// origin, which lets any website call this API from the browser.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '1mb' }));

const PORT = process.env.PORT || process.env.port || 5000;

const clashKey = (
    process.env.CLASH_OF_CLANS_API_TOKEN ||
    process.env.CLASH_API_KEY ||
    ""
).trim();

const pubgKey = (
    process.env.PUBG_API_KEY ||
    ""
).trim();

// Log presence only - never log key material or its length.
console.log("Clash API Key loaded:", clashKey ? "YES" : "NO");
console.log("PUBG API Key loaded:", pubgKey ? "YES" : "NO");

// Health Endpoint
app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "GamerZ Hub API is running"
    });
});

// Gaming News Route
app.get("/api/news", getGamingNews);

// Clash of Clans Player Route
app.get("/player/:tag", async (req, res) => {
    try {
        // Validate + normalize the tag server-side before any API call.
        const rawTag = (req.params.tag || "").trim().replace(/^#/, "").toUpperCase();
        if (!/^[A-Z0-9]{3,15}$/.test(rawTag)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Clash of Clans player tag. Tags are 3-15 characters (letters and numbers), e.g. #GR8QQRV9J."
            });
        }
        const tag = `%23${rawTag}`;
        if (!clashKey) {
            return res.status(500).json({ success: false, message: "Clash of Clans API token missing on server configuration." });
        }

        const response = await axios.get(
            `https://api.clashofclans.com/v1/players/${tag}`,
            {
                headers: {
                    Authorization: `Bearer ${clashKey}`
                },
                timeout: 10000
            }
        );

        res.json({
            success: true,
            data: response.data
        });
    } catch (err) {
        console.error("Clash API error status:", err.response?.status);
        console.error("Clash API error data:", err.response?.data || err.message);
        const status = err.response?.status || 500;
        if (status === 404) {
            return res.status(404).json({ success: false, message: `Player with tag #${rawTag} not found.` });
        }
        res.status(status).json(err.response?.data || { success: false, message: err.message });
    }
});

// PUBG Player Endpoint with Normalized Stats & Error Handling
app.get("/pubg/player/:platform/:playerName", async (req, res) => {
    try {
        const { platform, playerName } = req.params;

        if (!platform || platform.toLowerCase() !== "steam") {
            return res.status(400).json({
                success: false,
                message: "Currently GamerZ Hub supports PUBG PC/Steam players only."
            });
        }

        if (!pubgKey) {
            return res.status(500).json({
                success: false,
                message: "PUBG API authorization failed. Check server configuration."
            });
        }

        // Validate the player name server-side: reject numeric PUBG Mobile UIDs
        // and unsupported characters (PC/Console integration only).
        const trimmedName = playerName.trim();
        if (trimmedName.length < 2 || trimmedName.length > 50) {
            return res.status(400).json({ success: false, message: "PUBG player name must be between 2 and 50 characters." });
        }
        if (/^\d+$/.test(trimmedName)) {
            return res.status(400).json({
                success: false,
                message: "PUBG Mobile UIDs are numeric IDs and are not supported for the PC/Console integration. Enter your PUBG PC/Steam player name instead."
            });
        }
        if (!/^[A-Za-z0-9_.\- ]+$/.test(trimmedName)) {
            return res.status(400).json({ success: false, message: "PUBG player name contains unsupported characters." });
        }

        const encodedPlayerName = encodeURIComponent(trimmedName);

        // Step 1: Query Player by Name
        let playerRes;
        try {
            playerRes = await axios.get(
                `https://api.pubg.com/shards/steam/players?filter[playerNames]=${encodedPlayerName}`,
                {
                    headers: {
                        Authorization: `Bearer ${pubgKey}`,
                        Accept: "application/vnd.api+json"
                    },
                    timeout: 10000
                }
            );
        } catch (apiErr) {
            const errStatus = apiErr.response?.status;
            if (errStatus === 404) {
                return res.status(404).json({ success: false, message: "PUBG player not found." });
            }
            if (errStatus === 401 || errStatus === 403) {
                return res.status(401).json({ success: false, message: "PUBG API authorization failed. Check server configuration." });
            }
            if (errStatus === 429) {
                return res.status(429).json({ success: false, message: "PUBG API rate limit reached. Please try again later." });
            }
            if (apiErr.code === "ECONNABORTED" || apiErr.code === "ETIMEDOUT") {
                return res.status(504).json({ success: false, message: "PUBG API request timed out. Please try again later." });
            }
            throw apiErr;
        }

        const playerData = playerRes.data?.data?.[0];
        if (!playerData) {
            return res.status(404).json({ success: false, message: "PUBG player not found." });
        }

        const accountId = playerData.id;
        const realName = playerData.attributes?.name || playerName;
        const clanId = playerData.attributes?.clanId || null;

        // Step 2: Fetch Lifetime Statistics
        let kills = 0;
        let deaths = 0;
        let wins = 0;
        let matches = 0;
        let damageDealt = 0;

        try {
            const statsRes = await axios.get(
                `https://api.pubg.com/shards/steam/players/${accountId}/seasons/lifetime`,
                {
                    headers: {
                        Authorization: `Bearer ${pubgKey}`,
                        Accept: "application/vnd.api+json"
                    },
                    timeout: 10000
                }
            );

            const modeStats = statsRes.data?.data?.attributes?.gameModeStats;
            if (modeStats) {
                for (const modeKey in modeStats) {
                    const mode = modeStats[modeKey];
                    kills += mode.kills || 0;
                    deaths += mode.losses || 0;
                    wins += mode.wins || 0;
                    matches += mode.roundsPlayed || 0;
                    damageDealt += mode.damageDealt || 0;
                }
            }
        } catch (statsErr) {
            // Never return zeroed lifetime stats when the statistics request
            // fails — the client must know the stats are unavailable.
            console.warn("Could not fetch PUBG lifetime stats:", statsErr.message);
            const errStatus = statsErr.response?.status;
            if (statsErr.code === "ECONNABORTED" || statsErr.code === "ETIMEDOUT") {
                return res.status(504).json({ success: false, message: "PUBG lifetime statistics request timed out. Please try again later." });
            }
            if (errStatus === 429) {
                return res.status(429).json({ success: false, message: "PUBG API rate limit reached. Please try again later." });
            }
            return res.status(errStatus || 502).json({
                success: false,
                message: "PUBG lifetime statistics are currently unavailable for this player. Please try again later."
            });
        }

        const kdRatio = deaths > 0 ? (kills / deaths).toFixed(2) : (kills > 0 ? kills.toString() : "0.00");
        const winRate = matches > 0 ? `${((wins / matches) * 100).toFixed(1)}%` : "0.0%";

        return res.json({
            success: true,
            game: "PUBG",
            platform: "Steam",
            player: {
                id: accountId,
                name: realName,
                shard: "steam",
                clanId: clanId,
                banType: playerData.attributes?.banType || "Innocent"
            },
            stats: {
                kills: kills,
                deaths: deaths,
                wins: wins,
                matches: matches,
                kdRatio: matches > 0 ? kdRatio : "N/A",
                winRate: matches > 0 ? winRate : "N/A",
                accuracy: "N/A",
                accuracyNote: "Not available from PUBG API"
            }
        });

    } catch (err) {
        console.error("PUBG API unexpected error:", err.response?.data || err.message);
        return res.status(err.response?.status || 500).json({
            success: false,
            message: err.response?.data?.message || err.message || "Failed to fetch PUBG player data."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
