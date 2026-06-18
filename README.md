# BidHub — Online Auction System

A full-stack real-time auction platform built with the MERN stack, Socket.IO, and a Python ML microservice.

## Features

- Real-time bidding with live price updates via Socket.IO
- JWT authentication with bcrypt password hashing
- AI-powered price prediction for new listings (Random Forest model)
- Auto-bid agent — set a max budget, system bids automatically
- Live countdown timers on all auctions
- Seller and buyer dashboards
- Auction auto-close via cron job

## Tech Stack

| Layer      | Technology                     |
| ---------- | ------------------------------ |
| Frontend   | React, Socket.IO client, Axios |
| Backend    | Node.js, Express, Socket.IO    |
| Database   | MongoDB Atlas, Mongoose        |
| ML Service | Python, Flask, scikit-learn    |
| Auth       | JWT, bcryptjs                  |

## Running Locally

### 1. Backend

cd server, npm install, create .env with PORT + MONGO_URI + JWT_SECRET, npm run dev

### 2. ML Service

cd ml, python3 -m venv venv, source venv/bin/activate
pip install flask flask-cors scikit-learn pandas numpy
python3 generate_data.py && python3 train.py && python3 app.py

### 3. Frontend

cd client, npm install, npm start

## Author

Shreya Jadhav — B.Tech Computer Engineering, MKSSS Cummins College of Engineering for Women, Pune
