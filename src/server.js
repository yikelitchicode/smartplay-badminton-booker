import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use('/api', apiRouter);
app.use(express.static(path.resolve(__dirname, '..', 'public')));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`[smartplay] listening on http://localhost:${port}`);
});
