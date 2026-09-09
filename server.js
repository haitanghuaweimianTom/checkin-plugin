const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 80;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  
  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not Found');
    }
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'text/plain';
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('Not Found');
      }
      res.writeHead(200, { 'Content-Type': contentType + '; charset=utf-8' });
      res.end(data);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
