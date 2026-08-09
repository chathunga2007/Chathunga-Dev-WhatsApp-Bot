const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "weather",
    alias: ["climate"],
    desc: "Get weather report for any city",
    category: "fun",
    react: "🌤️",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("🌤️ *Please enter a city name!*\n\n*Example:* `.weather Colombo`");

        const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&units=metric&appid=060fa735373d7241434a70e30287349c`).catch(() => null);

        if (!res || !res.data) {
            return reply("❌ *City not found or weather service unavailable!*");
        }

        const data = res.data;
        const text = `╭━━━〔 *🌤️ WEATHER REPORT* 〕━━━╮
┃
┃ 📍 *City:* ${data.name}, ${data.sys.country}
┃ 🌡️ *Temperature:* ${data.main.temp}°C (Feels like ${data.main.feels_like}°C)
┃ ☁️ *Condition:* ${data.weather[0].description}
┃ 💧 *Humidity:* ${data.main.humidity}%
┃ 💨 *Wind Speed:* ${data.wind.speed} m/s
┃ 🌐 *Pressure:* ${data.main.pressure} hPa
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯

> *© 2026 | Powered by Chathunga Bimsara*`;

        return await conn.sendMessage(from, { text }, { quoted: mek });
    } catch (e) {
        console.error("Weather Error:", e);
        reply(`❌ *Weather Error:* ${e.message}`);
    }
});

cmd({
    pattern: "joke",
    alias: ["funny"],
    desc: "Get a random funny joke",
    category: "fun",
    react: "😂",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const res = await axios.get("https://official-joke-api.appspot.com/random_joke").catch(() => null);
        if (!res || !res.data) return reply("😂 *Why don't scientists trust atoms? Because they make up everything!*");

        const text = `╭━━━〔 *😂 RANDOM JOKE* 〕━━━╮
┃
┃ ❓ *Setup:* ${res.data.setup}
┃ 💡 *Punchline:* ${res.data.punchline}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯

> *© 2026 | Powered by Chathunga Bimsara*`;

        return await conn.sendMessage(from, { text }, { quoted: mek });
    } catch (e) {
        reply("😂 *Why did the computer go to the doctor? Because it had a virus!*");
    }
});

cmd({
    pattern: "quote",
    alias: ["motivation"],
    desc: "Get an inspirational quote",
    category: "fun",
    react: "💬",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const res = await axios.get("https://api.quotable.io/random").catch(() => null);
        if (!res || !res.data) {
            return reply(`💬 *"Believe you can and you're halfway there."*\n— *Theodore Roosevelt*`);
        }

        const text = `╭━━━〔 *💬 DAILY MOTIVATION* 〕━━━╮
┃
┃ 📜 *"${res.data.content}"*
┃ 👤 *Author:* ${res.data.author}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯

> *© 2026 | Powered by Chathunga Bimsara*`;

        return await conn.sendMessage(from, { text }, { quoted: mek });
    } catch (e) {
        reply(`💬 *"Success is not final, failure is not fatal: it is the courage to continue that counts."*\n— *Winston Churchill*`);
    }
});

cmd({
    pattern: "fact",
    alias: ["randomfact"],
    desc: "Get an interesting random fact",
    category: "fun",
    react: "🧠",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const res = await axios.get("https://uselessfacts.jsph.pl/api/v2/facts/random").catch(() => null);
        if (!res || !res.data) return reply("🧠 *Did you know? Honey never spoils!*");

        const text = `╭━━━〔 *🧠 RANDOM FACT* 〕━━━╮
┃
┃ 💡 ${res.data.text}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯

> *© 2026 | Powered by Chathunga Bimsara*`;

        return await conn.sendMessage(from, { text }, { quoted: mek });
    } catch (e) {
        reply("🧠 *Did you know? Bananas are curved because they grow towards the sun!*");
    }
});

cmd({
    pattern: "flip",
    alias: ["coinflip", "coin"],
    desc: "Flip a coin (Heads or Tails)",
    category: "fun",
    react: "🪙",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const outcome = Math.random() < 0.5 ? "HEADS 🪙" : "TAILS 🪙";
    return reply(`🪙 *Flipping a coin... Result:* **${outcome}**`);
});

cmd({
    pattern: "roll",
    alias: ["dice"],
    desc: "Roll a 6-sided dice",
    category: "fun",
    react: "🎲",
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const dice = Math.floor(Math.random() * 6) + 1;
    return reply(`🎲 *Rolling the dice... Result:* **${dice}**`);
});
