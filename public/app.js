const express = require("express");
const http = require("http");
const path = require("path");

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get('/api/stats', (req, res) => {
    const uptimeSeconds = Math.floor(process.uptime());
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    res.json({
        uptime: `${days}d ${hours}h ${minutes}m ${seconds}s`,
        prefix: global.noobCore?.ncsetting?.prefix || "Not loaded",
        uid: global.noobCore?.botID || "Not running"
    });
});

module.exports = async (api) => {
  if (!api) {
    await require("./connectDB.js")();
  }

  const PORT = global.noobCore.ncsetting.port || 5000;
  server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
};