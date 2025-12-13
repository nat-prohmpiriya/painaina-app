# PaiNaiNa - Product Specification Document

> **Version:** 1.0
> **Last Updated:** 2025-12-13
> **Status:** Draft

---

## Executive Summary

**PaiNaiNa (ไปไหนนะ)** คือแพลตฟอร์มที่รวม Travel Discovery และ Trip Planning ไว้ในที่เดียว ช่วยแก้ปัญหา "ไม่รู้จะไปไหน" และ "วางแผนทริปยุ่งยาก" สำหรับนักท่องเที่ยวชาวไทย

**Positioning Statement:**
> "จากแรงบันดาลใจ สู่ทริปจริง" - แอพเดียวที่รวม Discovery + Planning + Group Expense ออกแบบสำหรับคนไทย โดยคนไทย

---

## 1. User Personas

### Persona 1: "นุ่น" - The Social Trip Planner
| Attribute | Detail |
|-----------|--------|
| **อายุ** | 25-32 ปี |
| **อาชีพ** | พนักงานออฟฟิศ, Startup |
| **รายได้** | 25,000-50,000 บาท/เดือน |
| **พฤติกรรม** | ไปเที่ยวกับเพื่อน 3-4 ครั้ง/ปี, ชอบวางแผนเอง |
| **Pain Points** | - AA ค่าใช้จ่ายยุ่งยาก ต้องจดใน Notes <br>- ส่ง Itinerary ใน Group Line แล้วหาย <br>- เพื่อนขอแก้แผนแต่ยุ่งมาก |
| **Goals** | - วางแผนง่าย แชร์ให้เพื่อนดูได้ <br>- แบ่งค่าใช้จ่ายชัดเจน <br>- ทุกคนเห็นแผนเหมือนกัน |
| **Tech Savvy** | สูง - ใช้ Google Maps, Grab, Agoda เป็นประจำ |
| **Quote** | "ทุกทริปต้องมีคนถาม 'แล้วไปไหนต่อ?' ทั้งที่ส่งแผนไปแล้ว 10 รอบ" |

### Persona 2: "บอส" - The Inspiration Seeker
| Attribute | Detail |
|-----------|--------|
| **อายุ** | 22-28 ปี |
| **อาชีพ** | นักศึกษา, พนักงานใหม่ |
| **รายได้** | 15,000-30,000 บาท/เดือน |
| **พฤติกรรม** | ชอบ scroll IG/TikTok หาที่เที่ยว, ไปเที่ยวเมื่อมีโปร |
| **Pain Points** | - ไม่รู้จะไปไหนดี <br>- เห็นใน IG สวยแต่ไม่รู้ที่ไหน <br>- ไม่รู้จะเริ่มวางแผนยังไง |
| **Goals** | - หาแรงบันดาลใจ <br>- Copy แผนคนอื่นมาใช้ <br>- ไม่ต้องคิดเอง |
| **Tech Savvy** | สูงมาก - Digital Native |
| **Quote** | "อยากไปเที่ยวแต่ไม่รู้จะไปไหน ขี้เกียจ research" |

### Persona 3: "พี่ต้อม" - The Family Organizer
| Attribute | Detail |
|-----------|--------|
| **อายุ** | 35-45 ปี |
| **อาชีพ** | ผู้จัดการ, เจ้าของธุรกิจ |
| **รายได้** | 60,000+ บาท/เดือน |
| **พฤติกรรม** | พาครอบครัวเที่ยว 2-3 ครั้ง/ปี, วางแผนละเอียด |
| **Pain Points** | - ต้องดูแลหลายคน งบต้องชัด <br>- ต้องจองล่วงหน้า กลัวพลาด <br>- ภรรยา/ลูกอยากรู้แผน |
| **Goals** | - แผนชัดเจน มีเวลา/สถานที่ครบ <br>- คุมงบได้ <br>- ครอบครัวเห็นแผนพร้อมกัน |
| **Tech Savvy** | ปานกลาง - ใช้แอพพื้นฐานได้ |
| **Quote** | "ต้องวางแผนให้ดี ไม่งั้นเด็กๆ งอแง" |

### Persona Priority Matrix

```
                    High Value
                        │
    Persona 1 ●─────────┼─────────● Persona 3
    (Social Planner)    │         (Family)
                        │
        ────────────────┼────────────────
                        │        High Volume
                        │
                        │
              Persona 2 ●
              (Inspiration Seeker)
                        │
                    Low Value
```

**Primary Focus:** Persona 1 (Social Trip Planner) - มี engagement สูง, viral potential
**Secondary Focus:** Persona 2 (Inspiration Seeker) - volume สูง, funnel เข้า Persona 1

---

## 2. User Journeys

### Journey 1: Discovery to Trip (Persona 2 → Persona 1)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  "บอส" อยากไปเที่ยวแต่ไม่รู้จะไปไหน                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 1: DISCOVER                                                       │
│  ─────────────────                                                      │
│  • เปิด PaiNaiNa เห็น Guide Feed                                        │
│  • Filter: "เที่ยวใกล้กรุงเทพ" + "อาหาร" + "งบ 3,000"                      │
│  • Scroll ดู Guides ที่น่าสนใจ                                           │
│  • เจอ "เขาใหญ่ 2 วัน 1 คืน - Cafe Hopping" ดูน่าสนใจ                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 2: EXPLORE GUIDE                                                  │
│  ────────────────────                                                   │
│  • เข้าดู Guide Detail                                                  │
│  • เห็น Itinerary รายวัน + รูป + Map                                    │
│  • ดู estimated budget, ระยะเวลา                                        │
│  • อ่าน reviews/comments                                                │
│  • กด Bookmark เก็บไว้                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 3: COPY TO TRIP                                                   │
│  ───────────────────                                                    │
│  • กดปุ่ม "ใช้แผนนี้" / "Copy to My Trip"                                │
│  • ระบบสร้าง Trip ใหม่จาก Guide                                         │
│  • เลือกวันที่จริง                                                       │
│  • Trip พร้อมใช้งาน + แก้ไขได้                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 4: CUSTOMIZE & INVITE                                             │
│  ──────────────────────────                                             │
│  • แก้ไข/เพิ่ม/ลบ places ตามต้องการ                                      │
│  • เชิญเพื่อนเข้า Trip (share link)                                      │
│  • เพื่อนเห็นแผน + แก้ไขได้                                              │
│  • เพิ่ม expense tracking                                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 5: TRIP COMPLETED                                                 │
│  ─────────────────────                                                  │
│  • ไปเที่ยวจริง ใช้แอพดูแผน                                              │
│  • บันทึกค่าใช้จ่ายระหว่างทาง                                            │
│  • จบทริป → ดู expense summary                                         │
│  • (Optional) Publish เป็น Guide ใหม่                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Journey 2: Group Trip Planning (Persona 1)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  "นุ่น" วางแผนทริปกับเพื่อน 5 คน ไปภูเก็ต                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 1: CREATE TRIP                                                    │
│  ──────────────────                                                     │
│  • กด "สร้าง Trip ใหม่"                                                  │
│  • ใส่ชื่อ: "ภูเก็ต New Year 2025"                                       │
│  • เลือกวันที่: 30 Dec - 2 Jan                                          │
│  • ใส่ budget estimate: 10,000 บาท/คน                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 2: INVITE MEMBERS                                                 │
│  ────────────────────                                                   │
│  • กด "เชิญเพื่อน"                                                       │
│  • Share link ผ่าน Line                                                 │
│  • เพื่อนกด link → เข้าร่วม Trip                                         │
│  • กำหนด role: Editor / Viewer                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 3: COLLABORATIVE PLANNING                                         │
│  ─────────────────────────────                                          │
│  • ทุกคนเห็น Itinerary เดียวกัน                                          │
│  • เพื่อนเพิ่ม Place: "หาดกะตะ"                                          │
│  • นุ่นเห็น notification + เห็นการเปลี่ยนแปลง                             │
│  • Drag & drop จัดลำดับ                                                  │
│  • ใส่เวลา + duration                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 4: DURING TRIP - EXPENSE TRACKING                                 │
│  ─────────────────────────────────────                                  │
│  Day 1:                                                                 │
│  • นุ่นจ่ายค่าเช่ารถ 3,000 → บันทึก + split 5 คน                         │
│  • เพื่อนจ่ายค่าอาหารเย็น 2,500 → บันทึก + split 5 คน                    │
│  Day 2:                                                                 │
│  • จ่ายค่าเรือ 5,000 → split 5 คน                                       │
│  • ดู running total: ใครจ่ายไปเท่าไหร่                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 5: POST-TRIP SETTLEMENT                                           │
│  ───────────────────────────                                            │
│  • ดู Expense Summary:                                                  │
│    - Total: 45,000 บาท                                                  │
│    - Per person: 9,000 บาท                                              │
│  • ดู Balance:                                                          │
│    - นุ่น paid 15,000 → owed 6,000                                      │
│    - เพื่อน A paid 5,000 → owes 4,000                                   │
│  • Mark settled เมื่อโอนเงินกันแล้ว                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Journey 3: Content Creator (Advanced User)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  "ก้อย" Travel Blogger อยากสร้าง Guide                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 1: CREATE GUIDE                                                   │
│  ───────────────────                                                    │
│  • เลือก "สร้าง Guide" (ไม่ใช่ Trip)                                     │
│  • ใส่ข้อมูล: ชื่อ, description, cover photo                             │
│  • เลือก destination, tags, difficulty level                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 2: BUILD ITINERARY                                                │
│  ──────────────────────                                                 │
│  • เพิ่ม Days                                                           │
│  • เพิ่ม Places จาก Google Places                                       │
│  • เขียน Notes และ Tips                                                 │
│  • ใส่รูปภาพ (upload / Unsplash)                                        │
│  • ใส่ estimated costs                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 3: PUBLISH                                                        │
│  ────────────                                                           │
│  • Preview Guide                                                        │
│  • กด "Publish"                                                         │
│  • Guide ปรากฏใน Discovery feed                                         │
│  • Share link ไป Social Media                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 4: ENGAGEMENT                                                     │
│  ────────────────                                                       │
│  • ดู view count, bookmark count                                        │
│  • อ่าน comments                                                        │
│  • ตอบ comments                                                         │
│  • ดูว่ามีคน copy ไปใช้กี่คน                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Features

### Feature Priority Matrix

```
                    High Impact
                        │
         ┌──────────────┼──────────────┐
         │   MUST HAVE  │   SHOULD DO  │
         │              │              │
         │  • Trip CRUD │  • Offline   │
         │  • Itinerary │  • PDF Export│
         │  • Guide     │  • Push Notif│
         │    Discovery │  • AI Suggest│
         │  • Collab    │              │
         │  • Expense   │              │
─────────┼──────────────┼──────────────┼─────────
  Easy   │              │              │  Hard
         │   NICE TO    │   CONSIDER   │
         │   HAVE       │   LATER      │
         │              │              │
         │  • Comments  │  • Booking   │
         │  • Bookmark  │  • Social    │
         │  • Profile   │    Features  │
         │              │  • Gamification│
         │              │              │
         └──────────────┼──────────────┘
                        │
                    Low Impact
```

### 3.1 Must Have Features (MVP)

#### F1: Trip Management
| Aspect | Detail |
|--------|--------|
| **What** | สร้าง, แก้ไข, ลบ, ดู Trip |
| **Why** | Core value - ผู้ใช้ต้องมี Trip ก่อนจะใช้ฟีเจอร์อื่น |
| **User Outcome** | "ฉันมีที่เก็บแผนทริปของฉัน" |
| **Key Capabilities** | - ตั้งชื่อ, วันที่, destination <br>- Cover photo <br>- Trip status (draft/active/completed) <br>- Quick view all my trips |

#### F2: Itinerary Planning
| Aspect | Detail |
|--------|--------|
| **What** | วางแผนรายวัน + รายกิจกรรม |
| **Why** | Core value - นี่คือสิ่งที่ทำให้ดีกว่าจด Notes |
| **User Outcome** | "ฉันเห็นแผนชัดเจนว่าวันไหนไปไหนบ้าง" |
| **Key Capabilities** | - เพิ่ม/ลบ วัน <br>- เพิ่ม Places (search from Google) <br>- เพิ่ม Notes, Todos <br>- จัดลำดับ (drag & drop) <br>- ใส่เวลา, duration <br>- ดูบน Map |

#### F3: Guide Discovery
| Aspect | Detail |
|--------|--------|
| **What** | ค้นหา + Browse Guides ที่คนอื่นสร้าง |
| **Why** | Acquisition channel - ดึง users ที่ "ไม่รู้จะไปไหน" |
| **User Outcome** | "ฉันหาแรงบันดาลใจทริปได้" |
| **Key Capabilities** | - Browse by destination <br>- Filter by interests/tags <br>- Search by keyword <br>- View Guide detail <br>- Copy Guide to my Trip |

#### F4: Collaboration
| Aspect | Detail |
|--------|--------|
| **What** | เชิญคนอื่นมาดู/แก้ไข Trip ร่วมกัน |
| **Why** | Viral loop + Retention - ทริปส่วนใหญ่ไปกันหลายคน |
| **User Outcome** | "เพื่อนทุกคนเห็นแผนเดียวกัน แก้ไขพร้อมกันได้" |
| **Key Capabilities** | - Share link เชิญ <br>- Role: Owner, Editor, Viewer <br>- Real-time updates (SSE) <br>- Activity notifications |

#### F5: Expense Tracking
| Aspect | Detail |
|--------|--------|
| **What** | บันทึกค่าใช้จ่าย + แบ่งจ่าย |
| **Why** | Retention + Differentiation - Pain point ใหญ่ของ group trip |
| **User Outcome** | "รู้ว่าใครจ่ายอะไรไป ใครต้องโอนให้ใครเท่าไหร่" |
| **Key Capabilities** | - เพิ่ม expense (amount, category, who paid) <br>- Split: equal, percentage, exact <br>- View per-person balance <br>- Mark as settled <br>- Expense summary by category |

### 3.2 Should Have Features (Phase 2)

#### F6: Offline Mode
| Aspect | Detail |
|--------|--------|
| **What** | ใช้งานได้แม้ไม่มี internet |
| **Why** | Travel use case - เน็ตต่างประเทศ/ในป่าไม่ดี |
| **User Outcome** | "ดูแผนได้ตลอด แม้ไม่มีเน็ต" |

#### F7: Export & Share
| Aspect | Detail |
|--------|--------|
| **What** | Export เป็น PDF, Google Maps |
| **Why** | ความสะดวกในการใช้งาน |
| **User Outcome** | "ส่งแผนให้คนที่ไม่ได้ใช้แอพได้" |

#### F8: Push Notifications
| Aspect | Detail |
|--------|--------|
| **What** | แจ้งเตือนเมื่อมีอัพเดทสำคัญ |
| **Why** | Engagement + Re-engagement |
| **User Outcome** | "ไม่พลาดเมื่อเพื่อนแก้แผน" |

### 3.3 Nice to Have Features (Phase 3)

#### F9: AI Trip Suggestions
| Aspect | Detail |
|--------|--------|
| **What** | AI ช่วยแนะนำสถานที่/แผนทริป |
| **Why** | Reduce friction ในการ planning |
| **User Outcome** | "ไม่ต้องคิดเอง AI ช่วยแนะนำ" |

#### F10: Booking Integration
| Aspect | Detail |
|--------|--------|
| **What** | จองโรงแรม/ตั๋ว/activities ในแอพ |
| **Why** | Monetization + Convenience |
| **User Outcome** | "จัดทริปจบในแอพเดียว" |

---

## 4. Success Metrics

### 4.1 North Star Metric

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⭐ NORTH STAR: Trips Completed per Month                               │
│  ─────────────────────────────────────────                              │
│  Definition: จำนวน Trips ที่มี end_date ผ่านไปแล้ว และมี >= 3 entries    │
│  Why: แสดงว่าผู้ใช้ใช้แอพวางแผนแล้วไปเที่ยวจริง                           │
│  Target: 1,000 completed trips/month by Month 6                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Key Metrics by Category

#### Acquisition Metrics
| Metric | Definition | Target (M3) | Target (M6) |
|--------|------------|-------------|-------------|
| MAU | Monthly Active Users | 5,000 | 20,000 |
| New Signups | ผู้ใช้ใหม่/เดือน | 2,000 | 8,000 |
| Guide Views | จำนวนครั้งที่ดู Guide | 10,000 | 50,000 |
| Signup Conversion | % Guide viewers → Signup | 10% | 15% |

#### Activation Metrics
| Metric | Definition | Target |
|--------|------------|--------|
| Trip Created Rate | % new users ที่สร้าง Trip ใน 7 วัน | 40% |
| Time to First Trip | เวลาเฉลี่ยจาก signup ถึงสร้าง Trip | < 10 min |
| Guide → Trip Rate | % Guide views ที่กลายเป็น Trip | 5% |
| Itinerary Completion | % Trips ที่มี >= 3 entries | 60% |

#### Engagement Metrics
| Metric | Definition | Target |
|--------|------------|--------|
| WAU/MAU Ratio | Weekly vs Monthly active | > 30% |
| Avg Trip Members | จำนวนสมาชิกเฉลี่ยต่อ Trip | > 2.5 |
| Expense Entries/Trip | จำนวน expense ที่บันทึกต่อ Trip | > 5 |
| Session Duration | เวลาใช้งานเฉลี่ยต่อ session | > 5 min |

#### Retention Metrics
| Metric | Definition | Target |
|--------|------------|--------|
| D1 Retention | % กลับมาใช้วันถัดไป | > 25% |
| D7 Retention | % กลับมาใช้ใน 7 วัน | > 15% |
| D30 Retention | % กลับมาใช้ใน 30 วัน | > 10% |
| Repeat Trip Rate | % users ที่สร้าง Trip ที่ 2 | > 40% |

#### Revenue Metrics (Phase 2+)
| Metric | Definition | Target |
|--------|------------|--------|
| Conversion to Pro | % MAU ที่ upgrade Pro | 2-5% |
| ARPU | Average Revenue Per User | ฿10/month |
| Affiliate Revenue | รายได้จาก booking referrals | TBD |

### 4.3 Metrics Dashboard Priorities

```
Tier 1 (Daily tracking):
├── Active Users (DAU/WAU/MAU)
├── New Trips Created
├── New Signups
└── Guide Views

Tier 2 (Weekly review):
├── Trip Completion Rate
├── Collaboration Rate (trips with 2+ members)
├── Expense Usage Rate
└── Retention D1/D7

Tier 3 (Monthly review):
├── North Star (Completed Trips)
├── Acquisition funnel
├── Feature adoption rates
└── Revenue metrics
```

---

## 5. Edge Cases & Error Handling

### 5.1 User Input Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| **Trip ไม่มีวันที่** | อนุญาต - บาง trip อาจยังไม่ fix วัน |
| **Trip วันที่ในอดีต** | อนุญาต - อาจบันทึก trip ที่ไปมาแล้ว |
| **Trip ยาวมาก (> 30 วัน)** | อนุญาต แต่แสดง warning |
| **Itinerary entry ไม่มีเวลา** | อนุญาต - optional field |
| **Expense จำนวนติดลบ** | ไม่อนุญาต - validation error |
| **Expense split ไม่ครบ 100%** | แสดง warning ให้แก้ไข |
| **Search ไม่เจอ Place** | แสดง "ไม่พบสถานที่" + suggest ลอง keyword อื่น |
| **ชื่อ Trip ยาวมาก (> 100 char)** | Truncate + แสดง warning |

### 5.2 Collaboration Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| **Owner ออกจาก Trip** | ไม่อนุญาต - ต้อง transfer ownership ก่อน |
| **Edit conflict (2 คนแก้พร้อมกัน)** | Last write wins + แสดง notification "อัพเดทโดย [ชื่อ]" |
| **Invite expired link** | แสดงหน้า "Link หมดอายุ" + ขอ link ใหม่ |
| **Invite link ที่ trip ถูกลบ** | แสดง "Trip นี้ไม่มีแล้ว" |
| **Viewer พยายามแก้ไข** | Disable edit controls + tooltip "คุณเป็น Viewer" |
| **Member ถูกลบออก** | Redirect ไปหน้า "คุณไม่ได้อยู่ใน Trip นี้แล้ว" |
| **Offline + มีการแก้ไข** | Queue changes + sync เมื่อ online + conflict resolution |

### 5.3 Data & State Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| **ลบ Day ที่มี entries** | Confirm dialog "ลบวันนี้จะลบกิจกรรม X รายการด้วย" |
| **ลบ Trip ที่มี expenses** | Confirm dialog + warning about expense data |
| **Guide ถูกลบ หลังจาก copy ไปแล้ว** | Trip ที่ copy ยังอยู่ - เป็น copy ที่ไม่ผูกกัน |
| **Place ใน Google ถูกปิดถาวร** | แสดง badge "สถานที่อาจปิดแล้ว" |
| **Place ข้อมูลเก่า (> 30 days)** | Background refresh + แสดง "อัพเดทล่าสุด: X วันก่อน" |
| **Currency ต่างกันใน expenses** | แสดง warning + ขอให้เลือก base currency |

### 5.4 Error States & Recovery

| Error | User Message | Recovery |
|-------|--------------|----------|
| **Network offline** | "ไม่มีการเชื่อมต่อ - ดูข้อมูลล่าสุดได้ แก้ไขไม่ได้" | Auto-retry เมื่อ online |
| **Server error (5xx)** | "มีปัญหาชั่วคราว กรุณาลองใหม่" | Retry button + auto-retry |
| **Session expired** | "Session หมดอายุ กรุณาเข้าสู่ระบบใหม่" | Redirect to login |
| **Permission denied** | "คุณไม่มีสิทธิ์ดู/แก้ไขรายการนี้" | Redirect to home |
| **Data not found** | "ไม่พบข้อมูลที่ต้องการ" | Back button + home link |
| **Rate limit** | "คุณทำรายการบ่อยเกินไป รอ X วินาที" | Countdown + auto-enable |
| **File upload failed** | "อัพโหลดไม่สำเร็จ ลองใหม่หรือเลือกไฟล์อื่น" | Retry button |
| **Google Places API error** | "ค้นหาสถานที่ไม่ได้ชั่วคราว" | Fallback to cached + retry |

### 5.5 Security Edge Cases

| Scenario | Handling |
|----------|----------|
| **Share link leaked** | Link มี unique token + สามารถ revoke ได้ |
| **Malicious input** | Sanitize all user inputs, XSS prevention |
| **Large file upload** | Limit size (10MB), validate file type |
| **Spam guide creation** | Rate limit + admin review for published guides |
| **Fake expense entries** | Trip owner can delete any expense + audit log |

### 5.6 Mobile-Specific Edge Cases

| Scenario | Handling |
|----------|----------|
| **ปิดแอพขณะ edit** | Auto-save draft ทุก 30 วินาที |
| **Battery low** | ลด sync frequency |
| **Background refresh** | ใช้ background fetch API |
| **Deep link เมื่อ logged out** | Save destination → login → redirect |
| **App update required** | Soft prompt → force update ถ้า breaking change |

---

## 6. Appendix

### A. Feature-Persona Matrix

| Feature | Persona 1 (Social) | Persona 2 (Seeker) | Persona 3 (Family) |
|---------|-------------------|-------------------|-------------------|
| Trip CRUD | ⭐⭐⭐ Essential | ⭐⭐ Important | ⭐⭐⭐ Essential |
| Itinerary | ⭐⭐⭐ Essential | ⭐⭐ Important | ⭐⭐⭐ Essential |
| Guide Discovery | ⭐⭐ Important | ⭐⭐⭐ Essential | ⭐ Nice-to-have |
| Collaboration | ⭐⭐⭐ Essential | ⭐ Nice-to-have | ⭐⭐ Important |
| Expense Split | ⭐⭐⭐ Essential | ⭐ Nice-to-have | ⭐⭐ Important |
| Offline | ⭐⭐ Important | ⭐ Nice-to-have | ⭐⭐⭐ Essential |
| Booking | ⭐ Nice-to-have | ⭐⭐ Important | ⭐⭐ Important |

### B. Competitive Comparison Summary

| Aspect | PaiNaiNa | Wanderlog | TripIt | TripAdvisor |
|--------|----------|-----------|--------|-------------|
| Primary Use | Plan + Discover | Plan | Organize | Discover |
| Collaboration | ✅ Realtime | ✅ Realtime | ❌ | ❌ |
| Expense Split | ✅ Full | ⚠️ Basic | ❌ | ❌ |
| Discovery | ✅ Guides | ⚠️ | ❌ | ✅ Reviews |
| Thai Language | ✅ Native | ❌ | ❌ | ⚠️ |
| Offline | ❌ (Phase 2) | ✅ Pro | ✅ Free | ❌ |

### C. Glossary

| Term | Definition |
|------|------------|
| **Trip** | แผนการเดินทางส่วนตัว (private by default) |
| **Guide** | แผนการเดินทางที่ publish ให้คนอื่นดู/copy |
| **Itinerary** | รายละเอียดแผนรายวัน |
| **Entry** | รายการหนึ่งใน Itinerary (Place, Note, หรือ Todo) |
| **Expense** | รายการค่าใช้จ่าย |
| **Split** | การแบ่งค่าใช้จ่ายระหว่างสมาชิก |
| **Settlement** | การชำระหนี้ระหว่างสมาชิก |
| **Member** | ผู้ร่วม Trip (Owner, Editor, Viewer) |

---

*Document prepared for handoff to System Architect and Development Team*
