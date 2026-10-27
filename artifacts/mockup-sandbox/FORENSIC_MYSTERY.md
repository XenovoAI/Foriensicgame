# Forensic Mystery - The Switched Sample

## 🎮 Interactive Investigation Game

A suspense-driven forensic mystery where players investigate laboratory evidence tampering through 5 progressive scenes.

## ✨ Upgraded Features

### New in This Version

✅ **Timer & Scoring System**
- Live timer tracks investigation duration
- Score calculation: Base 1000 points - time penalty
- Faster solutions = higher scores

✅ **Progress Tracking**
- Visual progress bar shows completion (0% → 100%)
- Scene indicators update dynamically
- Case notebook auto-logs discoveries

✅ **Leaderboard Integration**
- Connects to existing `/api/leaderboard` endpoint
- Top 3 investigators shown on intro screen
- Submit name and score after solving
- Real-time ranking updates

✅ **Enhanced UX**
- Verdict dialog with proper feedback
- Completion screen with score summary
- Restart functionality
- Smooth scene transitions

✅ **Better Evidence Display**
- 4 pieces of evidence tracked
- Progressive evidence discovery
- Visual evidence cards in verdict scene

## 🎯 How to Access

### Via Hosted Mockup Sandbox

The game is already integrated into your hosted project structure:

```
Visit: /__mockup/preview/ForensicMystery
```

The mockup sandbox runs on port 8081 (configured in `.replit-artifact/artifact.toml`).

### File Location

```
artifacts/mockup-sandbox/src/components/mockups/ForensicMystery.tsx
```

## 🏗️ Architecture

### State Management
- **currentScene**: Tracks investigation progress through 6 scenes
- **discoveredEvidence**: Array of evidence IDs collected
- **selectedSuspect**: Player's current suspect selection
- **timelineComplete**: Gate for accessing verdict
- **startTime/elapsedTime**: Timer for scoring
- **leaderboard**: Top scores fetched from API

### API Integration

**GET /api/leaderboard**
```typescript
Response: LeaderboardEntry[]
{
  playerName: string;
  score: number;
  elapsedSeconds: number;
  correctAnswers: number;
}
```

**POST /api/leaderboard**
```typescript
Body: {
  attemptId: string;      // Unique ID
  playerName: string;     // Player name (max 30 chars)
  score: number;          // Calculated score
  elapsedSeconds: number; // Time taken
  correctAnswers: 1 | 0;  // Win/lose
}
Response: Updated LeaderboardEntry[]
```

### Scoring Algorithm

```typescript
Base Score: 1000 points
Time Penalty: 1 point per second (max 600s)
Minimum Score: 100 points

Formula: max(1000 - min(timeInSeconds, 600), 100)

Examples:
- Solve in 2:00 = 880 points
- Solve in 5:00 = 700 points
- Solve in 10:00+ = 400 points
```

## 🎨 Visual Design

### Color Scheme
- **Background**: Dark slate gradient (950 → 900 → 950)
- **Primary**: Amber (#f59e0b, #fbbf24, #fef3c7)
- **Success**: Green (#22c55e)
- **Error**: Red (#dc2626)
- **Neutral**: Slate (300-800)

### Components Used
- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`
- `Button` with variants (default, outline, destructive)
- `Badge` with variants (default, secondary, destructive, outline)
- `Progress` for completion tracking
- `Dialog` for verdict feedback
- `Input` for name entry
- `ScrollArea` for notebook

### Icons (Lucide React)
- `Clock` - Time/timeline
- `Users` - Suspects
- `FileText` - Evidence
- `Trophy` - Leaderboard
- `Timer` - Elapsed time
- `Play` - Start button
- `CheckCircle` - Completed items
- `AlertCircle` - Warnings

## 🎮 Game Flow

```
INTRO (Scene 1)
  ↓ Click "Begin Investigation" → Timer starts
SUSPECTS (Scene 2)
  ↓ Select suspect → Click "Examine Physical Evidence"
EVIDENCE (Scene 3)
  ↓ Review samples → Click "Review Access Timeline"
TIMELINE (Scene 4)
  ↓ Click "Timeline Analysis Complete"
  ↓ Click "Make Final Accusation"
VERDICT (Scene 5)
  ↓ Select Kabir → Click "Submit Final Verdict"
  ↓ Dialog shows "CORRECT VERDICT"
COMPLETE (Scene 6)
  ↓ Enter name → Click "Submit to Leaderboard"
  ↓ See ranking → Click "Start New Investigation"
```

## 🔧 Database Schema

The API uses the following table (already exists):

```typescript
investigatorScoresTable {
  id: serial primary key
  attemptId: text unique not null
  playerName: text not null
  score: integer not null
  elapsedSeconds: integer not null
  correctAnswers: integer not null
  createdAt: timestamp default now()
}
```

## 📝 Case Solution

**Culprit**: Kabir (Project Coordinator)

**Evidence Chain**:
1. ✅ Label Discrepancy: S-17 white → blue
2. ✅ Access Log: K-02 at 14:18 (after tray ready)
3. ✅ Register History: K-02 edited at 14:26
4. ✅ Timeline Contradiction: Kabir's false statement
5. ✅ Shoeprint: Matches Kabir's footwear
6. ✅ Account K-02 = Kabir

## 🚀 Running the Game

### Development
```bash
cd artifacts/mockup-sandbox
pnpm dev
```
Access at: `http://localhost:8081/__mockup/preview/ForensicMystery`

### Production Build
```bash
pnpm build
```

## 📦 Dependencies

All required components are already installed:
- React 19
- TypeScript 5.9
- Tailwind CSS 4
- shadcn/ui components
- Lucide React icons
- Radix UI primitives

## 🎯 Future Enhancements

### Planned Features
- [ ] Sudoku puzzle for cabinet access
- [ ] Morse code decoder challenge
- [ ] Drag-and-drop timeline ordering
- [ ] Multiple difficulty levels
- [ ] Hint system with point penalties
- [ ] Achievement badges
- [ ] Social sharing
- [ ] Mobile gestures
- [ ] Sound effects toggle
- [ ] Dark/light theme toggle

### Backend Enhancements
- [ ] Persistent sessions
- [ ] Player profiles
- [ ] Historical statistics
- [ ] Global leaderboard
- [ ] Weekly challenges

## 📄 License

Part of The-Switched-Sample project - MIT License

---

**Status**: ✅ Fully functional and integrated with hosted project
**Last Updated**: 2025
**Component Path**: `/__mockup/preview/ForensicMystery`
