# VizTube - Production Video Platform Backend

[![Deploy Docker to EC2](https://github.com/Nishant-444/VizTube/actions/workflows/deploy.yml/badge.svg)](https://github.com/Nishant-444/VizTube/actions/workflows/deploy.yml)

**Version:** 2.1.0  
**Status:** Live Deployment (MVP)  
**Live API Endpoint:** [https://viztube.me](https://viztube.me)  
**Tech Stack:** TypeScript, Node.js, Express, PostgreSQL, pgvector, Prisma, Docker, AWS, FastAPI, Groq API, OpenRouter API

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![pgvector](https://img.shields.io/badge/pgvector-Vector_DB-blue?style=for-the-badge)

---

## Project Overview

VizTube is a resource-optimized production MVP backend for a video-sharing platform, deployed on AWS with a containerized architecture. The system features secure JWT authentication, Cloudinary CDN integration, a fully normalized PostgreSQL database managed through Prisma ORM, and an AI-powered RAG engine for intelligent video content querying.

### AI-Powered RAG Engine (New in v2.1)

VizTube features an intelligent RAG (Retrieval-Augmented Generation) pipeline, allowing users to query video content directly.

- **Fast Cloud Transcription:** Video audio is streamed to the Groq API for lightning-fast transcription using `whisper-large-v3`, avoiding local CPU overload on small VM instances.
- **Vector Search with pgvector:** Transcripts are split into overlapping chunks, converted to vector embeddings locally using the lightweight Hugging Face `all-MiniLM-L6-v2` model, and stored in our PostgreSQL database using `pgvector` (minimizing memory overhead by not running a separate ChromaDB container).
- **Contextual QA:** Users can ask natural language questions about video content, with the AI retrieving relevant segments using Postgres vector search and generating precise answers using GPT-based LLMs via the OpenRouter API.

**Live Infrastructure:**

- **Compute:** AWS EC2 (t3.micro - 1GB RAM, 2 vCPU)
- **Database:** PostgreSQL with `pgvector` extension via `DATABASE_URL` (local Docker PostgreSQL for development)
- **CDN:** Cloudinary (100MB video limit)
- **Containerization:** Docker Compose (Node.js API + PostgreSQL + FastAPI AI Worker)
- **Security:** Cloudflare DNS/SSL + Certbot/Nginx SSL
- **Process Manager:** Docker containers

---

## System Architecture

```
Client → Cloudflare (SSL/DNS) → Nginx (SSL/TLS) → Docker Containers (API + PostgreSQL + AI Worker) → Cloudinary
```

**Request Flow:**

1. HTTPS request hits Cloudflare edge network
2. DNS resolves, SSL terminated at Cloudflare
3. Traffic proxied to AWS EC2 via Nginx reverse proxy
4. Nginx reverse proxy with SSL/TLS (Certbot) forwards traffic to the API container
5. Dockerized Node.js API handles request
6. Express routes to controller → Prisma ORM → PostgreSQL (Docker container)
7. Media uploads processed via Multer (disk storage to `public/temp`), then asynchronously uploaded to Cloudinary

**AI Processing Flow:**

1. **Ingestion:** Video uploaded to Node.js API → Triggers background task calling Python AI worker → Streams audio to Groq API (Whisper) → Transcribes → Chunks transcript → Generates embeddings locally via Hugging Face `all-MiniLM-L6-v2` → Inserts directly into Postgres (`pgvector`).
2. **Querying:** User queries Node.js API `POST /api/v2/rag/query` → Node.js queries Python AI worker → Converts question to embedding vector → Similarity search in Postgres database using `pgvector` operator (`<=>`) → Retrieves top 5 matching chunks → Prompt sent to GPT LLM via OpenRouter API → Returns answer with citation sources.

**Key Infrastructure Decisions (Optimized for 1GB RAM EC2):**

- **Groq API Cloud Transcription:** Offloads heavy audio processing and memory footprint of local Whisper models to cloud infrastructure.
- **pgvector Vector Database:** Stores embeddings inside the existing PostgreSQL container. This avoids running a separate database container like ChromaDB, saving hundreds of megabytes of RAM.
- **Lightweight Embedding Model:** Uses Hugging Face's `all-MiniLM-L6-v2` (only ~90MB) for local CPU embeddings, fitting safely within Docker memory limits.
- **Docker Containers:** Isolated services (Node.js, PostgreSQL, FastAPI AI Worker) with strict resource limits and automated health checks.
- **PostgreSQL + Prisma:** Environment-based database connectivity with type-safe data access and raw query mapping for vector distance.
- **Certbot SSL/TLS:** Free SSL certificates with auto-renewal.
- **Asynchronous Media Processing:** Server-side Cloudinary integration via Multer disk storage.
- **Automated Docker Deployment:** GitHub Actions CI/CD with container rebuilds.
- **FastAPI AI Worker:** Decoupled Python microservice for RAG pipeline, independently scalable.

---

## Core Technology Stack

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.1-000000?style=flat-square&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![pgvector](https://img.shields.io/badge/pgvector-Vector_DB-blue?style=flat-square)
![Prisma](https://img.shields.io/badge/Prisma-7.2-2D3748?style=flat-square&logo=prisma&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-EC2-232F3E?style=flat-square&logo=amazonaws&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-CDN-3448C5?style=flat-square&logo=cloudinary&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)

| Layer         | Technology                  | Version  | Purpose                                   |
| ------------- | --------------------------- | -------- | ----------------------------------------- |
| Runtime       | Node.js                     | v18+     | Server execution environment              |
| Language      | TypeScript                  | v5.9.3   | Type safety, compile-time error detection |
| Framework     | Express.js                  | v5.1.0   | HTTP request handling, middleware         |
| Database      | PostgreSQL                  | v14+     | Relational data storage                   |
| Vector DB     | pgvector (PostgreSQL ext)   | v0.4.2   | Vector embedding storage and search       |
| ORM           | Prisma                      | v7.2.0   | Database client, migrations, raw SQL      |
| Container     | Docker + Compose            | -        | Containerization and orchestration        |
| Auth          | JWT                         | -        | Stateless authentication                  |
| Storage       | Cloudinary                  | -        | Video/image CDN                           |
| Security      | CORS + HTTP-only Cookies    | -        | Origin control and token protection       |
| AI Worker     | FastAPI (Python)            | v0.115   | Decoupled API for ML pipeline             |
| Transcription | Groq API (Whisper-large-v3) | Latest   | Serverless audio-to-text extraction       |
| Embeddings    | Hugging Face (all-MiniLM-L6-v2) | v3.4.1   | Local text-to-vector embedding model      |
| LLM           | OpenRouter (GPT-based LLM)  | Latest   | Text generation from retrieved context    |

---

## AI / RAG Architecture (v2.1)

AI processing is split between internal worker endpoints and the public Express API:

### 1. Internal Worker Ingestion Route (`POST /api/rag/ingest` on Python AI Worker)
This is an internal API called by the main Express app asynchronously on video upload.
- **Input:** `video_id` (form field), `file` (multipart audio/video file)
- **Logic:** Streams the audio file to Groq's API for transcription via Whisper-large-v3. Chunks the returned transcript (size 1000, overlap 200). Generates vector embeddings locally using the Sentence-Transformers `all-MiniLM-L6-v2` model and inserts them directly into the `DocumentChunk` table in Postgres using the `pgvector` library.
- **Clean up:** Automatically deletes local temp video/audio files post-processing.

### 2. Public Query Route (`POST /api/v2/rag/query` on Express API)
This is the client-facing endpoint.
- **Input:** `video_id` (string), `question` (string)
- **Logic:** Checks the DB if the video has a transcript and Q&A is enabled. If verified, proxies the request to the Python AI Worker (`POST /api/rag/ask`).
- **Python Ask Route (`POST /api/rag/ask`):** Converts the user's question into an embedding vector, performs a Cosine Distance vector search against Postgres (`ORDER BY embedding <=> :vector`), retrieves the top 5 chunks, formats a context-aware prompt, calls the LLM via OpenRouter, and returns the response.
- **Output:** JSON object containing `answer` (string) and `sources` (array of matching text segments).

---

## Database Schema

The database follows **Third Normal Form (3NF)** with strategic indexing and cascading deletes.

### Database Schema (UUID v7 Primary Keys)

All primary keys use **UUID v7** (time-ordered, lexicographically sortable unique strings) to ensure database index efficiency and clustering performance in PostgreSQL (preventing B-tree fragmentation common with random UUID v4 keys).

#### Core Tables (Prisma Model Map)

**Users**
- `id` (String UUIDv7, Primary Key)
- `username` (String, Unique, Indexed)
- `email` (String, Unique, Indexed)
- `fullname` (String)
- `password` (String, bcrypt hashed)
- `avatar` (String, Cloudinary URL)
- `coverImage` (String, Cloudinary URL)
- `refreshToken` (String, Nullable)

**Videos**
- `id` (String UUIDv7, Primary Key)
- `userId` (String UUIDv7, Foreign Key → Users.id)
- `videoFileUrl` (String, Cloudinary URL)
- `videoFilePublicId` (String, for CDN deletion)
- `thumbnailUrl` (String, Cloudinary URL)
- `thumbnailPublicId` (String, for CDN deletion)
- `title` (String)
- `description` (String, Nullable)
- `duration` (Float, auto-extracted)
- `views` (Int, default 0)
- `isPublished` (Boolean, default true)
- `processingStatus` (ProcessingStatus: PROCESSING/COMPLETED/FAILED)
- `hasTranscript` (Boolean, default false)
- `allowPublicQnA` (Boolean, default false)

**DocumentChunks (for pgvector Search)**
- `id` (String UUIDv7, Primary Key)
- `videoId` (String UUIDv7, Foreign Key → Videos.id)
- `content` (Text, transcript segment)
- `embedding` (vector(384) dimension, Unsupported vector type mapped via pgvector)

**Likes (Polymorphic)**
- `id` (String UUIDv7, Primary Key)
- `userId` (String UUIDv7, Foreign Key → Users.id)
- `videoId` (String, Nullable, Foreign Key → Videos.id)
- `commentId` (String, Nullable, Foreign Key → Comments.id)
- `tweetId` (String, Nullable, Foreign Key → Tweets.id)
- Unique constraints: `[userId, videoId]`, `[userId, commentId]`, `[userId, tweetId]`

**Subscriptions (Self-Referencing Many-to-Many)**
- `id` (String UUIDv7, Primary Key)
- `subscriberId` (String UUIDv7, Foreign Key → Users.id)
- `channelId` (String UUIDv7, Foreign Key → Users.id)
- Unique constraint: `[subscriberId, channelId]`

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

**3. AI / RAG (1 public endpoint)**

```
POST   /api/v2/rag/query        - Query video content via natural language (proxies to AI worker ask route)
```

**4. Social Interactions (11 endpoints)**

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

**5. Content Organization (7 endpoints)**

```
POST   /playlist                - Create playlist
GET    /playlist/user/:userId   - List user playlists
GET    /playlist/:playgroundId    - Get playlist with videos
PATCH  /playlist/:playlistId    - Update name/description (owner only)
DELETE /playlist/:playlistId    - Delete playlist (owner only)
POST   /playlist/:playlistId/:videoId - Add video to playlist
DELETE /playlist/:playlistId/:videoId - Remove video from playlist
```

**6. Community Posts (4 endpoints)**

```
POST   /tweets                  - Create post
GET    /tweets/user/:userId     - Get user posts
PATCH  /tweets/:tweetId         - Edit post (owner only)
DELETE /tweets/:tweetId         - Delete post (owner only)
```

**7. Analytics (2 endpoints)**

```
GET    /dashboard/stats         - Channel statistics (videos, views, subscribers, likes)
GET    /dashboard/videos        - User's uploaded videos with metrics
```

**8. Health Check (1 endpoint)**

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
Request → CORS (configured origin + credentials)
    → JSON Body Parser / URL-Encoded Parser
    → Static File Middleware (`public`)
    → Cookie Parser
    → Route-level JWT Verification
    → Route Handler
    → Error Handler
```

### Network Security

**Attack Surface Reduction:**

```
AWS Security Group Rules:
- Ports 80/443 open for HTTPS traffic
- Port 22 SSH restricted (admin access only)
- API traffic routed through Nginx reverse proxy
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
  - api: Node.js API container (production)
  - db: PostgreSQL container (local development via docker-compose.dev.yml)
  - ai-worker: FastAPI Python container (RAG pipeline)
```

**Database Configuration:**

- PostgreSQL connection configured via `DATABASE_URL`
- Local development PostgreSQL available via `docker-compose.dev.yml`
- Prisma used for schema migrations and query access

---

## Deployment & DevOps

**Production:** Hosted on AWS EC2 (t3.micro - 1GB RAM) with Nginx reverse proxy.

**CI/CD:** Automated pipeline via GitHub Actions. Pushes to main trigger a Docker build and automated deployment (brief downtime during container restart).

**Containerization:** Fully Dockerized application (Node.js API + PostgreSQL + FastAPI AI Worker) running in isolated containers.

**Database:** PostgreSQL connected through `DATABASE_URL` (Dockerized locally in development).

**Security:** SSL/TLS encryption via Certbot & Nginx with reverse-proxy based traffic control.

---

## Getting Started

### Prerequisites

```bash
Node.js v18+
PostgreSQL v14+
Python 3.10+
Cloudinary account
OpenRouter API key
```

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/Nishant-444/VizTube.git
cd VizTube

# Install dependencies
npm install

# Configure environment
cp .env.sample .env
# Edit .env with your credentials

# Setup database
npx prisma generate
npx prisma migrate dev

# Optional: run local PostgreSQL via Docker
docker compose -f docker-compose.dev.yml up -d

# Build TypeScript
npm run build

# Start development server
npm run dev

# Start AI worker (separate terminal)
cd ai-worker
pip install -r requirements.txt
uvicorn main:app --reload
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

#### Node.js Express App Environment (`.env` in root)
```env
PORT=3000
CORS_ORIGIN=*
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/viztube?schema=public

# JWT
ACCESS_TOKEN_SECRET=<64-char-random-string>
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=<64-char-random-string>
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# AI Worker
AI_WORKER_URL=http://localhost:8000
MAX_TRANSCRIPT_DURATION=120
OPENROUTER_API_KEY=<openrouter-api-key>
GROQ_API_KEY=<groq-api-key>
```

#### Python AI Worker Environment (`.env` in `ai-worker/`)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/viztube?schema=public
OPENROUTER_API_KEY=<openrouter-api-key>
GROQ_API_KEY=<groq-api-key>
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

# RAG query (Public Route)
curl -X POST http://localhost:3000/api/v2/rag/query \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{"video_id": "your-video-uuid-here", "question": "What is discussed at the 5 minute mark?"}'

# RAG ingest (Internal Route to Python AI Worker - triggered automatically by Node.js, not by client)
curl -X POST http://localhost:8000/api/rag/ingest \
  -F "video_id=your-video-uuid-here" \
  -F "file=@audio.mp4"
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
├── ai-worker/                  # FastAPI Python microservice
│   ├── main.py                 # FastAPI app entry point
│   ├── transcriber.py          # Whisper integration (via Groq API)
│   ├── rag.py                  # RAG query and chunking pipeline (via pgvector)
│   └── requirements.txt        # Python dependencies
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
6. **RAG Latency:** Local embedding generation on CPU (`all-MiniLM-L6-v2`) runs synchronously during ingestion; while offloaded to a background task in Node.js, it still consumes CPU capacity on the single `t3.micro` instance during processing.

### Planned Enhancements (v3.0)

- Real-time notifications (WebSockets)
- Full-text search (PostgreSQL `tsvector` + GIN indexes)
- Redis caching layer (sessions, user profiles)
- Video transcoding pipeline (HLS adaptive streaming)
- Live streaming (RTMP → HLS)
- Content moderation tools
- Async RAG ingestion queue (Celery + Redis)
- Multi-video RAG search across a user's entire library

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

### Why FastAPI for the AI Worker?

- **Python Ecosystem:** Machine learning libraries (Hugging Face sentence-transformers, PyTorch) are Python-native.
- **Async Support:** FastAPI handles concurrent requests efficiently and interfaces smoothly with Python ML libraries.
- **Decoupled Architecture:** The AI worker is decoupled from the Node.js API, preventing heavy mathematical embedding computation from blocking Express's single-threaded event loop.

### Why pgvector over ChromaDB/Pinecone?

- **Zero Memory Overhead:** Runs inside our existing PostgreSQL database instance. We do not need to boot a separate ChromaDB container, saving several hundred MBs of RAM on our resource-constrained 1GB server.
- **Data Integrity & Relational Queries:** Embeddings are stored as standard table columns with foreign key relations linking to the `Video` table (`onDelete: Cascade`). This keeps our database simple, unified, and compliant with 3NF.
- **No Third-Party SaaS Cost:** Unlike Pinecone or Weaviate Cloud, pgvector is free, self-hosted, and runs entirely on our own database instance.

### Why Groq API (Whisper Cloud) over Local Whisper?

- **CPU and Memory Limits:** Running a speech-to-text model like Whisper locally requires substantial RAM (500MB+) and heavy CPU/GPU processing. On an AWS `t3.micro` (1GB RAM), it would instantly crash the server due to Out-of-Memory (OOM) errors.
- **Speed:** Groq's hosted LPU engine processes audio transcriptions in seconds using `whisper-large-v3`, which is much faster than running a local CPU-based Whisper instance.
- **Trade-off:** Introduces a cloud dependency and requires a Groq API key, but is the only viable production solution for low-tier virtual machines.

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
