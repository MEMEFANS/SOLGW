const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html' || req.url === '/index_fixed.html') {
        fs.readFile(path.join(__dirname, 'index_fixed.html'), (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(5000, 'localhost', () => {
    console.log('Server running at http://localhost:5000/');
});
