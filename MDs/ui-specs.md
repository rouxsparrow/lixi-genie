# 🧧 Lì Xì Lucky Draw - UI Design Specification

> **Project:** Bốc Thăm Trúng Lì Xì  
> **Stack:** Next.js + Tailwind CSS + Supabase (backend TBD)  
> **Theme:** Festive Vietnamese Lì Xì with Soft Clay 3D Style  
> **Scope:** UI/UX Structure ONLY — No backend logic

---

## 📐 1. High-Level Layout Description

### Visual Identity (Based on inspo.png)

| Element | Specification |
|---------|---------------|
| **Background** | Warm cream/beige (#FDF6E9 or #FFF8F0) |
| **Primary Red** | Lì xì red gradient (#E53935 → #C62828) |
| **Gold Accent** | Amber/gold (#FFB300, #FFC107) with subtle 3D highlight |
| **Clay Effect** | Soft inner shadows, rounded corners (rounded-2xl/3xl), subtle borders |
| **Typography** | Bold rounded headers, clear sans-serif body |
| **Decorative** | Lanterns, coins, confetti, gift boxes, clouds |

### Overall Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  🏮 HEADER (Fixed, h-16)                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 🧧 Bốc Thăm Trúng Lì Xì    🟡 Fairness Locked  🎁  │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                         │                                   │
│   LEFT PANEL (65%)      │   RIGHT PANEL (35%)               │
│   ───────────────       │   ─────────────────               │
│                         │                                   │
│   ┌─────────────┐       │   ┌─────────────────┐             │
│   │ PlayerGrid  │       │   │ CommitmentCard  │             │
│   │  (14 cards) │       │   └─────────────────┘             │
│   └─────────────┘       │   ┌─────────────────┐             │
│                         │   │ ChainIntegrity  │             │
│   ┌─────────────┐       │   └─────────────────┘             │
│   │SlotMachine  │       │   ┌─────────────────┐             │
│   │Seed Display │       │   │  LiveAuditLog   │ ← Scroll    │
│   └─────────────┘       │   │  (scrollable)   │   only      │
│                         │   └─────────────────┘             │
│   ┌─────────────┐       │                                   │
│   │ DrawButton  │       │                                   │
│   └─────────────┘       │                                   │
│                         │                                   │
│   ┌─────────────┐       │                                   │
│   │PrizeReveal  │       │                                   │
│   │   Panel     │       │                                   │
│   └─────────────┘       │                                   │
│                         │                                   │
└─────────────────────────┴───────────────────────────────────┘
```

### Key Layout Constraints

| Constraint | Rule |
|------------|------|
| **Desktop** | NO full-page scroll — all content fits in viewport |
| **Scroll** | ONLY LiveAuditLog has `overflow-y-auto` |
| **Height** | `h-screen` or `h-[calc(100vh-4rem)]` after header |
| **Responsive** | Mobile stacks vertically with full scroll |

---

## 🌳 2. Component Hierarchy Tree

```
LixiDrawPage (page.tsx)
├── EventHeader
│   ├── TitleBadge
│   ├── StatusIndicator
│   └── PrizeCounter
├── MainLayout (flex-col lg:flex-row)
│   ├── GameZone (w-full lg:w-[65%])
│   │   ├── PlayerGrid
│   │   │   └── PlayerCard (×14)
│   │   │       ├── Avatar
│   │   │       ├── Name
│   │   │       └── StatusOverlay
│   │   ├── SlotMachineSeed
│   │   │   ├── EmojiReel (3 slots)
│   │   │   ├── SpinAnimation
│   │   │   └── LockSeedButton
│   │   ├── DrawButton
│   │   └── PrizeRevealPanel
│   │       ├── PrizeDisplay
│   │       ├── CelebrationEffect
│   │       └── VoidStateBadge
│   └── TrustPanel (w-full lg:w-[35%])
│       ├── CommitmentCard
│       │   ├── HashDisplay
│       │   └── ExplanationText
│       ├── ChainIntegrityCard
│       │   ├── StatusBadge
│       │   └── ChainVisual
│       └── LiveAuditLog
│           ├── LogHeader
│           └── LogEntry (scrollable list)
│               ├── Timestamp
│               ├── PlayerInfo
│               ├── PrizeValue
│               ├── ProofHash
│               └── StatusBadge
└── MobileResponsiveWrapper (reorganizes on breakpoint)
```

---

## 💻 3. Desktop Layout Explanation

### Container Structure

```jsx
// Main page container
<div className="min-h-screen bg-[#FDF6E9] overflow-hidden">
  <EventHeader className="fixed top-0 left-0 right-0 h-16 z-50" />
  
  <main className="pt-16 h-screen flex flex-col lg:flex-row">
    {/* Game Zone - 65% */}
    <section className="w-full lg:w-[65%] h-full p-4 lg:p-6 flex flex-col gap-4">
      {/* Content stacks vertically */}
    </section>
    
    {/* Trust Panel - 35% */}
    <section className="w-full lg:w-[35%] h-full p-4 lg:p-6 flex flex-col gap-4">
      {/* Stack Commitment → Chain → Audit */}
    </section>
  </main>
</div>
```

### Game Zone (Left 65%)

| Component | Height Allocation | Behavior |
|-----------|------------------|----------|
| PlayerGrid | `flex-1` or `h-[45%]` | 2 rows × 7 cols grid, scrolls internally if needed |
| SlotMachineSeed | `h-24` | Fixed height, emoji reel display |
| DrawButton | `h-16` | Fixed height, prominent CTA |
| PrizeRevealPanel | `h-[25%]` | Conditional render, animated entry |

### Trust Panel (Right 35%)

| Component | Height | Behavior |
|-----------|--------|----------|
| CommitmentCard | `h-auto` | Compact card, hash display |
| ChainIntegrityCard | `h-auto` | Status indicator card |
| LiveAuditLog | `flex-1` | **ONLY scrollable element**, `overflow-y-auto` |

---

## 📱 4. Mobile Layout Explanation

### Breakpoint: `lg:` (1024px)

### Mobile Structure

```jsx
// Mobile stacks vertically
<main className="pt-16 min-h-screen flex flex-col gap-4 p-4 overflow-y-auto">
  {/* Game Zone */}
  <section>
    <PlayerGrid className="grid-cols-3 gap-2" /> {/* 3 cols instead of 7 */}
    <SlotMachineSeed />
    <DrawButton />
    <PrizeRevealPanel />
  </section>
  
  {/* Trust Panel - Below game */}
  <section>
    <CommitmentCard />
    <ChainIntegrityCard />
    <LiveAuditLog className="max-h-[400px]" /> {/* Limited height with scroll */}
  </section>
</main>
```

### Mobile Adaptations

| Element | Desktop | Mobile |
|---------|---------|--------|
| Layout | Side-by-side (65/35) | Stacked vertical |
| PlayerGrid | 7 columns × 2 rows | 3 columns × 5 rows |
| Scroll | None (except audit) | Full page scroll allowed |
| Header | Fixed | Fixed |
| Audit Log | Flex grow with scroll | Max height with scroll |

---

## 🎨 5. JSX/Tailwind Mockup Skeleton

### Color Tokens (Tailwind Config Extension)

```javascript
// tailwind.config.ts
colors: {
  lixi: {
    red: {
      DEFAULT: '#E53935',
      dark: '#C62828',
      light: '#EF5350',
    },
    gold: {
      DEFAULT: '#FFB300',
      light: '#FFD54F',
      dark: '#FF8F00',
    },
    cream: {
      DEFAULT: '#FDF6E9',
      dark: '#F5E6D3',
      light: '#FFF8F0',
    },
    clay: {
      shadow: 'rgba(0,0,0,0.08)',
      highlight: 'rgba(255,255,255,0.6)',
    }
  }
}
```

### Component Skeletons

#### EventHeader

```jsx
function EventHeader({ status, remainingSlots }) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md 
                       border-b border-lixi-gold/20 z-50 shadow-sm">
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Title */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧧</span>
          <h1 className="text-xl font-bold text-lixi-red hidden sm:block">
            Bốc Thăm Trúng Lì Xì
          </h1>
        </div>
        
        {/* Status Badge */}
        <div className="flex items-center gap-4">
          <StatusBadge status={status} />
          <PrizeCounter count={remainingSlots} />
        </div>
      </div>
    </header>
  );
}

function StatusBadge({ status }) {
  const variants = {
    locked: { icon: '🟡', text: 'Fairness Locked', class: 'bg-amber-100 text-amber-800' },
    revealed: { icon: '🟢', text: 'Seed Revealed', class: 'bg-green-100 text-green-800' },
    drawing: { icon: '🔵', text: 'Drawing...', class: 'bg-blue-100 text-blue-800' },
    void: { icon: '⚫', text: 'VOID', class: 'bg-gray-100 text-gray-800' },
  };
  
  const v = variants[status];
  return (
    <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${v.class}`}>
      {v.icon} {v.text}
    </span>
  );
}
```

#### PlayerCard

```jsx
function PlayerCard({ player, isSelected, isDisabled, onSelect }) {
  return (
    <button
      onClick={() => !isDisabled && onSelect(player.id)}
      disabled={isDisabled}
      className={`
        relative p-3 rounded-2xl border-2 transition-all duration-200
        ${isSelected 
          ? 'bg-lixi-red/10 border-lixi-red shadow-lg scale-105' 
          : 'bg-white border-transparent hover:border-lixi-gold/50'
        }
        ${isDisabled 
          ? 'opacity-50 cursor-not-allowed grayscale' 
          : 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
        }
        /* Clay effect */
        shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.08)]
      `}
    >
      {/* Avatar */}
      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br 
                      from-lixi-gold to-lixi-gold-dark flex items-center justify-center
                      text-xl shadow-inner">
        {player.avatar}
      </div>
      
      {/* Name */}
      <p className="text-sm font-medium text-center text-gray-800 truncate">
        {player.name}
      </p>
      
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-lixi-red rounded-full 
                        flex items-center justify-center text-white text-xs">
          ✓
        </div>
      )}
      
      {/* Drawn overlay */}
      {isDisabled && (
        <div className="absolute inset-0 flex items-center justify-center 
                        bg-gray-100/80 rounded-2xl">
          <span className="text-2xl grayscale">✓</span>
        </div>
      )}
    </button>
  );
}
```

#### PlayerGrid

```jsx
function PlayerGrid({ players, selectedId, drawnIds, onSelect }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-4 
                    shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
      <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
        <span>👥</span> Người Chơi ({players.length})
      </h2>
      
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-2 lg:gap-3">
        {players.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            isSelected={selectedId === player.id}
            isDisabled={drawnIds.includes(player.id)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
```

#### SlotMachineSeed

```jsx
function SlotMachineSeed({ seed, isSpinning, onLock, isLocked }) {
  return (
    <div className="bg-white/80 rounded-3xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span>🎰</span> Random Seed
        </h3>
        {isLocked && (
          <span className="text-xs font-medium text-green-600 bg-green-100 
                           px-2 py-1 rounded-full">
            🔒 Locked
          </span>
        )}
      </div>
      
      {/* Emoji Reel Display */}
      <div className="flex justify-center gap-2 mb-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`
              w-16 h-16 rounded-2xl bg-gradient-to-b from-gray-50 to-gray-100
              border-2 border-gray-200 flex items-center justify-center text-3xl
              shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]
              ${isSpinning ? 'animate-bounce' : ''}
            `}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {isSpinning ? '🎲' : seed?.[i] || '?'}
          </div>
        ))}
      </div>
      
      {/* Lock Button */}
      <button
        onClick={onLock}
        disabled={isLocked}
        className={`
          w-full py-3 rounded-xl font-bold text-white transition-all
          ${isLocked 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-lixi-gold to-amber-500 hover:from-amber-400 
               hover:to-amber-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5'
          }
        `}
      >
        {isLocked ? '🔒 Seed Locked' : '🔐 Lock Seed'}
      </button>
    </div>
  );
}
```

#### DrawButton

```jsx
function DrawButton({ onClick, isDisabled, isDrawing }) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled || isDrawing}
      className={`
        relative w-full py-5 rounded-2xl font-black text-xl text-white
        transition-all duration-200 overflow-hidden
        ${isDisabled 
          ? 'bg-gray-300 cursor-not-allowed' 
          : 'bg-gradient-to-b from-lixi-red to-lixi-red-dark 
             shadow-[0_8px_0_#B71C1C,0_12px_20px_rgba(229,57,53,0.4)]
             hover:shadow-[0_6px_0_#B71C1C,0_8px_16px_rgba(229,57,53,0.4)]
             hover:translate-y-0.5
             active:shadow-[0_2px_0_#B71C1C,0_4px_8px_rgba(229,57,53,0.4)]
             active:translate-y-2'
        }
      `}
    >
      {/* Clay highlight */}
      <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b 
                       from-white/20 to-transparent rounded-t-2xl" />
      
      {/* Content */}
      <span className="relative flex items-center justify-center gap-2">
        {isDrawing ? (
          <>
            <span className="animate-spin">🎲</span> Đang Quay...
          </>
        ) : (
          <>
            <span className="text-2xl">🧧</span> BỐC THĂM NGAY!
          </>
        )}
      </span>
    </button>
  );
}
```

#### PrizeRevealPanel

```jsx
function PrizeRevealPanel({ prize, isVisible, isVoid }) {
  if (!isVisible) return null;
  
  return (
    <div className={`
      relative rounded-3xl p-6 text-center overflow-hidden
      ${isVoid 
        ? 'bg-gray-100 border-2 border-gray-300' 
        : 'bg-gradient-to-br from-lixi-gold/20 to-lixi-red/10 border-2 border-lixi-gold'
      }
      animate-in fade-in slide-in-from-bottom-4 duration-500
    `}>
      {/* Confetti decoration (static for now) */}
      <div className="absolute inset-0 opacity-30">
        <span className="absolute top-2 left-4">🎉</span>
        <span className="absolute top-4 right-6">✨</span>
        <span className="absolute bottom-2 left-8">🎊</span>
      </div>
      
      {isVoid ? (
        <div className="relative">
          <div className="text-5xl mb-2 grayscale">🚫</div>
          <h3 className="text-xl font-bold text-gray-700">VOID</h3>
          <p className="text-gray-500">Draw cancelled — seed not locked</p>
        </div>
      ) : (
        <div className="relative">
          <div className="text-5xl mb-2 animate-bounce">🧧</div>
          <h3 className="text-lg text-gray-600 mb-1">Chúc Mừng!</h3>
          <p className="text-3xl font-black text-lixi-red">
            {prize?.amount?.toLocaleString()}₫
          </p>
          <p className="text-sm text-gray-500 mt-1">{prize?.name}</p>
        </div>
      )}
    </div>
  );
}
```

#### CommitmentCard

```jsx
function CommitmentCard({ hash }) {
  return (
    <div className="bg-white/80 rounded-2xl p-4 shadow-md">
      <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span>🔐</span> Fairness Commitment
      </h3>
      
      {/* Hash Display */}
      <div className="bg-gray-100 rounded-xl p-3 font-mono text-xs text-gray-600 
                      break-all mb-2 border border-gray-200">
        {hash || '0x0000...0000'}
      </div>
      
      {/* Explanation */}
      <p className="text-xs text-gray-500 leading-relaxed">
        We locked this cryptographic commitment before any draw occurred. 
        This ensures the prize distribution cannot be manipulated.
      </p>
    </div>
  );
}
```

#### ChainIntegrityCard

```jsx
function ChainIntegrityCard({ isIntact }) {
  return (
    <div className={`
      rounded-2xl p-4 border-2
      ${isIntact 
        ? 'bg-green-50 border-green-200' 
        : 'bg-red-50 border-red-200'
      }
    `}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span>⛓️</span> Chain Integrity
        </h3>
        <span className={`
          px-2 py-1 rounded-full text-xs font-bold
          ${isIntact 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
          }
        `}>
          {isIntact ? '✅ Intact' : '❌ Broken'}
        </span>
      </div>
      
      <p className="text-xs text-gray-600 leading-relaxed">
        Each draw cryptographically seals the previous one, creating 
        an unbreakable chain of verifiable results.
      </p>
      
      {/* Simple chain visual */}
      <div className="flex items-center gap-1 mt-3">
        {[1,2,3,4].map(i => (
          <div key={i} className={`
            w-8 h-2 rounded-full
            ${isIntact ? 'bg-green-400' : i < 3 ? 'bg-green-400' : 'bg-red-400'}
          `} />
        ))}
      </div>
    </div>
  );
}
```

#### LiveAuditLog

```jsx
function LiveAuditLog({ entries }) {
  return (
    <div className="bg-white/80 rounded-2xl shadow-md flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span>📜</span> Live Audit Log
        </h3>
      </div>
      
      {/* Scrollable entries */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {entries?.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            No draws yet — waiting for first entry
          </p>
        )}
        
        {entries?.map((entry, index) => (
          <LogEntry key={index} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function LogEntry({ entry }) {
  const statusConfig = {
    locked: { color: 'bg-amber-100 text-amber-700', label: 'Locked' },
    verified: { color: 'bg-green-100 text-green-700', label: 'Verified' },
    void: { color: 'bg-gray-100 text-gray-700', label: 'VOID' },
  };
  
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100
                    hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm">{entry.playerAvatar}</span>
          <span className="font-medium text-sm text-gray-800">{entry.playerName}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig[entry.status]?.color}`}>
          {statusConfig[entry.status]?.label}
        </span>
      </div>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{entry.time}</span>
        <span className="font-mono opacity-60">{entry.proofHash}</span>
      </div>
      
      <div className="mt-1 text-sm font-bold text-lixi-red">
        {entry.prizeAmount?.toLocaleString()}₫
      </div>
    </div>
  );
}
```

---

## 🎯 6. Suggested Tailwind Utility Patterns

### Clay Morphism Pattern

```css
/* Clay card base */
.clay-card {
  @apply bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.6)]
         border border-white/50;
}

/* Clay button (3D press effect) */
.clay-button-primary {
  @apply relative bg-gradient-to-b from-lixi-red to-lixi-red-dark text-white font-bold
         shadow-[0_6px_0_#B71C1C,0_8px_16px_rgba(229,57,53,0.3)]
         hover:shadow-[0_4px_0_#B71C1C,0_6px_12px_rgba(229,57,53,0.3)]
         hover:translate-y-0.5
         active:shadow-[0_2px_0_#B71C1C,0_3px_6px_rgba(229,57,53,0.3)]
         active:translate-y-1
         transition-all duration-150;
}
```

### Common Utility Combinations

| Pattern | Classes |
|---------|---------|
| **Clay Panel** | `bg-white/80 backdrop-blur-sm rounded-3xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)]` |
| **Clay Button** | `rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_4px_8px_rgba(0,0,0,0.1)]` |
| **Status Badge** | `px-3 py-1 rounded-full text-sm font-medium` |
| **Card Hover** | `hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200` |
| **Selected State** | `ring-2 ring-lixi-red bg-lixi-red/10 scale-105` |
| **Disabled State** | `opacity-50 cursor-not-allowed grayscale` |

---

## ✨ 7. Micro-interaction Suggestions

### Hover Effects

| Element | Effect |
|---------|--------|
| PlayerCard | `hover:shadow-md hover:-translate-y-0.5` + border highlight |
| DrawButton | 3D press down (shadow reduction + translateY) |
| LockButton | Gold glow pulse when active |
| LogEntry | Subtle lift + shadow increase |

### Animation States

```css
/* Prize reveal celebration */
@keyframes celebrate {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

/* Slot machine spinning */
@keyframes slotSpin {
  0% { transform: translateY(0); }
  100% { transform: translateY(-100%); }
}

/* Fade in for log entries */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### State Transitions

| Transition | Animation |
|------------|-----------|
| Prize Reveal | `animate-in fade-in slide-in-from-bottom-4 duration-500` |
| Log Entry Add | `animate-in fade-in duration-300` |
| Player Select | `transition-all duration-200` + scale |
| Seed Lock | Button color change + lock icon spin |
| Draw Complete | Button disabled state + result panel fade |

---

## ♿ 8. Accessibility Considerations

### Color Contrast

- All text must meet WCAG 4.5:1 contrast ratio
- Lì xì red (#E53935) on white: ✓ Passes
- Gold text should use dark variants for small text
- Status badges use light backgrounds with dark text

### Focus States

```jsx
// Visible focus indicators
<button className="... focus:outline-none focus:ring-2 focus:ring-lixi-gold focus:ring-offset-2">
```

### Keyboard Navigation

| Element | Key Support |
|---------|-------------|
| PlayerGrid | Arrow keys to navigate, Enter/Space to select |
| DrawButton | Enter/Space to activate |
| LockButton | Enter/Space to lock |
| AuditLog | Tab through entries |

### Screen Reader Support

```jsx
// Status announcements
<div role="status" aria-live="polite" className="sr-only">
  {announcement}
</div>

// Button labels
<button aria-label={`Select player ${player.name}`}>

// Prize announcement
<div role="alert" aria-live="assertive">
  Player {name} won {amount}
</div>
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🖼️ 9. Asset Requirements

### Icons (Emoji-based, no external assets needed)

| Usage | Emoji |
|-------|-------|
| Logo | 🧧 |
| Players | 👤 or custom avatars |
| Seed/Lock | 🔐 🔒 🎰 |
| Status | 🟡 🟢 🔵 ⚫ |
| Chain | ⛓️ ✅ ❌ |
| Celebration | 🎉 🎊 ✨ |
| Void | 🚫 |

### Decorative Elements (CSS/SVG)

- Lanterns: CSS shapes or SVG
- Coins: CSS circles with gold gradient
- Confetti: CSS positioned spans
- Clouds: CSS rounded shapes

---

## 📊 10. UI States Reference

### State 1: Before Event Start

```
- Header: "Fairness Locked" badge (yellow)
- PlayerGrid: All enabled, no selection
- SlotMachine: Spinning enabled, Lock button active
- DrawButton: Disabled (no player selected)
- PrizeReveal: Hidden
- AuditLog: Empty or loading state
```

### State 2: Fairness Locked

```
- Header: "Fairness Locked" badge (yellow)
- PlayerGrid: One player selected
- SlotMachine: Locked (emojis shown), Lock button disabled
- DrawButton: Enabled (gold pulse)
- PrizeReveal: Hidden
- AuditLog: Previous entries visible
```

### State 3: Drawing in Progress

```
- Header: "Drawing..." badge (blue)
- PlayerGrid: Selected player highlighted
- SlotMachine: Animation running
- DrawButton: Loading state "Đang Quay..."
- PrizeReveal: Hidden (or previous result fading)
- AuditLog: Previous entries
```

### State 4: Prize Revealed

```
- Header: "Seed Revealed" badge (green)
- PlayerGrid: Winner marked as drawn (disabled + checkmark)
- SlotMachine: Final seed displayed
- DrawButton: Disabled until new selection
- PrizeReveal: Visible with amount + celebration
- AuditLog: New entry at top with animation
```

### State 5: Seed Revealed (Post-Draw)

```
- Same as State 4, emphasis on audit verification
- CommitmentCard shows verifiable hash
- ChainIntegrity: Green "Intact"
```

### State 6: Verified PASS State

```
- All green indicators
- Audit log shows "Verified" badges
- Celebration effects remain
```

### State 7: VOID Draw State

```
- Header: "VOID" badge (gray)
- PlayerGrid: Player marked void (different icon)
- DrawButton: Reset to enable new draw
- PrizeReveal: Gray VOID panel
- AuditLog: Entry with "VOID" status
```

---

## 📝 Implementation Notes

1. **No Backend Logic**: All state changes should be mockable with React state
2. **Animation Placeholders**: Use CSS animations, implement actual effects later
3. **Scroll Constraint**: Desktop MUST NOT scroll — test at 768px+ height
4. **Mobile First**: Build mobile layout first, enhance for desktop
5. **Clay Aesthetic**: Shadows and rounded corners are critical — test visually

---

*Last Updated: UI Specification v1.0*
