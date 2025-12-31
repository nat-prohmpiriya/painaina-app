# Interview Questions - Painaina Project

> คำถาม-คำตอบสำหรับสัมภาษณ์งาน วิเคราะห์จาก codebase จริง

---

## 1. Project Overview

**Q: โปรเจ็คนี้ทำอะไร?**

> **A:** Painaina เป็น Full-stack Travel Planning Application ที่ช่วยให้ผู้ใช้สร้าง จัดการ และแชร์แผนการเดินทาง (Trip) และ Travel Guides รวมถึง Social Features เช่น Comments, Reactions, Bookmarks และ Real-time Notifications

---

## 2. Tech Stack

**Q: Tech Stack ที่ใช้มีอะไรบ้าง?**

> **A:**
>
> - **Frontend:** Next.js 15 + React 19 + TypeScript + Tailwind CSS + Radix UI
> - **Backend:** Go (Gin Framework) + MongoDB (MGM ORM) + Redis
> - **Auth:** Clerk (JWT-based)
> - **Storage:** Cloudflare R2
> - **Maps:** Leaflet + React-Leaflet
> - **Real-time:** Server-Sent Events (SSE)
> - **Observability:** OpenTelemetry + Zipkin

**Q: ทำไมเลือกใช้ Go แทน Node.js สำหรับ Backend?**

> **A:**
>
> - Performance ดีกว่า เหมาะกับ concurrent requests
> - Type safety ช่วยลด runtime errors
> - Compiled language ทำให้ deployment ง่าย (single binary)
> - Memory efficiency ดีกว่า Node.js

---

## 3. Architecture & Design Patterns

**Q: Backend ใช้ Architecture Pattern อะไร?**

> **A:** ใช้ **Layered Architecture** แบ่งเป็น:
>
> - **Handler** - รับ HTTP request, validation
> - **Service** - Business logic
> - **Repository** - Database operations
> - ใช้ **Dependency Injection** ใน main.go

**Q: Frontend State Management ใช้อะไร?**

> **A:**
>
> - **TanStack Query (React Query v5)** - Server state, caching
> - **React Context API** - TripContext, ToastMessageContext
> - **Custom Hooks** - Wrap React Query mutations/queries

**Q: ทำไมเลือก MongoDB แทน PostgreSQL?**

> **A:**
>
> - Trip/Itinerary มี nested structure ที่ซับซ้อน → Document-based เหมาะกว่า
> - Schema flexibility สำหรับ features ที่เปลี่ยนบ่อย
> - ใช้ MongoDB Aggregation สำหรับ complex queries

---

## 4. Features & Implementation

**Q: ระบบ Real-time Notifications ทำงานยังไง?**

> **A:** ใช้ **Server-Sent Events (SSE):**
>
> 1. Client เปิด connection ไปยัง `/api/v1/sse/notifications`
> 2. Backend มี SSE Hub จัดการ connections
> 3. เมื่อมี event เช่น comment ใหม่ → push ผ่าน SSE
> 4. Frontend hook `useSSENotification.ts` รับ events

**Q: ระบบ Check-in ทำงานยังไง?**

> **A:**
>
> - User check-in ที่สถานที่ พร้อม location coordinates
> - บันทึกลง MongoDB collection
> - แสดง check-in stats และ map visualization
> - สามารถดู check-ins ของ user อื่นได้

**Q: Authentication flow เป็นยังไง?**

> **A:**
>
> 1. User login ผ่าน Clerk (OAuth/Email)
> 2. Clerk issue JWT token
> 3. Frontend ส่ง token ใน Authorization header
> 4. Backend middleware verify JWT กับ Clerk
> 5. Extract user ID สำหรับ database operations

---

## 5. Database & Caching

**Q: ใช้ Redis ทำอะไรบ้าง?**

> **A:**
>
> - **Place caching** - Cache Google Places API responses
> - **Session/rate limiting** (if applicable)
> - Reduce external API calls และ latency

**Q: มี Soft Delete หรือ Hard Delete?**

> **A:** ใช้ **Soft Delete** สำหรับ Trips - set `deletedAt` timestamp แทนการลบจริง เพื่อ data recovery และ audit trail

**Q: Database indexing strategy?**

> **A:**
>
> - Index on `ownerId` สำหรับ user's trips
> - Index on `status` สำหรับ filtering
> - Compound index สำหรับ common query patterns
> - TTL index สำหรับ cache expiration (ถ้ามี)

---

## 6. Security

**Q: Security measures มีอะไรบ้าง?**

> **A:**
>
> - JWT validation ทุก protected route
> - CORS configuration
> - Input validation ด้วย Zod (frontend) และ schema validation (backend)
> - Role-based access control (owner/editor/viewer)
> - Admin role สำหรับ moderation

**Q: จัดการ File Upload ยังไง?**

> **A:**
>
> - Upload ไปที่ Cloudflare R2 (S3-compatible)
> - Validate file type และ size
> - Generate unique filenames
> - Return CDN URL

---

## 7. Performance & Optimization

**Q: Performance optimization ทำอะไรบ้าง?**

> **A:**
>
> - **In-memory cache** สำหรับ city autocomplete (loaded from CSV)
> - **Redis cache** สำหรับ Google Places responses
> - **React Query caching** ลด unnecessary fetches
> - **MongoDB aggregation** แทน multiple queries
> - **Image compression** ใน content pipeline

**Q: ถ้ามี user เยอะขึ้น จะ scale ยังไง?**

> **A:**
>
> - Backend เป็น stateless → horizontal scaling ได้
> - MongoDB replica set / sharding
> - Redis cluster
> - CDN สำหรับ static assets
> - SSE Hub อาจต้องใช้ Redis pub/sub สำหรับ multi-instance

---

## 8. Testing & DevOps

**Q: Testing strategy?**

> **A:**
>
> - Backend: Go unit tests (`make test`)
> - API testing (manual/Postman)
> - Type safety จาก TypeScript และ Go ช่วยลด bugs

**Q: Development workflow?**

> **A:**
>
> - Docker Compose สำหรับ local dev
> - **Air** (Go hot reload) + **Turbopack** (Next.js)
> - Git flow: `develop` → `main`
> - Makefile commands สำหรับ common tasks

---

## 9. Internationalization

**Q: รองรับหลายภาษายังไง?**

> **A:**
>
> - ใช้ **next-intl** library
> - Locale-based routing: `/en/trips`, `/th/trips`
> - Translation files ใน `src/messages/`
> - รองรับ English และ Thai

---

## 10. Challenges & Solutions

**Q: ปัญหาที่ยากที่สุดที่เจอ?**

> **A:** (ตัวอย่าง)
>
> - **SSE connection management** - ต้องจัดการ connection lifecycle, reconnection
> - **Complex itinerary state** - Nested data structure, drag-and-drop reordering
> - **Google Places quota** - ต้องทำ caching layer

**Q: ถ้าต้องเพิ่ม Collaborative Editing จะทำยังไง?**

> **A:**
>
> - เปลี่ยนจาก SSE เป็น WebSocket
> - ใช้ Operational Transformation หรือ CRDT
> - Real-time cursor/presence
> - Conflict resolution strategy

---

## 11. Code Quality

**Q: จัดการ Code Quality ยังไง?**

> **A:**
>
> - **Biome** สำหรับ linting/formatting (frontend)
> - **Go fmt/lint** สำหรับ backend
> - TypeScript strict mode
> - Clear folder structure และ naming conventions

---

## 12. Future Improvements

**Q: ถ้ามีเวลา จะ improve อะไร?**

> **A:**
>
> - เพิ่ม E2E testing (Playwright/Cypress)
> - Implement offline support (PWA)
> - AI-powered trip suggestions
> - GraphQL layer สำหรับ flexible queries
> - Better error monitoring (Sentry)

---

## 13. Project Structure (Reference)

### Backend (Go)

```
backend-go/
├── cmd/api/main.go          # Entry point
├── internal/
│   ├── config/              # Configuration
│   ├── models/              # Data models
│   ├── handlers/            # HTTP handlers (21 files)
│   ├── services/            # Business logic (16 files)
│   ├── repository/          # Database layer
│   └── middleware/          # Auth, CORS, OTel
├── pkg/
│   ├── mongodb/             # MongoDB init
│   ├── redis/               # Redis client
│   ├── clerk/               # Auth
│   ├── sse/                 # Real-time
│   ├── googleplaces/        # External API
│   └── unsplash/            # External API
└── Makefile
```

### Frontend (Next.js)

```
frontend-nextjs/src/
├── app/[locale]/            # Locale-based routing
│   ├── trips/               # Trip pages
│   ├── guides/              # Guide pages
│   ├── admin/               # Admin panel
│   └── profiles/            # User profiles
├── components/              # React components
├── hooks/                   # Custom hooks (React Query)
├── contexts/                # React Context
├── lib/                     # Utilities
├── types/                   # TypeScript types
└── messages/                # i18n translations
```

---

## 14. Key Data Models

| Collection      | Purpose                            |
| --------------- | ---------------------------------- |
| `users`         | User profiles (synced with Clerk)  |
| `trips`         | Trip/Guide data with destinations  |
| `itineraries`   | Day-by-day planning                |
| `expenses`      | Budget tracking                    |
| `comments`      | Nested comments with reactions     |
| `checkins`      | Location check-ins                 |
| `notifications` | Push notifications                 |
| `interactions`  | Views, reactions, bookmarks        |

---

## 15. API Endpoints (Key)

| Endpoint                    | Method | Purpose            |
| --------------------------- | ------ | ------------------ |
| `/api/v1/trips`             | GET    | List trips         |
| `/api/v1/trips/:id`         | GET    | Trip details       |
| `/api/v1/trips/:id/comments`| GET    | Trip comments      |
| `/api/v1/checkins`          | POST   | Create check-in    |
| `/api/v1/notifications`     | GET    | List notifications |
| `/api/v1/sse/notifications` | GET    | SSE stream         |
| `/api/v1/places/autocomplete`| GET   | City autocomplete  |
| `/api/v1/admin/stats/overview`| GET  | Admin stats        |

---

_Last updated: 2025-12-23_
_Generated from codebase analysis_
