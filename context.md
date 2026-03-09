# SJL Loisirs Gestion — Project Context

> Paste this file at the start of any new Copilot session to restore full context.

---

## 1. Project Overview

Internal management tool for **SJL Loisirs** (Sport Joie Lille), a volleyball club in Lille, France.  
**Purpose:** Admin-only CRUD management of players (name, rank). Accessible via a protected dashboard with login.  
**Colors:** Red (`#dc2626`, `#ef4444`), Black (`#0a0a0a`, `#0f0f0f`), White/Gray (`#f3f4f6`, `#6b7280`).  
**Fonts:** Barlow (body) + Barlow Condensed (titles/logos), loaded via Google Fonts in `app/assets/css/main.css`.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | **Nuxt 4** | `^4.3.1` |
| UI library | **Nuxt UI v4** (TanStack-based) | `^4.5.1` |
| State | **Pinia** + `@pinia/nuxt` | `^3.0.4` / `^0.11.3` |
| Database | **MongoDB** via **Mongoose** | `^9.2.4` |
| Auth hashing | **bcryptjs** | `^3.0.3` |
| Session | **h3 `useSession`** (built into Nitro) | — |
| Language | TypeScript (strict) | — |
| Runtime | Node / Nitro (server) | — |

---

## 3. Critical Nuxt 4 Rules

These have caused bugs — always follow them:

### `~` alias resolves to `app/`, NOT project root
- `~/types/player` → `app/types/player.ts` ✅
- Server files **cannot** use `~/server/...` — use **relative imports** instead:
  - `../../models/Player` from `server/api/players/`
  - `../../utils/auth` from `server/api/players/`

### Nuxt UI v4 (TanStack Table)
- Table columns use `accessorKey` / `id` + `header`, NOT `key` / `label`
- Row data accessed via `row.original` (TanStack `Row<T>` wrapper)

### Mongoose async pre-save hooks (v7+)
- Do NOT pass `next` as parameter to async hooks — Mongoose awaits the function directly:
```ts
// ✅ Correct
AdminSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcryptjs.hash(this.password, 12)
})
// ❌ Wrong — next is undefined, calling it throws
AdminSchema.pre('save', async function (next) { ... next() })
```

### h3 `useSession`
- Built into Nitro — no extra package needed
- `password` must be **32+ characters**
- Session data lives at `session.data`, not `session.user`

### CSS — NO Tailwind utility classes in templates
- Tailwind utilities (`flex`, `min-h-screen`, `text-red-400`, `size-4`, etc.) are **not reliably processed** in this setup
- Use **pure custom CSS classes** defined in `app/assets/css/main.css` for all layout/styling
- Use **inline `style=`** attributes for one-off colors/sizes on elements like `UIcon`
- Example: `<UIcon name="i-lucide-users" style="width:16px;height:16px" />`

---

## 4. Environment Variables

**File:** `.env` (gitignored), `.env.example` (committed)

```env
MONGODB_URI=mongodb://localhost:27042/
SESSION_PASSWORD=sjl-loisirs-secret-session-key-32chars!
```

Both are mapped in `nuxt.config.ts` under `runtimeConfig` (server-only, not exposed to client):
```ts
runtimeConfig: {
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27042/',
  sessionPassword: process.env.SESSION_PASSWORD || 'sjl-loisirs-secret-session-key-32chars!',
}
```

---

## 5. File Structure

```
sjl-loisirs-gestion/
├── nuxt.config.ts
├── .env / .env.example
├── app/
│   ├── app.vue                     # Root: <NuxtLayout><NuxtPage />
│   ├── assets/css/main.css         # ALL custom CSS (no Tailwind)
│   ├── layouts/
│   │   ├── default.vue             # Passthrough: <UApp><slot /><UToaster />
│   │   └── auth.vue                # Minimal for login: <UApp><UToaster /><slot />
│   ├── middleware/
│   │   └── admin.ts                # Redirects to /login if not auth.isAdmin
│   ├── pages/
│   │   ├── index.vue               # Landing page (Sport Joie Lille)
│   │   ├── login.vue               # Login form (layout: 'auth')
│   │   └── players/
│   │       └── index.vue           # Protected player management (middleware: 'admin')
│   ├── plugins/
│   │   └── auth.ts                 # Calls auth.fetchMe() on app init
│   ├── stores/
│   │   └── auth.ts                 # Pinia auth store (isAdmin, username, login, logout)
│   └── types/
│       ├── auth.ts                 # IAdmin, IAuthState
│       └── player.ts               # IPlayer, IPlayerForm
└── server/
    ├── plugins/
    │   └── mongoose.ts             # Mongoose connection on server start
    ├── models/
    │   ├── Player.ts               # Mongoose Player schema
    │   └── Admin.ts                # Mongoose Admin schema (bcrypt pre-save)
    ├── utils/
    │   └── auth.ts                 # requireAdmin(event) — throws 401 if not session
    └── api/
        ├── auth/
        │   ├── setup.post.ts       # One-time admin creation (403 if admin exists)
        │   ├── login.post.ts       # Validates credentials, sets h3 session
        │   ├── logout.post.ts      # Clears h3 session
        │   └── me.get.ts           # Returns { isAdmin, username } from session
        └── players/
            ├── index.get.ts        # GET all players (public)
            ├── index.post.ts       # POST create player (requireAdmin)
            ├── [id].get.ts         # GET single player (public)
            ├── [id].put.ts         # PUT update player (requireAdmin)
            └── [id].delete.ts      # DELETE player (requireAdmin)
```

---

## 6. Data Models

### Player (`server/models/Player.ts`)
```ts
interface IPlayer extends Document {
  name: string      // required
  rank: number      // required, default 0
  createdAt: Date   // auto (timestamps: true)
  updatedAt: Date   // auto (timestamps: true)
}
```

### Admin (`server/models/Admin.ts`)
```ts
interface IAdmin extends Document {
  username: string  // unique, trimmed, lowercased
  password: string  // bcrypt hashed (cost 12) via pre-save hook
  comparePassword(candidate: string): Promise<boolean>
}
```

---

## 7. Auth Flow

1. **First run:** `POST /api/auth/setup` with `{ username, password }` — creates the single admin (returns 403 if one already exists)
2. **Login:** `POST /api/auth/login` → validates, sets h3 session cookie (`adminId`, `username`)
3. **Session check:** `GET /api/auth/me` → returns `{ isAdmin: boolean, username: string | null }`
4. **Client init:** `app/plugins/auth.ts` calls `auth.fetchMe()` on every page load to rehydrate state
5. **Route guard:** `app/middleware/admin.ts` redirects to `/login` if `!auth.isAdmin`
6. **Logout:** `POST /api/auth/logout` clears session; client navigates to `/login`
7. **API guard:** `requireAdmin(event)` in `server/utils/auth.ts` throws 401 on any mutation if session lacks `adminId`

---

## 8. Frontend Architecture

### Pages
| Route | File | Layout | Auth |
|---|---|---|---|
| `/` | `pages/index.vue` | `default` | Public — landing page |
| `/login` | `pages/login.vue` | `auth` | Public |
| `/players` | `pages/players/index.vue` | `default` | `admin` middleware |

### `/players` page structure
The page is **self-contained** — it renders its own full-screen layout with sidebar + main content. The `default` layout is just a passthrough wrapper (`<UApp><slot /><UToaster />`).

- **Sidebar:** Logo, nav link (Joueurs), admin avatar + username, logout button (`.btn-logout`)
- **Topbar:** Title "JOUEURS", player count, custom search input (`.search-input`), add button (`.btn-add`)
- **Table:** Spreadsheet-style CSS grid (columns: `44px 1fr 120px 140px 90px`) with classes `.sheet-head`, `.sheet-body`, `.sheet-row`, `.sheet-cell`
- **Modals:** `UModal` for create/edit (form with name + rank), `UModal` for delete confirmation (styled danger zone)
- **Toasts:** `useToast()` — top-right, triggers on create/update/delete success or error

### Pinia auth store (`app/stores/auth.ts`)
```ts
state: { isAdmin: boolean, username: string | null }
actions: fetchMe(), login(username, password), logout()
```

---

## 9. CSS Architecture (`app/assets/css/main.css`)

Single CSS file — **no Tailwind**, **no CSS modules**. All classes are global.

### Key class groups:

**Layout**
- `.page-root` — `display:flex`, full viewport, contains sidebar + main
- `.sidebar` — `220px` wide, black bg, flex column
- `.main-content` — flex-1, dark bg, flex column

**Sidebar internals**
- `.sidebar-logo`, `.logo-link`, `.logo-icon`, `.logo-text`
- `.sidebar-nav`, `.nav-item`, `.nav-item--active`
- `.sidebar-footer`, `.admin-badge`, `.admin-avatar`, `.admin-info`, `.admin-name`, `.admin-role`
- `.btn-logout` — icon-only, turns red on hover

**Topbar**
- `.topbar`, `.topbar-title`, `.topbar-sub`, `.topbar-actions`
- `.search-wrapper`, `.search-icon`, `.search-input`, `.search-clear`
- `.btn-add` — red gradient button, lift on hover

**Spreadsheet table**
- `.sheet-wrapper`, `.sheet-head`, `.sheet-corner`, `.sheet-th`, `.sheet-th--num`, `.sheet-th--actions`
- `.sheet-body`, `.sheet-row`, `.sheet-row-num`
- `.sheet-cell`, `.sheet-cell--name`, `.sheet-cell--rank`, `.sheet-cell--date`, `.sheet-cell--actions`
- `.player-dot` — small red glowing circle
- `.rank-badge` — red pill badge (Barlow Condensed, #{{ rank }})
- `.row-actions` — opacity 0.2 at rest, 1 on `.sheet-row:hover`
- `.btn-action`, `.btn-action--edit`, `.btn-action--delete` — small icon buttons
- `.sheet-empty`, `.sheet-foot`
- `.skeleton` — shimmer animation

**Modals**
- `.modal-form-body`, `.modal-field`, `.modal-label`, `.modal-hint`, `.modal-footer`
- `.delete-danger-zone`, `.delete-icon-wrap`, `.delete-player-name`, `.delete-warning-text`
- `.btn-danger` — red outline button for destructive confirm

**Login page**
- `.login-root` — full-screen dark bg with radial red glow
- `.blob`, `.blob-1`, `.blob-2` — decorative blurred blobs
- `.login-box` — dark card, `380px` max-width, glassmorphism shadow
- `.login-heading`, `.login-logo-icon`, `.login-club-name`, `.login-subtitle`
- `.login-error` — red error banner
- `.login-form`, `.login-field`, `.login-label`
- `.login-input-wrap`, `.login-input-icon`, `.login-input` — native `<input>` styled dark with red focus ring
- `.btn-login` — full-width red gradient button

**Landing page**
- `.landing-root`, `.landing-bg-glow`
- `.landing-header`, `.landing-header-inner`, `.landing-header-logo`
- `.landing-hero`, `.landing-pill`, `.landing-title`, `.landing-tagline`, `.landing-actions`
- `.landing-stats`, `.landing-stat`, `.landing-stat-num`, `.landing-stat-label`, `.landing-stat-sep`
- `.landing-footer`

**Utilities**
- `.font-condensed` — applies Barlow Condensed
- `.skeleton` — shimmer loader
- `@keyframes shimmer` — 200% background-position sweep
- `@keyframes spin` — for loading spinner icon

---

## 10. Bootstrap: First Admin Setup

The database starts empty. Before any login is possible, create the first admin **once**:

```bash
curl -X POST http://localhost:3000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YourSecurePassword"}'
```

After that, `/api/auth/setup` returns 403 permanently (one admin only).

---

## 11. Dev Commands

```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run preview   # Preview production build
```

MongoDB must be running on `mongodb://localhost:27042/` before starting.
