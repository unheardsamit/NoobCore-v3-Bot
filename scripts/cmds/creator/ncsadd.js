const axios = require("axios");

module.exports = {
  config: {
    name: "ncsadd",
    version: "1.0",
    author: "𝑵𝑪-𝑺𝑨𝑰𝑴",
    role: 2,
    category: "owner",
    shortDescription: "Add command info to NoobCore cmd store",
    guide: {
      en: "{pn} cmdName | author | updateDate"
    }
  },

  ncStart: async ({ message, args }) => {
    try {
      const text = args.join(" ");
      const parts = text.split("|");

      if (parts.length < 3)
        return message.reply(`Usage:\n/ncsadd cmdName | author | updateDate`);

      const cmdName = parts[0].trim();
      const author = parts[1].trim();
      const update = parts.slice(2).join("|").trim();

      const token = "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";
      const repoOwner = "noobcore404";
      const repoName = "NC-STORE";
      const branch = "main";

      const rawURL = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/refs/heads/main/cmds/${cmdName}.js`;

      const getFile = async (filePath) => {
        const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
        try {
          const res = await axios.get(url, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const content = Buffer.from(res.data.content, "base64").toString();
          return { content: JSON.parse(content), sha: res.data.sha };
        } catch {
          return { content: null, sha: null };
        }
      };

      const updateFile = async (filePath, contentObj, sha = null) => {
        const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`;
        await axios.put(
          url,
          {
            message: `Updated ${filePath}`,
            content: Buffer.from(
              JSON.stringify(contentObj, null, 2)
            ).toString("base64"),
            branch,
            sha
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      };

      const infoFile = await getFile("cmdsinfo.json");

      if (infoFile.content.cmdName.some(e => e.cmd === cmdName))
        return message.reply("❌ This command already exists in cmdsinfo.json");

      infoFile.content.cmdName.push({
        cmd: cmdName,
        author,
        update,
        status: "on"
      });

      await updateFile("cmdsinfo.json", infoFile.content, infoFile.sha);

      const urlFile = await getFile("cmdsurl.json");
      urlFile.content[cmdName] = rawURL;
      await updateFile("cmdsurl.json", urlFile.content, urlFile.sha);

      return message.reply(
        `✅ NoobCore Store Updated!\n\n🧩 Name: ${cmdName}\n✍ Author: ${author}\n📅 Updated: ${update}\n📌 Status: ON\n🌐 Raw Added Successfully!`
      );
    } catch (err) {
      return message.reply("❌ Error: " + err.message);
    }
  }
};