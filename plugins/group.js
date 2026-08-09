
const { cmd } = require("../command");
const { getGroupAdmins } = require("../lib/functions");
const { downloadMediaMessage } = require('@whiskeysockets/baileys');


function getTargetUser(mek, quoted, args) {
  if (mek.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
    return mek.message.extendedTextMessage.contextInfo.mentionedJid[0];
  } else if (quoted?.sender) {
    return quoted.sender;
  } else if (args[0]?.includes("@")) {
    return args[0].replace("@", "") + "@s.whatsapp.net";
  }
  return null;
}

cmd({
  pattern: "kick",
  react: "👢",
  desc: "Kick user from group",
  category: "group",
  filename: __filename,
}, async (chathubro, mek, m, { isGroup, isAdmins, reply, participants, quoted, args }) => {
  if (!isGroup || !isAdmins) 
    return reply("*Group only & both you and I must be admins.*");

  const target = getTargetUser(mek, quoted, args);
  if (!target) return reply("*Mention or reply to a user to kick.*");

  const groupAdmins = getGroupAdmins(participants);
  if (groupAdmins.includes(target)) 
    return reply("*I can't kick an admin.*");

  await chathubro.groupParticipantsUpdate(m.chat, [target], "remove");
  return reply(`*Kicked:* @${target.split("@")[0]}`, { mentions: [target] });
});

cmd({
  pattern: "tagall",
  react: "📢",
  desc: "Tag all group members",
  category: "group",
  filename: __filename,
}, async (chathubro, mek, m, { isGroup, isAdmins, reply, participants }) => {
  if (!isGroup) return reply("*This command can only be used in groups.*");
  if (!isAdmins) return reply("*Only group admins can use this command.*");

  let validParticipants = participants.filter(p => {
    const number = p.id.split("@")[0];
    return /^\d{9,15}$/.test(number);
  });

  if (validParticipants.length === 0) {
    return reply("*No valid phone numbers found to tag.*");
  }

  let mentions = validParticipants.map(p => p.id);

  let text = "*Attention everyone:*\n";

  let displayNumbers = validParticipants.map(p => {
    const number = p.id.split("@")[0];
    return `@+${number}`;
  });

  text += displayNumbers.join(" ");

  return reply(text, { mentions });
});

cmd({
  pattern: "setpp",
  desc: "Set group profile picture",
  category: "group",
  filename: __filename
}, async (chathubro, mek, m, { isGroup, isAdmins, reply, participants, args, quoted }) => {
  if (!isGroup) return reply("❌ This command can only be used in groups!");
  if (!isAdmins) return reply("❌ You must be a group admin to use this command!");

  if (!quoted?.message?.imageMessage) return reply("🖼️ Please reply to an image to set as the group profile photo.");

  try {
    const media = await downloadMediaMessage(quoted, 'buffer');
    await chathubro.updateProfilePicture(m.chat, media);
    reply("✅ Group profile picture updated!");
  } catch (e) {
    console.error("❌ Error downloading image:", e);
    reply("⚠️ Failed to set profile picture. Ensure the image is valid and try again.");
  }
});

cmd({
  pattern: "admins",
  react: "👑",
  desc: "List all group admins",
  category: "group",
  filename: __filename,
}, async (chathubro, mek, m, { isGroup, reply, participants }) => {
  if (!isGroup) return reply("*This command is for groups only.*");

  const admins = participants.filter(p => p.admin).map(p => `@${p.id.split("@")[0]}`).join("\n");

  return reply(`*Group Admins:*\n${admins}`, { mentions: participants.filter(p => p.admin).map(a => a.id) });
});

cmd({
    pattern: "add",
    alias: ["invite"],
    react: "➕",
    desc: "Add a user to the group.",
    category: "group",
    filename: __filename
},
async (chathubro, mek, m, { from, isGroup, isAdmins, reply, args }) => {
    try {
        if (!isGroup) return reply("⚠️ This command can only be used in a group!");

        if (!isAdmins) return reply("⚠️ Only group admins can use this command!");

        if (!args[0]) return reply("⚠️ Please provide the phone number of the user to add!");

        const target = args[0].includes("@") ? args[0] : `${args[0]}@s.whatsapp.net`;

        await chathubro.groupParticipantsUpdate(from, [target], "add");

        return reply(`✅ Successfully added: @${target.split('@')[0]}`);
    } catch (e) {
        console.error("Add Error:", e);
        reply(`❌ Failed to add the user. Error: ${e.message}`);
    }
});


cmd({
  pattern: "promote",
  react: "⬆️",
  desc: "Promote user to admin",
  category: "group",
  filename: __filename,
}, async (chathubro, mek, m, { isGroup, isAdmins, reply, quoted, args }) => {
  if (!isGroup || !isAdmins) 
    return reply("*Group only & both you and I must be admins.*");

  const target = getTargetUser(mek, quoted, args);
  if (!target) return reply("*Mention or reply to a user to promote.*");

  await chathubro.groupParticipantsUpdate(m.chat, [target], "promote");
  return reply(`*Promoted:* @${target.split("@")[0]}`, { mentions: [target] });
});

cmd({
  pattern: "demote",
  react: "⬇️",
  desc: "Demote admin to member",
  category: "group",
  filename: __filename,
}, async (chathubro, mek, m, { isGroup, isAdmins, reply, quoted, args }) => {
  if (!isGroup || !isAdmins) 
    return reply("*Group only & both you and I must be admins.*");

  const target = getTargetUser(mek, quoted, args);
  if (!target) return reply("*Mention or reply to a user to demote.*");

  await chathubro.groupParticipantsUpdate(m.chat, [target], "demote");
  return reply(`*Demoted:* @${target.split("@")[0]}`, { mentions: [target] });
});

cmd({
    pattern: "open",
    alias: ["unmute"],
    react: "⚠️",
    desc: "Allow everyone to send messages in the group.",
    category: "group",
    filename: __filename
},
async (chathubro, mek, m, { from, isGroup, isAdmins, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ This command can only be used in a group!");
        if (!isAdmins) return reply("⚠️ This command is only for group admins!");

        await chathubro.groupSettingUpdate(from, "not_announcement");

        return reply("✅ Group has been unmuted. Everyone can send messages now!");
    } catch (e) {
        console.error("Unmute Error:", e);
        reply(`❌ Failed to unmute the group. Error: ${e.message}`);
    }
});

cmd({
    pattern: "close",
    alias: ["mute", "lock"],
    react: "⚠️",
    desc: "Set group chat to admin-only messages.",
    category: "group",
    filename: __filename
},
async (chathubro, mek, m, { from, isGroup, isAdmins, reply }) => {
    try {
        if (!isGroup) return reply("⚠️ This command can only be used in a group!");

        if (!isAdmins) return reply("⚠️ This command is only for group admins!");

        await chathubro.groupSettingUpdate(from, "announcement");

        return reply("✅ Group has been muted. Only admins can send messages now!");
    } catch (e) {
        console.error("Mute Error:", e);
        reply(`❌ Failed to mute the group. Error: ${e.message}`);
    }
});

cmd({
  pattern: "revoke",
  react: "♻️",
  desc: "Reset group invite link",
  category: "group",
  filename: __filename,
}, async (chathubro, mek, m, { isGroup, isAdmins, reply }) => {
  if (!isGroup || !isAdmins) 
    return reply("*Group only & both you and I must be admins.*");

  await chathubro.groupRevokeInvite(m.chat);
  return reply("*Group invite link has been reset.*");
});

cmd({
  pattern: "grouplink",
  alias: ["link"],
  react: "🔗",
  desc: "Get current invite link",
  category: "group",
  filename: __filename,
}, async (chathubro, mek, m, { isGroup, reply }) => {
  if (!isGroup) 
    return reply("*Group only & I must be an admin.*");

  const code = await chathubro.groupInviteCode(m.chat);
  return reply(`*Group Link:*\nhttps://chat.whatsapp.com/${code}`);
});

cmd({
  pattern: "setsubject",
  react: "✏️",
  desc: "Change group name",
  category: "group",
  filename: __filename,
}, async (chathubro, mek, m, { isGroup, isAdmins, args, reply }) => {
  if (!isGroup || !isAdmins) 
    return reply("*Group only & both you and I must be admins.*");

  if (!args[0]) return reply("*Give a new group name.*");

  await chathubro.groupUpdateSubject(m.chat, args.join(" "));
  return reply("*Group name updated.*");
});

cmd({
  pattern: "setdesc",
  react: "📝",
  desc: "Change group description",
  category: "group",
  filename: __filename,
}, async (chathubro, mek, m, { isGroup, isAdmins, args, reply }) => {
  if (!isGroup || !isAdmins) 
    return reply("*Group only & both you and I must be admins.*");

  if (!args[0]) return reply("*Give a new group description.*");

  await chathubro.groupUpdateDescription(m.chat, args.join(" "));
  return reply("*Group description updated.*");
});

cmd({
  pattern: "groupinfo",
  alias: ["ginfo"],
  react: "📄",
  desc: "Show group details",
  category: "group",
  filename: __filename,
}, async (chathubro, mek, m, { isGroup, reply }) => {
  if (!isGroup) return reply("*This command is for groups only.*");

  const metadata = await chathubro.groupMetadata(m.chat);
  const adminsCount = metadata.participants.filter(p => p.admin).length;
  const creation = new Date(metadata.creation * 1000).toLocaleString();
  const owner = metadata.owner || metadata.participants.find(p => p.admin === 'superadmin')?.id;
  const desc = metadata.desc || "No description.";

  let txt = `*👥 Group:* ${metadata.subject}\n`;
  txt += `*🆔 ID:* ${metadata.id}\n`;
  txt += `*🧑‍💼 Owner:* ${owner ? `@${owner.split("@")[0]}` : "Not found"}\n`;
  txt += `*📅 Created:* ${creation}\n`;
  txt += `*👤 Members:* ${metadata.participants.length}\n`;
  txt += `*🛡️ Admins:* ${adminsCount}\n`;
  txt += `*📝 Description:*\n${desc}`;

  return reply(txt, { mentions: owner ? [owner] : [] });
});

