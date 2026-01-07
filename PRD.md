# Product Requirements Document (PRD)

## Viztube - Video Sharing Platform Backend

---

## 1. Executive Summary

**Project Name:** Viztube  
**Version:** 1.1.0  
**Document Date:** January 6, 2026  
**Author:** Nishant Sharma  
**Status:** ✅ Complete & Production Ready

### 1.1 Product Overview

Viztube is a comprehensive backend system for a video-sharing platform inspired by YouTube. It provides a robust RESTful API for managing users, videos, comments, subscriptions, playlists, and social interactions similar to modern video-sharing platforms.

### 1.2 Product Vision

To create a scalable, secure, and feature-rich backend infrastructure that powers a complete video-sharing ecosystem with user authentication, video management, social interactions, and content discovery capabilities.

---

## 2. Objectives & Goals

### 2.1 Primary Objectives

- Build a production-ready video-sharing platform backend
- Implement secure user authentication and authorization
- Enable seamless video upload, storage, and streaming
- Facilitate social interactions (likes, comments, subscriptions)
- Provide robust content management and organization
- Support scalable media storage using cloud services

### 2.2 Success Metrics

- API response time < 200ms for standard operations
- Support for concurrent video uploads
- Secure JWT-based authentication with refresh token mechanism
- 99.9% uptime reliability
- Efficient pagination for large datasets

---

## 3. Technical Architecture

### 3.1 Technology Stack

#### Backend Framework

- **Runtime:** Node.js v18+ (ES Modules)
- **Framework:** Express.js v5.1.0
- **Language:** TypeScript v5.9.3 (migrated from JavaScript for enhanced type safety)

#### Database

- **Primary Database:** MongoDB v8.19.1
- **ODM:** Mongoose with aggregate pagination support

#### Authentication & Security

- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** Bcrypt v6.0.0
- **Token Types:**
  - Access Token (short-lived)
  - Refresh Token (long-lived)

#### File Storage & Processing

- **Cloud Storage:** Cloudinary v2.8.0
- **File Upload:** Multer v2.0.2
- **Media Types:** Videos, Images (avatars, thumbnails, cover images)

#### Additional Libraries

- **CORS:** Cross-Origin Resource Sharing enabled
- **Cookie Parser:** Secure cookie management
- **Dotenv:** Environment variable management
- **TypeScript Development Tools:** tsx, ts-node, ts-node-dev for development workflow
- **Code Quality:** ESLint, Prettier for consistent code formatting

### 3.2 System Architecture

```
Client Application
       ↓
   API Gateway
       ↓
Express.js Middleware Layer
   ├── Authentication (JWT Verification)
   ├── File Upload (Multer)
   ├── Validation (Input Validators)
   ├── Parameter Normalization (Username sanitization)
   └── Error Handling
       ↓
Controller Layer
   ├── User Controller
   ├── Video Controller
   ├── Comment Controller
   ├── Subscription Controller
   ├── Playlist Controller
   ├── Tweet Controller
   ├── Like Controller
   └── Dashboard Controller
       ↓
Model Layer (MongoDB/Mongoose)
   ├── User Model
   ├── Video Model
   ├── Comment Model
   ├── Subscription Model
   ├── Playlist Model
   ├── Tweet Model
   └── Like Model
       ↓
External Services
   ├── MongoDB Database
   └── Cloudinary (Media Storage)
```

---

## 4. Data Models & Schema

### 4.1 User Model

```javascript
{
  username: String (unique, indexed, lowercase, min: 3 chars),
  email: String (unique, indexed, validated),
  fullname: String (required),
  avatar: String (Cloudinary URL, default provided),
  coverImage: String (Cloudinary URL, default provided),
  watchHistory: [ObjectId] (references Video),
  password: String (hashed with bcrypt),
  refreshToken: String,
  timestamps: { createdAt, updatedAt }
}
```

**Features:**

- Password hashing before save
- JWT access token generation
- JWT refresh token generation
- Password comparison method

### 4.2 Video Model

```javascript
{
  videoFile: {
    url: String (Cloudinary URL),
    public_id: String (Cloudinary ID)
  },
  thumbnail: {
    url: String (Cloudinary URL),
    public_id: String (Cloudinary ID)
  },
  title: String (required),
  description: String (optional),
  views: Number (default: 0),
  duration: Number (required, in seconds),
  isPublished: Boolean (default: true),
  owner: ObjectId (references User),
  timestamps: { createdAt, updatedAt }
}
```

**Features:**

- Aggregate pagination support
- View count tracking
- Publish/unpublish toggle

### 4.3 Comment Model

```javascript
{
  content: String (required),
  owner: ObjectId (references User),
  video: ObjectId (references Video),
  timestamps: { createdAt, updatedAt }
}
```

**Features:**

- Aggregate pagination for comment threads
- User and video relationship tracking

### 4.4 Subscription Model

```javascript
{
  subscriber: ObjectId (references User - the one subscribing),
  channel: ObjectId (references User - the channel being subscribed to),
  timestamps: { createdAt, updatedAt }
}
```

**Features:**

- Many-to-many relationship between users
- Subscription status tracking

### 4.5 Playlist Model

```javascript
{
  name: String (required),
  description: String (required),
  owner: ObjectId (references User),
  videos: [ObjectId] (references Video),
  timestamps: { createdAt, updatedAt }
}
```

**Features:**

- Video collection management
- User-owned playlists

### 4.6 Tweet Model

```javascript
{
  content: String (required),
  owner: ObjectId (references User),
  timestamps: { createdAt, updatedAt }
}
```

**Features:**

- Community post/status updates
- Aggregate pagination support

### 4.7 Like Model

```javascript
{
  comment: ObjectId (references Comment),
  video: ObjectId (references Video),
  tweet: ObjectId (references Tweet),
  likedBy: ObjectId (references User),
  timestamps: { createdAt, updatedAt }
}
```

**Features:**

- Polymorphic likes (videos, comments, tweets)
- User engagement tracking

---

## 5. API Endpoints & Features

### 5.1 Base URL

```
/api/v1
```

### 5.2 Authentication & User Management

#### Public Endpoints (No Authentication Required)

**POST /user/register**

- Register new user account
- Required fields: username, email, fullname, password
- Optional: avatar, coverImage (multipart/form-data)
- Validations:
  - Username min 3 characters, no spaces
  - Valid email format
  - Password strength requirements
- Response: User details + access token + refresh token

**POST /user/login**

- User authentication
- Required: email/username, password
- Response: User details + access token + refresh token (in cookies)

**POST /user/refresh-token**

- Obtain new access token using refresh token
- Required: Refresh token (from cookie or body)
- Response: New access token + refresh token

#### Protected Endpoints (JWT Required)

**POST /user/logout**

- Logout user and invalidate refresh token
- Clears authentication cookies

**POST /user/change-password**

- Change user password
- Required: oldPassword, newPassword
- Validates old password before update

**GET /user/current-user-details**

- Get authenticated user's complete profile

**GET /user/c/:username**

- Get user channel profile by username
- Returns: User info, subscriber count, subscription status

**PATCH /user/update-account**

- Update user account details
- Allowed fields: fullname, email

**PATCH /user/update-avatar**

- Update user avatar image
- Required: avatar (multipart/form-data)
- Uploads to Cloudinary

**PATCH /user/update-cover-image**

- Update user cover image
- Required: coverImage (multipart/form-data)
- Uploads to Cloudinary

**GET /user/watch-history**

- Get user's video watch history
- Returns paginated list of watched videos

### 5.3 Video Management

**GET /videos**

- Get all videos (with pagination)
- Query params: page, limit, sortBy, sortType
- Returns: Paginated video list

**POST /videos**

- Upload new video
- Required: videoFile, thumbnail, title, duration (multipart/form-data)
- Optional: description
- Uploads video and thumbnail to Cloudinary

**GET /videos/:videoId**

- Get video by ID
- Returns: Complete video details with owner info
- Increments view count

**DELETE /videos/:videoId**

- Delete video
- Requires: Video ownership verification
- Removes video from Cloudinary

**PATCH /videos/:videoId**

- Update video details
- Allowed: title, description, thumbnail
- Requires: Video ownership verification

**PATCH /videos/toggle/publish/:videoId**

- Toggle video publish status
- Switches between published/unpublished

### 5.4 Comment System

**GET /comments/:videoId**

- Get all comments for a video
- Supports pagination
- Returns: Comments with user details

**POST /comments/:videoId**

- Add comment to video
- Required: content (text)

**DELETE /comments/c/:commentId**

- Delete comment
- Requires: Comment ownership verification

**PATCH /comments/c/:commentId**

- Update comment content
- Requires: Comment ownership verification

### 5.5 Subscription System

**POST /subscriptions/c/:channelId**

- Toggle subscription to a channel
- Subscribe if not subscribed, unsubscribe if already subscribed

**GET /subscriptions/c/:channelId**

- Get all subscribers of a channel
- Returns: Subscriber list with details

**GET /subscriptions/u/:subscriberId**

- Get all channels a user is subscribed to
- Returns: Subscribed channel list

### 5.6 Playlist Management

**POST /playlist**

- Create new playlist
- Required: name, description

**GET /playlist/user/:userId**

- Get all playlists created by a user

**GET /playlist/:playlistId**

- Get playlist by ID with all videos

**PATCH /playlist/:playlistId**

- Update playlist details
- Allowed: name, description
- Requires: Playlist ownership

**DELETE /playlist/:playlistId**

- Delete playlist
- Requires: Playlist ownership

**PATCH /playlist/add/:videoId/:playlistId**

- Add video to playlist
- Requires: Playlist ownership

**PATCH /playlist/remove/:videoId/:playlistId**

- Remove video from playlist
- Requires: Playlist ownership

### 5.7 Tweet/Community Posts

**POST /tweets**

- Create new tweet
- Required: content

**GET /tweets/user/:userId**

- Get all tweets by a user
- Supports pagination

**PATCH /tweets/:tweetId**

- Update tweet content
- Requires: Tweet ownership

**DELETE /tweets/:tweetId**

- Delete tweet
- Requires: Tweet ownership

### 5.8 Like System

**POST /likes/toggle/v/:videoId**

- Toggle like on video

**POST /likes/toggle/c/:commentId**

- Toggle like on comment

**POST /likes/toggle/t/:tweetId**

- Toggle like on tweet

**GET /likes/videos**

- Get all liked videos by current user

### 5.9 Dashboard & Analytics

**GET /dashboard/stats**

- Get channel statistics
- Returns: Total views, subscribers, videos, likes

**GET /dashboard/videos**

- Get all videos uploaded by current user
- Includes statistics for each video

### 5.10 Health Check

**GET /healthcheck**

- API health check endpoint
- Returns: Service status

---

## 6. Security Features

### 6.1 Authentication & Authorization

- **JWT-based Authentication:** Secure token-based auth system
- **Access Tokens:** Short-lived tokens (configurable expiry)
- **Refresh Tokens:** Long-lived tokens for obtaining new access tokens
- **Password Hashing:** Bcrypt with salt rounds (10)
- **Cookie Security:** HTTP-only, secure cookies for token storage

### 6.2 Input Validation

- Request body validation for all endpoints
- MongoDB ObjectId validation
- File type and size validation
- Email format validation
- Username format validation (no spaces, min length)
- **Comprehensive Password Validation:**
  - Length: 8-16 characters
  - Must include: uppercase, lowercase, number
  - Allowed special characters: !@#$
  - Pattern-based validation with detailed error messages
- **Parameter Normalization:** Automatic username trimming and lowercasing in URL parameters

### 6.3 Middleware Protection

- JWT verification middleware
- Owner verification for resource modifications
- File upload size limits (16kb for JSON, configurable for files)
- CORS configuration for allowed origins

### 6.4 Error Handling

- Centralized error handling middleware
- Custom ApiError class for consistent error responses
- Proper HTTP status codes
- Sensitive information filtering in error messages
- **TypeScript type safety** for enhanced error prevention and debugging

---

## 7. File Upload & Storage

### 7.1 Supported File Types

- **Videos:** MP4, AVI, MOV, etc.
- **Images:** JPEG, PNG, WebP (avatars, thumbnails, cover images)

### 7.2 Storage Strategy

- **Service:** Cloudinary cloud storage
- **Upload Process:**
  1. File received via Multer middleware
  2. Temporary storage in local `/public/temp` directory
  3. Upload to Cloudinary with unique public_id
  4. Local file deletion after successful upload
  5. Cloudinary URL stored in database

### 7.3 File Management Features

- Automatic file cleanup on failed uploads
- Old file deletion when updating (avatar, cover, thumbnail)
- Video duration extraction
- Thumbnail generation support

---

## 8. Pagination & Performance

### 8.1 Pagination Implementation

- **Plugin:** mongoose-aggregate-paginate-v2
- **Default Page Size:** 10 items (configurable)
- **Pagination Response:**
  ```javascript
  {
    docs: [...items],
    totalDocs: Number,
    limit: Number,
    page: Number,
    totalPages: Number,
    hasNextPage: Boolean,
    hasPrevPage: Boolean,
    nextPage: Number | null,
    prevPage: Number | null
  }
  ```

### 8.2 Performance Optimizations

- Database indexing on frequently queried fields (username, email)
- Aggregate pipelines for complex queries
- Pagination for large result sets
- Efficient MongoDB queries with proper projections
- Cloudinary CDN for media delivery

---

## 9. Error Handling & Logging

### 9.1 Error Response Format

```javascript
{
  success: false,
  message: "Error description",
  errors: [...details],
  statusCode: Number
}
```

### 9.2 Success Response Format

```javascript
{
  success: true,
  message: "Success message",
  data: {...response data},
  statusCode: Number
}
```

### 9.3 Error Types

- **400 Bad Request:** Invalid input data
- **401 Unauthorized:** Missing or invalid authentication
- **403 Forbidden:** Insufficient permissions
- **404 Not Found:** Resource not found
- **409 Conflict:** Duplicate resource (username, email)
- **500 Internal Server Error:** Server-side errors

---

## 10. Environment Configuration

### 10.1 Required Environment Variables

```env
# Server Configuration
PORT=8000
CORS_ORIGIN=*

# Database
MONGODB_URI=mongodb://localhost:27017/viztube

# JWT Configuration
ACCESS_TOKEN_SECRET=your-access-token-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your-refresh-token-secret
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## 11. Development & Deployment

### 11.1 Development Setup

```bash
# Install dependencies
npm install

# Run development server with hot reload (TypeScript)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production server (compiled JavaScript)
npm start
```

### 11.2 Project Scripts

- **npm run dev:** Start development server with tsx (TypeScript execution)
- **npm run build:** Compile TypeScript to JavaScript (output: dist/)
- **npm start:** Start production server from compiled files
- **npm test:** Run test suite (to be implemented)

### 11.3 Code Quality Tools

- **TypeScript:** Static type checking with strict mode enabled
- **ESLint:** JavaScript/TypeScript linting with @eslint/js v9.39.0
- **Prettier:** Code formatting v3.6.2
- **TSConfig:** Configured for ES2022 target with NodeNext module resolution
- Configured ignore files (.prettierignore, .gitignore)

---

## 12. Future Enhancements

### 12.1 Planned Features

- [ ] Video streaming with adaptive bitrate
- [ ] Real-time notifications system
- [ ] Advanced search and filtering
- [ ] Video recommendations algorithm
- [ ] Content moderation system
- [ ] Analytics dashboard for creators
- [ ] Video transcoding pipeline
- [ ] Live streaming support
- [ ] Multi-language support
- [ ] Rate limiting and API throttling

### 12.2 Technical Improvements

- [ ] Implement comprehensive test suite (unit, integration, e2e)
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement Redis caching layer
- [ ] Set up CI/CD pipeline
- [ ] Add monitoring and logging (Winston, Morgan)
- [ ] Implement message queue for async tasks (Bull, RabbitMQ)
- [ ] Database migration system
- [ ] API versioning strategy
- [ ] WebSocket for real-time features
- [ ] GraphQL alternative endpoint

### 12.3 Recently Completed

- [x] **TypeScript Migration:** Complete migration from JavaScript to TypeScript for improved type safety and developer experience
- [x] **Enhanced Validation System:** Comprehensive password validation with detailed requirements
- [x] **Parameter Normalization Middleware:** Automatic sanitization of URL parameters
- [x] **Modular Configuration:** Separated configuration files for cookie options and pagination settings
- [x] **Type Definitions:** Custom TypeScript types for Cloudinary responses, Express extensions, and environment variables
- [x] **Development Tooling:** Integrated tsx, ts-node-dev for seamless TypeScript development workflow

---

## 13. API Usage Examples

### 13.1 User Registration

```bash
POST /api/v1/user/register
Content-Type: multipart/form-data

username: johndoe
email: john@example.com
fullname: John Doe
password: SecurePass123!
avatar: [file]
coverImage: [file]
```

### 13.2 User Login

```bash
POST /api/v1/user/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

### 13.3 Upload Video

```bash
POST /api/v1/videos
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

title: My First Video
description: This is an awesome video
duration: 120
videoFile: [file]
thumbnail: [file]
```

### 13.4 Get Videos with Pagination

```bash
GET /api/v1/videos?page=1&limit=10&sortBy=createdAt&sortType=desc
Authorization: Bearer <access_token>
```

---

## 14. Testing Strategy

### 14.1 Testing Levels (To Be Implemented)

- **Unit Tests:** Individual function and method testing
- **Integration Tests:** API endpoint testing
- **E2E Tests:** Complete user flow testing
- **Load Tests:** Performance and scalability testing

### 14.2 Test Coverage Goals

- Minimum 80% code coverage
- All critical paths tested
- Edge cases and error scenarios covered

---

## 15. Compliance & Best Practices

### 15.1 Code Standards

- **TypeScript with strict mode enabled** for maximum type safety
- ES2022+ syntax with NodeNext module resolution
- Modular architecture with clear separation of concerns
- MVC pattern implementation
- DRY (Don't Repeat Yourself) principles
- Proper error handling and validation
- Consistent code formatting with Prettier
- ESLint rules for code quality enforcement

### 15.2 Security Best Practices

- Never store passwords in plain text
- Validate all user inputs
- Use parameterized queries (Mongoose handles this)
- Implement rate limiting (planned)
- Regular security audits
- Keep dependencies updated

### 15.3 Data Privacy

- User passwords never exposed in responses
- Refresh tokens stored securely
- CORS configuration for trusted origins
- Secure file upload handling

---

## 16. Support & Maintenance

### 16.1 Version Control

- **Repository:** https://github.com/Nishant-444/Viztube
- **Branch Strategy:** Main branch for production-ready code
- **Commit Guidelines:** Descriptive commit messages

### 16.2 Documentation

- TypeScript type definitions for enhanced IntelliSense support
- Code comments for complex logic
- JSDoc-style comments for functions
- Comprehensive PRD (Product Requirements Document)
- Detailed README with setup instructions and API overview
- Postman collection for API testing (Viztube-v2.postman_collection.json)
- Postman collection documentation (POSTMAN_COLLECTION_README.md)

---

## 17. Dependencies

### 17.1 Production Dependencies

```json
{
  "bcrypt": "^6.0.0",
  "cloudinary": "^2.8.0",
  "cookie-parser": "^1.4.7",
  "cors": "^2.8.5",
  "dotenv": "^17.2.3",
  "express": "^5.1.0",
  "jsonwebtoken": "^9.0.2",
  "mongoose": "^8.19.1",
  "mongoose-aggregate-paginate-v2": "^1.1.4",
  "multer": "^2.0.2"
}
```

### 17.2 Development Dependencies

```json
{
  "@eslint/js": "^9.39.0",
  "@types/bcrypt": "^6.0.0",
  "@types/cookie-parser": "^1.4.10",
  "@types/cors": "^2.8.19",
  "@types/express": "^5.0.6",
  "@types/jsonwebtoken": "^9.0.10",
  "@types/multer": "^2.0.0",
  "@types/node": "^25.0.3",
  "eslint": "^9.39.0",
  "nodemon": "^3.1.11",
  "prettier": "^3.6.2",
  "ts-node": "^10.9.2",
  "ts-node-dev": "^2.0.0",
  "tsx": "^4.21.0",
  "typescript": "^5.9.3"
}
```

---

## 18. Glossary

- **JWT:** JSON Web Token - A secure method for transmitting information
- **Bcrypt:** Password hashing algorithm
- **Cloudinary:** Cloud-based media management platform
- **Multer:** Node.js middleware for handling multipart/form-data
- **Mongoose:** MongoDB ODM (Object Data Modeling) library
- **CORS:** Cross-Origin Resource Sharing
- **API:** Application Programming Interface
- **REST:** Representational State Transfer
- **ODM:** Object Data Modeling
- **CDN:** Content Delivery Network

---

## 19. Contact & Contributors

**Primary Author:** Nishant Sharma  
**Project Repository:** [Viztube](https://github.com/Nishant-444/Viztube)  
**License:** ISC

---

## 20. Document Revision History

| Version | Date              | Author         | Changes                                                                       |
| ------- | ----------------- | -------------- | ----------------------------------------------------------------------------- |
| 1.0.0   | November 10, 2025 | Nishant Sharma | Initial PRD creation                                                          |
| 1.1.0   | January 6, 2026   | Nishant Sharma | Updated with TypeScript migration, enhanced validation, modular configuration |

---

## 21. Technical Achievements & Highlights

### 21.1 Architecture Improvements

- **Full TypeScript Migration:** Converted entire codebase from JavaScript to TypeScript, providing compile-time type checking, better IDE support, and reduced runtime errors
- **Type-Safe Configurations:** Created dedicated configuration modules (cookieOptions, paginationOptions) with proper TypeScript interfaces
- **Custom Type Definitions:** Implemented comprehensive type definitions for:
  - Cloudinary API responses
  - Express request/response extensions
  - Environment variables
  - MongoDB document schemas

### 21.2 Enhanced Security Features

- **Advanced Password Validation:** Multi-criteria validation system with detailed error feedback
- **Parameter Sanitization:** Automatic normalization middleware for URL parameters preventing injection attacks
- **Environment-aware Cookie Security:** Dynamic cookie configuration based on NODE_ENV
- **Strict Type Checking:** TypeScript strict mode prevents type-related vulnerabilities

### 21.3 Developer Experience Improvements

- **Hot Reload Development:** Integrated tsx for instant TypeScript execution during development
- **Build Pipeline:** Configured TypeScript compiler with optimized settings for Node.js
- **Code Quality Enforcement:** Combined ESLint and Prettier with TypeScript support
- **IntelliSense Support:** Enhanced autocomplete and type hints throughout the codebase
- **Comprehensive API Documentation:** Postman collection with detailed endpoint documentation

### 21.4 Project Structure Organization

```
src/
├── config/          # Centralized configuration modules
│   ├── cookieOptions.ts
│   ├── db.ts
│   └── paginationOptions.ts
├── controllers/     # Business logic handlers (9 controllers)
├── middlewares/     # Request processing middlewares (4 middlewares)
├── models/          # MongoDB schemas (7 models)
├── routes/          # API route definitions (9 route files)
├── types/           # TypeScript type definitions
│   ├── cloudinary.types.ts
│   ├── environment.d.ts
│   └── express.d.ts
├── utils/           # Reusable utility functions
├── validators/      # Input validation logic
│   ├── auth.validators.ts
│   └── file.validators.ts
├── app.ts           # Express application setup
├── constants.ts     # Application-wide constants
└── index.ts         # Application entry point
```

---

**End of Document**
