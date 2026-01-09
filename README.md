# VizTube - Video Platform Backend

> A complete YouTube-like backend built with TypeScript, PostgreSQL, and modern tools.

![VizTube Banner](https://via.placeholder.com/800x200/4A90E2/FFFFFF?text=VizTube+Backend+API)

## What is this?

Hey there! VizTube is a fully working backend for a video sharing platform (think YouTube). I built it using TypeScript, PostgreSQL, and all the modern stuff developers love.

Whether you're learning backend development, looking for a project to reference, or just curious about how video platforms work - this is for you!

**Status: Complete and ready to use!**

---

## What can it do?

Think about everything you do on YouTube - this backend handles all of that:

**User Stuff:**

- Sign up with your email and upload a profile picture
- Login securely (using JWT tokens - fancy but secure!)
- Change your password when you forget it
- Update your profile info and pictures
- See what videos you've watched

**Video Features:**

- Upload videos with thumbnails
- Edit your video details (title, description)
- Make videos public or private
- Delete videos you don't want anymore
- Track how many people watched your videos

**Social Features:**

- Like videos, comments, and posts
- Comment on videos
- Subscribe to channels (and unsubscribe if you want)
- Create community posts (like tweets)

**Organizing Content:**

- Create playlists to save your favorite videos
- Add or remove videos from playlists
- See your watch history

**For Content Creators:**

- Dashboard showing your channel stats
- See all your uploaded videos
- Track total views, subscribers, and likes

---

## What's it built with?

Here's the tech stack in simple terms:

**Main Technologies:**

- Node.js (the runtime that makes it all work)
- TypeScript (JavaScript but with types - helps catch bugs early)
- Express (handles all the HTTP requests)
- PostgreSQL (the database where everything is stored)
- Prisma (makes talking to the database super easy)

**Security & Authentication:**

- JWT tokens for login (keeps you logged in securely)
- Bcrypt for passwords (encrypts them so they're safe)
- Cookie handling for storing tokens

**File Storage:**

- Cloudinary (stores all videos and images in the cloud)
- **Code Quality**: ESLint v9.39.0, Prettier v3.6.2
- **Database Management**: Prisma Studio, Prisma Migrate

---

## Project Structure

````
viztube/
├── prisma/
│   ├── schema.prisma              # Database schema with all models
│   └── migrations/                # Database migration history
│       ├── migration_lock.toml
│       └── 20260107053732_add_watch_history/
│
├── public/
│   └── temp/                      # Temporary file storage for uploads
│
├── src/
│   ├── index.ts                   # Application entry point
│   ├── app.ts                     # Express app configuration
│   ├── constants.ts               # Application constants
│   │
│   ├── config/
│   │   └── cookieOptions.ts       # Cookie configuration
│   │
│   ├── controllers/               # Business logic (∗ as import pattern)
│   │   ├── user.controller.ts
│   │   ├── video.controller.ts
---

## How the code is organized

The project has a clean structure - everything has its place:

![Project Structure](https://via.placeholder.com/600x400/34495E/FFFFFF?text=Clean+Folder+Structure)

**Main folders you'll see:**

- `src/` - All the TypeScript code lives here
  - `controllers/` - The brain of each feature (handles the logic)
  - `routes/` - Defines all the API endpoints
  - `middlewares/` - Things that run before your main code (like authentication)
  - `utils/` - Helper functions used everywhere
  - `validators/` - Checks if the data you send is correct

- `prisma/` - Database stuff
  - `schema.prisma` - Defines how your database looks
  - `migrations/` - History of database changes

- `public/temp/` - Temporary storage for uploaded files

---

## The Database

The app uses PostgreSQL (a powerful, reliable database) with these main tables:

**User** - Stores user info (email, password, avatar, etc.)

**Video** - All video details (title, URL, views, who uploaded it)

**Comment** - Comments people leave on videos

**Like** - Tracks who liked what (videos, comments, or tweets)

**Subscription** - Who's subscribed to who

**Playlist** - User-created video collections

**Tweet** - Community posts (like Twitter)

**WatchHistory** - Keeps track of what videos you watched

Everything is connected properly - if you delete a user, all their videos and comments get deleted too. Smart, right?

---

## Getting Started

Want to run this on your computer? Here's how:

### What you need:

- Node.js installed (version 18 or newer)
- PostgreSQL database
- A Cloudinary account (it's free for small projects)

### Step 1: Download the project

```bash
git clone https://github.com/Nishant-444/Viztube.git
cd Viztube
````

### Step 2: Install everything

```bash
npm install
```

This will download all the packages the project needs.

### Step 3: Set up your environment

Create a file called `.env` and add these:

```env
# Server Configuration
PORT=8000
CORS_ORIGIN=*
NODE_ENV=development

# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@localhost:5432/viztube?schema=public"

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Configuration
ACCESS_TOKEN_SECRET=your_super_secret_access_token_min_32_characters
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_min_32_characters
REFRESH_TOKEN_EXPIRY=7d
```

> **Note:** See `.env.sample` for a complete template.

4. **Set up the database:**

   ```bash
   # Generate Prisma Client
   npx prisma generate

   # Run migrations to create database tables
   npx prisma migrate dev --name init

   # (Optional) Open Prisma Studio to view database
   npx prisma studio
   ```

5. **Build TypeScript:**

   ```bash
   npm run build
   ```

6. **Run the server:**

   **Development mode (with hot reload):**

   ```bash
   npm run dev
   ```

   **Production mode:**

   ```bash
   npm start
   ```

7. **Verify installation:**

   ```bash
   # Test the health check endpoint
   curl http://localhost:8000/api/v2/healthcheck
   ```

   Expected response:

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

```env
# Server stuff
PORT=8000
CORS_ORIGIN=*
NODE_ENV=development

# Your PostgreSQL database URL
DATABASE_URL="postgresql://username:password@localhost:5432/viztube?schema=public"

# Cloudinary credentials (get these from cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT secrets (use long random strings - the longer the better!)
ACCESS_TOKEN_SECRET=make_this_a_really_long_random_string
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_SECRET=another_really_long_random_string_different_from_above
REFRESH_TOKEN_EXPIRY=7d
```

Don't worry, there's a `.env.sample` file you can copy from!

### Step 4: Set up the database

```bash
# This creates the database tables
npx prisma migrate dev

# (Optional) Open Prisma Studio to see your database in a nice GUI
npx prisma studio
```

### Step 5: Build the TypeScript code

```bash
npm run build
```

### Step 6: Start the server

For development (with auto-reload when you change code):

```bash
npm run dev
```

For production:

```bash
npm start
```

### Step 7: Check if it's working

Open your browser or use curl:

```bash
curl http://localhost:8000/api/v2/healthcheck
```

You should see a success message! Your API is now running at `http://localhost:8000/api/v2`

---

## Testing the API

I've included a Postman collection with 40+ ready-to-use API requests. Just import it and start testing!

**Quick test with curl:**

Register a user:

```bash
curl -X POST http://localhost:8000/api/v2/user/register \
  -F "username=johndoe" \
  -F "email=john@example.com" \
  -F "fullname=John Doe" \
  -F "password=SecurePass123" \
  -F "avatar=@/path/to/your/avatar.jpg"
```

Login:

```bash
curl -X POST http://localhost:8000/api/v2/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123"}'
```

---

## API Endpoints

All endpoints start with `/api/v2`

**Authentication (no login needed):**

- Register: `POST /user/register`
- Login: `POST /user/login`
- Refresh Token: `POST /user/refresh-token`

**User stuff (login required):**

- Logout: `POST /user/logout`
- Change Password: `POST /user/change-password`
- Get Your Info: `GET /user/current-user-details`
- Update Profile: `PATCH /user/update-account`
- Change Avatar: `PATCH /user/update-avatar`
- Watch History: `GET /user/watch-history`

**Videos (login required):**

- Get All Videos: `GET /videos`
- Upload Video: `POST /videos`
- Get One Video: `GET /videos/:videoId`
- Update Video: `PATCH /videos/:videoId`
- Delete Video: `DELETE /videos/:videoId`
- Publish/Unpublish: `PATCH /videos/toggle/publish/:videoId`

**Social Features (login required):**

- Add Comment: `POST /comments/:videoId`
- Like Video: `POST /likes/toggle/v/:videoId`
- Subscribe: `POST /subscriptions/c/:channelId`
- Create Tweet: `POST /tweets`

And many more! Check out the full API documentation for details.

---

## How it keeps your data safe

Security was a priority when building this:

**Passwords:**

- Never stored in plain text
- Encrypted with bcrypt (industry standard)
- Need your old password to change to a new one

**Login System:**

- Uses JWT tokens (like a digital ID card)
- Tokens expire automatically
- Stored in secure HTTP-only cookies

**File Uploads:**

- Checks file size and type
- Validates everything before accepting
- Stores in cloud (not on the server)

**Database:**

- All queries use Prisma (prevents SQL injection)
- Input validation on every request
- Proper permissions (you can only edit your own stuff)

---

## Want to deploy it?

You can host this on:

- Render
- Railway
- Heroku
- AWS
- Any platform that supports Node.js

**For the database:** Use Neon, Supabase, or Railway (they have free tiers!)

**For media files:** Cloudinary has a generous free plan

---

## Contributing

Found a bug? Want to add a feature? Pull requests are welcome!

1. Fork this repo
2. Create your feature branch
3. Make your changes
4. Push and create a pull request

---

## Questions?

- Check the [API Documentation](./API_DOCUMENTATION.md) for endpoint details
- Look at the [PRD](./PRD.md) for feature specs
- Open an issue on GitHub if you need help

---

## License

This project is open source under the ISC License.

---

## About

Built by **Nishant Sharma**

GitHub: [@Nishant-444](https://github.com/Nishant-444)

If this helped you learn something or you're using it in your project, consider giving it a star!

---

**Made with TypeScript, Node.js, Express, PostgreSQL, and Prisma**

- [ ] Swagger/OpenAPI documentation
- [ ] GraphQL API option
- [ ] Microservices architecture

---

## Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the **ISC License**.

---

## ‍ Author

**Nishant Sharma**

- GitHub: [@Nishant-444](https://github.com/Nishant-444)
- Project: [VizTube](https://github.com/Nishant-444/Viztube)

---

## Acknowledgments

- Express.js team for the excellent framework
- Prisma team for the amazing ORM
- PostgreSQL community
- Cloudinary for media management
- TypeScript team for type safety

---

## Show Your Support

If this project helped you or you found it interesting, please consider giving it a on GitHub!

---

**Built with using TypeScript, Node.js, Express, PostgreSQL, and Prisma**
