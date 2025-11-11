import { app } from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 8000;

(async () => {
  try {
    await connectDB();
    console.log('Database connection successful, starting server...');

    app.listen(PORT, () => {
      console.log(`App listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('FAILED to start server!', err);
    process.exit(1);
  }
})();
