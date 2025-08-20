# Technical Documentation

## Installation & Configuration Guide
This document provides instructions for setting up the development environment for the webshop application.

# Overview
## 1. The project consists of two main parts:
- Backend: A Node.js server using the Express framework, with MongoDB as the database via Mongoose. It handles all business logic, API endpoints, and authentication. 
- Frontend: A modern, standalone Vue.js single-page application (SPA) built with Vite. You have separate frontend applications for the customer-facing shop and the admin panel, but the setup process is the same.
## 2. Prerequisites
Before you begin, ensure you have the following software installed on your machine:
- Node.js: LTS version (18.x or later is recommended).
- npm or yarn: A Node.js package manager (this guide will use npm).
- MongoDB: A running MongoDB instance. This can be a local MongoDB Community Server or a cloud-based service like MongoDB Atlas.
- Git: For cloning the project repository.
### 3. Backend Setup (/server)
The backend server is the core of your application.
### step 3.1. Install Dependencies 
Navigate into the server directory and install the required npm packages.
````
 cd /path/to/your/project/server
 npm install
````
### step 3.2. Configure Environment Variables

The server relies on a .env file for all its sensitive configuration. 
Create a new file named **.env** in the /server directory and copy the following content into it.
````
File: /server/.env
# --- MongoDB Configuration ---
# Your database connection string.
# For a local DB: MONGO_URI=mongodb://127.0.0.1:27017/yourshopdb
# For Atlas, use the connection string they provide.
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/yourshopdb

# --- Authentication ---
# A long, random, and secret string used to sign JSON Web Tokens (JWT).
# Use a strong password generator to create this.
JWT_SECRET=your_super_long_and_secret_jwt_string_here

# --- Server Port ---
# The port the backend server will run on.
PORT=3000

# --- Email (Nodemailer SMTP) Configuration ---
# These credentials are used by the email service.
# Example uses Gmail with an App Password. Replace with your provider's details.
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=465
EMAIL_USERNAME="your.email@gmail.com"
EMAIL_PASSWORD="your-16-character-app-password"
EMAIL_FROM_NAME="Rippels PaperLover"
EMAIL_FROM_ADDRESS="your.email@gmail.com"
````
### step 3.3 Running the Backend Server
Your package.json should have a script to run the server with nodemon for automatic restarts during development.
 This will start the backend server, typically on http://localhost:3000
````
npm run dev
````

## 4. Frontend Setup (/admin or /shop)
The setup process is identical for both the admin panel and the customer-facing shop.
### Step 4.1: Install Dependencies
Open a new terminal window, navigate into the specific frontend directory you want to run (e.g., /admin), and install its dependencies.
````
# For the admin panel:
cd /path/to/your/project/admin
npm install

# For the shop (in a separate terminal):
# cd /path/to/your/project/shop
# npm install
````
### Step 4.2: Configure Environment Variables
The frontend needs to know where the backend API is located. 
Create a .env file in the root of your frontend directory (/admin or /shop).
````
File: /admin/.env
# This variable tells the Vue app the base URL of the backend API.
VITE_API_URL=http://localhost:3000/api

````
### Step 4.3: Running the Frontend Development Server
The Vue.js project uses Vite, which provides a fast and modern development server.
````
# This will start the frontend app, typically on http://localhost:5173
npm run dev
````
## 5. Putting It All Together
At this point, you should have:
- A running MongoDB database.
- One terminal running the backend server (on localhost:3000).
- Another terminal running the frontend application (on localhost:5173).
You can now open your browser and navigate to http://localhost:5173 to view and interact with the application. 
The frontend will make API calls to the backend to fetch and save data.
## 6. Key Dependencies Overview
This section provides a brief overview of the key technologies used in the project.
### Backend (server):
- express: The web server framework for Node.js.
- mongoose: An Object Data Modeler (ODM) for elegant interaction with the MongoDB database.
- jsonwebtoken & bcryptjs: Used for user authentication and password hashing.
- nodemailer: The library used for sending all system emails (e.g., order confirmations)
- ejs: The templating engine used to render the database-driven email templates.
- dotenv: Manages loading environment variables from the .env file.
- crypto: A built-in Node.js module used to generate secure random tokens for guest order confirmations.
### Frontend (admin/shop):
- vue: The core frontend framework for building the user interface.
- vite: The modern build tool and development server for the frontend.
- vue-router: Handles all client-side routing and navigation between pages.
- pinia: The official state management library for Vue.js, used for managing the shopping cart and user authentication state.
- bootstrap: The CSS framework used for styling the user interface.
