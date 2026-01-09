# VizTube - What We're Building

---

## Quick Info

**Project:** VizTube  
**Version:** 2.0.0  
**Created:** January 2026  
**By:** Nishant Sharma  
**Status:** Ready to use!

---

## What is VizTube?

VizTube is a backend system for a video-sharing platform (think YouTube). It's built with modern tech and ready for production.

### What makes it special?

- Built with TypeScript so we catch bugs early
- Uses PostgreSQL database (super reliable)
- Secure login system with JWT tokens
- Stores videos and images in the cloud
- Has all the features you'd expect: likes, comments, subscriptions, playlists

### Why these technologies?

- **TypeScript** - No more surprise errors
- **PostgreSQL + Prisma** - Database that just works
- **Cloud Storage** - Videos don't take up server space
- **JWT Auth** - Users stay logged in securely
- **Full Features** - Everything you need is already built

---

## What We Want to Achieve

### Goals

- Build something that actually works in production
- Make sure logging in is secure
- Let users upload and watch videos smoothly
- Allow people to interact (like, comment, subscribe)
- Keep content organized with playlists
- Make sure everything is type-safe

### How We Measure Success

- API responds quickly (under 200ms)
- Multiple users can upload videos at the same time
- System stays up 99.9% of the time
- No runtime errors thanks to TypeScript
- Secure authentication that refreshes automatically
- Database queries are fast

---

## Technical Details

### What We're Using

**Backend:**

- Node.js v18+ (runs the server)
- Express.js v5.1.0 (handles requests)
- TypeScript v5.9.3 (keeps code safe)

**Database:**

- PostgreSQL (stores everything)
- Prisma v7.2.0 (talks to the database)

**Security:**

- JWT tokens for logging in
- Bcrypt to hash passwords
- Access token lasts 15 minutes
- Refresh token lasts 7 days

**File Storage:**

- Cloudinary (stores videos and images)
- Multer (handles file uploads)
- We check file sizes and types

**Other Stuff:**

- CORS (allows cross-origin requests)
- Cookie Parser (handles cookies securely)
- Environment variables for configuration

### 3.2 System Architecture

```
Client Application
       ↓
   API Gateway
       ↓
Express.js Middleware Layer
   ├── CORS Configuration
   ├── Body Parser (JSON/URLEncoded)
   ├── Cookie Parser
   ├── Authentication (JWT Verification)
   ├── File Upload (Multer)
   ├── Input Validation
   ├── Parameter Normalization
   └── Error Handling
       ↓
Router Layer
   ├── User Routes
   ├── Video Routes
   ├── Comment Routes
   ├── Like Routes
   ├── Subscription Routes
   ├── Playlist Routes
   ├── Tweet Routes
   └── Dashboard Routes
       ↓
Controller Layer (* as import pattern)
   ├── User Controller
   ├── Video Controller
   ├── Comment Controller
   ├── Like Controller
   ├── Subscription Controller
   ├── Playlist Controller
   ├── Tweet Controller
   └── Dashboard Controller
       ↓
Prisma ORM Layer
   ├── Type-safe queries
   ├── Transaction support
   ├── Connection pooling
   └── Query optimization
       ↓
PostgreSQL Database
   ├── User Table
   ├── Video Table
   ├── Comment Table
   ├── Like Table
   ├── Subscription Table
   ├── Playlist Tables
   ├── Tweet Table
   └── WatchHistory Table
       ↓
External Services
   └── Cloudinary (Media CDN)
```

---

## 4. Data Models & Schema

### 4.1 User Model

```prisma
model User {
  id           Int      @id @default(autoincrement())
  username     String   @unique
  email        String   @unique
  fullname     String
  avatar       String   @default("...")
  coverImage   String   @default("...")
  password     String
  refreshToken String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  videos         Video[]
  comments       Comment[]
  likes          Like[]
  playlists      Playlist[]
  subscriptions  Subscription[] @relation("Subscriber")
  subscribers    Subscription[] @relation("Channel")
  tweets         Tweet[]
  watchHistories WatchHistory[]

  @@index([username])
  @@index([email])
}
```

**Key Features:**

- Unique username and email with indexes
- Default avatar and cover images
- Refresh token storage for JWT authentication
- Cascading relationships for data integrity
- Bidirectional subscription relationships

### 4.2 Video Model

```prisma
model Video {
  id                Int      @id @default(autoincrement())
  videoFileUrl      String
  videoFilePublicId String
  thumbnailUrl      String
  thumbnailPublicId String
  title             String
  description       String?
  views             Int      @default(0)
  duration          Float
  isPublished       Boolean  @default(true)
  userId            Int
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  comments       Comment[]
  likes          Like[]
  playlistVideos PlaylistVideo[]
  watchHistories WatchHistory[]

  @@index([userId])
  @@index([createdAt])
}
```

**Key Features:**

- Stores Cloudinary URLs and public IDs for cleanup
- View count tracking
- Publish/unpublish toggle
- Cascading delete when user is deleted
- Indexed by user and creation date

### 4.3 Comment Model

```prisma
model Comment {
  id        Int      @id @default(autoincrement())
  content   String
  userId    Int
  videoId   Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  video Video  @relation(fields: [videoId], references: [id], onDelete: Cascade)
  likes Like[]

  @@index([videoId])
  @@index([userId])
}
```

**Key Features:**

- Nested comments on videos
- Likes on comments
- Cascading delete with user and video

### 4.4 Like Model (Polymorphic)

```prisma
model Like {
  id        Int      @id @default(autoincrement())
  userId    Int
  videoId   Int?
  commentId Int?
  tweetId   Int?
  createdAt DateTime @default(now())

  // Relations
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  video   Video?   @relation(fields: [videoId], references: [id], onDelete: Cascade)
  comment Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)
  tweet   Tweet?   @relation(fields: [tweetId], references: [id], onDelete: Cascade)

  // Unique constraints
  @@unique([userId, videoId])
  @@unique([userId, commentId])
  @@unique([userId, tweetId])
  @@index([userId])
}
```

**Key Features:**

- Polymorphic design (can like videos, comments, or tweets)
- Unique constraints prevent duplicate likes
- Toggle functionality (add/remove like)

### 4.5 Subscription Model

```prisma
model Subscription {
  id           Int      @id @default(autoincrement())
  subscriberId Int
  channelId    Int
  createdAt    DateTime @default(now())

  subscriber User @relation("Subscriber", fields: [subscriberId], references: [id], onDelete: Cascade)
  channel    User @relation("Channel", fields: [channelId], references: [id], onDelete: Cascade)

  @@unique([subscriberId, channelId])
  @@index([subscriberId])
  @@index([channelId])
}
```

**Key Features:**

- Many-to-many user relationship
- Unique constraint prevents duplicate subscriptions
- Indexed for efficient subscriber/channel queries

### 4.6 Playlist & PlaylistVideo Models

```prisma
model Playlist {
  id          Int      @id @default(autoincrement())
  name        String
  description String
  userId      Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user   User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  videos PlaylistVideo[]

  @@index([userId])
}

model PlaylistVideo {
  id         Int      @id @default(autoincrement())
  playlistId Int
  videoId    Int
  addedAt    DateTime @default(now())

  playlist Playlist @relation(fields: [playlistId], references: [id], onDelete: Cascade)
  video    Video    @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@unique([playlistId, videoId])
}
```

**Key Features:**

- Many-to-many relationship between playlists and videos
- Junction table for video ordering
- Prevents duplicate videos in same playlist

### 4.7 Tweet Model

```prisma
model Tweet {
  id        Int      @id @default(autoincrement())
  content   String
  userId    Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  likes Like[]

  @@index([userId])
}
```

**Key Features:**

- Community posts/status updates
- Likeable content
- User-owned tweets

### 4.8 WatchHistory Model

```prisma
model WatchHistory {
  id        Int      @id @default(autoincrement())
  userId    Int
  videoId   Int
  watchedAt DateTime @default(now())

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  video Video @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@unique([userId, videoId])
  @@index([userId])
}
```

**Key Features:**

- Tracks user video viewing
- Unique constraint (one record per user-video pair)
- Automatic timestamp tracking

---

## 5. API Endpoints & Features

### 5.1 Base URL Structure

```
Production: https://yourdomain.com/api/v2
Development: http://localhost:8000/api/v2
```

### 5.2 Authentication & User Management (11 endpoints)

#### Public Endpoints (No Authentication)

**POST /user/register**

- Register new user with avatar and cover image
- Required: username, email, fullname, password, avatar
- Optional: coverImage
- Content-Type: multipart/form-data
- Response: User object + JWT tokens

**POST /user/login**

- Authenticate user credentials
- Required: email, password
- Response: User object + JWT tokens (cookies + body)

**POST /user/refresh-token**

- Obtain new access token using refresh token
- Required: Refresh token (from cookie or body)
- Response: New access + refresh tokens

#### Protected Endpoints (JWT Required)

**POST /user/logout**

- Logout and invalidate refresh token
- Clears HTTP-only cookies

**POST /user/change-password**

- Update user password
- Required: oldPassword, newPassword
- Validates current password before change

**GET /user/current-user-details**

- Get authenticated user's profile information

**GET /user/c/:username**

- Get channel profile with statistics
- Returns: subscriber count, subscription count, isSubscribed status

**PATCH /user/update-account**

- Update fullname and email
- Required: At least one field to update

**PATCH /user/update-avatar**

- Upload new avatar image
- Content-Type: multipart/form-data
- Deletes old Cloudinary image

**PATCH /user/update-cover-image**

- Upload new cover photo
- Content-Type: multipart/form-data
- Deletes old Cloudinary image

**GET /user/watch-history**

- Get user's watch history with video details
- Returns: Array of videos with user info

---

### 5.3 Video Management (6 endpoints)

**GET /videos**

- Get all published videos
- Query params: page, limit (pagination)
- Returns: Array of videos with owner info

**POST /videos**

- Upload new video with thumbnail
- Required: videoFile, thumbnail, title
- Optional: description
- Content-Type: multipart/form-data
- Automatically extracts video duration

**GET /videos/:videoId**

- Get video details by ID
- Automatically increments view count
- Returns: Video with owner, likes count, comments count

**PATCH /videos/:videoId**

- Update video details (owner only)
- Optional: title, description, thumbnail
- Content-Type: multipart/form-data (if thumbnail)

**DELETE /videos/:videoId**

- Delete video (owner only)
- Removes files from Cloudinary
- Cascades to delete comments, likes, etc.

**PATCH /videos/toggle/publish/:videoId**

- Toggle video publish status (owner only)
- Toggles between published/unpublished

---

### 5.4 Comment Management (4 endpoints)

**GET /comments/:videoId**

- Get all comments for a video
- Returns: Comments with user info and like count

**POST /comments/:videoId**

- Add comment to video
- Required: content

**PATCH /comments/c/:commentId**

- Update comment content (owner only)
- Required: content

**DELETE /comments/c/:commentId**

- Delete comment (owner only)

---

### 5.5 Like System (4 endpoints)

**POST /likes/toggle/v/:videoId**

- Toggle like on video
- Returns: { liked: boolean }

**POST /likes/toggle/c/:commentId**

- Toggle like on comment
- Returns: { liked: boolean }

**POST /likes/toggle/t/:tweetId**

- Toggle like on tweet
- Returns: { liked: boolean }

**GET /likes/videos**

- Get all videos liked by current user
- Returns: Array of liked videos with details

---

### 5.6 Subscription Management (3 endpoints)

**POST /subscriptions/c/:channelId**

- Subscribe/unsubscribe to channel
- Returns: { subscribed: boolean }

**GET /subscriptions/c/:channelId**

- Get channel's subscribers list
- Returns: Subscribers array with count

**GET /subscriptions/u/:subscriberId**

- Get user's subscribed channels
- Returns: Subscriptions array with count

---

### 5.7 Playlist Management (7 endpoints)

**POST /playlist**

- Create new playlist
- Required: name, description

**GET /playlist/user/:userId**

- Get all playlists for a user
- Returns: Playlists with video count

**GET /playlist/:playlistId**

- Get playlist details with videos
- Returns: Playlist with video array

**PATCH /playlist/:playlistId**

- Update playlist (owner only)
- Optional: name, description

**DELETE /playlist/:playlistId**

- Delete playlist (owner only)

**POST /playlist/:playlistId/:videoId**

- Add video to playlist (owner only)

**DELETE /playlist/:playlistId/:videoId**

- Remove video from playlist (owner only)

---

### 5.8 Tweet Management (4 endpoints)

**POST /tweets**

- Create new tweet/post
- Required: content

**GET /tweets/user/:userId**

- Get all tweets by user
- Returns: Tweets with user info and likes

**PATCH /tweets/:tweetId**

- Update tweet (owner only)
- Required: content

**DELETE /tweets/:tweetId**

- Delete tweet (owner only)

---

### 5.9 Dashboard Analytics (2 endpoints)

**GET /dashboard/stats**

- Get channel statistics
- Returns: totalVideos, totalViews, totalSubscribers, totalLikes

**GET /dashboard/videos**

- Get all videos uploaded by current user
- Returns: Array of user's videos with stats

---

### 5.10 Health Check (1 endpoint)

**GET /healthcheck**

- Check API server status
- No authentication required
- Returns: { status: "OK", message: "Server is running" }

---

## 6. Security Implementation

### 6.1 Authentication Flow

1. **Registration:**
   - Validate input data
   - Hash password with bcrypt (10 rounds)
   - Upload avatar/cover to Cloudinary
   - Create user in database
   - Generate JWT tokens
   - Set HTTP-only cookies

2. **Login:**
   - Find user by email
   - Compare password hash
   - Generate new JWT tokens
   - Update refresh token in database
   - Set HTTP-only cookies

3. **Token Refresh:**
   - Extract refresh token from cookie
   - Verify JWT signature
   - Check token in database
   - Generate new tokens
   - Update database

4. **Protected Routes:**
   - Extract access token from cookie/header
   - Verify JWT signature
   - Decode user ID from payload
   - Attach user object to request
   - Proceed to controller

### 6.2 Authorization

- **Owner-based permissions:** Users can only modify/delete their own resources
- **Resource validation:** Verify resource exists and belongs to user
- **Middleware protection:** All sensitive routes behind authentication

### 6.3 Input Validation

- **Request body validation:** Joi/custom validators for all inputs
- **File validation:** Size, type, and required field checks
- **Parameter sanitization:** Username normalization (lowercase, trim)
- **SQL injection prevention:** Prisma parameterized queries

### 6.4 File Upload Security

- **Size limits:** Videos (100MB), Images (10MB)
- **Type validation:** MIME type checking
- **Cloudinary upload:** Server-side upload (not client-direct)
- **Cleanup:** Delete local temp files after upload

---

## 7. Database Design Principles

### 7.1 Normalization

- **3NF (Third Normal Form):** Eliminate data redundancy
- **Referential integrity:** Foreign keys with cascade rules
- **Unique constraints:** Prevent duplicate data

### 7.2 Indexing Strategy

- **Primary keys:** Auto-increment integers
- **Unique indexes:** username, email, unique combinations
- **Foreign key indexes:** All relationship columns
- **Query optimization:** Index frequently queried columns

### 7.3 Relationships

- **One-to-Many:** User → Videos, User → Comments
- **Many-to-Many:** Users ↔ Users (subscriptions), Playlists ↔ Videos
- **Polymorphic:** Likes (videos/comments/tweets)

### 7.4 Data Integrity

- **Cascading deletes:** Remove related data when parent deleted
- **Unique constraints:** Prevent duplicate likes, subscriptions
- **Not null constraints:** Required fields enforced
- **Default values:** Sensible defaults for optional fields

---

## 8. Environment Configuration

### 8.1 Required Environment Variables

```env
# Server
PORT=8000
NODE_ENV=development|production
CORS_ORIGIN=*

# Database
DATABASE_URL="postgresql://user:password@host:5432/viztube?schema=public"

# JWT
ACCESS_TOKEN_SECRET=<strong-random-string-32+chars>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=<strong-random-string-32+chars>
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

### 8.2 Development Setup

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### 8.3 Production Setup

```bash
# Build TypeScript
npm run build

# Deploy migrations
npx prisma migrate deploy

# Start production server
npm start
```

---

## 9. API Response Standards

### 9.1 Success Response Format

```json
{
  "statusCode": 200,
  "data": {
    /* response data */
  },
  "message": "Success message",
  "success": true
}
```

### 9.2 Error Response Format

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Error message",
  "success": false,
  "errors": []
}
```

### 9.3 HTTP Status Codes

- **200:** Success
- **201:** Created
- **400:** Bad Request (validation errors)
- **401:** Unauthorized (invalid/missing token)
- **403:** Forbidden (insufficient permissions)
- **404:** Not Found
- **409:** Conflict (duplicate data)
- **500:** Internal Server Error

---

## 10. Performance Optimization

### 10.1 Database

- Strategic indexing on foreign keys and query fields
- Connection pooling via Prisma
- Efficient joins using Prisma's include
- Pagination for large datasets

### 10.2 File Storage

- Cloudinary CDN for global content delivery
- Automatic format optimization
- Responsive image transformations
- Video streaming support

### 10.3 Caching (Future Enhancement)

- Redis for session management
- Cache frequently accessed data
- Invalidate on updates

---

## 11. Testing Strategy

### 11.1 Manual Testing

- Postman collection with 40+ pre-configured requests
- Environment variables for easy switching
- Auto-save tokens and IDs

### 11.2 Automated Testing (Roadmap)

- Unit tests for utilities and helpers
- Integration tests for API endpoints
- E2E tests for complete user flows
- Test coverage >80%

---

## 12. Deployment Architecture

### 12.1 Recommended Platforms

- **Backend:** Render, Railway, Heroku, AWS EC2
- **Database:** Neon, Supabase, AWS RDS, Railway PostgreSQL
- **Media:** Cloudinary (generous free tier)

### 12.2 CI/CD Pipeline (Recommended)

```
GitHub → Actions → Build → Test → Deploy → Production
```

---

## 13. Monitoring & Maintenance

### 13.1 Logging

- Console logging for development
- Structured logging for production (Winston, Pino)
- Error tracking (Sentry, LogRocket)

### 13.2 Metrics

- API response times
- Error rates
- Database query performance
- User engagement metrics

---

## 14. Future Enhancements

### Phase 2 Features

- [ ] Real-time notifications (WebSockets)
- [ ] Video transcoding pipeline
- [ ] Full-text search (PostgreSQL full-text)
- [ ] Content recommendations
- [ ] Rate limiting & throttling
- [ ] Redis caching layer

### Phase 3 Features

- [ ] Live streaming support
- [ ] Video chapters & timestamps
- [ ] Playlist collaboration
- [ ] Advanced analytics
- [ ] Content moderation tools
- [ ] Multi-language support

---

## 15. Technical Debt & Known Limitations

### Current Limitations

- No rate limiting (add Express rate limit)
- No video transcoding (videos uploaded as-is)
- Basic pagination (no cursor-based)
- No search functionality
- No email verification
- No real-time features

### Refactoring Opportunities

- Extract business logic into service layer
- Add comprehensive test suite
- Implement caching strategy
- Add API documentation (Swagger/OpenAPI)

---

## 16. Documentation

### Available Documentation

1. **README.md** - Project overview and setup
2. **API_DOCUMENTATION.md** - Complete endpoint reference
3. **ARCHITECTURE.md** - System architecture details
4. **POSTMAN_COLLECTION_README.md** - API testing guide
5. **PRD.md** - This document

---

## 17. Support & Contribution

### Getting Help

- GitHub Issues for bug reports
- GitHub Discussions for questions
- Documentation for implementation details

### Contributing

- Fork repository
- Create feature branch
- Follow code style (ESLint + Prettier)
- Add tests for new features
- Submit pull request

---

## 18. License & Credits

**License:** ISC  
**Author:** Nishant Sharma  
**Repository:** [github.com/Nishant-444/Viztube](https://github.com/Nishant-444/Viztube)

### Acknowledgments

- Express.js team
- Prisma team
- PostgreSQL community
- Cloudinary
- TypeScript team

---

**Document Version:** 2.0.0  
**Last Updated:** January 9, 2026  
**Status:** Complete & Production Ready
