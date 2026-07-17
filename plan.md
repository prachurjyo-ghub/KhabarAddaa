# Restaurant Management System — Rebuild Plan

This document is a **standalone rebuild blueprint** based on the current PizzaHub / StoneFire Kitchen project.

Use it to build another restaurant system with the **same internal functionality, architecture, and options**.  
The UI/branding can change; the product capabilities and stack pattern should stay equivalent.

---

## 1. Product overview

Build a full restaurant platform with three apps:

| App | Audience | Responsibility |
|-----|----------|----------------|
| **Client** | Customers | Browse menu, cart, checkout, book a table, account |
| **Admin** | Staff / owners | Menu, orders, inventory, tables/bookings, financials, staff, settings |
| **Backend API** | Both frontends | Auth, business logic, MongoDB, file uploads |

**Reference brand (this repo):** StoneFire Kitchen  
**Currency / locale pattern:** Bangladeshi Taka (`৳`, `en-BD`)

---

## 2. Recommended stack (same as this project)

### Backend
| Library | Purpose |
|---------|---------|
| **Node.js + Express** | REST API |
| **MongoDB + Mongoose** | Database / ODM |
| **jsonwebtoken** | Auth tokens |
| **bcryptjs** | Password hashing |
| **cookie-parser** | HttpOnly cookies |
| **cors** | Credentialed CORS for admin + client origins |
| **dotenv** | Environment config |
| **multer** | Image uploads |
| **nodemon** | Dev reload |

### Admin + Client (two Next.js apps)
| Library | Purpose |
|---------|---------|
| **Next.js (App Router)** | Frontend framework |
| **React 19** | UI |
| **Tailwind CSS** | Styling |
| **Shadcn / Radix UI** | Select, Dialog, Dropdown, Tabs, Avatar, Button primitives |
| **sonner** | Toasts |
| **react-icons** | Icons |
| **class-variance-authority + clsx + tailwind-merge** | Component class utilities |
| **React Compiler** (optional, as in this project) | Compile-time optimizations |

### Suggested local ports
| Service | Port |
|---------|------|
| Admin | `3000` |
| Client | `3001` |
| Backend API | `5001` |

API base path: `/api/v1`

---

## 3. Repository structure

```text
project/
├── adminend/          # Staff admin (Next.js)
├── clientend/         # Customer storefront (Next.js)
├── backend/           # Express API + uploads/
├── plan.md            # This blueprint
└── .env               # Shared reference env (optional)
```

Keep apps separate (not required to be a single npm workspace). Each frontend talks to the backend via `NEXT_PUBLIC_API_URL`.

---

## 4. Environment variables

### Backend (`backend/.env`)
| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `BACKEND_PORT` | no | API port | `5001` |
| `MONGODB_URI` | **yes** | Mongo connection | Atlas URI |
| `JWT_SECRET` | **yes** | JWT signing key | long random string |
| `JWT_EXPIRES_IN` | no | Session lifetime | `7d`, `24h`, `60m` |
| `ADMIN_URL` | no | CORS + links | `http://localhost:3000` |
| `CLIENT_URL` | no | CORS + links | `http://localhost:3001` |
| `PUBLIC_API_ORIGIN` | no | Absolute upload URLs | `http://localhost:5001` |
| `SEED_SUPER_ADMIN_EMAIL` | no | Seeded super admin | `admin@stonefire.com` |
| `SEED_SUPER_ADMIN_PASSWORD` | no | Seeded password | `admin123` |
| `SEED_SUPER_ADMIN_NAME` | no | Seeded name | — |

### Client (`.env.local`)
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5001/api/v1` |
| `NEXT_PUBLIC_MANAGER_PHONE` | Phone shown for large-party booking contact |

### Admin (`.env.local`)
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5001/api/v1` |

---

## 5. Auth & roles system

### Dual auth principals
1. **Customers** — register / login / profile / orders / bookings  
2. **Staff** — admin panel access by role + permissions  

### Token strategy (implement both)
- Issue JWT with payload: `{ sub, kind: "customer" | "staff", role }`
- Set HttpOnly cookie:
  - Customer: `pizzahub_customer_token` (name can be branded)
  - Staff: `pizzahub_staff_token`
- Also accept `Authorization: Bearer <token>` (frontends store token in localStorage)
- Cookie + JWT lifetime driven by `JWT_EXPIRES_IN` (default `7d`)

### Staff roles
| Role | Meaning |
|------|---------|
| `super_admin` | Full access; manages staff; can change own email via OTP |
| `manager` | Broad operations access (not staff CRUD by default) |
| `waiter` | Orders, tables, bookings |
| `chef` | Orders, inventory |

### Permission keys
```
dashboard | menu | orders | inventory | financials | tables | bookings | staff
```

Default matrix (same as this project):

| Role | Defaults |
|------|----------|
| `super_admin` | All permissions forced `true` |
| `manager` | All except `staff` |
| `waiter` | `dashboard`, `orders`, `tables`, `bookings` |
| `chef` | `dashboard`, `orders`, `inventory` |

### Access control rules to keep
- Inactive staff (`isActive: false`) **cannot sign in** and fail auth middleware
- Super admin **cannot be deactivated or deleted**
- Staff account CRUD is **super-admin only**
- Nav items gated by permissions; Settings available to all authenticated staff

### Staff settings security (OTP)
Implement OTP flows (email delivery can be stubbed; return `devOtp` for development):

1. **Email change (super admin only)**  
   Current email → send OTP → verify OTP → set new email
2. **Password reset (all staff)**  
   Send OTP to account email → verify → set new password (min 6 chars)

OTP model: 6-digit code, purpose (`email_change` | `password_reset`), TTL ~10 minutes, verified flag.

---

## 6. Data models (must-have)

### Staff
`name`, `email` (unique), `passwordHash`, `phone`, `role`, `permissions`, `isActive`, `shift` (`ON SHIFT` | `OFF DUTY`)

### Customer
`name`, `email` (unique), `passwordHash`, `phone`, `addresses[{ label, line, isDefault }]`

### MenuCategory
`name` (unique), `image`, `isActive`

### MenuItem
`slug` (unique), `name`, `description`, `category`, `price`, `image`, `tags[]`,  
`isFeatured`, `homepageBadge` (`none` | `weekly-best-seller`),  
`customizable`, `sizes[{ id, label, extra }]`, `toppings[{ id, label, price }]`,  
`status` (`In Stock` | `Low Stock` | `Out of Stock`), `isActive`

### Order
`orderNumber`, customer refs/name/phone,  
`orderType` (`delivery` | `takeaway` | `dine-in`),  
`status` (`PENDING` → `PREPARING` → `READY` → `IN_TRANSIT` → `DELIVERED` | `CANCELLED`),  
`paymentMethod` (`cash` | `bkash` | `card`), `paymentStatus`,  
address / instructions / table / guests / booking link,  
`items[]`, `subtotal`, `deliveryFee`, `discount`, `tax`, `total`

### Booking
Customer info, `guests` (1–12 online), `date`, `startMinutes` / `endMinutes`,  
table assignment, note, `source` (`online` | `admin` | `walk_in`),  
`status` (`Pending` | `Confirmed` | `Checked In` | `Seated` | `Completed` | `Cancelled` | `No Show`)

### Reservation schedule
- **WeeklySchedule** — per weekday open/close + slot duration  
- **DateOverride** — closed / special hours for one date  
- **BlockedDate** — day off  
- Dining tables: name, seats, Available/Unavailable, soft-active flag

### InventoryItem
`name`, `category`, `quantity`, `unit`, `status` (auto from qty), `lastRestocked`

### Financials
- **Offer** — % or fixed discount; applies to all / category / product; Active/Inactive  
- **VatRule** — rate %; applies-to scopes; Active/Inactive  
- **DeliveryFee** — fee + min order; Active/Inactive  

Pricing rule (as implemented here): apply best matching offer/VAT by specificity; choose cheapest active delivery fee (with fallback).

### RestaurantImage (Our Place gallery)
`image`, `alt`, `caption`, `isActive`

### StaffOtp
`staffId`, `purpose`, `code`, `verified`, `expiresAt`

---

## 7. API surface (rebuild checklist)

Base: `/api/v1`

### Health
- `GET /health`

### Auth
- Customer: register, login, me (GET/PATCH), logout  
- Staff: login, me (GET/PATCH), password change, logout  
- Staff OTP: email request/verify/confirm; password request/verify/confirm  
- Staff CRUD: list/create/update/delete (super admin)

### Menu
- Public menu list  
- Staff menu item CRUD + category CRUD  

### Orders
- Customer place order + my orders  
- Public order quote (`POST /public/order-quote`)  
- Staff live queue, status updates, manual create, available tables  
- Dashboard summary  

### Inventory
- Staff inventory CRUD / restock / status helpers  

### Financials & delivery
- Public delivery fees + financials snapshot  
- Staff CRUD for delivery fees, VAT rules, offers  

### Tables & bookings
- Staff table CRUD  
- Public availability + create booking  
- Staff weekly schedule, date overrides, day view, blocked dates, reservation CRUD  

### Uploads & gallery
- `POST /uploads` (staff, multipart `image`) → store under `/uploads`  
- Restaurant images public list + staff create/delete  

---

## 8. Admin app — required modules

| Module | Route (reference) | Must include |
|--------|-------------------|--------------|
| Login | `/adminlogin` | Email/password staff login |
| Dashboard | `/dashboard` | Sales / active orders / recent orders |
| Menu | `/menu` | Categories + items CRUD, featured flag, homepage badge, stock status, customizable sizes/toppings, search/filter/sort |
| Our Place | `/our-place` | Upload restaurant photos for homepage gallery |
| Live Orders | `/orders` | Queue workflow, manual/waiter order, status chips, type filter, sort |
| Order History | `/orders/history` | Handed-off orders, status/type/date filters, sort, detail actions |
| Inventory | `/inventory` | CRUD, restock, category/status filters, sort |
| Financials | `/delivery-fees` (tabs) | Delivery fees, VAT, offers |
| Tables / Reservations | `/tables` | Floor day view, tables CRUD, weekly schedule, date overrides, reservations list |
| Staff | `/employees` | Staff CRUD, permission toggles, activate/deactivate, password reset by admin, filters/sort |
| Settings | `/settings` | Profile edit; OTP email change (super admin); OTP password reset |

### Admin UX standards to keep
- Permission-gated sidebar nav  
- Skeleton loaders for data screens  
- Shadcn Select for filters/sorts/forms  
- Image upload field (file → API upload, or paste URL)  
- Toasts for success/error  
- Staff deactivate removes login ability without deleting the account  

---

## 9. Client app — required modules

| Module | Route (reference) | Must include |
|--------|-------------------|--------------|
| Home | `/` | Hero, featured items (`isFeatured`), specials/badges, Our Place carousel, story/contact blocks |
| Menu | `/menu` | Categories, search, sort, cards, add to cart / customize |
| Product | `/menu/[slug]` | Detail page, related items |
| Cart | drawer | Qty controls, subtotal, checkout CTA |
| Checkout | `/checkout` | Auth required; delivery/takeaway; address; quote (fee/discount/tax); payment method; place order |
| Book a table | `/book` | Guests 1–12; availability check; create booking; **13+ guests** → manager phone contact flow |
| Account | `/account` | Profile, addresses CRUD, order history with filter/sort |
| Auth | `/login` | Tabbed Login / Sign Up |

### Client UX standards to keep
- Persistent cart (localStorage)  
- Auth token/user in localStorage + Bearer requests  
- Skeleton loaders  
- Mobile bottom nav (Home / Menu / Cart / Orders)  
- Footer credit / branding link (optional for new brand)  

---

## 10. Core business flows (must behave the same)

### Ordering
1. Customer browses menu → adds items (customizable pizzas open modifier)  
2. Checkout computes quote (offers/VAT/delivery fee)  
3. Order created with type + payment method  
4. Admin live queue progresses status until handoff/delivery/cancel  
5. History retains completed/cancelled orders for follow-up  

### Reservations
1. Customer picks date + guests + available slot  
2. Booking created as online reservation  
3. Admin manages floor occupancy, weekly hours, day offs, overrides  
4. Walk-in / admin bookings supported from staff side  
5. Large parties (13+) contact manager phone instead of online booking  

### Catalog merchandising
- `isFeatured` drives homepage featured carousel  
- `homepageBadge` (e.g. weekly best seller) drives homepage specials  
- Out-of-stock handling on public surfaces  

### Staff lifecycle
- Super admin creates staff with role + permissions  
- Staff can be deactivated (no login) or reactivated  
- Staff self-serve password reset via OTP  
- Super admin can change email via OTP  

---

## 11. Cross-cutting implementation notes

1. **API response style** — consistent success/error envelope (`sendSuccess` / `ApiError` pattern).  
2. **CORS** — allow admin + client origins with credentials.  
3. **Uploads** — serve `backend/uploads` at `/uploads`; allow Next Image for that host.  
4. **Seed script** — create super admin, sample menu/categories, inventory, fees, tables, weekly schedule.  
5. **Filters & sorting** — every major list should support search + relevant filters + sort (Shadcn Select).  
6. **Loading states** — skeleton components, not only “Loading…” text.  
7. **Session length** — configurable via `JWT_EXPIRES_IN`.  

---

## 12. Suggested build order for a new restaurant project

1. **Backend foundation** — Express app, env, Mongo models, auth middleware, seed  
2. **Auth APIs** — customer + staff login/me + permissions  
3. **Menu APIs + Admin Menu UI**  
4. **Client menu + cart + checkout + order APIs**  
5. **Live orders + order history admin**  
6. **Inventory**  
7. **Tables + booking schedule + public book page**  
8. **Financials (fees, VAT, offers) + quote endpoint**  
9. **Staff management + deactivate + settings OTP**  
10. **Our Place gallery + homepage merchandising**  
11. **Polish** — skeletons, filters/sorts, uploads, toasts, env hardening  

---

## 13. Out of scope / known gaps in the reference project

These are **not required** for parity, but document them so you don’t assume they exist unless you add them:

- Real email/SMS delivery for OTP (currently can show `devOtp`)  
- WebSocket / polling for live order updates  
- Fully dynamic dashboard W/M/Y range from API  
- Persisted pizza “modifier rules” beyond sizes/toppings on menu items  
- Online payment gateway capture (methods exist; processing may be UI-level)  

---

## 14. Definition of done (parity checklist)

A rebuild matches this system when it includes:

- [ ] Separate client, admin, and API apps on the same stack pattern  
- [ ] Customer auth + staff auth with roles/permissions  
- [ ] Menu categories/items with featured + homepage badge + customizable options  
- [ ] Cart, checkout quote, and order placement  
- [ ] Admin live order queue + history  
- [ ] Inventory with auto stock status  
- [ ] Tables + weekly schedule + overrides + public booking  
- [ ] Delivery fees, VAT rules, offers  
- [ ] Staff CRUD + deactivate access  
- [ ] Settings profile + OTP password reset (+ super-admin email change)  
- [ ] Image uploads for menu/gallery  
- [ ] Filters/sorts + skeleton loaders on major lists  
- [ ] Configurable JWT session lifetime via env  

---

*Blueprint derived from the PizzaHub / StoneFire Kitchen implementation. UI and branding may change; keep the internal systems and options equivalent.*
