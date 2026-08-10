const fs = require('fs');
const axios = require('axios');
const path = './config.env';
const FormData = require("form-data");

async function empiretourl(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // 1. Try Tmpfiles.org
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    const res = await axios.post("https://tmpfiles.org/api/v1/upload", form, {
      headers: form.getHeaders(),
      timeout: 15000,
    });
    if (res.data && res.data.status === "success" && res.data.data?.url) {
      return { url: res.data.data.url.replace("tmpfiles.org/", "tmpfiles.org/dl/") };
    }
  } catch (e) {}

  // 2. Try Uguu.se
  try {
    const form = new FormData();
    form.append("files[]", fs.createReadStream(filePath));
    const res = await axios.post("https://uguu.se/upload", form, {
      headers: form.getHeaders(),
      timeout: 15000,
    });
    if (res.data && res.data.success && res.data.files?.[0]?.url) {
      return { url: res.data.files[0].url };
    }
  } catch (e) {}

  // 3. Fallback to Empiretech CDN
  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath));
    form.append("originalFileName", filePath.split("/").pop());
    const res = await axios.post("https://cdn.empiretech.biz.id/api/upload.php", form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 15000,
    });
    if (res.data && (res.data.url || res.data.fileUrl)) {
      return res.data;
    }
  } catch (e) {}

  throw new Error("Could not upload file to CDN server. Please try again!");
}

// Fetch a buffer from a URL
const getBuffer = async (url, options) => {
    try {
        options = options || {};
        const res = await axios({
            method: 'get',
            url,
            headers: {
                'DNT': 1,
                'Upgrade-Insecure-Request': 1
            },
            ...options,
            responseType: 'arraybuffer'
        });
        return res.data;
    } catch (e) {
        console.error(e);
        return null;
    }
};

// Get admin participants from a group
const getGroupAdmins = (participants) => {
    const admins = [];
    for (let participant of participants) {
        if (participant.admin !== null) admins.push(participant.id);
    }
    return admins;
};

// Generate a random string with an extension
const getRandom = (ext) => {
    return `${Math.floor(Math.random() * 10000)}${ext}`;
};

// Format large numbers with suffixes (e.g., K, M, B)
const h2k = (eco) => {
    const lyrik = ['', 'K', 'M', 'B', 'T', 'P', 'E'];
    const ma = Math.floor(Math.log10(Math.abs(eco)) / 3);
    if (ma === 0) return eco.toString();
    const scale = Math.pow(10, ma * 3);
    const scaled = eco / scale;
    const formatted = scaled.toFixed(1).replace(/\.0$/, '');
    return formatted + lyrik[ma];
};

// Check if a string is a URL
const isUrl = (url) => {
    return url.match(
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%.+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%+.~#?&/=]*)/
    );
};

// Convert a JavaScript object or array to a JSON string
const Json = (string) => {
    return JSON.stringify(string, null, 2);
};

// Function to calculate and format uptime
const runtime = (seconds) => {
    seconds = Math.floor(seconds);
    const d = Math.floor(seconds / (24 * 60 * 60));
    seconds %= 24 * 60 * 60;
    const h = Math.floor(seconds / (60 * 60));
    seconds %= 60 * 60;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);

    if (d > 0) return `${d}d ${h}h ${m}m ${s}s`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};
// Delay execution for a specified time
const sleep = async (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

// Fetch JSON from a URL
const fetchJson = async (url, options) => {
    try {
        options = options || {};
        const res = await axios({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        });
        return res.data;
    } catch (err) {
        console.error(err);
        return null;
    }
};
// Save config settings
const saveConfig = (key, value) => {
    let configData = fs.existsSync(path) ? fs.readFileSync(path, 'utf8').split('\n') : [];
    let found = false;

    configData = configData.map(line => {
        if (line.startsWith(`${key}=`)) {
            found = true;
            return `${key}=${value}`;
        }
        return line;
    });

    if (!found) configData.push(`${key}=${value}`);

    fs.writeFileSync(path, configData.join('\n'), 'utf8');

    // Reload updated environment variables
    require('dotenv').config({ path });
};

module.exports = { 
    getBuffer, 
    getGroupAdmins, 
    getRandom, 
    h2k, 
    isUrl, 
    Json, 
    runtime, 
    sleep, 
    fetchJson,
    saveConfig,
    empiretourl
};