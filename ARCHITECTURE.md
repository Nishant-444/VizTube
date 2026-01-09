# How VizTube Works

This document explains how everything fits together in the VizTube backend.

---

## The Big Picture

VizTube is built with these technologies:

- **TypeScript** - Makes sure our code doesn't have silly bugs
- **Node.js + Express** - Runs the server
- **PostgreSQL** - Stores all our data (users, videos, comments, etc.)
- **Prisma** - Talks to the database in a safe way
- **Cloudinary** - Stores videos and images in the cloud
- **JWT** - Keeps users logged in securely

### How We Built It

We followed some simple principles:

1. **Keep things organized** - Routes, controllers, and database stuff are all separate
2. **Stay safe** - TypeScript catches errors before they happen
3. **Think big** - The app can handle lots of users
4. **Lock it down** - Check everything users send us
5. **Keep it clean** - Code is easy to read and understand

---

## What's Inside

### Backend Stack

- Node.js v18+ runs everything
- TypeScript makes sure types are correct
- Express handles HTTP requests

### Database

- PostgreSQL stores our data
- Prisma makes database queries safe and easy
- Automatic migrations when we change the database structure

### Authentication

- JWT tokens keep users logged in
- Access token lasts 15 minutes
- Refresh token lasts 7 days
- Passwords are hashed with Bcrypt (super secure)

### File Storage

- Cloudinary stores videos and images
- Multer handles file uploads
- We check file types and sizes

---

## How It's Organized

┌─────────────────┐
│ Client Apps │
│ (Web, Mobile) │
└────────┬────────┘
│ HTTPS/HTTP
▼
┌─────────────────────────────────────┐
│ Express.js Server │
│ ┌─────────────────────────────┐ │
│ │ Middleware Pipeline │ │
│ │ • CORS │ │
│ │ • Cookie Parser │ │
│ │ • JSON Body Parser │ │
│ │ • Static File Serving │ │
│ └─────────────────────────────┘ │
│ │
│ ┌─────────────────────────────┐ │
│ │ Authentication Middleware │ │
│ │ • JWT Verification │ │
│ │ • Token Validation │ │
│ └─────────────────────────────┘ │
│ │
│ ┌─────────────────────────────┐ │
│ │ Router Layer │ │
│ │ • User Routes │ │
│ │ • Video Routes │ │
│ │ • Comment Routes │ │
│ │ • Like Routes │ │
│ │ • Subscription Routes │ │
│ │ • Playlist Routes │ │
│ │ • Tweet Routes │ │
│ │ • Dashboard Routes │ │
│ └─────────────────────────────┘ │
│ │
│ ┌─────────────────────────────┐ │
│ │ Controller Layer │ │
│ │ • Business Logic │ │
│ │ • Request Validation │ │
│ │ • Response Formatting │ │
│ └─────────────────────────────┘ │
│ │
│ ┌─────────────────────────────┐ │
│ │ Error Handler │ │
│ │ • Global Error Catching │ │
│ │ • Standardized Responses │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────────┘
│ │
▼ ▼
┌──────────────────┐ ┌──────────────┐
│ PostgreSQL │ │ Cloudinary │
│ Database │ │ CDN │
│ • User Data │ │ • Videos │
│ • Video Meta │ │ • Images │
│ • Comments │ │ │
│ • Likes │ │ │
│ • Subscriptions │ │ │
│ • Playlists │ │ │
└──────────────────┘ └──────────────┘

```

---

## Database Design

### Entity-Relationship Diagram

```

┌─────────────────────┐
│ User │
│─────────────────────│
│ id (PK) │
│ username (UNIQUE) │
│ email (UNIQUE) │
│ fullname │
│ avatar │
│ coverImage │
│ password │
│ refreshToken │
│ createdAt │
│ updatedAt │
└──────────┬──────────┘
│
│ 1:N
├──────────────────┐
│ │
▼ ▼
┌─────────────────┐ ┌──────────────────┐
│ Video │ │ Comment │
│─────────────────│ │──────────────────│
│ id (PK) │ │ id (PK) │
│ videoFileUrl │ │ content │
│ thumbnailUrl │ │ userId (FK) │
│ title │ │ videoId (FK) │
│ description │ │ createdAt │
│ views │ │ updatedAt │
│ duration │ └──────────────────┘
│ isPublished │
│ userId (FK) │
│ createdAt │
└────────┬────────┘
│
│ 1:N
├─────────────────────┐
│ │
▼ ▼
┌──────────────────┐ ┌──────────────────┐
│ Like │ │ WatchHistory │
│──────────────────│ │──────────────────│
│ id (PK) │ │ id (PK) │
│ userId (FK) │ │ userId (FK) │
│ videoId (FK) │ │ videoId (FK) │
│ commentId (FK) │ │ watchedAt │
│ tweetId (FK) │ └──────────────────┘
│ createdAt │
└──────────────────┘

┌─────────────────────┐
│ Subscription │
│─────────────────────│
│ id (PK) │
│ subscriberId (FK) │──┐
│ channelId (FK) │ │ Both FK to User
│ createdAt │ │
└─────────────────────┘──┘

┌─────────────────────┐
│ Playlist │
│─────────────────────│
│ id (PK) │
│ name │
│ description │
│ userId (FK) │
│ createdAt │
└──────────┬──────────┘
│
│ M:N via PlaylistVideo
▼
┌─────────────────────┐
│ PlaylistVideo │
│─────────────────────│
│ id (PK) │
│ playlistId (FK) │
│ videoId (FK) │
│ addedAt │
└─────────────────────┘

┌─────────────────────┐
│ Tweet │
│─────────────────────│
│ id (PK) │
│ content │
│ userId (FK) │
│ createdAt │
│ updatedAt │
└─────────────────────┘

```

### Database Indexes

**Optimized for common queries:**

- **User**: `username`, `email` (unique indexes)
- **Video**: `userId`, `createdAt` (for channel videos, latest first)
- **Comment**: `videoId`, `userId` (for video comments, user comments)
- **Like**: `userId` (for user's likes), unique constraints on like combinations
- **Subscription**: `subscriberId`, `channelId` (for subscriber/channel queries)
- **Tweet**: `userId` (for user tweets)
- **WatchHistory**: `userId` (for user's watch history)
- **PlaylistVideo**: `playlistId`, unique(`playlistId`, `videoId`)

### Data Integrity

- **Cascading Deletes**: When a user is deleted, all related data is automatically deleted
- **Unique Constraints**: Prevent duplicate likes, subscriptions, and playlist videos
- **Foreign Keys**: Ensure referential integrity across tables
- **Not Null Constraints**: Required fields enforced at database level

---

## Application Structure

### Layered Architecture

```

┌──────────────────────────────────────────┐
│ Routes Layer │
│ • HTTP method and path mapping │
│ • Middleware application │
│ • Request routing to controllers │
└──────────────┬───────────────────────────┘
│
▼
┌──────────────────────────────────────────┐
│ Middleware Layer │
│ • Authentication (JWT verification) │
│ • File upload (Multer) │
│ • Validation (Input validators) │
│ • Parameter normalization │
└──────────────┬───────────────────────────┘
│
▼
┌──────────────────────────────────────────┐
│ Controller Layer │
│ • Request handling │
│ • Business logic │
│ • Data transformation │
│ • Response formatting │
└──────────────┬───────────────────────────┘
│
▼
┌──────────────────────────────────────────┐
│ Data Access Layer │
│ • Prisma ORM │
│ • Database queries │
│ • Transaction management │
└──────────────┬───────────────────────────┘
│
▼
┌──────────────────────────────────────────┐
│ Database │
│ • PostgreSQL │
│ • Data persistence │
└──────────────────────────────────────────┘

```

### Directory Structure

```

src/
├── index.ts # Application entry point
├── app.ts # Express app configuration
├── constants.ts # Application constants
│
├── config/ # Configuration files
│ └── cookieOptions.ts
│
├── controllers/ # Request handlers (business logic)
│ ├── user.controller.ts
│ ├── video.controller.ts
│ ├── comment.controller.ts
│ ├── like.controller.ts
│ ├── subscription.controller.ts
│ ├── playlist.controller.ts
│ ├── tweet.controller.ts
│ ├── dashboard.controller.ts
│ └── healthcheck.controller.ts
│
├── routes/ # API route definitions
│ ├── user.routes.ts
│ ├── video.routes.ts
│ └── ... (other routes)
│
├── middlewares/ # Request processing middleware
│ ├── auth.middleware.ts
│ ├── error.middleware.ts
│ ├── multer.middleware.ts
│ └── normalizeParams.middleware.ts
│
├── validators/ # Input validation
│ ├── auth.validators.ts
│ └── file.validators.ts
│
├── utils/ # Helper functions
│ ├── ApiError.ts
│ ├── ApiResponse.ts
│ ├── asyncHandler.ts
│ ├── cloudinary.ts
│ └── tokens.ts
│
├── lib/ # External service connections
│ └── prisma.ts
│
└── types/ # TypeScript type definitions
├── environment.d.ts
├── express.d.ts
└── cloudinary.types.ts

```

---

## Authentication Flow

### Registration Flow

```

Client Server Database Cloudinary
│ │ │ │
│ POST /user/register │ │ │
├──────────────────────►│ │ │
│ (multipart form) │ │ │
│ │ │ │
│ │ 1. Validate input │ │
│ │ 2. Check unique email │ │
│ ├───────────────────────►│ │
│ │◄───────────────────────┤ │
│ │ │ │
│ │ 3. Upload avatar │ │
│ ├────────────────────────┼─────────────►│
│ │◄────────────────────────────────────┤
│ │ │ │
│ │ 4. Hash password │ │
│ │ 5. Create user │ │
│ ├───────────────────────►│ │
│ │◄───────────────────────┤ │
│ │ │ │
│ Response (201) │ │ │
│◄──────────────────────┤ │ │
│ User created │ │ │

```

### Login Flow

```

Client Server Database
│ │ │
│ POST /user/login │ │
├──────────────────────►│ │
│ {email, password} │ │
│ │ │
│ │ 1. Find user by email │
│ ├───────────────────────►│
│ │◄───────────────────────┤
│ │ │
│ │ 2. Compare password │
│ │ (bcrypt) │
│ │ │
│ │ 3. Generate JWT tokens │
│ │ - Access Token │
│ │ - Refresh Token │
│ │ │
│ │ 4. Save refresh token │
│ ├───────────────────────►│
│ │◄───────────────────────┤
│ │ │
│ Response (200) │ │
│◄──────────────────────┤ │
│ + HTTP-only cookies │ │
│ + Tokens in body │ │

```

### Token Refresh Flow

```

Client Server Database
│ │ │
│ POST /refresh-token │ │
├──────────────────────►│ │
│ (refresh token in │ │
│ cookie) │ │
│ │ │
│ │ 1. Extract refresh │
│ │ token from cookie │
│ │ │
│ │ 2. Verify JWT │
│ │ │
│ │ 3. Find user & compare │
│ ├───────────────────────►│
│ │◄───────────────────────┤
│ │ │
│ │ 4. Generate new tokens │
│ │ │
│ │ 5. Update refresh │
│ │ token in DB │
│ ├───────────────────────►│
│ │◄───────────────────────┤
│ │ │
│ Response (200) │ │
│◄──────────────────────┤ │
│ + New tokens │ │

```

### Protected Route Access

```

Client Server Database
│ │ │
│ GET /videos │ │
├──────────────────────►│ │
│ (access token in │ │
│ cookie/header) │ │
│ │ │
│ │ 1. Extract token │
│ │ │
│ │ 2. Verify JWT │
│ │ │
│ │ 3. Decode payload │
│ │ (get user ID) │
│ │ │
│ │ 4. Find user │
│ ├───────────────────────►│
│ │◄───────────────────────┤
│ │ │
│ │ 5. Attach user to req │
│ │ │
│ │ 6. Execute controller │
│ │ │
│ Response (200) │ │
│◄──────────────────────┤ │
│ Data │ │

```

---

## File Upload Flow

### Video Upload Process

```

Client Server Cloudinary Database
│ │ │ │
│ POST /videos │ │ │
├───────────────────►│ │ │
│ (multipart/ │ │ │
│ form-data) │ │ │
│ │ │ │
│ │ 1. Multer middleware │ │
│ │ saves files to │ │
│ │ public/temp/ │ │
│ │ │ │
│ │ 2. Validate files │ │
│ │ (size, type) │ │
│ │ │ │
│ │ 3. Upload video to │ │
│ │ Cloudinary │ │
│ ├───────────────────────►│ │
│ │◄───────────────────────┤ │
│ │ (video URL) │ │
│ │ │ │
│ │ 4. Upload thumbnail │ │
│ ├───────────────────────►│ │
│ │◄───────────────────────┤ │
│ │ (thumb URL) │ │
│ │ │ │
│ │ 5. Delete local files │ │
│ │ │ │
│ │ 6. Create video record │ │
│ ├────────────────────────┼─────────────────►│
│ │◄────────────────────────────────────────┤
│ │ │ │
│ Response (201) │ │ │
│◄───────────────────┤ │ │
│ Video created │ │ │

````

### Cloudinary Configuration

```javascript
// Video Upload Settings
{
  resource_type: "video",
  folder: "viztube/videos",
  quality: "auto",
  fetch_format: "auto"
}

// Image Upload Settings
{
  resource_type: "image",
  folder: "viztube/avatars|thumbnails|covers",
  transformation: [
    { width: 300, height: 300, crop: "fill" }
  ]
}
````

---

## API Request Flow

### Typical Request Processing

```
1. Client Request
   ↓
2. Express Middleware Pipeline
   ├─ CORS
   ├─ Body Parser (JSON/URL-encoded)
   ├─ Cookie Parser
   └─ Static File Serving
   ↓
3. Route Matching
   ↓
4. Route-specific Middleware
   ├─ Authentication (verifyJWT)
   ├─ File Upload (Multer)
   ├─ Validation
   └─ Parameter Normalization
   ↓
5. Controller
   ├─ Extract request data
   ├─ Business logic
   ├─ Database operations (Prisma)
   ├─ External API calls (Cloudinary)
   └─ Format response
   ↓
6. Response
   ├─ Success: ApiResponse
   └─ Error: ApiError → Error Middleware
   ↓
7. Error Handler (if error occurred)
   ├─ Log error
   ├─ Format error response
   └─ Send to client
   ↓
8. Client receives response
```

### Error Handling

```typescript
// Custom ApiError class
class ApiError extends Error {
  statusCode: number;
  data: any;
  success: false;
  errors: any[];
}

// AsyncHandler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next); // Pass errors to error middleware
  };
};

// Global Error Middleware
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
      success: false,
      errors: err.errors,
    });
  }

  // Unexpected errors
  return res.status(500).json({
    statusCode: 500,
    message: 'Internal Server Error',
    success: false,
  });
});
```

---

## Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────────┐
│          Security Layers                    │
├─────────────────────────────────────────────┤
│                                             │
│  1. Password Security                       │
│     • Bcrypt hashing (10 rounds)           │
│     • No plaintext storage                  │
│     • Password confirmation on changes      │
│                                             │
│  2. JWT Token Security                      │
│     • Short-lived access tokens (15min)    │
│     • Long-lived refresh tokens (7 days)   │
│     • HTTP-only cookies (XSS protection)   │
│     • Token verification on each request   │
│                                             │
│  3. Authorization                           │
│     • Owner-based permissions              │
│     • Resource ownership verification      │
│     • Protected routes                     │
│                                             │
│  4. Input Validation                        │
│     • Request body validation              │
│     • File type/size validation            │
│     • Parameter sanitization               │
│     • SQL injection prevention (Prisma)    │
│                                             │
│  5. CORS Configuration                      │
│     • Whitelisted origins                  │
│     • Credentials support                  │
│                                             │
│  6. Rate Limiting (TODO)                    │
│     • Per-IP request limits                │
│     • Per-user API limits                  │
│                                             │
└─────────────────────────────────────────────┘
```

### Data Protection

- **Passwords**: Hashed with bcrypt before storage
- **Tokens**: JWT with secret keys, stored in HTTP-only cookies
- **Environment Variables**: Sensitive data in `.env` file (gitignored)
- **Database**: Parameterized queries via Prisma (SQL injection prevention)
- **File Uploads**: Type and size validation, stored in Cloudinary (not on server)

---

## Deployment Architecture

### Production Environment

```
┌──────────────────────────────────────────────┐
│            Load Balancer (Optional)          │
└──────────────────┬───────────────────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
       ▼                       ▼
┌──────────────┐        ┌──────────────┐
│  App Server  │        │  App Server  │
│   (Node.js)  │        │   (Node.js)  │
│              │        │              │
│  • Express   │        │  • Express   │
│  • TypeScript│        │  • TypeScript│
└───────┬──────┘        └──────┬───────┘
        │                      │
        └──────────┬───────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌────────────────┐   ┌────────────────┐
│   PostgreSQL   │   │   Cloudinary   │
│    Database    │   │      CDN       │
│                │   │                │
│  • Primary     │   │  • Videos      │
│  • Replica(s)  │   │  • Images      │
└────────────────┘   └────────────────┘
```

### Environment Variables

```env
# Server
NODE_ENV=production
PORT=8000
CORS_ORIGIN=https://yourdomain.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/viztube

# JWT
ACCESS_TOKEN_SECRET=<strong-secret>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=<strong-secret>
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
```

### Deployment Checklist

- [ ] Build TypeScript (`npm run build`)
- [ ] Run database migrations (`prisma migrate deploy`)
- [ ] Set environment variables
- [ ] Configure CORS for production domain
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure CDN for static assets (optional)

---

## Performance Considerations

### Database Optimization

- **Indexes**: All foreign keys and commonly queried fields indexed
- **Pagination**: Limit queries with offset/limit
- **Select specific fields**: Only fetch needed columns
- **Connection pooling**: Prisma connection pool management

### Caching Strategy (Future)

- **Redis**: Cache frequently accessed data (user profiles, video metadata)
- **CDN**: Cloudinary serves media files with global CDN
- **HTTP Caching**: Set appropriate Cache-Control headers

### Scalability

- **Stateless Design**: JWT tokens enable horizontal scaling
- **Cloud Storage**: Cloudinary handles media storage and delivery
- **Database**: PostgreSQL supports read replicas for scaling reads
- **Microservices (Future)**: Can split into separate services (auth, video, social)

---

## Monitoring & Logging

### Logging Strategy (To Implement)

```javascript
// Recommended logging levels
{
  error: "Error events",
  warn: "Warning events",
  info: "Informational messages",
  debug: "Debug messages"
}

// Log important events
- User registration/login
- Video uploads
- API errors
- Database errors
- Authentication failures
```

### Metrics to Monitor

- **Application**: Response times, error rates, request volume
- **Database**: Query performance, connection pool usage
- **Infrastructure**: CPU, memory, disk usage
- **Business**: User signups, video uploads, engagement metrics

---

## Future Enhancements

1. **Caching Layer**: Redis for session management and data caching
2. **Message Queue**: RabbitMQ/Bull for async tasks (video processing)
3. **Search**: Elasticsearch for full-text video search
4. **Real-time**: WebSockets for notifications and live features
5. **Analytics**: Advanced user behavior tracking
6. **CDN**: Additional CDN for static assets
7. **Monitoring**: APM tools (New Relic, Datadog)
8. **Testing**: Unit, integration, and E2E tests

---

**Document Version**: 2.0.0  
**Last Updated**: January 2026  
**Maintainer**: Nishant Sharma
