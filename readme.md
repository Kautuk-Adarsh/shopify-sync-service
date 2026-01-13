#  Data Ingestion Service (Backend)

## 📌 Overview
It is a multi-tenant Node.js application designed to ingest data from Shopify (Products, Customers, Orders) and serve analytics to a frontend dashboard.
The system features a **polling architecture** to ensure data consistency and utilizes **PostgreSQL** for persistent storage, ensuring tenant isolation and robust data handling.

---

## 🏗 Architecture

The system follows a polling-based ingestion flow where the server actively fetches data from Shopify and stores it for the client to consume.

```
graph TD
    Client[Client Next.js]
    Server[Server Express + Node.js]
    Shopify[Shopify Admin API]
    DB[(Database PostgreSQL)]

    Client -- REST API --> Server
    Server -- Cron Job / 2 min --> Shopify
    Server -- Prisma ORM --> DB
```

### Key Components
1.  **Ingestion Engine**: A scheduled service (`node-cron`) that iterates through all onboarded tenants in the database and performs an idempotent sync with Shopify.
2.  **Multi-Tenancy**: Data is logically isolated using `shopId` columns on all major tables (Row-Level Isolation).
3.  **Authentication**: Standard email/password authentication using `bcryptjs` for security.

---

## 🛠 Tech Stack

*   **Runtime**: Node.js & Express.js
*   **Database**: PostgreSQL 
*   **ORM**: Prisma 
*   **Scheduling**: node-cron
*   **Security**: bcryptjs

---

## ⚙️ Setup Instructions

Follow these steps to set up the project locally.

### 1. Prerequisites
*   Node.js (v18+)
*   PostgreSQL Database URL (Local or Cloud provider like Neon/Railway)

### 2. Installation
Clone the repository and install dependencies:

```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and configure the following:

```bash
PORT=4000
# Connection string to your PostgreSQL database
DATABASE_URL="postgres://user:password@host:port/database?sslmode=require"

# (Optional) Defaults for the seeding script
SHOPIFY_STORE_DOMAIN="your-shop.myshopify.com"
SHOPIFY_ACCESS_TOKEN="shpat_xxxxxxxxxxxxxxxx"
```

### 4. Database Migration
Initialize the database tables using Prisma:

```bash
npx prisma migrate dev --name init
```

### 5. Seeding (Create Admin User)
Run the helper script to create the initial Tenant account and seed required data:

```bash
node create-user.js
```

### 6. Run Server
Start the development server:

```bash
npm run dev
```

---

## 🔌 API Documentation

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth` | Validates credentials and returns the tenant's Shop ID. |

### Dashboard Data
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Returns total Revenue, Orders, and Customers. |
| `GET` | `/api/dashboard/chart` | Returns sales aggregated by date (for Line Charts). |
| `GET` | `/api/dashboard/top-customers` | Returns top 5 customers by Lifetime Value (LTV). |

### Ingestion (Manual Triggers)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ingest/products` | Manually trigger product sync. |
| `POST` | `/api/ingest/customers` | Manually trigger customer sync. |
| `POST` | `/api/ingest/orders` | Manually trigger order sync. |

---

## 🗄 Data Model (Schema)

All data tables include a `shopId` column to ensure strict tenant isolation.

*   **Tenant**: Stores authentication (`email`, `password_hash`) and Shopify credentials (`accessToken`).
*   **Customer**: Stores PII (Name, Email, Location) and calculated `totalSpent`.
*   **Order**: Linked to Customers. Stores `financial_status` and `totalPrice`.
*   **Product**: Stores `title`, `price`, and variants.

---

## 🧠 Design Decisions & Assumptions

### 1. Authentication Method
*   **Decision**: Implemented standard Email/Password authentication.
*   **Reasoning**: While "email authentication" was requested, a password-based flow was chosen to ensure robust access control without relying on external email delivery services (like SendGrid) for this MVP.

### 2. Sync Strategy (Polling vs. Webhooks)
*   **Decision**: Used a Cron Job (Polling) every 2 minutes.
*   **Reasoning**: Polling provides a strong guarantee of data consistency and is easier to debug during initial development. Webhooks can miss events if the server is down, requiring a reconciliation strategy.

### 3. Multi-Tenancy
*   **Decision**: Database-level isolation (Row-Level Security approach).
*   **Reasoning**: Allows all tenants to live in one database (cost-effective) while preventing data leaks via strict `where: { shopId }` clauses in Prisma.

---

## 🔮 Next Steps (Productionization)

To take this from MVP to Enterprise scale, the following improvements are planned:

1.  **Queue System**: Move ingestion logic to Redis (BullMQ) to handle Shopify's API rate limits ("Leaky Bucket") gracefully.
2.  **Webhooks**: Implement Shopify Webhooks for real-time updates (e.g., `orders/create`), reducing the reliance on polling.
3.  **Security**: Implement JWT (JSON Web Tokens) for stateless session management instead of simple client-side storage.
