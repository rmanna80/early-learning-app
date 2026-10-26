# Early Learning App

A free, offline-first learning app for children around age 3. Nothing about the child leaves the device.

## What exists so far

| Part | Status |
| --- | --- |
| Expo SDK 58 app (React Native 0.88, TypeScript) | `App.tsx` shows a temporary recommender preview screen |
| `src/core/content` | Activity types and a catalog checker |
| `src/content/catalog.ts` | Metadata for the 24 MVP activities (pending educator review) |
| `src/core/recommender` | Rule-based recommender with parent-facing reasons |
| `src/dev/scenarios.ts` | Fake play histories for the preview screen (delete with it later) |
| Tests | 35 passing (`npm test`), including a render test of the preview screen |
| Screens, activity engine, audio, SQLite, dashboard | Not started |

## Set up on Windows (PowerShell)

Needs Node.js 22.13 or newer (`node --version`) and Git. Keep the project **outside OneDrive**: synced folders interfere with `node_modules` and file replacements.

```powershell
New-Item -ItemType Directory -Force C:\dev | Out-Null
Set-Location C:\dev
git clone https://github.com/rmanna80/early-learning-app.git
Set-Location C:\dev\early-learning-app
npm install
npm test            # runs all tests
npm run typecheck   # TypeScript check
npx expo start      # dev server; scan the QR code with Expo Go
```

## Getting updates

New work arrives as commits on GitHub. To bring your copy up to date:

```powershell
Set-Location C:\dev\early-learning-app
git pull
npm install         # only changes anything when package.json changed
npm test
```

Commit or stash your own local changes before pulling.

Always add Expo packages with `npx expo install <package>` so versions match SDK 58.

## How the code is organized

`src/core` is plain TypeScript. It never imports React, Expo, or anything else from the app, so it runs in Node and its tests take about a second. Screens and storage depend on the core; the core depends on nothing.

```
src/
  core/
    content/        types.ts (what an activity is), validateCatalog.ts
    progress/       types.ts (what a play session records)
    recommender/    rules.ts (every threshold), reasons.ts (parent sentences), engine.ts
  content/
    catalog.ts      the 24 activities
```

## How the recommender decides

`recommend()` is a pure function: give it the catalog, the session history, the age band and the current time; it returns up to 3 suggestions (the first is highlighted on the child's home screen) and notes for the parent dashboard. It never locks an activity.

| Situation | What it suggests | Reason code |
| --- | --- | --- |
| Last 2 tries at one level needed extra help (answer activities only) | Same activity, one level simpler | `try-easier` |
| …and it was already the simplest level | Rests it for 3 days; offers another activity with a shared skill and a different interaction | `different-way` |
| Last 2 tries went smoothly (≥80% right first time, ≤1 hint) | Same activity, one level harder | `gentle-challenge` |
| Every suggested-after activity was finished | The new activity that builds on them | `next-step` |
| The child chose 2+ activities in one area this week | A new activity from that area | `follows-interest` |
| Not played for over 7 days | Play it again | `revisit` |
| Never played | Try it | `new-to-explore` |
| Left early twice in a row | Rests it for 3 days (not treated as difficulty) | note: `rest-left-early` |

Also: one try never changes a level; speed is ignored; feelings activities are never scored; the activity just played is never suggested next; areas explored least this week get a small boost, and the parent is told so. All numbers live in `src/core/recommender/rules.ts`.

If you want to write the engine yourself: keep `rules.ts`, `reasons.ts` and the tests, delete the body of `recommend()` in `engine.ts`, and make the tests pass again. The tests describe every behavior in plain words.
