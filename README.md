# Smart Multi-Branch Inventory and Distribution Management System with Real-Time Tracking

A full-stack web-based inventory and distribution management system designed to manage products, stock, branches, distributors, business orders, stock transfers, deliveries, reports, and notifications across multiple branches.

This project was developed as a practicum project for the Department of Computer Science and Engineering, IUBAT.

---

## Live Project Links

### Frontend
https://smart-inventory-system-six.vercel.app

## Project Overview

The Smart Multi-Branch Inventory and Distribution Management System helps organizations manage inventory across multiple branches from a centralized platform. The system allows administrators and authorized users to monitor stock levels, manage products, process stock transfers, create business orders, assign deliveries, and generate reports.

The system is role-based, meaning each user can access only the features allowed for their assigned role.

---

## Key Features

### Authentication and Authorization
- Secure user login using JWT authentication
- Role-based access control
- Protected frontend routes
- Secure password hashing using bcryptjs

### User Management
- Create, update, and manage system users
- Assign roles to users
- Assign branch-specific users
- Restrict branch managers to their assigned branch
- One branch can have only one branch manager

### Branch Management
- Add and manage multiple branches
- Store branch name, address, latitude, and longitude
- Auto-generated branch codes such as B001, B002, B003

### Category Management
- Add and manage product categories
- Auto-generated category codes such as C001, C002, C003

### Product Management
- Add and manage products
- Store SKU, product name, unit, price, category, image URL, and description
- Auto-generated product codes such as P001, P002, P003

### Inventory Management
- Branch-wise stock management
- Stock-in operation
- Stock-out operation
- Stock adjustment
- Reorder level management
- Low-stock status tracking
- Stock transaction history

### Transfer Management
- Create stock transfer requests between branches
- Support transfer from head office to branch
- Support branch-to-branch transfer
- Transfer status workflow:
  - PENDING
  - APPROVED
  - REJECTED
  - DISPATCHED
  - RECEIVED
- Stock is updated after dispatch/receive workflow

### Distributor Management
- Add, edit, and delete distributors
- Store distributor contact details
- Used in order processing

### Order Management
- Create business orders for distributors or business clients
- Select products from available branch stock
- Automatic total amount calculation
- Order status workflow:
  - PENDING
  - APPROVED
  - PACKED
  - DISPATCHED
  - DELIVERED
  - CANCELLED

### Delivery Management
- Assign delivery riders
- Track delivery status
- Manage order delivery process

### Notifications
- Low-stock alerts
- Transfer-related notifications
- User-friendly notification interface

### Reports
- Inventory reports
- Stock movement reports
- Transfer reports
- Order reports
- Low-stock reports
- Print and Save as PDF support

### Dashboard
- KPI cards
- Analytics overview
- Recent orders
- Recent transfers
- Low-stock summary
- Quick actions
- Recent activity section

---

## User Roles

The system supports the following roles:

| Role | Description |
|---|---|
| SUPER_ADMIN | Full access to all modules and actions |
| BRANCH_MANAGER | Manages data related to assigned branch |
| INVENTORY_OFFICER | Manages products, stock, inventory, and transfers |
| BRANCH_STAFF | Views branch stock and creates business orders |
| DELIVERY_RIDER | Handles assigned deliveries |

---

## Technology Stack

### Frontend
- React
- Vite
- Bootstrap
- React Router
- Axios

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication
- bcryptjs
- Zod Validation

### Database
- PostgreSQL

### Deployment
- Frontend: Vercel
- Backend: Render
- Database: Render PostgreSQL

---

## Project Structure

```text
smart-inventory-system/
│
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   │
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   └── validators/
│   │
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── package.json
│   ├── vercel.json
│   └── .env
│
└── README.md
