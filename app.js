const WebSocket = require('ws');
// 获取参数
const argv = process.argv.slice(2);
// 代理端口
let port = Number(argv[0]);
if (isNaN(port) || port < 1 || port > 65535) {
    port = 5999;
}

// 创建一个 WebSocket 服务器，监听在指定端口
const wss = new WebSocket.Server({ port });

console.log('proxy server start at port: ' + port);

// 当有客户端连接时
wss.on('connection', (ws, request) => {
    // 连接到被代理的 WebSocket 服务
    const url = request.url ?? '';
    // 去掉第一个斜杠,不能用split
    const targetUrl = url.substring(1);
    const targetWs = new WebSocket(targetUrl);

    // 创建成功后，告诉客户端已连接
    targetWs.on('open', function open () {
        console.log('connected: ' + targetUrl);
        ws.send('connected: ' + targetUrl);
    });

    // 当接收到客户端的消息时，转发给被代理的 WebSocket 服务
    ws.on('message', function incoming (message) {
        console.log('received: %s', message);
        targetWs.send(message.toString());
    });

    // 当接收到被代理的 WebSocket 服务的消息时，转发给客户端
    targetWs.on('message', function incoming (message) {
        console.log('received: %s', message);
        ws.send(message.toString());
    });

    // 处理连接关闭事件
    ws.on('close', function close () {
        console.log('client disconnected');
        targetWs.close();
    });

    targetWs.on('close', function close () {
        console.log('target disconnected');
        ws.close();
    });
});