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
  res.send(
    '<h1>VizTube API is running</h1><p>Documentation: <a href="https://github.com/nishant-444/viztube" target="_blank">https://github.com/nishant-444/viztube</a></p>'
  );
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
