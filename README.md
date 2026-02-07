# VizTube - Production Video Platform Backend

[![Deploy Docker to EC2](https://github.com/Nishant-444/VizTube/actions/workflows/deploy.yml/badge.svg)](https://github.com/Nishant-444/VizTube/actions/workflows/deploy.yml)

**Version:** 2.0.0  
**Status:** Live Deployment (MVP)  
**Live API Endpoint:** [https://viztube.me](https://viztube.me)  
**Tech Stack:** TypeScript, Node.js, Express, PostgreSQL, Prisma, Docker, AWS

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white)

---

## Project Overview

VizTube is a resource-optimized production MVP backend for a video-sharing platform, deployed on AWS with a containerized architecture. The system features secure JWT authentication, Cloudinary CDN integration, and a fully normalized PostgreSQL database managed through Prisma ORM.

**Live Infrastructure:**

- **Compute:** AWS EC2 (t3.micro - 1GB RAM, 2 vCPU)
- **Database:** Self-hosted PostgreSQL in Docker container
- **CDN:** Cloudinary (100MB video limit)
- **Containerization:** Docker Compose (Node.js API + PostgreSQL)
- **Security:** Cloudflare DNS/SSL + Certbot/Nginx SSL
- **Process Manager:** Docker containers

---

## System Architecture

```
Client → Cloudflare (SSL/DNS) → Nginx (SSL/TLS) → Docker Containers (API + PostgreSQL) → Cloudinary
```

**Request Flow:**

1. HTTPS request hits Cloudflare edge network
2. DNS resolves, SSL terminated at Cloudflare
3. Traffic proxied to AWS EC2 via Nginx reverse proxy
4. Nginx reverse proxy with SSL/TLS (Certbot) forwards to Docker container (port 3000 blocked by AWS Security Groups)
5. Dockerized Node.js API handles request
6. Express routes to controller → Prisma ORM → PostgreSQL (Docker container)
7. Media uploads processed via Multer (disk storage to `public/temp`), then asynchronously uploaded to Cloudinary

**Key Infrastructure Decisions:**

- **Docker Containers:** Isolated services with resource limits and easy rollback
- **Self-hosted PostgreSQL:** Docker volume persistence for data durability
- **Certbot SSL/TLS:** Free SSL certificates with auto-renewal
- **Asynchronous Media Processing:** Server-side Cloudinary integration via Multer disk storage
- **Automated Docker Deployment:** GitHub Actions CI/CD with container rebuilds

---

## Core Technology Stack

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.1-000000?style=flat-square&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748?style=flat-square&logo=prisma&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-EC2-232F3E?style=flat-square&logo=amazonaws&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-CDN-3448C5?style=flat-square&logo=cloudinary&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)

| Layer     | Technology          | Version | Purpose                                   |
| --------- | ------------------- | ------- | ----------------------------------------- |
| Runtime   | Node.js             | v18+    | Server execution environment              |
| Language  | TypeScript          | v5.9.3  | Type safety, compile-time error detection |
| Framework | Express.js          | v5.1.0  | HTTP request handling, middleware         |
| Database  | PostgreSQL          | v14+    | Relational data storage                   |
| ORM       | Prisma              | v7.2.0  | Type-safe database queries                |
| Container | Docker + Compose    | -       | Containerization and orchestration        |
| Auth      | JWT                 | -       | Stateless authentication                  |
| Storage   | Cloudinary          | -       | Video/image CDN                           |
| Security  | Helmet + Rate Limit | -       | HTTP headers, brute force prevention      |

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

**Attack Surface Reduction:**

```
AWS Security Group Rules:
- Port 3000 (API) blocked from public internet
- Ports 80/443 open for HTTPS traffic
- Port 22 SSH restricted (admin access only)
- All traffic routed through Nginx reverse proxy
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

### Optimization Strategies

**Database:**

- Strategic indexes on `userId`, `videoId`, `createdAt`
- Unique constraints on likes (prevent duplicate queries)
- Pagination (default 10 items/page)
- Prisma connection pooling (containerized PostgreSQL)

**Media Delivery:**

- Cloudinary `f_auto` transformation (WebP/MP4 based on browser)
- Global CDN (200+ edge locations)
- Video streaming (no full file download)

**Application:**

- Docker container orchestration (automatic restarts on crashes)
- Nginx reverse proxy with request buffering
- Gzip compression (text responses)

---

## Deployment Architecture

### Production Environment

**Server Configuration:**

```yaml
Instance: AWS EC2 t3.micro
OS: Ubuntu 24.04 LTS
RAM: 1GB
CPU: 2 vCPU
Containerization: Docker + Docker Compose
Web Server: Nginx (reverse proxy, ports 80/443 → Docker)
```

**Docker Compose Stack:**

```yaml
Services:
  - viztube-api: Node.js API container (port 3000)
  - postgres: PostgreSQL 14+ container (port 5432)
  - volumes: Persistent data storage for PostgreSQL
```

**Database Configuration:**

- Self-hosted PostgreSQL in Docker container
- Persistent Docker volumes for data storage
- SSL/TLS connection enforced

---

## 🚀 Deployment & DevOps

**Production:** Hosted on AWS EC2 (t3.micro - 1GB RAM) with Nginx reverse proxy.

**CI/CD:** Automated pipeline via GitHub Actions. Pushes to main trigger a Docker build and automated deployment (brief downtime during container restart).

**Containerization:** Fully Dockerized application (Node.js API + PostgreSQL) running in isolated containers.

**Database:** Self-hosted PostgreSQL with persistent Docker volumes.

**Security:** SSL/TLS encryption via Certbot & Nginx. Attack surface reduced by blocking direct API port access.

---

## Getting Started

### Prerequisites

```bash
Node.js v18+
PostgreSQL v14+
Cloudinary account
```

### Local Development Setup

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
```

### CI/CD Pipeline

This project uses **GitHub Actions** for automated deployment. On every push to the `main` branch, the workflow:

1. Builds Docker image in GitHub Actions runner
2. Pushes image to Docker Hub registry
3. SSHs into the AWS EC2 instance
4. Pulls the pre-built Docker image from Docker Hub
5. Stops running containers (`docker compose down`)
6. Starts updated containers with new image (`docker compose up -d`)
7. Runs database migrations (if any)

**Deployment Characteristics:**

- Brief downtime (few seconds) during container restart
- Automated on push to `main` branch
- Manual workflow dispatch available for on-demand deployment

**Secrets Management:**

- SSH private keys, database URLs, and API credentials are stored in GitHub Actions Secrets
- No sensitive data committed to the repository

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
├── docker-compose.yml          # Docker orchestration
├── Dockerfile                  # Container image definition
└── .env.sample                 # Environment template
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

- Real-time notifications (WebSockets)
- Full-text search (PostgreSQL `tsvector` + GIN indexes)
- Redis caching layer (sessions, user profiles)
- Video transcoding pipeline (HLS adaptive streaming)
- Live streaming (RTMP → HLS)
- Content moderation tools

---

## Technical Decisions & Trade-offs

### Why PostgreSQL over MongoDB?

- **Relational Integrity:** Subscriptions, playlists require complex joins
- **ACID Compliance:** Critical for like counts, view tracking
- **Prisma ORM:** Type-safe queries, migration management

### Why Docker Containers?

- **Isolation:** Services run in isolated environments with resource limits
- **Portability:** Same container runs locally and in production
- **Easy Rollback:** Previous image versions available for instant rollback
- **Simplified Deployment:** Docker Compose orchestrates multi-container setup

### Why Certbot/Let's Encrypt SSL?

- **Free SSL/TLS:** Automated certificate issuance and renewal
- **End-to-End Encryption:** Full HTTPS from client to container
- **Industry Standard:** Trusted by all major browsers

### Why Server-Side Cloudinary Integration?

- **Simplified Client:** Browser doesn't need Cloudinary credentials
- **Validation Control:** Server validates files before CDN upload
- **Temporary Storage:** Multer disk storage (`public/temp`) handles multipart uploads
- **Trade-off:** Brief disk usage during upload process (files deleted post-processing)

---

## Monitoring & Observability

### Monitoring

- **Docker Stats:** Real-time container resource metrics (CPU, memory, network).
- **AWS CloudWatch:** Automated CPU & Network I/O tracking.
- **Health Check:** `/healthcheck` endpoint for uptime verification.

### Key Metrics Tracked

- Docker container health (CPU, memory, restart count)
- AWS CloudWatch infrastructure metrics (network I/O, disk usage)
- Application logs (Docker logs for API and PostgreSQL)
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

ISC [License](./LICENSE)

---

## Author

**Nishant Sharma**  
GitHub: [@Nishant-444](https://github.com/Nishant-444)  
Repository: [VizTube](https://github.com/Nishant-444/Viztube)

---

## Other Documentation

- **[PRD](./docs/PRD.md)** - Product requirements, system architecture, feature specifications
- **[Postman Collection](./docs/viztube.postman_collection.json)** - API testing collection

---
