# Product Requirements Document: VizTube

**Version:** 2.0.0  
**Author:** Nishant Sharma  
**Status:** Production (v2)  
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

- **Database:** Self-hosted PostgreSQL (v14+) running in Docker container with persistent volumes.
- **ORM:** Prisma (v7.2.0) for type-safe database queries.
- **Media:** Cloudinary for video and image storage via server-side upload.
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

## 4. Technical Constraints & limits

- **Instance Size:** Limited to 2 vCPU / 1GB RAM (AWS t3.micro).
- **Containerization:** Docker resource limits applied per container to prevent resource exhaustion.
- **File Limits:**
  - Video: 100 MB max.
  - Image: 10 MB max.
- **Network:** Inbound traffic restricted to Cloudflare IPs only (ports 80/443).
- **Storage:** Docker volumes for persistent PostgreSQL data.

## 5. Database Schema Overview

The database follows Third Normal Form (3NF).

- **User:** Stores credentials, profile data, and refresh token hashes.
- **Video:** Stores Cloudinary public IDs and URLs.
- **Subscription:** Many-to-many self-relation on Users.
- **Like:** Sparse columns link to either Video, Comment, or Tweet IDs.

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
- **postgres container:** PostgreSQL database (port 5432)
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
