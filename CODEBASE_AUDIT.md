# TastyBites Codebase Audit

**Generated:** 2026-03-14
**Project:** TastyBites - Restaurant Management & Ordering Platform (Version 3 - ChatBot)

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Routes & Pages](#2-routes--pages)
3. [Supabase Queries & Tables](#3-supabase-queries--tables)
4. [Feature Status](#4-feature-status)
5. [Authentication Flow](#5-authentication-flow)
6. [Environment Variables & External Services](#6-environment-variables--external-services)
7. [Critical Issues & Recommendations](#7-critical-issues--recommendations)

---

## 1. Project Structure

### Tech Stack

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| Frontend   | React 18.3 + TypeScript, Vite, Tailwind CSS             |
| Backend    | Express.js (Node), Socket.IO                            |
| Database   | Supabase (PostgreSQL 15.8)                              |
| Payments   | Razorpay (primary), Stripe (dependency only)            |
| AI         | Google Gemini (via Supabase Edge Function)              |
| Hosting    | Netlify (serverless functions), local dev               |
| Charts     | Chart.js, Recharts                                      |
| PDF        | jsPDF, jspdf-autotable                                  |
| Forms      | react-hook-form, zod                                    |
| Animation  | Framer Motion                                           |

### Folder Layout

```
tastybytes/
├── .env / .env.local              # Environment variables (Vite frontend)
├── package.json                   # Frontend dependencies & scripts
├── vite.config.ts                 # Vite build config (alias @ -> src)
├── tailwind.config.js
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
│
├── src/                           # ===== MAIN FRONTEND =====
│   ├── App.tsx                    # Router & providers
│   ├── main.tsx                   # React entry point
│   ├── index.css / vite-env.d.ts
│   │
│   ├── pages/                     # Page-level components
│   │   ├── Home.tsx
│   │   ├── Menu.tsx
│   │   ├── Cart.tsx
│   │   ├── Auth.tsx
│   │   ├── OrderHistory.tsx
│   │   ├── OrderTracking.tsx
│   │   ├── CustomerSupport.tsx
│   │   ├── ErrorsPage.tsx
│   │   ├── WebSocketTest.tsx      # Debug page (not routed)
│   │   ├── Menu/                  # Refactored Menu module
│   │   │   ├── Menu.tsx, index.tsx
│   │   │   ├── components/ (CategorySelector, CategorySidebar, MenuGrid, MenuHeader)
│   │   │   ├── hooks/ (useHeaderAnimation, useMenuFilters, useMenuItems, useMenuLayout, useMenuSearch, useMenuSort)
│   │   │   ├── constants.ts, utils/menuUtils.ts
│   │   ├── admin/                 # Admin dashboard pages
│   │   │   ├── Dashboard.tsx
│   │   │   ├── MenuManagement.tsx
│   │   │   ├── OrderManagement.tsx
│   │   │   ├── CustomerManagement.tsx
│   │   │   ├── StaffManagement.tsx, StaffManagement/ (index.tsx)
│   │   │   ├── StaffProfile.tsx
│   │   │   ├── CouponManagement.tsx
│   │   │   ├── CategoryManagement.tsx
│   │   │   ├── InvoiceManagement.tsx
│   │   │   ├── InvoiceTemplateSettings.tsx
│   │   │   ├── FeedbackManagement.tsx
│   │   │   ├── QRCodeManagement.tsx
│   │   │   ├── CustomerSupport.tsx
│   │   │   ├── AdminSupportPage.tsx
│   │   │   ├── WebsiteSettingsComprehensive.tsx
│   │   │   └── staff/StaffDashboard.tsx
│   │   ├── counter/CounterDashboard.tsx
│   │   ├── kitchen/KitchenDashboard.tsx
│   │   └── api/auth.ts            # Next.js API route (NOT USED by Vite)
│   │
│   ├── components/
│   │   ├── layout/ (Layout, Navbar, Footer, PageTransition)
│   │   ├── auth/ (LoginForm, SignupForm)
│   │   ├── menu/ (MenuCard, CategoryFilter, FilterModal, MenuFilters, QuickCategorySelector, LoadingSpinner)
│   │   ├── cart/ (FloatingCart, CartAnimation, EnhancedPaymentModal, PaymentSuccessModal)
│   │   ├── chat/ (FloatingChatButton, SupportChatModal)
│   │   ├── admin/ (AdminChatDashboard, CategoryManager, MenuTable, MenuStats, QRCodeGenerator, ...)
│   │   ├── admin/admin/ (DUPLICATE nested: BatchActions, CategoryModal, CustomerAnalytics, ...)
│   │   ├── admin/coupons/ (BatchActions, CouponAnalytics, CouponFilterBar, ...)
│   │   ├── admin/dashboard/ (OrderStatusChart, RevenueChart, StatCard, ReportSelector)
│   │   ├── admin/staff/ (StaffForm, StaffTable, StaffStats, StaffProfile, AttendanceTracker, BulkActionBar)
│   │   ├── common/ (ErrorBoundary, NetworkStatus, PageTransition, ProtectedRoute, SearchBar)
│   │   ├── diagnostics/ (ErrorAnalyticsPanel, NetworkPanel, PerformanceMetricsPanel, ...)
│   │   ├── feedback/ (FeedbackForm)
│   │   ├── home/ (HomeContent_old, HomePageEditor)
│   │   ├── ui/ (DynamicIcon, ImageUpload, LoadingSpinner, Tabs, button, dialog, label, ...)
│   │   └── LEGACY root-level duplicates: CartAnimation, CategoryFilter, ErrorBoundary, FloatingCart, Footer, Layout, MenuCard, Navbar, etc.
│   │
│   ├── context/                   # State management
│   │   ├── AuthContext.tsx        # *** ACTIVE auth provider (used by App.tsx) ***
│   │   ├── CartContext.tsx        # *** ACTIVE cart provider (used by App.tsx) ***
│   │   ├── SocketContext.tsx
│   │   ├── auth/ (AuthContext.ts, AuthContext.tsx, AuthProvider.tsx)  # DUPLICATE auth - NOT used by App.tsx
│   │   ├── cart/ (CartContext.ts, CartProvider.tsx)                   # DUPLICATE cart - NOT used by App.tsx
│   │   ├── socket/ (SocketContext.ts, SocketContext.tsx, SocketProvider.tsx, context.ts)
│   │   └── index.ts              # Exports from auth/ and CartContext (mixed)
│   │
│   ├── contexts/
│   │   └── WebsiteSettingsContext.tsx  # Website branding/settings provider
│   │
│   ├── hooks/
│   │   ├── useAdminChats.ts, useAdminData.ts
│   │   ├── useAiChat.ts           # AI chatbot hook (Supabase Edge Function)
│   │   ├── useCategories.ts       # Real-time category fetching
│   │   ├── useMenuItems.ts        # Paginated menu items with caching
│   │   ├── useOrders.ts           # Order creation & history
│   │   ├── useOrderForm.ts, useOrderManagement.ts
│   │   ├── useRealtimeSync.ts     # Generic Supabase realtime hook
│   │   ├── useServerlessAdminChats.ts, useServerlessSupportChat.ts
│   │   ├── useSocket.ts, useSocketSetup.ts
│   │   ├── useImagePreloader.ts, useToast.ts
│   │
│   ├── services/
│   │   ├── api.js                 # Axios client for customers API
│   │   ├── customerApiService.js  # Supabase CRUD for customers
│   │   ├── CustomerExportService.ts
│   │   └── imageUpload.ts         # Supabase Storage uploads
│   │
│   ├── lib/
│   │   ├── supabase.ts            # *** PRIMARY Supabase client ***
│   │   ├── razorpay.ts            # Razorpay SDK initialization
│   │   ├── payment.ts             # Payment verification
│   │   ├── utils.js / utils.ts    # cn() classname utility
│   │
│   ├── types/                     # TypeScript type definitions
│   │   ├── category.ts, menu.ts, orders.ts, payment.ts, socket.ts
│   │   ├── staff.ts, invoice.ts, invoiceSettings.ts
│   │   ├── counter.ts, Customer.ts, supabase.ts, websiteSettings.ts
│   │
│   ├── utils/
│   │   ├── auth.ts                # Profile CRUD, RPC calls
│   │   ├── autoSetup.ts           # DB table auto-creation
│   │   ├── automatedCustomerAnalytics.ts
│   │   ├── customerUtils.ts
│   │   ├── environment.ts         # Centralized env var access
│   │   ├── imageUtils.ts, iconHelpers.tsx
│   │   ├── invoiceGenerator.ts, invoiceUtils.ts, orderInvoiceUtils.ts
│   │   ├── loadScript.ts          # Dynamic script loading (Razorpay)
│   │   ├── networkChecker.js / .ts, connectionMonitor.js
│   │   ├── databaseDiagnostic.js / .ts, diagnosticService.js
│   │   ├── orderUtils.ts, supabaseClient.ts, toastUtils.ts
│   │   └── websiteSettingsUtils.ts
│   │
│   ├── config/
│   │   └── socket.ts              # Socket.IO URL config
│   │
│   ├── data/
│   │   └── menuItems.ts           # Hardcoded fallback menu data
│   │
│   └── scripts/                   # Utility/migration scripts
│       ├── analyze-migrations.js, check-supabase-connection.js
│       ├── createWebsiteSettingsTable.js
│       ├── diagnose-staff-system.js, diagnose-supabase.js
│       ├── seed-knowledge-base.ts
│       ├── setupAndUpload.js, uploadMenuItems.js
│
├── server/                        # ===== EXPRESS BACKEND =====
│   ├── index.js                   # Express app + Socket.IO server
│   ├── package.json               # Server dependencies
│   ├── .env                       # Server env vars
│   ├── socket.js                  # Socket.IO setup with auth
│   ├── socket/chatHandlers.js
│   ├── serverless.js, netlify.js
│   ├── lib/supabase.js
│   ├── middleware/auth.js
│   ├── models/ (Category, Coupon, MenuItem, Order, User).js
│   ├── routes/ (auth, categories, coupons, customers, menu, orders, payments, razorpay, staff, stripe, support-chat).js
│   ├── seeders/categorySeeder.js
│   ├── check-orders.js, check-status.js, check-supabase-connection.js
│
├── pages/api/                     # ===== NEXT.JS-STYLE API ROUTES (mixed in) =====
│   ├── customers.ts, payments.ts
│   ├── support-chat.ts, support-chat/[id].ts, support-chat/message.ts
│   ├── support-chat/read-messages.ts, support-chat/status.ts
│   └── razorpay/ (create-order.ts, verify-payment.ts)
│
├── supabase/                      # ===== SUPABASE EDGE FUNCTIONS =====
│   ├── functions/
│   │   ├── ai-chat/index.ts       # AI chatbot (Gemini API + RAG)
│   │   └── send-invoice/index.ts  # Email invoice sender
│   └── real_database_structure.json
│
├── netlify/functions/             # ===== NETLIFY SERVERLESS =====
│   ├── api.js, server.js, support-chat.js
│
├── lib/ supabase.ts / supabase.js # Root-level Supabase clients (legacy/Next.js)
├── middleware/auth.js             # Root-level auth middleware (legacy)
├── models/ (legacy duplicates)
├── routes/ (legacy duplicates)
├── app/ (layout.tsx, page.tsx, globals.css)  # Next.js app dir (NOT USED by Vite)
└── dist/                          # Built output
```

### Key Observations

- **Hybrid project**: Contains artifacts from Vite (active), Next.js (abandoned), and Netlify deployments
- **Significant duplication**: Components, contexts, and server files exist in multiple locations
- **`src/components/admin/admin/`**: Nested duplicate directory with redundant copies of admin components

---

## 2. Routes & Pages

### All Routes Defined in App.tsx

| Route | Component | Access | Protected? |
|---|---|---|---|
| `/` | `Home` | Public (in Layout) | No |
| `/menu` | `Menu` | Public (in Layout) | No |
| `/cart` | `Cart` | Public (in Layout) | No |
| `/auth` | `Auth` | Public (in Layout) | No |
| `/orders` | `OrderHistory` | Public (in Layout) | **No** (should be) |
| `/track/:orderId` | `OrderTracking` | Public (in Layout) | No |
| `/diagnostics` | `ErrorsPage` | No Layout | No |
| `/kitchen` | `KitchenDashboard` | No Layout | **No** (should be) |
| `/counter` | `CounterDashboard` | No Layout | **No** (should be) |
| `/admin` | `AdminDashboard` | Parent route | **No** (should be) |
| `/admin/menu` | `MenuManagement` | Nested in admin | **No** |
| `/admin/orders` | `OrderManagement` | Nested in admin | **No** |
| `/admin/customers` | `CustomerManagement` | Nested in admin | **No** |
| `/admin/invoices` | `InvoiceManagement` | Nested in admin | **No** |
| `/admin/invoice-settings` | `InvoiceTemplateSettings` | Nested in admin | **No** |
| `/admin/qr-codes` | `QRCodeManagement` | Nested in admin | **No** |
| `/admin/staff` | `StaffManagement` | Nested in admin | **No** |
| `/admin/staff/:id` | `StaffProfile` | Nested in admin | **No** |
| `/admin/feedback` | `FeedbackManagement` | Nested in admin | **No** |
| `/admin/coupons` | `CouponManagement` | Nested in admin | **No** |
| `/admin/categories` | `CategoryManagement` | Nested in admin | **No** |
| `/admin/support` | `CustomerSupport` | Nested in admin | **No** |
| `/admin/website` | `WebsiteSettingsComprehensive` | Nested in admin | **No** |

### Pages NOT Routed (Dead)

| File | Status |
|---|---|
| `src/pages/WebSocketTest.tsx` | Not in any route - debug page |
| `src/pages/admin/AdminSupportPage.tsx` | Imported but `CustomerSupport` is used at `/admin/support` |
| `src/pages/admin/StaffManagement/index.tsx` | Alternate version, not imported by App.tsx |
| `src/pages/admin/staff/StaffDashboard.tsx` | Not routed |
| `src/pages/Menu/index.tsx` and `src/pages/Menu/Menu.tsx` | Refactored module, but App.tsx imports `src/pages/Menu.tsx` (the old file) |
| `src/pages/api/auth.ts` | Next.js API route, not used by Vite |
| `src/components/home/HomeContent_old.tsx` | Explicitly marked as old |
| `src/components/home/HomePageEditor.tsx` | Not used in any route |

### CRITICAL: No Route Protection

**`ProtectedRoute` component exists at two locations but is NOT used anywhere in App.tsx.** All routes including `/admin/*`, `/kitchen`, `/counter`, and `/orders` are completely unprotected. Anyone can access admin dashboards without authentication.

---

## 3. Supabase Queries & Tables

> **Data source**: All table/column/row information below was **verified live via Supabase REST API** on 2026-03-14 using the project's anon key against `https://xeetynafcpofbzpgrsvn.supabase.co`.

### Supabase Client Locations (5 duplicates!)

| File | Used By | Env Vars |
|---|---|---|
| **`src/lib/supabase.ts`** | **Primary - all frontend** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| `src/utils/supabaseClient.ts` | Diagnostics only | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| `src/supabaseClient.js` | Deprecated wrapper | Re-exports from `src/lib/supabase.ts` |
| `lib/supabase.ts` | Next.js pages (unused) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `lib/supabase.js` | Server scripts | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |
| `server/lib/supabase.js` | Express server | `SUPABASE_URL`, `SUPABASE_ANON_KEY` |

### Complete Database Schema (Verified via Supabase REST API)

#### Tables That Actually Exist (with row counts & column counts)

| Table | Rows | Cols | Status | Notes |
|---|---|---|---|---|
| **`orders`** | 0 | 30 | Accessible | Empty - no orders placed |
| **`order_items`** | 0 | 7 | Accessible | Empty |
| **`menu_items`** | 12 | 10 | Accessible | 12 seeded items (Pizza, Burger, Biryani, etc.) |
| **`categories`** | 6 | 7 | Accessible | Main Course, Appetizers, Desserts, Beverages, Sides, Specials |
| **`customers`** | 0 | 36 | Accessible | Empty |
| **`staff`** | 0 | 57 | Accessible | Empty - comprehensive HR schema |
| **`coupons`** | 0 | 17 | Accessible | Empty |
| **`invoices`** | 0 | 25 | Accessible | Empty |
| **`invoice_items`** | 0 | 11 | Accessible | Empty |
| **`invoice_settings`** | 0 | 53 | Accessible | Empty - very detailed template config |
| **`order_feedback`** | 2 | 15 | Accessible | 2 entries from user "Aakash" |
| **`support_chats`** | 0 | 17 | Accessible | Empty |
| **`chat_messages`** | 0 | 9 | Accessible | Empty |
| **`profiles`** | 0 | 10 | Accessible | Has `role` column (default: 'customer') |
| **`website_settings`** | 1 | 58 | Accessible | Configured: "TastyBites", orange theme |
| **`knowledge_base`** | 26 | 6 | Accessible | RAG embeddings for AI chat (vector(768)) |
| **`payments`** | 0 | 8 | Accessible | Empty |
| **`staff_attendance`** | 0 | 11 | Accessible | Empty |
| **`staff_activity_logs`** | 0 | 7 | Accessible | Empty |
| **`tables`** | 0 | 12 | Accessible | Restaurant table management - empty |
| **`faqs`** | 0 | 6 | Accessible | Empty |
| **`favorite_items`** | 0 | 11 | Accessible | Empty |
| **`health_check`** | 0 | 3 | Accessible | Diagnostic table |
| **`customer_activities`** | 0 | 5 | Accessible | Empty |
| **`user_demographics`** | 0 | 11 | Accessible | Empty |
| **`user_feedback`** | 0 | 13 | Accessible | Empty (different from order_feedback) |
| **`user_interactions`** | 0 | 12 | Accessible | Empty |
| **`user_preferences`** | 0 | 22 | Accessible | Empty |
| **`user_visits`** | 0 | 21 | Accessible | Empty |
| **`support_chats_backup`** | 0 | 13 | Accessible | Backup table |

#### Tables That DO NOT Exist (Frontend Code References Them But They're Missing)

| Table Referenced in Code | Referenced By | Status |
|---|---|---|
| **`staff_shifts`** | `StaffManagement.tsx` (tries to create via RPC) | **DOES NOT EXIST** |
| **`staff_documents`** | `StaffProfile.tsx` | **DOES NOT EXIST** |
| **`staff_performance_reviews`** | `StaffProfile.tsx` | **DOES NOT EXIST** |
| **`staff_communications`** | Listed in old DB structure JSON | **DOES NOT EXIST** |
| **`staff_leave`** | Listed in old DB structure JSON | **DOES NOT EXIST** |
| **`staff_payroll`** | Listed in old DB structure JSON | **DOES NOT EXIST** |
| **`staff_training`** | Listed in old DB structure JSON | **DOES NOT EXIST** |
| **`staff_performance`** | Listed in old DB structure JSON | **DOES NOT EXIST** |
| **`inventory`** | Listed in old DB structure JSON | **DOES NOT EXIST** |
| **`inventory_transactions`** | Listed in old DB structure JSON | **DOES NOT EXIST** |

> **Note**: The file `supabase/real_database_structure.json` (dated 2025-10-07) is **outdated**. It lists tables that have since been deleted from the database. The `StaffManagement.tsx` component attempts to dynamically create `staff_attendance` and `staff_shifts` tables via `supabase.rpc('run_sql')` at runtime.

#### Views (Verified via REST API)

| View | Cols | Status |
|---|---|---|
| `active_chats_with_latest_message` | 18 | Exists, not queried by frontend |
| `active_customers_view` | 8 | Exists, not queried by frontend |
| `order_insights` | 17 | Exists, not queried by frontend |
| `top_customers_view` | 6 | Exists, not queried by frontend |

### Tables Queried by Frontend

| Table | Operations | Used In | Actually Has Data? |
|---|---|---|---|
| **`orders`** | SELECT, INSERT, UPDATE | Cart, OrderHistory, OrderTracking, Dashboard, OrderManagement, CounterDashboard, KitchenDashboard | No (0 rows) |
| **`order_items`** | SELECT (via join) | OrderHistory, OrderManagement, CounterDashboard | No (0 rows) |
| **`menu_items`** | SELECT, INSERT, UPDATE, DELETE | Menu, MenuManagement, CounterDashboard | **Yes (12 rows)** |
| **`categories`** | SELECT | useCategories hook, CouponManagement | **Yes (6 rows)** |
| **`customers`** | SELECT, INSERT, UPDATE, DELETE, UPSERT | AuthContext (signup), CustomerManagement, customerApiService | No (0 rows) |
| **`staff`** | SELECT, INSERT, UPDATE, DELETE | StaffManagement, StaffProfile | No (0 rows) |
| **`staff_attendance`** | SELECT, INSERT | StaffManagement | No (0 rows) |
| **`staff_shifts`** | SELECT, INSERT, UPDATE | StaffManagement | **TABLE MISSING** |
| **`staff_documents`** | SELECT, INSERT, UPDATE, DELETE | StaffProfile | **TABLE MISSING** |
| **`staff_performance_reviews`** | SELECT, INSERT, UPDATE | StaffProfile | **TABLE MISSING** |
| **`coupons`** | SELECT, INSERT, UPDATE, DELETE | Cart (validation), CouponManagement | No (0 rows) |
| **`website_settings`** | SELECT, UPSERT, UPDATE | WebsiteSettingsContext | **Yes (1 row)** |
| **`support_chats`** | SELECT, INSERT, UPDATE | useServerlessSupportChat, useServerlessAdminChats | No (0 rows) |
| **`chat_messages`** | SELECT, INSERT | useServerlessSupportChat, useServerlessAdminChats | No (0 rows) |
| **`profiles`** | SELECT, UPSERT | utils/auth.ts | No (0 rows) |
| **`order_feedback`** | SELECT, INSERT | FeedbackManagement, FeedbackForm | **Yes (2 rows)** |
| **`invoices`** | SELECT | InvoiceManagement, OrderTracking | No (0 rows) |
| **`invoice_items`** | SELECT (via join) | InvoiceManagement | No (0 rows) |
| **`knowledge_base`** | SELECT (via Edge Function) | ai-chat Edge Function (RAG search) | **Yes (26 rows)** |

### Tables in Database but NOT Queried by Frontend

| Table | Rows | Cols | Notes |
|---|---|---|---|
| `payments` | 0 | 8 | Payment records - never written to by frontend |
| `invoice_settings` | 0 | 53 | Massive config table - InvoiceTemplateSettings page may write but no reads found |
| `tables` | 0 | 12 | Restaurant table management - no UI |
| `faqs` | 0 | 6 | FAQ system - no UI |
| `favorite_items` | 0 | 11 | User favorites - no UI |
| `health_check` | 0 | 3 | Diagnostic only |
| `customer_activities` | 0 | 5 | Activity tracking - no UI |
| `staff_activity_logs` | 0 | 7 | Staff audit log - no UI |
| `user_demographics` | 0 | 11 | Analytics - no UI |
| `user_feedback` | 0 | 13 | Different from order_feedback - no UI |
| `user_interactions` | 0 | 12 | Analytics tracking - no UI |
| `user_preferences` | 0 | 22 | Personalization - no UI |
| `user_visits` | 0 | 21 | Visit tracking - no UI |
| `support_chats_backup` | 0 | 13 | Backup table |

### Realtime Subscriptions (Supabase Channels)

| Channel | Table Watched | Used In |
|---|---|---|
| `categories_changes` | `categories` | useCategories hook |
| `orders_channel` | `orders` | OrderManagement, KitchenDashboard |
| `customers_channel` | `customers` | CustomerManagement |
| `dashboard_changes` | `orders` | Admin Dashboard |
| `invoice_changes` | `invoices` | InvoiceManagement |
| `website_settings_changes` | `website_settings` | WebsiteSettingsContext |
| `admin-messages` | `chat_messages` | useServerlessAdminChats |
| `chat:{id}` | `chat_messages` | useServerlessSupportChat |
| `chat-status:{id}` | `support_chats` | useServerlessSupportChat |
| `customer-analytics-sync` | `orders` | automatedCustomerAnalytics |
| Generic via `useRealtimeSync` | Any table | Reusable hook |

### Supabase Storage Buckets

| Bucket | Used For | Used In |
|---|---|---|
| `website-assets` | Website branding images | imageUpload.ts |
| `staff-photos` | Staff profile photos | StaffManagement, StaffProfile |
| `assets` | Invoice template logos | InvoiceTemplateSettings |

### RPC Functions Called

| Function | Used In | Purpose |
|---|---|---|
| `version` | supabaseClient.ts, diagnose-supabase.js | Health check |
| `get_user_info` | utils/auth.ts | User profile data |
| `get_user_context` | utils/auth.ts | Comprehensive user context |
| `get_customer_statistics` | customerApiService.js | Customer analytics |
| `run_sql` | StaffManagement.tsx | Dynamic table creation (attendance, shifts) |
| `exec_sql` | autoSetup.ts | Auto-create missing tables |

### Supabase Edge Functions

| Function | Purpose | API Used |
|---|---|---|
| `ai-chat` | RAG-based AI chatbot | Google Gemini API |
| `send-invoice` | Email invoice to customer | Unknown email service |

---

## 4. Feature Status

### Fully Working Features

| Feature | Pages/Components | Notes |
|---|---|---|
| **Home Page** | Home.tsx | Dynamic branding via website_settings |
| **Menu Browsing** | Menu.tsx | Category filtering, search, pagination, image lazy loading |
| **Cart & Checkout** | Cart.tsx, EnhancedPaymentModal | Add/remove items, coupon validation, order type selection |
| **Order History** | OrderHistory.tsx | View past orders, status filtering, reorder |
| **Order Tracking** | OrderTracking.tsx | Real-time status, progress bar, feedback submission |
| **Auth (Login/Signup)** | Auth.tsx, LoginForm, SignupForm | Supabase email/password auth, customer record creation |
| **Admin Dashboard** | Dashboard.tsx | Stats cards, charts, recent orders, real-time updates |
| **Menu Management** | MenuManagement.tsx | Full CRUD, image upload with compression, virtualized list |
| **Order Management** | OrderManagement.tsx | Status updates, invoice viewing, real-time sync |
| **Customer Management** | CustomerManagement.tsx | Search, filter, export, table/card views |
| **Category Management** | CategoryManagement.tsx | CRUD with drag-and-drop reordering, icons |
| **Coupon Management** | CouponManagement.tsx | Create/edit with item/category eligibility, batch ops |
| **Staff Management** | StaffManagement.tsx | CRUD, photo upload, attendance, shift scheduling |
| **Feedback Management** | FeedbackManagement.tsx | View ratings, filter, analytics |
| **QR Code Generation** | QRCodeManagement.tsx | Single/bulk generation, ZIP download |
| **Invoice Management** | InvoiceManagement.tsx | View, search, filter, print, download PDF |
| **Website Settings** | WebsiteSettingsComprehensive.tsx | Branding, colors, content customization |
| **Kitchen Dashboard** | KitchenDashboard.tsx | Real-time orders, item-level tracking, status updates |
| **Counter Dashboard** | CounterDashboard.tsx | POS interface, menu browsing, order+payment processing |
| **AI Chatbot** | useAiChat hook + Edge Function | RAG-based Q&A with escalation to human |
| **Support Chat** | SupportChatModal, CustomerSupport | Customer-admin messaging with real-time updates |
| **Real-time Updates** | useRealtimeSync, Supabase channels | Orders, categories, customers, invoices, chat |

### Partially Implemented Features

| Feature | Issue |
|---|---|
| **Route Protection** | `ProtectedRoute` component exists but is **never used** in App.tsx. All admin/kitchen/counter routes are publicly accessible |
| **Admin Role Checking** | `ProtectedRoute` has `requireAdmin` prop but contains `// TODO: Implement admin check` |
| **Socket.IO Integration** | SocketContext/SocketProvider exist, socket.ts config exists, server has Socket.IO setup, but **no components actively use the socket connection** for real-time features (Supabase realtime is used instead) |
| **Razorpay Payments** | Frontend integration exists (loadScript, checkout flow), but payment **verification endpoint** relies on Express server (`/api/payments/verify`) which may not be running in serverless deployment |
| **Invoice Emailing** | Edge Function `send-invoice` exists but no clear email service integration visible |
| **Customer Analytics** | `automatedCustomerAnalytics.ts` sets up realtime sync but the **analytics dashboard component** (`CustomerAnalyticsSetup.tsx`, `CustomerAnalytics.tsx`) is not routed |
| **Staff Profile Page** | `StaffProfile.tsx` is routed at `/admin/staff/:id` but has auth dependency issues (calls `supabase.auth.getUser()` for staff auth which may not match staff records) |
| **Invoice Template Settings** | `InvoiceTemplateSettings.tsx` is a large 63KB file, routed and functional, but the settings may not be consumed by invoice generation |

### Dead Code / Unused Files

| File/Feature | Reason |
|---|---|
| `src/pages/WebSocketTest.tsx` | Debug page, not routed |
| `src/pages/admin/AdminSupportPage.tsx` | Wrapper component, not used (CustomerSupport is used instead) |
| `src/pages/admin/StaffManagement/index.tsx` | Alternate implementation, not imported |
| `src/pages/admin/staff/StaffDashboard.tsx` | Not routed |
| `src/pages/Menu/` (entire module) | Refactored Menu but App.tsx still imports old `src/pages/Menu.tsx` |
| `src/components/home/HomeContent_old.tsx` | Explicitly obsolete |
| `src/components/home/HomePageEditor.tsx` | Not used anywhere |
| `src/components/admin/admin/*` | Duplicate nested admin components |
| `src/context/auth/AuthProvider.tsx` | Duplicate, not used by App.tsx |
| `src/context/cart/CartProvider.tsx` | Duplicate with localStorage (not used by App.tsx) |
| `src/context/socket/*` | Multiple socket context files, not actively used |
| `src/context/index.ts` | Exports from wrong providers (auth/ not used by App.tsx) |
| `src/components/ProtectedRoute.tsx` | Duplicate of common/ProtectedRoute.tsx |
| Root-level `src/components/CartAnimation.tsx`, `CategoryFilter.tsx`, `ErrorBoundary.tsx`, `FloatingCart.tsx`, `Footer.tsx`, `Layout.tsx`, `MenuCard.tsx`, `Navbar.tsx`, etc. | Legacy duplicates of organized versions |
| `app/` directory (layout.tsx, page.tsx) | Next.js App Router files, not used by Vite |
| `pages/api/*` | Next.js API routes, not served by Vite |
| Root-level `models/`, `routes/`, `middleware/` | Duplicates of `server/` equivalents |
| `src/services/api.js` | Axios client pointing to Express server, partially redundant with direct Supabase queries |
| `src/data/menuItems.ts` | Hardcoded fallback data, potentially unused |
| `netlify.js`, `serverless.js` | Root-level serverless configs, duplicated in `server/` |

---

## 5. Authentication Flow

### How Auth Works Today

```
                      ┌─────────────────┐
                      │   Auth.tsx       │
                      │ (toggle login/   │
                      │  signup forms)   │
                      └────────┬────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
            ┌──────────────┐     ┌───────────────┐
            │ LoginForm.tsx │     │ SignupForm.tsx │
            └──────┬───────┘     └───────┬───────┘
                   │                     │
                   ▼                     ▼
          supabase.auth           supabase.auth
          .signInWithPassword     .signUp({email, password,
          ({email, password})      options: {data: {name, phone}}})
                   │                     │
                   │                     ├── On success: upsert to
                   │                     │   'customers' table with
                   │                     │   user_id, name, email, phone
                   │                     │
                   └─────────┬───────────┘
                             ▼
                   ┌─────────────────────┐
                   │  AuthContext.tsx     │
                   │  (src/context/)     │
                   │                     │
                   │  - getSession()     │
                   │  - onAuthStateChange│
                   │  - stores: user,    │
                   │    session, loading  │
                   └─────────┬───────────┘
                             │
                             ▼
                   Components access via
                   useAuth() hook:
                   { user, session, loading,
                     signIn, signUp, signOut }
```

### Auth Provider Chain in App.tsx

```
<ErrorBoundary>
  <NetworkStatus />
  <AuthProvider>          ← from src/context/AuthContext.tsx
    <CartProvider>        ← from src/context/CartContext.tsx
      <WebsiteSettingsProvider>
        <Router>
          <Routes ... />
        </Router>
      </WebsiteSettingsProvider>
    </CartProvider>
  </AuthProvider>
</ErrorBoundary>
```

### What AuthContext Provides

```typescript
interface AuthContextType {
  user: User | null;         // Supabase auth user object
  session: Session | null;   // Supabase session with JWT
  loading: boolean;          // Auth state loading indicator
  signUp: (email, password, name, phone) => Promise<void>;
  signIn: (email, password) => Promise<void>;
  signOut: () => Promise<void>;
}
```

### Auth Issues

1. **No route protection**: `ProtectedRoute` exists but is not wrapped around any route in App.tsx
2. **No role system**: There is no `role` field checked anywhere. No admin/staff/customer distinction
3. **No admin check**: Anyone who knows the URL can access `/admin/*`, `/kitchen`, `/counter`
4. **Duplicate auth contexts**: `src/context/auth/AuthProvider.tsx` is a second implementation that does NOT create customer records on signup (unlike the active one)
5. **Profile vs Customer confusion**: Auth creates `customers` records, but `utils/auth.ts` queries `profiles` table. These are separate tables with no clear relationship
6. **No email verification enforcement**: Signup shows "verify email" toast but doesn't block access
7. **Session persistence**: Uses Supabase's built-in `localStorage` persistence (via `persistSession: true`)

---

## 6. Environment Variables & External Services

### Frontend Environment Variables (.env)

| Variable | Service | Value Pattern |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase | `eyJ...` (public anon key) |
| `VITE_RAZORPAY_KEY_ID` | Razorpay | `rzp_test_...` (test mode) |
| `VITE_RAZORPAY_KEY_SECRET` | Razorpay | Secret key |
| `VITE_OPENAI_API_KEY` | OpenAI | `sk-...` |
| `VITE_GEMINI_API_KEY` | Google Gemini | API key |
| `VITE_BUSINESS_NAME` | App config | `TastyBites` |
| `VITE_API_URL` | Express server | `http://localhost:5000/api` |
| `VITE_SERVER_URL` | Socket.IO | `http://localhost:5000` |

### Server Environment Variables (server/.env)

| Variable | Service |
|---|---|
| `SUPABASE_URL` | Supabase |
| `SUPABASE_ANON_KEY` | Supabase |
| `RAZORPAY_KEY_ID` | Razorpay |
| `RAZORPAY_KEY_SECRET` | Razorpay |
| `JWT_SECRET` | Express JWT auth |
| `PORT` | Server port (5000) |

### Root .env (mixed frontend + server)

| Variable | Service |
|---|---|
| `JWT_SECRET` | Express server |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Server-side Supabase |
| `SUPABASE_ACCESS_TOKEN` | Supabase Management API |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Next.js (unused) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay |
| `OPENAI_API_KEY` | OpenAI |
| `GEMINI_API_KEY` | Google Gemini |

### External Services Summary

| Service | Purpose | Status | Notes |
|---|---|---|---|
| **Supabase** | Database, Auth, Realtime, Storage, Edge Functions | **Active** | Primary backend |
| **Razorpay** | Online payments | **Active (Test Mode)** | `rzp_test_` keys, checkout modal loads dynamically |
| **Google Gemini** | AI chatbot responses | **Active** | Used in `ai-chat` Edge Function for RAG |
| **OpenAI** | Unknown | **Configured but unused** | API key in env but no code references OpenAI SDK |
| **Socket.IO** | Real-time communication | **Partially active** | Server configured, client has contexts, but **Supabase Realtime is used instead** for all real-time features |
| **Stripe** | Payments | **Dead** | Listed in package.json dependencies, `server/routes/stripe.js` exists, but no frontend integration |
| **Netlify** | Serverless deployment | **Configured** | Functions in `netlify/functions/`, `netlify.json` exists |
| **Chart.js / Recharts** | Data visualization | **Active** | Used in admin Dashboard |
| **jsPDF** | PDF generation | **Active** | Invoice generation and download |
| **XLSX** | Excel export | **Active** | Customer data export |

### Security Concerns

| Issue | Severity | Details |
|---|---|---|
| **API keys in .env committed** | HIGH | `.env` contains real Supabase keys, Razorpay test keys, OpenAI key, Gemini key. Should be in `.env.local` (gitignored) |
| **VITE_RAZORPAY_KEY_SECRET exposed** | HIGH | Secret key prefixed with `VITE_` means it's bundled into client-side JavaScript |
| **No .gitignore verification** | MEDIUM | Cannot confirm `.env` is gitignored (not a git repo) |
| **CORS allows all origins** | MEDIUM | Server configured with `cors({ origin: '*' })` |
| **No route protection** | HIGH | All admin routes publicly accessible |
| **RPC run_sql exposed** | HIGH | `StaffManagement.tsx` calls `supabase.rpc('run_sql')` which could execute arbitrary SQL |

---

## 7. Critical Issues & Recommendations

### Priority 1: Security

1. **Add route protection immediately**: Wrap admin/kitchen/counter routes with `ProtectedRoute` and implement role checking
2. **Remove `VITE_RAZORPAY_KEY_SECRET`**: Secret keys must NEVER be in client-side code. Move payment verification to server/edge function
3. **Remove `VITE_OPENAI_API_KEY`**: API keys should not be in the frontend bundle
4. **Secure `.env` files**: Ensure they are gitignored; move secrets to deployment environment variables
5. **Remove `run_sql` RPC usage**: Direct SQL execution from frontend is extremely dangerous

### Priority 2: Code Cleanup

1. **Remove duplicate files**: Consolidate the ~30+ duplicate components, contexts, and configs
2. **Delete unused directories**: `app/`, root-level `models/`, `routes/`, `middleware/`, `pages/api/`
3. **Remove dead features**: Socket.IO contexts (replaced by Supabase Realtime), Stripe dependency, OpenAI key
4. **Consolidate Supabase clients**: Keep only `src/lib/supabase.ts` for frontend

### Priority 3: Architecture

1. **Implement role-based access**: Add `role` field to profiles/customers, check in ProtectedRoute
2. **Fix Menu import**: App.tsx imports old `Menu.tsx` while refactored `Menu/` module exists
3. **Unify auth and customer models**: Clarify relationship between `profiles` and `customers` tables
4. **Create missing tables or remove dead code**: `staff_shifts`, `staff_documents`, `staff_performance_reviews` are referenced in code but **do not exist** in the database. Either create them or remove the code that references them
5. **Remove 14+ unused database tables**: `faqs`, `favorite_items`, `user_demographics`, `user_interactions`, `user_preferences`, `user_visits`, `user_feedback`, `customer_activities`, `tables`, `payments`, `health_check`, `staff_activity_logs`, `support_chats_backup` — all empty and never queried
6. **Update `supabase/real_database_structure.json`**: This file is from Oct 2025 and lists 10+ tables (`inventory`, `staff_payroll`, `staff_training`, etc.) that no longer exist in the database
7. **Cart persistence**: Active CartContext has no localStorage persistence (the one with persistence is unused)

### Priority 4: DevEx

1. **Remove unused dependencies**: Stripe, some Radix UI components, etc.
2. **Fix TypeScript**: Mixed `.js`/`.ts`/`.tsx`/`.jsx` files suggest incomplete migration
3. **Standardize toast library**: Some files use `react-hot-toast`, others use custom `toastUtils`
4. **Add proper error boundaries**: Current ErrorBoundary is basic, no per-route boundaries

---

*End of Audit*
