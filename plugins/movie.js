const { cmd } = require("../command");
const puppeteer = require("puppeteer");

const pendingSearch = {};
const pendingQuality = {};

function normalizeQuality(text) {
  if (!text) return null;
  text = text.toUpperCase();
  if (/1080|FHD/.test(text)) return "1080p";
  if (/720|HD/.test(text)) return "720p";
  if (/480|SD/.test(text)) return "480p";
  return text;
}

function getDirectPixeldrainUrl(url) {
  const match = url.match(/pixeldrain\.com\/u\/(\w+)/);
  if (!match) return null;
  return `https://pixeldrain.com/api/file/${match[1]}?download`;
}

async function searchMovies(query) {
  const searchUrl = `https://sinhalasub.lk/?s=${encodeURIComponent(query)}&post_type=movies`;
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });
  const results = await page.$$eval(".display-item .item-box", boxes =>
    boxes.slice(0, 10).map((box, index) => {
      const a = box.querySelector("a");
      const img = box.querySelector(".thumb");
      const lang = box.querySelector(".item-desc-giha .language")?.textContent || "";
      const quality = box.querySelector(".item-desc-giha .quality")?.textContent || "";
      const qty = box.querySelector(".item-desc-giha .qty")?.textContent || "";
      return {
        id: index + 1,
        title: a?.title?.trim() || "",
        movieUrl: a?.href || "",
        thumb: img?.src || "",
        language: lang.trim(),
        quality: quality.trim(),
        qty: qty.trim(),
      };
    }).filter(m => m.title && m.movieUrl)
  );
  await browser.close();
  return results;
}

async function getMovieMetadata(url) {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
  const metadata = await page.evaluate(() => {
    const getText = el => el?.textContent.trim() || "";
    const getList = selector => Array.from(document.querySelectorAll(selector)).map(el => el.textContent.trim());
    const title = getText(document.querySelector(".info-details .details-title h3"));
    let language = "", directors = [], stars = [];
    document.querySelectorAll(".info-col p").forEach(p => {
      const strong = p.querySelector("strong");
      if (!strong) return;
      const txt = strong.textContent.trim();
      if (txt.includes("Language:")) language = strong.nextSibling?.textContent?.trim() || "";
      if (txt.includes("Director:")) directors = Array.from(p.querySelectorAll("a")).map(a => a.textContent.trim());
      if (txt.includes("Stars:")) stars = Array.from(p.querySelectorAll("a")).map(a => a.textContent.trim());
    });
    const duration = getText(document.querySelector(".info-details .data-views[itemprop='duration']"));
    const imdb = getText(document.querySelector(".info-details .data-imdb"))?.replace("IMDb:", "").trim();
    const genres = getList(".details-genre a");
    const thumbnail = document.querySelector(".splash-bg img")?.src || "";
    return { title, language, duration, imdb, genres, directors, stars, thumbnail };
  });
  await browser.close();
  return metadata;
}

async function getPixeldrainLinks(movieUrl) {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto(movieUrl, { waitUntil: "networkidle2", timeout: 30000 });
  const linksData = await page.$$eval(".link-pixeldrain tbody tr", rows =>
    rows.map(row => {
      const a = row.querySelector(".link-opt a");
      const quality = row.querySelector(".quality")?.textContent.trim() || "";
      const size = row.querySelector("td:nth-child(3) span")?.textContent.trim() || "";
      return { pageLink: a?.href || "", quality, size };
    })
  );
  const directLinks = [];
  for (const l of linksData) {
    try {
      const subPage = await browser.newPage();
      await subPage.goto(l.pageLink, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise(r => setTimeout(r, 12000));
      const finalUrl = await subPage.$eval(".wait-done a[href^='https://pixeldrain.com/']", el => el.href).catch(() => null);
      if (finalUrl) {
        let sizeMB = 0;
        const sizeText = l.size.toUpperCase();
        if (sizeText.includes("GB")) sizeMB = parseFloat(sizeText) * 1024;
        else if (sizeText.includes("MB")) sizeMB = parseFloat(sizeText);
        if (sizeMB <= 2048) {
          directLinks.push({ link: finalUrl, quality: normalizeQuality(l.quality), size: l.size });
        }
      }
      await subPage.close();
    } catch (e) { continue; }
  }
  await browser.close();
  return directLinks;
}

cmd({
  pattern: "movie",
  alias: ["sinhalasub","films","cinema"],
  react: "🎬",
  desc: "Search and send movies from Sinhalasub.lk",
  category: "download",
  filename: __filename
}, async (chathubro, mek, m, { from, q, sender, reply }) => {
  if (!q) return reply(`╭━━━〔 *🎬 MOVIE SEARCH* 〕━━━╮\n┃\n┃ ⚠️ *Please provide a movie name!*\n┃ 📌 *Usage:* \`.movie [name]\`\n┃ 💡 *Example:* \`.movie avengers\`\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`);
  
  reply("🔍 *Searching for movies on Sinhalasub.lk...*");
  const searchResults = await searchMovies(q);
  if (!searchResults.length) return reply("❌ *No movies found matching your query!*");
  
  pendingSearch[sender] = { results: searchResults, timestamp: Date.now() };
  
  let text = `╭━━━〔 *🎬 SEARCH RESULTS* 〕━━━╮\n`;
  searchResults.forEach((m, i) => {
    text += `┃ *${i+1}.* *${m.title}*\n`;
    text += `┃    🗣️ Lang: ${m.language || 'N/A'}\n`;
    text += `┃    📊 Quality: ${m.quality || 'HD'}\n`;
    text += `┃    🎞️ Format: ${m.qty || 'WEB-DL'}\n`;
    text += `┣━━━━━━━━━━━━━━━━━━━━━━━┫\n`;
  });
  text += `╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
  text += `> *💡 Reply with the movie number (1-${searchResults.length}) to select.*`;
  
  reply(text);
});

cmd({
  filter: (text, { sender }) => pendingSearch[sender] && !isNaN(text) && parseInt(text) > 0 && parseInt(text) <= pendingSearch[sender].results.length
}, async (chathubro, mek, m, { body, sender, reply, from }) => {
  await chathubro.sendMessage(from, { react: { text: "✅", key: m.key } });
  const index = parseInt(body.trim()) - 1;
  const selected = pendingSearch[sender].results[index];
  delete pendingSearch[sender];
  
  const metadata = await getMovieMetadata(selected.movieUrl);
  
  let msg = `╭━━━〔 *🎬 MOVIE DETAILS* 〕━━━╮\n`;
  msg += `┃ *Title:* ${metadata.title}\n`;
  msg += `┣━━━━━━━━━━━━━━━━━━━━━━━┫\n`;
  msg += `┃ 🗣️ *Language:* ${metadata.language || 'N/A'}\n`;
  msg += `┃ ⏱️ *Duration:* ${metadata.duration || 'N/A'}\n`;
  msg += `┃ ⭐ *IMDb Rating:* ${metadata.imdb || 'N/A'}\n`;
  msg += `┃ 🎭 *Genres:* ${metadata.genres.join(", ") || 'N/A'}\n`;
  msg += `┃ 🎥 *Directors:* ${metadata.directors.join(", ") || 'N/A'}\n`;
  msg += `┃ 🌟 *Stars:* ${metadata.stars.slice(0,4).join(", ")}${metadata.stars.length>4?"...":""}\n`;
  msg += `╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
  msg += `> *🔗 Fetching secure download links (<2GB), please wait...*`;

  if (metadata.thumbnail) {
    await chathubro.sendMessage(from, { image: { url: metadata.thumbnail }, caption: msg }, { quoted: mek });
  } else {
    await chathubro.sendMessage(from, { text: msg }, { quoted: mek });
  }

  const downloadLinks = await getPixeldrainLinks(selected.movieUrl);
  if (!downloadLinks.length) return reply("❌ *No download links found under 2GB size limit!*");
  
  pendingQuality[sender] = { movie: { metadata, downloadLinks }, timestamp: Date.now() };
  
  let qualityMsg = `╭━━━〔 *📥 AVAILABLE QUALITIES* 〕━━━╮\n`;
  downloadLinks.forEach((d, i) => {
    qualityMsg += `┃ *${i+1}.* 🎬 *${d.quality}* 📂 *[${d.size}]*\n`;
  });
  qualityMsg += `┣━━━━━━━━━━━━━━━━━━━━━━━┫\n`;
  qualityMsg += `┃ ⚠️ *Note: Max file size limit is 2GB.*\n`;
  qualityMsg += `╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n`;
  qualityMsg += `> *💡 Reply with the quality number to download as a document.*`;

  await chathubro.sendMessage(from, { text: qualityMsg }, { quoted: mek });
});

cmd({
  filter: (text, { sender }) => pendingQuality[sender] && !isNaN(text) && parseInt(text) > 0 && parseInt(text) <= pendingQuality[sender].movie.downloadLinks.length
}, async (chathubro, mek, m, { body, sender, reply, from }) => {
  await chathubro.sendMessage(from, { react: { text: "✅", key: m.key } });
  const index = parseInt(body.trim()) - 1;
  const { movie } = pendingQuality[sender];
  delete pendingQuality[sender];
  const selectedLink = movie.downloadLinks[index];
  
  reply(`╭━━━〔 *⬇️ DOWNLOADING* 〕━━━╮\n┃\n┃ ⏳ *Preparing ${selectedLink.quality} movie...*\n┃ 📂 Size: ${selectedLink.size}\n┃ 🚀 Please wait, sending as document.\n┃\n╰━━━━━━━━━━━━━━━━━━━━━━━╯`);
  
  try {
    const directUrl = getDirectPixeldrainUrl(selectedLink.link);
    await chathubro.sendMessage(from, {
      document: { url: directUrl },
      mimetype: "video/mp4",
      fileName: `${movie.metadata.title.substring(0,50)} - ${selectedLink.quality}.mp4`.replace(/[^\w\s.-]/gi,''),
      caption: `╭━━━〔 *🍿 MOVIE DOWNLOADED* 〕━━━╮\n┃\n┃ 🎬 *Title:* ${movie.metadata.title}\n┃ 📊 *Quality:* ${selectedLink.quality}\n┃ 💾 *File Size:* ${selectedLink.size}\n┃\n┣━━━━━━━━━━━━━━━━━━━━━━━┫\n┃ 🚀 *Enjoy your movie!* ✨\n╰━━━━━━━━━━━━━━━━━━━━━━━╯\n\n> *© 2026 | Powered by Chathunga Bimsara*`
    }, { quoted: mek });
  } catch (error) {
    console.error("Send document error:", error);
    reply(`❌ *Failed to send movie document:* ${error.message || "Unknown error"}`);
  }
});

setInterval(() => {
  const now = Date.now();
  const timeout = 10*60*1000;
  for (const s in pendingSearch) if (now - pendingSearch[s].timestamp > timeout) delete pendingSearch[s];
  for (const s in pendingQuality) if (now - pendingQuality[s].timestamp > timeout) delete pendingQuality[s];
}, 5*60*1000);

module.exports = { pendingSearch, pendingQuality };
