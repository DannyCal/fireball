const express = require('express');
const path = require('path');
const app = express();
const fs = require('fs');

const PUBLIC_PATH = path.resolve(__dirname, "build");
const PORT = parseInt(process.env.PORT || "80", 10)
const HOSTIP = '3.128.129.180';
const PUBLIC_URL = process.env.PUBLIC_URL || `http://${HOSTIP}:${PORT}`;
const indexHtml = path.join(PUBLIC_PATH, "index.html");
const indexHtmlContent = fs
  .readFileSync(indexHtml, "utf-8")
  .replace(/__PUBLIC_URL_PLACEHOLDER__/g, PUBLIC_URL);

app.use(express.static(path.join(__dirname, 'build')))

app.get('/*', (req, res) => {
  res.send(indexHtmlContent);
});

console.log(`Frontend server listening on port ${PORT}`);
app.use(express.static(path.join(PUBLIC_PATH)));
app.listen(PORT, HOSTIP);