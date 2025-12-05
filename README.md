# School Management Mobile App

## 1. Project Overview
A comprehensive School Management Mobile App that connects Admin, staffs, Students, and Parents.
The app helps manage attendance, fees, homework, exams, communication, and more.

## Tech Stack
- **Frontend**: React Native (Expo)
- **Backend**: Node.js + Express + MongoDB

## ✅ Implemented Features

### Admin Module
- ✅ **Dashboard** - Overview with quick access to all modules
- ✅ **Class Management** - Create, view, edit, and delete classes
- ✅ **Subject Management** - Manage subjects and assign codes
- ✅ **Student Management** - Add students, assign to classes, manage profiles
- ✅ **staff Management** - Add staffs, assign subjects
- ✅ **Attendance System** - Mark daily attendance for classes
- ✅ **Fee Management** - Create fees, track payments, mark as paid
- ✅ **Homework Module** - Assign homework to classes with due dates
- ✅ **Notice System** - Send announcements to students, staffs, parents

### Authentication
- ✅ **Login System** - JWT-based authentication
- ✅ **Role-based Access** - Admin, staff, Student, Parent roles
- ✅ **Secure Password** - Bcrypt password hashing

### Database Models
- ✅ User (Admin, staff, Student, Parent)
- ✅ Class
- ✅ Subject
- ✅ Attendance
- ✅ Fee
- ✅ Homework
- ✅ Notice

## How to Run

### Backend
1. Navigate to `backend` folder: `cd backend`
2. Install dependencies (if not already): `npm install`
3. Start the server: `npm run dev` (for development) or `npm start`
4. Server runs on `http://localhost:5000`

### Frontend
1. Navigate to `frontend` folder: `cd frontend`
2. Install dependencies (if not already): `npm install`
3. Start the app: `npx expo start`
4. Scan the QR code with Expo Go app on your phone or run on emulator.

## Default Login Credentials
- **Email**: admin@school.com
- **Password**: admin123

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Classes
- GET `/api/classes` - Get all classes
- POST `/api/classes` - Create class
- DELETE `/api/classes/:id` - Delete class

### Subjects
- GET `/api/subjects` - Get all subjects
- POST `/api/subjects` - Create subject
- DELETE `/api/subjects/:id` - Delete subject

### Students
- GET `/api/students` - Get all students
- POST `/api/students` - Create student
- PUT `/api/students/:id` - Update student
- DELETE `/api/students/:id` - Delete student

### staffs
- GET `/api/staffs` - Get all staffs
- POST `/api/staffs` - Create staff
- PUT `/api/staffs/:id` - Update staff
- DELETE `/api/staffs/:id` - Delete staff

### Attendance
- GET `/api/attendance` - Get attendance records
- POST `/api/attendance` - Mark attendance
- GET `/api/attendance/student/:studentId` - Get student attendance history

### Fees
- GET `/api/fees` - Get all fees
- POST `/api/fees` - Create fee
- PUT `/api/fees/:feeId/payment` - Update fee payment
- DELETE `/api/fees/:feeId` - Delete fee
- GET `/api/fees/stats` - Get fee statistics

### Homework
- GET `/api/homework` - Get all homework
- POST `/api/homework` - Create homework
- PUT `/api/homework/:id` - Update homework
- DELETE `/api/homework/:id` - Delete homework

### Notices
- GET `/api/notices` - Get all notices
- POST `/api/notices` - Create notice
- PUT `/api/notices/:id` - Update notice
- DELETE `/api/notices/:id` - Delete notice

## Features in Detail

### 🏫 Class Management
- Create classes with grade and section
- Assign class staffs
- View all classes in a clean card layout
- Delete classes with confirmation

### 📚 Subject Management
- Add subjects with unique codes
- Assign subjects to staffs
- View subject list
- Delete subjects

### 👨‍🎓 Student Management
- Add students with complete profile
- Assign students to classes
- Edit student information
- Delete students
- View student list with class information

### 👨‍🏫 staff Management
- Add staffs with credentials
- Assign multiple subjects to staffs
- View staffs with assigned subjects
- Edit staff profiles
- Delete staffs

### 📋 Attendance System
- Select class to mark attendance
- Mark students as Present/Absent
- Submit attendance for the day
- View attendance history
- Date-wise attendance tracking

### 💰 Fee Management
- Create fees for students
- Set due dates
- Track payment status (Paid/Pending)
- Mark fees as paid
- View fee statistics
- Generate fee reports

### 📝 Homework Module
- Assign homework to classes
- Set due dates
- Add descriptions
- Link to subjects
- View all homework
- Delete homework

### 📢 Notice System
- Create announcements
- Target specific audiences (Student/staff/Parent/Admin)
- View all notices
- Delete notices
- Show author and date

## 🎨 UI/UX Features
- Modern, clean interface with blue & white theme
- Card-based layouts
- Modal forms for data entry
- Horizontal scrollable pickers
- Multi-select options
- Status badges and tags
- Empty states with helpful messages
- Loading states
- Confirmation dialogs
- Shadow effects and elevation
- Responsive design

## Future Enhancements
- Exam & Result Management
- Parent Dashboard
- Student Dashboard
- staff Dashboard
- Push Notifications
- File Upload for Homework
- Report Card Generation
- Timetable Management
- Bus Tracking
- Chat System
- Analytics Dashboard

