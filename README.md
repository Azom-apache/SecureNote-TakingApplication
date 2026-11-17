# SecureNote-TakingApplication
# SecureNote-TakingApplication
The backend lives under /var/www/html/secure-note-app/src/ — a Node.js + Express REST API.

Piece	Path
Entry point
src/server.js — starts the server and connects to MongoDB
HTTP app
src/app.js — middleware and mounts /api/*
Routes
src/routes/ — authRoutes, noteRoutes, userRoutes, postRoutes
Logic
src/controllers/
Data
src/models/ (Mongoose)
Auth
src/middleware/
DB config
src/config/database.js
API base when running: http://127.0.0.1:5000/api/... (port from .env).

Start it with:


cd /var/www/html/secure-note-app
npm run dev


Layer	Technology
Runtime
Node.js (CommonJS)
API
Express 5
Database
MongoDB with Mongoose
Auth
JWT + bcryptjs
Frontend
Plain HTML/CSS/vanilla JavaScript in public/ (served by Express)