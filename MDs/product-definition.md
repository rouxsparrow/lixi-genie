# Lì Xì Genie – Product Definition (PD)

## 1. Product Overview

Lì Xì Genie is a festive lucky draw web application designed for an internal team event (14 participants).

The app must provide:
- A fun and celebratory experience
- Strong visual transparency
- Verifiable fairness
- Clear auditability

Tech Stack:
- Next.js (App Router)
- Supabase (Database + Storage)
- Vercel (Deployment)

---

## 2. Event Structure

- Total participants: 14 (predefined player cards)
- Each participant may draw exactly once
- Prize pool is slot-based (fixed quantity per prize)
- Office participants draw first (kiosk mode on 1 laptop)
- Remote participants draw via public link (no login)

---

## 3. Fairness Model

### 3.1 Server Seed Locking

At event start:

1. Boss inputs arbitrary string.
2. System generates:

   serverSeed = SHA256(bossInput + serverTime + serverNonce)
   commitmentHash = SHA256(serverSeed)

3. commitmentHash is displayed publicly.
4. serverSeed remains hidden until reveal phase.

Purpose:
Prevent changing randomness source after event starts.

---

### 3.2 Client Seed (Slot Machine Style)

- Each participant generates a clientSeed via emoji slot-machine animation.
- ClientSeed generation is client-only.
- No API call during generation.
- No preview of prize outcome.
- Seed must be locked before draw.

---

### 3.3 Random Computation

On draw:

ticket = eventId + participantId + clientSeed + drawNonce

rndBytes = HMAC_SHA256(serverSeed, ticket)

rndValue → mapped to remaining prize pool (slot-based)

Stock is decremented atomically.

---

### 3.4 Reveal Phase

After all draws:

1. Admin reveals serverSeed.
2. System verifies:

   SHA256(serverSeed) == commitmentHash

3. System recomputes all draws.
4. Each draw marked:

   PASS / FAIL

---

## 4. Audit & Transparency

### 4.1 Live Audit Log

Realtime list showing:

- Time
- Participant
- Prize
- Short proof hash
- Status (Locked / Verified / VOID)

Only this section scrolls on desktop.

---

### 4.2 Hash Chain (Mini Blockchain)

Each draw record includes:

rowHash = SHA256(prevRowHash + ticket + prizeId + timestamp)

Purpose:
If any record is modified, chain integrity breaks.

UI displays:

Chain Integrity: ✅ Intact / ❌ Broken

---

### 4.3 VOID Handling (Mistaken Draw)

If incorrect participant draw occurs:

- Admin marks draw as VOID
- Prize slot is returned to pool
- New draw allowed
- VOID record remains in audit log (append-only)

No deletion allowed.

---

### 4.4 Offline Verification

After reveal:

Users can download:

audit.json

Contains:
- commitmentHash
- serverSeed
- prize pool snapshot
- all draw records
- hash chain data

Users may:
- Upload audit.json to /verify page
- Or verify offline via script

---

## 5. UI Structure

### Desktop (Single Laptop Mode)

- No full page scroll
- 2-column layout (65/35)
- Audit log scrolls internally
- Fixed header with event status

### Mobile

- Full vertical scroll allowed
- Sections stacked

---

## 6. Admin Capabilities

Admin page allows:

- Create/Edit prize pool (label, amount, stock)
- Create/Edit player cards (name + avatar upload)
- Start & Lock fairness
- Reveal seed
- VOID mistaken draw

---

## 7. Non-Goals

- No anti-fraud beyond event scope
- No external randomness beacon
- No login required for remote users
- Not intended for public gambling usage

---

## 8. Security Philosophy

This system aims to:

- Prevent post-hoc manipulation
- Make tampering visible
- Allow independent verification
- Balance fun + transparency

Absolute trustlessness is not required (internal event).

---

## 9. Acceptance Criteria

The system is considered valid if:

- Commitment hash is displayed before first draw
- serverSeed reveal validates correctly
- All draws recompute PASS after reveal
- Hash chain remains intact unless tampered
- Desktop layout has no full page scroll
- Audit log scrolls independently