# VizTube - Production Video Platform Backend

**Version:** 2.0.0  
**Status:** Production (V2)  
**Tech Stack:** TypeScript, Node.js, Express, PostgreSQL, Prisma, AWS

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white)

---

## Project Overview

VizTube is a production-grade backend infrastructure for a video-sharing platform, built with enterprise-level architecture and deployed on AWS. The system is architected for high concurrency with sub-200ms API response time targets, featuring secure JWT authentication, Cloudinary CDN integration, and a fully normalized PostgreSQL database.

**Live Infrastructure:**

- **Compute:** AWS EC2 (t3.micro)
- **Database:** AWS RDS PostgreSQL
- **CDN:** Cloudinary (100MB video limit)
- **Security:** Cloudflare DNS/SSL + AWS Security Groups
- **Process Manager:** PM2 (fork mode)

---

## System Architecture

```
Client → Cloudflare (SSL/DNS) → AWS Security Group → Nginx → PM2 → Express → PostgreSQL/Cloudinary
```

**Request Flow:**

1. HTTPS request hits Cloudflare edge network
2. DNS resolves, SSL terminated at Cloudflare
3. Traffic proxied to AWS EC2 (Cloudflare IPs whitelisted)
4. Nginx reverse proxy forwards to localhost:3000
5. PM2-managed Node.js process handles request
6. Express routes to controller → Prisma ORM → PostgreSQL
7. Media uploads stream directly to Cloudinary

**Key Infrastructure Decisions:**

- **Fork Mode vs Cluster:** Single PM2 instance prevents OOM crashes on 1GB RAM
- **Cloudflare Flexible SSL:** Simplifies origin server SSL management
- **Direct Cloudinary Upload:** Reduces server storage overhead
- **AWS RDS:** Managed backups, automated failover

---

## Core Technology Stack

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.1-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-EC2/RDS-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

| Layer     | Technology | Version | Purpose                                   |
| --------- | ---------- | ------- | ----------------------------------------- |
| Runtime   | Node.js    | v18+    | Server execution environment              |
| Language  | TypeScript | v5.9.3  | Type safety, compile-time error detection |
| Framework | Express.js | v5.1.0  | HTTP request handling, middleware         |
| Database  | PostgreSQL | v14+    | Relational data storage                   |
| ORM       | Prisma     | v7.2.0  | Type-safe database queries                |
| Auth      | JWT        | -       | Stateless authentication                  |
| Storage   | Cloudinary | -       | Video/image CDN                           |

---

## Database Schema

The database follows **Third Normal Form (3NF)** with strategic indexing and cascading deletes.

### Core Tables

**Users**

```sql
id          SERIAL PRIMARY KEY
username    VARCHAR UNIQUE (indexed)
email       VARCHAR UNIQUE (indexed)
fullname    VARCHAR
password    VARCHAR (bcrypt hashed)
avatar      VARCHAR (Cloudinary URL)
coverImage  VARCHAR (Cloudinary URL)
refreshToken VARCHAR (nullable)
```

**Videos**

```sql
id                SERIAL PRIMARY KEY
userId            INT FK → Users.id (CASCADE DELETE)
videoFileUrl      VARCHAR (Cloudinary URL)
videoFilePublicId VARCHAR (for deletion)
thumbnailUrl      VARCHAR
thumbnailPublicId VARCHAR
title             VARCHAR
description       TEXT
duration          FLOAT (auto-extracted)
views             INT DEFAULT 0
isPublished       BOOLEAN DEFAULT TRUE
```

**Likes (Polymorphic)**

```sql
id        SERIAL PRIMARY KEY
userId    INT FK → Users.id
videoId   INT FK → Videos.id (nullable)
commentId INT FK → Comments.id (nullable)
tweetId   INT FK → Tweets.id (nullable)
UNIQUE(userId, videoId), UNIQUE(userId, commentId), UNIQUE(userId, tweetId)
```

**Subscriptions (Self-Referencing Many-to-Many)**

```sql
id           SERIAL PRIMARY KEY
subscriberId INT FK → Users.id
channelId    INT FK → Users.id
UNIQUE(subscriberId, channelId)
```

**Relationships:**

- User → Videos (1:N, cascade delete)
- User → Subscriptions (M:N self-reference)
- Videos ↔ Playlists (M:N via PlaylistVideos junction table)
- Likes → Videos/Comments/Tweets (polymorphic, unique constraints)

---

## API Architecture

**Base URL:** `/api/v2`

### Authentication Flow

```
Registration → Upload to Cloudinary → Hash Password → Store User → Generate JWT
Login → Verify Password → Generate Tokens → Set HTTP-Only Cookies
Protected Route → Extract Token → Verify JWT → Attach User to Request
```

**Token Strategy:**

- **Access Token:** 15-minute expiry, stored in HTTP-only cookie (SameSite=Strict)
- **Refresh Token:** 7-day expiry, stored in database + cookie
- **Rotation:** New refresh token issued on every access token renewal

### Endpoint Categories

**1. User Management (11 endpoints)**

```
POST   /user/register           - Create account with avatar/cover
POST   /user/login              - Authenticate, issue JWT tokens
POST   /user/refresh-token      - Renew access token
POST   /user/logout             - Invalidate refresh token
POST   /user/change-password    - Update password (old password required)
GET    /user/current-user-details - Fetch authenticated user profile
GET    /user/c/:username        - Get channel profile with stats
PATCH  /user/update-account     - Modify fullname/email
PATCH  /user/update-avatar      - Replace avatar (deletes old Cloudinary asset)
PATCH  /user/update-cover-image - Replace cover image
GET    /user/watch-history      - Retrieve watched videos
```

**2. Video Operations (6 endpoints)**

```
GET    /videos                  - List published videos (paginated)
POST   /videos                  - Upload video + thumbnail (multipart/form-data)
GET    /videos/:videoId         - Fetch video details, increment views
PATCH  /videos/:videoId         - Update metadata (owner only)
DELETE /videos/:videoId         - Remove video + Cloudinary assets (owner only)
PATCH  /videos/toggle/publish/:videoId - Toggle isPublished flag
```

**3. Social Interactions (11 endpoints)**

```
# Comments
GET    /comments/:videoId       - List video comments
POST   /comments/:videoId       - Add comment
PATCH  /comments/c/:commentId   - Edit comment (owner only)
DELETE /comments/c/:commentId   - Delete comment (owner only)

# Likes (Toggle endpoints - idempotent)
POST   /likes/toggle/v/:videoId    - Like/unlike video
POST   /likes/toggle/c/:commentId  - Like/unlike comment
POST   /likes/toggle/t/:tweetId    - Like/unlike tweet
GET    /likes/videos               - Get liked videos

# Subscriptions
POST   /subscriptions/c/:channelId - Subscribe/unsubscribe (toggle)
GET    /subscriptions/c/:channelId - Get channel subscribers
GET    /subscriptions/u/:subscriberId - Get user's subscriptions
```

**4. Content Organization (7 endpoints)**

```
POST   /playlist                - Create playlist
GET    /playlist/user/:userId   - List user playlists
GET    /playlist/:playlistId    - Get playlist with videos
PATCH  /playlist/:playlistId    - Update name/description (owner only)
DELETE /playlist/:playlistId    - Delete playlist (owner only)
POST   /playlist/:playlistId/:videoId - Add video to playlist
DELETE /playlist/:playlistId/:videoId - Remove video from playlist
```

**5. Community Posts (4 endpoints)**

```
POST   /tweets                  - Create post
GET    /tweets/user/:userId     - Get user posts
PATCH  /tweets/:tweetId         - Edit post (owner only)
DELETE /tweets/:tweetId         - Delete post (owner only)
```

**6. Analytics (2 endpoints)**

```
GET    /dashboard/stats         - Channel statistics (videos, views, subscribers, likes)
GET    /dashboard/videos        - User's uploaded videos with metrics
```

**7. Health Check (1 endpoint)**

```
GET    /healthcheck             - Server status (no auth required)
```

---

## Security Implementation

### Authentication & Authorization

**Password Security:**

- Bcrypt hashing (10 salt rounds)
- Minimum 8 characters (enforced at application layer)
- Old password required for changes

**JWT Configuration:**

```javascript
{
  accessToken: {
    secret: process.env.ACCESS_TOKEN_SECRET,
    expiry: "15m",
    storage: "HTTP-only cookie (SameSite=Strict) + response body"
  },
  refreshToken: {
    secret: process.env.REFRESH_TOKEN_SECRET,
    expiry: "7d",
    storage: "HTTP-only cookie + database"
  }
}
```

**Middleware Stack:**

```
Request → Helmet (security headers)
        → CORS (whitelisted origins)
        → Rate Limiter (auth: 10/15min, API: 100/15min)
        → Body Parser
        → Cookie Parser
        → JWT Verification
        → Route Handler
        → Error Handler
```

### Network Security

**AWS Security Group Rules:**

```
Inbound: Port 80 TCP from Cloudflare IP ranges ONLY
Outbound: All traffic (RDS + Cloudinary connections)
```

**Cloudflare Configuration:**

- SSL Mode: Flexible (Client→CF: HTTPS, CF→AWS: HTTP)
- DDoS Protection: Automatic mitigation
- Direct IP Access: Blocked (prevents origin exposure)

### Input Validation

**File Uploads:**

- Video: 100MB max, MIME type validation
- Image: 10MB max, extension whitelist (JPG, PNG)
- Multer middleware enforces limits
- Temp files deleted post-upload

**Request Validation:**

- Username: Alphanumeric + underscore, 3-30 chars
- Email: RFC 5322 compliant
- Prisma parameterized queries (SQL injection prevention)

---

## Performance Characteristics

### Performance Goals (SLAs)

| Metric                         | Target |
| ------------------------------ | ------ |
| API Response (95th percentile) | <200ms |
| Video Upload (100MB)           | <5s    |
| Database Query Avg             | <50ms  |
| CDN First Byte                 | <100ms |

### Optimization Strategies

**Database:**

- Strategic indexes on `userId`, `videoId`, `createdAt`
- Unique constraints on likes (prevent duplicate queries)
- Pagination (default 10 items/page)
- Prisma connection pooling (optimized for single instance)

**Media Delivery:**

- Cloudinary `f_auto` transformation (WebP/MP4 based on browser)
- Global CDN (200+ edge locations)
- Video streaming (no full file download)

**Application:**

- PM2 automatic restarts (zero-downtime on crashes)
- Nginx request buffering (reduces backend load)
- Gzip compression (text responses)

---

## Deployment Architecture

### Production Environment

**Server Configuration:**

```yaml
Instance: AWS EC2 t3.micro
OS: Ubuntu 24.04 LTS
RAM: 1GB (constraint: fork mode only)
CPU: 2 vCPU
Process Manager: PM2 (1 instance, fork mode)
Web Server: Nginx (reverse proxy, port 80 → 3000)
```

**PM2 Ecosystem:**

```javascript
{
  name: "viztube-api",
  script: "./dist/index.js",
  instances: 1,
  exec_mode: "fork",
  env: { NODE_ENV: "production", PORT: 3000 }
}
```

**Database Configuration:**

- AWS RDS PostgreSQL (managed service)
- Automated daily backups (7-day retention)
- SSL/TLS connection enforced

---

## Getting Started

### Prerequisites

```bash
Node.js v18+
PostgreSQL v14+
Cloudinary account
```

### Installation

```bash
# Clone repository
git clone https://github.com/Nishant-444/Viztube.git
cd Viztube

# Install dependencies
npm install

# Configure environment
cp .env.sample .env
# Edit .env with your credentials

# Setup database
npx prisma generate
npx prisma migrate dev

# Build TypeScript
npm run build

# Start development server
npm run dev

# Production start
npm start
```

### Environment Variables

```env
# Server
PORT=8000
NODE_ENV=development
CORS_ORIGIN=*

# Database
DATABASE_URL=postgresql://user:pass@host:5432/viztube?schema=public

# JWT (use 256-bit random strings)
ACCESS_TOKEN_SECRET=<64-char-random-string>
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=<64-char-random-string>
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
```

### Verification

```bash
# Health check
curl http://localhost:8000/api/v2/healthcheck

# Expected response
{
  "statusCode": 200,
  "data": { "status": "OK", "message": "Server is running" },
  "success": true
}
```

---

## Testing

### Manual Testing (Postman Collection Included)

```bash
# Register user
curl -X POST http://localhost:8000/api/v2/user/register \
  -F "username=testuser" \
  -F "email=test@example.com" \
  -F "fullname=Test User" \
  -F "password=SecurePass123" \
  -F "avatar=@avatar.jpg"

# Login
curl -X POST http://localhost:8000/api/v2/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123"}'

# Upload video (authenticated)
curl -X POST http://localhost:8000/api/v2/videos \
  -H "Authorization: Bearer <access-token>" \
  -F "videoFile=@video.mp4" \
  -F "thumbnail=@thumb.jpg" \
  -F "title=Test Video" \
  -F "description=Test Description"
```

### Test Coverage (Roadmap)

- [ ] Unit tests (controllers, utils)
- [ ] Integration tests (API endpoints)
- [ ] E2E tests (user flows)
- [ ] Target: 80%+ coverage

---

## Project Structure

```
viztube/
├── prisma/
│   ├── schema.prisma           # Database models (Users, Videos, etc.)
│   └── migrations/             # Migration history
├── src/
│   ├── index.ts                # Application entry point
│   ├── app.ts                  # Express configuration
│   ├── controllers/            # Business logic (user, video, comment, etc.)
│   ├── routes/                 # API route definitions
│   ├── middlewares/            # Auth, file upload, error handling
│   ├── utils/                  # ApiResponse, ApiError, Cloudinary helpers
│   └── validators/             # Input validation schemas
├── public/temp/                # Temporary upload storage
├── .env.sample                 # Environment template
└── ecosystem.config.js         # PM2 configuration
```

---

## Known Limitations & Roadmap

### Current Constraints

1. **No Video Transcoding:** Videos uploaded as-is (no HLS/DASH)
2. **No Live Streaming:** RTMP ingest not supported
3. **Basic Pagination:** Offset-based (no cursor pagination)
4. **No Full-Text Search:** Title/description search unavailable
5. **No Email Verification:** Users can register without confirmation

### Planned Enhancements (v3.0)

**Phase 2 (Q2 2026):**

- Real-time notifications (WebSockets)
- Full-text search (PostgreSQL `tsvector` + GIN indexes)
- Redis caching layer (sessions, user profiles)

**Phase 3 (Q3 2026):**

- Video transcoding pipeline (HLS adaptive streaming)
- Live streaming (RTMP → HLS)
- Content moderation tools

---

## Technical Decisions & Trade-offs

### Why PostgreSQL over MongoDB?

- **Relational Integrity:** Subscriptions, playlists require complex joins
- **ACID Compliance:** Critical for like counts, view tracking
- **Prisma ORM:** Type-safe queries, migration management

### Why PM2 Fork Mode?

- **Memory Constraint:** 1GB RAM insufficient for cluster mode
- **Crash Recovery:** Automatic restart on failure
- **Scaling Strategy:** Horizontal (multiple EC2 instances) vs vertical

### Why Cloudflare Flexible SSL?

- **Simplified Management:** No origin SSL certificate required
- **Trade-off:** AWS→Cloudflare traffic unencrypted (mitigated by IP whitelist)
- **Alternative:** Full SSL with Let's Encrypt (added complexity)

### Why Direct Cloudinary Upload?

- **Storage Efficiency:** Avoids local disk usage
- **Scalability:** No server bottleneck for large files
- **Trade-off:** Network dependency (mitigated by CDN reliability)

---

## Monitoring & Observability

### Monitoring

- **AWS CloudWatch:** Automated CPU & Network I/O tracking.
- **PM2 Dashboard:** Real-time process metrics (RAM/Restart count).
- **Health Check:** `/healthcheck` endpoint for uptime verification.

### Key Metrics Tracked

- PM2 process health (CPU, memory, restart count)
- AWS CloudWatch infrastructure metrics (network I/O, disk usage)
- Application logs (error tracking via PM2 logs)
- Database connection pool status (Prisma metrics)

---

## Contributing

Contributions welcome. Follow standard Git workflow:

```bash
git checkout -b feature/feature-name
# Make changes
git commit -m "Add: feature description"
git push origin feature/feature-name
# Open pull request
```

**Code Standards:**

- ESLint + Prettier configured
- TypeScript strict mode
- Prisma schema migrations required
- Update API docs for new endpoints

---

## License

ISC License

---

## Author

**Nishant Sharma**  
GitHub: [@Nishant-444](https://github.com/Nishant-444)  
Repository: [VizTube](https://github.com/Nishant-444/Viztube)

---

## Other Documentation

- **[PRD](./PRD.md)** - Product requirements, system architecture, feature specifications
- **[Postman Collection](./docs/viztube.postman_collection.json)** - API testing collection

---
