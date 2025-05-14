# AI-Powered Study Assistant Platform (Ongoing)

Backend API for personalized learning support platform with AI integration that helps students manage notes, track study progress, and generate quizzes or tests based on uploaded documents.

## Technologies Used

- [Express.js](https://expressjs.com/) - Web framework for Node.js
- [MongoDB](https://www.mongodb.com/) - NoSQL database
- [Mongoose](https://mongoosejs.com/) - MongoDB ODM
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
- [JWT](https://jwt.io/) - JSON Web Token authentication

## API Features

- Authentication & Authorization
- Course CRUD operations
- Lesson CRUD operations  
- Document CRUD operations
- File upload
- AI integration

## Installation

1. Clone repository
```bash
git clone <repository-url>
cd Backend
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Create environment file
```bash  
cp .env.example .env
```

4. Update environment variables in `.env`
Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=8080
NODE_ENV=development

# MongoDB Database
MONGO_DB_URL=mongodb+srv://your_username:your_password@mongodb_url/?retryWrites=true&w=majority&appName=Main

# Authentication
JWT_SECRET=your_jwt_secret

# Storage Configuration
SUPABASE_URL=hyour_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key
SUPABASE_LESSONS_BUCKET_NAME=lessons_bucket_name
SUPABASE_AVATARS_BUCKET_NAME=avatars_bucket_name
SUPABASE_IMAGES_BUCKET_NAME=images_bucket_name
SUPABASE_DOCUMENTS_BUCKET_NAME=documents_bucket_name

# Optional: External Services
(Under development)
```

6. Start development server
```bash
npm run dev
# or
yarn dev
```

Server will run on [http://localhost:8080](http://localhost:8080)

## Project Structure

```
Backend/
├── src/
│   ├── config/         # Database and service configs
│   ├── controllers/    # Route controllers
│   ├── interfaces/     # TypeScript interfaces
│   ├── middleware/     # Express middlewares 
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   └── utils/          # Utility functions
└── tests/             # Unit tests
```

## API Documentation

### Auth Routes
- POST `/api/auth/register` - Register new account
- POST `/api/auth/login` - Login
- POST `/api/auth/logout` - Logout

### User Routes
- GET `/api/user/profile` - Get user profile
- PUT `/api/user/update-profile` - Update user profile

### Course Routes
- GET `/api/course` - Get courses list
- POST `/api/course/create` - Create new course
- GET `/api/course/:id` - Get course details
- PUT `/api/course/:id` - Update course
- DELETE `/api/course/:id` - Delete course

### Lesson Routes
- GET `/api/lesson` - Get lessons list
- POST `/api/lesson/create` - Create new lesson
- GET `/api/lesson/:id` - Get lesson details
- PUT `/api/lesson/:id` - Update lesson  
- DELETE `/api/lesson/:id` - Delete lesson

### Document Routes
- GET `/api/document` - Get documents list
- POST `/api/document/create` - Upload new document
- GET `/api/document/:id` - Get document details 
- DELETE `/api/document/:id` - Delete document

### Upload Routes
- POST `/api/upload` - Upload file
