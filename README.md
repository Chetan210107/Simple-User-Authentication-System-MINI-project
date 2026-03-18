# 🎓 Simple User Authentication System & CDS Quiz App

A robust **MERN stack** (MongoDB, Express, React, Node.js) application featuring a highly secure user authentication gateway integrated with a real-time academic integrity monitoring system.

---

## 🎯 Features

### 🔐 User Authentication Features
- **JWT-Based Security**: Implements JSON Web Tokens for secure session management and stateless authentication
- **Per-User Visibility Toggle**: Admins can manage student privacy using a unique "eye" icon to unmask passwords only when necessary
- **Role-Based Access Control (RBAC)**: Strict separation of privileges between Students and Admins to ensure data integrity
- **Cascade Data Purge**: Deleting a user account automatically triggers a full cleanup of all associated sessions and violation logs
- **Secure Password Reset**: Email-based password recovery with token verification
- **Student OTP Login (Email)**: Students authenticate via OTP (`/api/auth/send-otp` + `/api/auth/verify-otp`) before receiving a JWT

### 🧠 Quiz App & Anti-Cheat Features
- **Real-Time Event Monitoring**: Detects tab switching (visibilitychange) and window minimizing (blur)
- **Admin-Mediated 3-Strike System**: When a student commits 3 integrity violations, an admin instantly receives a real-time modal on the dashboard (WebSocket-powered)
- **10-Second Approval Countdown**: Admin has 10 seconds to make a decision (Block or Allow). Auto-blocks by default if admin doesn't respond
- **Dual Approval Paths**: 
  - **Block**: Student account is locked, receives forceLogout notification
  - **Allow**: Student receives approval notification and can continue quiz
- **Status Tracking**: SuspiciousActivity records track decision status (pending_admin, blocked, approved) with admin decision timestamps
- **Live Quiz Timer**: Real-time countdown with auto-submit functionality
- **Question Randomization**: Shuffled questions and answer options for each student
- **Detailed Result Analytics**: Score breakdown, grade calculation, and performance statistics

### 👨‍💼 Admin Management
- **System-Wide Dashboard**: View Total Users and Active Students at a glance
- **Real-Time Violation Alerts**: Instant modal notification when student reaches 3 strikes with auto-block countdown
- **Quick-Decision Interface**: One-click Block or Allow buttons with clear visual feedback
- **User Management**: Integrated controls for editing, locking, or permanently deleting user accounts
- **Security Auditing**: Review detailed logs of student behavior with decision status, timestamps, and approver information
- **Suspicious Activity Monitor**: Real-time dashboard showing violation counts, activity types, and approval status
- **Question Management (Admin Dashboard)**:
  - **Subjects dropdown** populated from MongoDB via `GET /api/questions/categories`
  - **Dark-themed table view**: Question Text, Options (A–D), Correct Answer
  - **Delete action**: `DELETE /api/questions/:id` (JWT-protected; Admin-only)
  - **“Add Question”** stays pinned top-right of the section

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js, Semantic UI React, React Toastify, CSS3 |
| **Backend** | Node.js, Express.js (RESTful APIs) |
| **Real-Time Communication** | Socket.io (WebSocket) for instant admin alerts |
| **Database** | MongoDB with Mongoose ODM |
| **Authentication** | JSON Web Tokens (JWT), bcrypt hashing |
| **Email Service** | Nodemailer (Password Reset) |

---

## 📂 Project Structure

```
quiz-app-master/
├── client/                          # React Frontend
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/              # Reusable React components
│   │   │   ├── AdminDashboard/      # Admin interface
│   │   │   ├── Login/               # Login component
│   │   │   ├── Signup/              # Registration component
│   │   │   ├── Quiz/                # Quiz interface
│   │   │   ├── Result/              # Results display
│   │   │   └── ...
│   │   ├── context/                 # User & Auth State Management
│   │   ├── utils/                   # Helper functions
│   │   ├── constants/               # App configurations
│   │   └── index.js                 # App entry point
│   ├── package.json
│   └── README.md
│
├── server/                          # Node.js/Express Backend
│   ├── models/                      # Database schemas
│   │   ├── User.js                  # User schema
│   │   ├── Question.js              # Question schema
│   │   └── SuspiciousActivity.js    # Activity logs
│   ├── controllers/                 # Business logic
│   │   ├── auth.js                  # Authentication logic
│   │   ├── admin.js                 # Admin operations
│   │   └── teacher.js               # Teacher operations
│   ├── routes/                      # API endpoints
│   │   ├── auth.js
│   │   ├── admin.js
│   │   └── teacher.js
│   ├── middleware/                  # Auth middleware
│   ├── utils/                       # Helper utilities
│   ├── config/                      # Database config
│   ├── index.js                     # Server entry point
│   └── package.json
│
├── .gitignore                       # Root ignore rules
└── package.json                     # Root package file
```

---

## 🚀 Getting Started

Follow these steps to set up the Simple User Authentication System & CDS Quiz App on your local machine.

1. **Environment Preparation**
   - **Administrative Privileges**: Open PowerShell as an Administrator to ensure the script has the necessary permissions to manage system services.
   - **Directory Navigation**: Navigate to the project root folder using the following path: ( This Is Example )
     ```powershell
     cd C:\Users\Admin\Downloads\quiz-app-master\quiz-app-master
     ```

2. **Dependency Installation**
   - **Core Requirements**: Install all necessary frontend and backend libraries by running:
     ```powershell
     npm install
     ```
   - *Note*: This command reads the root `package.json` to configure the MERN environment.

3. **Database & Backend Activation**
   - **Start MongoDB Service**: Before launching the app, ensure your local MongoDB database is active by running:
     ```powershell
     net start MongoDB
     ```
   - This service is required to handle the User Authentication and Suspicious Activity logs.

4. **Launching the Application**
   - **Start the App**: Execute the following command to boot up both the React frontend and the Express backend simultaneously:
     ```powershell
     npm start
     ```
   - **Accessing the App**: Once initialized, open your browser and navigate to `http://localhost:3000`.

### 🛡️ Post-Installation Verification
- **Check Admin Login**: Use your admin credentials to verify the User Credentials panel and the eye-toggle feature.
- **Test Admin Alert Flow**: 
  1. Have a student open the quiz
  2. Trigger 3 violations (tab-switch 3 times)
  3. Admin should see a modal pop-up with countdown
  4. Admin clicks Block or Allow to test the decision flow
- **Test Decision Notifications**: Verify the student receives the correct notification (logged out or approved)

---

### Prerequisites
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (Local instance or Atlas URI) - [Setup Guide](https://www.mongodb.com/docs/manual/installation/)
- **Git** - [Download](https://git-scm.com/)
- **Code Editor** (VS Code recommended)

### Installation

> **Quick start (PowerShell)**
> 1. Open PowerShell **as Administrator**
> 2. Navigate to the project folder:
>    ```powershell
>    cd C:\Users\Admin\Downloads\quiz-app-master\quiz-app-master
>    ```
> 3. Install all required packages (backend + frontend):
>    ```powershell
>    npm install          # runs in root if you have a preinstall script
>    # or cd server; npm install && cd ..\client; npm install
>    ```
> 4. Start MongoDB service:
>    ```powershell
>    net start MongoDB
>    ```
> 5. Run the application:
>    ```powershell
>    npm start            # starts frontend; backend can be run separately
>    ```
> 6. (Optional) In another admin shell start the backend explicitly:
>    ```powershell
>    cd server && npm run dev
>    ```

#### Step 1: Clone the Repository
```bash
git clone https://github.com/Chetan210107/Simple-User-Authentication-System-MINI-project.git
cd quiz-app-master
```

#### Step 2: Install Backend Dependencies
```bash
cd server
npm install
```

#### Step 3: Setup Environment Variables
Create a `.env` file in the **server** folder with the following:

```env
MONGO_URI=mongodb://localhost:27017/cds_quiz_db
JWT_SECRET=your_jwt_secret_key_here
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
OTP_EXPIRY_MINUTES=5
PORT=5001
```

**Note**: For MongoDB Atlas, use: `mongodb+srv://username:password@cluster.mongodb.net/quiz-app`

#### Step 4: Install Frontend Dependencies
```bash
cd ../client
npm install
```

---

## ▶️ Running the Application

### Option A: Run Backend & Frontend Separately (Recommended)

#### Terminal 1 - Start Backend Server
```bash
cd server
npm start
```
✅ Backend will run on: `http://localhost:5001`

#### Terminal 2 - Start Frontend App
```bash
cd client
npm start
```
✅ Frontend will open on: `http://localhost:3000`

### Option B: Run Both Concurrently (if configured)
```bash
npm run dev
```

### (Optional) Seed Questions into MongoDB
If your questions currently live in `client/src/components/Quiz/mock.json`, import them into MongoDB so the Admin/Teacher dashboards can manage them:

```bash
cd server
npm run seed:mock
```

---

## 📋 Default Credentials for Testing

**Note**: Create your own user accounts through the Signup page for better testing.

---

## 🧪 API Endpoints Reference

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register new user |
| POST | `/login` | User login |
| POST | `/send-otp` | Send OTP to student email |
| POST | `/verify-otp` | Verify OTP and issue JWT |
| POST | `/logout` | User logout |
| POST | `/forgot-password` | Request password reset |
| POST | `/reset-password` | Reset password with token |

### Admin Routes (`/api/admin`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | Get all users |
| PUT | `/users/:id` | Update user details |
| DELETE | `/users/:id` | Delete user account |
| GET | `/suspicious-activities` | Get aggregated activity logs |
| PUT | `/suspicious-activities/:activityId/decide` | Admin approval/block decision (block \| approve) |
| PUT | `/users/:id/block` | Block a user account |
| PUT | `/users/:id/unblock` | Unblock a user account |
| PUT | `/users/:id/reset-cheat-flag` | Clear cheated flag |

### Quiz Routes (`/api/teacher`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/questions` | Fetch quiz questions |
| GET | `/questions/subjects` | Fetch all unique subjects |
| POST | `/submit-quiz` | Submit quiz answers |
| GET | `/results/:id` | Get quiz results |

### Question Management Routes (`/api/questions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | Fetch all unique categories (Teacher/Admin) |
| DELETE | `/:id` | Delete a question (Admin-only) |

---

## 🛡️ Security Features

### Authentication & Authorization
- ✅ JWT token-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcryptjs
- ✅ Protected API endpoints with middleware

### Data Protection
- ✅ Encrypted password storage
- ✅ Secure token expiration
- ✅ CORS enabled for frontend-backend communication
- ✅ Environment variables for sensitive data

### Academic Integrity
- ✅ Real-time tab switching detection
- ✅ Window blur/focus monitoring
- ✅ 3-strike violation system with admin review
- ✅ Admin-mediated approval flow with WebSocket notifications
- ✅ Auto-block default on admin timeout (10 seconds)
- ✅ Detailed activity logging with decision tracking and timestamps
- ✅ Real-time student notification of admin decisions

### Database Security
- ✅ Cascade deletion for data cleanup
- ✅ MongoDB connection string protection
- ✅ Role-based data access

---

## 📸 Key Features Showcase

### For Students
- 🔑 Create account and login securely
- 📝 Take timed quizzes with randomized questions
- 📊 View detailed results and performance analytics
- 🔄 Retake quizzes multiple times
- 🔒 Password recovery option

### For Admins
- 👥 Manage user accounts (create, edit, delete)
- 👁️ View student passwords with permission toggle
- 📋 Monitor suspicious activity in real-time
- ⚡ Receive instant alert modals when students reach 3 strikes
- ⏱️ Make quick block/approve decisions with 10-second countdown
- 🚫 Lock accounts or clear violation flags
- 📊 Review decision history with timestamps and approver info
- 📈 View system-wide statistics and audit trails

---

## 🐛 Troubleshooting

### Backend Issues
| Problem | Solution |
|---------|----------|
| `Cannot connect to MongoDB` | Verify MongoDB is running and MONGO_URI is correct |
| `JWT_SECRET is undefined` | Add JWT_SECRET to your .env file |
| `Port 5000 already in use` | Change PORT in .env or kill process on port 5000 |
| `Email not sending` | Enable "Less secure app access" or use App Passwords for Gmail |

### Frontend Issues
| Problem | Solution |
|---------|----------|
| `npm install fails` | Delete node_modules and package-lock.json, then reinstall |
| `Port 3000 already in use` | Run `npm start -- --port 3001` or kill process on port 3000 |
| `Blank white screen` | Check browser console for errors, clear cache and restart |
| `Cannot reach backend` | Ensure backend is running on http://localhost:5000 |

---

## 📚 Available Scripts

### Backend Scripts (in `/server`)
```bash
npm start            # Start server normally
npm run seed:mock    # Import questions from client mock.json into MongoDB
```

### Frontend Scripts (in `/client`)
```bash
npm start            # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run eject        # Eject from Create React App (⚠️ irreversible)
```

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit changes: `git commit -m "Add YourFeature"`
4. Push to branch: `git push origin feature/YourFeature`
5. Submit a Pull Request

---

## 📝 License

This project is licensed under the **MIT License** - see the LICENSE file for details.

---

## 👨‍💻 Developer

**Chetan** - [GitHub Profile](https://github.com/Chetan210107)

---

## 📞 Support & Contact

- 📧 Email: chetan210107@gmail.com
- 🐙 GitHub Issues: [Report Issues](https://github.com/Chetan210107/Simple-User-Authentication-System-MINI-project/issues)
- 💬 Discussions: [Ask Questions](https://github.com/Chetan210107/Simple-User-Authentication-System-MINI-project/discussions)

---

## 🎓 Learning Resources

- [MERN Stack Tutorial](https://www.freecodecamp.org/news/the-mern-stack-tutorial/)
- [JWT Authentication](https://jwt.io/introduction)
- [MongoDB Basics](https://docs.mongodb.com/manual/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)

---

## ⭐ Show Your Support

If you found this project helpful, please consider giving it a ⭐ on GitHub!

---

**Made with ❤️ by Chetan**

