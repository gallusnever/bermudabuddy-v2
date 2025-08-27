# 🎯 Bermuda Buddy - Engineering Handoff Document

*From one engineer to another - everything you need to know to take this baby forward.*

---

## 🌟 The Vision & Where We're Headed

### What Bermuda Buddy Is Supposed To Be
This is a **production-grade PWA for serious DIY Bermuda lawn care enthusiasts**. Think of it as the love child of a weather app, a chemical calculator, and your cranky neighbor who knows everything about lawn care but judges you for not knowing it yourself. 

The app should be:
- **Compliance-first**: Always shows EPA labels, respects RUP restrictions, follows WALES mixing order
- **Weather-aware**: Real-time spray conditions, GDD tracking, soil temps, ET calculations
- **Delightfully sarcastic**: Bud (our mascot) is basically Hank Hill - dry humor, tough love, dad jokes
- **Actually useful**: Accurate mix math, personalized programs, zone management, application tracking

### Current State: Half-Baked but Promising
Right now we're at about 60% functionality. The foundation is solid, but the roof leaks and the plumbing needs work. Here's the honest assessment:

**What Works:**
- ✅ Authentication flow with Supabase
- ✅ Onboarding UI (all steps rendered)  
- ✅ Mix calculator with WALES order
- ✅ OK-to-Spray logic
- ✅ Database schema for profiles, properties, applications
- ✅ Dark theme UI with Tailwind
- ✅ Bud Says quotes (40+ messages)

**What's Broken:**
- ❌ Nickname generation hangs forever (API call never fires)
- ❌ Dashboard doesn't display user's actual lawn data
- ❌ Weather widgets show empty values
- ❌ No user menu/logout functionality
- ❌ Hydration errors on some pages
- ❌ API endpoints for AI features not implemented

---

## 🏗️ Architecture & How It All Works

### Tech Stack
```
Frontend:
├── Next.js 14 (App Router)
├── TypeScript
├── Tailwind CSS 
├── Supabase Auth
├── Mapbox GL (property mapping)
└── @bermuda/ui (shared components)

Backend:
├── FastAPI (Python)
├── SQLModel/SQLAlchemy
├── PostgreSQL + PostGIS
├── Redis (caching)
├── Qdrant (vector DB - future use)
└── OpenRouter (LLM API)

Infrastructure:
├── Docker Compose (local dev)
├── pnpm workspaces (monorepo)
└── GitHub Actions (CI/CD)
```

### Directory Structure
```
bermuda-buddy/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── contexts/        # Auth context
│   │   ├── lib/            # Utils, API clients, generators
│   │   └── public/         # Static assets
│   │
│   └── api/                # FastAPI backend
│       ├── main.py         # Entry point
│       ├── models.py       # SQLModel schemas
│       ├── providers/      # Weather, NWS providers
│       └── services/       # Business logic
│
├── packages/
│   └── ui/                # Shared UI components
│
├── infra/                 # Docker configs
├── scripts/              # Helper scripts
├── e2e/                  # Playwright tests
└── docs/                 # Documentation
```

### Critical Files You'll Touch Often

**Frontend:**
- `apps/web/app/onboarding/account-nickname-step.tsx` - Where nickname gen is broken
- `apps/web/app/dashboard/page.tsx` - Needs to pull real user data
- `apps/web/contexts/auth-context.tsx` - Auth state management
- `apps/web/lib/nickname-generator.ts` - Has the LLM prompt logic

**Backend:**
- `apps/api/main.py` - Add new endpoints here
- `apps/api/models.py` - Database models
- Need to create: `/api/nickname` endpoint

---

## 🔑 Environment Variables & Keys

### Frontend (.env.local)
```bash
# Supabase (public keys - safe to expose)
NEXT_PUBLIC_SUPABASE_URL=https://ipsjsfonzweykrueoret.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Backend
NEXT_PUBLIC_API_BASE=http://localhost:8000

# Mapbox (for property mapping)
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoiZ2FsbHVzbmV2ZXIiLCJhI...

# E2E Testing bypass
NEXT_PUBLIC_E2E_AUTH_BYPASS=0  # Set to 1 for testing
```

### Backend (.env)
```bash
# Database
POSTGRES_URL=postgresql+psycopg://postgres:postgres@localhost:5432/bermuda

# Vector DB & Cache
QDRANT_URL=http://localhost:6333
REDIS_URL=redis://localhost:6379/0

# AI/LLM Services
OPENROUTER_API_KEY=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
REPLICATE_API_TOKEN=<your_replicate_token>
```

**⚠️ IMPORTANT:** The OpenRouter key is hardcoded in `nickname-generator.ts` - this needs to move to env vars!

---

## 🐛 Where The Bodies Are Buried

### 1. The Nickname Generation Catastrophe
**Location:** `apps/web/app/onboarding/account-nickname-step.tsx`
**Problem:** When user clicks "Submit Name", it shows "Thinking of a nickname..." forever
**Root Cause:** The handleNameSubmit function never actually calls the API
**The Fix You Need:**
```typescript
// In account-nickname-step.tsx, the handleNameSubmit needs to:
1. Call generateUniqueNickname() from lib/nickname-generator.ts
2. Store the result in state
3. Show the nickname reveal
4. THEN proceed to account creation
```

### 2. Dashboard Data Black Hole
**Location:** `apps/web/app/dashboard/page.tsx`
**Problem:** Shows "—" for all values despite user having data
**Root Cause:** Dashboard isn't reading from AuthContext or user profile
**The Fix:**
```typescript
// Need to pull from useAuth() context:
const { profile } = useAuth();
// Then display: profile.area_sqft, profile.grass_type, etc.
```

### 3. The Great State Management Mess
**What happened:** Started with 9 different localStorage keys, consolidated to 1 (`bb_onboarding`)
**Current structure:**
```javascript
localStorage.bb_onboarding = {
  ageVerified: true,
  location: { city, state, zip, address },
  equipment: { mower, hoc, sprayer, etc },
  status: { issues, concerns },
  account: { nickname, email },
  zones: [ /* map polygons */ ]
}
```

### 4. Authentication Flow Confusion
**The mess:** Login/signup flow is convoluted
- Home page checks for `bb_onboarding_complete` 
- Login sets it to 'true' if user has profile
- But onboarding also sets it, creating conflicts
- No proper logout mechanism

**Clean approach would be:**
1. Use AuthContext as single source of truth
2. Remove localStorage checks from components
3. Add proper user menu with logout

### 5. The OpenRouter API Integration
**Status:** Setup but not wired
**Model:** `openai/gpt-oss-120b` (cheap & powerful)
**Where it's needed:**
- Nickname generation
- Personalized lawn programs
- Smart recommendations

---

## 🚀 Your Mission (Should You Choose to Accept It)

### Priority 1: Fix Nickname Generation (2-3 hours)
1. Create API endpoint `/api/nickname` in FastAPI
2. Wire up the frontend to actually call it
3. Handle the loading/success/error states properly
4. Test with real data flow

### Priority 2: Dashboard Data Display (1-2 hours)
1. Pull user profile from AuthContext
2. Display actual values: area, grass type, equipment
3. Add loading states for weather data
4. Wire up weather API calls

### Priority 3: User Menu & Logout (1 hour)
1. Add dropdown menu to the nickname button
2. Include: Profile, Settings, Logout options
3. Implement signOut from AuthContext

### Priority 4: Weather Integration (2-3 hours)
1. Hook up OpenMeteo API calls
2. Display real weather data
3. Make OK-to-Spray functional
4. Add proper error handling

### Priority 5: Complete Testing (2 hours)
1. Fix hydration errors
2. Add proper error boundaries
3. Test full onboarding flow
4. Verify data persistence

---

## 💪 Words of Encouragement

Look, I'll level with you - this codebase is like a lawn in August without water. It's struggling, but it's not dead. The bones are good. The architecture is sound. The vision is clear.

What you have here is a genuine opportunity to build something lawn nerds will actually love. The previous engineer (me) couldn't crack the nickname generation issue - kept getting distracted by other fires. But you? You're fresh. You'll see what I missed.

The hardest parts are already done:
- Auth is working (mostly)
- Database schema is solid
- UI looks professional
- The sarcastic tone is *chef's kiss*

You just need to connect the dots. The nickname generation is probably something stupidly simple - like a missing await or wrong URL. The dashboard data? It's all there in the profile, just needs to be displayed.

Remember:
- Test user: test@test.com / abc123
- Dev servers: API on 8000, Web on 3001
- When in doubt, check the console
- Bud would want you to succeed (while judging your HOC)

---

## 🛠️ Helpful Commands

```bash
# Start everything
pnpm dev --port 3001  # Frontend
uvicorn apps.api.main:app --reload --port 8000  # Backend

# Database
docker compose -f infra/docker-compose.yml up -d
alembic upgrade head  # Run migrations

# Testing  
pnpm -w e2e:test  # Playwright tests
pytest -q apps/api  # API tests

# Check what's running
docker ps
lsof -i :3001  # Check frontend port
lsof -i :8000  # Check backend port
```

---

## 🎭 The Personality of Bud

This is crucial - Bud makes or breaks the app. He's:
- A mix of Hank Hill and Red Foreman
- Gives tough love about lawn care
- Makes dad jokes about grass
- Never swears but implies disappointment
- Treats lawn care like a moral imperative

Example good Bud quotes:
- "A sharp blade is like a good marriage - requires maintenance but cuts clean."
- "Your bermuda's thirstier than a dad at a little league game."
- "Nice stripes, if you're into the whole 'trying' thing."

---

## 📞 Who to Call

Since I'm moving on to my new role, here's who can help:

- **Supabase Issues:** Their Discord is actually helpful
- **OpenRouter API:** Check their docs, the model name is critical
- **Mapbox:** Extensive docs, search everything
- **FastAPI:** Fantastic community, great docs

---

## Final Thoughts

You're inheriting a project with massive potential. It's not perfect - hell, it's barely functional in some areas. But the users who've seen it love the concept. They want Bud to roast their lawns. They want accurate spray windows. They want to track their applications.

Focus on making it WORK first, then make it NICE. The fancy features can wait. Get that nickname generation running, show real data on the dashboard, and you'll have a usable app.

And when you finally see some dude's nickname pop up as "FungusAmongUs" or "CrabgrassCarl" and they laugh about it? That's when you'll know you've got something special.

Now go make Bud proud. Or at least less disappointed.

*- Your predecessor who couldn't figure out why the fuck the nickname API wouldn't fire*

P.S. - The error on dashboard about missing program? That's a missing JavaScript file. You'll see it in console. Low priority but annoying.

P.P.S. - If you get the nickname generation working in under an hour, you're better than me. I spent 3 hours on it. Still haunts me.