const { cmd } = require("../command");

const msgStore = new Map();

module.exports = {
  saveMessage: (mek) => {
    try {
      if (mek && mek.key && mek.key.id) {
        msgStore.set(mek.key.id, mek);
        if (msgStore.size > 500) {
          const firstKey = msgStore.keys().next().value;
          msgStore.delete(firstKey);
        }
      }
    } catch (err) {
      console.log("Store Error:", err);
    }
  },

  handleDelete: async (chathubro, deletedData) => {
    try {
      const key = deletedData.keys ? deletedData.keys[0] : (deletedData.update?.key || deletedData);
      if (!key || !key.id) return;

      const originalMessage = msgStore.get(key.id);
      if (!originalMessage) {
        return;
      }

      const sender = originalMessage.key.participant || originalMessage.key.remoteJid;
      const senderNumber = sender.split("@")[0];
      const isGroup = originalMessage.key.remoteJid.endsWith("@g.us");
      const groupName = isGroup ? "Group Chat" : "Private Chat";
      const chatJid = originalMessage.key.remoteJid;

      let alertText = `╭───────────────◆
│   ⚠️ *ANTI-DELETE DETECTED* ⚠️
├───────────────◆
│ 👤 *Sender:* @${senderNumber}
│ 📍 *Chat Type:* ${groupName}
└───────────────◆

> *The deleted message is below:* 👇`;

      await chathubro.sendMessage(chatJid, {
        text: alertText,
        mentions: [sender]
      }, { quoted: originalMessage });

      await chathubro.sendMessage(chatJid, {
        forward: originalMessage
      }, { quoted: originalMessage });

    } catch (e) {
      console.log("Anti-delete execution error:", e);
    }
  }
};
