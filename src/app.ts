import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// common middlewares
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

// root route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>VizTube API | Production</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; background: #f4f7f6; }
            .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #2d3748; border-bottom: 2px solid #edf2f7; padding-bottom: 0.5rem; }
            .status { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.875rem; font-weight: 600; background: #c6f6d5; color: #22543d; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1.5rem 0; }
            .info-item { background: #f8fafc; padding: 1rem; border-radius: 6px; border: 1px solid #e2e8f0; }
            .info-item strong { display: block; color: #4a5568; font-size: 0.75rem; text-transform: uppercase; margin-bottom: 0.25rem; }
            a { color: #3182ce; text-decoration: none; }
            a:hover { text-decoration: underline; }
            code { background: #edf2f7; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>VizTube API <span class="status">v2.0.0 Live</span></h1>
            <p>Production-grade video platform backend infrastructure.</p>
            
            <div class="info-grid">
                <div class="info-item">
                    <strong>Current Environment</strong>
                    Production (AWS EC2)
                </div>
                <div class="info-item">
                    <strong>Base Endpoint</strong>
                    <code>/api/v2</code>
                </div>
                <div class="info-item">
                    <strong>System Health</strong>
                    <a href="/api/v2/healthcheck">Check Status</a>
                </div>
                <div class="info-item">
                    <strong>Documentation</strong>
                    <a href="https://github.com/Nishant-444/VizTube" target="_blank">GitHub Repo</a>
                </div>
            </div>

            <h3>Available Resources</h3>
            <ul style="list-style: none; padding: 0;">
                <li>✅ User Management & Auth</li>
                <li>✅ Video Streaming & Uploads</li>
                <li>✅ Social (Likes, Comments, Tweets)</li>
                <li>✅ Playlists & Subscriptions</li>
            </ul>

            <footer style="margin-top: 2rem; border-top: 1px solid #edf2f7; padding-top: 1rem; font-size: 0.875rem; color: #718096;">
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
            &copy; 2026 VizTube Infrastructure. Managed via GitHub Actions & PM2.
        </div>
        <div style="display: flex; gap: 1.5rem;">
            <a href="https://github.com/Nishant-444" target="_blank" style="display: flex; align-items: center; gap: 0.4rem;">
                <img src="https://cdn-icons-png.flaticon.com/512/25/25231.png" width="16" height="16" alt="GitHub"> GitHub
            </a>
            <a href="https://www.linkedin.com/in/nishant-developer" target="_blank" style="display: flex; align-items: center; gap: 0.4rem;">
                <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" width="16" height="16" alt="LinkedIn"> LinkedIn
            </a>
        </div>
    </div>
</footer>
        </div>
    </body>
    </html>
  `);
});

// import routes
import healthcheckRouter from './routes/healthcheck.routes.js';
import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js';
import tweetRouter from './routes/tweet.routes.js';
import commentRouter from './routes/comment.routes.js';
import likeRouter from './routes/like.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import playlistRouter from './routes/playlist.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

// routes
app.use('/api/v2/healthcheck', healthcheckRouter);
app.use('/api/v2/user', userRouter);
app.use('/api/v2/videos', videoRouter);
app.use('/api/v2/tweets', tweetRouter);
app.use('/api/v2/comments', commentRouter);
app.use('/api/v2/likes', likeRouter);
app.use('/api/v2/subscriptions', subscriptionRouter);
app.use('/api/v2/playlist', playlistRouter);
app.use('/api/v2/dashboard', dashboardRouter);

// error handler
app.use(errorHandler);

export { app };

/* 
  user 
  video
  tweet
  comment
  like
  subscription
  playlist
  dashboard
*/
