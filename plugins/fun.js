const { cmd, commands } = require('../command');
const config = require('../config');
const { runtime } = require('../lib/functions');
const os = require('os');

cmd({
    pattern: "ping",
    alias: ["speed", "latency"],
    desc: "Check bot response speed & latency",
    category: "main",
    react: "⚡",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    const startTime = Date.now();
    const msg = await reply("⚡ *Testing response speed...*");
    const endTime = Date.now();
    const ping = endTime - startTime;

    const text = `╭━━━〔 *⚡ CHATHUNGA-DEV PING* 〕━━━╮
┃
┃ 🚀 *Response Latency:* \`${ping} ms\`
┃ ⏱️ *Bot Uptime:* \`${runtime(process.uptime())}\`
┃ 💻 *Platform:* \`${os.platform()} (${os.arch()})\`
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯

> *© 2026 | Powered by Chathunga Bimsara*`;

    return await conn.sendMessage(from, { text }, { quoted: mek });
});

cmd({
    pattern: "system",
    alias: ["sysinfo", "botinfo", "stats"],
    desc: "View detailed system performance & info",
    category: "system",
    react: "🖥️",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const usedRam = (totalRam - freeRam).toFixed(2);
    const ramUsage = Math.round((usedRam / totalRam) * 100);

    const cpus = os.cpus();
    const cpuModel = cpus.length > 0 ? cpus[0].model : 'Unknown';

    const text = `╭━━━〔 *🖥️ SYSTEM SPECIFICATIONS* 〕━━━╮
┃
┃ 🤖 *Bot Name:* Chathunga-Dev WhatsApp Bot
┃ 👤 *Owner:* Chathunga Bimsara
┃ ⏱️ *Uptime:* ${runtime(process.uptime())}
┃ 🧠 *RAM Usage:* ${usedRam} GB / ${totalRam} GB (${ramUsage}%)
┃ 💾 *Free RAM:* ${freeRam} GB
┃ ⚙️ *CPU Model:* ${cpuModel}
┃ 🎛️ *CPU Cores:* ${cpus.length} Cores
┃ 🐧 *OS Platform:* ${os.type()} (${os.arch()})
┃ 🟢 *Node.js Version:* ${process.version}
┃ 📦 *Commands Loaded:* ${commands.length} Commands
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯

> *© 2026 | Powered by Chathunga Bimsara*`;

    return await conn.sendMessage(from, {
        image: { url: config.ALIVE_IMG },
        caption: text
    }, { quoted: mek });
});

cmd({
    pattern: "owner",
    alias: ["developer", "creator", "dev"],
    desc: "Get bot owner details & contact info",
    category: "main",
    react: "👑",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    const ownerNumber = config.BOT_OWNER || "94767945968";
    const vcard = 'BEGIN:VCARD\n' +
        'VERSION:3.0\n' +
        'FN:Chathunga Bimsara\n' +
        'ORG:Chathunga-Dev;\n' +
        'TEL;type=CELL;type=VOICE;waid=' + ownerNumber + ':+' + ownerNumber + '\n' +
        'END:VCARD';

    await conn.sendMessage(from, {
        contacts: { displayName: "Chathunga Bimsara", contacts: [{ vcard }] }
    }, { quoted: mek });

    const ownerText = `╭━━━〔 *👑 BOT CREATOR INFO* 〕━━━╮
┃
┃ 👤 *Owner Name:* Chathunga Bimsara
┃ 📞 *WhatsApp:* +${ownerNumber}
┃ 🌐 *GitHub:* github.com/chathunga2007
┃ 🤖 *Bot Project:* Chathunga-Dev WhatsApp Bot
┃ 🇱🇰 *Country:* Sri Lanka
┃
╰━━━━━━━━━━━━━━━━━━━━━━━╯

> *Feel free to contact for any bot updates or inquiries!*`;

    return await conn.sendMessage(from, { text: ownerText }, { quoted: mek });
});

cmd({
    pattern: "restart",
    alias: ["reboot"],
    desc: "Restart the WhatsApp bot (Owner Only)",
    category: "system",
    react: "🔄",
    filename: __filename
}, async (conn, mek, m, { from, isOwner, reply }) => {
    if (!isOwner) return reply("❌ *This command is restricted to the Bot Owner only!*");

    await reply("🔄 *Restarting Chathunga-Dev WhatsApp Bot... Please wait a few seconds!*");
    setTimeout(() => {
        process.exit(0);
    }, 1500);
});
