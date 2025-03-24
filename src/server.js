import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { config } from './config/environment.js';
import { setupSocket } from './sockets/socketManager.js';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Setup Socket.IO
setupSocket(httpServer);

// Start server
httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
}); 