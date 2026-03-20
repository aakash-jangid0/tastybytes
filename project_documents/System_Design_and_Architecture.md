# TastyBytes — System Design & Architecture Document
### SDLC Stage 2: System Design and Architecture
**Version:** 3.0 (ChatBot Edition)
**Derived From:** Codebase Analysis (March 2026)
**Project:** TastyBytes — Restaurant Management & Ordering Platform

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture (Supabase)](#5-backend-architecture-supabase)
6. [Database Design](#6-database-design)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Real-Time Architecture](#8-real-time-architecture)
9. [Payment Integration Architecture](#9-payment-integration-architecture)
10. [AI Chatbot Architecture](#10-ai-chatbot-architecture)
11. [State Management Design](#11-state-management-design)
12. [Routing & Navigation Architecture](#12-routing--navigation-architecture)
13. [Module-Wise Feature Architecture](#13-module-wise-feature-architecture)
14. [Data Flow Diagrams](#14-data-flow-diagrams)
15. [Invoice & PDF Generation Architecture](#15-invoice--pdf-generation-architecture)
16. [File Storage Architecture](#16-file-storage-architecture)
17. [Error Handling Strategy](#17-error-handling-strategy)
18. [Performance Optimization Strategies](#18-performance-optimization-strategies)
19. [Security Architecture](#19-security-architecture)
20. [Deployment Architecture](#20-deployment-architecture)
21. [Non-Functional Requirements](#21-non-functional-requirements)

---

## 1. System Overview

TastyBytes is a **full-stack restaurant management and online ordering platform** built as a Single Page Application (SPA). It serves four distinct user roles — **Customers, Kitchen Staff, Counter Staff, and Administrators** — each with dedicated dashboards and workflows.

### 1.1 Core Capabilities

| Capability | Description |
|---|---|
| Online Ordering | Customers browse menu, add to cart, checkout with multiple payment methods |
| Real-Time Kitchen Display | Kitchen staff see live orders and update item-level preparation status |
| Counter POS | Counter staff create walk-in orders, process payments, manage tables |
| Admin Management | Full restaurant back-office: menu, staff, customers, invoices, coupons, analytics |
| AI Customer Support | Gemini-powered chatbot with human escalation via live chat |
| QR Code Ordering | Generate table-specific QR codes linking to the digital menu |
| Dynamic Website CMS | Admin-configurable home page content, branding, and social links |

### 1.2 System Boundaries

```
┌──────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                         │
│  React SPA + TailwindCSS + Framer Motion                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Customer  │ │ Kitchen  │ │ Counter  │ │ Admin Dashboard  │ │
│  │   Pages   │ │Dashboard │ │Dashboard │ │   (12 modules)   │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │
└──────────────────┬──────────────────┬────────────────────────┘
                   │                  │
          Supabase JS Client    Socket.IO Client
                   │                  │
┌──────────────────▼──────────────────▼────────────────────────┐
│                    BACKEND SERVICES                           │
│  ┌─────────────────────┐  ┌──────────────────────────────┐   │
│  │   Supabase Cloud     │  │   Netlify Functions (Prod)   │   │
│  │  ─ PostgreSQL DB     │  │   / localhost:5000 (Dev)     │   │
│  │  ─ Auth (JWT)        │  │   ─ Socket.IO Server         │   │
│  │  ─ Realtime (WS)     │  │                              │   │
│  │  ─ Edge Functions    │  └──────────────────────────────┘   │
│  │  ─ Storage (Buckets) │                                     │
│  └─────────────────────┘                                     │
│                                                               │
│  ┌─────────────────────┐  ┌──────────────────────────────┐   │
│  │   Razorpay Gateway   │  │   Google Gemini API          │   │
│  │   (Payments)         │  │   (AI Chat - 2.0 Flash Lite) │   │
│  └─────────────────────┘  └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. High-Level Architecture

### 2.1 Architectural Pattern

**Client-Heavy SPA with BaaS (Backend-as-a-Service)**

- The frontend is a React SPA that directly communicates with Supabase for database, auth, real-time, and storage operations.
- Serverless Edge Functions handle complex backend logic (AI chat, payment verification, invoice emailing).
- Socket.IO provides supplementary real-time messaging for the support chat system.

### 2.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│                                                                  │
│   React 18 + TypeScript + React Router v6 + TailwindCSS          │
│   Framer Motion (Animations) + Radix UI (Primitives)             │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                        STATE LAYER                               │
│                                                                  │
│   React Context API (Auth, Cart, WebsiteSettings, Socket)        │
│   Custom Hooks (useOrders, useMenuItems, useCategories, etc.)    │
│   localStorage persistence (Cart)                                │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                        SERVICE LAYER                             │
│                                                                  │
│   Supabase JS Client    │ Socket.IO Client │ Razorpay SDK        │
│   (DB, Auth, Realtime,  │ (Support Chat)   │ (Payment Checkout)  │
│    Storage, Edge Fns)   │                  │                     │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                        BACKEND LAYER                             │
│                                                                  │
│   Supabase PostgreSQL   │ Supabase Auth    │ Supabase Realtime   │
│   Supabase Edge Fns     │ Supabase Storage │ Gemini API          │
│   (Deno Runtime)        │ (Image Buckets)  │ (AI Embeddings)     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Communication Patterns

| Pattern | Technology | Use Case |
|---|---|---|
| Request-Response | Supabase JS SDK (REST over HTTPS) | CRUD operations, queries |
| Real-Time Push | Supabase Realtime (WebSocket) | Order status, menu changes, settings sync |
| Real-Time Bidirectional | Socket.IO (WebSocket + Polling) | Support chat messaging |
| External API Call | Edge Function → Gemini API | AI chat responses |
| Payment Redirect | Razorpay Checkout.js (Modal) | Payment processing |

---

## 3. Technology Stack

### 3.1 Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| TypeScript | 5.8.3 | Type safety |
| Vite | 5.4.19 | Build tool & dev server |
| React Router | 6.30.0 | Client-side routing |
| TailwindCSS | 3.4.17 | Utility-first styling |
| Framer Motion | 11.18.2 | Page transitions & animations |
| React Hook Form | 7.56.3 | Form state management |
| Zod | 3.24.4 | Schema validation |
| React Hot Toast | 2.5.2 | Toast notifications |
| Radix UI | Various | Accessible UI primitives (Dialog, Tabs, Label, Separator) |
| Lucide React | 0.344.0 | Icon library |
| Chart.js + react-chartjs-2 | 4.4.9 / 5.3.0 | Dashboard charts |
| Recharts | 2.15.3 | Additional charting |
| @tanstack/react-virtual | 3.13.6 | Virtual scrolling for large lists |
| @tanstack/react-query | 5.75.7 | Server state caching |
| react-beautiful-dnd | 13.1.1 | Drag-and-drop (category reordering) |
| react-color | 2.19.3 | Color picker (website settings) |
| react-intersection-observer | 9.16.0 | Lazy loading triggers |

### 3.2 Backend / Infrastructure

| Technology | Purpose |
|---|---|
| Supabase | PostgreSQL database, Auth, Realtime subscriptions, Storage, Edge Functions |
| Supabase Edge Functions (Deno) | Serverless functions for AI chat, payment verification, invoice email |
| Socket.IO | Real-time support chat communication |
| Netlify | Frontend hosting & serverless function deployment (production) |

### 3.3 External Services

| Service | Purpose |
|---|---|
| Razorpay | Payment gateway (Card, UPI, Online) |
| Google Gemini API (2.0 Flash Lite) | AI-powered customer support chatbot |
| Supabase Storage | Image hosting for menu items, logos, documents |

### 3.4 Utilities & Libraries

| Library | Purpose |
|---|---|
| jsPDF + jspdf-autotable | PDF invoice generation |
| XLSX | Excel export (customers, coupons) |
| JSZip + file-saver | Bulk QR code download as ZIP |
| qrcode / qrcode.react | QR code generation |
| date-fns | Date formatting and manipulation |
| clsx + tailwind-merge | Conditional CSS class merging |

---

## 4. Frontend Architecture

### 4.1 Directory Structure

```
src/
├── main.tsx                    # App entry point with error boundary
├── App.tsx                     # Root component, routing, providers
├── index.css                   # Global styles + Tailwind directives
│
├── pages/                      # Page-level components (route targets)
│   ├── Home.tsx                # Customer landing page
│   ├── Menu.tsx                # Legacy menu page
│   ├── Menu/                   # Refactored menu module
│   │   ├── index.tsx           # Menu page entry
│   │   ├── components/         # MenuHeader, MenuGrid, CategorySelector, CategorySidebar
│   │   ├── hooks/              # useMenuItems, useMenuFilters, useMenuSearch, useMenuSort, useMenuLayout, useHeaderAnimation
│   │   ├── utils/              # menuUtils
│   │   └── constants.ts        # Menu configuration constants
│   ├── Cart.tsx                # Shopping cart + checkout
│   ├── Auth.tsx                # Login/signup page
│   ├── OrderHistory.tsx        # Customer order history
│   ├── OrderTracking.tsx       # Real-time order tracking
│   ├── admin/                  # Admin dashboard pages (12 modules)
│   │   ├── Dashboard.tsx
│   │   ├── MenuManagement.tsx
│   │   ├── CategoryManagement.tsx
│   │   ├── OrderManagement.tsx
│   │   ├── CustomerManagement.tsx
│   │   ├── StaffManagement.tsx
│   │   ├── CouponManagement.tsx
│   │   ├── FeedbackManagement.tsx
│   │   ├── InvoiceManagement.tsx
│   │   ├── InvoiceTemplateSettings.tsx
│   │   ├── QRCodeManagement.tsx
│   │   ├── CustomerSupport.tsx
│   │   └── WebsiteSettingsComprehensive.tsx
│   ├── kitchen/
│   │   └── KitchenDashboard.tsx
│   └── counter/
│       └── CounterDashboard.tsx
│
├── components/                 # Reusable components
│   ├── admin/                  # Admin-specific components
│   │   ├── dashboard/          # StatCard, OrderStatusChart, ReportSelector
│   │   ├── staff/              # StaffTable, StaffProfile, AttendanceTracker, BulkActionBar
│   │   ├── customers/          # CustomerFilter, CustomerStats
│   │   ├── coupons/            # CouponFilterBar, CouponAnalytics, BatchActions, CategoryMultiSelector
│   │   ├── CategoryManager, CategorySelector, IconSelector
│   │   ├── MenuStats, HomePagePreview, LivePreview
│   │   └── QRCodeGenerator
│   ├── auth/                   # LoginForm, SignupForm
│   ├── cart/                   # FloatingCart, CartAnimation, EnhancedPaymentModal
│   ├── chat/                   # SupportChatModal, FloatingChatButton
│   ├── common/                 # ErrorBoundary, PageTransition, SearchBar, ProtectedRoute, DebugPanel, FeedbackForm
│   ├── feedback/               # FeedbackForm
│   ├── menu/                   # MenuFilters, CategoryFilter, QuickCategorySelector
│   └── ui/                     # Reusable UI primitives
│       ├── button, dialog, label, separator, textarea (Radix-based)
│       ├── Tabs, ImageUpload, InfoCard, LoadingSpinner
│       ├── NetworkErrorAlert, EmergencyToastDismiss
│       ├── DynamicIcon, star-rating
│       └── ...
│
├── context/                    # React Context providers
│   ├── AuthContext.tsx
│   ├── CartContext.tsx
│   ├── WebsiteSettingsContext.tsx
│   └── SocketContext.tsx
│
├── hooks/                      # Custom React hooks
│   ├── useOrders.ts            # Order CRUD + real-time
│   ├── useOrderForm.ts         # Order form state
│   ├── useOrderManagement.ts   # Admin order management
│   ├── useMenuItems.ts         # Menu data fetching
│   ├── useCategories.ts        # Category data
│   ├── useAdminData.ts         # Admin dashboard aggregation
│   ├── useAdminChats.ts        # Support chat management
│   ├── useAiChat.ts            # AI chatbot integration
│   ├── useRealtimeSync.ts      # Generic real-time subscriptions
│   ├── useToast.ts             # Toast notification helpers
│   └── useImagePreloader.ts    # Image preloading
│
├── lib/                        # External service integrations
│   ├── supabase.ts             # Supabase client initialization
│   ├── payment.ts              # Payment data management
│   └── razorpay.ts             # Razorpay SDK integration
│
├── services/                   # Business logic services
│   ├── CustomerExportService.ts
│   └── imageUpload.ts
│
├── types/                      # TypeScript type definitions
│   ├── supabase.ts             # Auto-generated DB types
│   ├── orders.ts, menu.ts, category.ts
│   ├── payment.ts, invoice.ts, invoiceSettings.ts
│   ├── counter.ts, socket.ts
│   └── websiteSettings.ts
│
├── utils/                      # Utility functions
│   ├── invoiceGenerator.ts     # PDF generation
│   ├── invoiceUtils.ts         # Invoice CRUD helpers
│   ├── customerUtils.ts        # Customer analytics
│   ├── websiteSettingsUtils.ts # Settings helpers
│   ├── iconHelpers.tsx         # Icon mapping
│   ├── imageUtils.ts           # Image optimization
│   ├── loadScript.ts           # Dynamic script loader
│   └── environment.ts          # Environment config
│
└── config/
    └── socket.ts               # Socket.IO configuration
```

### 4.2 Component Hierarchy

```
<StrictMode>
  <App>
    <AuthProvider>
      <CartProvider>
        <WebsiteSettingsProvider>
          <SocketProvider>
            <ErrorBoundary>
              <Toaster />
              <EmergencyToastDismiss />
              <BrowserRouter>
                <Routes>
                  <Route element={<Layout />}>     ← Navbar + Footer + FloatingCart
                    {/* Public Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/menu" element={<Menu />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/orders" element={<OrderHistory />} />
                    <Route path="/track/:orderId" element={<OrderTracking />} />
                  </Route>

                  {/* Protected: Kitchen */}
                  <ProtectedRoute role="kitchen">
                    <Route path="/kitchen" element={<KitchenDashboard />} />
                  </ProtectedRoute>

                  {/* Protected: Counter */}
                  <ProtectedRoute role="counter">
                    <Route path="/counter" element={<CounterDashboard />} />
                  </ProtectedRoute>

                  {/* Protected: Admin (nested) */}
                  <ProtectedRoute role="admin">
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<Dashboard />} />
                      <Route path="menu" element={<MenuManagement />} />
                      <Route path="categories" element={<CategoryManagement />} />
                      <Route path="orders" element={<OrderManagement />} />
                      <Route path="customers" element={<CustomerManagement />} />
                      <Route path="staff" element={<StaffManagement />} />
                      <Route path="staff/:id" element={<StaffProfile />} />
                      <Route path="coupons" element={<CouponManagement />} />
                      <Route path="feedback" element={<FeedbackManagement />} />
                      <Route path="invoices" element={<InvoiceManagement />} />
                      <Route path="invoice-settings" element={<InvoiceTemplateSettings />} />
                      <Route path="qr-codes" element={<QRCodeManagement />} />
                      <Route path="support" element={<CustomerSupport />} />
                      <Route path="website" element={<WebsiteSettingsComprehensive />} />
                    </Route>
                  </ProtectedRoute>
                </Routes>
              </BrowserRouter>
            </ErrorBoundary>
          </SocketProvider>
        </WebsiteSettingsProvider>
      </CartProvider>
    </AuthProvider>
  </App>
```

---

## 5. Backend Architecture (Supabase)

### 5.1 Supabase Services Used

| Service | Usage |
|---|---|
| **PostgreSQL Database** | All application data storage (15+ tables) |
| **Auth** | Email/password authentication with JWT sessions |
| **Realtime** | WebSocket subscriptions for orders, menu, settings, categories |
| **Storage** | Image buckets for menu items, logos, staff documents |
| **Edge Functions** | AI chat (Gemini), invoice email, payment verification |
| **Row Level Security (RLS)** | Data access control per user/role |

### 5.2 Supabase Client Configuration

**File:** `src/lib/supabase.ts`

```
Client initialized with:
  - VITE_SUPABASE_URL (project URL)
  - VITE_SUPABASE_ANON_KEY (anonymous/public key)
  - Auth: persistSession=true, autoRefreshToken=true, localStorage
  - Realtime: enabled by default
```

### 5.3 Edge Functions (Serverless)

| Function | Runtime | Purpose | External APIs |
|---|---|---|---|
| `ai-chat` | Deno | AI-powered customer support with RAG | Google Gemini 2.0 Flash Lite |
| `send-invoice` | Deno | Email invoice PDF to customers | Email service |
| `create-razorpay-order` | Deno | Create Razorpay payment order | Razorpay API |
| `verify-payment` | Deno | Verify Razorpay payment signature | Razorpay API |

### 5.4 AI Chat Edge Function — Detailed Architecture

```
                    ┌──────────────┐
                    │ User Message │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Gemini API  │
                    │  Embedding   │
                    │ (768 dims)   │
                    └──────┬───────┘
                           │
                    ┌──────▼───────────────┐
                    │  Supabase RPC:        │
                    │  match_knowledge()    │
                    │  (Vector similarity   │
                    │   threshold: 0.3,     │
                    │   top 5 matches)      │
                    └──────┬───────────────┘
                           │
                    ┌──────▼───────────────┐
                    │  Gemini 2.0 Flash     │
                    │  Lite Generation      │
                    │  (temp: 0.3,          │
                    │   max_tokens: 300)    │
                    └──────┬───────────────┘
                           │
              ┌────────────▼────────────────┐
              │  Save to DB:                 │
              │  - chat_messages (user msg)  │
              │  - chat_messages (ai reply)  │
              │  - Update support_chats      │
              │    last_message_at           │
              └────────────┬────────────────┘
                           │
                    ┌──────▼──────┐
                    │  JSON Reply │
                    │  {chatId,   │
                    │   response} │
                    └─────────────┘
```

**Retry Strategy:** Exponential backoff (2 retries) for rate-limited requests (HTTP 429).

---

## 6. Database Design

### 6.1 Entity-Relationship Overview

```
profiles ──────────┬──── orders ──────── order_items
    │               │        │
    │               │        ├──── payments
    │               │        │
    │               │        └──── order_feedback
    │               │
    │          customers ──── support_chats ──── chat_messages
    │
    └──── staff ──── staff_documents
              │
              ├──── staff_attendance
              └──── shifts

menu_items ──── categories

coupons (standalone)
invoices ──── invoice_items
website_settings (singleton)
knowledge_base (AI embeddings)
```

### 6.2 Complete Table Schemas

#### 6.2.1 `profiles`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, FK → auth.users | User identity |
| name | TEXT | | Display name |
| email | TEXT | | Email address |
| phone | TEXT | | Phone number |
| role | TEXT | Default: 'customer' | One of: admin, kitchen, counter, customer |
| created_at | TIMESTAMPTZ | Default: now() | |
| updated_at | TIMESTAMPTZ | | |

#### 6.2.2 `orders`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, Default: gen_random_uuid() | |
| user_id | UUID | FK → profiles.id, nullable | Registered user |
| customer_id | UUID | FK → customers.id, nullable | Customer record |
| status | TEXT | Default: 'pending' | pending, preparing, ready, delivered, cancelled |
| payment_status | TEXT | Default: 'pending' | pending, completed, failed |
| subtotal | NUMERIC | | Pre-tax amount |
| tax | NUMERIC | | Tax amount (18% GST) |
| discount | NUMERIC | Default: 0 | Coupon discount |
| total_amount | NUMERIC | | Final amount |
| customer_name | TEXT | | |
| customer_phone | TEXT | | |
| table_number | TEXT | | For dine-in orders |
| order_type | TEXT | | 'dine-in' or 'takeaway' |
| payment_method | TEXT | | cash, card, upi, razorpay |
| coupon_code | TEXT | | Applied coupon code |
| created_at | TIMESTAMPTZ | Default: now() | |
| updated_at | TIMESTAMPTZ | | |

#### 6.2.3 `order_items`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| order_id | UUID | FK → orders.id | |
| name | TEXT | | Item name |
| quantity | INTEGER | | |
| price | NUMERIC | | Unit price |
| notes | TEXT | | Special instructions |
| status | TEXT | | not_started, in_progress, completed |
| created_at | TIMESTAMPTZ | | |

#### 6.2.4 `menu_items`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| name | TEXT | NOT NULL | |
| description | TEXT | | |
| price | NUMERIC | NOT NULL | |
| image | TEXT | | Image URL |
| category | TEXT | | Category slug/name |
| preparation_time | INTEGER | | Minutes |
| is_available | BOOLEAN | Default: true | |
| created_at | TIMESTAMPTZ | | |
| updated_at | TIMESTAMPTZ | | |

#### 6.2.5 `categories`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| name | TEXT | NOT NULL | Display name |
| slug | TEXT | UNIQUE | URL-friendly identifier |
| display_order | INTEGER | | Sort priority |
| icon | TEXT | | Lucide icon name |
| created_at | TIMESTAMPTZ | | |
| updated_at | TIMESTAMPTZ | | |

#### 6.2.6 `customers`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → profiles.id, nullable | For registered users |
| name | TEXT | | |
| email | TEXT | | |
| phone | TEXT | | |
| address | TEXT | | |
| customer_source | TEXT | | website, counter, app |
| referral_code | TEXT | UNIQUE | Auto-generated |
| status | TEXT | Default: 'active' | active, inactive |
| total_orders / order_count | INTEGER | | |
| total_spent | NUMERIC | | Lifetime value |
| average_order_value | NUMERIC | | Calculated |
| first_order_date | TIMESTAMPTZ | | |
| last_order_date | TIMESTAMPTZ | | |
| last_visit | TIMESTAMPTZ | | |
| loyalty_points | INTEGER | | |
| loyalty_tier | TEXT | | bronze, silver, gold, platinum |
| visit_frequency | TEXT | | daily, weekly, monthly |
| favorite_items | TEXT[] | | Array of item names |
| favorite_cuisines | TEXT[] | | |
| spice_preference | TEXT | | |
| dietary_restrictions | TEXT[] | | vegetarian, vegan, gluten-free |
| preferred_payment_method | TEXT | | |
| preferred_dining_time | TEXT | | |
| language_preference | TEXT | | |
| tags | TEXT[] | | Custom admin tags |
| notes | TEXT | | Admin notes |
| created_at | TIMESTAMPTZ | | |
| updated_at | TIMESTAMPTZ | | |

#### 6.2.7 `staff`
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → profiles.id, nullable | |
| full_name | TEXT | | |
| email, phone | TEXT | | |
| role | TEXT | | kitchen, counter, helper, admin |
| department | TEXT | | |
| address | TEXT | | |
| profile_photo_url | TEXT | | |
| start_date, joining_date | DATE | | |
| is_active | BOOLEAN | | |
| **Emergency Contact** | | | |
| emergency_contact_name | TEXT | | |
| emergency_contact_phone | TEXT | | |
| emergency_contact_relation | TEXT | | |
| **Compensation** | | | |
| base_salary, hourly_rate | NUMERIC | | |
| bonus, deductions, net_salary | NUMERIC | | |
| payment_schedule | TEXT | | monthly, bi-weekly |
| bank_name, bank_account, tax_id | TEXT | | |
| **Scheduling** | | | |
| default_shift | TEXT | | morning, afternoon, evening |
| weekend_availability | BOOLEAN | | |
| overtime_eligible | BOOLEAN | | |
| working_hours_per_week | INTEGER | | |
| **Leave Management** | | | |
| annual_leave_balance | INTEGER | | |
| sick_leave_balance | INTEGER | | |
| leave_start_date, leave_end_date | DATE | | |
| leave_reason | TEXT | | |
| **Performance** | | | |
| evaluation_score | NUMERIC | | |
| performance_score | NUMERIC | | |
| performance_notes | TEXT | | |
| last_evaluation_date | DATE | | |
| next_evaluation_date | DATE | | |
| **Contract** | | | |
| contract_type | TEXT | | full-time, part-time, contract |
| hire_status | TEXT | | active, probation, terminated |
| probation_end_date | DATE | | |
| notice_period | TEXT | | |
| created_at, updated_at | TIMESTAMPTZ | | |

#### 6.2.8 `staff_documents`
| Column | Type | Description |
|---|---|---|
| id | UUID | PK |
| staff_id | UUID | FK → staff.id |
| document_type | TEXT | ID, certificate, contract, etc. |
| document_name | TEXT | |
| document_url | TEXT | Supabase Storage URL |
| expiry_date | DATE | |
| is_verified | BOOLEAN | |
| verified_by | UUID | Admin who verified |
| verified_at, created_at, updated_at | TIMESTAMPTZ | |

#### 6.2.9 `staff_attendance`
| Column | Type | Description |
|---|---|---|
| id | UUID | PK |
| staff_id | UUID | FK → staff.id |
| date | DATE | |
| status | TEXT | present, absent, half-day, leave |
| check_in, check_out | TIME | |
| notes | TEXT | |

#### 6.2.10 `shifts`
| Column | Type | Description |
|---|---|---|
| id | UUID | PK |
| staff_id | UUID | FK → staff.id |
| shift_date | DATE | |
| shift_type | TEXT | morning, afternoon, evening |
| start_time, end_time | TIME | |
| notes | TEXT | |

#### 6.2.11 `payments`
| Column | Type | Description |
|---|---|---|
| id | UUID | PK |
| order_id | UUID | FK → orders.id |
| amount | NUMERIC | |
| method | TEXT | cash, card, upi, razorpay |
| status | TEXT | pending, completed, failed, refunded |
| transaction_id | TEXT | Razorpay payment ID |
| transaction_data | JSONB | Full Razorpay response object |
| created_at, updated_at | TIMESTAMPTZ | |

#### 6.2.12 `coupons`
| Column | Type | Description |
|---|---|---|
| id | UUID | PK |
| code | TEXT | UNIQUE, coupon code |
| discount_type | TEXT | percentage, fixed |
| discount_value | NUMERIC | |
| min_order_amount | NUMERIC | Minimum cart value |
| max_discount | NUMERIC | Cap for percentage coupons |
| start_date | TIMESTAMPTZ | Validity start |
| expiry_date | TIMESTAMPTZ | Validity end |
| usage_limit | INTEGER | Max total uses |
| used_count | INTEGER | Current usage |
| is_active | BOOLEAN | |
| description | TEXT | |
| applicable_items | UUID[] | Specific menu items |
| applicable_categories | TEXT[] | Specific categories |
| created_at, updated_at | TIMESTAMPTZ | |

#### 6.2.13 `order_feedback`
| Column | Type | Description |
|---|---|---|
| id | UUID | PK |
| order_id | UUID | FK → orders.id |
| customer_id | UUID | FK → customers.id |
| overall_rating | INTEGER | 1-5 stars |
| food_quality_rating | INTEGER | 1-5 |
| service_rating | INTEGER | 1-5 |
| delivery_time_rating | INTEGER | 1-5 |
| value_for_money_rating | INTEGER | 1-5 |
| comments | TEXT | |
| customer_name, customer_email, customer_phone | TEXT | |
| created_at | TIMESTAMPTZ | |

#### 6.2.14 `invoices` & `invoice_items`
| Column (invoices) | Type | Description |
|---|---|---|
| id | UUID | PK |
| invoice_number | TEXT | Sequential identifier |
| order_id | UUID | FK → orders.id |
| display_order_id | TEXT | Human-readable order ID |
| customer_name, customer_phone, customer_email | TEXT | |
| billing_address | TEXT | |
| invoice_date, due_date | TIMESTAMPTZ | |
| subtotal, tax_amount, discount_amount, total_amount | NUMERIC | |
| status | TEXT | draft, issued, paid, cancelled, refunded |
| payment_method | TEXT | |
| notes, terms_and_conditions | TEXT | |
| is_printed | BOOLEAN | |
| print_count | INTEGER | |
| last_printed_at | TIMESTAMPTZ | |
| created_at, updated_at | TIMESTAMPTZ | |

| Column (invoice_items) | Type | Description |
|---|---|---|
| id | UUID | PK |
| invoice_id | UUID | FK → invoices.id |
| name | TEXT | |
| quantity | INTEGER | |
| unit_price, total_price | NUMERIC | |

#### 6.2.15 `support_chats` & `chat_messages`
| Column (support_chats) | Type | Description |
|---|---|---|
| id | UUID | PK |
| customer_id | UUID | FK → customers.id |
| order_id | UUID | FK → orders.id, nullable |
| status | TEXT | active, resolved, closed |
| issue | TEXT | Issue description |
| category | TEXT | Issue category |
| is_ai_active | BOOLEAN | Whether AI is handling |
| metadata | JSONB | Escalation data |
| last_message_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

| Column (chat_messages) | Type | Description |
|---|---|---|
| id | UUID | PK |
| chat_id | UUID | FK → support_chats.id |
| sender_id | UUID | |
| sender_type | TEXT | customer, admin, ai |
| content | TEXT | Message body |
| created_at | TIMESTAMPTZ | |

#### 6.2.16 `website_settings`
| Column | Type | Description |
|---|---|---|
| id | UUID | PK (singleton row) |
| site_name | TEXT | Restaurant name |
| tagline | TEXT | |
| logo_url | TEXT | |
| primary_color, secondary_color | TEXT | Hex colors |
| font_family | TEXT | |
| hero_image, hero_title, hero_subtitle | TEXT | |
| hero_cta_text, hero_cta_link | TEXT | |
| feature1_title through feature3_description | TEXT | |
| popular_dish_1 through popular_dish_3 | UUID | FK → menu_items.id |
| cta_title, cta_subtitle, cta_button_text, cta_button_link | TEXT | |
| contact_email, contact_phone, contact_address | TEXT | |
| hours_weekday, hours_weekend | TEXT | |
| social_facebook, social_twitter, social_instagram, social_linkedin, social_youtube | TEXT | |
| created_at, updated_at | TIMESTAMPTZ | |

#### 6.2.17 `knowledge_base` (AI RAG)
| Column | Type | Description |
|---|---|---|
| id | UUID | PK |
| content | TEXT | Knowledge article text |
| embedding | VECTOR(768) | Gemini embedding vector |
| metadata | JSONB | Tags, categories |
| created_at | TIMESTAMPTZ | |

### 6.3 Database Functions (RPC)

| Function | Purpose |
|---|---|
| `match_knowledge(query_embedding, match_threshold, match_count)` | Vector similarity search for AI RAG |

---

## 7. Authentication & Authorization

### 7.1 Authentication Flow

```
User (Email + Password)
        │
        ▼
┌─────────────────┐
│  Supabase Auth   │ ── JWT Token issued
│  (email/password)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AuthContext      │ ── Subscribes to onAuthStateChange
│  (React Context)  │ ── Fetches role from profiles table
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ProtectedRoute   │ ── Checks user.role against requiredRole
│  (Route Guard)    │ ── Admin bypasses all role checks
└─────────────────┘
```

### 7.2 Signup Flow

1. User submits email, password, name, phone
2. `supabase.auth.signUp()` creates auth.users entry
3. Supabase trigger creates `profiles` row (role = 'customer')
4. App auto-creates `customers` row with phone number
5. User redirected to home page

### 7.3 Role-Based Access Control (RBAC)

| Role | Accessible Routes | Permissions |
|---|---|---|
| **customer** | /, /menu, /cart, /auth, /orders, /track/:id | Browse, order, track, feedback |
| **kitchen** | /kitchen | View orders, update item status, mark ready |
| **counter** | /counter | Create orders, process payments, view orders |
| **admin** | /admin/* (all 14 sub-routes) | Full system access, all CRUD operations |

**Note:** Admin role can access kitchen and counter dashboards (bypass in ProtectedRoute).

### 7.4 Session Management

- **Storage:** localStorage (Supabase default)
- **Token Refresh:** Automatic via `autoRefreshToken: true`
- **Session Persistence:** `persistSession: true`
- **Subscription:** `onAuthStateChange` listener in AuthContext

---

## 8. Real-Time Architecture

### 8.1 Supabase Realtime (PostgreSQL Changes)

The application uses Supabase Realtime for live data synchronization via WebSocket channels.

**Generic Hook:** `useRealtimeSync<T>`

```
Interface:
  table: string          → PostgreSQL table name
  onInsert(record)       → Callback for INSERT events
  onUpdate(record)       → Callback for UPDATE events
  onDelete(record)       → Callback for DELETE events
  filter?: string        → Optional RLS filter expression
```

**Active Subscriptions:**

| Subscriber | Table | Events | Purpose |
|---|---|---|---|
| KitchenDashboard | orders | INSERT, UPDATE | Live order feed |
| OrderTracking | orders | UPDATE | Status progression for customer |
| AdminDashboard | orders | INSERT, UPDATE | Stats refresh |
| WebsiteSettingsContext | website_settings | UPDATE | CMS sync across tabs |
| useCategories | categories | INSERT, UPDATE, DELETE | Category list refresh |
| useMenuItems | menu_items | INSERT, UPDATE, DELETE | Menu availability |

### 8.2 Socket.IO (Support Chat)

**Configuration (`src/config/socket.ts`):**

| Setting | Development | Production |
|---|---|---|
| URL | `http://localhost:5000` | Current origin |
| Path | `/socket.io` | `/.netlify/functions/api/socket.io` |
| Transports | WebSocket, Polling | WebSocket, Polling |
| Reconnection | Enabled | Enabled |
| Timeout | 20 seconds | 20 seconds |
| Rate Limit | 10 events/second | 10 events/second |

**Events:**

| Event | Direction | Purpose |
|---|---|---|
| `chat:started` | Server → Client | New chat notification |
| `chat:message` | Bidirectional | Message exchange |
| `chat:resolved` | Server → Client | Chat marked resolved |
| `chat:typing` | Bidirectional | Typing indicator |
| `admin:getChats` | Client → Server | Admin fetches chat list |

### 8.3 Polling Fallback

- Order tracking page: Auto-refresh every **5 seconds** as a fallback alongside real-time subscriptions

---

## 9. Payment Integration Architecture

### 9.1 Supported Payment Methods

| Method | Gateway | Flow |
|---|---|---|
| Cash | None (manual) | Order created → payment_status = 'pending' → Counter confirms |
| Card | Razorpay | Razorpay Checkout modal → Verify signature → Mark completed |
| UPI | Razorpay | Razorpay Checkout modal → UPI intent/QR → Verify → Mark completed |
| Online | Razorpay | Generic Razorpay flow |

### 9.2 Razorpay Payment Flow

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Frontend    │     │  Edge Function    │     │   Razorpay   │
│ (Cart.tsx +   │     │  (create-order)   │     │   Server     │
│  PaymentModal)│     │                  │     │              │
└──────┬───────┘     └────────┬─────────┘     └──────┬───────┘
       │                      │                       │
       │ 1. loadScript()      │                       │
       │    (checkout.js)     │                       │
       │◄─────────────────────┼───────────────────────┤
       │                      │                       │
       │ 2. Create Order ────►│ 3. POST /orders ─────►│
       │                      │                       │
       │ 4. Order ID ◄────────│◄── razorpay_order_id ─┤
       │                      │                       │
       │ 5. Open Razorpay     │                       │
       │    Checkout Modal    │                       │
       │──────────────────────┼──────────────────────►│
       │                      │                       │
       │ 6. User Pays         │                       │
       │    (Card/UPI/NetBanking)                     │
       │                      │                       │
       │ 7. Payment Response  │                       │
       │◄─────────────────────┼───────────────────────┤
       │  {payment_id,        │                       │
       │   order_id,          │                       │
       │   signature}         │                       │
       │                      │                       │
       │ 8. Verify ──────────►│ 9. Verify Signature──►│
       │                      │    (HMAC SHA256)      │
       │                      │                       │
       │ 10. Confirmed ◄──────│◄── Verified ──────────┤
       │                      │                       │
       │ 11. Save payment     │                       │
       │     to DB            │                       │
       │ 12. Update order     │                       │
       │     payment_status   │                       │
       │ 13. Generate invoice │                       │
       │ 14. Clear cart       │                       │
```

### 9.3 Payment Data Model

```typescript
interface PaymentData {
  id?: string;
  orderId: string;
  method: 'cash' | 'card' | 'upi' | 'razorpay';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount: number;
  transactionId?: string;       // razorpay_payment_id
  transactionData?: object;     // Full Razorpay response (JSONB)
  createdAt?: string;
}
```

---

## 10. AI Chatbot Architecture

### 10.1 Overview

The chatbot uses a **RAG (Retrieval-Augmented Generation)** architecture powered by Google Gemini API with vector embeddings stored in Supabase.

### 10.2 Components

| Component | Technology | Description |
|---|---|---|
| Chat UI | React (SupportChatModal) | Floating button + modal window |
| AI Backend | Supabase Edge Function (`ai-chat`) | Deno serverless function |
| Embedding Model | Gemini Embedding API | 768-dimension vectors |
| Generation Model | Gemini 2.0 Flash Lite | Low-latency text generation |
| Knowledge Store | PostgreSQL + pgvector | Vector similarity search |
| Escalation | Socket.IO + support_chats table | Human handoff |

### 10.3 Conversation Flow

```
Customer opens chat
        │
        ▼
┌─────────────────────┐
│  AI Chat (Gemini)    │ ◄── is_ai_active = true
│  - RAG retrieval     │
│  - Context-aware     │
│  - Max 300 tokens    │
└──────────┬──────────┘
           │
     ┌─────▼─────┐
     │ Resolved?  │──── Yes ──→ Close chat
     └─────┬─────┘
           │ No / Complex
           ▼
┌─────────────────────┐
│  Escalate to Human   │ ◄── is_ai_active = false
│  - Admin notified    │
│  - Socket.IO chat    │
│  - Full chat history │
│    preserved         │
└─────────────────────┘
```

### 10.4 Knowledge Base Schema

- **Table:** `knowledge_base`
- **Vector Column:** `embedding VECTOR(768)`
- **Search Function:** `match_knowledge(query_embedding, match_threshold=0.3, match_count=5)`
- **Algorithm:** Cosine similarity via pgvector extension

---

## 11. State Management Design

### 11.1 Architecture Decision

The application uses **React Context API** for global state (no Redux/Zustand). Each context encapsulates a specific domain.

### 11.2 Context Providers

```
<AuthProvider>              ← User auth state, role, login/signup/logout
  <CartProvider>            ← Cart items, add/remove/clear, localStorage sync
    <WebsiteSettingsProvider> ← Dynamic site config, real-time sync
      <SocketProvider>      ← Socket.IO connection for chat
        <App />
      </SocketProvider>
    </WebsiteSettingsProvider>
  </CartProvider>
</AuthProvider>
```

| Context | State Managed | Persistence | Real-Time |
|---|---|---|---|
| AuthContext | user, role, loading | Supabase session (localStorage) | onAuthStateChange |
| CartContext | items[], lastAction | localStorage ('tastybytes_cart') | No |
| WebsiteSettingsContext | settings object, isEditing | Supabase DB | Supabase Realtime |
| SocketContext | socket instance, isConnected | In-memory only | Socket.IO events |

### 11.3 Custom Hooks (Domain Logic)

| Hook | Domain | Data Source | Caching |
|---|---|---|---|
| useOrders | Order CRUD + tracking | Supabase + Realtime | React state |
| useMenuItems | Menu browsing | Supabase + Realtime | 5-min cache + pagination |
| useCategories | Category listing | Supabase + Realtime | React state |
| useAdminData | Dashboard aggregation | Supabase | React state |
| useAdminChats | Support chat management | Socket.IO | Optimistic updates |
| useAiChat | AI chat integration | Edge Function | React state |
| useRealtimeSync | Generic RT subscription | Supabase Realtime | Callback-based |
| useOrderForm | Order form state | Local state | React Hook Form |
| useToast | Notifications | react-hot-toast | N/A |
| useImagePreloader | Image loading | Browser cache | Intersection observer |

### 11.4 Cart State Management (Reducer Pattern)

```
Actions:
  ADD_TO_CART      → Add item or increment quantity
  REMOVE_FROM_CART → Remove item completely
  UPDATE_QUANTITY  → Set specific quantity (remove if 0)
  CLEAR_CART       → Empty cart + toast notification
  CLEAR_CART_SILENT → Empty cart without notification

Side Effects:
  - localStorage sync on every state change
  - Toast notifications on add/remove/clear
  - Last action tracking for undo capability
```

---

## 12. Routing & Navigation Architecture

### 12.1 Route Map

```
/                          → Home (public)
/menu                      → Menu browsing (public)
/cart                       → Shopping cart (public)
/auth                       → Login / Signup (public)
/orders                     → Order history (public, login recommended)
/track/:orderId             → Order tracking (public)

/kitchen                    → Kitchen Dashboard (role: kitchen)
/counter                    → Counter Dashboard (role: counter)

/admin                      → Admin Dashboard (role: admin)
/admin/menu                 → Menu Management
/admin/categories           → Category Management
/admin/orders               → Order Management
/admin/customers            → Customer Management
/admin/staff                → Staff Management
/admin/staff/:id            → Staff Profile (detail view)
/admin/coupons              → Coupon Management
/admin/feedback             → Feedback Management
/admin/invoices             → Invoice Management
/admin/invoice-settings     → Invoice Template Settings
/admin/qr-codes             → QR Code Management
/admin/support              → Customer Support Chat
/admin/website              → Website CMS Settings
```

### 12.2 Layout Structure

```
Public Routes:
  <Layout>
    <Navbar />          ← Dynamic: hides on scroll down, shows on scroll up
    <Outlet />          ← Page content
    <FloatingCart />     ← Persistent cart icon with item count
    <FloatingChatButton /> ← Support chat trigger
    <Footer />
  </Layout>

Admin Routes:
  <AdminLayout>
    <Sidebar />         ← Navigation links to all 14 admin modules
    <Outlet />          ← Admin page content
  </AdminLayout>

Kitchen/Counter:
  No shared layout — full-screen dashboard
```

### 12.3 Route Protection

```typescript
// ProtectedRoute Component Logic:
1. If loading → show LoadingSpinner
2. If !user → redirect to /auth
3. If user.role !== requiredRole AND user.role !== 'admin' → redirect to /
4. If authorized → render children
```

---

## 13. Module-Wise Feature Architecture

### 13.1 Customer Module

| Feature | Components | Data | Real-Time |
|---|---|---|---|
| Home Page | Home.tsx | website_settings, menu_items (popular) | Settings sync |
| Menu Browsing | Menu/, MenuGrid, CategorySelector | menu_items, categories | Item availability |
| Cart & Checkout | Cart.tsx, EnhancedPaymentModal | CartContext, coupons | No |
| Order History | OrderHistory.tsx | orders + order_items | No |
| Order Tracking | OrderTracking.tsx | orders (single) | Yes (status updates) |
| Feedback | FeedbackForm | order_feedback | No |
| Support Chat | SupportChatModal | support_chats, chat_messages | Yes (Socket.IO) |
| Auth | Auth.tsx, LoginForm, SignupForm | profiles, customers | No |

### 13.2 Kitchen Module

| Feature | Components | Data | Real-Time |
|---|---|---|---|
| Order Feed | KitchenDashboard | orders + order_items | Yes (new orders, status changes) |
| Item Status Control | Per-item toggles | order_items.status | Yes |
| Order Status Transitions | Status buttons | orders.status | Yes |
| Priority Management | Priority badges | orders (derived) | Yes |
| Filters & Search | Built-in controls | Local state | No |

### 13.3 Counter Module

| Feature | Components | Data | Real-Time |
|---|---|---|---|
| Order Creation | CounterDashboard (create tab) | menu_items, orders, customers | No |
| Customer Lookup | Phone/name search | customers | No |
| Coupon Application | Coupon input | coupons | No |
| Order Management | CounterDashboard (orders tab) | orders | Yes |
| Payment Processing | Payment method selector | payments | No |
| Invoice Generation | Auto-generate on order | invoices | No |

### 13.4 Admin Module (12 Sub-Modules)

| Module | Key Operations | Notable Features |
|---|---|---|
| **Dashboard** | View stats, charts | Real-time order metrics, revenue chart, period selector |
| **Menu Management** | CRUD menu items | Image upload, virtual scrolling, bulk import/export |
| **Category Management** | CRUD categories | Drag-and-drop reorder, icon selector (Lucide) |
| **Order Management** | View/update orders | Invoice download/print/email per order |
| **Customer Management** | View/edit customers | Analytics (LTV, frequency), tag system, Excel export |
| **Staff Management** | CRUD staff | Attendance tracking, shift scheduling, document management, performance reviews, payroll |
| **Coupon Management** | CRUD coupons | Category/item targeting, analytics, batch actions, CSV export |
| **Feedback Management** | View/analyze feedback | Multi-dimension ratings, sentiment filtering |
| **Invoice Management** | View/manage invoices | Download/print/email, edit details, status tracking |
| **Invoice Template Settings** | Configure templates | 3 templates (modern/classic/minimal), live preview, tax labels |
| **QR Code Management** | Generate/download QR codes | Single + bulk generation (max 50), ZIP download |
| **Customer Support** | Manage support chats | Chat list, real-time messaging, AI escalation toggle |
| **Website Settings** | CMS configuration | 7 setting tabs, image upload, color picker, live preview |

---

## 14. Data Flow Diagrams

### 14.1 Customer Ordering Flow

```
Browse Menu ──→ Add to Cart ──→ View Cart ──→ Apply Coupon (optional)
                                    │
                                    ▼
                            Select Order Type
                           (Dine-in / Takeaway)
                                    │
                              ┌─────▼─────┐
                              │ Dine-in?  │── Yes ──→ Enter Table Number
                              └─────┬─────┘
                                    │ No (Takeaway)
                                    ▼
                            Select Payment Method
                           ┌────┬────┬────────┐
                           │    │    │        │
                         Cash  Card  UPI   Online
                           │    │    │        │
                           │    └────┴────────┘
                           │         │
                           │    Razorpay Modal
                           │         │
                           ▼         ▼
                      Create Order in DB
                           │
                           ▼
                    Generate Invoice
                           │
                           ▼
                    Clear Cart + Redirect
                    to Order Tracking
```

### 14.2 Order Lifecycle

```
                    ┌─────────┐
                    │ PENDING  │ ←── Order created
                    └────┬────┘
                         │ Kitchen accepts
                    ┌────▼────┐
                    │PREPARING│ ←── Kitchen updates item statuses
                    └────┬────┘
                         │ All items completed
                    ┌────▼────┐
                    │  READY   │ ←── Kitchen marks order ready
                    └────┬────┘
                         │ Served / Picked up
                    ┌────▼────┐
                    │DELIVERED│ ←── Final state
                    └─────────┘

              (At any point before DELIVERED)
                         │
                    ┌────▼─────┐
                    │CANCELLED │ ←── Kitchen/Admin cancels
                    └──────────┘
```

### 14.3 Support Chat Escalation Flow

```
Customer starts chat
        │
        ▼
Create support_chats record
(is_ai_active = true)
        │
        ▼
┌───────────────────┐
│ AI Handles Chat    │ ←── Edge Function: ai-chat
│ (Gemini RAG)       │     - Embed query
│                    │     - Search knowledge base
│                    │     - Generate response
└────────┬──────────┘
         │
    ┌────▼────────┐
    │ Needs Human? │── No ──→ Continue AI chat
    └────┬────────┘
         │ Yes
         ▼
┌───────────────────┐
│ Escalate           │
│ is_ai_active=false │
│ Admin notified     │
│ (Socket.IO event)  │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Admin Live Chat    │ ←── Real-time via Socket.IO
│ Customer ↔ Admin   │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Mark Resolved      │
│ status = 'resolved'│
└───────────────────┘
```

---

## 15. Invoice & PDF Generation Architecture

### 15.1 Generation Pipeline

```
Order Completion
       │
       ▼
Fetch Order + Items + Customer
       │
       ▼
Create Invoice Record in DB
(invoices + invoice_items tables)
       │
       ▼
Generate PDF (client-side)
├── jsPDF — Document creation
├── jspdf-autotable — Itemized table
└── Template Selection:
    ├── Modern (default)
    ├── Classic
    └── Minimal
       │
       ▼
Actions Available:
├── Download (file-saver)
├── Print (window.print)
└── Email (Edge Function: send-invoice)
```

### 15.2 Invoice Template Configuration

Stored in `website_settings` or dedicated invoice settings:
- Company name, logo, address
- Invoice number format
- Color scheme
- Tax labels (CGST/SGST)
- Currency symbol (₹)
- Footer text
- Terms and conditions

### 15.3 Tax Calculation

```
Subtotal = Σ(item.price × item.quantity)
Discount = coupon applied amount (if any)
Tax = (Subtotal - Discount) × 0.18  (18% GST)
Total = Subtotal - Discount + Tax
```

---

## 16. File Storage Architecture

### 16.1 Supabase Storage Buckets

| Bucket | Purpose | Access |
|---|---|---|
| Menu item images | Product photos for menu | Public |
| Logos | Restaurant branding | Public |
| Hero images | Home page hero background | Public |
| Staff documents | ID cards, certificates, contracts | Private (authenticated) |
| Staff photos | Profile pictures | Public |

### 16.2 Image Upload Flow

```
User selects file
       │
       ▼
Client-side validation
(file type, size limits)
       │
       ▼
supabase.storage
  .from('bucket-name')
  .upload(path, file)
       │
       ▼
Get public URL
       │
       ▼
Save URL to relevant table
(menu_items.image, website_settings.logo_url, etc.)
```

---

## 17. Error Handling Strategy

### 17.1 Layers of Error Handling

| Layer | Mechanism | Scope |
|---|---|---|
| **Global** | `window.onerror` + `unhandledrejection` | Uncaught errors |
| **React** | `<ErrorBoundary>` component | Component tree crashes |
| **Async Operations** | try-catch in hooks/services | API calls, DB queries |
| **User Feedback** | `react-hot-toast` notifications | All user-facing errors |
| **Form Validation** | React Hook Form + Zod schemas | Input validation |
| **Network** | `<NetworkErrorAlert>` component | Connectivity issues |
| **Critical Render** | Fallback UI in main.tsx | App fails to mount |

### 17.2 Error Recovery Patterns

- **Retry with backoff:** AI chat Edge Function (2 retries, exponential)
- **Graceful degradation:** WebsiteSettings handles missing table gracefully
- **Fallback UI:** main.tsx renders error message if App fails to mount
- **Toast dismissal:** EmergencyToastDismiss component for stuck toasts

---

## 18. Performance Optimization Strategies

### 18.1 Implemented Optimizations

| Strategy | Implementation | Location |
|---|---|---|
| **Virtual Scrolling** | @tanstack/react-virtual | MenuManagement (large datasets) |
| **Windowed Rendering** | react-window | Long lists in admin |
| **Image Lazy Loading** | react-intersection-observer | Menu grid items |
| **Image Preloading** | useImagePreloader hook | Menu browsing |
| **Pagination** | Cursor-based, 10 items/page | useMenuItems |
| **Cache with TTL** | 5-minute cache expiry | Menu items data |
| **Debounced Updates** | 1.5s debounce | Website settings auto-save |
| **Animations** | Framer Motion (GPU-accelerated) | Page transitions, cart |
| **Bundle Splitting** | Vite automatic code splitting | Build output |
| **Conditional Rendering** | React state guards | Dashboard charts |

### 18.2 Data Fetching Strategy

```
Initial Load:
  → Supabase query with pagination/limits
  → Cache in React state
  → Set cache expiry timestamp

Subsequent Access:
  → Check cache validity (5-min TTL)
  → If valid → use cached data
  → If expired → re-fetch from Supabase

Real-Time Updates:
  → Supabase channel subscription
  → On INSERT/UPDATE/DELETE → update local state
  → No full re-fetch needed
```

---

## 19. Security Architecture

### 19.1 Authentication Security

| Measure | Implementation |
|---|---|
| Password hashing | Supabase Auth (bcrypt, server-side) |
| JWT tokens | Issued by Supabase, short-lived + refresh |
| Session storage | localStorage with auto-refresh |
| CSRF protection | SameSite cookies (Supabase managed) |

### 19.2 Authorization Security

| Measure | Implementation |
|---|---|
| Row Level Security (RLS) | PostgreSQL policies per table |
| Role-based route protection | ProtectedRoute component |
| API key separation | ANON key (client) vs SERVICE_ROLE key (Edge Functions) |
| Edge Function auth | Service Role Key for admin operations |

### 19.3 Data Security

| Measure | Implementation |
|---|---|
| Input validation | Zod schemas + React Hook Form |
| Phone validation | 10-digit format enforcement |
| Payment data | Transaction IDs only; no card numbers stored |
| CORS | Configured on Edge Functions |
| Environment variables | VITE_ prefix for client-safe vars |

### 19.4 Environment Variables

```
Client-Side (VITE_ prefix — exposed to browser):
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  VITE_RAZORPAY_KEY_ID
  VITE_API_BASE_URL
  VITE_BUSINESS_NAME

Server-Side (Edge Functions only — never exposed):
  SUPABASE_SERVICE_ROLE_KEY
  GEMINI_API_KEY
  RAZORPAY_KEY_SECRET
```

---

## 20. Deployment Architecture

### 20.1 Production Setup

```
┌────────────────────────────────────┐
│           Netlify CDN               │
│  ┌──────────────────────────────┐  │
│  │  Static Assets (Vite Build)   │  │
│  │  - HTML, CSS, JS bundles      │  │
│  │  - Images, fonts              │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  Netlify Functions            │  │
│  │  - Socket.IO server           │  │
│  │  - API proxy (if any)         │  │
│  └──────────────────────────────┘  │
└────────────────┬───────────────────┘
                 │
    ┌────────────▼────────────┐
    │    Supabase Cloud        │
    │  ┌────────────────────┐  │
    │  │ PostgreSQL Database │  │
    │  │ (15+ tables)        │  │
    │  └────────────────────┘  │
    │  ┌────────────────────┐  │
    │  │ Auth Service        │  │
    │  └────────────────────┘  │
    │  ┌────────────────────┐  │
    │  │ Realtime Service    │  │
    │  │ (WebSocket)         │  │
    │  └────────────────────┘  │
    │  ┌────────────────────┐  │
    │  │ Edge Functions      │  │
    │  │ (Deno Workers)      │  │
    │  └────────────────────┘  │
    │  ┌────────────────────┐  │
    │  │ Storage Buckets     │  │
    │  └────────────────────┘  │
    └─────────────────────────┘
```

### 20.2 Environment Detection

```typescript
const isDevelopment =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

// Routes API/Socket calls accordingly:
// Dev:  http://localhost:5000
// Prod: /.netlify/functions/api
```

### 20.3 Build Pipeline

```
Source (TypeScript + React)
        │
        ▼
   Vite Build
   (vite build)
        │
        ├── Type checking (tsc)
        ├── ESLint validation
        ├── Bundle splitting
        ├── Tree shaking
        ├── Minification
        └── Asset hashing
        │
        ▼
   dist/ folder
        │
        ▼
   Netlify Deploy
   (git-based CI/CD)
```

---

## 21. Non-Functional Requirements

### 21.1 Performance

| Metric | Target | Implementation |
|---|---|---|
| First Contentful Paint | < 2s | Vite code splitting, CDN delivery |
| Time to Interactive | < 3s | Lazy loading, deferred subscriptions |
| Real-time latency | < 500ms | Supabase WebSocket, Socket.IO |
| Menu scroll | 60 FPS | Virtual scrolling, image lazy loading |
| Large datasets | 1000+ items | @tanstack/react-virtual |

### 21.2 Scalability

| Dimension | Approach |
|---|---|
| Users | Supabase managed infrastructure (auto-scaling) |
| Data | PostgreSQL with pagination + caching |
| Real-time | Supabase Realtime (managed WebSocket scaling) |
| Media | Supabase Storage CDN |
| Serverless | Edge Functions (Deno isolates, auto-scaling) |

### 21.3 Reliability

| Mechanism | Implementation |
|---|---|
| Error boundaries | React ErrorBoundary wrapping entire app |
| Retry logic | Exponential backoff for AI chat |
| Session recovery | Auto-refresh tokens |
| Offline cart | localStorage persistence |
| Fallback UI | Critical error fallback in main.tsx |

### 21.4 Maintainability

| Practice | Implementation |
|---|---|
| TypeScript | Full type safety across codebase |
| Modular architecture | Feature-based directory structure |
| Custom hooks | Reusable domain logic |
| Auto-generated types | `supabase gen types typescript` |
| Consistent patterns | Context + hooks for all state domains |

### 21.5 Browser Compatibility

| Requirement | Support |
|---|---|
| Modern browsers | Chrome, Firefox, Safari, Edge (latest 2 versions) |
| Mobile | Responsive design, touch-friendly |
| Minimum | ES2020+ (Vite target) |
| Node.js | >= 18.0.0 (build tooling) |

---

## Appendix A: Key File Reference

| File | Purpose |
|---|---|
| `src/App.tsx` | Root component, routing, provider hierarchy |
| `src/main.tsx` | Entry point, global error handlers |
| `src/context/AuthContext.tsx` | Authentication state management |
| `src/context/CartContext.tsx` | Shopping cart state + localStorage |
| `src/context/WebsiteSettingsContext.tsx` | Dynamic CMS configuration |
| `src/context/SocketContext.tsx` | Socket.IO connection management |
| `src/lib/supabase.ts` | Supabase client initialization |
| `src/lib/razorpay.ts` | Razorpay SDK integration |
| `src/hooks/useRealtimeSync.ts` | Generic real-time subscription hook |
| `src/hooks/useOrders.ts` | Order CRUD + real-time sync |
| `src/utils/invoiceGenerator.ts` | PDF invoice generation |
| `src/utils/customerUtils.ts` | Customer analytics engine |
| `supabase/functions/ai-chat/index.ts` | AI chatbot Edge Function |
| `src/types/supabase.ts` | Auto-generated database types |

---

## Appendix B: Third-Party Integration Summary

| Service | Purpose | Auth Method | SDK/Library |
|---|---|---|---|
| Supabase | BaaS (DB, Auth, RT, Storage) | API Keys (anon + service role) | @supabase/supabase-js |
| Razorpay | Payment processing | Key ID + Secret | checkout.js (CDN) |
| Google Gemini | AI chat (RAG) | API Key | REST API (fetch) |
| Netlify | Hosting + Serverless | Git integration | CLI |

---

*Document derived from complete codebase analysis of TastyBytes Version 3 (ChatBot Edition). All architectural details, schemas, data flows, and design decisions are based on actual implemented code — not specifications or planned features.*
