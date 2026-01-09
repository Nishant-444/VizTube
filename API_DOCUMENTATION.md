# VizTube API Guide

Hey! This guide will help you understand how to use the VizTube API.

All API calls start with: `http://localhost:8000/api/v2`

---

## How Authentication Works

When you login, you get two tokens:

- **Access Token** - This expires in 15 minutes. Use it to make API requests.
- **Refresh Token** - This lasts 7 days. Use it to get a new access token when the old one expires.

Both tokens are saved in cookies automatically, so you don't have to worry about managing them manually.

Some routes need you to be logged in. If you see a lock icon next to an endpoint, that means you need to be authenticated.

---

## What API Responses Look Like

When things go well:

```json
{
  "statusCode": 200,
  "data": { "username": "john", "email": "john@example.com" },
  "message": "User fetched successfully",
  "success": true
}
```

When something goes wrong:

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Username is required",
  "success": false,
  "errors": []
}
```

### Common Status Codes

- **200** - Everything worked
- **201** - New resource created
- **400** - You sent something invalid
- **401** - You need to login
- **403** - You don't have permission
- **404** - Resource not found
- **500** - Something broke on our end

---

## API Endpoints

### Health Check

#### Check API Health

```http
GET /healthcheck
```

**Description**: Verify that the API server is running.

**Auth Required**: No

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "status": "OK",
    "message": "Server is running"
  },
  "message": "Health check passed",
  "success": true
}
```

---

### User Management

#### Register User

```http
POST /user/register
```

**Description**: Register a new user account with avatar and cover image.

**Auth Required**: No

**Content-Type**: `multipart/form-data`

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Unique username (alphanumeric, lowercase) |
| email | string | Yes | Valid email address |
| fullname | string | Yes | User's full name |
| password | string | Yes | Password (min 6 characters) |
| avatar | file | Yes | Profile picture (image file) |
| coverImage | file | No | Cover photo (image file) |

**Example**:

```bash
curl -X POST http://localhost:8000/api/v2/user/register \
  -F "username=johndoe" \
  -F "email=john@example.com" \
  -F "fullname=John Doe" \
  -F "password=SecurePass123" \
  -F "avatar=@avatar.jpg" \
  -F "coverImage=@cover.jpg"
```

**Response**:

```json
{
  "statusCode": 201,
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "fullname": "John Doe",
      "avatar": "https://cloudinary.com/...",
      "coverImage": "https://cloudinary.com/..."
    }
  },
  "message": "User registered successfully",
  "success": true
}
```

---

#### Login User

```http
POST /user/login
```

**Description**: Authenticate user and receive JWT tokens.

**Auth Required**: No

**Content-Type**: `application/json`

**Request Body**:

```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "fullname": "John Doe",
      "avatar": "https://cloudinary.com/...",
      "coverImage": "https://cloudinary.com/..."
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User logged in successfully",
  "success": true
}
```

**Note**: Tokens are also set in HTTP-only cookies.

---

#### Refresh Access Token

```http
POST /user/refresh-token
```

**Description**: Get a new access token using refresh token.

**Auth Required**: No (but requires refresh token in cookies)

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Access token refreshed successfully",
  "success": true
}
```

---

#### Logout User

```http
POST /user/logout
```

**Description**: Logout user and clear tokens.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "User logged out successfully",
  "success": true
}
```

---

#### Change Password

```http
POST /user/change-password
```

**Description**: Change user password (requires current password).

**Auth Required**: Yes

**Request Body**:

```json
{
  "oldPassword": "OldSecurePass123",
  "newPassword": "NewSecurePass123"
}
```

**Response**:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Password changed successfully",
  "success": true
}
```

---

#### Get Current User

```http
GET /user/current-user-details
```

**Description**: Get logged-in user details.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "fullname": "John Doe",
    "avatar": "https://cloudinary.com/...",
    "coverImage": "https://cloudinary.com/...",
    "createdAt": "2026-01-09T10:00:00.000Z"
  },
  "message": "User details fetched successfully",
  "success": true
}
```

---

#### Get Channel Profile

```http
GET /user/c/:username
```

**Description**: Get user channel profile with subscriber and subscription counts.

**Auth Required**: Yes

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| username | string | Channel username |

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "username": "johndoe",
    "fullname": "John Doe",
    "avatar": "https://cloudinary.com/...",
    "coverImage": "https://cloudinary.com/...",
    "subscribersCount": 150,
    "subscribedToCount": 45,
    "isSubscribed": true
  },
  "message": "Channel profile fetched successfully",
  "success": true
}
```

---

#### Update Account Details

```http
PATCH /user/update-account
```

**Description**: Update user's fullname and email.

**Auth Required**: Yes

**Request Body**:

```json
{
  "fullname": "John Updated Doe",
  "email": "johnupdated@example.com"
}
```

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "johnupdated@example.com",
    "fullname": "John Updated Doe"
  },
  "message": "Account details updated successfully",
  "success": true
}
```

---

#### Update Avatar

```http
PATCH /user/update-avatar
```

**Description**: Update user's profile picture.

**Auth Required**: Yes

**Content-Type**: `multipart/form-data`

**Request Body**:
| Field | Type | Required |
|-------|------|----------|
| avatar | file | Yes |

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "avatar": "https://cloudinary.com/new-avatar.jpg"
  },
  "message": "Avatar updated successfully",
  "success": true
}
```

---

#### Update Cover Image

```http
PATCH /user/update-cover-image
```

**Description**: Update user's cover photo.

**Auth Required**: Yes

**Content-Type**: `multipart/form-data`

**Request Body**:
| Field | Type | Required |
|-------|------|----------|
| coverImage | file | Yes |

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "coverImage": "https://cloudinary.com/new-cover.jpg"
  },
  "message": "Cover image updated successfully",
  "success": true
}
```

---

#### Get Watch History

```http
GET /user/watch-history
```

**Description**: Get user's watch history with video details.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "videoId": 5,
      "watchedAt": "2026-01-09T10:30:00.000Z",
      "video": {
        "id": 5,
        "title": "Introduction to Node.js",
        "thumbnailUrl": "https://cloudinary.com/...",
        "duration": 600,
        "views": 1500,
        "user": {
          "username": "techguru",
          "avatar": "https://cloudinary.com/..."
        }
      }
    }
  ],
  "message": "Watch history fetched successfully",
  "success": true
}
```

---

### Video Management

#### Get All Videos

```http
GET /videos
```

**Description**: Get all published videos.

**Auth Required**: Yes

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Page number |
| limit | number | 10 | Items per page |

**Response**:

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "title": "My First Video",
      "description": "Description here",
      "videoFileUrl": "https://cloudinary.com/video.mp4",
      "thumbnailUrl": "https://cloudinary.com/thumb.jpg",
      "duration": 300,
      "views": 150,
      "isPublished": true,
      "createdAt": "2026-01-08T10:00:00.000Z",
      "user": {
        "id": 1,
        "username": "johndoe",
        "avatar": "https://cloudinary.com/..."
      }
    }
  ],
  "message": "Videos fetched successfully",
  "success": true
}
```

---

#### Upload Video

```http
POST /videos
```

**Description**: Upload a new video with thumbnail.

**Auth Required**: Yes

**Content-Type**: `multipart/form-data`

**Request Body**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| videoFile | file | Yes | Video file (MP4, AVI, etc.) |
| thumbnail | file | Yes | Thumbnail image |
| title | string | Yes | Video title |
| description | string | No | Video description |

**Response**:

```json
{
  "statusCode": 201,
  "data": {
    "id": 10,
    "title": "My First Video",
    "description": "Description here",
    "videoFileUrl": "https://cloudinary.com/video.mp4",
    "thumbnailUrl": "https://cloudinary.com/thumb.jpg",
    "duration": 300,
    "views": 0,
    "isPublished": true
  },
  "message": "Video uploaded successfully",
  "success": true
}
```

---

#### Get Video by ID

```http
GET /videos/:videoId
```

**Description**: Get video details by ID. Automatically increments view count.

**Auth Required**: Yes

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| videoId | number | Video ID |

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "title": "My First Video",
    "description": "Description here",
    "videoFileUrl": "https://cloudinary.com/video.mp4",
    "thumbnailUrl": "https://cloudinary.com/thumb.jpg",
    "duration": 300,
    "views": 151,
    "isPublished": true,
    "createdAt": "2026-01-08T10:00:00.000Z",
    "user": {
      "id": 1,
      "username": "johndoe",
      "fullname": "John Doe",
      "avatar": "https://cloudinary.com/..."
    },
    "likes": 45,
    "comments": 12
  },
  "message": "Video fetched successfully",
  "success": true
}
```

---

#### Update Video

```http
PATCH /videos/:videoId
```

**Description**: Update video details (title, description, thumbnail). Only video owner can update.

**Auth Required**: Yes

**Content-Type**: `multipart/form-data`

**Request Body**:
| Field | Type | Required |
|-------|------|----------|
| title | string | No |
| description | string | No |
| thumbnail | file | No |

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "title": "Updated Title",
    "description": "Updated description",
    "thumbnailUrl": "https://cloudinary.com/new-thumb.jpg"
  },
  "message": "Video updated successfully",
  "success": true
}
```

---

#### Delete Video

```http
DELETE /videos/:videoId
```

**Description**: Delete a video. Only video owner can delete.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Video deleted successfully",
  "success": true
}
```

---

#### Toggle Publish Status

```http
PATCH /videos/toggle/publish/:videoId
```

**Description**: Publish or unpublish a video.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "isPublished": false
  },
  "message": "Video publish status toggled successfully",
  "success": true
}
```

---

### Comments

#### Get Video Comments

```http
GET /comments/:videoId
```

**Description**: Get all comments for a video.

**Auth Required**: Yes

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| videoId | number | Video ID |

**Response**:

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "content": "Great video!",
      "createdAt": "2026-01-09T11:00:00.000Z",
      "user": {
        "id": 2,
        "username": "viewer1",
        "avatar": "https://cloudinary.com/..."
      },
      "likes": 5
    }
  ],
  "message": "Comments fetched successfully",
  "success": true
}
```

---

#### Add Comment

```http
POST /comments/:videoId
```

**Description**: Add a comment to a video.

**Auth Required**: Yes

**Request Body**:

```json
{
  "content": "This is my comment"
}
```

**Response**:

```json
{
  "statusCode": 201,
  "data": {
    "id": 15,
    "content": "This is my comment",
    "videoId": 1,
    "userId": 1,
    "createdAt": "2026-01-09T11:30:00.000Z"
  },
  "message": "Comment added successfully",
  "success": true
}
```

---

#### Update Comment

```http
PATCH /comments/c/:commentId
```

**Description**: Update a comment. Only comment owner can update.

**Auth Required**: Yes

**Request Body**:

```json
{
  "content": "Updated comment text"
}
```

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "id": 15,
    "content": "Updated comment text"
  },
  "message": "Comment updated successfully",
  "success": true
}
```

---

#### Delete Comment

```http
DELETE /comments/c/:commentId
```

**Description**: Delete a comment. Only comment owner can delete.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Comment deleted successfully",
  "success": true
}
```

---

### Likes

#### Toggle Video Like

```http
POST /likes/toggle/v/:videoId
```

**Description**: Like or unlike a video.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "liked": true
  },
  "message": "Like added successfully",
  "success": true
}
```

---

#### Toggle Comment Like

```http
POST /likes/toggle/c/:commentId
```

**Description**: Like or unlike a comment.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "liked": false
  },
  "message": "Like removed successfully",
  "success": true
}
```

---

#### Toggle Tweet Like

```http
POST /likes/toggle/t/:tweetId
```

**Description**: Like or unlike a tweet.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "liked": true
  },
  "message": "Like added successfully",
  "success": true
}
```

---

#### Get Liked Videos

```http
GET /likes/videos
```

**Description**: Get all videos liked by the current user.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "title": "Liked Video",
      "thumbnailUrl": "https://cloudinary.com/...",
      "duration": 300,
      "views": 500,
      "user": {
        "username": "creator",
        "avatar": "https://cloudinary.com/..."
      }
    }
  ],
  "message": "Liked videos fetched successfully",
  "success": true
}
```

---

### Subscriptions

#### Toggle Subscription

```http
POST /subscriptions/c/:channelId
```

**Description**: Subscribe or unsubscribe to a channel.

**Auth Required**: Yes

**URL Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| channelId | number | Channel (user) ID |

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "subscribed": true
  },
  "message": "Subscribed successfully",
  "success": true
}
```

---

#### Get Channel Subscribers

```http
GET /subscriptions/c/:channelId
```

**Description**: Get all subscribers of a channel.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "subscribers": [
      {
        "id": 2,
        "username": "subscriber1",
        "fullname": "Subscriber One",
        "avatar": "https://cloudinary.com/...",
        "subscribedAt": "2026-01-05T10:00:00.000Z"
      }
    ],
    "totalSubscribers": 150
  },
  "message": "Subscribers fetched successfully",
  "success": true
}
```

---

#### Get User Subscriptions

```http
GET /subscriptions/u/:subscriberId
```

**Description**: Get all channels a user is subscribed to.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "subscriptions": [
      {
        "id": 5,
        "username": "channel1",
        "fullname": "Channel One",
        "avatar": "https://cloudinary.com/...",
        "subscribedAt": "2026-01-03T10:00:00.000Z"
      }
    ],
    "totalSubscriptions": 45
  },
  "message": "Subscriptions fetched successfully",
  "success": true
}
```

---

### Playlists

#### Create Playlist

```http
POST /playlist
```

**Description**: Create a new playlist.

**Auth Required**: Yes

**Request Body**:

```json
{
  "name": "My Favorite Videos",
  "description": "Collection of my favorite content"
}
```

**Response**:

```json
{
  "statusCode": 201,
  "data": {
    "id": 10,
    "name": "My Favorite Videos",
    "description": "Collection of my favorite content",
    "userId": 1,
    "createdAt": "2026-01-09T12:00:00.000Z"
  },
  "message": "Playlist created successfully",
  "success": true
}
```

---

#### Get User Playlists

```http
GET /playlist/user/:userId
```

**Description**: Get all playlists created by a user.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 10,
      "name": "My Favorite Videos",
      "description": "Collection of my favorite content",
      "videoCount": 5,
      "createdAt": "2026-01-09T12:00:00.000Z"
    }
  ],
  "message": "Playlists fetched successfully",
  "success": true
}
```

---

#### Get Playlist by ID

```http
GET /playlist/:playlistId
```

**Description**: Get playlist details with all videos.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "id": 10,
    "name": "My Favorite Videos",
    "description": "Collection of my favorite content",
    "user": {
      "username": "johndoe",
      "avatar": "https://cloudinary.com/..."
    },
    "videos": [
      {
        "id": 1,
        "title": "Video Title",
        "thumbnailUrl": "https://cloudinary.com/...",
        "duration": 300,
        "addedAt": "2026-01-09T12:30:00.000Z"
      }
    ],
    "totalVideos": 5
  },
  "message": "Playlist fetched successfully",
  "success": true
}
```

---

#### Update Playlist

```http
PATCH /playlist/:playlistId
```

**Description**: Update playlist name and description. Only owner can update.

**Auth Required**: Yes

**Request Body**:

```json
{
  "name": "Updated Playlist Name",
  "description": "Updated description"
}
```

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "id": 10,
    "name": "Updated Playlist Name",
    "description": "Updated description"
  },
  "message": "Playlist updated successfully",
  "success": true
}
```

---

#### Delete Playlist

```http
DELETE /playlist/:playlistId
```

**Description**: Delete a playlist. Only owner can delete.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Playlist deleted successfully",
  "success": true
}
```

---

#### Add Video to Playlist

```http
POST /playlist/:playlistId/:videoId
```

**Description**: Add a video to a playlist.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 201,
  "data": {
    "playlistId": 10,
    "videoId": 5,
    "addedAt": "2026-01-09T13:00:00.000Z"
  },
  "message": "Video added to playlist successfully",
  "success": true
}
```

---

#### Remove Video from Playlist

```http
DELETE /playlist/:playlistId/:videoId
```

**Description**: Remove a video from a playlist.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Video removed from playlist successfully",
  "success": true
}
```

---

### Tweets

#### Create Tweet

```http
POST /tweets
```

**Description**: Create a new tweet/community post.

**Auth Required**: Yes

**Request Body**:

```json
{
  "content": "This is my tweet content!"
}
```

**Response**:

```json
{
  "statusCode": 201,
  "data": {
    "id": 20,
    "content": "This is my tweet content!",
    "userId": 1,
    "createdAt": "2026-01-09T14:00:00.000Z"
  },
  "message": "Tweet created successfully",
  "success": true
}
```

---

#### Get User Tweets

```http
GET /tweets/user/:userId
```

**Description**: Get all tweets by a user.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 20,
      "content": "This is my tweet content!",
      "createdAt": "2026-01-09T14:00:00.000Z",
      "user": {
        "username": "johndoe",
        "avatar": "https://cloudinary.com/..."
      },
      "likes": 10
    }
  ],
  "message": "Tweets fetched successfully",
  "success": true
}
```

---

#### Update Tweet

```http
PATCH /tweets/:tweetId
```

**Description**: Update a tweet. Only tweet owner can update.

**Auth Required**: Yes

**Request Body**:

```json
{
  "content": "Updated tweet content"
}
```

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "id": 20,
    "content": "Updated tweet content"
  },
  "message": "Tweet updated successfully",
  "success": true
}
```

---

#### Delete Tweet

```http
DELETE /tweets/:tweetId
```

**Description**: Delete a tweet. Only tweet owner can delete.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Tweet deleted successfully",
  "success": true
}
```

---

### Dashboard

#### Get Channel Stats

```http
GET /dashboard/stats
```

**Description**: Get channel analytics (views, subscribers, videos, likes).

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": {
    "totalVideos": 25,
    "totalViews": 15000,
    "totalSubscribers": 150,
    "totalLikes": 1200
  },
  "message": "Channel stats fetched successfully",
  "success": true
}
```

---

#### Get Channel Videos

```http
GET /dashboard/videos
```

**Description**: Get all videos uploaded by the current user.

**Auth Required**: Yes

**Response**:

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "title": "My Video",
      "thumbnailUrl": "https://cloudinary.com/...",
      "views": 500,
      "likes": 45,
      "comments": 12,
      "isPublished": true,
      "createdAt": "2026-01-08T10:00:00.000Z"
    }
  ],
  "message": "Channel videos fetched successfully",
  "success": true
}
```

---

## Rate Limiting

Currently, there is no rate limiting implemented. It is recommended to add rate limiting in production to prevent abuse.

---

## Pagination

Endpoints that return multiple items support pagination:

**Query Parameters**:

- `page` (number, default: 1): Page number
- `limit` (number, default: 10): Items per page

**Example**:

```
GET /videos?page=2&limit=20
```

---

## File Upload Limits

- **Images** (Avatar, Cover, Thumbnail): 10 MB max
- **Videos**: 100 MB max (configurable in multer.middleware.ts)
- **Supported Image Formats**: JPEG, PNG, JPG, GIF
- **Supported Video Formats**: MP4, AVI, MOV, MKV

---

## Notes for Developers

1. **Token Refresh**: Implement automatic token refresh in your frontend when receiving 401 errors.
2. **File Uploads**: Use `multipart/form-data` Content-Type for file uploads.
3. **Error Handling**: Always check the `success` field in responses.
4. **Timestamps**: All timestamps are in ISO 8601 format (UTC).
5. **IDs**: All IDs are integers (PostgreSQL auto-increment).

---

## Postman Collection

Import the `Viztube-v2.postman_collection.json` file for pre-configured requests with:

- Environment variables
- Auto-save tokens
- Pre-request scripts
- Test scripts

---

**Last Updated**: January 2026  
**Version**: 2.0.0  
**Maintainer**: Nishant Sharma
