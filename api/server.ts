import app from './app.js';
import { initWebSocket } from './src/websocket/server.js';

const PORT = process.env.PORT || 8682;

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws`);
});

initWebSocket(server);

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
