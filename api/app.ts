import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import routes from './src/routes/index.js';
import { corsHandler, requestLogger, errorHandler, notFoundHandler } from './src/middleware/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

app.use(corsHandler);
app.use(requestLogger);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const STORAGE_ROOT = path.join(__dirname, 'storage');
app.use('/uploads', express.static(path.join(STORAGE_ROOT, 'uploads')));
app.use('/processed', express.static(path.join(STORAGE_ROOT, 'processed')));
app.use('/exports', express.static(path.join(STORAGE_ROOT, 'exports')));

app.use('/api', routes);

app.use(errorHandler);
app.use(notFoundHandler);

export default app;
