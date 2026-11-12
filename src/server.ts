import 'dotenv/config';
import { createApp } from './app.js';
import { pool } from './db.js';

const port = Number(process.env.PORT ?? 3000);
createApp(pool).listen(port, () => {
  console.log(`API ouvindo na porta ${port}`);
});
