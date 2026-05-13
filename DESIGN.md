# Midnight Shift
## A street racing idle RPG with neon, grit, and simulated nights

---

## The Pitch

An idle/incremental web game where you build a street racing crew. Races happen while you're away — simulated, not abstracted. Come back to find out who won, who crashed, who's talking shit about your crew on the city's underground message boards. Upgrade your cars, poach rival drivers, claim territory, and chase the one thing that matters: respect on the asphalt.

Inspired by Racing Lagoon (PS1), Wangan Midnight, Initial D, and Mafia Wars if Mafia Wars actually had taste.

---

## The Vibe

**Always night.** Neon bleeding onto wet pavement. Synthwave drifting out of cracked car windows. The city is never fully lit — just pockets of color in the dark: pink neon from a ramen shop, cyan glow from a highway underpass, the red taillight streak of someone who just passed you.

**Not dystopian.** Not "cyberpunk" in the corporate-hellscape sense. This is a city that belongs to the people who drive in it. The crews, the tuners, the midnight mechanics. The grit isn't oppression — it's texture. The neon isn't advertising — it's atmosphere.

**Sound.** City pop at low volume from a Civic's tape deck. The wet hiss of tires on rain-slick roads. A distant siren you don't worry about. The synth bass drop when someone challenges your crew leader.

---

## Core Loop

### 1. Manage Your Crew
- Recruit drivers with different stats (speed, control, aggression, reputation)
- Each driver has a personality and a loyalty meter
- Assign drivers to cars
- Drivers can be poached by rival crews if you neglect them

### 2. Choose Your Races
- The city is a map of territories, each controlled by a rival crew
- Pick a territory, pick a stakes level, set aggression
- Races run on timers (5 min / 30 min / 4 hours / 8 hours depending on type)
- You can watch the race unfold in real-time simulation, or walk away

### 3. Race Simulation
- Not just RNG — actual simulated races with positioning, overtaking, crashes
- Car stats + driver skill + territory conditions = outcome distribution
- Races have dramatic moments: near-misses, last-second passes, engine failures
- Post-race: results screen with highlights, driver reactions, rival crew responses

### 4. Build Your Garage
- Buy cars (JDM classics, Euro imports, American muscle, kei cars, tuners)
- Upgrade parts (engine, tires, suspension, nitro, aero)
- Visual customization (paint, decals, neon underglow, body kits)
- Each car has a class (C, B, A, S) and a personality

### 5. Claim the City
- Win enough races in a territory to weaken the rival crew
- Territory control gives passive income and respect
- Rival crews fight back — they'll challenge your territory
- The goal: own every district by dawn

### 6. Prestige: "New Night"
- Reset your progress for permanent bonuses
- Each New Night: the city rearranges itself, rival crews get tougher, new car classes unlock
- Permanent upgrades carry over: garage space, starting cash, reputation multiplier
- The prestige mechanic IS the game — each night is a fresh run with accumulated advantages

---

## The City

### Districts
| District | Vibe | Road Type | Rival Crew |
|----------|------|-----------|------------|
| **Industrial** | Warehouses, shipping containers, empty lots | Tight corners, debris hazards | The Iron Dogs (muscle cars, brute force) |
| **Downtown** | Skyscrapers, parking garages, neon canyons | Grid streets, traffic weaving | Glass Tigers (Euro imports, precision) |
| **Coastal Highway** | Ocean on one side, cliffs on the other | Long straights, sweeping curves | Salt Devils (tuners, speed-focused) |
| **Mountain Pass** | Winding roads, fog, guardrails | Hairpins, elevation changes | Ridge Runners (rally hybrids, control) |
| **Underground** | Tunnels, subway access, drainage | No visibility, echo, tight | The Hollow Men (anything goes, intimidation) |
| **The Strip** | Clubs, casinos, tourist traps | Wide boulevards, traffic, cops | Velvet Cartel (luxury cars, bought not built) |

### Special Locations
- **Junkyard** — Find rare parts, abandoned cars
- **Midnight Garage** — Your home base. Upgrade your operation.
- **The Message Board** — Crew drama, race challenges, rumors, lore
- **Wangan Terminal** — Long highway loop. No turns. Pure speed. Highest stakes.

---

## Characters

### Your Crew
Drivers aren't stat blocks — they're people. Each has:
- A name and nickname
- A backstory (one paragraph, generated or curated)
- Stats that improve with racing
- A loyalty meter that shifts based on wins, losses, pay, and how you treat them
- Rivalries with specific drivers from other crews
- A car preference (and will perform worse if you stick them in the wrong ride)

### Rival Crew Leaders
Each district's boss has personality, racing style, and dialogue:
- They'll taunt you after losses
- They'll respect you after you beat them fair
- Some can be recruited after you take their territory
- Some will never forgive you

### The City
Background characters: mechanics, parts dealers, info brokers, club owners. The city feels lived-in because people talk. The Message Board updates based on race outcomes.

---

## Technical

### v0: Pure Client-Side
- Single-page app, no backend
- localStorage for save data
- React or vanilla JS with a canvas for race visualization
- Export/import saves as JSON
- Mobile-first responsive

### v1: Optional Server
- Go backend with SQLite (chi router, same stack as MC)
- Account system (optional — local play always works)
- Leaderboards, crew vs crew challenges
- Shared city state (one crew controls downtown on YOUR map, different on MINE)

### Race Simulation
- Discrete time-step simulation (not real-time physics)
- Each "tick": cars adjust position based on stats, road conditions, driver decisions
- Overtaking: speed differential + aggression check
- Crashes: control stat + road hazard + push threshold
- The simulation produces a narrative log that gets rendered as replay

### Visual Style
- Dark background with neon accent colors (pink #ff2d95, cyan #00d4ff, purple #b347ea, amber #ffb800)
- CRT scanlines overlay (toggleable)
- UI: terminal-inspired panels, sharp corners, monospace for data, display font for titles
- Race view: minimalist top-down representation — colored dots on a dark track with neon lane markers
- City map: node-based, connected districts with animated traffic

---

## Features by Priority

### Must Have (v0)
- [ ] Crew management (recruit, assign, view stats)
- [ ] Garage (buy cars, upgrade parts)
- [ ] Race simulation (time-step, with narrative output)
- [ ] City map with 3+ districts
- [ ] Idle progression (races run on timers, crew earns passive income)
- [ ] Prestige system (New Night)
- [ ] Save/load (localStorage)
- [ ] Message Board (generated flavor text based on race outcomes)

### Should Have
- [ ] Driver personalities, rivalries, loyalty
- [ ] Visual customization (paint, decals, neon)
- [ ] Rival crew AI (they challenge you, they upgrade their cars)
- [ ] Special events (midnight tournaments, police crackdowns, street takeovers)
- [ ] Sound (ambient synth, engine sounds for race replay)

### Nice to Have
- [ ] Multiplayer (crew vs crew, shared city state)
- [ ] Mobile app / PWA
- [ ] Car trading between players
- [ ] Race replay viewer (animated top-down)
- [ ] Seasonal events (snow conditions, monsoon season)
- [ ] Import/export crew and car designs

---

## Questions to Resolve

1. **Race viewing:** Full animated replay or just results screen with highlights? v0 should be highlights.
2. **Car realism:** Real car models (licensing) vs. fictional with clear inspirations? Fictional.
3. **Time scale:** How long is a "night"? 24 real hours for a full city takeover? Or shorter for faster loops?
4. **Failure state:** Can you lose? Can a rival crew destroy your garage? Tension needs stakes.
5. **Tone balance:** How much of the "mafia" in Mafia Wars? Intimidation, territory fights, crew violence — or purely racing?
