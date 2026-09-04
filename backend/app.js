import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/index.js';
import { uploadDir } from './middlewares/uploadMiddleware.js';
import { errorHandler } from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded documents statically
app.use('/uploads', express.static(uploadDir));

// Mount all modular API routes
app.use('/api', apiRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;
