import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  ArrowRight, AudioLines, BadgeCheck, Biohazard, Check, ChevronRight,
  Clock3, Fingerprint, FlaskConical, Footprints, KeyRound, Lightbulb,
  LockKeyhole, Microscope, RotateCcw, ScanLine, ShieldAlert, Sparkles,
  TriangleAlert, UserRound, Waves, X,
} from 'lucide-react';
import { useGameSession } from './game-session';
import './App.css';

const doorPuzzles = [
  { id: 'sign' as const, label: 'Sign language', number: '01', icon: Fingerprint, prompt: 'The guard left a message in the language of hands.', detail: 'Translate the four ASL letters, shown in order, into the password.', visual: ['01', '02', '03', '04'] },
  { id: 'door-morse' as const, label: 'Morse signal', number: '02', icon: AudioLines, prompt: 'A signal was tapped against the inside of the door.', detail: 'Decode this Morse transmission, then enter the word it spells.', visual: ['---', '.--.', '.', '-.'] },
  { id: 'keyboard' as const, label: 'The keyboard', number: '03', icon: KeyRound, prompt: 'One last lock guards the lab.', detail: 'I have keys, but open no doors. I have space, but no room. What am I?', visual: ['Q', 'W', 'E', 'R', 'T', 'Y'] },
];

const stages = [
  { id: 'door', label: 'Lab access', detail: 'Three locks' },
  { id: 'sample', label: 'Sample tubes', detail: 'Chain of custody' },
  { id: 'sudoku', label: 'Number grid', detail: '4 × 4 analysis' },
  { id: 'evidence', label: 'Evidence match', detail: 'Three suspects' },
  { id: 'message', label: 'Final message', detail: 'Morse transcript' },
  { id: 'final', label: 'Case theory', detail: 'Name the culprit' },
];

const evidenceTypes = ['Fingerprint', 'Shoeprint', 'Blue fabric'] as const;
const suspects = ['Riya', 'Kabir', 'Sana'];
const sudokuClues = ['1', '', '', '4', '', '4', '1', '', '2', '', '4', '', '4', '', '', '1'];
const morseAlphabet = [
  ['A', '.-'], ['B', '-...'], ['C', '-.-.'], ['D', '-..'], ['E', '.'], ['F', '..-.'],
  ['G', '--.'], ['H', '....'], ['I', '..'], ['J', '.---'], ['K', '-.-'], ['L', '.-..'],
  ['M', '--'], ['N', '-.'], ['O', '---'], ['P', '.--.'], ['Q', '--.-'], ['R', '.-.'],
  ['S', '...'], ['T', '-'], ['U', '..-'], ['V', '...-'], ['W', '.--'], ['X', '-..-'],
  ['Y', '-.--'], ['Z', '--..'],
];

type PuzzleId = 'sign' | 'door-morse' | 'keyboard' | 'sample' | 'sudoku' | 'evidence' | 'message';

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function App() {
  const game = useGameSession();
  const [playerName, setPlayerName] = useState(game.playerName ?? '');
  const [answer, setAnswer] = useState('');
  const [sudoku, setSudoku] = useState(sudokuClues);
  const [evidenceMatches, setEvidenceMatches] = useState<Record<string, string>>({});
  const [selectedSuspect, setSelectedSuspect] = useState('');

  const currentDoor = useMemo(() => doorPuzzles.find((puzzle) => !game.solvedPuzzles.includes(puzzle.id)), [game.solvedPuzzles]);
  const activePuzzleId: PuzzleId | null = game.stage === 'door'
    ? (currentDoor?.id ?? null)
    : game.stage === 'sample' || game.stage === 'sudoku' || game.stage === 'evidence' || game.stage === 'message'
      ? game.stage
      : null;

  useEffect(() => {
    setAnswer('');
    if (activePuzzleId === 'sudoku') setSudoku(sudokuClues);
    if (activePuzzleId === 'evidence') setEvidenceMatches({});
  }, [activePuzzleId]);

  const stepIndex = stages.findIndex((item) => item.id === game.stage);
  const feedback = game.feedback;

  function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activePuzzleId) return;
    const payload = activePuzzleId === 'sudoku' ? sudoku.join('') : activePuzzleId === 'evidence'
      ? evidenceTypes.map((type) => evidenceMatches[type] ?? '').join(',')
      : answer.trim();
    game.submit(activePuzzleId, payload);
  }

  function submitEvidence() {
    const payload = evidenceTypes.map((type) => evidenceMatches[type] ?? '').join(',');
    game.submit('evidence', payload);
  }

  function requestHint() {
    if (activePuzzleId) game.requestHint(activePuzzleId);
  }

  function updateSudoku(index: number, value: string) {
    if (!/^[1-4]?$/.test(value)) return;
    setSudoku((current) => current.map((cell, cellIndex) => cellIndex === index ? value : cell));
  }

  function startGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = playerName.trim();
    if (cleanName) game.start(cleanName);
  }

  function chooseCulprit(name: string) {
    setSelectedSuspect(name);
    game.chooseSuspect(name);
  }

  const current = currentDoor;
  const title = game.stage === 'door' ? 'The lab doors' :
    game.stage === 'sample' ? 'A sample out of place' :
    game.stage === 'sudoku' ? 'The analyst’s grid' :
    game.stage === 'evidence' ? 'Three traces' :
    game.stage === 'message' ? 'A message in the static' : 'Your case theory';
  const eyebrow = game.stage === 'door' ? 'ACCESS SEQUENCE · 03 LOCKS' :
    game.stage === 'sample' ? 'EVIDENCE BAY · TUBE ANALYSIS' :
    game.stage === 'sudoku' ? 'FORENSIC DESK · PATTERN ANALYSIS' :
    game.stage === 'evidence' ? 'TRACE LAB · COMPARATIVE ANALYSIS' :
    game.stage === 'message' ? 'RECOVERED TRANSMISSION · MORSE' : 'INTERROGATION ROOM · FINAL DECISION';

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" data-testid="link-home">
          <span className="brand-mark"><FlaskConical size={19} strokeWidth={1.7} /></span>
          <span className="brand-name">NORTHWELL <b>FORENSICS</b></span>
        </a>
        <div className="case-ref"><span className="live-dot" /> CASE FILE <strong>TS–0418</strong></div>
        <div className="topbar-right">
          {game.playerName && <span className="investigator-name" data-testid="text-player-name"><UserRound size={14} /> {game.playerName}</span>}
          <span className="topbar-divider" />
          <span className="lab-status"><span className="status-light" /> SECURE SESSION</span>
        </div>
      </header>

      {game.stage === 'welcome' ? (
        <Welcome
          playerName={playerName}
          setPlayerName={setPlayerName}
          onStart={startGame}
          leaderboard={game.leaderboard}
        />
      ) : game.stage === 'solved' ? (
        <Solved game={game} onRestart={game.restart} />
      ) : (
        <div className="investigation-layout">
          <aside className="case-rail">
            <div className="rail-case">
              <div className="case-label"><span>ACTIVE INVESTIGATION</span><span className="case-stamp">OPEN</span></div>
              <h2>The Switched<br />Sample</h2>
              <p>One vial was exchanged before the evidence reached the lab.</p>
              <div className="case-meta"><span>FILE NO.</span><strong>TS–0418</strong></div>
            </div>
            <div className="rail-section-label">INVESTIGATION PATH</div>
            <nav className="step-list" aria-label="Investigation progress">
              {stages.map((item, index) => {
                const done = index < stepIndex;
                const active = index === stepIndex;
                return <div className={`step-item ${active ? 'is-active' : ''} ${done ? 'is-done' : ''}`} key={item.id} data-testid={`step-${item.id}`}>
                  <span className="step-indicator">{done ? <Check size={13} /> : String(index + 1).padStart(2, '0')}</span>
                  <span className="step-copy"><b>{item.label}</b><small>{item.detail}</small></span>
                  {active && <ChevronRight size={14} className="step-chevron" />}
                </div>;
              })}
            </nav>
            <div className="rail-footer">
              <span className="rail-footer-icon"><Microscope size={16} /></span>
              <span><b>Evidence is fragile.</b><small>Observe before you conclude.</small></span>
            </div>
          </aside>

          <section className="main-investigation">
            <div className="metrics-strip">
              <Metric icon={<Clock3 size={15} />} label="ELAPSED" value={formatTime(game.elapsedSeconds)} testId="value-elapsed-time" />
              <Metric icon={<Sparkles size={15} />} label="CASE SCORE" value={String(game.score).padStart(4, '0')} testId="value-score" />
              <Metric icon={<BadgeCheck size={15} />} label="CORRECT" value={String(game.correctAnswers)} testId="value-correct-count" />
              <Metric icon={<TriangleAlert size={15} />} label="MISSTEPS" value={String(game.mistakes)} testId="value-mistakes" />
            </div>

            <div className="workbench">
              <div className="workbench-heading">
                <div>
                  <div className="eyebrow"><span className="eyebrow-line" />{eyebrow}</div>
                  <h1 data-testid="heading-active-puzzle">{title}</h1>
                  <p className="case-narrative">The evidence room is sealed. Work through each finding; every detail matters.</p>
                </div>
                <div className="lab-seal"><ScanLine size={27} /><span>LAB<br />04</span></div>
              </div>

              {game.stage === 'door' && current && <PuzzleCard puzzle={current} answer={answer} setAnswer={setAnswer} onSubmit={submitAnswer} onHint={requestHint} />}
              {game.stage === 'sample' && <div className="puzzle-panel">
                <div className="puzzle-intro"><div className="puzzle-icon"><FlaskConical size={20} /></div><div><h2>Three tubes arrived with labels that cannot all be trusted.</h2><p>Use the collection record and seal clues to identify the genuine sample.</p></div></div>
                <div className="tube-record" data-testid="table-tube-record">
                  <div className="tube-record-head"><span>CHAIN OF CUSTODY / RECEIVING LOG</span><span>ROOM 04</span></div>
                  <div className="tube-row tube-header"><span>TUBE</span><span>COLLECTED</span><span>SEAL</span><span>LABEL</span></div>
                  {[['A', '09:10', 'Blue', 'Omega'], ['B', '09:15', 'Silver', 'Delta'], ['C', '09:20', 'Red', 'Alpha']].map((tube) => <div className="tube-row" key={tube[0]} data-testid={`row-tube-${tube[0].toLowerCase()}`}>
                    <b>{tube[0]}</b><span className="mono-value">{tube[1]}</span><span className={`seal seal-${tube[2].toLowerCase()}`}><i />{tube[2]}</span><span>{tube[3]}</span>
                  </div>)}
                </div>
                <div className="clue-list" data-testid="list-sample-clues">
                  <div><span>01</span><p>The genuine sample is <b>not blue-sealed.</b></p></div>
                  <div><span>02</span><p>The genuine sample was collected at <b>09:15.</b></p></div>
                  <div><span>03</span><p>The red-sealed sample was collected <b>after</b> the genuine sample.</p></div>
                </div>
                <form onSubmit={submitAnswer}>
                  <label className="field-label" htmlFor="answer-sample">WHICH TUBE IS GENUINE? <span>REQUIRED</span></label>
                  <div className="answer-field-wrap"><input id="answer-sample" data-testid="input-answer-sample" autoComplete="off" placeholder="Enter tube A, B, or C…" value={answer} onChange={(event) => setAnswer(event.target.value)} /><span className="field-flag"><ScanLine size={16} /></span></div>
                  <div className="form-actions"><button className="button-primary" type="submit" data-testid="button-submit-sample">Submit finding <ArrowRight size={16} /></button><button className="button-quiet" type="button" onClick={requestHint} data-testid="button-hint-sample"><Lightbulb size={15} /> Request a hint</button></div>
                </form>
              </div>}
              {game.stage === 'sudoku' && <div className="puzzle-panel sudoku-panel">
                <div className="puzzle-intro"><div className="puzzle-icon"><ScanLine size={20} /></div><div><h2>Reconstruct the missing sequence</h2><p>Each row, column, and 2 × 2 box must contain 1–4 exactly once.</p></div></div>
                <form onSubmit={submitAnswer}>
                  <div className="sudoku-grid" role="group" aria-label="4 by 4 Sudoku input" data-testid="grid-sudoku">
                    {sudoku.map((cell, index) => {
                      const fixed = sudokuClues[index] !== '';
                      return <input
                        key={index}
                        aria-label={`Sudoku row ${Math.floor(index / 4) + 1}, column ${(index % 4) + 1}`}
                        data-testid={`input-sudoku-cell-${index}`}
                        className={`${index % 4 === 1 ? 'block-right' : ''} ${Math.floor(index / 4) === 1 ? 'block-bottom' : ''} ${fixed ? 'given' : ''}`}
                        value={cell}
                        onChange={(event) => updateSudoku(index, event.target.value)}
                        readOnly={fixed}
                        inputMode="numeric"
                        maxLength={1}
                      />;
                    })}
                  </div>
                  <div className="sudoku-caption"><span><b>GRID 01</b> / 04 × 04</span><span>{sudoku.filter(Boolean).length} / 16 CELLS</span></div>
                  <div className="form-actions"><button className="button-primary" type="submit" data-testid="button-submit-sudoku">Verify sequence <ArrowRight size={16} /></button><button className="button-quiet" type="button" onClick={requestHint} data-testid="button-hint-sudoku"><Lightbulb size={15} /> Request a hint</button></div>
                </form>
                <span className="answer-format-note">Enter all 16 cells, left to right, top to bottom.</span>
              </div>}
              {game.stage === 'evidence' && <div className="puzzle-panel evidence-panel">
                <div className="puzzle-intro"><div className="puzzle-icon"><Fingerprint size={20} /></div><div><h2>Match each trace to a suspect</h2><p>Compare the recovered traces against the three reference profiles.</p></div></div>
                <div className="suspect-reference">
                  {suspects.map((suspect, index) => <div className="suspect-chip" key={suspect} data-testid={`suspect-reference-${suspect.toLowerCase()}`}><span className="suspect-number">0{index + 1}</span><b>{suspect}</b><small>REFERENCE PROFILE</small></div>)}
                </div>
                <div className="analysis-notes" data-testid="list-analysis-notes">
                  <div><span>01 / DUSTED PRINT</span><p>The cabinet-door fingerprint belongs to <b>Riya.</b></p></div>
                  <div><span>02 / SOLE CAST</span><p>The size-9 boot tread belongs to <b>Kabir.</b></p></div>
                  <div><span>03 / FIBER DYE</span><p>The blue fibers match <b>Sana’s jacket.</b></p></div>
                </div>
                <div className="evidence-map">
                  {evidenceTypes.map((item, index) => {
                    const Icon = index === 0 ? Fingerprint : index === 1 ? Footprints : Waves;
                    return <label className="evidence-row" key={item} data-testid={`row-evidence-${index}`}>
                      <span className="evidence-art"><Icon size={20} /></span><span className="evidence-name"><b>{item}</b><small>TRACE 0{index + 1}</small></span>
                      <span className="evidence-arrow">→</span>
                      <select aria-label={`Match ${item}`} data-testid={`select-evidence-${index}`} value={evidenceMatches[item] ?? ''} onChange={(event) => setEvidenceMatches((current) => ({ ...current, [item]: event.target.value }))}>
                        <option value="">Select profile</option>{suspects.map((suspect) => <option key={suspect} value={suspect}>{suspect}</option>)}
                      </select>
                    </label>;
                  })}
                </div>
                <div className="form-actions"><button className="button-primary" type="button" onClick={submitEvidence} data-testid="button-submit-evidence">Submit matches <ArrowRight size={16} /></button><button className="button-quiet" type="button" onClick={requestHint} data-testid="button-hint-evidence"><Lightbulb size={15} /> Request a hint</button></div>
              </div>}
              {game.stage === 'message' && <PuzzleCard
                puzzle={{ id: 'message', label: 'Morse transmission', number: '08', icon: AudioLines, prompt: 'A final transmission was recovered from the lab terminal.', detail: 'Decode the message and enter the name it spells.', visual: ['-.-', '.-', '-...', '..', '.-.'] }}
                answer={answer} setAnswer={setAnswer} onSubmit={submitAnswer} onHint={requestHint}
              />}
              {game.stage === 'final' && <div className="puzzle-panel final-panel">
                <div className="puzzle-intro"><div className="puzzle-icon"><ShieldAlert size={20} /></div><div><h2>Who switched the sample?</h2><p>Review your findings. Name the person whose story no longer fits.</p></div></div>
                <div className="culprit-options">
                  {suspects.map((suspect, index) => <button className={`culprit-option ${selectedSuspect === suspect ? 'selected' : ''}`} key={suspect} onClick={() => chooseCulprit(suspect)} data-testid={`button-suspect-${suspect.toLowerCase()}`}>
                    <span className="culprit-index">0{index + 1}</span><span className="culprit-info"><b>{suspect}</b><small>PERSON OF INTEREST</small></span><span className="radio-mark">{selectedSuspect === suspect && <span />}</span>
                  </button>)}
                </div>
                <div className="final-note"><LockKeyhole size={15} /><span>Your conclusion will close this case file.</span></div>
              </div>}

              {feedback && <div className={`feedback-banner feedback-${feedback.type}`} role="status" data-testid="status-feedback">
                <span className="feedback-symbol">{feedback.type === 'success' ? <Check size={17} /> : feedback.type === 'hint' ? <Lightbulb size={17} /> : <X size={17} />}</span>
                <span>{feedback.message}</span>
                <button type="button" aria-label="Dismiss feedback" onClick={game.clearFeedback} data-testid="button-dismiss-feedback"><X size={15} /></button>
              </div>}
            </div>
            <div className="bottom-note"><span className="bottom-note-line" /> NORTHWELL FORENSIC SERVICES <span>·</span> INTERNAL CASEWORK <span className="bottom-right">TS–0418 / FIELD LOG</span></div>
          </section>
        </div>
      )}
    </main>
  );
}

function Metric({ icon, label, value, testId }: { icon: ReactNode; label: string; value: string; testId: string }) {
  return <div className="metric" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>
    <span className="metric-icon">{icon}</span><span className="metric-label">{label}</span><strong data-testid={testId}>{value}</strong>
  </div>;
}

function PuzzleCard({ puzzle, answer, setAnswer, onSubmit, onHint }: {
  puzzle: { id: PuzzleId; label: string; number: string; icon: typeof Fingerprint; prompt: string; detail: string; visual: string[] };
  answer: string;
  setAnswer: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onHint: () => void;
}) {
  const Icon = puzzle.icon;
  return <div className="puzzle-panel">
    <div className="puzzle-intro"><div className="puzzle-icon"><Icon size={20} /></div><div><h2>{puzzle.prompt}</h2><p>{puzzle.detail}</p></div></div>
    <div className={`clue-visual clue-${puzzle.id}`} data-testid={`visual-${puzzle.id}`}>
      {puzzle.id === 'keyboard'
        ? <div className="keyboard-keys" aria-label="A keyboard with one long unlabeled key">{puzzle.visual.map((key, index) => <span key={key} className={index === 2 ? 'key-space' : ''}>{key}</span>)}<span className="key-wide" aria-hidden="true" /></div>
        : puzzle.id === 'sign'
          ? <div className="gesture-sequence">{puzzle.visual.map((gesture, index) => <div key={index} className="gesture-card"><SignGlyph index={index} /><small>ASL LETTER {gesture}</small></div>)}</div>
          : <div className="morse-sequence">{puzzle.visual.map((signal, index) => <span className="morse-group" key={index}>{signal}</span>)}</div>}
      <span className="visual-label">{puzzle.label.toUpperCase()} / REF {puzzle.number}</span>
    </div>
    {(puzzle.id === 'door-morse' || puzzle.id === 'message') && <details className="morse-reference" data-testid="details-morse-reference">
      <summary>Open Morse alphabet reference</summary>
      <div className="morse-reference-grid">
        {morseAlphabet.map(([letter, code]) => <span key={letter}><b>{letter}</b><code>{code}</code></span>)}
      </div>
    </details>}
    <form onSubmit={onSubmit}>
      <label className="field-label" htmlFor={`answer-${puzzle.id}`}>YOUR ENTRY <span>REQUIRED</span></label>
      <div className="answer-field-wrap"><input id={`answer-${puzzle.id}`} data-testid={`input-answer-${puzzle.id}`} autoComplete="off" placeholder="Enter your answer…" value={answer} onChange={(event) => setAnswer(event.target.value)} /><span className="field-flag"><ScanLine size={16} /></span></div>
      <div className="form-actions"><button className="button-primary" type="submit" data-testid={`button-submit-${puzzle.id}`}>Submit finding <ArrowRight size={16} /></button><button className="button-quiet" type="button" onClick={onHint} data-testid={`button-hint-${puzzle.id}`}><Lightbulb size={15} /> Request a hint</button></div>
    </form>
    <div className="puzzle-footnote"><span><Biohazard size={13} /></span> Findings are recorded as you work.</div>
  </div>;
}

function SignGlyph({ index }: { index: number }) {
  const handPaths = [
    'M18 45 L18 30 C18 26 22 25 24 29 L27 34 L27 14 C27 9 33 9 33 14 L33 31 C34 26 40 26 40 31 L40 34 C42 30 47 32 46 37 L43 45 C41 50 36 52 29 52 L23 52 Z M18 31 C12 26 8 20 9 17 C10 14 13 15 16 19 L23 26',
    'M20 45 L20 30 C20 26 26 26 26 30 L26 16 C26 11 32 11 32 16 L32 28 C33 24 39 25 39 29 L39 34 C42 30 47 32 46 37 L43 45 C41 50 36 52 29 52 L25 52 Z M20 31 L12 22 C9 19 5 22 8 26 L18 38',
    'M18 45 L18 30 C18 26 24 26 24 30 L24 14 C24 9 30 9 30 14 L30 29 L30 15 C30 10 36 10 36 15 L36 30 C37 26 43 27 43 32 L43 37 C43 45 39 52 31 52 L24 52 Z M18 32 L12 27 C9 25 6 29 9 32 L18 41',
    'M19 45 L19 31 C19 27 25 27 25 31 L25 22 C25 17 31 17 31 22 L31 29 C32 25 38 26 38 31 L38 34 C41 31 46 33 45 38 L42 46 C40 50 35 52 29 52 L24 52 Z M19 32 L14 28 C11 26 8 30 11 33 L19 41 M24 25 L20 19 C18 16 21 13 24 16',
  ];
  return <svg className={`sign-glyph sign-glyph-${index + 1}`} viewBox="0 0 56 56" aria-hidden="true" data-testid={`illustration-asl-${index + 1}`}>
    <path d={handPaths[index]} fill="rgba(139,200,172,.12)" stroke="#8bc8ac" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

function Welcome({ playerName, setPlayerName, onStart, leaderboard }: {
  playerName: string;
  setPlayerName: (name: string) => void;
  onStart: (event: FormEvent<HTMLFormElement>) => void;
  leaderboard: { playerName: string; score: number; elapsedSeconds: number; correctAnswers: number }[];
}) {
  return <div className="welcome-layout">
    <section className="welcome-hero">
      <div className="hero-ambient"><div className="orb orb-one" /><div className="orb orb-two" /><div className="hero-rings" /></div>
      <div className="hero-content">
        <div className="eyebrow"><span className="eyebrow-line" /> FORENSIC CASE FILE · 0418</div>
        <div className="hero-title-wrap"><p className="hero-kicker">THE NORTHWELL INCIDENT</p><h1>The Switched<br /><em>Sample</em></h1></div>
        <p className="hero-description">A sealed evidence vial was exchanged before it reached the lab. Six traces. Three suspects. One detail that changes everything.</p>
        <div className="hero-stats"><span><b>06</b> INVESTIGATION STAGES</span><i /><span><b>03</b> PERSONS OF INTEREST</span><i /><span><b>01</b> CORRECT THEORY</span></div>
        <div className="hero-stamp"><ScanLine size={25} /><span>CASE<br />0418</span></div>
      </div>
    </section>
    <aside className="welcome-side">
      <div className="welcome-start">
        <div className="panel-overline"><span className="status-light" /> FILE READY FOR REVIEW</div>
        <h2>Begin your<br />investigation.</h2>
        <p>Every clue is in the record. Take your time; accuracy counts.</p>
        <form onSubmit={onStart}>
          <label className="field-label" htmlFor="player-name">INVESTIGATOR NAME <span>LOCAL RECORD</span></label>
          <div className="answer-field-wrap"><input id="player-name" data-testid="input-player-name" value={playerName} onChange={(event) => setPlayerName(event.target.value)} maxLength={24} placeholder="Enter your name" autoComplete="name" /><span className="field-flag"><UserRound size={16} /></span></div>
          <button className="button-primary start-button" type="submit" disabled={!playerName.trim()} data-testid="button-start-investigation">Open case file <ArrowRight size={17} /></button>
        </form>
        <div className="privacy-note"><LockKeyhole size={13} /> Your results stay on this device.</div>
      </div>
      <Leaderboard leaderboard={leaderboard} />
    </aside>
  </div>;
}

function Leaderboard({ leaderboard }: { leaderboard: { playerName: string; score: number; elapsedSeconds: number; correctAnswers: number }[] }) {
  const topThree = [...leaderboard].sort((a, b) => b.score - a.score || a.elapsedSeconds - b.elapsedSeconds).slice(0, 3);
  return <div className="leaderboard" data-testid="leaderboard">
    <div className="leaderboard-heading"><div><span className="panel-overline">LOCAL RECORDS</span><h3>Best investigators</h3></div><span className="leaderboard-mark"><BadgeCheck size={17} /></span></div>
    {topThree.length ? <div className="leaderboard-rows">{topThree.map((entry, index) => <div className="leader-row" key={`${entry.playerName}-${index}`} data-testid={`leaderboard-row-${index}`}>
      <span className={`rank rank-${index + 1}`}>{String(index + 1).padStart(2, '0')}</span><span className="leader-name"><b>{entry.playerName}</b><small>{entry.correctAnswers} CORRECT · {formatTime(entry.elapsedSeconds)}</small></span><strong>{entry.score.toLocaleString()}<small>PTS</small></strong>
    </div>)}</div> : <div className="leaderboard-empty" data-testid="leaderboard-empty"><span className="empty-dash">—</span><span>No case files closed yet.<br />Set the first record.</span></div>}
    <div className="leaderboard-foot"><span>TOP THREE</span><span>THIS DEVICE ONLY</span></div>
  </div>;
}

function Solved({ game, onRestart }: { game: ReturnType<typeof useGameSession>; onRestart: () => void }) {
  return <div className="solved-layout">
    <section className="solved-card">
      <div className="solved-stamp"><Check size={24} /></div>
      <div className="eyebrow"><span className="eyebrow-line" /> CASE CLOSED · TS–0418</div>
      <p className="solved-kicker">INVESTIGATION COMPLETE</p>
      <h1>The evidence<br /><em>held up.</em></h1>
      <p className="solved-copy">Kabir switched the sample. The shoeprint match and access time support the verdict. The lab record is complete, and your conclusion has been filed.</p>
      <div className="solved-metrics">
        <div><span>FINAL SCORE</span><b data-testid="value-final-score">{game.score.toLocaleString()}</b></div>
        <div><span>TIME ON CASE</span><b data-testid="value-final-time">{formatTime(game.elapsedSeconds)}</b></div>
        <div><span>CORRECT FINDINGS</span><b data-testid="value-final-correct">{game.correctAnswers}</b></div>
      </div>
      <button className="button-primary" type="button" onClick={onRestart} data-testid="button-restart"><RotateCcw size={15} /> Start another investigation</button>
    </section>
    <aside className="solved-records"><Leaderboard leaderboard={game.leaderboard} /><div className="closing-note"><span className="closing-line" /> NORTHWELL FORENSIC SERVICES<br /><small>INTERNAL CASEWORK / TS–0418</small></div></aside>
  </div>;
}

export default App;
