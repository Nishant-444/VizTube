import { app } from './app.js';
import dotenv from 'dotenv';
import prisma from './lib/prisma.js';

dotenv.config({
  path: './.env',
});

const PORT = process.env.PORT || 8000;

(async () => {
  try {
    await prisma.$connect();
    console.log('Database connected');

    app.listen(PORT, () => {
      console.log(`Server running at port : ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to Database', err);
    process.exit(1);
  }
})();
