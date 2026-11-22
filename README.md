
# 🚀 BIXOPLAY Management System

A modern, secure, and responsive web-based management system designed to manage employees, customer subscriptions, and business operations efficiently.

The system provides role-based access for administrators and employees, with real-time database integration powered by Supabase.

## 🌟 Features

### 👨‍💼 Admin Dashboard
- View and manage all customer subscriptions.
- Monitor employee subscription records.
- Filter subscriptions by month, employee, country, and payment method.
- Edit and delete subscription records.
- Export subscription data to CSV.
- Track subscription amounts in USD.

### 👨‍💻 Employee Dashboard
- Secure employee login.
- Add new customer subscriptions.
- View personal subscription records.
- Edit subscriptions created by the logged-in employee.
- Access customer and subscription information.

### 🔐 Authentication & Security
- Supabase Authentication.
- Role-based access control.
- PostgreSQL Row Level Security (RLS).
- Password reset functionality.
- Employee-specific data access.
- Administrative access policies.

## 🛠️ Technologies Used

| Technology | Purpose |
|------------|---------|
| HTML5 | Application Structure |
| CSS3 | Responsive Design |
| JavaScript (ES6+) | Application Logic |
| Supabase Auth | Authentication |
| Supabase PostgreSQL | Database |
| Supabase RLS | Database Security |
| Cloudflare Workers | Hosting |
| Git & GitHub | Version Control |

## 📁 Project Structure

```text
BIXOPLAY-Management-System/
│
├── index.html
├── login.html
├── admin.html
├── employee.html
├── forgot-password.html
├── reset-password.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── supabase.js
│   ├── common.js
│   ├── auth.js
│   ├── admin.js
│   ├── employee.js
│   ├── forgot-password.js
│   └── reset-password.js
│
├── Image/
│   └── company-logo.png
│
└── README.md
```

## 📊 Subscription Management

The system supports the following subscription information:

- Customer Name
- Customer Username
- Country
- Phone Number
- Server Type
- Payment Method
- Subscription Duration
- Start Date
- End Date
- Subscription Amount (USD)
- Assigned Employee

## 👥 User Roles

### Administrator
Administrators can manage subscription records across the organization, including viewing, editing, deleting, filtering, and exporting data.

### Employee
Employees can create subscriptions and access their own records according to the configured database security policies.

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

### 2. Open the Project

Open the project folder using Visual Studio Code.

### 3. Configure Supabase

Create a Supabase project and configure:

- Supabase Authentication
- PostgreSQL database tables
- User profiles and roles
- Row Level Security policies

Update `js/supabase.js` with your project's Supabase URL and publishable key.

Never expose Supabase secret keys, service-role keys, or database passwords in frontend code.

### 4. Run Locally

Start a local development server using VS Code Live Server or another static HTTP server.

Open `index.html` in your browser through the local server.

## 🗄️ Database

The application uses Supabase PostgreSQL.

Main tables:

**profiles**
- Stores user profile information and roles.

**subscriptions**
- Stores customer subscription records and employee ownership information.

Database access is controlled through PostgreSQL Row Level Security policies.

> Security Note: Frontend restrictions are not a substitute for database-level authorization. RLS policies must be configured and tested before production use.

## ☁️ Deployment

The application is deployed using Cloudflare Workers static asset hosting.

The frontend communicates with Supabase through its JavaScript client library.

## 🔒 Security Best Practices

- Enable RLS on exposed database tables.
- Never commit database passwords or secret keys.
- Use Supabase publishable keys only in frontend code.
- Validate user permissions at the database level.
- Keep dependencies updated.
- Protect customer information.
- Review access policies regularly.

## 🎯 Project Goals

BIXOPLAY Management System aims to:

- Simplify employee workflows.
- Centralize customer subscription management.
- Improve subscription data organization.
- Reduce manual administrative tasks.
- Provide secure, role-based access.
- Support business scalability.

## 🚧 Future Improvements

Potential future enhancements include:

- Advanced analytics dashboard.
- Subscription expiration notifications.
- Automated reports.
- Enhanced employee performance statistics.
- Additional subscription reporting tools.

## 📌 Project Status

**Active Development**

The project is continuously maintained and improved.

## 📄 License

All rights reserved.

This repository does not grant permission to copy, redistribute, or commercially reuse the project without authorization.

---

**BIXOPLAY Management System**

Built with HTML, CSS, JavaScript, and Supabase.
