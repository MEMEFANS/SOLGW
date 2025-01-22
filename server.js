const http = require('http');
const fs = require('fs');
const path = require('path');

// 存储募集数据
let raisedAmount = {
    total: 0,
    transactions: []
};

// 从文件加载募集数据
try {
    const data = fs.readFileSync(path.join(__dirname, 'raised_data.json'));
    raisedAmount = JSON.parse(data);
} catch (err) {
    // 如果文件不存在，使用默认值
    console.log('No existing raised data found');
}

// 保存募集数据到文件
function saveRaisedData() {
    fs.writeFileSync(
        path.join(__dirname, 'raised_data.json'),
        JSON.stringify(raisedAmount),
        'utf8'
    );
}

const server = http.createServer((req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

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
    }
    // 获取募集金额
    else if (req.url === '/api/raised-amount' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ total: raisedAmount.total }));
    }
    // 更新募集金额
    else if (req.url === '/api/raised-amount' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (typeof data.amount === 'number' && data.txId) {
                    raisedAmount.transactions.push({
                        amount: data.amount,
                        txId: data.txId,
                        timestamp: Date.now()
                    });
                    raisedAmount.total += data.amount;
                    saveRaisedData();
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, total: raisedAmount.total }));
                } else {
                    res.writeHead(400);
                    res.end(JSON.stringify({ error: 'Invalid data format' }));
                }
            } catch (err) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    }
    // 处理静态文件
    else if (req.url.match(/\.(html|css|js|png|jpg|jpeg|gif)$/)) {
        const filePath = path.join(__dirname, req.url);
        const contentType = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'text/javascript',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif'
        }[path.extname(req.url)] || 'text/plain';

        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        });
    }
    else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(3002, 'localhost', () => {
    console.log('Server running at http://localhost:3002/');
});
