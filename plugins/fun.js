const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "weather",
    alias: ["climate", "rain"],
    desc: "Get weather report for any city",
    category: "fun",
    react: "🌤️",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("🌤️ *Please enter a city name!*\n\n*Example:* `.weather Colombo` or `.climate Galle`");

        await conn.sendMessage(from, { react: { text: "🌤️", key: mek.key } });

        let cityName = q;
        let country = "";
        let temp = "";
        let feelsLike = "";
        let condition = "Clear";
        let humidity = "";
        let wind = "";
        let pressure = "";
        let success = false;

        // Provider 1: wttr.in
        try {
            const res1 = await axios.get(`https://wttr.in/${encodeURIComponent(q)}?format=j1`, { timeout: 8000 });
            if (res1.data && res1.data.current_condition && res1.data.current_condition.length > 0) {
                const current = res1.data.current_condition[0];
                const area = res1.data.nearest_area ? res1.data.nearest_area[0] : null;

                cityName = area && area.areaName && area.areaName[0] ? area.areaName[0].value : q;
                country = area && area.country && area.country[0] ? area.country[0].value : "";
                temp = `${current.temp_C}°C`;
                feelsLike = `${current.FeelsLikeC}°C`;
                condition = current.weatherDesc && current.weatherDesc[0] ? current.weatherDesc[0].value : "Clear";
                humidity = `${current.humidity}%`;
                wind = `${current.windspeedKmph} km/h`;
                pressure = `${current.pressure} hPa`;
                success = true;
            }
        } catch (err) {}

        // Provider 2: Open-Meteo Fallback
        if (!success) {
            try {
                const geo = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1`, { timeout: 8000 });
                if (geo.data && geo.data.results && geo.data.results.length > 0) {
                    const loc = geo.data.results[0];
                    const w = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,wind_speed_10m`, { timeout: 8000 });
                    if (w.data && w.data.current) {
                        const cur = w.data.current;
                        cityName = loc.name;
                        country = loc.country || "";
                        temp = `${cur.temperature_2m}°C`;
                        feelsLike = `${cur.apparent_temperature}°C`;
                        humidity = `${cur.relative_humidity_2m}%`;
                        wind = `${cur.wind_speed_10m} km/h`;
                        pressure = `${cur.surface_pressure} hPa`;
                        condition = "Partly Cloudy";
                        success = true;
                    }
                }
            } catch (err) {}
        }

        // Provider 3: OpenWeatherMap Fallback
        if (!success) {
            try {
                const res3 = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&units=metric&appid=060fa735373d7241434a70e30287349c`, { timeout: 8000 });
                if (res3.data && res3.data.main) {
                    const d = res3.data;
                    cityName = d.name;
                    country = d.sys ? d.sys.country : "";
                    temp = `${d.main.temp}°C`;
                    feelsLike = `${d.main.feels_like}°C`;
                    condition = d.weather && d.weather[0] ? d.weather[0].description : "Clear";
                    humidity = `${d.main.humidity}%`;
                    wind = `${d.wind.speed} m/s`;
                    pressure = `${d.main.pressure} hPa`;
                    success = true;
                }
            } catch (err) {}
        }

        if (!success) {
            return reply("❌ *Could not find weather data for this city. Please check the spelling!*");
        }

        const text = `╭━━━〔 *🌤️ WEATHER REPORT* 〕━━━╮
┃
┃ 📍 *City:* ${cityName}${country ? `, ${country}` : ""}
┃ 🌡️ *Temperature:* ${temp} (Feels like ${feelsLike})
┃ ☁️ *Condition:* ${condition}
┃ 💧 *Humidity:* ${humidity}
┃ 💨 *Wind Speed:* ${wind}
┃ 🌐 *Pressure:* ${pressure}
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
