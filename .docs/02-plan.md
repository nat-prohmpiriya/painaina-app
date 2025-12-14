# PaiNaiNa - Technical Plan Document

> **Version:** 1.0
> **Last Updated:** 2025-12-13
> **Status:** Based on existing codebase + 01-spec.md
> **Prepared for:** Development Team

---

## Executive Summary

เอกสารนี้วิเคราะห์ Technical Architecture ที่มีอยู่แล้วใน codebase และระบุสิ่งที่ต้องเพิ่มเติมตาม Product Spec

**สถานะปัจจุบัน:** MVP Features ~90% Complete
**สิ่งที่ต้องทำ:** Gap Analysis + Phase 2 Features

---

## 1. System Architecture

### 1.1 Current Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PAINAINA ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     CLIENT      │     │    SERVICES     │     │   DATA LAYER    │
└─────────────────┘     └─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Next.js 15    │────▶│   Go + Gin      │────▶│   MongoDB       │
│   (App Router)  │     │   REST API      │     │   (Atlas)       │
│                 │     │                 │     │                 │
│  - React 19     │     │  - Handlers     │     └─────────────────┘
│  - TanStack     │     │  - Services     │              │
│    Query        │     │  - Repository   │              │
│  - Radix UI     │     │                 │     ┌─────────────────┐
│  - Tailwind     │     └─────────────────┘     │                 │
│  - next-intl    │              │              │   Redis         │
│                 │              │              │   (Upstash)     │
└─────────────────┘              │              │                 │
        │                        │              │  - Photo Cache  │
        │                        ▼              │  - Rate Limit   │
        │              ┌─────────────────┐      │                 │
        │              │   SSE Hub       │      └─────────────────┘
        │◀─────────────│   (Real-time)   │
        │              │   Notifications │      ┌─────────────────┐
        │              └─────────────────┘      │                 │
        │                        │              │   Cloudflare    │
        │                        │              │   R2 Storage    │
        ▼                        ▼              │                 │
┌─────────────────┐     ┌─────────────────┐     │  - User Uploads │
│                 │     │                 │     │  - Cover Photos │
│   Clerk         │     │   External APIs │     │                 │
│   (Auth)        │     │                 │     └─────────────────┘
│                 │     │  - Google Places│
│  - JWT Tokens   │     │  - Unsplash     │      ┌─────────────────┐
│  - User Mgmt    │     │                 │      │   Zipkin        │
│                 │     └─────────────────┘      │   (Tracing)     │
└─────────────────┘                              └─────────────────┘
```

### 1.2 Tech Stack Summary

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Next.js | 15.5.7 | App Router, SSR, Routing |
| | React | 19.1.0 | UI Components |
| | TanStack Query | 5.90.2 | Server State Management |
| | Radix UI | Latest | Headless Components |
| | Tailwind CSS | 4.0 | Styling |
| | next-intl | 4.5.5 | i18n (EN/TH) |
| | @dnd-kit | Latest | Drag & Drop |
| | Clerk | Latest | Auth UI |
| **Backend** | Go | 1.21+ | API Server |
| | Gin | Latest | HTTP Framework |
| | MGM | Latest | MongoDB ORM |
| **Database** | MongoDB | Atlas | Primary Database |
| | Redis | Upstash | Caching |
| **Storage** | Cloudflare R2 | - | File Storage |
| **Auth** | Clerk | - | Authentication |
| **External** | Google Places | - | Location Data |
| | Unsplash | - | Stock Photos |
| **Observability** | OpenTelemetry | - | Distributed Tracing |
| | Zipkin | - | Trace Visualization |

### 1.3 Request Flow

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           REQUEST FLOW                                      │
└────────────────────────────────────────────────────────────────────────────┘

User Action (e.g., Create Trip)
         │
         ▼
┌─────────────────┐
│  React Component │
│  (CreateTrip)    │
└────────┬────────┘
         │ useMutation()
         ▼
┌─────────────────┐
│  TripService    │
│  (Frontend)     │
└────────┬────────┘
         │ axios.post()
         ▼
┌─────────────────┐
│  API Client     │
│  + Interceptors │
│  (JWT Header)   │
└────────┬────────┘
         │ HTTP POST /api/v1/trips
         ▼
┌─────────────────┐
│  Gin Router     │
│  + Middleware   │
│  (Auth, CORS)   │
└────────┬────────┘
         │ Validated
         ▼
┌─────────────────┐
│  TripHandler    │
│  (Controller)   │
└────────┬────────┘
         │ Business Logic
         ▼
┌─────────────────┐
│  TripService    │
│  (Backend)      │
└────────┬────────┘
         │ Data Access
         ▼
┌─────────────────┐
│  TripRepository │
│  (MongoDB)      │
└────────┬────────┘
         │ Insert
         ▼
┌─────────────────┐
│  MongoDB Atlas  │
└────────┬────────┘
         │ Success
         ▼
┌─────────────────┐
│  Response JSON  │
│  → Frontend     │
│  → Query Cache  │
│  → UI Update    │
└─────────────────┘
```

---

## 2. Data Model / Schema

### 2.1 Current MongoDB Collections

```javascript
// =====================================================
// COLLECTION: trips
// =====================================================
{
  _id: ObjectId,
  title: String,                    // Required
  description: String,
  startDate: Date,
  endDate: Date,
  destinations: [{                  // Array of destinations
    name: String,
    lat: Number,
    lng: Number,
    placeId: String
  }],
  coverPhoto: {
    url: String,
    source: String                  // "upload" | "unsplash"
  },

  // Trip Type & Status
  type: String,                     // "trip" | "guide"
  status: String,                   // "draft" | "published" | "archived"
  level: String,                    // "easy" | "moderate" | "hard" | "expert"

  // Ownership & Access
  ownerId: ObjectId,                // ref: users
  tripMembers: [{
    userId: ObjectId,               // ref: users
    role: String,                   // "owner" | "admin" | "editor" | "viewer"
    invitedAt: Date,
    joinedAt: Date
  }],

  // Metadata
  tags: [String],
  budget: {
    amount: Number,
    currency: String                // "THB" | "USD" etc.
  },

  // Analytics
  viewCount: Number,
  reactionsCount: Number,
  bookmarkCount: Number,
  shareCount: Number,

  // Timestamps
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date                   // Soft delete
}

// Indexes:
// - { ownerId: 1, deletedAt: 1 }
// - { type: 1, status: 1 }
// - { "destinations.placeId": 1 }
// - { tags: 1 }
// - { createdAt: -1 }


// =====================================================
// COLLECTION: itineraries
// =====================================================
{
  _id: ObjectId,
  tripId: ObjectId,                 // ref: trips (1:1)
  days: [{
    _id: ObjectId,
    date: Date,
    title: String,                  // e.g., "Day 1 - Arrival"
    order: Number
  }],
  createdAt: Date,
  updatedAt: Date
}

// Indexes:
// - { tripId: 1 } (unique)


// =====================================================
// COLLECTION: itinerary_entries
// =====================================================
{
  _id: ObjectId,
  itineraryId: ObjectId,            // ref: itineraries
  dayId: ObjectId,                  // ref: itineraries.days._id

  // Entry Type
  type: String,                     // "place" | "note" | "todos"

  // Common Fields
  title: String,
  description: String,
  order: Number,

  // Time (optional)
  startTime: String,                // "09:00"
  endTime: String,                  // "11:00"
  duration: Number,                 // minutes

  // Place-specific (type="place")
  placeId: String,                  // Google Place ID
  place: {
    name: String,
    address: String,
    lat: Number,
    lng: Number,
    rating: Number,
    priceLevel: Number,
    photos: [String],
    openingHours: [String],
    types: [String]
  },

  // Todo-specific (type="todos")
  todos: [{
    _id: ObjectId,
    text: String,
    completed: Boolean
  }],

  // Budget & Media
  budget: {
    amount: Number,
    currency: String
  },
  photos: [{
    url: String,
    source: String
  }],

  createdAt: Date,
  updatedAt: Date
}

// Indexes:
// - { itineraryId: 1, dayId: 1 }
// - { order: 1 }


// =====================================================
// COLLECTION: expenses
// =====================================================
{
  _id: ObjectId,
  tripId: ObjectId,                 // ref: trips

  // Expense Details
  description: String,
  amount: Number,
  currency: String,                 // "THB"
  category: String,                 // "accommodation" | "transport" | "food" | "activities" | "shopping" | "other"
  date: Date,

  // Payment Info
  paidBy: ObjectId,                 // ref: users (who paid)

  // Split Configuration
  splitType: String,                // "equal" | "percentage" | "exact"
  splitWith: [ObjectId],            // ref: users (who splits)
  splitDetails: [{
    userId: ObjectId,
    amount: Number,
    percentage: Number              // if splitType="percentage"
  }],

  // Status
  status: String,                   // "pending" | "settled"

  // Attachments
  receipt: {
    url: String
  },

  createdAt: Date,
  updatedAt: Date
}

// Indexes:
// - { tripId: 1 }
// - { paidBy: 1 }
// - { category: 1 }


// =====================================================
// COLLECTION: users
// =====================================================
{
  _id: ObjectId,
  clerkId: String,                  // Clerk User ID (unique)
  email: String,

  // Profile
  name: String,
  bio: String,
  photoUrl: String,

  // Role & Status
  role: String,                     // "user" | "admin"
  isBanned: Boolean,
  banReason: String,
  banDuration: Date,

  // Settings
  settings: {
    language: String,               // "en" | "th"
    timezone: String,
    notifications: {
      email: Boolean,
      push: Boolean,
      tripUpdates: Boolean,
      expenseUpdates: Boolean
    },
    privacy: {
      profileVisibility: String     // "public" | "private"
    }
  },

  // Analytics
  tripsCount: Number,
  guidesCount: Number,

  createdAt: Date,
  updatedAt: Date
}

// Indexes:
// - { clerkId: 1 } (unique)
// - { email: 1 } (unique)


// =====================================================
// COLLECTION: comments
// =====================================================
{
  _id: ObjectId,
  tripId: ObjectId,                 // ref: trips
  authorId: ObjectId,               // ref: users

  content: String,

  // Reply Threading
  parentId: ObjectId,               // ref: comments (null = top-level)

  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date
}

// Indexes:
// - { tripId: 1, createdAt: -1 }
// - { authorId: 1 }
// - { parentId: 1 }


// =====================================================
// COLLECTION: notifications
// =====================================================
{
  _id: ObjectId,
  userId: ObjectId,                 // ref: users (recipient)

  type: String,                     // "trip_invite" | "comment" | "comment_reply" | "member_joined" | "expense_added" | "like"

  // Reference
  tripId: ObjectId,
  commentId: ObjectId,
  expenseId: ObjectId,

  // Actor
  actorId: ObjectId,                // ref: users (who triggered)

  // Content
  title: String,
  message: String,

  // Status
  isRead: Boolean,

  createdAt: Date
}

// Indexes:
// - { userId: 1, isRead: 1, createdAt: -1 }


// =====================================================
// COLLECTION: places (Cache)
// =====================================================
{
  _id: ObjectId,
  googlePlaceId: String,            // unique

  name: String,
  address: String,
  location: {
    type: "Point",
    coordinates: [Number, Number]   // [lng, lat]
  },

  // Details
  rating: Number,
  userRatingsTotal: Number,
  priceLevel: Number,
  types: [String],
  photos: [{
    reference: String,
    width: Number,
    height: Number
  }],
  openingHours: {
    weekdayText: [String],
    isOpen: Boolean
  },

  // Cache Control
  cachedAt: Date,
  expiresAt: Date                   // TTL: 30 days
}

// Indexes:
// - { googlePlaceId: 1 } (unique)
// - { expiresAt: 1 } (TTL)
// - { location: "2dsphere" }


// =====================================================
// COLLECTION: files
// =====================================================
{
  _id: ObjectId,
  userId: ObjectId,                 // ref: users (uploader)

  filename: String,
  originalName: String,
  mimeType: String,
  size: Number,                     // bytes

  // Storage
  storageKey: String,               // R2 key
  url: String,                      // Public URL

  // Context
  tripId: ObjectId,
  entryId: ObjectId,

  createdAt: Date
}

// Indexes:
// - { userId: 1 }
// - { tripId: 1 }
// - { storageKey: 1 }


// =====================================================
// COLLECTION: interactions
// =====================================================
{
  _id: ObjectId,
  userId: ObjectId,                 // ref: users
  tripId: ObjectId,                 // ref: trips

  type: String,                     // "view" | "bookmark" | "reaction" | "share"

  // Reaction specific
  reactionType: String,             // "like" | "love" | "helpful"

  createdAt: Date
}

// Indexes:
// - { tripId: 1, type: 1 }
// - { userId: 1, tripId: 1, type: 1 } (unique for bookmarks)
```

### 2.2 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENTITY RELATIONSHIPS                                 │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │    Users     │
                              │──────────────│
                              │ _id          │
                              │ clerkId      │
                              │ email        │
                              │ name         │
                              │ role         │
                              └──────┬───────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
    ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
    │    Trips     │          │  Comments    │          │Notifications │
    │──────────────│          │──────────────│          │──────────────│
    │ _id          │◀─────────│ tripId       │          │ userId       │
    │ ownerId ─────┼──────────│ authorId ────┼──────────│ actorId      │
    │ tripMembers[]│          │ content      │          │ type         │
    │ type         │          │ parentId     │          │ tripId       │
    │ status       │          └──────────────┘          └──────────────┘
    └──────┬───────┘
           │
           │ 1:1
           ▼
    ┌──────────────┐
    │  Itineraries │
    │──────────────│
    │ _id          │
    │ tripId       │
    │ days[]       │
    └──────┬───────┘
           │
           │ 1:N
           ▼
    ┌──────────────┐          ┌──────────────┐
    │   Entries    │          │   Expenses   │
    │──────────────│          │──────────────│
    │ _id          │          │ _id          │
    │ itineraryId  │          │ tripId ──────┼──────▶ Trips
    │ dayId        │          │ paidBy ──────┼──────▶ Users
    │ type         │          │ splitWith[]  │
    │ place{}      │          │ splitDetails │
    └──────┬───────┘          └──────────────┘
           │
           │ lookup
           ▼
    ┌──────────────┐          ┌──────────────┐
    │   Places     │          │    Files     │
    │  (Cache)     │          │──────────────│
    │──────────────│          │ userId       │
    │ googlePlaceId│          │ tripId       │
    │ name         │          │ storageKey   │
    │ location     │          │ url          │
    └──────────────┘          └──────────────┘


Legend:
  ───▶  Foreign Key Reference
  ─ ─ ▶ Embedded/Lookup
  1:1   One-to-One
  1:N   One-to-Many
```

---

## 3. API Definition

### 3.1 Current API Endpoints

```yaml
# =====================================================
# PAINAINA API v1
# Base URL: /api/v1
# =====================================================

# -----------------------------------------------------
# HEALTH & PUBLIC
# -----------------------------------------------------
GET /
  Description: Health check
  Response: { status: "ok", version: "1.0.0" }

# -----------------------------------------------------
# TRIPS
# -----------------------------------------------------
GET /trips
  Description: List trips (my trips + public guides)
  Auth: Optional (filters by visibility)
  Query:
    - type: "trip" | "guide"
    - status: "draft" | "published" | "archived"
    - page: number
    - limit: number
  Response: { trips: Trip[], total: number }

GET /trips/:id
  Description: Get trip detail
  Auth: Required if private
  Response: Trip

POST /trips
  Description: Create new trip
  Auth: Required
  Body: {
    title: string,
    type: "trip" | "guide",
    startDate?: Date,
    endDate?: Date,
    destinations?: Destination[]
  }
  Response: Trip

PATCH /trips/:id
  Description: Update trip
  Auth: Required (owner/editor)
  Body: Partial<Trip>
  Response: Trip

DELETE /trips/:id
  Description: Soft delete trip
  Auth: Required (owner only)
  Response: { success: true }

# -----------------------------------------------------
# TRIP MEMBERS
# -----------------------------------------------------
POST /trips/:id/members
  Description: Invite member
  Auth: Required (owner/admin)
  Body: {
    email: string,
    role: "editor" | "viewer"
  }
  Response: { inviteLink: string }

GET /trips/:id/members
  Description: List members
  Auth: Required (member)
  Response: TripMember[]

PATCH /trips/:id/members/:userId
  Description: Update member role
  Auth: Required (owner/admin)
  Body: { role: string }
  Response: TripMember

DELETE /trips/:id/members/:userId
  Description: Remove member
  Auth: Required (owner/admin)
  Response: { success: true }

POST /trips/:id/join
  Description: Join via invite link
  Auth: Required
  Query: { token: string }
  Response: Trip

# -----------------------------------------------------
# ITINERARIES
# -----------------------------------------------------
GET /trips/:tripId/itinerary
  Description: Get itinerary with days
  Auth: Required (member)
  Response: Itinerary

POST /trips/:tripId/itinerary
  Description: Create itinerary (auto on trip create)
  Auth: Required (owner)
  Response: Itinerary

# Itinerary Days
POST /trips/:tripId/itinerary/days
  Description: Add day
  Auth: Required (editor+)
  Body: { date: Date, title?: string }
  Response: ItineraryDay

PATCH /trips/:tripId/itinerary/days/:dayId
  Description: Update day
  Auth: Required (editor+)
  Body: { date?: Date, title?: string }
  Response: ItineraryDay

DELETE /trips/:tripId/itinerary/days/:dayId
  Description: Delete day (cascades entries)
  Auth: Required (editor+)
  Response: { success: true }

PATCH /trips/:tripId/itinerary/days/reorder
  Description: Reorder days
  Auth: Required (editor+)
  Body: { dayIds: string[] }
  Response: { success: true }

# Itinerary Entries
GET /trips/:tripId/itinerary/entries
  Description: Get all entries
  Auth: Required (member)
  Query: { dayId?: string }
  Response: ItineraryEntry[]

POST /trips/:tripId/itinerary/entries
  Description: Add entry
  Auth: Required (editor+)
  Body: {
    dayId: string,
    type: "place" | "note" | "todos",
    title: string,
    placeId?: string,
    todos?: Todo[]
  }
  Response: ItineraryEntry

PATCH /trips/:tripId/itinerary/entries/:entryId
  Description: Update entry
  Auth: Required (editor+)
  Body: Partial<ItineraryEntry>
  Response: ItineraryEntry

DELETE /trips/:tripId/itinerary/entries/:entryId
  Description: Delete entry
  Auth: Required (editor+)
  Response: { success: true }

PATCH /trips/:tripId/itinerary/entries/reorder
  Description: Reorder entries
  Auth: Required (editor+)
  Body: { dayId: string, entryIds: string[] }
  Response: { success: true }

# -----------------------------------------------------
# EXPENSES
# -----------------------------------------------------
GET /trips/:tripId/expenses
  Description: Get all expenses
  Auth: Required (member)
  Query: { category?: string }
  Response: Expense[]

GET /trips/:tripId/expenses/summary
  Description: Get expense summary (totals, balances)
  Auth: Required (member)
  Response: {
    total: number,
    byCategory: { [key]: number },
    byPerson: {
      userId: string,
      paid: number,
      owes: number,
      balance: number
    }[]
  }

POST /trips/:tripId/expenses
  Description: Add expense
  Auth: Required (member)
  Body: {
    description: string,
    amount: number,
    currency: string,
    category: string,
    paidBy: string,
    splitType: "equal" | "percentage" | "exact",
    splitWith: string[],
    splitDetails?: SplitDetail[]
  }
  Response: Expense

PATCH /trips/:tripId/expenses/:expenseId
  Description: Update expense
  Auth: Required (payer or owner)
  Body: Partial<Expense>
  Response: Expense

DELETE /trips/:tripId/expenses/:expenseId
  Description: Delete expense
  Auth: Required (payer or owner)
  Response: { success: true }

POST /trips/:tripId/expenses/:expenseId/settle
  Description: Mark expense as settled
  Auth: Required (member)
  Response: Expense

# -----------------------------------------------------
# GUIDES (Discovery)
# -----------------------------------------------------
GET /guides
  Description: Browse published guides
  Auth: Optional
  Query:
    - destination: string
    - tags: string[] (comma-separated)
    - level: "easy" | "moderate" | "hard" | "expert"
    - search: string
    - page: number
    - limit: number
  Response: { guides: Trip[], total: number }

GET /guides/:id
  Description: Get guide detail
  Auth: Optional
  Response: Trip (with itinerary)

POST /guides/:id/copy
  Description: Copy guide to my trips
  Auth: Required
  Body: {
    title?: string,
    startDate?: Date
  }
  Response: Trip (new trip)

POST /guides/:id/bookmark
  Description: Bookmark guide
  Auth: Required
  Response: { bookmarked: true }

DELETE /guides/:id/bookmark
  Description: Remove bookmark
  Auth: Required
  Response: { bookmarked: false }

GET /guides/bookmarks
  Description: Get my bookmarked guides
  Auth: Required
  Response: Trip[]

# -----------------------------------------------------
# COMMENTS
# -----------------------------------------------------
GET /trips/:tripId/comments
  Description: Get comments
  Auth: Optional (for published guides)
  Query: { page: number, limit: number }
  Response: Comment[]

POST /trips/:tripId/comments
  Description: Add comment
  Auth: Required
  Body: {
    content: string,
    parentId?: string
  }
  Response: Comment

DELETE /trips/:tripId/comments/:commentId
  Description: Delete comment
  Auth: Required (author or trip owner)
  Response: { success: true }

# -----------------------------------------------------
# PLACES
# -----------------------------------------------------
GET /places/search
  Description: Search places (Google Places)
  Auth: Required
  Query:
    - query: string
    - lat?: number
    - lng?: number
    - type?: string
  Response: Place[]

GET /places/:placeId
  Description: Get place details
  Auth: Required
  Response: Place

GET /places/:placeId/photos/:photoRef
  Description: Get place photo (proxied)
  Auth: Optional
  Response: Image (binary)

# -----------------------------------------------------
# FILES
# -----------------------------------------------------
POST /files/upload
  Description: Upload file to R2
  Auth: Required
  Body: multipart/form-data { file, tripId?, entryId? }
  Response: { url: string, fileId: string }

DELETE /files/:fileId
  Description: Delete file
  Auth: Required (uploader)
  Response: { success: true }

# -----------------------------------------------------
# USERS
# -----------------------------------------------------
GET /users/me
  Description: Get current user profile
  Auth: Required
  Response: User

PATCH /users/me
  Description: Update profile
  Auth: Required
  Body: { name?, bio?, photoUrl?, settings? }
  Response: User

GET /users/:userId
  Description: Get public profile
  Auth: Optional
  Response: PublicUser

# -----------------------------------------------------
# NOTIFICATIONS
# -----------------------------------------------------
GET /notifications
  Description: Get notifications
  Auth: Required
  Query: { unreadOnly?: boolean, page?: number }
  Response: Notification[]

GET /notifications/unread-count
  Description: Get unread count
  Auth: Required
  Response: { count: number }

PUT /notifications/:id/read
  Description: Mark as read
  Auth: Required
  Response: { success: true }

PUT /notifications/read-all
  Description: Mark all as read
  Auth: Required
  Response: { success: true }

# SSE (Server-Sent Events)
GET /sse/notifications
  Description: Real-time notification stream
  Auth: Required (via query token)
  Response: EventStream

# -----------------------------------------------------
# UNSPLASH
# -----------------------------------------------------
GET /unsplash/search
  Description: Search Unsplash photos
  Auth: Required
  Query: { query: string, page?: number }
  Response: UnsplashPhoto[]

# -----------------------------------------------------
# ADMIN
# -----------------------------------------------------
GET /admin/stats/overview
  Description: Dashboard statistics
  Auth: Required (admin)
  Response: {
    totalUsers: number,
    totalTrips: number,
    totalGuides: number,
    activeUsers: number
  }

GET /admin/users
  Description: List users
  Auth: Required (admin)
  Query: { page, limit, search, isBanned }
  Response: User[]

PUT /admin/users/:userId/ban
  Description: Ban/unban user
  Auth: Required (admin)
  Body: { isBanned: boolean, reason?: string, duration?: Date }
  Response: User

GET /admin/trips
  Description: List all trips
  Auth: Required (admin)
  Query: { page, limit, type, status }
  Response: Trip[]

DELETE /admin/trips/:tripId
  Description: Force delete trip
  Auth: Required (admin)
  Response: { success: true }

GET /admin/system/health
  Description: System health check
  Auth: Required (admin)
  Response: {
    database: "ok" | "error",
    redis: "ok" | "error",
    storage: "ok" | "error"
  }
```

### 3.2 API Gaps (To Be Added)

```yaml
# -----------------------------------------------------
# PHASE 2: MISSING APIs
# -----------------------------------------------------

# Trip Publishing Workflow
POST /trips/:id/publish
  Description: Publish trip as guide
  Auth: Required (owner)
  Body: {
    visibility: "public" | "unlisted"
  }

POST /trips/:id/unpublish
  Description: Revert guide to draft
  Auth: Required (owner)

# Export
GET /trips/:id/export/pdf
  Description: Export trip as PDF
  Auth: Required (member)
  Response: PDF binary

GET /trips/:id/export/google-maps
  Description: Export to Google Maps link
  Auth: Required (member)
  Response: { url: string }

# AI Suggestions (Phase 3)
POST /ai/suggest-places
  Description: Get AI place suggestions
  Auth: Required
  Body: { destination: string, interests: string[] }
  Response: Place[]

POST /ai/generate-itinerary
  Description: Generate itinerary with AI
  Auth: Required
  Body: {
    destination: string,
    days: number,
    interests: string[],
    budget?: number
  }
  Response: ItineraryDay[]

# Reactions (if needed)
POST /trips/:id/react
  Description: Add reaction
  Auth: Required
  Body: { type: "like" | "love" | "helpful" }

DELETE /trips/:id/react
  Description: Remove reaction
  Auth: Required
```

---

## 4. Component Structure

### 4.1 Backend Structure (Current)

```
backend-go/
├── cmd/
│   ├── api/
│   │   └── main.go                 # Entry point
│   └── cleanup/
│       └── main.go                 # Maintenance scripts
│
├── internal/
│   ├── config/
│   │   └── config.go               # Environment config
│   │
│   ├── handlers/                   # HTTP Handlers (Controllers)
│   │   ├── trip_handler.go         # Trip CRUD
│   │   ├── itinerary_handler.go    # Itinerary management
│   │   ├── expense_handler.go      # Expense tracking
│   │   ├── user_handler.go         # User profile
│   │   ├── comment_handler.go      # Comments
│   │   ├── place_handler.go        # Google Places proxy
│   │   ├── file_handler.go         # File upload
│   │   ├── notification_handler.go # Notifications
│   │   ├── unsplash_handler.go     # Unsplash API
│   │   ├── sse_handler.go          # SSE endpoint
│   │   ├── admin_handler.go        # Admin dashboard
│   │   ├── admin_user_handler.go   # User management
│   │   └── admin_trip_handler.go   # Trip management
│   │
│   ├── services/                   # Business Logic
│   │   ├── trip_service.go
│   │   ├── itinerary_service.go
│   │   ├── expense_service.go
│   │   ├── user_service.go
│   │   ├── comment_service.go
│   │   ├── place_service.go
│   │   ├── google_places_service.go
│   │   ├── file_service.go
│   │   ├── storage_service.go      # R2 operations
│   │   ├── notification_service.go
│   │   ├── unsplash_service.go
│   │   ├── redis_service.go
│   │   ├── admin_service.go
│   │   └── in_memory_city_service.go
│   │
│   ├── repository/                 # Data Access Layer
│   │   ├── trip_repository.go
│   │   ├── itinerary_repository.go
│   │   ├── expense_repository.go
│   │   ├── user_repository.go
│   │   ├── comment_repository.go
│   │   ├── notification_repository.go
│   │   ├── place_repository.go
│   │   ├── file_repository.go
│   │   └── interaction_repository.go
│   │
│   ├── models/                     # MongoDB Models
│   │   ├── trip.go
│   │   ├── itinerary.go
│   │   ├── itinerary_entry.go
│   │   ├── expense.go
│   │   ├── user.go
│   │   ├── comment.go
│   │   ├── notification.go
│   │   ├── place.go
│   │   ├── file.go
│   │   └── interaction.go
│   │
│   ├── schemas/                    # Request/Response DTOs
│   │   ├── trip_schema.go
│   │   ├── itinerary_schema.go
│   │   ├── expense_schema.go
│   │   ├── user_schema.go
│   │   └── ...
│   │
│   └── middleware/
│       ├── auth.go                 # JWT validation
│       ├── cors.go                 # CORS headers
│       ├── otel.go                 # OpenTelemetry
│       └── admin.go                # Admin role check
│
├── pkg/                            # Shared Packages
│   ├── clerk/                      # Clerk client
│   │   └── clerk.go
│   ├── googleplaces/               # Google Places client
│   │   └── client.go
│   ├── mongodb/                    # MongoDB connection
│   │   └── mongodb.go
│   ├── redis/                      # Redis client
│   │   └── redis.go
│   ├── r2/                         # Cloudflare R2 client
│   │   └── r2.go
│   ├── sse/                        # SSE Hub
│   │   └── hub.go
│   ├── unsplash/                   # Unsplash client
│   │   └── client.go
│   ├── otel/                       # OpenTelemetry setup
│   │   └── otel.go
│   └── utils/
│       ├── logger.go               # Logging utilities
│       └── context.go              # Context helpers
│
├── scripts/
│   └── seed.go                     # Database seeding
│
├── Dockerfile
├── docker-compose.yml
├── go.mod
├── go.sum
└── .env.example
```

### 4.2 Frontend Structure (Current)

```
frontend-nextjs/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── [locale]/               # i18n dynamic route
│   │   │   ├── layout.tsx          # Root layout
│   │   │   ├── page.tsx            # Home (Guide Feed / Hero)
│   │   │   │
│   │   │   ├── trips/              # Trip Management
│   │   │   │   ├── page.tsx        # My Trips list
│   │   │   │   └── [tripId]/
│   │   │   │       ├── page.tsx    # Trip detail/edit
│   │   │   │       ├── expenses/
│   │   │   │       │   └── page.tsx
│   │   │   │       └── members/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── guides/             # Guide Discovery
│   │   │   │   ├── page.tsx        # Browse guides
│   │   │   │   ├── search/
│   │   │   │   │   └── page.tsx    # Search results
│   │   │   │   └── [guideId]/
│   │   │   │       └── page.tsx    # Guide detail
│   │   │   │
│   │   │   ├── profiles/           # User Profiles
│   │   │   │   └── [userId]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── admin/              # Admin Dashboard
│   │   │   │   ├── page.tsx        # Overview
│   │   │   │   ├── users/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── trips/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── sign-in/[[...sign-in]]/
│   │   │   │   └── page.tsx        # Clerk sign in
│   │   │   ├── sign-up/[[...sign-up]]/
│   │   │   │   └── page.tsx        # Clerk sign up
│   │   │   │
│   │   │   ├── about/
│   │   │   │   └── page.tsx
│   │   │   ├── privacy/
│   │   │   │   └── page.tsx
│   │   │   ├── terms/
│   │   │   │   └── page.tsx
│   │   │   └── how-it-works/
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/                    # API Routes
│   │   │   └── health/
│   │   │       └── route.ts
│   │   │
│   │   ├── globals.css
│   │   └── not-found.tsx
│   │
│   ├── components/                 # React Components
│   │   ├── common/                 # Shared components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── EmptyState.tsx
│   │   │
│   │   ├── ui/                     # Radix UI wrappers (shadcn)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── card.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── ...
│   │   │
│   │   ├── home/                   # Landing Page
│   │   │   ├── HeroSection.tsx
│   │   │   ├── FeatureSection.tsx
│   │   │   ├── TestimonialSection.tsx
│   │   │   └── CTASection.tsx
│   │   │
│   │   ├── trip/                   # Trip Components
│   │   │   ├── TripCard.tsx
│   │   │   ├── TripList.tsx
│   │   │   ├── TripDetail.tsx
│   │   │   ├── TripHeader.tsx
│   │   │   ├── CreateTripModal.tsx
│   │   │   ├── EditTripForm.tsx
│   │   │   ├── TripSettings.tsx
│   │   │   ├── MemberList.tsx
│   │   │   ├── InviteMemberModal.tsx
│   │   │   └── TripStatusBadge.tsx
│   │   │
│   │   ├── itinerary/              # Itinerary Components
│   │   │   ├── ItineraryView.tsx
│   │   │   ├── DayCard.tsx
│   │   │   ├── DayList.tsx
│   │   │   ├── EntryCard.tsx
│   │   │   ├── EntryList.tsx
│   │   │   ├── AddEntryModal.tsx
│   │   │   ├── PlaceEntry.tsx
│   │   │   ├── NoteEntry.tsx
│   │   │   ├── TodoEntry.tsx
│   │   │   ├── TimeSlot.tsx
│   │   │   └── DraggableEntry.tsx
│   │   │
│   │   ├── expense/                # Expense Components
│   │   │   ├── ExpenseList.tsx
│   │   │   ├── ExpenseCard.tsx
│   │   │   ├── AddExpenseModal.tsx
│   │   │   ├── ExpenseSummary.tsx
│   │   │   ├── SplitCalculator.tsx
│   │   │   ├── BalanceView.tsx
│   │   │   └── CategoryBadge.tsx
│   │   │
│   │   ├── guide/                  # Guide Components
│   │   │   ├── GuideFeed.tsx
│   │   │   ├── GuideCard.tsx
│   │   │   ├── GuideDetail.tsx
│   │   │   ├── GuideFilters.tsx
│   │   │   ├── DestinationPicker.tsx
│   │   │   ├── InterestTags.tsx
│   │   │   ├── CopyToTripButton.tsx
│   │   │   └── BookmarkButton.tsx
│   │   │
│   │   ├── map/                    # Map Components
│   │   │   ├── TripMap.tsx
│   │   │   ├── PlaceMarker.tsx
│   │   │   ├── RouteView.tsx
│   │   │   └── MapControls.tsx
│   │   │
│   │   ├── place/                  # Place Components
│   │   │   ├── PlaceSearch.tsx
│   │   │   ├── PlaceCard.tsx
│   │   │   ├── PlaceDetail.tsx
│   │   │   ├── PlacePhotos.tsx
│   │   │   └── PlaceReviews.tsx
│   │   │
│   │   ├── comment/                # Comment Components
│   │   │   ├── CommentList.tsx
│   │   │   ├── CommentCard.tsx
│   │   │   ├── CommentForm.tsx
│   │   │   └── ReplyThread.tsx
│   │   │
│   │   ├── notification/           # Notification Components
│   │   │   ├── NotificationBell.tsx
│   │   │   ├── NotificationList.tsx
│   │   │   └── NotificationItem.tsx
│   │   │
│   │   ├── profile/                # Profile Components
│   │   │   ├── ProfileHeader.tsx
│   │   │   ├── ProfileStats.tsx
│   │   │   ├── ProfileSettings.tsx
│   │   │   └── EditProfileModal.tsx
│   │   │
│   │   ├── auth/                   # Auth Components
│   │   │   ├── SignInForm.tsx
│   │   │   ├── SignUpForm.tsx
│   │   │   ├── AuthGuard.tsx
│   │   │   └── UserButton.tsx
│   │   │
│   │   ├── admin/                  # Admin Components
│   │   │   ├── StatsCard.tsx
│   │   │   ├── UserTable.tsx
│   │   │   ├── TripTable.tsx
│   │   │   └── SystemHealth.tsx
│   │   │
│   │   └── upload/                 # Upload Components
│   │       ├── FileUpload.tsx
│   │       ├── ImagePicker.tsx
│   │       ├── UnsplashPicker.tsx
│   │       └── CoverPhotoSelector.tsx
│   │
│   ├── services/                   # API Service Classes
│   │   ├── api-client.ts           # Axios instance
│   │   ├── trip.service.ts
│   │   ├── itinerary.service.ts
│   │   ├── expense.service.ts
│   │   ├── guide.service.ts
│   │   ├── place.service.ts
│   │   ├── user.service.ts
│   │   ├── comment.service.ts
│   │   ├── file.service.ts
│   │   ├── notification.service.ts
│   │   └── unsplash.service.ts
│   │
│   ├── hooks/                      # Custom Hooks
│   │   ├── useAuth.ts
│   │   ├── useTripQueries.ts
│   │   ├── useItineraryQueries.ts
│   │   ├── useExpenseQueries.ts
│   │   ├── useGuideQueries.ts
│   │   ├── usePlaceQueries.ts
│   │   ├── useUserQueries.ts
│   │   ├── useFileQueries.ts
│   │   ├── useNotifications.ts
│   │   ├── useSSENotification.ts
│   │   ├── useWindowSize.ts
│   │   └── useDebounce.ts
│   │
│   ├── contexts/                   # React Contexts
│   │   ├── NotificationContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── providers/                  # Provider Setup
│   │   ├── Providers.tsx           # Combined providers
│   │   ├── QueryProvider.tsx       # TanStack Query
│   │   ├── ThemeProvider.tsx
│   │   └── ClerkProvider.tsx
│   │
│   ├── interfaces/                 # TypeScript Types
│   │   ├── trip.interface.ts
│   │   ├── itinerary.interface.ts
│   │   ├── expense.interface.ts
│   │   ├── user.interface.ts
│   │   ├── place.interface.ts
│   │   ├── comment.interface.ts
│   │   ├── notification.interface.ts
│   │   └── api.interface.ts
│   │
│   ├── lib/                        # Utilities
│   │   ├── utils.ts                # General utilities
│   │   ├── cn.ts                   # Tailwind class merge
│   │   ├── date.ts                 # Date formatting
│   │   ├── currency.ts             # Currency formatting
│   │   └── validation.ts           # Zod schemas
│   │
│   ├── i18n/                       # Internationalization
│   │   ├── config.ts
│   │   ├── request.ts
│   │   └── messages/
│   │       ├── en.json
│   │       └── th.json
│   │
│   └── themes/                     # Theme Configuration
│       └── index.ts
│
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

---

## 5. Third-Party Integrations

### 5.1 Current Integrations

| Service | Purpose | Status | Config |
|---------|---------|--------|--------|
| **Clerk** | Authentication & User Management | ✅ Active | `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| **MongoDB Atlas** | Primary Database | ✅ Active | `MONGODB_URI` |
| **Redis (Upstash)** | Caching, Rate Limiting | ✅ Active | `REDIS_URL` |
| **Cloudflare R2** | File Storage | ✅ Active | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` |
| **Google Places API** | Location Search & Details | ✅ Active | `GOOGLE_PLACES_API_KEY` |
| **Google Maps JS** | Frontend Maps | ✅ Active | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| **Unsplash API** | Stock Photos | ✅ Active | `UNSPLASH_ACCESS_KEY` |
| **OpenTelemetry** | Distributed Tracing | ✅ Active | `OTEL_EXPORTER_ZIPKIN_ENDPOINT` |
| **Zipkin** | Trace Visualization | ✅ Active | Docker container |

### 5.2 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        THIRD-PARTY INTEGRATIONS                              │
└─────────────────────────────────────────────────────────────────────────────┘

Frontend                          Backend                         External
─────────                         ───────                         ────────

┌─────────────┐
│   Clerk     │◀────────────────────────────────────────────────▶ Clerk API
│   Provider  │     (Auth tokens, user sync)
└─────────────┘

┌─────────────┐                  ┌─────────────┐
│   Google    │                  │   Google    │
│   Maps JS   │                  │   Places    │◀───────────────▶ Google API
│             │                  │   Service   │     (Search, Details)
└─────────────┘                  └─────────────┘
                                        │
                                        ▼
                                 ┌─────────────┐
                                 │   Redis     │◀───────────────▶ Upstash
                                 │   Cache     │     (Photo cache)
                                 └─────────────┘

                                 ┌─────────────┐
                                 │   Unsplash  │◀───────────────▶ Unsplash API
                                 │   Service   │     (Photo search)
                                 └─────────────┘

                                 ┌─────────────┐
                                 │   Storage   │◀───────────────▶ Cloudflare R2
                                 │   Service   │     (File upload/download)
                                 └─────────────┘

                                 ┌─────────────┐
                                 │   MongoDB   │◀───────────────▶ MongoDB Atlas
                                 │   Client    │     (Data persistence)
                                 └─────────────┘

                                 ┌─────────────┐
                                 │   OTEL      │◀───────────────▶ Zipkin
                                 │   Exporter  │     (Trace collection)
                                 └─────────────┘
```

### 5.3 Phase 2 Integrations (Planned)

| Service | Purpose | Priority | Notes |
|---------|---------|----------|-------|
| **Firebase Cloud Messaging** | Push Notifications | P1 | Mobile & Web push |
| **Agoda Affiliate** | Hotel Booking Links | P2 | Revenue stream |
| **Klook Affiliate** | Activity Booking | P2 | Revenue stream |
| **OpenAI / Claude** | AI Suggestions | P3 | Trip generation |
| **Stripe** | Payment (Subscription) | P3 | Pro tier |
| **Google Analytics** | Web Analytics | P1 | Already partial |
| **Sentry** | Error Tracking | P1 | Production monitoring |

---

## 6. Security & Scalability

### 6.1 Current Security Measures

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY LAYERS                                    │
└─────────────────────────────────────────────────────────────────────────────┘

Layer 1: Network
├── CORS middleware (whitelist origins)
├── HTTPS only (production)
└── Rate limiting (Redis-based) [Partial]

Layer 2: Authentication
├── Clerk JWT validation
├── Token expiry checking
└── Secure token storage (httpOnly cookies via Clerk)

Layer 3: Authorization
├── Role-based access (owner/admin/editor/viewer)
├── Resource ownership checks
├── Admin-only middleware
└── Trip membership validation

Layer 4: Data
├── Input validation (Zod + Gin binding)
├── XSS prevention (React auto-escape)
├── SQL/NoSQL injection prevention (parameterized queries)
├── Soft deletes (data preservation)
└── Sensitive data exclusion from responses

Layer 5: Infrastructure
├── Environment variables for secrets
├── No secrets in code
├── Secure R2 signed URLs
└── MongoDB Atlas network isolation
```

### 6.2 Security Checklist

| Category | Item | Status |
|----------|------|--------|
| **Auth** | JWT validation | ✅ |
| | Token refresh | ✅ (Clerk handles) |
| | Password hashing | ✅ (Clerk handles) |
| | Session management | ✅ |
| **API** | CORS configuration | ✅ |
| | Rate limiting | ⚠️ Partial |
| | Input validation | ✅ |
| | Output sanitization | ✅ |
| **Data** | Encryption at rest | ✅ (Atlas/R2) |
| | Encryption in transit | ✅ (HTTPS) |
| | PII handling | ⚠️ Review needed |
| | Backup strategy | ✅ (Atlas) |
| **Infrastructure** | Secret management | ✅ (env vars) |
| | Dependency scanning | ❌ Not configured |
| | Security headers | ⚠️ Partial |
| | Error handling | ✅ (no stack traces) |

### 6.3 Scalability Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SCALABILITY DESIGN                                    │
└─────────────────────────────────────────────────────────────────────────────┘

Current (Single Instance)
─────────────────────────

                    ┌─────────────┐
                    │   Vercel    │
                    │  (Frontend) │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Cloud Run  │
                    │  (Backend)  │
                    │  1 Instance │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │ MongoDB │  │  Redis  │  │   R2    │
        │  Atlas  │  │ Upstash │  │ Storage │
        └─────────┘  └─────────┘  └─────────┘


Scaled (Multi-Instance)
───────────────────────

                    ┌─────────────┐
                    │   Vercel    │
                    │  (Edge CDN) │
                    └──────┬──────┘
                           │
                    ┌──────┴──────┐
                    │   Load      │
                    │  Balancer   │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │ Backend  │    │ Backend  │    │ Backend  │
     │ Pod 1    │    │ Pod 2    │    │ Pod 3    │
     └────┬─────┘    └────┬─────┘    └────┬─────┘
          │               │               │
          └───────────────┼───────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌─────────┐ ┌─────────┐ ┌─────────┐
        │ MongoDB │ │  Redis  │ │   R2    │
        │ Cluster │ │ Cluster │ │   CDN   │
        │(Replica)│ │         │ │         │
        └─────────┘ └─────────┘ └─────────┘
```

### 6.4 Scalability Considerations

| Concern | Current Solution | Scale Solution |
|---------|------------------|----------------|
| **Database** | MongoDB Atlas M0 (Free) | Atlas M10+ with sharding |
| **Caching** | Upstash Free tier | Upstash Pro / Redis Cluster |
| **File Storage** | R2 (unlimited) | R2 + CDN (Cloudflare) |
| **API** | Single Cloud Run instance | Cloud Run auto-scaling |
| **SSE Connections** | In-memory Hub | Redis Pub/Sub for distributed |
| **Search** | MongoDB text search | Elasticsearch / Algolia |
| **Background Jobs** | None | Cloud Tasks / Bull Queue |

### 6.5 Performance Optimizations (Current)

| Area | Optimization | Status |
|------|--------------|--------|
| **Database** | Indexes on foreign keys | ✅ |
| | Projection (select fields) | ⚠️ Partial |
| | Connection pooling | ✅ (MGM) |
| **Caching** | Google Places photo cache | ✅ (30 day TTL) |
| | Place details cache | ✅ |
| | Query result caching | ❌ (TanStack Query client-side only) |
| **Frontend** | React Query caching | ✅ |
| | Image lazy loading | ✅ |
| | Code splitting | ✅ (Next.js dynamic) |
| | SSR/ISR | ⚠️ Partial |
| **API** | Response compression | ⚠️ Check Gin config |
| | Pagination | ✅ |
| | Batch requests | ❌ Not implemented |

---

## 7. Gap Analysis: Spec vs Implementation

### 7.1 Feature Gaps

| Spec Feature | Implementation Status | Priority | Notes |
|--------------|----------------------|----------|-------|
| **Trip Management** | ✅ Complete | - | |
| **Itinerary Planning** | ✅ Complete | - | |
| **Guide Discovery** | ✅ Complete | - | |
| **Collaboration** | ✅ Complete | - | |
| **Expense Tracking** | ✅ Complete | - | |
| **Guide → Trip Copy** | ⚠️ Verify flow | P0 | Test UX flow |
| **Mobile Responsive** | ⚠️ Verify | P0 | Test all pages |
| **Offline Mode** | ❌ Not started | P2 | Service Worker |
| **PDF Export** | ❌ Not started | P2 | |
| **Push Notifications** | ❌ Not started | P2 | FCM integration |
| **AI Suggestions** | ❌ Not started | P3 | |
| **Booking Integration** | ⚠️ UI only | P3 | Affiliate links |
| **Pro Subscription** | ❌ Not started | P3 | Stripe |

### 7.2 Technical Debt

| Item | Impact | Effort | Priority |
|------|--------|--------|----------|
| Add unit tests | High | High | P1 |
| Add E2E tests | High | Medium | P1 |
| API documentation (OpenAPI) | Medium | Low | P2 |
| Error boundary improvements | Medium | Low | P1 |
| Rate limiting completion | High | Low | P1 |
| Database index optimization | Medium | Low | P2 |
| Dependency updates | Low | Low | P3 |
| Code cleanup / dead code | Low | Medium | P3 |

### 7.3 Recommended Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEVELOPMENT ROADMAP                                │
└─────────────────────────────────────────────────────────────────────────────┘

Phase 1: MVP Polish (Week 1-2)
──────────────────────────────
 ✓ Verify Guide → Trip copy flow
 ✓ Mobile responsiveness audit
 ✓ Error handling review
 ✓ Rate limiting implementation
 ✓ Basic analytics (GA4)
 → Soft Launch / Beta Test

Phase 2: Stability (Week 3-4)
─────────────────────────────
 □ Unit tests (critical paths)
 □ E2E tests (happy paths)
 □ Error monitoring (Sentry)
 □ Performance profiling
 □ SEO optimization for Guides
 → Public Launch

Phase 3: Growth Features (Week 5-8)
───────────────────────────────────
 □ Social sharing improvements
 □ Push notifications
 □ Offline mode (PWA)
 □ PDF export
 □ Affiliate integration (Agoda, Klook)
 → Monetization Start

Phase 4: Advanced (Week 9-12)
─────────────────────────────
 □ AI trip suggestions
 □ Pro subscription tier
 □ Advanced analytics
 □ Content moderation
 → Scale
```

---

## 8. Development Guidelines

### 8.1 Code Standards

**Backend (Go)**
```go
// File naming: snake_case
// trip_handler.go, expense_service.go

// Package structure
package handlers // or services, models, etc.

// Error handling: Always wrap with context
if err != nil {
    return fmt.Errorf("failed to create trip: %w", err)
}

// Logging: Use TraceLogger
logger.Info(ctx, "Trip created", "tripId", trip.ID)

// Validation: Validate at handler level
if err := c.ShouldBindJSON(&req); err != nil {
    c.JSON(400, gin.H{"error": err.Error()})
    return
}
```

**Frontend (TypeScript/React)**
```typescript
// File naming: PascalCase for components, camelCase for utilities
// TripCard.tsx, useTripQueries.ts

// Component structure
export function TripCard({ trip }: TripCardProps) {
  // 1. Hooks
  const { t } = useTranslations();
  const { mutate } = useDeleteTrip();

  // 2. Derived state
  const isOwner = trip.ownerId === userId;

  // 3. Handlers
  const handleDelete = () => { ... };

  // 4. Render
  return <Card>...</Card>;
}

// Type everything
interface TripCardProps {
  trip: Trip;
  onSelect?: (trip: Trip) => void;
}
```

### 8.2 Git Workflow

```bash
# Branch naming
feature/add-pdf-export
fix/expense-split-calculation
refactor/trip-service
docs/api-documentation

# Commit messages
feat: add PDF export for trips
fix: correct expense split calculation for percentages
refactor: simplify trip service methods
docs: add OpenAPI specification

# PR process
1. Create branch from main
2. Implement + test locally
3. Push + create PR
4. Code review
5. Squash merge to main
```

### 8.3 Environment Setup

```bash
# Backend
cd backend-go
cp .env.example .env
# Fill in environment variables
go mod download
go run cmd/api/main.go

# Frontend
cd frontend-nextjs
cp .env.example .env.local
# Fill in environment variables
npm install
npm run dev

# Docker (full stack)
docker-compose up -d
```

---

## 9. Appendix

### A. Environment Variables

**Backend (.env)**
```bash
# Server
PORT=5001
GIN_MODE=debug

# Database
MONGODB_URI=mongodb+srv://...
MONGODB_DATABASE=painaina

# Redis
REDIS_URL=rediss://...

# Auth
CLERK_SECRET_KEY=sk_live_...

# Storage
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=painaina-uploads
R2_PUBLIC_URL=https://...

# External APIs
GOOGLE_PLACES_API_KEY=...
UNSPLASH_ACCESS_KEY=...

# Observability
OTEL_SERVICE_NAME=painaina-api
OTEL_EXPORTER_ZIPKIN_ENDPOINT=http://localhost:9411/api/v2/spans

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://painaina.com
```

**Frontend (.env.local)**
```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1

# Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...

# Analytics
NEXT_PUBLIC_GA_ID=G-...
```

### B. Useful Commands

```bash
# Backend
go run cmd/api/main.go          # Run server
go test ./...                   # Run tests
go build -o bin/api cmd/api/main.go  # Build binary

# Frontend
npm run dev                     # Development server
npm run build                   # Production build
npm run lint                    # Lint check
npm run type-check              # TypeScript check

# Docker
docker-compose up -d            # Start all services
docker-compose logs -f api      # View API logs
docker-compose down             # Stop all services

# Database
mongosh "mongodb+srv://..."     # Connect to MongoDB
```

### C. Key File Locations

| Purpose | Backend | Frontend |
|---------|---------|----------|
| Entry point | `cmd/api/main.go` | `src/app/[locale]/page.tsx` |
| Routes | `cmd/api/main.go` (router setup) | `src/app/[locale]/*/page.tsx` |
| Models | `internal/models/*.go` | `src/interfaces/*.ts` |
| API clients | - | `src/services/*.ts` |
| Components | - | `src/components/**/*.tsx` |
| Hooks | - | `src/hooks/*.ts` |
| Config | `internal/config/config.go` | `next.config.ts` |
| Middleware | `internal/middleware/*.go` | `src/middleware.ts` |
| i18n | - | `src/i18n/messages/*.json` |

---

*Document prepared for Development Team*
*Last updated: 2025-12-13*
