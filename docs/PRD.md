# Product Requirements Document: VizTube

**Version:** 2.1.0  
**Author:** Nishant Sharma  
**Status:** Production (v2.1)  
**Live API Endpoint:** [https://viztube.me](https://viztube.me)

---

## 1. Executive Summary

VizTube is a backend video-sharing infrastructure designed for scalability and data integrity. It provides a complete API for video hosting, user authentication, and social interactions. The system is currently deployed on AWS EC2 with a fully containerized Docker architecture and serves live traffic.

## 2. System Architecture

The application uses a layered architecture to separate routing, business logic, and data access.

### Infrastructure Stack

- **Compute:** AWS EC2 (`t3.micro` instance running Ubuntu Linux).
- **Containerization:** Docker + Docker Compose orchestrating multi-container deployment.
- **Process Management:** Docker containers with automatic restart policies.
- **Reverse Proxy:** Nginx handling port forwarding (80/443) and SSL/TLS termination via Certbot.
- **DNS & Security:** Cloudflare acting as the edge network for DNS and DDoS protection.

### Database & Storage

- **Database:** Self-hosted PostgreSQL (v14+) running in a Docker container, using **pgvector** for vector embeddings.
- **ORM:** Prisma (v7.2.0) for type-safe relational and raw vector queries.
- **Media:** Cloudinary for CDN video and image storage.
- **AI Worker Stack:** FastAPI (Python) service running in a separate Docker container for chunking, embedding, and querying.
- **AI Cloud Services:** Groq (hosted Whisper-large-v3 for fast audio transcription) and OpenRouter (GPT-based LLM for Q&A generation).
- **Container Registry:** Docker Hub for pre-built application images.

## 3. Core Features

### 3.1 Authentication

- **Registration:** Users can create accounts with avatars and cover images.
- **Login:** Secure login using email or username.
- **Security:** Implements a dual-token strategy. Access tokens (15m expiry) and Refresh tokens (7-day expiry) are stored in HTTP-Only cookies to prevent XSS.

### 3.2 Video Management

- **Upload:** Support for video files (up to 100MB) and thumbnails (up to 10MB).
- **Metadata:** Automatic extraction of duration and generation of secure streaming URLs.
- **Visibility:** Toggle publish status for videos.
- **Views:** View counters increment automatically upon retrieval.

### 3.3 Social Interactions

- **Likes:** Polymorphic like system supporting videos, comments, and tweets.
- **Comments:** Users can comment on videos; owners can delete comments.
- **Subscriptions:** Users can subscribe to channels.
- **Playlists:** Create, update, and manage video playlists.

### 3.4 Dashboard

- **Analytics:** Aggregated statistics for total channel views, subscribers, and video counts.
- **History:** Tracks watch history for logged-in users.

### 3.5 AI & RAG (Retrieval-Augmented Generation)

- **Automated Video Ingestion:**
  - Done as a fire-and-forget background task immediately upon a successful video upload.
  - The Node.js server passes the video file to the FastAPI AI worker.
  - The AI worker extracts audio and transcribes it using Groq's cloud-hosted Whisper API (saving memory on our 1GB instance).
  - The transcript is returned to Node.js to be saved in the database.
- **Vector Embeddings:**
  - The AI worker chunks the transcript (1000-character chunks with 200-character overlap).
  - It generates math vector embeddings locally using the lightweight `all-MiniLM-L6-v2` Hugging Face model (loaded via PyTorch CPU).
  - The embeddings are inserted directly into the `DocumentChunk` table in our main PostgreSQL database.
- **Video Q&A:**
  - Authenticated users can ask natural language questions about a specific video via a `POST /api/v2/rag/query` route.
  - The server converts the question into a vector and does a semantic similarity search using pgvector inside Postgres.
  - The top matching chunks are sent to a GPT-based LLM via OpenRouter to generate a contextual answer.

## 4. Technical Constraints & limits

- **Instance Size:** Limited to 2 vCPU / 1GB RAM (AWS t3.micro).
- **Containerization:** Docker resource limits applied per container (Node.js API, PostgreSQL, FastAPI AI worker) to prevent Out-Of-Memory (OOM) crashes.
- **ML Memory Mitigation:** Transcription (Whisper) and Q&A generation (LLM) are offloaded to third-party APIs (Groq and OpenRouter) to keep memory footprint low. Embedding is done locally on the CPU using a lightweight model (`all-MiniLM-L6-v2`).
- **File Limits:**
  - Video: 100 MB max.
  - Image: 10 MB max.
- **Network:** Inbound traffic restricted to Cloudflare IPs only (ports 80/443).
- **Storage:** Docker volumes for persistent PostgreSQL data.

## 5. Database Schema Overview

The database follows Third Normal Form (3NF). All primary keys are UUID v7 (`uuid(7)`) for time-ordered lexicographical uniqueness, avoiding B-Tree fragmentation in Postgres.

- **User:** Stores credentials, profile data, and refresh token hashes.
- **Video:** Stores Cloudinary public IDs and URLs, along with AI status flags (`processingStatus`, `hasTranscript`, `allowPublicQnA`).
- **Subscription:** Many-to-many self-relation on Users.
- **Like:** Sparse columns link to either Video, Comment, or Tweet IDs.
- **Transcript:** Stores full video transcription linked 1:1 to Video.
- **DocumentChunk:** Stores 1000-character overlapping chunks of transcripts with a 384-dimensional vector embedding column (using pgvector extension), linked 1:N to Video with cascade delete.

## 6. Future Enhancements (Roadmap)

The following features are planned for v3.0 to address current limitations:

1.  **Rate Limiting:** Implementation of API throttling to prevent abuse on authentication routes.
2.  **Video Transcoding:** Server-side processing to support adaptive bitrate streaming (HLS).
3.  **Caching:** Integration of Redis (as additional Docker container) to cache heavy database queries (e.g., User Profiles).

---

## 7. DevOps & Infrastructure

### Deployment Strategy

**Automated Push-to-Deploy:**

- Continuous Integration/Continuous Deployment (CI/CD) via GitHub Actions
- Deployment trigger: Push to `main` branch
- Automated Docker deployment with brief downtime during container restart

**Deployment Workflow:**

```
Developer Push → GitHub Actions (Build & Push to Docker Hub) → SSH to EC2 → Pull Pre-built Image → Docker Compose Down → Docker Compose Up → Prisma Migrate
```

**Docker Architecture:**

- **viztube-api container:** Node.js/TypeScript API (port 3000)
- **postgres container:** PostgreSQL database (port 5432, running the pgvector extension)
- **ai-worker container:** FastAPI Python AI service (port 8000)
- **Persistent volumes:** Database data retention across container restarts
- **Health checks:** Automated container health monitoring and restart

### Environment Management

**Secrets Storage:**

- GitHub Actions Secrets for CI/CD credentials (SSH keys, deployment tokens)
- AWS EC2 environment variables for runtime configuration (`.env` file)
- No sensitive data committed to version control

**Configuration Files:**

- `.env` (runtime): Database URLs, JWT secrets, Cloudinary credentials
- `.github/workflows/deploy.yml` (CI/CD): Deployment automation script

**Security Practices:**

- SSH key-based authentication (no password login)
- Secrets rotation on compromise
- Principle of least privilege (EC2 IAM roles, GitHub token scopes)

---
