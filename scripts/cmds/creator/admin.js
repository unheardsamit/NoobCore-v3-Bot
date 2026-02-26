const { ncsetting } = global.noobCore;
const { writeFileSync } = require("fs-extra");

module.exports = {
  config: {
    name: "admin",
    version: "1.8",
    author: "NTKhang • Pro Styled by NoobCore",
    countDown: 5,
    role: 3,
    description: {
      vi: "Quản lý quyền admin",
      en: "Advanced admin role management"
    },
    category: "box chat",
    guide: {
      en:
        "╭── 👑 ADMIN MANAGER ──╮\n" +
        "│\n" +
        "│ ➕ {pn} add | -a <uid | @tag | reply>\n" +
        "│ ➖ {pn} remove | -r <uid | @tag | reply>\n" +
        "│ 📜 {pn} list | -l\n" +
        "│\n" +
        "╰─────────────────────────╯"
    }
  },

  langs: {
    en: {
      added:
        "╭─『 ✅ ADMIN ADDED 』─╮\n" +
        "│ 👤 Users: %1\n" +
        "│\n%2\n" +
        "╰──────────────────╯",

      alreadyAdmin:
        "\n╭─『 ⚠️ ALREADY ADMIN 』─╮\n" +
        "│ 👤 Users: %1\n" +
        "│\n%2\n" +
        "╰────────────────────╯",

      removed:
        "╭─『 🗑️ ADMIN REMOVED 』─╮\n" +
        "│ 👤 Users: %1\n" +
        "│\n%2\n" +
        "╰────────────────────╯",

      notAdmin:
        "\n╭─『 ⚠️ NOT ADMIN 』─╮\n" +
        "│ 👤 Users: %1\n" +
        "│\n%2\n" +
        "╰────────────────╯",

      missingIdAdd:
        "⚠️ | Please mention, reply or provide UID to **add admin**",

      missingIdRemove:
        "⚠️ | Please mention, reply or provide UID to **remove admin**",

      listAdmin:
        "╭──『 👑 ADMIN LIST 』──╮\n" +
        "%1\n" +
        "╰──────────────────╯"
    }
  },

  ncStart: async function ({ message, args, usersData, event, getLang }) {
    const sub = args[0];

    const getUIDs = () => {
      if (Object.keys(event.mentions || {}).length > 0)
        return Object.keys(event.mentions);
      if (event.messageReply)
        return [event.messageReply.senderID];
      return args.slice(1).filter(uid => !isNaN(uid));
    };

    switch (sub) {

      /* ===== ADD ADMIN ===== */
      case "add":
      case "-a": {
        const uids = getUIDs();
        if (!uids.length) return message.reply(getLang("missingIdAdd"));

        const added = [];
        const existed = [];

        for (const uid of uids) {
          if (ncsetting.adminBot.includes(uid))
            existed.push(uid);
          else {
            ncsetting.adminBot.push(uid);
            added.push(uid);
          }
        }

        writeFileSync(global.client.dirConfig, JSON.stringify(ncsetting, null, 2));

        const addedNames = await Promise.all(
          added.map(uid =>
            usersData.getName(uid, false)
              .then(name => `• ${name || "User"} (${uid})`)
          )
        );

        return message.reply(
          (added.length
            ? getLang("added", added.length, addedNames.join("\n"))
            : "") +
          (existed.length
            ? getLang(
                "alreadyAdmin",
                existed.length,
                existed.map(uid => `• ${uid}`).join("\n")
              )
            : "")
        );
      }

      /* ===== REMOVE ADMIN ===== */
      case "remove":
      case "-r": {
        const uids = getUIDs();
        if (!uids.length) return message.reply(getLang("missingIdRemove"));

        const removed = [];
        const notAdmin = [];

        for (const uid of uids) {
          if (ncsetting.adminBot.includes(uid)) {
            ncsetting.adminBot.splice(ncsetting.adminBot.indexOf(uid), 1);
            removed.push(uid);
          } else notAdmin.push(uid);
        }

        writeFileSync(global.client.dirConfig, JSON.stringify(ncsetting, null, 2));

        const removedNames = await Promise.all(
          removed.map(uid =>
            usersData.getName(uid, false)
              .then(name => `• ${name || "User"} (${uid})`)
          )
        );

        return message.reply(
          (removed.length
            ? getLang("removed", removed.length, removedNames.join("\n"))
            : "") +
          (notAdmin.length
            ? getLang(
                "notAdmin",
                notAdmin.length,
                notAdmin.map(uid => `• ${uid}`).join("\n")
              )
            : "")
        );
      }

      /* ===== LIST ADMIN ===== */
      case "list":
      case "-l": {
        await Promise.all(
          ncsetting.adminBot.map(uid =>
            usersData.refreshInfo(uid).catch(() => null)
          )
        );

        const list = await Promise.all(
          ncsetting.adminBot.map(uid =>
            usersData.getName(uid, true)
              .then(name => `• ${name || "User"} (${uid})`)
          )
        );

        return message.reply(getLang("listAdmin", list.join("\n")));
      }

      default:
        return message.SyntaxError();
    }
  }
};