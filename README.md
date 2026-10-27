# The Switched Sample - Forensic Mystery Investigation

An interactive forensic mystery game where players investigate a laboratory evidence tampering case.

## 🎮 Play the Prototype

**Option 1: Direct HTML File**
Simply open `forensic-mystery-prototype.html` in any modern web browser. No server or build process required!

**Option 2: Development Environment** (When Vite works)
```bash
cd artifacts/mockup-sandbox
pnpm install
pnpm dev
```
Then navigate to: `http://localhost:5173/preview/ForensicMystery`

## 📋 Prototype Features

This minimal viable prototype demonstrates the core gameplay experience with 5 key scenes:

### Scene 1: The Discovery
- Introduction to the case
- Sample label discrepancy revealed
- Evidence collection begins

### Scene 2: Suspect Interviews
- Three suspects with different accounts
- Interactive suspect profile selection
- Statement analysis and note-taking

### Scene 3: Physical Evidence
- Four sample containers with label comparison
- Shoeprint analysis results
- Fingerprint inconclusive notice

### Scene 4: Timeline Analysis
- Five chronological events from access logs
- Timeline contradiction detection
- Account K-02 permission tracking

### Scene 5: Final Verdict
- Three suspect accusation options
- Supporting evidence review
- Correct/incorrect verdict feedback

## 🎨 Design Features

- **Dark forensic lab aesthetic** - Charcoal background with amber accents
- **Progressive scene revelation** - Navigate through investigation step-by-step
- **Case notebook** - Automatic note-taking of discoveries and observations
- **Interactive evidence collection** - Click suspects and evidence to discover clues
- **Timeline validation** - Complete analysis before making accusations
- **Verdict system** - Choose the culprit and receive feedback

## 🎯 Gameplay Flow

1. **Begin Investigation** → Discover label discrepancy
2. **Interview Suspects** → Select and review three suspect statements
3. **Examine Evidence** → Analyze physical samples and forensic results
4. **Review Timeline** → Identify contradictions in access logs
5. **Make Accusation** → Choose suspect and submit verdict

## 🔍 The Correct Solution

The evidence points to **Kabir** as the person who switched the sample:

- ✓ Account K-02 (his account) accessed cabinet at 14:18 (after tray was marked ready at 14:14)
- ✓ Same account changed the register at 14:26 (white → blue label)  
- ✓ His statement contradicted by the timeline (claimed work done before tray ready)
- ✓ Shoeprint pattern matches his recorded footwear

## 📦 What's Included

- `forensic-mystery-prototype.html` - Standalone HTML/JS prototype with Tailwind CSS
- `artifacts/mockup-sandbox/src/components/mockups/ForensicMystery.tsx` - React/TypeScript version (for future development)
- Full shadcn/ui component library integration ready

## 🚀 Next Steps for Full Implementation

To expand this into the complete game described in the case file:

### Additional Scenes & Puzzles
- [ ] Interactive 4x4 Sudoku puzzle for locked cabinet
- [ ] Morse code decoder challenge
- [ ] Drag-and-drop timeline ordering game
- [ ] Digital register version history comparison
- [ ] Evidence board with multi-clue matching

### Enhanced Interactivity
- [ ] Animated scene transitions
- [ ] Document zoom and highlighting
- [ ] Audio feedback for discoveries
- [ ] Progress indicator
- [ ] Hint system

### Backend Integration
- [ ] Score calculation and leaderboard (API already exists at `/api/leaderboard`)
- [ ] User session tracking
- [ ] Completion time recording
- [ ] Retry without restart functionality

### Polish & Accessibility
- [ ] Mobile-responsive design refinements
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Optional sound effects
- [ ] Save progress locally

## 🛠️ Technology Stack

- **Frontend Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Build Tool**: Vite
- **UI Components**: Radix UI primitives
- **Backend**: Express + Drizzle ORM (for leaderboard)

## 📄 License

MIT

---

**Note**: This prototype demonstrates the core investigation flow. The complete game as described in CASE FILE TS-0418 would include all 8 scenes, interactive puzzles, full scoring system, and leaderboard integration.
