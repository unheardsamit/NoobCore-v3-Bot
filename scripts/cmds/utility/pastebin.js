const PastebinAPI = require('pastebin-js');
const fs = require('fs');
const path = require('path');

function xfind(dir, fileName) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const found = xfind(fullPath, fileName);
      if (found) return found;
    } else {
      if (
        file === fileName ||
        file === fileName + ".js" ||
        file === fileName + ".txt"
      ) {
        return fullPath;
      }
    }
  }
  return null;
}

module.exports = {
  config: {
    name: "pastebin",
    aliases: ["past"],
    version: "1.5",
    author: "NC-AZAD | X-Nil",
    countDown: 5,
    role: 2,
    shortDescription: "Upload cmds file to Pastebin",
    longDescription: "Upload any file from cmds and subfolders to Pastebin",
    category: "utility",
    guide: {
      en: "{pn} <filename>"
    }
  },

  ncStart: async function ({ api, event, args }) {
    const owners = global.noobCore?.ncsetting?.creator || [];
    if (!owners.includes(event.senderID)) {
      return api.sendMessage("🚫 Permission denied!", event.threadID, event.messageID);
    }

    const fileName = args[0];
    if (!fileName) {
      return api.sendMessage("❌ File name required!", event.threadID);
    }

    const cmdsFolder = path.join(__dirname, '..', '..');
    const filePath = xfind(cmdsFolder, fileName);

    if (!filePath) {
      return api.sendMessage("❌ File not found!", event.threadID);
    }

    const pastebin = new PastebinAPI({
      api_dev_key: 'LFhKGk5aRuRBII5zKZbbEpQjZzboWDp9',
      api_user_key: 'LFhKGk5aRuRBII5zKZbbEpQjZzboWDp9'
    });

    fs.readFile(filePath, 'utf8', async (err, data) => {
      if (err) return api.sendMessage("❌ Read error!", event.threadID);

      try {
        const paste = await pastebin.createPaste({
          text: data,
          title: path.basename(filePath),
          format: "javascript",
          privacy: 1
        });

        const rawLink = paste.replace("pastebin.com/", "pastebin.com/raw/");

        api.sendMessage(
`╔══⌠ 📌 Pastebin Upload ⌡══╗
║
║ 📄 ${path.basename(filePath)}
║ 📂 ${filePath.replace(cmdsFolder, "cmds")}
║ 🔗 ${rawLink}
║
╚═══════════════════╝`,
          event.threadID
        );

      } catch (e) {
        api.sendMessage("❌ Upload failed!", event.threadID);
      }
    });
  }
};