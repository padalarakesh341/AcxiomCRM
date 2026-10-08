# AcxiomCRM - Enterprise Customer Relationship Management System

[![Build & Test Status](https://img.shields.io/badge/tests-32%20passed-brightgreen.svg)](tests/)
[![Architecture](https://img.shields.io/badge/architecture-Layered%20Enterprise-blue.svg)](#architecture)
[![Security Baseline](https://img.shields.io/badge/security-RBAC%20%7C%20Audit%20%7C%20Lockout-darkgreen.svg)](#security-specifications)
[![REST API](https://img.shields.io/badge/api-OpenAPI%20%2F%20Swagger%203.0-orange.svg)](#rest-api-documentation)

**AcxiomCRM** is a robust, full-featured enterprise Customer Relationship Management (CRM) application built strictly in accordance with functional and technical specifications. It features a **Layered Architecture**, multi-tier validation (client, server, domain), role-based access control, security policies (lockout, password hashing, CSRF, audit logging), a responsive Bootstrap 5.3 interface, Kanban pipeline, interactive reporting with CSV export, and an OpenAPI 3.0 documented REST API.

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Functional Modules](#functional-modules)
3. [Security Specifications](#security-specifications)
4. [Pre-Seeded User Accounts](#pre-seeded-user-accounts)
5. [Quick Start & Setup](#quick-start--setup)
6. [Running Automated Tests](#running-automated-tests)
7. [REST API Documentation & Swagger](#rest-api-documentation)
8. [Reporting Engine](#reporting-engine)
9. [Project Directory Structure](#project-directory-structure)

---

## Architecture Overview

AcxiomCRM follows a strict **Layered Architecture** separating responsibilities across independent, technology-agnostic layers:

```
                      Users / REST API Clients
                                 │
                                 ▼
         ┌────────────────────────────────────────────────────────┐
         │ Presentation Layer (Bootstrap 5.3 UI, EJS, REST API)   │
         └───────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
         ┌────────────────────────────────────────────────────────┐
         │ Application Layer (Service Coordination, DTOs, API)    │
         └───────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
         ┌────────────────────────────────────────────────────────┐
         │ Domain / Business Layer (Rules, Workflows, RBAC)       │
         └───────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
         ┌────────────────────────────────────────────────────────┐
         │ Data Access Layer (Repositories, DB Queries, Schema)   │
         └───────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
         ┌────────────────────────────────────────────────────────┐
         │ Database Layer (SQLite with Relational Constraints)    │
         └────────────────────────────────────────────────────────┘
           ▲                                                    ▲
           └────────── Security + Auditing + Validation ────────┘
                           (Cross-Cutting Services)
```

- **Presentation Layer**: Responsive Bootstrap 5.3 UI with role-based navigation, toasts, modals, data tables, and REST API controllers.
- **Application Layer**: Business orchestration, service coordination, Data Transfer Objects (DTOs) preventing internal entity exposure.
- **Domain Layer**: Core CRM business rules, password complexity enforcement, account lockout policy, lead workflow state machine, weighted pipeline calculations.
- **Data Access Layer**: Repositories abstracting SQL queries, transactions, foreign key constraints, and relational indexes.
- **Database Layer**: Zero-setup SQLite with foreign keys and WAL mode.
- **Security & Cross-Cutting**: `bcryptjs` hashing, CSRF anti-forgery tokens, JWT authentication, centralized append-only audit logging.

---

## Functional Modules

| # | Module | Core Functionality |
|---|---|---|
| 1 | **Application Shell** | Responsive header, sidebar navigation tailored by role, global search, confirmation modals, notification toasts. |
| 2 | **Authentication & Authorization** | Username/email login, lockout after 5 failed attempts, password complexity validator, session & JWT token auth. |
| 3 | **Role-Based Dashboard** | KPIs, interactive Chart.js charts (pipeline stages, lead status), date range filters (`Today`, `This Week`, `This Month`, `All Time`). |
| 4 | **Customer Management** | Customer master records, phone/email validation, duplicate detection, assigned executive tracking, activity history. |
| 5 | **Lead Management** | Capture leads, source attribution, priority, status workflow (`New` ➔ `Contacted` ➔ `Qualified` ➔ `Converted`), 1-click deal conversion modal. |
| 6 | **Follow-Up Management** | Schedule activities (Call, Email, Meeting, Demo, Task) against Customers, Leads, Opportunities. Overdue / Upcoming badges, 1-click completion, rescheduling. |
| 7 | **User & Role Administration** | Admin-only portal to create users, assign roles (`Admin`, `Manager`, `Sales Executive`), unlock locked accounts, reset passwords, toggle active status. |
| 8 | **Opportunity Pipeline** | Dual-view (Data Table & Kanban board), probability slider, automated weighted pipeline value (`Amount * Probability / 100`), stage transitions. |
| 9 | **Audit Log** | Append-only security & CRM event audit trail (User, Role, Module, Action, Record ID, IP, Result, Timestamp, Metadata). |
| 10 | **REST API** | Full RESTful API with standard status codes (`200`, `201`, `400`, `401`, `403`, `404`), DTO protection, OpenAPI Swagger UI. |
| 11 | **Reporting Engine** | 8 business reports with filtering, sorting, pagination, and direct CSV download. |

---

## Security Specifications

1. **Password Policy**:
   - Minimum 8 characters.
   - At least 1 uppercase letter (`A-Z`).
   - At least 1 lowercase letter (`a-z`).
   - At least 1 number (`0-9`).
   - At least 1 special character (`!@#$%^&*` etc.).
2. **Account Lockout Policy**:
   - Accounts are locked for 15 minutes after 5 consecutive failed login attempts.
   - Administrators can manually unlock accounts with one click from the User Management console.
   - Counter resets immediately upon successful authentication.
3. **Password Protection**:
   - Securely hashed using `bcryptjs` with 12 salt rounds.
   - Password hashes are excluded from all UI templates and REST API responses (DTO pattern).
4. **Role-Based Access Control (RBAC)**:
   - `Admin`: Full access to all CRM data, User Administration, and Security Audit Logs.
   - `Manager`: Team dashboard, lead management, opportunity pipeline oversight, and reporting.
   - `Sales Executive`: Personal dashboard, assigned customer/lead records, opportunity deals, and follow-up activities.
5. **Anti-Forgery (CSRF)**:
   - Session-backed CSRF token validation protects all state-changing web requests (POST, PUT, DELETE).
6. **Immutable Audit Logging**:
   - Dedicated `audit_logs` table records login successes/failures, account lockouts/unlocks, password resets, entity creations/updates/deletions, and lead conversions.

---

## Pre-Seeded User Accounts

| Role | Username | Email | Password | Primary Permissions |
|---|---|---|---|---|
| **Admin** | `admin` | `admin@acxiom.com` | `Admin@12345` | Full system access, User administration, Audit logs |
| **Manager** | `manager` | `manager@acxiom.com` | `Manager@12345` | Team pipeline, Lead assignment, Reports |
| **Sales Executive** | `sales_rakesh` | `sales@acxiom.com` | `Sales@12345` | Assigned leads, customers, opportunities, follow-ups |
| **Sales Executive** | `sales_elena` | `sales2@acxiom.com` | `Sales@12345` | Assigned leads, customers, opportunities, follow-ups |

---

## Quick Start & Setup

### Prerequisites
- Node.js (v18.x, v20.x, or v22+)
- npm (v9+)

### Installation
```bash
# 1. Clone repository
git clone https://github.com/padalarakesh341/AcxiomCRM.git
cd AcxiomCRM

# 2. Install dependencies
npm install

# 3. Seed database with baseline accounts and sample CRM records
npm run seed

# 4. Start the application
npm start
```

Open your browser at **`http://localhost:3000`** to log in.

---

## Running Automated Tests

Run the complete Jest automated test suite:
```bash
npm test
```

All 5 test suites (32 tests) cover:
- Password policy validation (criteria validation & failure modes).
- Account lockout logic (5 failed attempts ➔ lockout ➔ admin unlock).
- Lead workflow state machine & conversion validation.
- Opportunity business rules & weighted pipeline formula.
- REST API endpoints, JWT Bearer tokens, and HTTP status codes.

---

## REST API Documentation

AcxiomCRM includes interactive **OpenAPI / Swagger 3.0** documentation:
- **Interactive Swagger UI**: `http://localhost:3000/api/docs`
- **Base API URL**: `http://localhost:3000/api/v1`

### Key REST Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Authenticate user & get JWT token | No |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Bearer Token |
| `GET` | `/api/v1/customers` | List customers (with search & filters) | Bearer Token |
| `POST` | `/api/v1/customers` | Create new customer record | Bearer Token |
| `GET` | `/api/v1/customers/:id` | Get customer details & activity timeline | Bearer Token |
| `PUT` | `/api/v1/customers/:id` | Update customer record | Bearer Token |
| `DELETE` | `/api/v1/customers/:id` | Delete customer (Manager/Admin) | Bearer Token |
| `GET` | `/api/v1/leads` | List leads with status/priority filters | Bearer Token |
| `POST` | `/api/v1/leads` | Capture prospective lead | Bearer Token |
| `POST` | `/api/v1/leads/:id/convert` | Convert Qualified lead into Customer & Opportunity | Bearer Token |
| `GET` | `/api/v1/opportunities` | List sales opportunities | Bearer Token |
| `POST` | `/api/v1/opportunities` | Create opportunity | Bearer Token |
| `PATCH`| `/api/v1/opportunities/:id/stage`| Update opportunity pipeline stage | Bearer Token |
| `GET` | `/api/v1/follow-ups` | List follow-up schedule | Bearer Token |
| `POST` | `/api/v1/follow-ups` | Schedule new follow-up activity | Bearer Token |
| `PATCH`| `/api/v1/follow-ups/:id/complete` | Mark follow-up as completed | Bearer Token |
| `PATCH`| `/api/v1/follow-ups/:id/reschedule` | Reschedule follow-up date | Bearer Token |
| `GET` | `/api/v1/reports/pipeline` | Pipeline summary metrics | Bearer Token |
| `GET` | `/api/v1/reports/conversion` | Lead conversion & deal win rates | Bearer Token |
| `GET` | `/api/v1/reports/export/:type` | Download report as CSV | Bearer Token |

---

## Reporting Engine

AcxiomCRM provides 8 business reports accessible under the **Reports & Analytics** module:
1. **Customer Report**: Master client list, contact info, owner, status.
2. **Lead Report**: Prospect channels, conversion history, owner tracking.
3. **Follow-Up Report**: Scheduled meetings, calls, demos, completed and overdue interactions.
4. **Opportunity Report**: Deals, stages, raw amount, probability, and calculated weighted values.
5. **Pipeline Report**: Stage-wise aggregate value and owner-wise sales distribution.
6. **Sales & Conversion Report**: Lead conversion rates by acquisition channel and opportunity win/loss ratio.
7. **User Activity Report**: Employee actions logged, assigned deals, completed tasks, and last login.
8. **Audit Report**: Searchable security events, login attempts, and system modifications.

All reports can be filtered and downloaded via **1-click CSV Export**.

---

## Project Directory Structure

```
AcxiomCRM/
├── package.json                   # Project metadata and dependencies
├── server.js                      # Server bootstrap
├── .env.example                   # Environment variable template
├── README.md                      # Complete project documentation
├── src/
│   ├── app.js                     # Express application configuration
│   ├── config/index.js            # Centralized settings
│   ├── cross-cutting/             # Logger, AuditService, ErrorHandler
│   ├── database/                  # SQLite connection, DDL schema, and seed script
│   ├── domain/                    # Password policy, lockout policy, lead workflow, opportunity rules
│   ├── data-access/               # Data repositories (Users, Customers, Leads, Opps, FollowUps, Reports)
│   ├── application/               # Application services & DTO handling
│   ├── security/                  # Auth middleware, RBAC, CSRF, TokenService
│   ├── routes/                    # Web & REST API routes
│   ├── presentation/
│   │   ├── api/                   # REST API controllers & Swagger OpenAPI spec
│   │   ├── web/                   # MVC Web controllers
│   │   └── views/                 # Bootstrap 5.3 EJS views (Layouts, Partials, Modules)
│   └── public/                    # CSS, client JavaScript, static assets
└── tests/                         # Automated test suites (32 unit & integration tests)
```

---

## Author & Maintainer
- **Author**: Rakesh Padala
- **GitHub**: [https://github.com/padalarakesh341](https://github.com/padalarakesh341)
- **Repository**: [https://github.com/padalarakesh341/AcxiomCRM](https://github.com/padalarakesh341/AcxiomCRM)
