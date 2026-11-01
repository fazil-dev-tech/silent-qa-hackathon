const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4000;

const server = http.createServer((req, res) => {
  // Mock API: /api/cart/add
  if (req.url === '/api/cart/add' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, item: JSON.parse(body || '{}') }));
    });
    return;
  }

  // Serve index.html
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Error loading demo shop');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Demo Shop test harness running at http://localhost:${PORT}`);
});

