import WebSocket from 'ws';
import { httpServer } from './your-http-server';

const wss = new WebSocket.Server({ noServer: true });

const connectedUsers:any = {};

wss.on('connection', (ws: any, req: any) => {
  const campId = req.url.split('/').pop();

  if (!connectedUsers[campId]) {
    connectedUsers[campId] = [];
  }

  connectedUsers[campId].push(ws);

  ws.on('close', () => {
    connectedUsers[campId] = connectedUsers[campId].filter((socket: any) => socket !== ws);
    broadcastActiveUsers(campId);
  });

  broadcastActiveUsers(campId);
});

const broadcastActiveUsers = (campId: any) => {
  const activeUsers = connectedUsers[campId].map((ws: { id: any; }) => ws.id);
  connectedUsers[campId].forEach((ws: { send: (arg0: string) => void; }) => {
    ws.send(JSON.stringify({ type: 'connected-users', payload: activeUsers }));
  });
};

// Attach the WebSocket server to your existing HTTP server
httpServer.on('upgrade', (request: any, socket: any, head: any) => {
  wss.handleUpgrade(request, socket, head, (ws: any) => {
    wss.emit('connection', ws, request);
  });
});