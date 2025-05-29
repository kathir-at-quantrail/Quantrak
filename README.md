# 📊 Quantrak - Employee Attendance Tracking System

## 🚀 Introduction
Quantrak is a **full-stack web application** designed for employee attendance management, developed as a mini-project during my internship at Quantrail Data. This system provides seamless attendance tracking, leave management, and analytics for both employees and administrators.

![Tech Stack](https://img.shields.io/badge/Full_Stack-React.js_+_Node.js_+_PostgreSQL-blue)

---

## 🛠 Tech Stack

### Frontend
- ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
- ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
- ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
- ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)

### Backend
- ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
- ![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

### Database & Authentication
- ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
- ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
- ![Google OAuth](https://img.shields.io/badge/Google_OAuth-4285F4?style=for-the-badge&logo=google&logoColor=white)

---

## 📁 Project Structure

### Frontend (Client)
```
client/
├── public/
│ ├── index.html                             # Main HTML file
│ ├── favicon.ico                            # favicon logo
│ └── logo.png                               # Logo image
├── src/
│ ├── common/             
│ │ ├── Footer.jsx                           # Website footer
│ │ └── Navbar.jsx                           # Website navbar
│ ├── components/
│ │ ├── Admin/
│ │ │ ├── Admin.jsx                          # Main Admin code
│ │ │ ├── AdminRoute.js                      # Handles the admin routes authorization
│ │ │ ├── AdminAddUser/
│ │ │ │ ├── AdminAddUser.jsx                 # Main code for admin add users functionality
│ │ │ │ ├── AdminUserDetail.jsx              # Displays the users' detail in a tabular format
│ │ │ │ └── AdminUserManagement.jsx          # Adding uSers and managing them
│ │ │ └── AdminUserAnalytics/
│ │ │ ├── AdminLocalHoliday.jsx              # Admin specifies the local holiday
│ │ │ ├── AdminUserAnalytics.jsx             # User Analytics is displayed and compared for admin
│ │ │ └── AdminUserAttendance.jsx            # USer Attendance graph and stats are viewed by the admin
│ │ ├── Home/
│ │ │ ├── Home.jsx                           # Home page of the website
│ │ │ └── UserAttendance.jsx                 # USer Attendance detailes displayed in the home page
│ │ └── Login/
│ │ ├── ForgotPass.jsx                       # Forgot Password section
│ │ ├── Login.jsx                            # Login page
│ │ └── ProtectedRoute.js                    # Routes for login and homne are routed proeprly for undefined paths           
│ ├── context/
│ │ ├── AuthAwareRedirect.js                 # Redirection of undefined path
│ │ └── AuthContext.js                       # Authcontext for the website
│ ├── utils/
│ │ └── api.js                               # Api part which connects with the backend of the website
│ ├── App.js                                 # Main React app component with app routes
│ ├── index.css                              # Global styles 
│ └── index.js                               # Entry point for React
├── .gitignore
├── package-lock.json
 package.json
├── tailwind.config.js
└── vercel.json
```
### Backend (Server)
```
server/
├── middleware/
│ └── auth.js                                # Middleware for authorization for users
├── routes/
│ ├── attendance.js                          # Routes for attendace , leave and local holidays backend functioning
│ └── users.js                               # Routes for users profile , add/edit/delete user backend functioning
├── db.js                                    # Database for connecting supabase
├── package-lock.json
├── package.json
├── server.js                                # Entry point for the backend server
└── vercel.json
```
---

## 📦 Dependencies

### Frontend (Client)
```json
"dependencies": {
  "@headlessui/react": "^2.2.4",             // Unstyled accessible UI components like modals, menus.
  "@react-oauth/google": "^0.12.2",          // Google OAuth login integration for React apps.
  "axios": "^1.9.0",                         // Promise-based HTTP client for API requests.
  "chart.js": "^4.4.9",                      // Charting library for creating responsive graphs.
  "jwt-decode": "^4.0.0",                    // Decodes JWT tokens to access payload data.
  "react": "^19.1.0",                        // Core library for building user interfaces.
  "react-chartjs-2": "^5.3.0",               // React wrapper for using Chart.js as components.
  "react-datepicker": "^8.3.0",              // React date picker component with custom styling.
  "react-dom": "^19.1.0",                    // Renders React components into the DOM.
  "react-icons": "^5.5.0",                   // Popular icons as React components.
  "react-router-dom": "^7.6.0",              // Client-side routing for single-page apps.
  "react-tabs": "^6.1.0"                     // Accessible tabbed interfaces for React.
}
```

### Backend (Server)
```json
"dependencies": {
  "@supabase/supabase-js": "^2.49.5",        // Client library to interact with Supabase services.
  "bcryptjs": "^3.0.2",                      // Library to hash and compare passwords securely.
  "cors": "^2.8.5",                          // Middleware to enable Cross-Origin Resource Sharing.
  "dotenv": "^16.5.0",                       // Loads environment variables from a .env file.
  "express": "^5.1.0",                       // Minimal and flexible Node.js web application framework.
  "google-auth-library": "^9.15.1",          // Google API and OAuth 2.0 authentication library.
  "jsonwebtoken": "^9.0.2"                   // Creates and verifies JSON Web Tokens (JWTs).
}
```
## 🎯 Key Features

### 👨‍💼 Employee Features
- **Secure Authentication** with Email/Password or Google OAuth  
- **Password Recovery** via Forgot Password functionality  
- **Attendance Marking** for current date only  
- **Leave Application** with start and end dates  
- **Leave History** tracking with system-generated missed days  
- **Personal Statistics** showing working days, present days, and failed attendance  
- **Local Holiday Calendar** displaying company holidays  
- **Weekly Analytics** with graphical representation of attendance  

### 👨‍💻 Admin Features
- **User Management**  
  - Add new employees with profile details  
  - Edit existing employee information  
  - Set initial passwords for new users  
- **Comprehensive Analytics**  
  - Individual user attendance statistics  
  - Comparative analytics between users  
  - Filter by job position  
- **Holiday Management**  
  - Add local holidays with date ranges  
  - Edit holidays until their end date  
  - View holiday history  

## 🔧 System Logic

### Attendance Tracking
- Employees can mark attendance only for the current date  
- System automatically tracks:  
  - Present days (marked attendance)  
  - Leave days (approved leaves)  
  - Failed attendance (neither marked nor on leave)  

### Leave Management
- Employees apply for leave with start and end dates  
- System validates leave applications  
- Leave history shows all past leaves with status  

### Analytics
- Employees see their personal attendance graphs  
- Admins can compare attendance across teams/positions  
- Data visualized using Chart.js for better insights  

## 🎉 Conclusion
Quantrak provides a comprehensive solution for employee attendance tracking with intuitive interfaces for both employees and administrators. The system ensures accurate record-keeping while offering valuable insights through detailed analytics.  

💡 **Note:** This is a mini-project demonstrating full-stack development capabilities and is not a production-ready system.  

## 🌐 Check the Live App  
[Click here to view the app on Vercel!](https://quantrak.vercel.app)
