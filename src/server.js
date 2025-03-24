import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { config } from './config/environment.js';
import { setupSocket } from './sockets/socketManager.js';

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

setupSocket(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
}); 