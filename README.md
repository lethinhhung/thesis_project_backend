# E-Learning Platform Backend (Ongoing)

Backend API for the e-learning platform, built with Express.js and MongoDB.

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

5. Start development server
```bash
npm run dev
# or
yarn dev
```

Server will run on [http://localhost:5000](http://localhost:5000)

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
