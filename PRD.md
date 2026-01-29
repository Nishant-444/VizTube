# Product Requirements Document: VizTube

**Version:** 2.0.0  
**Author:** Nishant Sharma  
**Status:** Production (v2)

---

## 1. Executive Summary

VizTube is a backend video-sharing infrastructure designed for scalability and data integrity. It provides a complete API for video hosting, user authentication, and social interactions. The system is currently deployed on AWS and serves live traffic.

## 2. System Architecture

The application uses a layered architecture to separate routing, business logic, and data access.

### Infrastructure Stack

- **Compute:** AWS EC2 (`t3.micro` instance running Ubuntu Linux).
- **Process Management:** PM2 running in `fork` mode (single instance) to optimize for 1GB RAM constraints.
- **Reverse Proxy:** Nginx handling port forwarding and local SSL termination.
- **DNS & Security:** Cloudflare acting as the edge network for DNS, SSL, and DDoS protection.

### Database & Storage

- **Database:** PostgreSQL managed via AWS RDS.
- **ORM:** Prisma (v7.2.0) for type-safe database queries.
- **Media:** Cloudinary for direct-to-cloud video and image storage.

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

- **Instance Size:** Limited to 1 vCPU / 1GB RAM (AWS t3.micro).
- **Concurrency:** Single Node.js process (no clustering) to prevent memory exhaustion.
- **File Limits:**
  - Video: 100 MB max.
  - Image: 10 MB max.
- **Network:** Inbound traffic restricted to Cloudflare IPs only.

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
3.  **Caching:** Integration of Redis to cache heavy database queries (e.g., User Profiles).

---
