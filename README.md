# Qatan — Full-Stack E-Learning & Course Management Platform

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Chapa](https://img.shields.io/badge/Payment-Chapa%20Gateway-00C49F)](https://chapa.co/)
[![Cloudinary](https://img.shields.io/badge/Media-Cloudinary-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Discord](https://img.shields.io/badge/Integration-Discord.js-5865F2?logo=discord&logoColor=white)](https://discord.js.org/)

**Qatan** is a comprehensive, production-grade E-Learning and Online Academy platform built to deliver an end-to-end educational experience. It integrates role-based portals for students, instructors, and administrators, localized Ethiopian payment gateway processing (Chapa), cloud video streaming (Cloudinary), automated Discord community onboarding, and interactive assessment engines.

---

## 🏛️ System Architecture

```text
                                 +--------------------------------+
                                 |         Client Layer           |
                                 |  React 19 + Vite + TailwindCSS |
                                 +---------------+----------------+
                                                 |
                                         (REST API / JWT)
                                                 |
                                                 v
                                 +---------------+----------------+
                                 |         Server Layer           |
                                 |     Express.js Application     |
                                 +---------------+----------------+
                                                 |
                 +-------------------------------+-------------------------------+
                 |                               |                               |
                 v                               v                               v
    +------------+-----------+      +------------+-----------+      +------------+-----------+
    |       Prisma ORM       |      |    External Services   |      |  Community & Messaging |
    |  PostgreSQL Database   |      |  - Chapa API (Payments)|      |  - Discord Bot Service |
    |  (12 Relational Models)|      |  - Cloudinary (Media)  |      |  - Nodemailer / SMTP   |
    +------------------------+      +------------------------+      +------------------------+
```

---

## 🌟 Key Subsystems & User Portals

### 1. 🎓 Student Learning Portal (`/student`)
- **Interactive Course Player**: Structured modular lessons supporting high-definition video streaming and rich text reading.
- **Dynamic Lesson Progress**: Real-time completion tracking with persisted progress percentages and timestamps.
- **Assessment Engine**: Timed modular quizzes with multiple-choice questions, instant score calculation, and review logs.
- **Certificates & Completion**: Automatic course completion verification upon reaching 100% curriculum completion.
- **Direct Support & Messaging**: Built-in support form connected to administrative inboxes for student inquiries.

### 2. 👨‍🏫 Instructor Studio (`/instructor`)
- **Curriculum Authoring**: Multi-tier course structuring (Modules $\to$ Lessons $\to$ Quizzes) with drag-and-order capabilities.
- **Cloud Media Uploads**: Direct chunked media pipeline uploading thumbnails and video lectures to Cloudinary.
- **Quiz Management**: Creation of custom timed assessments with customizable passing criteria.
- **Student Analytics & Enrollment Metrics**: Overview of enrolled students, completion ratios, and total revenue share.
- **Instructor Application Workflow**: Public submission form with administrative review and automated passkey generation.

### 3. 🛡️ Admin Governance Suite (`/admin`)
- **Course Review Queue**: Moderation workflow allowing administrators to review, approve, or reject draft courses with feedback.
- **User & Role Administration**: Comprehensive management of Students, Instructors, and Administrators, including account suspensions and verification overrides.
- **Platform Financials**: Real-time transaction monitoring linked to Chapa payment references and transaction statuses.
- **Global Settings**: Control platform metadata, contact channels, and payment toggles.

### 4. 🌐 Public Experience & Authentication (`/`)
- Modern responsive landing page showcasing featured courses, categories, and instructor highlights.
- Secure authentication flow powered by **JWT** and **Bcrypt** password hashing.
- 6-digit email verification code modal on signup via **Nodemailer**.
- Password recovery and reset mechanisms with token expiration guards.

---

## 💳 Payment & Community Integrations

- **Chapa Payment Gateway**:
  - Direct checkout flow generating secure transaction references (`tx_ref`).
  - Webhook callback verification (`/api/transactions/verify-payment`) ensuring instant enrollment upon successful payment verification.
- **Discord Bot Automation**:
  - Automatically provisions students and instructors into designated Discord guild roles upon verification.
  - Generates course-specific private discussion channels for direct peer and instructor communication.

---

## 🗄️ Relational Database Schema (Prisma)

The application utilizes PostgreSQL managed through Prisma ORM across 12 relational models:

| Model | Purpose | Key Relationships |
| :--- | :--- | :--- |
| `User` | User accounts, authentication, profile metadata | Courses (Instructor), Enrollments, Progress, Quizzes, Transactions |
| `Course` | Course metadata, pricing, publication status | Modules, Quizzes, Enrollments, Transactions, Instructor (`User`) |
| `Module` | Course chapters/sections | Belongs to `Course`; has many `Lesson`, `Quiz` |
| `Lesson` | Individual educational units (video/text/media) | Belongs to `Module`; tracks `Progress` |
| `Quiz` | Assessment questionnaires with JSON questions | Belongs to `Course` / `Module`; records `QuizAttempt` |
| `QuizAttempt` | Student quiz submissions and scores | Links `User` and `Quiz` with JSON responses and score |
| `Enrollment` | Student access grant for paid/free courses | Links `User` and `Course` with payment reference |
| `Progress` | Lesson completion tracking | Tracks `User`, `Lesson`, percentage, and time spent |
| `Transaction`| Financial audit log for course purchases | Links `User`, `Course`, Chapa `tx_ref`, and payment status |
| `CourseCompletion` | Verified certificate logs | Links `User` and `Course` upon 100% completion |
| `InstructorApplication` | Prospective instructor intake | Stores submission status, CV details, and approval passkey |
| `PlatformSettings` | Global system configurations | Stores platform name, support email, and payment keys |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)
- [Git](https://git-scm.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/nathanzerfu-B/Qatan-E-Learning-Platform.git
cd Qatan-E-Learning-Platform
```

### 2. Backend Setup
```bash
cd qatan-backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your PostgreSQL database URL and API keys

# Run database migrations & generate Prisma client
npx prisma db push
npx prisma generate

# Start the development server
npm run dev
```
The backend API will run on `http://localhost:5000`.

### 3. Frontend Setup
```bash
cd ../qatan-frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend application will run on `http://localhost:5173`.

---

## 🧪 Quality Assurance & Engineering Standards

- **Strict Environment Isolation**: API keys, database credentials, and secret tokens are strictly handled via `.env` and never exposed to version control.
- **Type & Schema Validation**: Relational database operations are strictly typed through the Prisma Client.
- **Frontend Code Integrity**: Validated with production Vite builds (`npm run build`) and ESLint.
- **Error Handling**: Standardized HTTP status codes, structured JSON error payloads, and middleware validation across API endpoints.

---

## 📄 License
This project is proprietary and developed by **Nathan Zerfu ,
SamstarkSnow ,H4kim41**. All rights reserved.
