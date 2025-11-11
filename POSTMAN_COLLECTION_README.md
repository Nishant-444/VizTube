# Viztube-v2 Postman Collection Guide

## 📦 Overview

This comprehensive Postman collection contains **43 API endpoints** covering all features of the Viztube-v2 video streaming platform backend.

## 🚀 Quick Start

### 1. Import Collection

1. Open Postman Desktop or Web
2. Click "Import" button
3. Select `Viztube-v2.postman_collection.json`
4. Collection will be added to your workspace

### 2. Configure Variables

The collection includes pre-configured variables:

| Variable       | Description              | Default Value                       |
| -------------- | ------------------------ | ----------------------------------- |
| `baseUrl`      | API Base URL             | `http://localhost:8000/api/v1`      |
| `accessToken`  | JWT Access Token         | Auto-populated on login             |
| `refreshToken` | JWT Refresh Token        | Auto-populated on login             |
| `userId`       | Current User ID          | Auto-populated on login             |
| `videoId`      | Last Created Video ID    | Auto-populated on video upload      |
| `commentId`    | Last Created Comment ID  | Auto-populated on comment creation  |
| `tweetId`      | Last Created Tweet ID    | Auto-populated on tweet creation    |
| `playlistId`   | Last Created Playlist ID | Auto-populated on playlist creation |

### 3. Start Testing

1. **First Time Users:** Start with "Register User" or "Login User"
2. **Returning Users:** Use "Login User" or "Refresh Access Token"
3. Tokens are automatically saved and used in subsequent requests

## 📂 Collection Structure

### 1. Health Check (1 endpoint)

- **GET** Health Check - Verify API is running

### 2. User Management (9 endpoints)

#### Authentication (No Auth Required)

- **POST** Register User - Create new account with avatar/cover
- **POST** Login User - Authenticate and get tokens
- **POST** Refresh Access Token - Get new access token
- **POST** Logout User - Invalidate refresh token

#### Profile Management (Auth Required)

- **GET** Get Current User - Fetch authenticated user details
- **GET** Get User Channel Profile - View any user's channel
- **POST** Change Password - Update password with old password verification
- **PATCH** Update Account Details - Modify fullname/email
- **PATCH** Update Avatar - Upload new profile picture
- **PATCH** Update Cover Image - Upload new channel cover
- **GET** Get Watch History - View watched videos

### 3. Video Management (6 endpoints)

- **GET** Get All Videos - List with pagination & filters
- **POST** Upload Video - Upload video with thumbnail
- **GET** Get Video by ID - View single video (increments views)
- **PATCH** Update Video - Modify title, description, thumbnail
- **DELETE** Delete Video - Remove video and files
- **PATCH** Toggle Publish Status - Publish/unpublish video

### 4. Comment Management (4 endpoints)

- **GET** Get Video Comments - List with pagination
- **POST** Add Comment - Create new comment on video
- **PATCH** Update Comment - Edit comment content
- **DELETE** Delete Comment - Remove comment

### 5. Tweet Management (4 endpoints)

- **POST** Create Tweet - Post community update
- **GET** Get User Tweets - List user's tweets with pagination
- **PATCH** Update Tweet - Edit tweet content
- **DELETE** Delete Tweet - Remove tweet

### 6. Like System (4 endpoints)

- **POST** Toggle Video Like - Like/unlike video
- **POST** Toggle Comment Like - Like/unlike comment
- **POST** Toggle Tweet Like - Like/unlike tweet
- **GET** Get Liked Videos - List all liked videos

### 7. Subscription Management (3 endpoints)

- **POST** Toggle Subscription - Subscribe/unsubscribe to channel
- **GET** Get Channel Subscribers - List channel's subscribers
- **GET** Get Subscribed Channels - List channels user follows

### 8. Playlist Management (7 endpoints)

- **POST** Create Playlist - Create new playlist
- **GET** Get User Playlists - List all user's playlists
- **GET** Get Playlist by ID - View playlist with videos
- **PATCH** Update Playlist - Edit name/description
- **DELETE** Delete Playlist - Remove playlist
- **POST** Add Video to Playlist - Add video to playlist
- **DELETE** Remove Video from Playlist - Remove video from playlist

### 9. Dashboard & Analytics (2 endpoints)

- **GET** Get Channel Stats - Total views, subscribers, videos, likes
- **GET** Get Channel Videos - All uploaded videos with stats

## 🔐 Authentication

### Authorization Header

Most endpoints use Bearer Token authentication:

```
Authorization: Bearer {{accessToken}}
```

This is automatically configured in the collection. After login, the `accessToken` variable is set automatically.

### Token Lifecycle

1. **Login/Register** → Receives `accessToken` + `refreshToken`
2. **Access Token Expires** → Use "Refresh Access Token" endpoint
3. **Refresh Token Expires** → Must login again

## 🎯 Common Workflows

### Complete User Journey

```
1. Register User (with avatar/cover) or Login
2. Update Profile (optional)
3. Upload Video (with thumbnail)
4. View All Videos
5. Add Comment on Video
6. Like Video
7. Subscribe to Channel
8. Create Playlist
9. Add Video to Playlist
10. View Dashboard Stats
```

### Content Creator Workflow

```
1. Login
2. Upload Video
3. Check Dashboard Stats
4. Update Video Details
5. Respond to Comments
6. View Channel Analytics
```

### Viewer Workflow

```
1. Register/Login
2. Browse Videos
3. Watch Video (increments view count)
4. Like Video
5. Add Comment
6. Subscribe to Channel
7. Create Playlist
8. Add Videos to Playlist
```

## 📝 Request Examples

### Register User

```json
POST {{baseUrl}}/user/register
Content-Type: multipart/form-data

Fields:
- username: "johndoe"
- email: "johndoe@example.com"
- fullname: "John Doe"
- password: "SecurePass123!"
- avatar: [file]
- coverImage: [file]
```

### Login User

```json
POST {{baseUrl}}/user/login
Content-Type: application/json

{
  "email": "johndoe@example.com",
  "password": "SecurePass123!"
}
```

### Upload Video

```json
POST {{baseUrl}}/videos
Authorization: Bearer {{accessToken}}
Content-Type: multipart/form-data

Fields:
- title: "My Awesome Video"
- description: "Video description"
- duration: 120
- videoFile: [file]
- thumbnail: [file]
```

### Get All Videos (with filters)

```
GET {{baseUrl}}/videos?page=1&limit=10&sortBy=views&sortType=desc
Authorization: Bearer {{accessToken}}
```

## ✨ Auto-Generated Variables

The collection includes **test scripts** that automatically extract and save important values:

### After Registration/Login

```javascript
- accessToken → Used for authentication
- refreshToken → Used for token refresh
- userId → Used in user-specific requests
```

### After Video Upload

```javascript
- videoId → Used in video operations
```

### After Comment Creation

```javascript
- commentId → Used in comment operations
```

### After Tweet Creation

```javascript
- tweetId → Used in tweet operations
```

### After Playlist Creation

```javascript
- playlistId → Used in playlist operations
```

## 🔧 Customization

### Change Base URL

To use with deployed API:

1. Click on collection name
2. Go to "Variables" tab
3. Update `baseUrl` value:
   - Local: `http://localhost:8000/api/v1`
   - Production: `https://api.yourdomain.com/api/v1`

### Add Custom Headers

Edit any request to add custom headers:

```
X-Custom-Header: value
```

## 🐛 Troubleshooting

### Issue: 401 Unauthorized

**Solution:** Token expired or missing

- Run "Login User" again, or
- Use "Refresh Access Token"

### Issue: 403 Forbidden

**Solution:** Insufficient permissions

- Trying to edit/delete someone else's content
- Only owners can modify their resources

### Issue: 404 Not Found

**Solution:** Invalid ID or resource doesn't exist

- Check the ID in variables
- Verify resource exists

### Issue: 400 Bad Request

**Solution:** Invalid input data

- Check required fields
- Verify data format (JSON vs form-data)
- Review request body structure

### Issue: Variables Not Set

**Solution:** Run prerequisite requests

- Must login before using protected endpoints
- Must create resource before referencing it

## 📊 Testing Features

### Pagination

Most list endpoints support pagination:

```
?page=1&limit=10
```

### Sorting

Video endpoints support sorting:

```
?sortBy=createdAt&sortType=desc
?sortBy=views&sortType=asc
```

### Filters

Video list supports filters:

```
?userId=<userId>         // Videos by specific user
?query=<search-term>     // Search in title/description
```

## 🎓 Best Practices

1. **Always start with Health Check** - Verify API is running
2. **Login before testing** - Most endpoints require authentication
3. **Use test scripts** - Variables are auto-populated
4. **Check response codes** - 200/201 = success, 4xx = client error, 5xx = server error
5. **Review descriptions** - Each request has detailed documentation
6. **Test in order** - Follow logical workflows for best results

## 📄 Response Format

### Success Response

```json
{
  "success": true,
  "message": "Success message",
  "data": {
    /* response data */
  },
  "statusCode": 200
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    /* error details */
  ],
  "statusCode": 400
}
```

## 🔗 Related Documentation

- [PRD.md](./PRD.md) - Complete Product Requirements Document
- [README.md](./README.md) - Project setup and documentation

## 📞 Support

For issues or questions:

- Review endpoint descriptions in Postman
- Check PRD.md for detailed API documentation
- Verify environment variables are set correctly
- Ensure backend server is running on correct port

---

**Collection Version:** 1.0.0  
**Last Updated:** November 10, 2025  
**Total Endpoints:** 43  
**Author:** Nishant Sharma
