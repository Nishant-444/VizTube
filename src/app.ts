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
            :root {
                --bg: #0f172a;
                --surface: #1e293b;
                --border: #334155;
                --text: #f8fafc;
                --text-muted: #94a3b8;
                --accent: #3b82f6;
                --accent-hover: #60a5fa;
                --success: #10b981;
                --success-bg: rgba(16, 185, 129, 0.1);
            }
            body { 
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
                line-height: 1.6; 
                color: var(--text); 
                background: var(--bg); 
                margin: 0; 
                padding: 2rem; 
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                box-sizing: border-box;
            }
            .container { 
                background: var(--surface); 
                padding: 2.5rem; 
                border-radius: 12px; 
                border: 1px solid var(--border);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2); 
                max-width: 800px;
                width: 100%;
            }
            h1 { 
                margin-top: 0;
                font-size: 1.875rem;
                border-bottom: 1px solid var(--border); 
                padding-bottom: 1rem; 
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .status { 
                padding: 0.25rem 0.75rem; 
                border-radius: 9999px; 
                font-size: 0.875rem; 
                font-weight: 500; 
                background: var(--success-bg); 
                color: var(--success); 
                border: 1px solid rgba(16, 185, 129, 0.2);
            }
            .subtitle {
                color: var(--text-muted);
                font-size: 1.125rem;
                margin-bottom: 2rem;
            }
            .info-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
                gap: 1rem; 
                margin: 1.5rem 0 2.5rem 0; 
            }
            .info-item { 
                background: rgba(15, 23, 42, 0.5); 
                padding: 1.25rem; 
                border-radius: 8px; 
                border: 1px solid var(--border); 
            }
            .info-item strong { 
                display: block; 
                color: var(--text-muted); 
                font-size: 0.75rem; 
                text-transform: uppercase; 
                letter-spacing: 0.05em;
                margin-bottom: 0.5rem; 
            }
            a { color: var(--accent); text-decoration: none; transition: color 0.2s; }
            a:hover { color: var(--accent-hover); text-decoration: underline; }
            code { 
                background: var(--bg); 
                padding: 0.25rem 0.5rem; 
                border-radius: 6px; 
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; 
                font-size: 0.875rem;
                color: #e2e8f0;
                border: 1px solid var(--border);
            }
            h3 {
                font-size: 1.25rem;
                margin-bottom: 1rem;
            }
            .features {
                list-style: none; 
                padding: 0;
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 0.75rem;
            }
            .features li {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--text-muted);
            }
            .features li::before {
                content: '→';
                color: var(--accent);
            }
            footer {
                margin-top: 3rem; 
                border-top: 1px solid var(--border); 
                padding-top: 1.5rem; 
                font-size: 0.875rem; 
                color: var(--text-muted);
                display: flex; 
                justify-content: space-between; 
                align-items: center; 
                flex-wrap: wrap; 
                gap: 1rem;
            }
            .social-links {
                display: flex; 
                gap: 1.5rem;
            }
            .social-links a {
                display: flex; 
                align-items: center; 
                gap: 0.5rem;
                color: var(--text-muted);
            }
            .social-links a:hover {
                color: var(--text);
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>
                VizTube API 
                <span class="status">● v2.0.0 Live</span>
            </h1>
            <p class="subtitle">Production-grade video platform backend infrastructure.</p>
            
            <div class="info-grid">
                <div class="info-item">
                    <strong>Environment</strong>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span>AWS EC2</span>
                    </div>
                </div>
                <div class="info-item">
                    <strong>Base Endpoint</strong>
                    <code>/api/v2</code>
                </div>
                <div class="info-item">
                    <strong>System Health</strong>
                    <a href="/api/v2/healthcheck">View Status</a>
                </div>
                <div class="info-item">
                    <strong>Documentation</strong>
                    <a href="https://github.com/Nishant-444/VizTube" target="_blank">GitHub Repo</a>
                </div>
            </div>

            <h3>Available Services</h3>
            <ul class="features">
                <li>User Management & Auth</li>
                <li>Video Streaming & Uploads</li>
                <li>Social (Likes, Comments, Tweets)</li>
                <li>Playlists & Subscriptions</li>
                <li>Dashboard Analytics</li>
            </ul>

            <footer>
                <div>
                    &copy; 2026 VizTube Infrastructure. Managed via Docker & Nginx.
                </div>
                <div class="social-links">
                    <a href="https://github.com/Nishant-444" target="_blank">
                        <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
                        GitHub
                    </a>
                    <a href="https://www.linkedin.com/in/nishant-developer" target="_blank">
                        <svg height="20" width="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        LinkedIn
                    </a>
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
