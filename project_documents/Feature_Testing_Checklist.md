# TastyBytes — Complete Feature List & Testing Checklist
### Grouped by Dashboard / Module
**Derived From:** Codebase Analysis (March 2026)
**Purpose:** Feature-by-feature testing reference

---

## How to Use This Document

Each feature has a checkbox `[ ]` for testers to mark as tested. Features are grouped by dashboard/module. Each feature entry includes:
- **Feature ID** (e.g., `CUS-HOME-001`) for tracking
- **Feature Name**
- **Expected Behavior**
- **Testable Actions** (specific things to verify)

---

# SECTION A: CUSTOMER-FACING FEATURES

---

## A1. Navigation Bar (Global)

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| NAV-001 | Logo display | Shows configurable restaurant logo + site name from website settings | [ ] |
| NAV-002 | Logo click | Navigates to home page `/` | [ ] |
| NAV-003 | Home link | Navigates to `/` | [ ] |
| NAV-004 | Menu link | Navigates to `/menu` | [ ] |
| NAV-005 | Orders link (logged in) | Navigates to `/orders`; hidden when logged out | [ ] |
| NAV-006 | Cart icon with badge | Shows shopping bag icon with item count badge; navigates to `/cart` | [ ] |
| NAV-007 | Cart badge animation | Badge animates when count changes | [ ] |
| NAV-008 | Login button (logged out) | Shown when user is not authenticated; navigates to `/auth` | [ ] |
| NAV-009 | Sign Up button (logged out) | Shown when user is not authenticated; navigates to `/auth` | [ ] |
| NAV-010 | User name display (logged in) | Shows authenticated user's name | [ ] |
| NAV-011 | Logout button (logged in) | Logs user out; clears session; redirects appropriately | [ ] |
| NAV-012 | Scroll hide/show | Navbar hides on scroll down, reappears on scroll up | [ ] |
| NAV-013 | Background blur | Navbar gets blur/opacity effect on scroll | [ ] |
| NAV-014 | Active link highlight | Current page link has underline/highlight animation | [ ] |
| NAV-015 | Mobile hamburger menu | Hamburger icon toggles mobile dropdown menu | [ ] |
| NAV-016 | Mobile menu links | All nav links accessible in mobile dropdown | [ ] |
| NAV-017 | Mobile menu icon animation | Hamburger icon animates to X on open | [ ] |

---

## A2. Floating Cart Button (Global)

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| FCART-001 | Floating button display | Shopping bag icon visible as floating action button on all pages | [ ] |
| FCART-002 | Item count badge | Shows number of items in cart | [ ] |
| FCART-003 | Click action | Navigates to `/cart` page | [ ] |

---

## A3. Floating Chat Button (Global)

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| FCHAT-001 | Chat button display | Message icon floating action button visible on customer pages | [ ] |
| FCHAT-002 | Pulse animation | Button has animated pulse effect | [ ] |
| FCHAT-003 | Click action | Opens Support Chat Modal | [ ] |

---

## A4. Home Page

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| HOME-001 | Hero section display | Shows background image, title, subtitle from website settings | [ ] |
| HOME-002 | Hero CTA button | Button with configurable text; navigates to configurable link (default: /menu) | [ ] |
| HOME-003 | Dynamic colors | Primary/secondary colors from website settings applied throughout | [ ] |
| HOME-004 | Features section | 3 feature cards with configurable title, description, and dynamic Lucide icons | [ ] |
| HOME-005 | Popular dishes section | Displays up to 3 popular dishes selected in admin settings | [ ] |
| HOME-006 | Popular dish images | Each popular dish shows image, name, and price | [ ] |
| HOME-007 | Order Now button | Button in popular dishes section navigates to `/menu` | [ ] |
| HOME-008 | CTA section | Bottom call-to-action with configurable title, subtitle, button | [ ] |
| HOME-009 | View Full Menu button | CTA button navigates to `/menu` | [ ] |
| HOME-010 | Framer Motion animations | Page elements animate on scroll/load | [ ] |
| HOME-011 | Responsive layout | All sections adapt to mobile/tablet/desktop | [ ] |

---

## A5. Menu Page

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| MENU-001 | Menu items grid | Items displayed in grid layout (1 col mobile, 2 col desktop) | [ ] |
| MENU-002 | Item card — image | Each card shows item image with lazy loading | [ ] |
| MENU-003 | Item card — name | Item name displayed prominently | [ ] |
| MENU-004 | Item card — description | Item description text shown | [ ] |
| MENU-005 | Item card — price | Price displayed with ₹ symbol | [ ] |
| MENU-006 | Item card — availability | Unavailable items visually indicated | [ ] |
| MENU-007 | Add to Cart button | Adds item to cart; toast notification shown | [ ] |
| MENU-008 | Quantity selector | If item already in cart, shows +/- controls instead of Add button | [ ] |
| MENU-009 | Search bar | Real-time search filtering by item name and description | [ ] |
| MENU-010 | Category filter buttons | "All" + dynamic category buttons; filters items by category | [ ] |
| MENU-011 | Sticky category selector | Category bar stays visible on scroll | [ ] |
| MENU-012 | Smart header animation | Header hides on scroll down, shows on scroll up | [ ] |
| MENU-013 | Filter modal | Filter icon opens advanced filter modal | [ ] |
| MENU-014 | Filter — price range | Slider to set min/max price range | [ ] |
| MENU-015 | Filter — sort options | Sort by: Popular, Price Low-High, Price High-Low, Newest | [ ] |
| MENU-016 | Filter — dietary tags | Checkbox filters: Vegetarian, Vegan, Gluten-free, Spicy | [ ] |
| MENU-017 | Filter — apply | Apply button filters menu items | [ ] |
| MENU-018 | Filter — reset | Reset button clears all filters | [ ] |
| MENU-019 | Loading spinner | Shown while menu items are fetching | [ ] |
| MENU-020 | Empty state | "No items found" message when search/filter returns no results | [ ] |
| MENU-021 | Pagination / load more | Load more items as user scrolls or clicks load more | [ ] |

---

## A6. Cart Page

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| CART-001 | Cart items display | Shows all items in cart with image, name, price | [ ] |
| CART-002 | Quantity increment (+) | Increases item quantity by 1 | [ ] |
| CART-003 | Quantity decrement (-) | Decreases item quantity by 1; removes if quantity becomes 0 | [ ] |
| CART-004 | Remove item button | Removes item from cart entirely | [ ] |
| CART-005 | Order type — Dine In | Selects dine-in order type; shows table number field | [ ] |
| CART-006 | Order type — Takeaway | Selects takeaway order type; hides table number field | [ ] |
| CART-007 | Table number input | Input field for table number (required for dine-in) | [ ] |
| CART-008 | Coupon code input | Text field to enter coupon code (auto-uppercased) | [ ] |
| CART-009 | Apply coupon button | Validates coupon against DB; applies discount if valid | [ ] |
| CART-010 | Coupon — expiry validation | Rejects expired coupons with error message | [ ] |
| CART-011 | Coupon — min order validation | Rejects if cart subtotal below coupon's minimum order amount | [ ] |
| CART-012 | Coupon — usage limit validation | Rejects if coupon has reached maximum usage count | [ ] |
| CART-013 | Coupon — percentage discount | Calculates percentage discount correctly (respects max cap) | [ ] |
| CART-014 | Coupon — fixed discount | Applies fixed amount discount correctly | [ ] |
| CART-015 | Applied coupon display | Shows coupon code and discount amount after applying | [ ] |
| CART-016 | Remove coupon button | Removes applied coupon; recalculates totals | [ ] |
| CART-017 | Subtotal calculation | Correctly sums (price × quantity) for all items | [ ] |
| CART-018 | Discount display | Shows discount amount (if coupon applied) | [ ] |
| CART-019 | Tax calculation (18% GST) | Tax = (Subtotal - Discount) × 0.18 | [ ] |
| CART-020 | Total calculation | Total = Subtotal - Discount + Tax | [ ] |
| CART-021 | Proceed to Checkout — login check | If not logged in, prompts user to log in | [ ] |
| CART-022 | Proceed to Checkout — table validation | If dine-in and no table number, shows error | [ ] |
| CART-023 | Proceed to Checkout — opens payment modal | Opens EnhancedPaymentModal on valid checkout | [ ] |
| CART-024 | Empty cart state | Shows "Your cart is empty" message with Browse Menu link | [ ] |
| CART-025 | Cart persistence | Cart survives page refresh (localStorage) | [ ] |

---

## A7. Payment Modal

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| PAY-001 | Modal open/close | Opens on checkout; closes on X button or backdrop | [ ] |
| PAY-002 | Online Payment option | Selectable; description "Pay online with Card/UPI/Net Banking" | [ ] |
| PAY-003 | Cash Payment option | Selectable; description "Pay at counter after ordering" | [ ] |
| PAY-004 | Razorpay checkout | Selecting Online opens Razorpay modal with correct amount | [ ] |
| PAY-005 | Razorpay — card payment | Card payment flow completes successfully | [ ] |
| PAY-006 | Razorpay — UPI payment | UPI payment flow completes successfully | [ ] |
| PAY-007 | Cash — order creation | Creates order with payment_status = 'pending' | [ ] |
| PAY-008 | Payment success | Order created in DB; invoice generated; cart cleared | [ ] |
| PAY-009 | Payment failure | Error toast shown; order not finalized | [ ] |
| PAY-010 | Redirect after payment | User redirected to order tracking page | [ ] |
| PAY-011 | Coupon usage increment | Coupon used_count incremented after successful order | [ ] |

---

## A8. Authentication Page

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| AUTH-001 | Login/Signup toggle | Animated toggle between Login and Signup forms | [ ] |
| **Login Form** | | | |
| AUTH-002 | Email field | Required; validates email format | [ ] |
| AUTH-003 | Password field | Required; validates minimum length | [ ] |
| AUTH-004 | Login button | Authenticates via Supabase; redirects on success | [ ] |
| AUTH-005 | Login loading state | Button shows "Logging in..." during request | [ ] |
| AUTH-006 | Login error handling | Toast notification on invalid credentials | [ ] |
| AUTH-007 | Switch to Signup link | Switches form to signup mode | [ ] |
| **Signup Form** | | | |
| AUTH-008 | Name field | Required validation | [ ] |
| AUTH-009 | Phone field | Required; 10-digit validation; error message on invalid | [ ] |
| AUTH-010 | Email field | Required; email format validation | [ ] |
| AUTH-011 | Password field | Required; minimum 6 characters | [ ] |
| AUTH-012 | Create Account button | Creates auth user + profile + customer record | [ ] |
| AUTH-013 | Signup loading state | Button shows "Creating account..." during request | [ ] |
| AUTH-014 | Signup error handling | Toast notification on errors (duplicate email, etc.) | [ ] |
| AUTH-015 | Field-level errors | Red border + error message below invalid fields | [ ] |
| AUTH-016 | Switch to Login link | Switches form to login mode | [ ] |
| AUTH-017 | Auto-redirect after auth | Redirects to home or previous page after successful login/signup | [ ] |

---

## A9. Order History Page

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| HIST-001 | Order list display | Shows all user's orders in reverse chronological order | [ ] |
| HIST-002 | Order card — order number | Shows last 6 digits of order ID | [ ] |
| HIST-003 | Order card — date | Shows formatted order date | [ ] |
| HIST-004 | Order card — status badge | Color-coded status: pending/preparing/ready/delivered/cancelled | [ ] |
| HIST-005 | Order card — total amount | Shows total with ₹ symbol | [ ] |
| HIST-006 | Order card — coupon info | Shows applied coupon code if any | [ ] |
| HIST-007 | Search by item name | Filters orders containing searched item name | [ ] |
| HIST-008 | Search by order ID | Filters by last 6 digits of order ID | [ ] |
| HIST-009 | Status filter dropdown | Filter by: All, Pending, Preparing, Ready, Delivered, Cancelled | [ ] |
| HIST-010 | Expand order details | Chevron button expands to show full item list | [ ] |
| HIST-011 | Item details — name | Shows item name in expanded view | [ ] |
| HIST-012 | Item details — quantity | Shows quantity | [ ] |
| HIST-013 | Item details — notes | Shows special notes if any | [ ] |
| HIST-014 | Item details — price | Shows item price | [ ] |
| HIST-015 | Track Order button | Navigates to `/track/:orderId` | [ ] |
| HIST-016 | Download Bill button | Downloads invoice PDF; shows loading state | [ ] |
| HIST-017 | Reorder button | Adds all items from that order to cart | [ ] |
| HIST-018 | Add individual item to cart | Button per item in expanded view to add to cart | [ ] |
| HIST-019 | Empty state | "No orders found" message when no orders exist | [ ] |
| HIST-020 | Pagination | Orders load in pages or infinite scroll | [ ] |

---

## A10. Order Tracking Page

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| TRACK-001 | Order number display | Shows last 6 digits of order ID | [ ] |
| TRACK-002 | Order date/time | Shows formatted creation date and time | [ ] |
| TRACK-003 | Back button | Navigates back to order history | [ ] |
| TRACK-004 | Info card — customer name | Shows customer name with User icon | [ ] |
| TRACK-005 | Info card — table/takeaway | Shows table number or "Takeaway" with MapPin icon | [ ] |
| TRACK-006 | Info card — payment method | Shows payment method and status with CreditCard icon | [ ] |
| TRACK-007 | Info card — total amount | Shows total with Coins icon | [ ] |
| TRACK-008 | Progress bar | Visual bar showing order completion percentage | [ ] |
| TRACK-009 | Status step 1 — Order Received | Clock icon; active when status = pending | [ ] |
| TRACK-010 | Status step 2 — Preparing | ChefHat icon; active when status = preparing | [ ] |
| TRACK-011 | Status step 3 — Ready | Bell icon; active when status = ready | [ ] |
| TRACK-012 | Status step 4 — Delivered | Check icon; active when status = delivered | [ ] |
| TRACK-013 | Current step pulsing | Active step has pulsing animation | [ ] |
| TRACK-014 | Estimated time display | Shows remaining time in minutes with Timer icon | [ ] |
| TRACK-015 | Show/Hide details toggle | Toggles expanded item list | [ ] |
| TRACK-016 | Item list in details | Shows all items with quantity, name, notes, price | [ ] |
| TRACK-017 | Subtotal display | Calculated subtotal in detail view | [ ] |
| TRACK-018 | Coupon info in details | Shows coupon code and discount if applied | [ ] |
| TRACK-019 | Tax display | Shows 18% GST amount | [ ] |
| TRACK-020 | Total with tax | Shows final total amount | [ ] |
| TRACK-021 | Download Bill button | Downloads invoice PDF with loading state | [ ] |
| TRACK-022 | Real-time status updates | Status updates automatically via Supabase subscription | [ ] |
| TRACK-023 | Auto-refresh fallback | Refreshes every 5 seconds as fallback | [ ] |
| TRACK-024 | Toast on status change | Toast notification when order status changes | [ ] |
| TRACK-025 | Need Help? button | Opens support chat modal (registered users only) | [ ] |
| TRACK-026 | Sign Up prompt | Shows "Sign Up for Live Chat" for non-registered users | [ ] |
| TRACK-027 | Leave Feedback button | Opens feedback form modal | [ ] |
| TRACK-028 | Feedback already submitted | Button disabled with "Feedback Submitted" text | [ ] |

---

## A11. Feedback Form (Modal)

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| FB-001 | Overall Experience rating | 1-5 star interactive rating | [ ] |
| FB-002 | Food Quality rating | 1-5 star interactive rating | [ ] |
| FB-003 | Service rating | 1-5 star interactive rating | [ ] |
| FB-004 | Delivery Time rating | 1-5 star interactive rating | [ ] |
| FB-005 | Value for Money rating | 1-5 star interactive rating | [ ] |
| FB-006 | Comments textarea | Free-text input for overall comments | [ ] |
| FB-007 | Customer name (pre-filled) | Auto-populated from user profile | [ ] |
| FB-008 | Customer email | Email input field | [ ] |
| FB-009 | Customer phone | Phone input field | [ ] |
| FB-010 | Submit button | Saves feedback to order_feedback table | [ ] |
| FB-011 | Cancel/Close button | Closes modal without saving | [ ] |
| FB-012 | Loading state | Button shows loading during submission | [ ] |
| FB-013 | Success notification | Toast notification on successful submission | [ ] |
| FB-014 | Error handling | Toast notification on submission failure | [ ] |

---

## A12. Support Chat Modal

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| CHAT-001 | Modal open/close | Opens from floating button or tracking page; closable | [ ] |
| CHAT-002 | Issue category selector | Dropdown to select issue category | [ ] |
| CHAT-003 | Issue description | Text field to describe issue | [ ] |
| CHAT-004 | Start chat button | Initiates new support chat session | [ ] |
| CHAT-005 | AI initial response | AI bot responds to first message using Gemini RAG | [ ] |
| CHAT-006 | Message display | Shows message bubbles with sender, text, timestamp | [ ] |
| CHAT-007 | AI/Human indicator | Visual indicator showing if AI or human is responding | [ ] |
| CHAT-008 | Message input | Text field for typing messages | [ ] |
| CHAT-009 | Send button | Sends message; clears input | [ ] |
| CHAT-010 | Auto-scroll | Chat scrolls to latest message automatically | [ ] |
| CHAT-011 | Escalate to human | Button/option to escalate from AI to human agent | [ ] |
| CHAT-012 | Registration check | Only registered customers can access chat; others see signup prompt | [ ] |
| CHAT-013 | Chat history | Previous messages preserved within session | [ ] |
| CHAT-014 | Real-time messages | New messages appear instantly via real-time subscription | [ ] |

---

# SECTION B: KITCHEN DASHBOARD

---

## B1. Kitchen Dashboard

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| KIT-001 | Dashboard title | Shows "Kitchen Dashboard" heading | [ ] |
| KIT-002 | Active order count | Shows count of active (non-delivered/cancelled) orders | [ ] |
| KIT-003 | Last updated timestamp | Shows when data was last refreshed | [ ] |
| **Stats Cards** | | | |
| KIT-004 | Total Orders stat | Card showing total order count | [ ] |
| KIT-005 | Pending stat (amber) | Card showing pending order count | [ ] |
| KIT-006 | Preparing stat (blue) | Card showing in-progress order count | [ ] |
| KIT-007 | Completed stat (emerald) | Card showing completed order count | [ ] |
| **Search & Filters** | | | |
| KIT-008 | Search bar | Searches by customer name, order ID, or item name | [ ] |
| KIT-009 | Status filter | Dropdown: All, Pending, Preparing, Ready, Delivered, Cancelled | [ ] |
| KIT-010 | Order type filter | Dropdown: All Types, Dine In, Takeaway | [ ] |
| **Order Cards** | | | |
| KIT-011 | Order ID display | Shows last 6 digits of order ID | [ ] |
| KIT-012 | Status badge | Color-coded: amber (pending), blue (preparing), emerald (ready) | [ ] |
| KIT-013 | Priority badge — URGENT | Red badge for urgent priority orders | [ ] |
| KIT-014 | Priority badge — HIGH | Amber badge for high priority orders | [ ] |
| KIT-015 | Delayed indicator | Shows "Delayed" warning for overdue orders | [ ] |
| KIT-016 | Order amount | Shows total amount | [ ] |
| KIT-017 | Payment status dot | Color-coded dot + text showing payment status | [ ] |
| KIT-018 | Created time | Shows when order was placed | [ ] |
| KIT-019 | Customer name | Displays customer name | [ ] |
| KIT-020 | Order type display | Shows "Table #X" or "Takeaway" | [ ] |
| KIT-021 | Customer phone | Shows phone number if available | [ ] |
| KIT-022 | Progress bar | Bar showing % of items completed | [ ] |
| **Item-Level Controls** | | | |
| KIT-023 | Item list | Shows all items with quantity, name, notes | [ ] |
| KIT-024 | Special notes indicator | Icon shown if item has special instructions | [ ] |
| KIT-025 | Item status color | Color coding for not_started/in_progress/completed | [ ] |
| KIT-026 | Start item button | Changes item status: not_started → in_progress | [ ] |
| KIT-027 | Complete item button | Changes item status: in_progress → completed | [ ] |
| KIT-028 | Completed item display | Shows completed state (no more action buttons) | [ ] |
| **Order-Level Actions** | | | |
| KIT-029 | Start Order button | Changes order: pending → preparing; sets estimated time | [ ] |
| KIT-030 | Mark Ready button | Changes order: preparing → ready | [ ] |
| KIT-031 | Deliver button | Changes order: ready → delivered | [ ] |
| KIT-032 | Cancel button | Opens cancel confirmation dialog | [ ] |
| KIT-033 | Cancel confirmation dialog | Shows "Are you sure?" with Yes/No buttons | [ ] |
| KIT-034 | Cancel — No, Keep Order | Closes dialog; order unchanged | [ ] |
| KIT-035 | Cancel — Yes, Cancel | Sets order status to cancelled | [ ] |
| **Real-Time** | | | |
| KIT-036 | New order notification | Toast when new order arrives | [ ] |
| KIT-037 | Real-time order updates | Order cards update live when status changes | [ ] |
| KIT-038 | Auto-refresh order list | Order list refreshes on new data | [ ] |
| **States** | | | |
| KIT-039 | Empty state | "No orders found" with checkmark icon when no orders match filters | [ ] |
| KIT-040 | Loading state | Spinner shown while loading orders | [ ] |

---

# SECTION C: COUNTER DASHBOARD

---

## C1. Counter Dashboard

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| CTR-001 | Tab — New Order | Tab to create new walk-in order | [ ] |
| CTR-002 | Tab — Existing Orders | Tab to view/manage existing orders | [ ] |
| CTR-003 | Tab — Orders List | Tab to see all orders in table format | [ ] |
| **New Order — Customer Info** | | | |
| CTR-004 | Phone number input | Input with validation for customer lookup | [ ] |
| CTR-005 | Phone validation error | Shows error for invalid phone format | [ ] |
| CTR-006 | Customer name input | Name field for new/existing customer | [ ] |
| CTR-007 | Register new customer | Option to register new customer if not found | [ ] |
| **New Order — Menu Selection** | | | |
| CTR-008 | Menu search bar | Search menu items by name | [ ] |
| CTR-009 | Category filter | Dropdown to filter menu by category | [ ] |
| CTR-010 | Menu item cards | Shows image, name, price, availability | [ ] |
| CTR-011 | Add item button | Adds item to order | [ ] |
| CTR-012 | Item availability status | Visual indicator for unavailable items | [ ] |
| **New Order — Order Cart** | | | |
| CTR-013 | Cart item list | Shows added items with name, qty, price | [ ] |
| CTR-014 | Quantity +/- buttons | Increase/decrease item quantity | [ ] |
| CTR-015 | Quantity input field | Direct number entry for quantity | [ ] |
| CTR-016 | Remove item button | Removes item from order | [ ] |
| **New Order — Order Details** | | | |
| CTR-017 | Order type — Dine-In | Select dine-in; shows table number field | [ ] |
| CTR-018 | Order type — Takeaway | Select takeaway; hides table number | [ ] |
| CTR-019 | Table number input | Input for table assignment | [ ] |
| CTR-020 | Special instructions | Textarea for order notes | [ ] |
| CTR-021 | Coupon code input | Enter coupon code | [ ] |
| CTR-022 | Apply coupon button | Validates and applies coupon discount | [ ] |
| **New Order — Totals** | | | |
| CTR-023 | Subtotal display | Sum of all items | [ ] |
| CTR-024 | Tax display (18%) | GST calculation | [ ] |
| CTR-025 | Discount display | Coupon discount amount (if applied) | [ ] |
| CTR-026 | Total display | Final amount after tax and discount | [ ] |
| **New Order — Payment** | | | |
| CTR-027 | Cash button | Process as cash payment | [ ] |
| CTR-028 | Card (POS) button | Process as card payment at counter | [ ] |
| CTR-029 | UPI (QR) button | Process as UPI payment at counter | [ ] |
| CTR-030 | Online Payment button | Opens Razorpay modal | [ ] |
| **New Order — Actions** | | | |
| CTR-031 | Place Order button | Creates order in database | [ ] |
| CTR-032 | Print Order button | Prints order receipt | [ ] |
| CTR-033 | Clear Cart button | Empties all items from order | [ ] |
| CTR-034 | Invoice auto-generation | Invoice created after successful order | [ ] |
| **Existing Orders Tab** | | | |
| CTR-035 | Search orders | Search by customer name or order ID | [ ] |
| CTR-036 | Status filter | Filter orders by status | [ ] |
| CTR-037 | Order details view | View full details of each order | [ ] |
| CTR-038 | Reorder button | Re-add items from previous order | [ ] |
| CTR-039 | Invoice button | Download/print invoice for order | [ ] |
| **Stats** | | | |
| CTR-040 | Today's revenue | Shows revenue from today's orders | [ ] |
| CTR-041 | Today's order count | Shows count of today's orders | [ ] |
| CTR-042 | Quick status overview | Shows pending/preparing/ready counts | [ ] |

---

# SECTION D: ADMIN DASHBOARD

---

## D1. Admin Dashboard (Overview)

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| ADM-001 | Sidebar navigation | Links to all 14 admin modules | [ ] |
| ADM-002 | Sidebar — active link | Current module highlighted in sidebar | [ ] |
| ADM-003 | Sidebar — branding | Shows "TastyBites Admin" branding | [ ] |
| **Period Selector** | | | |
| ADM-004 | Daily period | Shows daily data in charts | [ ] |
| ADM-005 | Monthly period | Shows monthly data in charts | [ ] |
| **Primary Stats (4 cards)** | | | |
| ADM-006 | Total Orders card | Shows total order count (blue, Package icon) | [ ] |
| ADM-007 | Total Revenue card | Shows total revenue in ₹ (green, Coins icon) | [ ] |
| ADM-008 | Avg. Order Value card | Shows calculated average (orange, TrendingUp icon) | [ ] |
| ADM-009 | Active Customers card | Shows active customer count (purple, Users icon) | [ ] |
| **Secondary Stats (3 cards)** | | | |
| ADM-010 | Total Staff card | Shows staff count (indigo, ChefHat icon) | [ ] |
| ADM-011 | Pending Feedback card | Shows unreviewed feedback count (pink, MessageSquare icon) | [ ] |
| ADM-012 | Notifications card | Shows notification count (cyan, Bell icon) | [ ] |
| **Charts** | | | |
| ADM-013 | Revenue chart | Line/bar chart with daily revenue data | [ ] |
| ADM-014 | Order Status chart | Pie/doughnut chart showing status distribution | [ ] |
| **Reports** | | | |
| ADM-015 | Top Selling Items | List of most ordered items with counts | [ ] |
| ADM-016 | Peak Hours | List showing order counts per hour | [ ] |
| ADM-017 | Customer Satisfaction | Rating percentages | [ ] |
| **Real-Time** | | | |
| ADM-018 | Real-time data refresh | Dashboard updates when new orders arrive | [ ] |

---

## D2. Menu Management

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| AMENU-001 | Add Item button | Opens create item form/modal | [ ] |
| AMENU-002 | Form — name input | Required text field | [ ] |
| AMENU-003 | Form — description textarea | Optional description | [ ] |
| AMENU-004 | Form — price input | Required numeric field | [ ] |
| AMENU-005 | Form — image upload | Upload image with preview; max 5MB validation | [ ] |
| AMENU-006 | Form — category dropdown | Select from existing categories | [ ] |
| AMENU-007 | Form — prep time input | Preparation time in minutes | [ ] |
| AMENU-008 | Form — availability toggle | Toggle item available/unavailable | [ ] |
| AMENU-009 | Form — submit (Add) | Creates new menu item in database | [ ] |
| AMENU-010 | Form — cancel | Closes modal without saving | [ ] |
| AMENU-011 | Items table/list | Shows all menu items with virtual scrolling | [ ] |
| AMENU-012 | Table — image thumbnail | Small item image | [ ] |
| AMENU-013 | Table — name column | Item name | [ ] |
| AMENU-014 | Table — category column | Category name | [ ] |
| AMENU-015 | Table — price column | Formatted price | [ ] |
| AMENU-016 | Table — prep time column | Time in minutes | [ ] |
| AMENU-017 | Table — availability column | Status indicator | [ ] |
| AMENU-018 | Edit button | Opens edit form pre-filled with item data | [ ] |
| AMENU-019 | Form — submit (Update) | Updates existing menu item | [ ] |
| AMENU-020 | Delete button | Deletes menu item with confirmation | [ ] |
| AMENU-021 | Category filter | Filter items list by category | [ ] |
| AMENU-022 | Search functionality | Search items by name | [ ] |
| AMENU-023 | Category Manager button | Opens category management | [ ] |
| AMENU-024 | Menu stats | Total items, available count, category breakdown | [ ] |
| AMENU-025 | Bulk import/export | Import/export menu items | [ ] |
| AMENU-026 | Virtual scrolling | Large item lists scroll smoothly with virtualization | [ ] |

---

## D3. Category Management

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| ACAT-001 | Add Category button | Opens create category form | [ ] |
| ACAT-002 | Form — name input | Required; auto-generates slug | [ ] |
| ACAT-003 | Form — slug input | Auto-generated from name; editable | [ ] |
| ACAT-004 | Form — display order | Numeric input for sort priority | [ ] |
| ACAT-005 | Form — icon selector | Lucide icon picker with search | [ ] |
| ACAT-006 | Form — submit (Add) | Creates category in database | [ ] |
| ACAT-007 | Form — cancel | Closes without saving | [ ] |
| ACAT-008 | Category list | Shows all categories with icon, name, order | [ ] |
| ACAT-009 | Dynamic icon display | Category icon rendered from Lucide library | [ ] |
| ACAT-010 | Edit button | Opens edit form pre-filled | [ ] |
| ACAT-011 | Form — submit (Update) | Updates existing category | [ ] |
| ACAT-012 | Delete button | Deletes category with confirmation | [ ] |
| ACAT-013 | Drag-and-drop reorder | Drag categories to change display order | [ ] |
| ACAT-014 | Auto-save after drag | Display order saved automatically after reordering | [ ] |
| ACAT-015 | Network error handling | Shows error state on API failure | [ ] |

---

## D4. Order Management

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| AORD-001 | Search bar | Search by customer name, order ID, phone | [ ] |
| AORD-002 | Status filter | Filter: Pending, Preparing, Ready, Delivered, Cancelled | [ ] |
| AORD-003 | Payment status filter | Filter by payment status | [ ] |
| AORD-004 | Date range filter | Filter orders by date range | [ ] |
| AORD-005 | Order table — order number | Last 6 digits of ID | [ ] |
| AORD-006 | Order table — customer name | Customer name column | [ ] |
| AORD-007 | Order table — phone | Customer phone | [ ] |
| AORD-008 | Order table — date | Order creation date | [ ] |
| AORD-009 | Order table — status badge | Color-coded status | [ ] |
| AORD-010 | Order table — payment status | Payment completion indicator | [ ] |
| AORD-011 | Order table — payment method | cash/card/upi/razorpay | [ ] |
| AORD-012 | Order table — total | Amount with ₹ | [ ] |
| AORD-013 | View order details | Expand/click to see full order with items | [ ] |
| AORD-014 | Download Invoice button | Generates and downloads PDF | [ ] |
| AORD-015 | Print Invoice button | Opens print dialog | [ ] |
| AORD-016 | Email Invoice button | Sends invoice to customer email | [ ] |
| AORD-017 | Refresh button | Manually refresh order list | [ ] |
| AORD-018 | Real-time updates | Orders update in real-time | [ ] |
| AORD-019 | Empty state | Message when no orders match filters | [ ] |

---

## D5. Customer Management

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| ACUS-001 | Search bar | Search by name, email, phone | [ ] |
| ACUS-002 | Status filter | Active / Inactive | [ ] |
| ACUS-003 | Tag filter | Multi-select tag filter | [ ] |
| ACUS-004 | Spent range filter | Min-max spending range | [ ] |
| ACUS-005 | Date range filter | Filter by registration/order dates | [ ] |
| ACUS-006 | Table view toggle | Switch to table layout | [ ] |
| ACUS-007 | Card view toggle | Switch to card grid layout | [ ] |
| **Stats Section** | | | |
| ACUS-008 | Total customers count | Total registered customers | [ ] |
| ACUS-009 | Active customers count | Customers with status = active | [ ] |
| ACUS-010 | Inactive customers count | Customers with status = inactive | [ ] |
| ACUS-011 | Average spend | Average lifetime spend | [ ] |
| ACUS-012 | New this month | Customers registered this month | [ ] |
| **Customer Display** | | | |
| ACUS-013 | Customer name | Name display | [ ] |
| ACUS-014 | Email | Email address | [ ] |
| ACUS-015 | Phone | Phone number | [ ] |
| ACUS-016 | Total orders | Order count | [ ] |
| ACUS-017 | Total spent | Lifetime value in ₹ | [ ] |
| ACUS-018 | Tags | Custom admin tags | [ ] |
| ACUS-019 | Status indicator | Active/Inactive badge | [ ] |
| ACUS-020 | Last order date | Date of most recent order | [ ] |
| **Actions** | | | |
| ACUS-021 | View details button | Opens detailed customer profile | [ ] |
| ACUS-022 | Edit button | Opens edit form for customer data | [ ] |
| ACUS-023 | Delete button | Deletes customer with confirmation | [ ] |
| ACUS-024 | Export button | Exports customers to Excel/CSV | [ ] |
| ACUS-025 | Add Customer button | Opens form to add new customer manually | [ ] |
| **Customer Detail View** | | | |
| ACUS-026 | Full profile info | Name, email, phone, address, source, referral code | [ ] |
| ACUS-027 | Order history | List of all customer orders | [ ] |
| ACUS-028 | Loyalty points | Points balance and tier | [ ] |
| ACUS-029 | Preferences | Favorite items, dietary restrictions, payment method | [ ] |
| ACUS-030 | Admin notes | Editable notes field | [ ] |

---

## D6. Staff Management

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| **Tabs** | | | |
| ASTF-001 | Staff List tab | Shows all staff members | [ ] |
| ASTF-002 | Attendance tab | Shows attendance tracking | [ ] |
| ASTF-003 | Shift Scheduler tab | Shows shift management | [ ] |
| **Staff List** | | | |
| ASTF-004 | Search bar | Search by name, email | [ ] |
| ASTF-005 | Department filter | Filter by department | [ ] |
| ASTF-006 | Staff table — name | Full name | [ ] |
| ASTF-007 | Staff table — email | Email address | [ ] |
| ASTF-008 | Staff table — phone | Phone number | [ ] |
| ASTF-009 | Staff table — department | Department name | [ ] |
| ASTF-010 | Staff table — role | kitchen/counter/helper/admin | [ ] |
| ASTF-011 | Staff table — joining date | Date joined | [ ] |
| ASTF-012 | Staff table — status | Active/Inactive indicator | [ ] |
| ASTF-013 | Add Staff button | Opens add staff form | [ ] |
| ASTF-014 | Form — name | Required | [ ] |
| ASTF-015 | Form — email | Required, email format | [ ] |
| ASTF-016 | Form — phone | Required | [ ] |
| ASTF-017 | Form — department | Dropdown selector | [ ] |
| ASTF-018 | Form — role | Dropdown: kitchen, counter, helper, admin | [ ] |
| ASTF-019 | Form — joining date | Date picker | [ ] |
| ASTF-020 | Form — salary | Numeric input | [ ] |
| ASTF-021 | Form — address | Text input | [ ] |
| ASTF-022 | Form — emergency contact | Name, phone, relation fields | [ ] |
| ASTF-023 | Form — active toggle | Active/inactive status | [ ] |
| ASTF-024 | Form — submit | Creates/updates staff record | [ ] |
| ASTF-025 | Edit button | Opens edit form pre-filled | [ ] |
| ASTF-026 | Delete button | Deletes staff with confirmation | [ ] |
| ASTF-027 | View Profile button | Navigates to `/admin/staff/:id` | [ ] |
| **Attendance Tab** | | | |
| ASTF-028 | Date picker | Select date to view/mark attendance | [ ] |
| ASTF-029 | Staff list for attendance | Shows all staff with attendance status | [ ] |
| ASTF-030 | Mark Present | Set status = present | [ ] |
| ASTF-031 | Mark Absent | Set status = absent | [ ] |
| ASTF-032 | Mark Half-Day | Set status = half-day | [ ] |
| ASTF-033 | Mark Leave | Set status = leave | [ ] |
| ASTF-034 | Check-in time | Record check-in time | [ ] |
| ASTF-035 | Check-out time | Record check-out time | [ ] |
| ASTF-036 | Bulk mark attendance | Mark multiple staff at once | [ ] |
| **Shift Scheduler Tab** | | | |
| ASTF-037 | Add shift button | Create new shift | [ ] |
| ASTF-038 | Shift — staff assignment | Assign staff to shift | [ ] |
| ASTF-039 | Shift — date | Set shift date | [ ] |
| ASTF-040 | Shift — type | Morning/Afternoon/Evening | [ ] |
| ASTF-041 | Shift — start/end time | Set shift timing | [ ] |
| ASTF-042 | Edit shift | Modify existing shift | [ ] |
| ASTF-043 | Delete shift | Remove shift | [ ] |
| **Staff Profile (Detail)** | | | |
| ASTF-044 | Personal info | Full profile with all fields | [ ] |
| ASTF-045 | Compensation details | Salary, bonus, deductions, net salary | [ ] |
| ASTF-046 | Performance review | Score, notes, evaluation dates | [ ] |
| ASTF-047 | Document management | Upload/download/verify documents | [ ] |
| ASTF-048 | Training records | Training history | [ ] |
| ASTF-049 | Leave balances | Annual and sick leave remaining | [ ] |
| **Stats** | | | |
| ASTF-050 | Total staff count | Total staff members | [ ] |
| ASTF-051 | Active staff count | Currently active staff | [ ] |
| ASTF-052 | Department breakdown | Count per department | [ ] |
| ASTF-053 | Role distribution | Count per role | [ ] |

---

## D7. Coupon Management

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| ACPN-001 | Add Coupon button | Opens create coupon form | [ ] |
| ACPN-002 | Form — code input | Auto-uppercased; unique validation | [ ] |
| ACPN-003 | Form — discount type | Percentage / Fixed Amount toggle | [ ] |
| ACPN-004 | Form — discount value | Numeric input | [ ] |
| ACPN-005 | Form — min order amount | Minimum cart value requirement | [ ] |
| ACPN-006 | Form — max discount | Maximum discount cap (for %) | [ ] |
| ACPN-007 | Form — start date | Date picker for validity start | [ ] |
| ACPN-008 | Form — expiry date | Date picker for validity end | [ ] |
| ACPN-009 | Form — usage limit | Maximum total uses allowed | [ ] |
| ACPN-010 | Form — active toggle | Enable/disable coupon | [ ] |
| ACPN-011 | Form — description | Description textarea | [ ] |
| ACPN-012 | Form — applies to all | Default: applies to all items | [ ] |
| ACPN-013 | Form — specific items | Item selector for targeted coupons | [ ] |
| ACPN-014 | Form — specific categories | Category multi-selector | [ ] |
| ACPN-015 | Form — submit | Creates/updates coupon in DB | [ ] |
| ACPN-016 | Coupon list | Shows all coupons with details | [ ] |
| ACPN-017 | List — code | Coupon code display | [ ] |
| ACPN-018 | List — discount | Type + value (e.g., "20%" or "₹50") | [ ] |
| ACPN-019 | List — dates | Start and expiry dates | [ ] |
| ACPN-020 | List — usage | used_count / usage_limit display | [ ] |
| ACPN-021 | List — status | Active / Inactive / Expired badge | [ ] |
| ACPN-022 | Edit button | Opens edit form pre-filled | [ ] |
| ACPN-023 | Delete button | Deletes coupon with confirmation | [ ] |
| **Filters** | | | |
| ACPN-024 | Search bar | Search by code and description | [ ] |
| ACPN-025 | Status filter | All / Active / Inactive / Expired | [ ] |
| ACPN-026 | Type filter | All / Percentage / Fixed | [ ] |
| ACPN-027 | Reset filters | Clears all filter selections | [ ] |
| **Batch Actions** | | | |
| ACPN-028 | Checkbox select | Select individual coupons | [ ] |
| ACPN-029 | Select all checkbox | Select/deselect all coupons | [ ] |
| ACPN-030 | Bulk activate | Activate all selected coupons | [ ] |
| ACPN-031 | Bulk deactivate | Deactivate all selected coupons | [ ] |
| ACPN-032 | Bulk delete | Delete all selected coupons | [ ] |
| **Analytics** | | | |
| ACPN-033 | Usage statistics | Total uses, unique users | [ ] |
| ACPN-034 | Redemption rate | Percentage of coupons redeemed | [ ] |
| ACPN-035 | Total discount given | Sum of all discounts issued | [ ] |
| ACPN-036 | Revenue impact | Revenue attributed to coupons | [ ] |
| **Export** | | | |
| ACPN-037 | Export to CSV | Download coupons data as CSV file | [ ] |

---

## D8. Feedback Management

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| AFBK-001 | Search bar | Search by customer name, email, phone, order ID | [ ] |
| AFBK-002 | Rating filter | Filter by star rating (1-5) | [ ] |
| AFBK-003 | View mode — All | Shows all feedback | [ ] |
| AFBK-004 | View mode — Recent | Shows most recent feedback | [ ] |
| AFBK-005 | View mode — High rated | Shows 4-5 star feedback only | [ ] |
| AFBK-006 | View mode — Low rated | Shows 1-2 star feedback only | [ ] |
| AFBK-007 | Date range filter | Filter feedback by date range | [ ] |
| AFBK-008 | Feedback card — overall rating | Star display (1-5) | [ ] |
| AFBK-009 | Feedback card — customer name | Customer who submitted | [ ] |
| AFBK-010 | Feedback card — order ID | Associated order reference | [ ] |
| AFBK-011 | Feedback card — date | Submission date | [ ] |
| AFBK-012 | Feedback card — food quality | Star rating display | [ ] |
| AFBK-013 | Feedback card — service | Star rating display | [ ] |
| AFBK-014 | Feedback card — delivery time | Star rating display | [ ] |
| AFBK-015 | Feedback card — value for money | Star rating display | [ ] |
| AFBK-016 | Feedback card — comments | Comment text display | [ ] |
| AFBK-017 | Expand feedback | See full details including item-specific feedback | [ ] |
| AFBK-018 | Customer contact info | Phone, email in expanded view | [ ] |
| AFBK-019 | Delete feedback | Remove feedback entry | [ ] |
| AFBK-020 | Empty state | No feedback found message | [ ] |
| **Analytics** | | | |
| AFBK-021 | Average ratings | Overall average across all feedback | [ ] |
| AFBK-022 | Rating distribution | Breakdown of 1-5 star counts | [ ] |

---

## D9. Invoice Management

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| AINV-001 | Search bar | Search by order ID or invoice number | [ ] |
| AINV-002 | Status filter | Filter by: draft, issued, paid, cancelled, refunded | [ ] |
| AINV-003 | Date range filter | Filter invoices by date range | [ ] |
| AINV-004 | Invoice list | Shows all invoices with key details | [ ] |
| AINV-005 | Invoice — number | Invoice number display | [ ] |
| AINV-006 | Invoice — order reference | Associated order ID | [ ] |
| AINV-007 | Invoice — customer name | Customer name | [ ] |
| AINV-008 | Invoice — date | Invoice date | [ ] |
| AINV-009 | Invoice — amount | Total amount | [ ] |
| AINV-010 | Invoice — status | Status badge | [ ] |
| AINV-011 | View invoice | Opens invoice detail view | [ ] |
| AINV-012 | Download invoice | Generates and downloads PDF | [ ] |
| AINV-013 | Print invoice | Opens print dialog | [ ] |
| AINV-014 | Email invoice | Sends invoice to customer email | [ ] |
| AINV-015 | Edit invoice details | Edit customer info, billing address, notes | [ ] |
| AINV-016 | Invoice detail — items | Itemized list with quantity, price, line total | [ ] |
| AINV-017 | Invoice detail — subtotal | Pre-tax amount | [ ] |
| AINV-018 | Invoice detail — tax | Tax amount | [ ] |
| AINV-019 | Invoice detail — discount | Discount amount (if any) | [ ] |
| AINV-020 | Invoice detail — total | Final total | [ ] |
| AINV-021 | Invoice detail — payment method | How customer paid | [ ] |
| AINV-022 | Print count tracking | Shows how many times invoice was printed | [ ] |

---

## D10. Invoice Template Settings

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| ATPL-001 | Template — Modern | Select modern invoice template | [ ] |
| ATPL-002 | Template — Classic | Select classic invoice template | [ ] |
| ATPL-003 | Template — Minimal | Select minimal invoice template | [ ] |
| ATPL-004 | Company name input | Set restaurant name on invoices | [ ] |
| ATPL-005 | Company logo upload | Upload logo for invoice header | [ ] |
| ATPL-006 | Company address input | Set address on invoices | [ ] |
| ATPL-007 | Invoice number format | Configure numbering pattern | [ ] |
| ATPL-008 | Color scheme | Set primary color for invoice | [ ] |
| ATPL-009 | Footer text | Custom footer message | [ ] |
| ATPL-010 | Custom fields | Add additional fields to invoice | [ ] |
| ATPL-011 | Tax labels | Configure CGST/SGST labels | [ ] |
| ATPL-012 | Currency display | Set currency symbol (₹) | [ ] |
| ATPL-013 | Terms and conditions | Set T&C text on invoice | [ ] |
| ATPL-014 | Live preview | Real-time preview with sample data | [ ] |
| ATPL-015 | Save configuration | Persist template settings to DB | [ ] |

---

## D11. QR Code Management

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| AQR-001 | Single QR — table input | Enter table number for single QR | [ ] |
| AQR-002 | Single QR — generate | Generate QR code linking to menu for that table | [ ] |
| AQR-003 | QR code preview | Shows generated QR code image | [ ] |
| AQR-004 | Download single QR | Download QR as PNG file | [ ] |
| AQR-005 | Delete QR code | Remove generated QR code | [ ] |
| AQR-006 | Bulk QR — range input | Enter start and end table numbers | [ ] |
| AQR-007 | Bulk QR — generate | Generate multiple QR codes (max 50 at once) | [ ] |
| AQR-008 | Bulk QR — max limit | Error if range exceeds 50 tables | [ ] |
| AQR-009 | Batch download as ZIP | Download all QR codes as ZIP with individual PNGs | [ ] |
| AQR-010 | QR code list | Shows all generated QR codes with table numbers | [ ] |

---

## D12. Customer Support (Admin Chat)

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| ASUP-001 | Chat list | Shows all support chats | [ ] |
| ASUP-002 | Filter — Active chats | Show only active/open chats | [ ] |
| ASUP-003 | Filter — Resolved chats | Show only resolved chats | [ ] |
| ASUP-004 | Search chats | Search by customer name or order number | [ ] |
| ASUP-005 | Chat count display | Total active and resolved counts | [ ] |
| ASUP-006 | Last message preview | Shows last message in chat list | [ ] |
| ASUP-007 | Open chat interface | Click chat to open full conversation | [ ] |
| ASUP-008 | Customer details display | Shows customer name, email, phone in chat | [ ] |
| ASUP-009 | Order info in chat | Shows linked order details | [ ] |
| ASUP-010 | Issue category display | Shows issue category and description | [ ] |
| ASUP-011 | Message history | Full conversation thread displayed | [ ] |
| ASUP-012 | Send message | Admin types and sends reply | [ ] |
| ASUP-013 | Real-time messages | Messages appear instantly via Socket.IO | [ ] |
| ASUP-014 | AI active indicator | Shows if AI is currently handling chat | [ ] |
| ASUP-015 | Escalation from AI | Manually take over from AI bot | [ ] |
| ASUP-016 | Mark as resolved | Close/resolve the support chat | [ ] |

---

## D13. Website Settings (CMS)

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| **General Tab** | | | |
| AWEB-001 | Site name input | Set restaurant name | [ ] |
| AWEB-002 | Tagline input | Set site tagline | [ ] |
| AWEB-003 | Logo upload | Upload restaurant logo with preview | [ ] |
| AWEB-004 | Primary color picker | Set primary brand color (hex) | [ ] |
| AWEB-005 | Secondary color picker | Set secondary brand color (hex) | [ ] |
| AWEB-006 | Font family selector | Choose font family | [ ] |
| **Hero Section Tab** | | | |
| AWEB-007 | Hero image upload | Upload hero background image | [ ] |
| AWEB-008 | Hero title input | Set hero heading text | [ ] |
| AWEB-009 | Hero subtitle input | Set hero subheading text | [ ] |
| AWEB-010 | CTA button text | Set call-to-action button text | [ ] |
| AWEB-011 | CTA button link | Set CTA button destination URL | [ ] |
| **Features Tab** | | | |
| AWEB-012 | Feature 1 — title | Set first feature card title | [ ] |
| AWEB-013 | Feature 1 — description | Set first feature card description | [ ] |
| AWEB-014 | Feature 2 — title | Set second feature card title | [ ] |
| AWEB-015 | Feature 2 — description | Set second feature card description | [ ] |
| AWEB-016 | Feature 3 — title | Set third feature card title | [ ] |
| AWEB-017 | Feature 3 — description | Set third feature card description | [ ] |
| AWEB-018 | Feature icons | Select Lucide icon for each feature card | [ ] |
| **Popular Dishes Tab** | | | |
| AWEB-019 | Popular dish 1 selector | Choose menu item for first showcase slot | [ ] |
| AWEB-020 | Popular dish 2 selector | Choose menu item for second showcase slot | [ ] |
| AWEB-021 | Popular dish 3 selector | Choose menu item for third showcase slot | [ ] |
| **CTA Section Tab** | | | |
| AWEB-022 | CTA title | Set CTA section heading | [ ] |
| AWEB-023 | CTA subtitle | Set CTA section subheading | [ ] |
| AWEB-024 | CTA button text | Set button text | [ ] |
| AWEB-025 | CTA button link | Set button destination | [ ] |
| **Contact Tab** | | | |
| AWEB-026 | Email input | Set contact email | [ ] |
| AWEB-027 | Phone input | Set contact phone | [ ] |
| AWEB-028 | Address input | Set restaurant address | [ ] |
| AWEB-029 | Hours — weekday | Set Mon-Fri hours | [ ] |
| AWEB-030 | Hours — weekend | Set Sat-Sun hours | [ ] |
| **Social Links Tab** | | | |
| AWEB-031 | Facebook URL | Set Facebook page link | [ ] |
| AWEB-032 | Twitter URL | Set Twitter/X profile link | [ ] |
| AWEB-033 | Instagram URL | Set Instagram profile link | [ ] |
| AWEB-034 | LinkedIn URL | Set LinkedIn page link | [ ] |
| AWEB-035 | YouTube URL | Set YouTube channel link | [ ] |
| **Global Features** | | | |
| AWEB-036 | Live preview | Real-time preview of home page changes | [ ] |
| AWEB-037 | Auto-save (debounced) | Changes saved automatically after 1.5s | [ ] |
| AWEB-038 | Real-time sync | Settings sync across all open tabs/users | [ ] |
| AWEB-039 | Image upload progress | Shows upload state for images | [ ] |

---

# SECTION E: CROSS-CUTTING FEATURES

---

## E1. Authentication & Session

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| XAUTH-001 | Session persistence | User stays logged in across page refreshes | [ ] |
| XAUTH-002 | Auto token refresh | JWT refreshed automatically before expiry | [ ] |
| XAUTH-003 | Role-based routing | Users redirected based on role after login | [ ] |
| XAUTH-004 | Protected route — unauthenticated | Redirects to /auth if not logged in | [ ] |
| XAUTH-005 | Protected route — wrong role | Redirects to / if role doesn't match | [ ] |
| XAUTH-006 | Admin bypass | Admin role can access kitchen/counter routes | [ ] |

---

## E2. Real-Time Features

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| XRT-001 | Order insert subscription | New orders appear in kitchen/admin without refresh | [ ] |
| XRT-002 | Order update subscription | Status changes reflect instantly | [ ] |
| XRT-003 | Menu item availability sync | Availability changes reflect on menu page | [ ] |
| XRT-004 | Website settings sync | CMS changes reflect on home page instantly | [ ] |
| XRT-005 | Category changes sync | New/updated categories appear in filters | [ ] |
| XRT-006 | Chat real-time messages | Support chat messages appear instantly | [ ] |
| XRT-007 | Subscription cleanup | Subscriptions properly cleaned up on unmount | [ ] |

---

## E3. Invoice & PDF System

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| XINV-001 | Auto-generation on order | Invoice created when order is placed | [ ] |
| XINV-002 | PDF download | jsPDF generates downloadable PDF | [ ] |
| XINV-003 | PDF print | Opens browser print dialog | [ ] |
| XINV-004 | PDF email | Sends invoice via Edge Function | [ ] |
| XINV-005 | Template rendering | Selected template (modern/classic/minimal) applied | [ ] |
| XINV-006 | Tax calculation accuracy | CGST + SGST = 18% of taxable amount | [ ] |
| XINV-007 | Discount on invoice | Coupon discount reflected correctly | [ ] |
| XINV-008 | Print count tracking | Increments on each print | [ ] |

---

## E4. Data Export

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| XEXP-001 | Customer export to Excel | Downloads XLSX file with customer data | [ ] |
| XEXP-002 | Coupon export to CSV | Downloads CSV file with coupon data | [ ] |
| XEXP-003 | QR codes export as ZIP | Downloads ZIP with PNG files | [ ] |

---

## E5. Error Handling & Edge Cases

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| XERR-001 | Global error handler | window.onerror catches uncaught errors | [ ] |
| XERR-002 | Promise rejection handler | unhandledrejection listener active | [ ] |
| XERR-003 | Error boundary | React ErrorBoundary catches component crashes | [ ] |
| XERR-004 | Network error alert | NetworkErrorAlert component shown on connectivity issues | [ ] |
| XERR-005 | Toast notifications | Success/error/loading toasts displayed correctly | [ ] |
| XERR-006 | Emergency toast dismiss | EmergencyToastDismiss clears stuck toasts | [ ] |
| XERR-007 | Form validation errors | Field-level errors with red borders and messages | [ ] |
| XERR-008 | Loading spinners | All async operations show loading state | [ ] |
| XERR-009 | Empty states | All lists show appropriate empty state messages | [ ] |
| XERR-010 | Critical render fallback | main.tsx fallback UI when app fails to mount | [ ] |

---

## E6. Responsive Design

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| XRES-001 | Mobile layout | All pages render correctly on mobile (< 640px) | [ ] |
| XRES-002 | Tablet layout | All pages render correctly on tablet (640-1024px) | [ ] |
| XRES-003 | Desktop layout | All pages render correctly on desktop (> 1024px) | [ ] |
| XRES-004 | Touch interactions | Buttons and controls are touch-friendly on mobile | [ ] |
| XRES-005 | Mobile menu | Hamburger menu works correctly on mobile | [ ] |
| XRES-006 | Grid responsiveness | Menu grid adapts: 1 col → 2 col based on screen | [ ] |

---

## E7. Animations & UX

| ID | Feature | Expected Behavior | Status |
|---|---|---|---|
| XANI-001 | Page transitions | Framer Motion transitions between routes | [ ] |
| XANI-002 | Card animations | Menu/order cards animate on appear | [ ] |
| XANI-003 | Button hover effects | Buttons respond to hover/tap | [ ] |
| XANI-004 | Modal animations | Modals animate open/close | [ ] |
| XANI-005 | Cart badge animation | Badge animates when count changes | [ ] |
| XANI-006 | Scroll animations | Elements animate on scroll into view | [ ] |

---

# FEATURE COUNT SUMMARY

| Section | Module | Feature Count |
|---|---|---|
| A1 | Navigation Bar | 17 |
| A2 | Floating Cart | 3 |
| A3 | Floating Chat | 3 |
| A4 | Home Page | 11 |
| A5 | Menu Page | 21 |
| A6 | Cart Page | 25 |
| A7 | Payment Modal | 11 |
| A8 | Authentication | 17 |
| A9 | Order History | 20 |
| A10 | Order Tracking | 28 |
| A11 | Feedback Form | 14 |
| A12 | Support Chat | 14 |
| **B1** | **Kitchen Dashboard** | **40** |
| **C1** | **Counter Dashboard** | **42** |
| **D1** | Admin Dashboard | 18 |
| **D2** | Menu Management | 26 |
| **D3** | Category Management | 15 |
| **D4** | Order Management | 19 |
| **D5** | Customer Management | 30 |
| **D6** | Staff Management | 53 |
| **D7** | Coupon Management | 37 |
| **D8** | Feedback Management | 22 |
| **D9** | Invoice Management | 22 |
| **D10** | Invoice Template Settings | 15 |
| **D11** | QR Code Management | 10 |
| **D12** | Customer Support | 16 |
| **D13** | Website Settings | 39 |
| **E1-E7** | Cross-Cutting Features | 37 |
| | **GRAND TOTAL** | **~624** |

---

*All features derived from actual codebase analysis. Each feature ID can be used for test case tracking, bug reports, and sprint planning.*
