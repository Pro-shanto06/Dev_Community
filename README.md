# Dev Community API

## Overview
The Dev Community API is a RESTful service built with NestJS, MongoDB, and JWT for authentication. It enables users to manage posts and comments, and includes functionality for creating, updating, retrieving, and deleting posts and comments.

## Features
- User authentication and registration.
- Create, update, retrieve, and delete posts.
- Comment on posts, update, retrieve, and delete comments.

## Technologies Used
- Backend: NestJS
- Database: MongoDB
- Authentication: JWT
- Validation: class-validator
- Password Hashing: bcryptjs

## Installation
Clone the repository:
1. **Clone the repository:**
  ```bash
  git clone https://github.com/Pro-shanto06/Dev_Community
  cd Dev_Community
   ```


2. **Install dependencies:**

```bash
npm install
 ```
3. **Set up environment variables:**

Create a .env file in the root directory and add the following:
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/ExpressMongoCRUD
JWT_SECRET=your_jwt_secret
 ```

4. **Start the server:**

```bash
npm run start
```

## API Endpoints

Register

URL: /auth/register
Method: POST
Request Body:
```json
{
    "fname": "Proshanto",
    "lname": "Saha",
    "email": "pro@gmail.com",
    "phone": "1234567890",
    "password": "Password123!"
}
```

Response:
```json
{
    "message": "User registered successfully"
}
```

Login

URL: /auth/login
Method: POST
Request Body:
```json
{
    "email": "pro@gmail.com",
    "password": "Password123!"
}
```
Response:
```json
{
    "accessToken": "jwt_token"
}
```

Post Management

Create Post

URL: /posts
Method: POST
Request Headers:
Authorization: Bearer <jwt_token>
Request Body:
```json
{
    "title": "My First Post",
    "content": "This is the content of my first post."
}
```
Response:
```json
{
    "title": "My First Post",
    "content": "This is the content of my first post.",
    "author": "user_id",
    "createdAt": "2024-08-06T12:00:00.000Z",
    "updatedAt": "2024-08-06T12:00:00.000Z"
}
```
Get All Posts

URL: /posts
Method: GET
Response:
```json
[
    {
        "title": "My First Post",
        "content": "This is the content of my first post.",
        "author": "user_id",
        "createdAt": "2024-08-06T12:00:00.000Z",
        "updatedAt": "2024-08-06T12:00:00.000Z"
    }
]
```
Get Post by ID

URL: /posts/:id
Method: GET
Response:
```json
{
    "title": "My First Post",
    "content": "This is the content of my first post.",
    "author": "user_id",
    "createdAt": "2024-08-06T12:00:00.000Z",
    "updatedAt": "2024-08-06T12:00:00.000Z"
}
```
Update Post

URL: /posts/:id
Method: PUT
Request Headers:

Authorization: Bearer <jwt_token>
Request Body:
```json
{
    "title": "Updated Title",
    "content": "Updated content."
}
```
Response:
```json
{
    "title": "Updated Title",
    "content": "Updated content.",
    "author": "user_id",
    "createdAt": "2024-08-06T12:00:00.000Z",
    "updatedAt": "2024-08-06T12:00:00.000Z"
}
```
Delete Post

URL: /posts/:id
Method: DELETE
Request Headers:
Authorization: Bearer <jwt_token>
Response:
```json
{
    "message": "Post deleted successfully"
}
```

Comment Management

Create Comment

URL: /posts/:postId/comments
Method: POST
Request Headers:
Authorization: Bearer <jwt_token>
Request Body:
```json
{
    "content": "This is a comment on the post."
}
```
Response:
```json
{
    "content": "This is a comment on the post.",
    "post": "post_id",
    "author": "user_id",
    "createdAt": "2024-08-06T12:00:00.000Z"
}
```
Get All Comments for Post

URL: /posts/:postId/comments
Method: GET
Response:
```json
[
    {
        "content": "This is a comment on the post.",
        "post": "post_id",
        "author": "user_id",
        "createdAt": "2024-08-06T12:00:00.000Z"
    }
]
```
Update Comment

URL: /comments/:id
Method: PUT
Request Headers:
Authorization: Bearer <jwt_token>
Request Body:
```json
{
    "content": "Updated comment content."
}
```
Response:
```json
{
    "content": "Updated comment content.",
    "post": "post_id",
    "author": "user_id",
    "createdAt": "2024-08-06T12:00:00.000Z"
}
```
Delete Comment

URL: /comments/:id
Method: DELETE
Request Headers:
Authorization: Bearer <jwt_token>
Response:
```json
{
    "message": "Comment deleted successfully"
}
```
