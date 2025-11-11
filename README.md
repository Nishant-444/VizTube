# VizTube - Backend Video Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v5.1.0-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v8.19.1-brightgreen.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

VizTube is a complete, high-performance backend service for a video-sharing platform, built with Node.js, Express, and MongoDB. It's designed as a standalone, scalable API that provides all the core functionalities of a modern video application like YouTube.

This project is intended for **developers** to use as a robust foundation for their own video applications or to understand how a complex backend system is built and organized.

**Project Status:** ✅ **Complete & Production Ready**

---

## ✨ Features at a Glance

- **🔐 Secure Authentication:** User registration, login, logout, password management with JWT (access + refresh tokens)
- **🎥 Comprehensive Video Management:** Asynchronous video and thumbnail uploads to Cloudinary, detailed video fetching, updates, and deletion
- **💬 Dynamic Social Interaction:** Users can subscribe to channels, like videos/comments/tweets, add comments, and create short text-based "tweets"
- **📝 Personalized Content Curation:** Full CRUD for user-created video playlists and persistent watch history (read & write)
- **📊 Channel Analytics:** A dashboard for creators to view total video views, subscribers, likes, and a list of their uploaded videos
- **⚠️ Robust Error Handling:** Consistent API error and success responses for easy integration
- **🔄 Pagination Support:** Efficient data loading with mongoose-aggregate-paginate
- **📁 File Upload Validation:** Size and type validation for videos, images, and thumbnails

---

## 🚀 Demo & Usage (API Interaction)

Since VizTube is a backend-only project, you'll interact with it using an API client like Postman or any frontend application.

### Quick Start Flow

1. **User Registration & Login**
   - `POST /api/v1/user/register` - Create account with avatar & cover image
   - `POST /api/v1/user/login` - Authenticate and receive JWT tokens

2. **Video Upload & Publishing**
   - `POST /api/v1/videos` - Upload video with thumbnail to Cloudinary
   - `GET /api/v1/videos` - Browse all published videos with pagination

3. **Social Interactions**
   - `POST /api/v1/subscriptions/c/:channelId` - Subscribe/unsubscribe to channels
   - `POST /api/v1/likes/toggle/v/:videoId` - Like/unlike videos
   - `POST /api/v1/comments/:videoId` - Add comments to videos

4. **Channel Dashboard**
   - `GET /api/v1/dashboard/stats` - View channel statistics
   - `GET /api/v1/dashboard/videos` - Manage uploaded videos

---

## 🛠️ Tech Stack

- **Backend:** Node.js, Express.js v5.1.0
- **Database:** MongoDB v8.19.1 (with Mongoose ODM)
- **File Storage & Processing:** Cloudinary v2.8.0 (for videos and images)
- **Authentication:** JSON Web Tokens (JWT) v9.0.2, Bcrypt v6.0.0 for password hashing
- **File Uploads:** Multer v2.0.2 (with size & type validation)
- **API Testing:** Postman (Complete collection included)
- **Pagination:** mongoose-aggregate-paginate-v2 v1.1.4
- **CORS:** Cross-Origin Resource Sharing enabled
- **Development Tools:** Nodemon, ESLint, Prettier

---

## 📦 Project Structure

The project employs a clear, modular architecture, separating concerns to enhance maintainability and scalability.

### 🗂️ Folder Tree

```
viztube/
├── public/
│   └── temp/                          # Temporary file storage
│
├── src/
│   ├── app.js                         # Express app setup, middleware config, routes mount
│   ├── index.js                       # Server startup and DB connection logic
│   ├── constants.js                   # App-level constants
│   │
│   ├── config/
│   │   ├── cloudinary.js              # Cloudinary setup for uploads
│   │   ├── db.js                      # MongoDB connection configuration
│   │   ├── cookieOptions.js           # Cookie configuration
│   │   └── paginationOptions.js       # Default pagination settings
│   │
│   ├── controllers/
│   │   ├── user.controller.js         # User CRUD, profile, subscriptions
│   │   ├── video.controller.js        # Upload, fetch, edit, delete video
│   │   ├── comment.controller.js      # Add/get/update/delete comments
│   │   ├── like.controller.js         # Toggle likes on videos/comments/tweets
│   │   ├── subscription.controller.js # Subscribe/unsubscribe operations
│   │   ├── playlist.controller.js     # Playlist CRUD operations
│   │   ├── tweet.controller.js        # CRUD operations for tweets
│   │   ├── dashboard.controller.js    # Channel stats and analytics
│   │   └── healthcheck.controller.js  # API health status
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js         # JWT auth verification middleware
│   │   ├── error.middleware.js        # Centralized error handling
│   │   ├── multer.middleware.js       # Multer configuration for file uploads
│   │   └── normalizeParams.middleware.js # Parameter normalization
│   │
│   ├── models/
│   │   ├── user.model.js              # User schema with password hashing
│   │   ├── video.model.js             # Video schema with pagination
│   │   ├── comment.model.js           # Comment schema with pagination
│   │   ├── like.model.js              # Polymorphic like schema
│   │   ├── subscription.model.js      # Channel subscription relationships
│   │   ├── playlist.model.js          # Video playlist schema
│   │   └── tweet.model.js             # Tweet/community post schema
│   │
│   ├── routes/
│   │   ├── user.routes.js             # User & auth endpoints
│   │   ├── video.routes.js            # Video management endpoints
│   │   ├── comment.routes.js          # Comment endpoints
│   │   ├── like.routes.js             # Like/dislike toggle endpoints
│   │   ├── subscription.routes.js     # Subscription endpoints
│   │   ├── playlist.routes.js         # Playlist CRUD endpoints
│   │   ├── tweet.routes.js            # Tweet CRUD endpoints
│   │   ├── dashboard.routes.js        # Creator analytics endpoints
│   │   └── healthcheck.routes.js      # Health check endpoint
│   │
│   ├── utils/
│   │   ├── ApiError.js                # Custom error handler class
│   │   ├── ApiResponse.js             # Unified API response format
│   │   ├── asyncHandler.js            # Async middleware wrapper
│   │   └── cloudinary.js              # Cloudinary upload/delete helpers
│   │
│   └── validators/
│       ├── auth.validators.js         # User input validation (registration, login)
│       └── file.validators.js         # File upload validation
│
├── .env.sample                        # Sample environment variables
├── .gitignore                         # Git ignore rules
├── .prettierrc                        # Prettier configuration
├── .prettierignore                    # Prettier ignore rules
├── package.json                       # Dependencies and scripts
├── package-lock.json                  # Locked dependency versions
├── PRD.md                             # Product Requirements Document
├── POSTMAN_COLLECTION_README.md       # Postman collection guide
├── Viztube.postman_collection.json # Complete API collection
└── README.md                          # This file
```

---

## ⚙️ Setup & Local Installation

### Prerequisites

- Node.js v18 or higher
- MongoDB (local or Atlas)
- Cloudinary account
- Git

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
   Create a `.env` file in the root directory and populate it with your credentials:

   ```env
   # Server Configuration
   PORT=8000
   CORS_ORIGIN=*

   # Database
   MONGODB_URI=mongodb://localhost:27017/viztube
   # OR for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/viztube

   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # JWT Configuration
   ACCESS_TOKEN_SECRET=your_super_secret_jwt_access_key_min_32_chars
   ACCESS_TOKEN_EXPIRY=15m
   REFRESH_TOKEN_SECRET=your_super_secret_jwt_refresh_key_min_32_chars
   REFRESH_TOKEN_EXPIRY=7d
   ```

   > **Note:** See `.env.sample` for a complete template.

4. **Run the server:**

   **Development mode (with auto-restart):**

   ```bash
   npm run dev
   ```

   **Production mode:**

   ```bash
   npm start
   ```

5. **Verify installation:**

   ```bash
   # Test the health check endpoint
   curl http://localhost:8000/api/v1/healthcheck
   ```

   Your API will now be running on `http://localhost:8000/api/v1` 🎉

---

## 🧪 API Documentation

This project is fully documented with a comprehensive Postman Collection and a detailed Product Requirements Document (PRD).

### 📚 Available Documentation

- **[Postman Collection](./Viztube.postman_collection.json)** - 43 fully documented API endpoints
  - Import into Postman for instant testing
  - Includes auto-save scripts for tokens and IDs
  - Pre-configured environments and variables
- **[Postman Collection Guide](./POSTMAN_COLLECTION_README.md)** - Complete usage guide
  - Quick start instructions
  - Common workflows
  - Troubleshooting tips
- **[Product Requirements Document (PRD.md)](./PRD.md)** - Detailed technical specifications
  - Complete feature specifications
  - Data models and schemas
  - API endpoint reference
  - Security features
  - Deployment guidelines

### 🔗 Quick API Reference

| Category             | Endpoints | Description                              |
| -------------------- | --------- | ---------------------------------------- |
| **Health**           | 1         | API status check                         |
| **User Management**  | 9         | Auth, profile, watch history             |
| **Video Management** | 6         | Upload, CRUD, publish toggle             |
| **Comments**         | 4         | CRUD operations                          |
| **Likes**            | 4         | Toggle likes, get liked videos           |
| **Subscriptions**    | 3         | Subscribe, get subscribers/subscriptions |
| **Playlists**        | 7         | Complete playlist management             |
| **Tweets**           | 4         | Community posts CRUD                     |
| **Dashboard**        | 2         | Channel analytics                        |

**Total:** 43 endpoints across 10 categories

---

## 🔑 Key Features Explained

### Authentication System

- **JWT-based authentication** with access and refresh tokens
- **Secure password hashing** using bcrypt (10 salt rounds)
- **Automatic token refresh** mechanism
- **HTTP-only cookies** for enhanced security

### Video Management

- **Cloudinary integration** for scalable video storage
- **Automatic view counting** on video fetch
- **Video publish/unpublish** toggle
- **Owner-based permissions** for edit/delete
- **Thumbnail upload** with videos

### Social Features

- **Channel subscriptions** with subscriber counts
- **Polymorphic likes** (videos, comments, tweets)
- **Nested comments** on videos
- **Tweet/community posts** for user engagement

### Content Organization

- **User playlists** with video collections
- **Watch history** tracking
- **Video search** and filtering
- **Pagination** for large datasets

### Analytics Dashboard

- **Total views** across all videos
- **Subscriber count**
- **Video count** and performance
- **Like count** aggregation

---

## 🚀 Deployment

### Recommended Platforms

- **Backend Hosting:** Render, Railway, Heroku, AWS EC2
- **Database:** MongoDB Atlas (Free tier available)
- **Media Storage:** Cloudinary (Free tier: 25GB)

### Environment Variables for Production

Ensure all environment variables are set in your hosting platform:

- `PORT` (usually auto-assigned)
- `MONGODB_URI` (MongoDB Atlas connection string)
- `CLOUDINARY_*` credentials
- `ACCESS_TOKEN_SECRET` & `REFRESH_TOKEN_SECRET`
- `CORS_ORIGIN` (your frontend domain)

### Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use production MongoDB URI
- [ ] Configure CORS for your frontend domain
- [ ] Set secure JWT secrets (minimum 32 characters)
- [ ] Enable HTTPS in production
- [ ] Set appropriate token expiry times
- [ ] Configure rate limiting (future enhancement)
- [ ] Set up monitoring and logging

---

## 🧪 Testing

### Using Postman

1. Import `Viztube.postman_collection.json`
2. Set `baseUrl` to `http://localhost:8000/api/v1`
3. Start with "Register User" or "Login User"
4. Tokens are automatically saved for subsequent requests

### Manual Testing with cURL

```bash
# Register a new user
curl -X POST http://localhost:8000/api/v1/user/register \
  -F "username=testuser" \
  -F "email=test@example.com" \
  -F "fullname=Test User" \
  -F "password=Test@123"

# Login
curl -X POST http://localhost:8000/api/v1/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@123"}'
```

---

## 📊 Database Schema Overview

### User Model

- Authentication fields (email, username, password)
- Profile data (avatar, cover image, full name)
- Watch history (array of video references)
- Refresh token storage

### Video Model

- Video file & thumbnail URLs (Cloudinary)
- Metadata (title, description, duration)
- View count tracking
- Publish status
- Owner reference

### Like Model (Polymorphic)

- Can reference: Video, Comment, or Tweet
- User reference (likedBy)
- Timestamp tracking

### Subscription Model

- Subscriber (User reference)
- Channel (User reference)
- Many-to-many relationship

---

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ HTTP-only cookies for token storage
- ✅ CORS configuration
- ✅ Input validation and sanitization
- ✅ MongoDB injection prevention (Mongoose)
- ✅ File upload size limits
- ✅ Owner verification for resource modifications

---

## 🛣️ Roadmap & Future Enhancements

- [ ] Real-time notifications with WebSockets
- [ ] Video transcoding pipeline
- [ ] Advanced search with Elasticsearch
- [ ] Content recommendation algorithm
- [ ] Rate limiting and API throttling
- [ ] Comprehensive test suite (Jest/Mocha)
- [ ] API documentation with Swagger/OpenAPI
- [ ] Redis caching layer
- [ ] Live streaming support
- [ ] Multi-language support
- [ ] Video analytics and insights
- [ ] Content moderation system

---

## 🧑‍💻 Contributing

Contributions are welcome! If you'd like to improve the project, please:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request** 🎉

### Contribution Guidelines

- Follow the existing code style (ESLint + Prettier)
- Add comments for complex logic
- Update documentation for new features
- Test your changes thoroughly
- Keep commits atomic and descriptive

---

## 📝 License

This project is licensed under the **ISC License**.

---

## 📞 Contact & Support

**Author:** Nishant Sharma  
**GitHub:** [@Nishant-444](https://github.com/Nishant-444)  
**Project Repository:** [Viztube](https://github.com/Nishant-444/Viztube)

### Get Help

- 📖 Read the [PRD.md](./PRD.md) for detailed documentation
- 📮 [Open an issue](https://github.com/Nishant-444/Viztube/issues) for bug reports
- 💡 [Start a discussion](https://github.com/Nishant-444/Viztube/discussions) for questions

---

## 🙏 Acknowledgments

- Express.js team for the robust framework
- MongoDB team for the powerful database
- Cloudinary for scalable media management
- The Node.js community for excellent packages

---

## ⭐ Show Your Support

If this project helped you, please consider giving it a ⭐ on GitHub!

---

**Made with ❤️ by Nishant Sharma**

_Last Updated: November 10, 2025_
