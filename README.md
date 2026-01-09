# VizTube - Backend Video Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.1.0-blue.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-v7.2.0-brightgreen.svg)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

VizTube is a complete, high-performance backend service for a video-sharing platform, built with **Node.js**, **Express**, **PostgreSQL**, and **Prisma ORM**. Written in **TypeScript** with modern ES Modules, it provides all the core functionalities of a modern video application like YouTube.

This project is intended for **developers**, **interviewers**, and **technical evaluators** to use as a robust foundation for video applications or to understand how a complex backend system is architected and organized.

**Project Status:** ✅ **Complete & Production Ready**

---

## 🌟 Highlights for Interviewers & Technical Reviewers

- **Modern Tech Stack**: TypeScript, PostgreSQL, Prisma ORM, Express 5.1
- **Type-Safe**: Full TypeScript implementation with strict type checking
- **Production Architecture**: Proper separation of concerns (controllers, routes, middlewares, validators)
- **Database Design**: Normalized PostgreSQL schema with proper indexing and relationships
- **Security First**: JWT authentication, bcrypt hashing, input validation, file validation
- **Scalable Storage**: Cloudinary integration for video/image uploads
- **Clean Code**: Consistent naming, comprehensive error handling, maintainable structure
- **API Design**: RESTful principles with proper HTTP methods and status codes

---

## ✨ Features at a Glance

### 🔐 Authentication & User Management

- User registration with avatar and cover image upload
- Secure login with JWT (access + refresh tokens)
- Token refresh mechanism for seamless user experience
- Password change with current password verification
- User profile management (avatar, cover image, account details)
- Channel profile with subscriber/subscription counts
- Watch history tracking

### 🎥 Video Management

- Video upload with thumbnail to Cloudinary
- Automatic video metadata extraction (duration)
- Video CRUD operations (Create, Read, Update, Delete)
- Publish/unpublish toggle for videos
- View count tracking
- Owner-based permissions

### 💬 Social Interactions

- **Comments**: Add, update, delete comments on videos
- **Likes**: Toggle likes on videos, comments, and tweets
- **Subscriptions**: Subscribe/unsubscribe to channels
- **Tweets**: Create, read, update, delete community posts

### 📝 Content Organization

- **Playlists**: Full CRUD with video management
  - Create playlists with name and description
  - Add/remove videos to/from playlists
  - Get user playlists
  - Get playlist details with videos
- **Watch History**: Automatic tracking of watched videos

### 📊 Analytics Dashboard

- Channel statistics (total views, subscribers, videos, likes)
- Channel videos list for creators

---

## 🛠️ Tech Stack

### Core Technologies

- **Runtime**: Node.js v18+
- **Language**: TypeScript v5.9.3 with ES Modules
- **Framework**: Express.js v5.1.0
- **Database**: PostgreSQL (Relational)
- **ORM**: Prisma v7.2.0 with PostgreSQL adapter

### Authentication & Security

- **JWT**: jsonwebtoken v9.0.2 (Access + Refresh tokens)
- **Password Hashing**: bcrypt v6.0.0
- **Cookie Management**: cookie-parser v1.4.7
- **CORS**: Cross-Origin Resource Sharing enabled

### File Management

- **Cloud Storage**: Cloudinary v2.8.0 (video & image uploads)
- **File Upload**: Multer v2.0.2 with validation

### Development Tools

- **TypeScript Compiler**: tsc with strict mode
- **Development Server**: tsx watch for hot reloading
- **Code Quality**: ESLint v9.39.0, Prettier v3.6.2
- **Database Management**: Prisma Studio, Prisma Migrate

---

## 📦 Project Structure

```
viztube/
├── prisma/
│   ├── schema.prisma              # Database schema with all models
│   └── migrations/                # Database migration history
│       ├── migration_lock.toml
│       └── 20260107053732_add_watch_history/
│
├── public/
│   └── temp/                      # Temporary file storage for uploads
│
├── src/
│   ├── index.ts                   # Application entry point
│   ├── app.ts                     # Express app configuration
│   ├── constants.ts               # Application constants
│   │
│   ├── config/
│   │   └── cookieOptions.ts       # Cookie configuration
│   │
│   ├── controllers/               # Business logic (∗ as import pattern)
│   │   ├── user.controller.ts
│   │   ├── video.controller.ts
│   │   ├── comment.controller.ts
│   │   ├── like.controller.ts
│   │   ├── subscription.controller.ts
│   │   ├── playlist.controller.ts
│   │   ├── tweet.controller.ts
│   │   ├── dashboard.controller.ts
│   │   └── healthcheck.controller.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts           # JWT verification
│   │   ├── error.middleware.ts          # Global error handler
│   │   ├── multer.middleware.ts         # File upload config
│   │   └── normalizeParams.middleware.ts # Parameter sanitization
│   │
│   ├── routes/                    # API route definitions
│   │   ├── user.routes.ts         # User & auth endpoints
│   │   ├── video.routes.ts        # Video management
│   │   ├── comment.routes.ts      # Comment operations
│   │   ├── like.routes.ts         # Like toggles
│   │   ├── subscription.routes.ts # Subscriptions
│   │   ├── playlist.routes.ts     # Playlist CRUD
│   │   ├── tweet.routes.ts        # Tweet operations
│   │   ├── dashboard.routes.ts    # Analytics
│   │   └── healthcheck.routes.ts  # Health check
│   │
│   ├── lib/
│   │   └── prisma.ts              # Prisma client instance
│   │
│   ├── generated/
│   │   └── client/                # Prisma generated client
│   │
│   ├── utils/
│   │   ├── ApiError.ts            # Custom error class
│   │   ├── ApiResponse.ts         # Standard API response
│   │   ├── asyncHandler.ts        # Async wrapper
│   │   ├── cloudinary.ts          # Cloudinary helpers
│   │   └── tokens.ts              # JWT token utilities
│   │
│   ├── validators/
│   │   ├── auth.validators.ts     # Auth input validation
│   │   └── file.validators.ts     # File upload validation
│   │
│   └── types/
│       ├── environment.d.ts       # Environment variable types
│       ├── express.d.ts           # Express type extensions
│       └── cloudinary.types.ts    # Cloudinary type definitions
│
├── .env.sample                    # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json                  # TypeScript configuration
├── prisma.config.ts               # Prisma configuration
├── README.md                      # This file
├── PRD.md                         # Product Requirements Document
├── ARCHITECTURE.md                # System architecture details
├── API_DOCUMENTATION.md           # Complete API reference
├── POSTMAN_COLLECTION_README.md   # Postman usage guide
└── Viztube-v2.postman_collection.json # API testing collection
```

---

## 📊 Database Schema

### Models Overview

**Core Models:**

- `User` - User accounts with authentication
- `Video` - Video content with metadata
- `Comment` - Video comments
- `Like` - Polymorphic likes (videos/comments/tweets)
- `Subscription` - Channel subscriptions
- `Playlist` - User-created playlists
- `PlaylistVideo` - Playlist-video relationships
- `Tweet` - Community posts
- `WatchHistory` - Video watch tracking

### Key Relationships

```
User (1) ──┬─── (N) Video
           ├─── (N) Comment
           ├─── (N) Like
           ├─── (N) Playlist
           ├─── (N) Tweet
           ├─── (N) WatchHistory
           ├─── (N) Subscription (as Subscriber)
           └─── (N) Subscription (as Channel)

Video (1) ──┬─── (N) Comment
            ├─── (N) Like
            ├─── (N) PlaylistVideo
            └─── (N) WatchHistory

Playlist (1) ──── (N) PlaylistVideo ──── (N) Video
```

### Indexing Strategy

- User: username, email (unique)
- Video: userId, createdAt
- Comment: videoId, userId
- Like: userId, videoId, commentId, tweetId
- Subscription: subscriberId, channelId
- Tweet: userId
- WatchHistory: userId

---

## ⚙️ Setup & Installation

### Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** database (local or cloud)
- **Cloudinary** account (for media storage)
- **Git**

### Installation Steps

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Nishant-444/Viztube.git
   cd Viztube
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the root directory:

   ```env
   # Server Configuration
   PORT=8000
   CORS_ORIGIN=*
   NODE_ENV=development

   # Database (PostgreSQL)
   DATABASE_URL="postgresql://username:password@localhost:5432/viztube?schema=public"

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # JWT Configuration
   ACCESS_TOKEN_SECRET=your_super_secret_access_token_min_32_characters
   ACCESS_TOKEN_EXPIRY=15m
   REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_min_32_characters
   REFRESH_TOKEN_EXPIRY=7d
   ```

   > **Note:** See `.env.sample` for a complete template.

4. **Set up the database:**

   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Run migrations to create database tables
   npx prisma migrate dev --name init

   # (Optional) Open Prisma Studio to view database
   npx prisma studio
   ```

5. **Build TypeScript:**

   ```bash
   npm run build
   ```

6. **Run the server:**

   **Development mode (with hot reload):**

   ```bash
   npm run dev
   ```

   **Production mode:**

   ```bash
   npm start
   ```

7. **Verify installation:**

   ```bash
   # Test the health check endpoint
   curl http://localhost:8000/api/v1/healthcheck
   ```

   Expected response:

   ```json
   {
     "statusCode": 200,
     "data": {
       "status": "OK",
       "message": "Server is running"
     },
     "message": "Health check passed",
     "success": true
   }
   ```

   Your API is now running on `http://localhost:8000/api/v1` 🎉

---

## 🧪 API Documentation

### Complete Documentation Files

1. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete endpoint reference
   - All endpoints with examples
   - Request/response formats
   - Authentication requirements

2. **[Postman Collection](./Viztube-v2.postman_collection.json)** - Interactive API testing
   - 40+ documented endpoints
   - Pre-configured requests
   - Auto-save tokens and IDs

3. **[Postman Guide](./POSTMAN_COLLECTION_README.md)** - Collection usage instructions

4. **[PRD.md](./PRD.md)** - Product requirements and specifications

5. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture details

### Quick API Reference

| Endpoint                          | Method | Description                | Auth |
| --------------------------------- | ------ | -------------------------- | ---- |
| `/healthcheck`                    | GET    | API health status          | ❌   |
| **User Management**               |
| `/user/register`                  | POST   | Register new user          | ❌   |
| `/user/login`                     | POST   | Login user                 | ❌   |
| `/user/refresh-token`             | POST   | Refresh access token       | ❌   |
| `/user/logout`                    | POST   | Logout user                | ✅   |
| `/user/change-password`           | POST   | Change password            | ✅   |
| `/user/current-user-details`      | GET    | Get current user           | ✅   |
| `/user/c/:username`               | GET    | Get channel profile        | ✅   |
| `/user/update-account`            | PATCH  | Update account details     | ✅   |
| `/user/update-avatar`             | PATCH  | Update avatar              | ✅   |
| `/user/update-cover-image`        | PATCH  | Update cover image         | ✅   |
| `/user/watch-history`             | GET    | Get watch history          | ✅   |
| **Video Management**              |
| `/videos`                         | GET    | Get all videos             | ✅   |
| `/videos`                         | POST   | Upload video               | ✅   |
| `/videos/:videoId`                | GET    | Get video by ID            | ✅   |
| `/videos/:videoId`                | PATCH  | Update video               | ✅   |
| `/videos/:videoId`                | DELETE | Delete video               | ✅   |
| `/videos/toggle/publish/:videoId` | PATCH  | Toggle publish status      | ✅   |
| **Comments**                      |
| `/comments/:videoId`              | GET    | Get video comments         | ✅   |
| `/comments/:videoId`              | POST   | Add comment                | ✅   |
| `/comments/c/:commentId`          | PATCH  | Update comment             | ✅   |
| `/comments/c/:commentId`          | DELETE | Delete comment             | ✅   |
| **Likes**                         |
| `/likes/toggle/v/:videoId`        | POST   | Toggle video like          | ✅   |
| `/likes/toggle/c/:commentId`      | POST   | Toggle comment like        | ✅   |
| `/likes/toggle/t/:tweetId`        | POST   | Toggle tweet like          | ✅   |
| `/likes/videos`                   | GET    | Get liked videos           | ✅   |
| **Subscriptions**                 |
| `/subscriptions/c/:channelId`     | POST   | Toggle subscription        | ✅   |
| `/subscriptions/c/:channelId`     | GET    | Get channel subscribers    | ✅   |
| `/subscriptions/u/:subscriberId`  | GET    | Get user subscriptions     | ✅   |
| **Playlists**                     |
| `/playlist`                       | POST   | Create playlist            | ✅   |
| `/playlist/user/:userId`          | GET    | Get user playlists         | ✅   |
| `/playlist/:playlistId`           | GET    | Get playlist by ID         | ✅   |
| `/playlist/:playlistId`           | PATCH  | Update playlist            | ✅   |
| `/playlist/:playlistId`           | DELETE | Delete playlist            | ✅   |
| `/playlist/:playlistId/:videoId`  | POST   | Add video to playlist      | ✅   |
| `/playlist/:playlistId/:videoId`  | DELETE | Remove video from playlist | ✅   |
| **Tweets**                        |
| `/tweets`                         | POST   | Create tweet               | ✅   |
| `/tweets/user/:userId`            | GET    | Get user tweets            | ✅   |
| `/tweets/:tweetId`                | PATCH  | Update tweet               | ✅   |
| `/tweets/:tweetId`                | DELETE | Delete tweet               | ✅   |
| **Dashboard**                     |
| `/dashboard/stats`                | GET    | Get channel stats          | ✅   |
| `/dashboard/videos`               | GET    | Get channel videos         | ✅   |

---

## 🔑 Key Technical Features

### 1. Type-Safe Development

- **Full TypeScript** implementation with strict mode
- **Prisma Client** for type-safe database queries
- **Type definitions** for Express, environment variables, and custom types

### 2. Authentication System

- **JWT-based** with access and refresh tokens
- **HTTP-only cookies** for secure token storage
- **Bcrypt hashing** for passwords (10 salt rounds)
- **Token refresh** mechanism for seamless UX
- **Middleware protection** for authenticated routes

### 3. File Upload System

- **Multer middleware** for handling multipart/form-data
- **Cloudinary integration** for scalable storage
- **File validation** (size, type, required fields)
- **Automatic cleanup** of local temp files

### 4. Database Design

- **Normalized schema** with proper relationships
- **Cascading deletes** for data integrity
- **Unique constraints** to prevent duplicates
- **Indexes** for query optimization
- **Migrations** for version control

### 5. Error Handling

- **Global error middleware** for consistent responses
- **Custom ApiError** class with status codes
- **Async handler wrapper** to catch async errors
- **Validation errors** with detailed messages

### 6. Code Organization

- **Controller-Route separation** for clean architecture
- **Namespace imports** (`* as controller`) for consistency
- **Reusable utilities** (asyncHandler, ApiResponse)
- **Middleware composition** for request processing

---

## 🔒 Security Features

✅ **Password Security**

- Bcrypt hashing with salt rounds
- Password confirmation before changes
- No plain text password storage

✅ **Authentication**

- JWT with expiry times
- Refresh token rotation
- HTTP-only cookies (XSS protection)
- Token verification middleware

✅ **Input Validation**

- Request body validation
- File type and size validation
- Parameter normalization (username sanitization)
- SQL injection prevention (Prisma)

✅ **Authorization**

- Owner-based permissions for resources
- Protected routes with JWT verification
- CORS configuration

✅ **File Upload Security**

- File size limits (16KB for JSON, 10MB for images, 100MB for videos)
- File type validation (MIME types)
- Cloudinary content moderation capabilities

---

## 🚀 Deployment

### Database Migration

```bash
# Deploy migrations to production database
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Build for Production

```bash
# Build TypeScript to JavaScript
npm run build

# Run production server
npm start
```

### Environment Configuration

Ensure these variables are set in production:

- `NODE_ENV=production`
- `DATABASE_URL` - PostgreSQL connection string
- `CLOUDINARY_*` - Cloudinary credentials
- `ACCESS_TOKEN_SECRET` & `REFRESH_TOKEN_SECRET` - Strong secrets (32+ chars)
- `CORS_ORIGIN` - Frontend domain(s)

### Recommended Platforms

- **Backend**: Render, Railway, Heroku, AWS EC2, DigitalOcean
- **Database**: Neon, Supabase, AWS RDS, Railway Postgres
- **Media Storage**: Cloudinary (generous free tier)

---

## 🧪 Testing

### Using Postman

1. Import `Viztube-v2.postman_collection.json`
2. Set `baseUrl` variable to your server URL
3. Start with "Register User" or "Login User"
4. Tokens are auto-saved in collection variables

### Example cURL Request

```bash
# Register a new user
curl -X POST http://localhost:8000/api/v1/user/register \
  -F "username=johndoe" \
  -F "email=john@example.com" \
  -F "fullname=John Doe" \
  -F "password=SecurePass123!" \
  -F "avatar=@/path/to/avatar.jpg" \
  -F "coverImage=@/path/to/cover.jpg"

# Login
curl -X POST http://localhost:8000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

---

## 📝 Code Quality

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Consistent naming** conventions (camelCase for variables/functions, PascalCase for types/classes)
- **Modular structure** for maintainability
- **Error handling** in all async operations

---

## 🛣️ Roadmap

- [ ] Unit & integration tests (Jest)
- [ ] API rate limiting
- [ ] Redis caching layer
- [ ] WebSocket for real-time features
- [ ] Video transcoding pipeline
- [ ] Search functionality (Full-text search)
- [ ] Content recommendations
- [ ] Swagger/OpenAPI documentation
- [ ] GraphQL API option
- [ ] Microservices architecture

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 👨‍💻 Author

**Nishant Sharma**

- GitHub: [@Nishant-444](https://github.com/Nishant-444)
- Project: [VizTube](https://github.com/Nishant-444/Viztube)

---

## 🙏 Acknowledgments

- Express.js team for the excellent framework
- Prisma team for the amazing ORM
- PostgreSQL community
- Cloudinary for media management
- TypeScript team for type safety

---

## ⭐ Show Your Support

If this project helped you or you found it interesting, please consider giving it a ⭐ on GitHub!

---

**Built with ❤️ using TypeScript, Node.js, Express, PostgreSQL, and Prisma**
