# 🧧 Lì Xì Lucky Draw - UI Implementation Tasks

> **Project:** Bốc Thăm Trúng Lì Xì  
> **Scope:** Frontend UI Components ONLY — No backend logic  
> **Stack:** Next.js + Tailwind CSS

---

## 🎯 Global Setup Tasks

### [ ] G1. Configure Tailwind Theme Extensions
**Description:** Add custom colors and utilities to tailwind.config.ts
**Details:**
- Add `lixi` color palette (red, gold, cream)
- Add clay shadow utilities
- Add custom animations (celebrate, fadeInUp)
**Acceptance:**
- Colors available as `bg-lixi-red`, `text-lixi-gold`, etc.
- Custom shadows render correctly
- No build errors

### [ ] G2. Create Global Layout Shell
**Description:** Build the main page layout with header and responsive grid
**Details:**
- Fixed header at top (h-16)
- Two-column layout for desktop (65/35 split)
- Single column stack for mobile
- Background color: warm cream (#FDF6E9)
- NO full-page scroll on desktop
**Acceptance:**
- Layout renders without overflow on laptop screens (min 768px height)
- Header stays fixed when content changes
- Mobile view stacks vertically

### [ ] G3. Implement Screen-Reader Only Announcements
**Description:** Add aria-live region for dynamic status updates
**Details:**
- Create hidden div with `role="status"` and `aria-live="polite"`
- Create alert div with `role="alert"` and `aria-live="assertive"`
**Acceptance:**
- Status updates are announced to screen readers
- Does not affect visual layout

---

## 🏮 Header Components

### [ ] H1. Build EventHeader Component
**Description:** Fixed header with title, status badge, and prize counter
**Details:**
- Title: "Bốc Thăm Trúng Lì Xì" with 🧧 icon
- Responsive: full title on desktop, icon only on small mobile
- Glassmorphism effect (backdrop-blur)
**Acceptance:**
- Header is fixed at z-50
- Title truncates gracefully on mobile
- Visual style matches clay theme

### [ ] H2. Implement StatusBadge Component
**Description:** Dynamic status indicator with icon and text
**Details:**
- States: `locked` (🟡), `revealed` (🟢), `drawing` (🔵), `void` (⚫)
- Each state has distinct background color
- Smooth transition between states
**Acceptance:**
- All 4 states render correctly
- Color contrast passes WCAG
- State changes animate smoothly

### [ ] H3. Build PrizeCounter Component
**Description:** Display remaining prize slots
**Details:**
- Shows number with gift/prize icon
- Updates visually when count changes
- Positioned in header right section
**Acceptance:**
- Counter displays correct number
- Icon is festive (🎁 or similar)
- Updates without layout shift

---

## 👥 Game Zone Components

### [ ] GZ1. Build PlayerCard Component
**Description:** Individual player card with avatar, name, and states
**Details:**
- Avatar placeholder (emoji or circle with initial)
- Player name (truncated if long)
- States: default, selected, disabled (drawn)
- Clay-style shadow and rounded-2xl
**Acceptance:**
- Card shows avatar, name correctly
- Selected: red border, red bg tint, scale(1.05), checkmark badge
- Disabled: opacity-50, grayscale, overlay checkmark
- Hover: lift + shadow on non-disabled cards

### [ ] GZ2. Implement PlayerGrid Component
**Description:** Grid container for 14 player cards
**Details:**
- Desktop: 7 columns × 2 rows
- Mobile: 3 columns (5 rows)
- Gap spacing: 8px mobile, 12px desktop
- Section title with player count
**Acceptance:**
- All 14 cards fit within allocated height
- Grid responsive to viewport width
- Container has clay panel styling

### [ ] GZ3. Add Player Selection State Management
**Description:** Handle single-select logic for players
**Details:**
- Only one player selectable at a time
- Deselect on second click
- Disable selection for already-drawn players
- Callback onSelect(playerId)
**Acceptance:**
- Only one card shows selected state
- Drawn players cannot be selected
- Selection clears when appropriate

### [ ] GZ4. Build SlotMachineSeed Component
**Description:** Emoji-based seed display with lock functionality
**Details:**
- 3 emoji display slots (square, rounded-2xl)
- Spin animation state (bouncing emojis)
- Lock Seed button with disabled state
- "Locked" badge when seed is locked
**Acceptance:**
- Emojis display in three boxes
- Spin animation visible when isSpinning=true
- Lock button disables when locked
- Locked badge appears when appropriate

### [ ] GZ5. Implement Lock Button with Clay 3D Effect
**Description:** Gold CTA button for locking seed
**Details:**
- Gradient: gold to amber
- 3D press effect (shadow + translateY)
- Disabled state: gray, no interaction
- Text: "🔐 Lock Seed" → "🔒 Seed Locked"
**Acceptance:**
- Button has visible 3D depth
- Press animation works on click
- Disabled state clearly distinct

### [ ] GZ6. Build DrawButton Component
**Description:** Main CTA "BỐC THĂM NGAY!" with festive styling
**Details:**
- Large size (py-5, text-xl, font-black)
- Red gradient with 3D shadow effect
- States: default, disabled, loading (isDrawing)
- Loading shows spinner + "Đang Quay..."
**Acceptance:**
- Button spans full width of container
- 3D press effect on hover/active
- Disabled state is visually muted
- Loading state shows animation

### [ ] GZ7. Implement PrizeRevealPanel Component
**Description:** Animated panel showing draw result
**Details:**
- Two variants: Prize Won (gold/red) or VOID (gray)
- Prize view: large 🧧 icon, amount, prize name
- VOID view: 🚫 icon, "VOID" text, explanation
- Entry animation: fade-in + slide-up
**Acceptance:**
- Prize state shows amount formatted with ₫
- VOID state shows clearly different styling
- Animation plays when becoming visible
- Confetti decorations visible (static)

### [ ] GZ8. Add Prize Amount Formatting
**Description:** Format currency display for Vietnamese đồng
**Details:**
- Format: "500,000₫" (locale string + ₫ symbol)
- Large, bold typography for amount
- Smaller text for prize name
**Acceptance:**
- Amount displays with thousand separators
- ₫ symbol appended
- Text is readable and prominent

---

## 📜 Trust Panel Components

### [ ] TP1. Build CommitmentCard Component
**Description:** Display cryptographic commitment hash
**Details:**
- Hash display: monospace, small text, break-all
- Label: "Fairness Commitment" with 🔐 icon
- Explanation text below hash
- Clay card styling
**Acceptance:**
- Hash text wraps correctly in container
- Explanation text is readable
- Card matches clay aesthetic

### [ ] TP2. Implement ChainIntegrityCard Component
**Description:** Show chain verification status
**Details:**
- Status badge: "✅ Intact" (green) or "❌ Broken" (red)
- Explanation text about chain sealing
- Simple visual chain (4 connected segments)
- Background color changes based on status
**Acceptance:**
- Intact state: green bg, green badge
- Broken state: red bg, red badge
- Chain visual renders 4 segments
- Status clearly communicates integrity

### [ ] TP3. Build LiveAuditLog Container
**Description:** Scrollable container for audit entries
**Details:**
- Fixed header with title "Live Audit Log"
- Scrollable body: `overflow-y-auto`, `flex-1`
- Clay panel styling
- Empty state message when no entries
**Acceptance:**
- Container grows to fill available space
- Scrolls internally (not page scroll)
- Empty state shows friendly message
- Header stays visible during scroll

### [ ] TP4. Implement LogEntry Component
**Description:** Individual audit log row
**Details:**
- Player info: avatar + name
- Prize amount
- Timestamp
- Short proof hash (truncated)
- Status badge: Locked/Verified/VOID
**Acceptance:**
- Entry shows all required fields
- Status badge colors match state
- Hover effect on entry
- Fade-in animation on new entries

### [ ] TP5. Add LogEntry Status Variants
**Description:** Visual states for different entry types
**Details:**
- Locked: amber badge
- Verified: green badge  
- VOID: gray badge
- Each with appropriate icon/color
**Acceptance:**
- All 3 status variants render correctly
- Color coding is consistent
- Status text clearly readable

---

## 📱 Responsive Layout Tasks

### [ ] R1. Implement Desktop Layout (No Scroll)
**Description:** Ensure all content fits in single viewport on laptop
**Details:**
- Left panel: 65% width
- Right panel: 35% width
- Only LiveAuditLog scrolls
- Test at 1366×768 minimum
**Acceptance:**
- No body scroll on desktop
- All components visible without scrolling
- Audit log scrolls if entries overflow

### [ ] R2. Implement Mobile Layout (Stacked)
**Description:** Vertical stack layout for mobile screens
**Details:**
- Breakpoint: `lg:` (1024px)
- Single column: Game Zone → Trust Panel
- PlayerGrid: 3 columns
- Full page scroll allowed
- AuditLog: max-height with internal scroll
**Acceptance:**
- Layout switches at lg breakpoint
- Mobile has vertical stacking
- Touch targets are appropriate size (min 44px)

### [ ] R3. Add Responsive PlayerGrid Columns
**Description:** Adjust grid columns based on viewport
**Details:**
- Mobile (< 640px): 3 columns
- Tablet (640px - 1024px): 5 columns
- Desktop (> 1024px): 7 columns
**Acceptance:**
- Grid responds to viewport changes
- Cards maintain readable size
- No horizontal overflow

---

## 🎨 Visual State Tasks

### [ ] VS1. Implement State: Before Event Start
**Description:** Initial UI state before any interaction
**Details:**
- Status: "Fairness Locked" (yellow)
- All players enabled
- Seed spinner active
- Draw button disabled
- Empty audit log
**Acceptance:**
- State renders correctly
- Draw button clearly disabled
- UI invites user to select player

### [ ] VS2. Implement State: Fairness Locked
**Description:** Seed has been locked, ready to draw
**Details:**
- Status: "Fairness Locked" (yellow)
- Player selected (highlighted)
- Seed display shows locked emojis
- Lock button disabled
- Draw button enabled (festive)
**Acceptance:**
- Selected player clearly highlighted
- Seed shows non-spinning emojis
- Draw button invites interaction

### [ ] VS3. Implement State: Drawing in Progress
**Description:** Draw animation is running
**Details:**
- Status: "Drawing..." (blue)
- Seed spinning animation
- Draw button loading state
- Player grid interaction disabled
**Acceptance:**
- Spinning animation visible
- Loading state clearly communicated
- UI prevents double-draw

### [ ] VS4. Implement State: Prize Revealed
**Description:** Draw complete, winner announced
**Details:**
- Status: "Seed Revealed" (green)
- PrizeRevealPanel visible with amount
- Winner card marked as drawn (disabled)
- New entry in audit log
**Acceptance:**
- Celebration effect visible
- Prize amount prominent
- Winner marked in grid

### [ ] VS5. Implement State: VOID Draw
**Description:** Draw was cancelled or invalid
**Details:**
- Status: "VOID" (gray)
- PrizeRevealPanel shows VOID variant
- Player may be marked differently
- Audit log shows VOID entry
**Acceptance:**
- VOID state clearly different from win
- Gray styling consistent
- Explanation text visible

### [ ] VS6. Implement State: All Prizes Drawn
**Description:** No remaining prizes, event complete
**Details:**
- Prize counter shows 0
- Draw button permanently disabled
- All players marked as drawn
- Complete audit trail visible
**Acceptance:**
- Complete state clearly communicated
- No interactive elements that fail
- Celebration summary visible

---

## ✨ Animation & Interaction Tasks

### [ ] A1. Add Clay Card Hover Effects
**Description:** Subtle lift and shadow on card hover
**Details:**
- `hover:-translate-y-0.5`
- `hover:shadow-lg`
- `transition-all duration-200`
- Apply to: PlayerCard, LogEntry
**Acceptance:**
- Hover effect visible on all cards
- Smooth transition, not jarring
- Disabled cards don't have hover effect

### [ ] A2. Implement 3D Button Press Effect
**Description:** Physical button press animation
**Details:**
- Shadow reduces on hover
- translateY increases on active/press
- DrawButton and LockButton
**Acceptance:**
- Button appears to press down
- Visual feedback on click
- Disabled state has no press effect

### [ ] A3. Add Prize Reveal Entry Animation
**Description:** Animate prize panel appearing
**Details:**
- fade-in + slide-up
- Duration: 500ms
- Easing: ease-out
**Acceptance:**
- Animation plays when prize reveals
- Smooth, not distracting
- Works on both desktop and mobile

### [ ] A4. Implement Log Entry Fade-In
**Description:** New audit entries animate in
**Details:**
- Fade + slight slide up
- Duration: 300ms
- Triggered on new entry addition
**Acceptance:**
- New entries animate smoothly
- Animation doesn't block interaction
- Works with scroll container

### [ ] A5. Add Seed Spinning Animation
**Description:** Bouncing emojis during spin state
**Details:**
- `animate-bounce` on emoji containers
- Staggered delay (100ms between each)
- Duration: 1s infinite
**Acceptance:**
- All 3 emojis bounce visibly
- Stagger creates wave effect
- Animation stops when not spinning

---

## ♿ Accessibility Tasks

### [ ] AC1. Add Focus Ring Styles
**Description:** Visible focus indicators for keyboard navigation
**Details:**
- `focus:ring-2 focus:ring-lixi-gold focus:ring-offset-2`
- Apply to all interactive elements
- Remove default outline where appropriate
**Acceptance:**
- Tab navigation shows focus rings
- Rings are clearly visible
- Color contrast sufficient

### [ ] AC2. Implement Reduced Motion Support
**Description:** Respect user's motion preferences
**Details:**
- `@media (prefers-reduced-motion: reduce)` CSS
- Disable/reduce animations
- Keep functionality intact
**Acceptance:**
- Animations disabled when preference set
- UI still works correctly
- No console errors

### [ ] AC3. Add ARIA Labels to Interactive Elements
**Description:** Screen reader labels for buttons and controls
**Details:**
- `aria-label` on icon-only buttons
- `aria-pressed` for toggle states
- `aria-disabled` for disabled states
**Acceptance:**
- All interactive elements have accessible names
- State changes announced correctly
- Labels are descriptive

### [ ] AC4. Ensure Color Contrast Compliance
**Description:** All text meets WCAG AA standards
**Details:**
- Minimum 4.5:1 for normal text
- Minimum 3:1 for large text
- Test with contrast checker
**Acceptance:**
- All text colors pass WCAG AA
- No text invisible due to background
- Status badges readable

---

## 🧪 Testing & Polish Tasks

### [ ] T1. Test Layout at Multiple Viewport Sizes
**Description:** Verify responsive behavior
**Details:**
- Test: 320px, 375px, 768px, 1024px, 1440px
- Check for overflow issues
- Verify no horizontal scroll
**Acceptance:**
- No horizontal scroll at any width
- Layout adapts gracefully
- Touch targets appropriate on mobile

### [ ] T2. Test All 7 UI States Visually
**Description:** Verify each state renders correctly
**States to test:**
1. Before event start
2. Fairness Locked
3. Drawing in progress
4. Prize revealed
5. Seed revealed
6. Verified PASS
7. VOID draw
**Acceptance:**
- Each state visually distinct
- State transitions smooth
- No broken layouts

### [ ] T3. Verify No Full-Page Scroll on Desktop
**Description:** Desktop layout fits in viewport
**Details:**
- Test on 1366×768 and larger
- Check with 14 players + 10 audit entries
- Ensure only audit log scrolls
**Acceptance:**
- Body overflow hidden or managed
- All content accessible without page scroll
- Audit log internal scroll works

### [ ] T4. Test Mobile Scroll Behavior
**Description:** Mobile layout scrolls naturally
**Details:**
- Full page scroll on mobile
- Audit log scrolls within constraints
- Header stays fixed
**Acceptance:**
- Natural scrolling feel on mobile
- No scroll jacking
- Content reachable

### [ ] T5. Polish Clay Aesthetic Consistency
**Description:** Ensure all components match theme
**Details:**
- Review all shadows for consistency
- Check border radius (2xl/3xl throughout)
- Verify color palette usage
**Acceptance:**
- Visual style consistent across app
- Clay effect visible on all cards
- No harsh edges or sharp shadows

---

## 📋 Component Checklist Summary

| Component | Priority | Tasks |
|-----------|----------|-------|
| EventHeader | High | H1, H2, H3 |
| PlayerCard | High | GZ1, GZ2, GZ3 |
| SlotMachineSeed | High | GZ4, GZ5 |
| DrawButton | High | GZ6 |
| PrizeRevealPanel | High | GZ7, GZ8 |
| CommitmentCard | Medium | TP1 |
| ChainIntegrityCard | Medium | TP2 |
| LiveAuditLog | High | TP3, TP4, TP5 |
| Layout Shell | Critical | G1, G2, R1, R2, R3 |
| States | High | VS1-VS6 |
| Animations | Medium | A1-A5 |
| Accessibility | High | AC1-AC4 |

---

*Total Tasks: 45+ implementation items*  
*Estimated Effort: 3-4 development days*

