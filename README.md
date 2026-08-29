# Real-Time Chat App (with MongoDB & Auth)

An interactive, real-time chat application styled with a dark, Discord-inspired UI. Users can register accounts, log in, create custom chat rooms, copy and share Room IDs, chat in real-time, and see typing indicators and user presence states. 

---

## 🛠️ Key Showcase Features

*   **👤 JWT User Authentication:** Secure register/login flow using `bcrypt` password hashing and `jsonwebtoken` session tokens. Only logged-in users can participate in chat rooms.
*   **💾 Database Persistence:** All active rooms and messages are stored in MongoDB.
*   **🧹 Auto-Clean TTL index:** Integrated automatic garbage collection. Messages older than **48 hours** are deleted from MongoDB automatically via a TTL index to ensure free-tier database limits are never exceeded.
*   **⚡ WebSocket Event-Driven HUD:** Real-time presence indicators (online bubble) and live typing HUD alerts ("X is typing...") powered by Socket.IO.
*   **🔗 Room Joining:** Generate and copy a unique Room ID with one click, allowing other logged-in users to join instantly by pasting the code in their sidebar.

---

## 🔑 Required Environment Variables (ENV Setup)

Create a `.env` file in the server folder. The client will load properties dynamically or fall back to localhost.

### Server Environment Variables (`/server/.env`)
```env
PORT=4000
HOST=localhost
CORS_ORIGIN=http://localhost:1234
DB_URI=mongodb://localhost:27017/chat-app
JWT_SECRET=your_secret_jwt_key_here
```
*Note: For remote showcase deployment, set `DB_URI` to your MongoDB Atlas connection string and `CORS_ORIGIN` to your deployed client domain.*

---

## 🚀 How to Run the Project Locally

Ensure you have **Node.js** and **Yarn** installed. Make sure your local MongoDB service is running (`mongod`).

### Step 1: Run the Backend Server
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Start the server:
   ```bash
   yarn dev
   ```
   The server will start listening at `http://localhost:4000`.

### Step 2: Run the Frontend Client
1. Navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Start the client (uses Parcel):
   ```bash
   yarn start
   ```
   The client will compile and open at `http://localhost:1234`.
