const { cmd } = require('../command');
const { downloadMediaMessage } = require('../lib/msg');
const { empiretourl } = require('../lib/functions');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

let ffmpegPath = 'ffmpeg';
try {
    const staticFfmpeg = require('ffmpeg-static');
    if (staticFfmpeg) ffmpegPath = staticFfmpeg;
} catch (e) {}

const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

cmd({
    pattern: "sticker",
    alias: ["s", "stiker"],
    desc: "Convert image or short video into a sticker",
    category: "tools",
    react: "🎨",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!/image|video/.test(mime)) {
            return reply("❌ *Please reply to or send an image/video to make a sticker!*");
        }

        reply("⏳ *Creating your sticker...*");

        const mediaBuffer = await downloadMediaMessage(quoted, 'temp_media');
        const inputPath = path.join(tempDir, `input_${Date.now()}.${mime.split('/')[1].split(';')[0]}`);
        const outputPath = path.join(tempDir, `sticker_${Date.now()}.webp`);

        fs.writeFileSync(inputPath, mediaBuffer);

        const isVideo = mime.includes('video');
        const ffmpegCmd = isVideo
            ? `"${ffmpegPath}" -i "${inputPath}" -vcodec libwebp -filter:v "scale='min(320,iw)':min(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:(320-iw)/2:(320-ih)/2:color=black@0.0" -lossless 0 -compression_level 6 -q:v 50 -loop 0 -preset default -an -vsync 0 "${outputPath}"`
            : `"${ffmpegPath}" -i "${inputPath}" -vf "scale='min(320,iw)':min(320,ih)':force_original_aspect_ratio=decrease,pad=320:320:(320-iw)/2:(320-ih)/2:color=black@0.0" -vcodec libwebp "${outputPath}"`;

        exec(ffmpegCmd, async (err) => {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

            if (err || !fs.existsSync(outputPath)) {
                console.error("FFmpeg error:", err);
                return reply("❌ *Failed to convert media to sticker. Ensure FFmpeg is installed.*");
            }

            const stickerBuffer = fs.readFileSync(outputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

            await conn.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        });
    } catch (e) {
        console.error("Sticker Error:", e);
        reply(`❌ *Error creating sticker:* ${e.message}`);
    }
});

cmd({
    pattern: "toimage",
    alias: ["img", "toimg"],
    desc: "Convert a WebP sticker back to an image",
    category: "tools",
    react: "🖼️",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const quoted = m.quoted ? m.quoted : null;
        if (!quoted || quoted.type !== 'stickerMessage') {
            return reply("❌ *Please reply to a sticker to convert it to an image!*");
        }

        reply("⏳ *Converting sticker to image...*");

        const mediaBuffer = await downloadMediaMessage(quoted, 'temp_sticker');
        const inputPath = path.join(tempDir, `sticker_${Date.now()}.webp`);
        const outputPath = path.join(tempDir, `img_${Date.now()}.jpg`);

        fs.writeFileSync(inputPath, mediaBuffer);

        exec(`"${ffmpegPath}" -i "${inputPath}" "${outputPath}"`, async (err) => {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);

            if (err || !fs.existsSync(outputPath)) {
                console.error("FFmpeg toimage error:", err);
                return reply("❌ *Failed to convert sticker to image!*");
            }

            const imageBuffer = fs.readFileSync(outputPath);
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

            await conn.sendMessage(from, {
                image: imageBuffer,
                caption: "✨ *Converted from Sticker!*"
            }, { quoted: mek });
        });
    } catch (e) {
        console.error("ToImage Error:", e);
        reply(`❌ *Error:* ${e.message}`);
    }
});

cmd({
    pattern: "tourl",
    alias: ["upload", "url"],
    desc: "Upload media to direct URL link",
    category: "tools",
    react: "📤",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const quoted = m.quoted ? m.quoted : m;
        const mime = (quoted.msg || quoted).mimetype || '';

        if (!mime) {
            return reply("❌ *Please reply to an image, video, audio, or document to upload!*");
        }

        reply("⏳ *Uploading file to CDN server...*");

        const mediaBuffer = await downloadMediaMessage(quoted, 'temp_upload');
        const ext = mime.split('/')[1]?.split(';')[0] || 'bin';
        const tempPath = path.join(tempDir, `upload_${Date.now()}.${ext}`);

        fs.writeFileSync(tempPath, mediaBuffer);

        const result = await empiretourl(tempPath);
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

        const fileUrl = result.url || result.fileUrl || (typeof result === 'string' ? result : JSON.stringify(result));

        const text = `╭━━━〔 *📤 MEDIA UPLOAD SUCCESS* 〕━━━╮
┃
┃ 🔗 *Direct URL:* ${fileUrl}
┃ 📁 *MIME Type:* ${mime}
┃ 🚀 *Status:* Hosted Online
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯

> *© 2026 | Powered by Chathunga Bimsara*`;

        return await conn.sendMessage(from, { text }, { quoted: mek });
    } catch (e) {
        console.error("ToURL Error:", e);
        reply(`❌ *Upload failed:* ${e.message}`);
    }
});

cmd({
    pattern: "ai",
    alias: ["chat", "gpt", "botai", "ask"],
    desc: "Ask anything from AI Assistant",
    category: "tools",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("🤖 *Please ask a question!*\n\n*Example:* `.ai Explain quantum computing in Sinhala`");

        await conn.sendMessage(from, { react: { text: "🧠", key: mek.key } });

        let aiResponse = null;

        try {
            const apiRes0 = await axios.get(`https://text.pollinations.ai/${encodeURIComponent(q)}`, {
                headers: { 'User-Agent': 'Mozilla/5.0' },
                timeout: 12000
            });
            if (apiRes0.data && typeof apiRes0.data === 'string' && apiRes0.data.trim().length > 0) {
                aiResponse = apiRes0.data.trim();
            }
        } catch (err) {}
        
        if (!aiResponse) {
            try {
                const apiRes = await axios.get(`https://api.vreden.web.id/api/ai-chat?query=${encodeURIComponent(q)}`, { timeout: 8000 });
                if (apiRes.data && (apiRes.data.result || apiRes.data.response)) {
                    aiResponse = apiRes.data.result || apiRes.data.response;
                }
            } catch (err) {}
        }

        if (!aiResponse) {
            try {
                const apiRes2 = await axios.get(`https://deliriussapi-oficial.vercel.app/ia/gptweb?text=${encodeURIComponent(q)}`);
                if (apiRes2.data && apiRes2.data.gpt) {
                    aiResponse = apiRes2.data.gpt;
                }
            } catch (err) {}
        }

        if (!aiResponse) {
            try {
                const apiRes3 = await axios.get(`https://kaiz-apis.gleeze.com/api/gpt-4o?q=${encodeURIComponent(q)}`);
                if (apiRes3.data && (apiRes3.data.response || apiRes3.data.result)) {
                    aiResponse = apiRes3.data.response || apiRes3.data.result;
                }
            } catch (err) {}
        }

        if (!aiResponse) {
            return reply("❌ *AI Server is currently busy. Please try again in a moment!*");
        }

        const text = `╭━━━〔 *🤖 CHATHUNGA-DEV AI* 〕━━━╮
┃
${aiResponse}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯

> *© 2026 | Powered by Chathunga Bimsara*`;

        return await conn.sendMessage(from, { text }, { quoted: mek });
    } catch (e) {
        console.error("AI Error:", e);
        reply(`❌ *AI Error:* ${e.message}`);
    }
});

cmd({
    pattern: "tr",
    alias: ["translate"],
    desc: "Translate text to Sinhala or chosen language",
    category: "tools",
    react: "🌐",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        let textToTranslate = q;
        let lang = "si"; // Default to Sinhala

        if (m.quoted && m.quoted.text) {
            textToTranslate = m.quoted.text;
            if (q.trim().length === 2) lang = q.trim();
        } else if (q.includes(" ")) {
            const parts = q.split(" ");
            if (parts[0].length === 2) {
                lang = parts[0];
                textToTranslate = parts.slice(1).join(" ");
            }
        }

        if (!textToTranslate) {
            return reply("🌐 *Please provide text or reply to a message to translate!*\n\n*Usage:* `.tr Hello world` or `.tr en [reply message]`");
        }

        const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(textToTranslate)}`);
        const translatedText = res.data[0].map(item => item[0]).join("");

        const text = `╭━━━〔 *🌐 TRANSLATOR* 〕━━━╮
┃
┃ 🗣️ *Target Lang:* ${lang.toUpperCase()}
┃
┃ 📝 *Result:*
${translatedText}
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯

> *© 2026 | Powered by Chathunga Bimsara*`;

        return await conn.sendMessage(from, { text }, { quoted: mek });
    } catch (e) {
        console.error("Translate Error:", e);
        reply(`❌ *Translation failed:* ${e.message}`);
    }
});

cmd({
    pattern: "qr",
    alias: ["qrcode"],
    desc: "Generate QR code image from text or URL",
    category: "tools",
    react: "📱",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("📱 *Please provide text or URL to generate QR code!*");

        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(q)}`;

        return await conn.sendMessage(from, {
            image: { url: qrUrl },
            caption: `📱 *QR Code generated for:* ${q}\n\n> *© 2026 | Powered by Chathunga Bimsara*`
        }, { quoted: mek });
    } catch (e) {
        console.error("QR Error:", e);
        reply(`❌ *QR Generation error:* ${e.message}`);
    }
});

cmd({
    pattern: "short",
    alias: ["tinyurl", "shorten"],
    desc: "Shorten long URLs into tiny links",
    category: "tools",
    react: "🔗",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("🔗 *Please provide a URL to shorten!*");

        const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(q)}`);
        
        return reply(`╭━━━〔 *🔗 URL SHORTENER* 〕━━━╮\n┃\n┃ 📌 *Original:* ${q}\n┃ 🚀 *Shortened:* ${res.data}\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n> *© 2026 | Powered by Chathunga Bimsara*`);
    } catch (e) {
        console.error("Shortener Error:", e);
        reply(`❌ *Failed to shorten URL:* ${e.message}`);
    }
});
