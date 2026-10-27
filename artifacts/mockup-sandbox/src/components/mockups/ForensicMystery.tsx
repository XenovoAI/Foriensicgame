import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, BookOpen, CheckCircle, Clock, FileText, Users, Trophy, Timer, Play, Lock, Code, ArrowUpDown, History, BarChart3, Target, Search, ZoomIn, Highlighter, FileCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Scene = 'intro' | 'suspects' | 'evidence' | 'puzzle' | 'timeline' | 'register' | 'verdict' | 'complete';
type Suspect = 'riya' | 'sana' | 'kabir' | null;

interface Evidence {
  id: string;
  name: string;
  description: string;
}

interface TimelineEvent {
  id: string;
  time: string;
  event: string;
}

interface LeaderboardEntry {
  playerName: string;
  score: number;
  elapsedSeconds: number;
  correctAnswers: number;
}

interface GameAnalytics {
  totalPlays: number;
  averageTime: number;
  successRate: number;
  averageScore: number;
}

// Define timeline events before component to avoid circular reference
const timelineEvents: TimelineEvent[] = [
  { id: '1', time: '14:05', event: 'Riya signs the tray preparation sheet' },
  { id: '2', time: '14:10', event: 'Sana records that S-17\'s label looks newer' },
  { id: '3', time: '14:14', event: 'Demonstration tray marked ready' },
  { id: '4', time: '14:18', event: 'Account K-02 accesses storage cabinet' },
  { id: '5', time: '14:26', event: 'Digital register exported with S-17 label changed' }
];

export default function ForensicMystery() {
  const [currentScene, setCurrentScene] = useState<Scene>('intro');
  const [discoveredEvidence, setDiscoveredEvidence] = useState<string[]>([]);
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect>(null);
  const [timelineComplete, setTimelineComplete] = useState(false);
  const [caseNotebook, setCaseNotebook] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showVerdictDialog, setShowVerdictDialog] = useState(false);
  const [isCorrectVerdict, setIsCorrectVerdict] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analytics, setAnalytics] = useState<GameAnalytics | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [sudokuSolved, setSudokuSolved] = useState(false);
  const [morseDecoded, setMorseDecoded] = useState(false);
  const [timelineOrdered, setTimelineOrdered] = useState(false);
  const [sudokuGrid, setSudokuGrid] = useState<(number | null)[][]>([
    [null, 2, null, 4],
    [3, null, 2, null],
    [null, 3, null, 2],
    [2, null, 4, null]
  ]);
  const [morseInput, setMorseInput] = useState('');
  const [draggedEvents, setDraggedEvents] = useState<TimelineEvent[]>([...timelineEvents]);
  const [zoomedDocument, setZoomedDocument] = useState<string | null>(null);
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
  const [foundDiscrepancies, setFoundDiscrepancies] = useState(0);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);
  const [examinedSamples, setExaminedSamples] = useState<string[]>([]);
  const [draggedEvent, setDraggedEvent] = useState<TimelineEvent | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [comparedVersions, setComparedVersions] = useState<number[]>([]);
  const [discoveredRegisterEvidence, setDiscoveredRegisterEvidence] = useState(false);

  const evidenceList: Record<string, Evidence> = {
    'label-discrepancy': {
      id: 'label-discrepancy',
      name: 'Label Discrepancy',
      description: 'Sample S-17 shows white label in original notes, blue label in digital register.'
    },
    'access-log': {
      id: 'access-log',
      name: 'Access Log Entry',
      description: 'Account K-02 accessed storage cabinet at 14:18, after tray was marked ready at 14:14.'
    },
    'register-history': {
      id: 'register-history',
      name: 'Register Version History',
      description: 'Digital register changed from white to blue label at 14:26 under account K-02.'
    },
    'shoeprint': {
      id: 'shoeprint',
      name: 'Shoeprint Match',
      description: 'Shoeprint pattern consistent with Kabir\'s recorded footwear.'
    },
    'torn-label': {
      id: 'torn-label',
      name: 'Torn Blue Label Fragment',
      description: 'Blue label fragment found with torn edge, consistent with S-17 label.'
    }
  };

  // Timer effect
  useEffect(() => {
    if (startTime && currentScene !== 'complete') {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, currentScene]);

  // Fetch leaderboard and analytics
  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/leaderboard');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
        calculateAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  const calculateAnalytics = (data: LeaderboardEntry[]) => {
    if (data.length === 0) {
      setAnalytics(null);
      return;
    }

    const totalPlays = data.length;
    const successfulPlays = data.filter(entry => entry.correctAnswers > 0).length;
    const totalTime = data.reduce((sum, entry) => sum + entry.elapsedSeconds, 0);
    const totalScore = data.reduce((sum, entry) => sum + entry.score, 0);

    setAnalytics({
      totalPlays,
      averageTime: Math.round(totalTime / totalPlays),
      successRate: Math.round((successfulPlays / totalPlays) * 100),
      averageScore: Math.round(totalScore / totalPlays)
    });
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = (correct: boolean, timeInSeconds: number) => {
    if (!correct) return 0;
    const baseScore = 1000;
    const timePenalty = Math.min(timeInSeconds, 600) * 1;
    return Math.max(baseScore - timePenalty, 100);
  };

  const submitScore = async () => {
    if (!playerName.trim() || !isCorrectVerdict) return;
    
    setIsSubmitting(true);
    try {
      const score = calculateScore(isCorrectVerdict, elapsedTime);
      const response = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          playerName: playerName.trim(),
          score,
          elapsedSeconds: elapsedTime,
          correctAnswers: isCorrectVerdict ? 1 : 0
        })
      });
      
      if (response.ok) {
        const newLeaderboard = await response.json();
        setLeaderboard(newLeaderboard);
        calculateAnalytics(newLeaderboard);
        setShowLeaderboard(true);
        setHasSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
      alert('Failed to submit score. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addToNotebook = (note: string) => {
    if (!caseNotebook.includes(note)) {
      setCaseNotebook([...caseNotebook, note]);
    }
  };

  const discoverEvidence = (evidenceId: string) => {
    if (!discoveredEvidence.includes(evidenceId)) {
      setDiscoveredEvidence([...discoveredEvidence, evidenceId]);
      addToNotebook(`Evidence discovered: ${evidenceList[evidenceId]?.name}`);
    }
  };

  const handleVerdictSubmission = (suspect: Suspect) => {
    const correct = suspect === 'kabir';
    setIsCorrectVerdict(correct);
    setShowVerdictDialog(true);
    if (correct) {
      setTimeout(() => {
        setCurrentScene('complete');
        setShowVerdictDialog(false);
      }, 2000);
    }
  };

  const highlightField = (fieldId: string) => {
    if (!highlightedFields.includes(fieldId)) {
      setHighlightedFields([...highlightedFields, fieldId]);
      const discrepancyFields = ['label-original', 'label-digital', 'timestamp-conflict'];
      if (discrepancyFields.includes(fieldId)) {
        const newCount = foundDiscrepancies + 1;
        setFoundDiscrepancies(newCount);
        if (newCount === 1) addToNotebook('Found: Original prep sheet marked WHITE label');
        if (newCount === 2) addToNotebook('Found: Digital register shows BLUE label');
        if (newCount === 3) addToNotebook('Found: Register updated AFTER tray marked ready (suspicious timing)');
      }
    }
  };

  const renderIntro = () => (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-amber-200 tracking-wide">CASE FILE TS-0418</h1>
        <h2 className="text-2xl text-amber-100">THE SWITCHED SAMPLE</h2>
        <Badge variant="destructive" className="text-sm">RESTRICTED INVESTIGATION FILE</Badge>
      </div>

      <Card className="bg-slate-900/50 border-amber-900/30">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-amber-100">Scene 1: The Sample That Should Not Exist</CardTitle>
          </div>
          <CardDescription className="text-slate-400">14:32 PM — Northwell Forensic Laboratory</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-slate-300">
          <p>
            The laboratory is unusually quiet. A digital clock flickers above the examination room. 
            Everything appears normal—until a junior laboratory assistant notices something strange in the records.
          </p>
          <p>
            Sample S-17 has been marked as sealed, verified, and ready for examination. But there is a problem. 
            The sample's identification label does not match the original laboratory notes.
          </p>
          
          <Alert className="bg-red-950/30 border-red-900/50">
            <Search className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-slate-300">
              <strong className="text-red-300">Your Task:</strong> Examine the laboratory register below. 
              Find and highlight <strong>3 discrepancies</strong> to proceed with the investigation.
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-slate-800/30 rounded border border-slate-700 text-xs text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Highlighter className="h-4 w-4 text-amber-500" />
              <span>Discrepancies Found: <strong className="text-amber-300">{foundDiscrepancies}/3</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-green-500" />
              <span>Saved to Notebook: {foundDiscrepancies}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Laboratory Register */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card 
          className={`bg-slate-900/50 border-amber-900/30 cursor-pointer transition-all hover:border-amber-700 ${
            zoomedDocument === 'original' ? 'ring-2 ring-amber-600' : ''
          }`}
          onClick={() => setZoomedDocument(zoomedDocument === 'original' ? null : 'original')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-amber-100">Original Preparation Sheet</CardTitle>
              <ZoomIn className="h-4 w-4 text-amber-500" />
            </div>
            <CardDescription className="text-xs text-slate-500">Completed 14:10 — Riya (Lab Assistant)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-slate-800/50 rounded border border-slate-700 font-mono text-xs">
              <div className="text-slate-500 mb-2">NORTHWELL FORENSIC SERVICES</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sample ID:</span>
                  <span className="text-slate-200">S-17</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-green-400">SEALED</span>
                </div>
                <div 
                  className={`flex justify-between p-2 rounded cursor-pointer transition-all ${
                    highlightedFields.includes('label-original') 
                      ? 'bg-yellow-900/30 border border-yellow-600' 
                      : 'hover:bg-slate-700/50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    highlightField('label-original');
                  }}
                >
                  <span className="text-slate-400">Label Color:</span>
                  <span className="text-slate-200 font-bold">WHITE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Prepared:</span>
                  <span className="text-slate-200">14:10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ready:</span>
                  <span className="text-amber-400">14:14</span>
                </div>
              </div>
            </div>
            {highlightedFields.includes('label-original') && (
              <div className="flex items-center gap-2 text-xs text-green-400">
                <CheckCircle className="h-3 w-3" />
                <span>Saved: WHITE label in original notes</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card 
          className={`bg-slate-900/50 border-amber-900/30 cursor-pointer transition-all hover:border-amber-700 ${
            zoomedDocument === 'digital' ? 'ring-2 ring-amber-600' : ''
          }`}
          onClick={() => setZoomedDocument(zoomedDocument === 'digital' ? null : 'digital')}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-amber-100">Digital Register</CardTitle>
              <ZoomIn className="h-4 w-4 text-amber-500" />
            </div>
            <CardDescription className="text-xs text-slate-500">Last Modified 14:26 — K-02 (Unknown)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-slate-800/50 rounded border border-slate-700 font-mono text-xs">
              <div className="text-slate-500 mb-2">DIGITAL EVIDENCE REGISTER</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Sample ID:</span>
                  <span className="text-slate-200">S-17</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-green-400">VERIFIED</span>
                </div>
                <div 
                  className={`flex justify-between p-2 rounded cursor-pointer transition-all ${
                    highlightedFields.includes('label-digital') 
                      ? 'bg-yellow-900/30 border border-yellow-600' 
                      : 'hover:bg-slate-700/50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    highlightField('label-digital');
                  }}
                >
                  <span className="text-slate-400">Label Color:</span>
                  <span className="text-blue-400 font-bold">BLUE</span>
                </div>
                <div 
                  className={`flex justify-between p-2 rounded cursor-pointer transition-all ${
                    highlightedFields.includes('timestamp-conflict') 
                      ? 'bg-red-900/30 border border-red-600' 
                      : 'hover:bg-slate-700/50'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    highlightField('timestamp-conflict');
                  }}
                >
                  <span className="text-slate-400">Last Edit:</span>
                  <span className="text-red-400 font-bold">14:26 ⚠️</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Editor:</span>
                  <span className="text-amber-400">K-02</span>
                </div>
              </div>
            </div>
            {highlightedFields.includes('label-digital') && (
              <div className="flex items-center gap-2 text-xs text-green-400">
                <CheckCircle className="h-3 w-3" />
                <span>Saved: BLUE label in digital register</span>
              </div>
            )}
            {highlightedFields.includes('timestamp-conflict') && (
              <div className="flex items-center gap-2 text-xs text-green-400">
                <CheckCircle className="h-3 w-3" />
                <span>Saved: Edited AFTER tray ready (14:14)</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {foundDiscrepancies === 3 && (
        <Alert className="bg-green-950/30 border-green-900/50 animate-in fade-in duration-500">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-slate-300">
            <strong className="text-green-400">All Discrepancies Found!</strong> You've identified the key evidence:
            WHITE label changed to BLUE, and the register was modified after the tray was marked ready.
            This is not a clerical error — someone deliberately altered the record.
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-slate-900/50 border-amber-900/30">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <p className="text-sm text-slate-400 italic">
              Click on the documents to zoom. Click highlighted fields to mark them as suspicious and save to your notebook.
              Find all 3 discrepancies to proceed with the investigation.
            </p>
            <Button 
              onClick={() => {
                setStartTime(Date.now());
                setCurrentScene('suspects');
                discoverEvidence('label-discrepancy');
              }}
              disabled={foundDiscrepancies < 3}
              className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              <Play className="h-4 w-4 mr-2" />
              {foundDiscrepancies < 3 ? `Find ${3 - foundDiscrepancies} More Discrepancies` : 'Begin Full Investigation'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {leaderboard.length > 0 && (
        <Card className="bg-slate-900/30 border-amber-900/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm text-amber-100">Top Investigators</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.slice(0, 3).map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">
                    <span className="text-amber-400 font-semibold">#{idx + 1}</span> {entry.playerName}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-300">{entry.score} pts</span>
                    <span className="text-slate-500">{formatTime(entry.elapsedSeconds)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderSuspects = () => (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-amber-500" />
          <h2 className="text-2xl font-bold text-amber-100">Scene 2: Three People. Three Stories.</h2>
        </div>
        <Badge variant="outline" className="text-amber-300 border-amber-700">
          {discoveredEvidence.length} Evidence Found
        </Badge>
      </div>

      <div className="grid gap-4">
        <Card 
          className={`bg-slate-900/50 border-amber-900/30 cursor-pointer transition-all hover:border-amber-700/50 ${
            selectedSuspect === 'riya' ? 'border-amber-600 ring-2 ring-amber-600/50' : ''
          }`}
          onClick={() => {
            setSelectedSuspect('riya');
            addToNotebook('Reviewed Riya\'s statement - prepared tray, completed paperwork');
          }}
        >
          <CardHeader>
            <CardTitle className="text-amber-100 flex items-center gap-2">
              Suspect 01 — RIYA
              <Badge variant="secondary" className="text-xs">Lab Assistant</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-300">
              "I finished preparing the tray before the final access entry. The labels were checked 
              before the demonstration. I didn't edit the digital register."
            </p>
            <div className="text-sm text-slate-400 space-y-1">
              <p><strong className="text-amber-300">Access:</strong> Sample preparation area</p>
              <p><strong className="text-amber-300">Timeline:</strong> Early preparation stage</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`bg-slate-900/50 border-amber-900/30 cursor-pointer transition-all hover:border-amber-700/50 ${
            selectedSuspect === 'sana' ? 'border-amber-600 ring-2 ring-amber-600/50' : ''
          }`}
          onClick={() => {
            setSelectedSuspect('sana');
            addToNotebook('Reviewed Sana\'s statement - noticed unusual label, didn\'t open cabinet');
          }}
        >
          <CardHeader>
            <CardTitle className="text-amber-100 flex items-center gap-2">
              Suspect 02 — SANA
              <Badge variant="secondary" className="text-xs">Student Researcher</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-300">
              "I thought it was unusual, but I didn't want to make an accusation without evidence. 
              I didn't open the storage cabinet."
            </p>
            <div className="text-sm text-slate-400 space-y-1">
              <p><strong className="text-amber-300">Access:</strong> Equipment check area</p>
              <p><strong className="text-amber-300">Note:</strong> First to notice discrepancy</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`bg-slate-900/50 border-amber-900/30 cursor-pointer transition-all hover:border-amber-700/50 ${
            selectedSuspect === 'kabir' ? 'border-amber-600 ring-2 ring-amber-600/50' : ''
          }`}
          onClick={() => {
            setSelectedSuspect('kabir');
            addToNotebook('Reviewed Kabir\'s statement - claims inventory work completed before tray ready');
          }}
        >
          <CardHeader>
            <CardTitle className="text-amber-100 flex items-center gap-2">
              Suspect 03 — KABIR
              <Badge variant="secondary" className="text-xs">Project Coordinator</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-300">
              "I completed my inventory work before the tray was marked ready. I didn't change the sample."
            </p>
            <div className="text-sm text-slate-400 space-y-1">
              <p><strong className="text-amber-300">Access:</strong> Storage cabinet (Account K-02)</p>
              <p><strong className="text-amber-300">Role:</strong> Inventory management</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setCurrentScene('intro')}
          className="border-amber-800 text-amber-300 hover:bg-amber-950"
        >
          Previous Scene
        </Button>
        <Button 
          onClick={() => {
            setCurrentScene('evidence');
            discoverEvidence('shoeprint');
          }}
          disabled={!selectedSuspect}
          className="flex-1 bg-amber-700 hover:bg-amber-600"
        >
          Examine Physical Evidence
        </Button>
      </div>
    </div>
  );

  const renderEvidence = () => (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-amber-500" />
        <h2 className="text-2xl font-bold text-amber-100">Scene 3: Physical Evidence Analysis</h2>
      </div>

      <Card className="bg-slate-900/50 border-amber-900/30">
        <CardHeader>
          <CardTitle className="text-amber-100">Evidence Examination</CardTitle>
          <CardDescription className="text-slate-400">
            Click on each sample container to examine. Find the discrepancy to proceed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs text-slate-500 mb-3">
            Examined: {examinedSamples.length}/4 samples
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div 
              className={`p-4 bg-slate-800/50 rounded-lg border transition-all cursor-pointer ${
                selectedSample === 'A-12' ? 'border-amber-600 ring-2 ring-amber-600/50' : 'border-slate-700 hover:border-amber-700/50'
              }`}
              onClick={() => examineSample('A-12')}
            >
              <div className="text-sm font-semibold text-amber-300 mb-2">Sample A-12</div>
              {examinedSamples.includes('A-12') ? (
                <>
                  <Badge className="bg-blue-900/50 text-blue-200 border-blue-700">Blue Label</Badge>
                  <p className="text-xs text-slate-400 mt-2">✓ Consistent in all records</p>
                </>
              ) : (
                <p className="text-xs text-slate-500">Click to examine</p>
              )}
            </div>
            
            <div 
              className={`p-4 bg-slate-800/50 rounded-lg border transition-all cursor-pointer ${
                selectedSample === 'B-07' ? 'border-amber-600 ring-2 ring-amber-600/50' : 'border-slate-700 hover:border-amber-700/50'
              }`}
              onClick={() => examineSample('B-07')}
            >
              <div className="text-sm font-semibold text-amber-300 mb-2">Sample B-07</div>
              {examinedSamples.includes('B-07') ? (
                <>
                  <Badge className="bg-slate-700 text-slate-200 border-slate-600">White Label</Badge>
                  <p className="text-xs text-slate-400 mt-2">✓ Consistent in all records</p>
                </>
              ) : (
                <p className="text-xs text-slate-500">Click to examine</p>
              )}
            </div>
            
            <div 
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                selectedSample === 'S-17' 
                  ? 'bg-amber-950/50 border-amber-600 ring-2 ring-amber-600/50' 
                  : examinedSamples.includes('S-17')
                    ? 'bg-amber-950/30 border-amber-700 hover:border-amber-600'
                    : 'bg-slate-800/50 border-slate-700 hover:border-amber-700/50'
              }`}
              onClick={() => examineSample('S-17')}
            >
              <div className="text-sm font-semibold text-amber-200 mb-2">Sample S-17 {examinedSamples.includes('S-17') && '⚠️'}</div>
              {examinedSamples.includes('S-17') ? (
                <>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-700 text-slate-200 border-slate-600 text-xs">Original: White</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-900/50 text-blue-200 border-blue-700 text-xs">Register: Blue</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-amber-300 mt-2 font-semibold">⚠️ DISCREPANCY DETECTED</p>
                </>
              ) : (
                <p className="text-xs text-slate-500">Click to examine</p>
              )}
            </div>
            
            <div 
              className={`p-4 bg-slate-800/50 rounded-lg border transition-all cursor-pointer ${
                selectedSample === 'C-03' ? 'border-amber-600 ring-2 ring-amber-600/50' : 'border-slate-700 hover:border-amber-700/50'
              }`}
              onClick={() => examineSample('C-03')}
            >
              <div className="text-sm font-semibold text-amber-300 mb-2">Sample C-03</div>
              {examinedSamples.includes('C-03') ? (
                <>
                  <Badge className="bg-green-900/50 text-green-200 border-green-700">Green Label</Badge>
                  <p className="text-xs text-slate-400 mt-2">✓ Consistent in all records</p>
                </>
              ) : (
                <p className="text-xs text-slate-500">Click to examine</p>
              )}
            </div>
          </div>

          {examinedSamples.includes('S-17') && (
            <>
              <Alert className="bg-amber-950/30 border-amber-900/50 animate-in fade-in duration-500">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-slate-300">
                  <strong className="text-amber-200">Shoeprint Analysis:</strong> Pattern consistent with footwear 
                  recorded for Kabir. Combined with access timeline, this becomes relevant to the investigation.
                </AlertDescription>
              </Alert>

              <Alert className="bg-slate-800/50 border-slate-700">
                <AlertDescription className="text-slate-400 text-sm">
                  <strong>Fingerprint Analysis:</strong> Result marked inconclusive. Cannot be used as proof of identity.
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setCurrentScene('suspects')}
          className="border-amber-800 text-amber-300 hover:bg-amber-950"
        >
          Previous Scene
        </Button>
        <Button 
          onClick={() => {
            setCurrentScene('puzzle');
            addToNotebook('Need to unlock cabinet records - puzzles required');
          }}
          disabled={!examinedSamples.includes('S-17')}
          className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {examinedSamples.includes('S-17') ? 'Unlock Cabinet Records' : 'Examine S-17 to Continue'}
        </Button>
      </div>
    </div>
  );

  const renderPuzzle = () => (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center gap-2">
        <Lock className="h-6 w-6 text-amber-500" />
        <h2 className="text-2xl font-bold text-amber-100">Scene 4: The Locked Cabinet</h2>
      </div>

      <Card className="bg-slate-900/50 border-amber-900/30">
        <CardHeader>
          <CardTitle className="text-amber-100">Sudoku Security Puzzle</CardTitle>
          <CardDescription className="text-slate-400">
            Solve the 4x4 Sudoku to unlock the maintenance slip
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300 text-sm">
            Each row, column, and 2×2 box must contain numbers 1 through 4 without repetition.
          </p>
          
          <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
            {sudokuGrid.map((row, i) => 
              row.map((cell, j) => (
                <input
                  key={`${i}-${j}`}
                  type="number"
                  min="1"
                  max="4"
                  value={cell || ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value) : null;
                    if (val === null || (val >= 1 && val <= 4)) {
                      const newGrid = sudokuGrid.map(r => [...r]);
                      newGrid[i][j] = val;
                      setSudokuGrid(newGrid);
                    }
                  }}
                  disabled={sudokuSolved}
                  className={`w-14 h-14 text-center text-xl font-bold border-2 rounded ${
                    sudokuSolved 
                      ? 'bg-green-900/30 border-green-700 text-green-300'
                      : 'bg-slate-800 border-slate-700 text-amber-300'
                  }`}
                />
              ))
            )}
          </div>

          {!sudokuSolved && (
            <Button onClick={handleSudokuSubmit} className="w-full bg-amber-700 hover:bg-amber-600">
              Check Solution
            </Button>
          )}

          {sudokuSolved && (
            <Alert className="bg-green-950/30 border-green-900/50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-slate-300">
                <strong className="text-green-300">Drawer Unlocked!</strong> Maintenance slip found:<br/>
                <code className="text-amber-300">14:18 — STORAGE CABINET OPENED. AUTHORISATION ACCOUNT: K-02</code>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {sudokuSolved && (
        <Card className="bg-slate-900/50 border-amber-900/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-amber-100">Morse Code Message</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Decode the message to find the next file
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-800/50 rounded font-mono text-amber-300 text-center text-xl">
              .- -.-. -.-. . ... ... .-.. --- --.
            </div>
            
            <div className="text-xs text-slate-400 p-3 bg-slate-800/30 rounded">
              <strong>Morse Code Reference:</strong><br/>
              A: .- &nbsp; C: -.-. &nbsp; E: . &nbsp; G: --. &nbsp; L: .-.. &nbsp; O: --- &nbsp; S: ...
            </div>

            {!morseDecoded && (
              <div className="space-y-2">
                <Input
                  placeholder="Enter decoded message"
                  value={morseInput}
                  onChange={(e) => setMorseInput(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-100"
                />
                <Button onClick={handleMorseSubmit} className="w-full bg-amber-700 hover:bg-amber-600">
                  Submit Answer
                </Button>
              </div>
            )}

            {morseDecoded && (
              <Alert className="bg-green-950/30 border-green-900/50">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-300">
                  <strong>Correct!</strong> Message decoded: "ACCESSLOG" - Proceed to access log analysis.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setCurrentScene('evidence')}
          className="border-amber-800 text-amber-300 hover:bg-amber-950"
        >
          Previous Scene
        </Button>
        <Button 
          onClick={() => setCurrentScene('timeline')}
          disabled={!morseDecoded}
          className="flex-1 bg-amber-700 hover:bg-amber-600"
        >
          Open Access Log
        </Button>
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-6 w-6 text-amber-500" />
        <h2 className="text-2xl font-bold text-amber-100">Scene 5: The Missing Minutes</h2>
      </div>

      <Card className="bg-slate-900/50 border-amber-900/30">
        <CardHeader>
          <CardTitle className="text-amber-100">Access Log Timeline - Drag to Reorder</CardTitle>
          <CardDescription className="text-slate-400">
            {timelineOrdered ? '✓ Timeline correctly ordered!' : 'Drag and drop events into chronological order'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!timelineOrdered && (
            <div className="flex gap-2">
              <Button 
                onClick={() => setDraggedEvents(shuffleArray([...timelineEvents]))}
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-400 hover:bg-slate-800"
              >
                🔀 Shuffle Events
              </Button>
              <Alert className="flex-1 bg-blue-950/20 border-blue-900/40 py-2">
                <AlertDescription className="text-xs text-blue-200">
                  Drag any event onto another to swap their positions
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="space-y-3">
            {(timelineOrdered ? timelineEvents : draggedEvents).map((event, idx) => (
              <div 
                key={event.id} 
                draggable={!timelineOrdered}
                onDragStart={() => !timelineOrdered && handleDragStart(event)}
                onDragOver={(e) => !timelineOrdered && e.preventDefault()}
                onDrop={() => !timelineOrdered && handleDrop(event)}
                className={`p-4 bg-slate-800/50 rounded-lg border transition-all ${
                  !timelineOrdered 
                    ? 'border-slate-700 hover:border-amber-700/50 cursor-move active:opacity-50' 
                    : 'border-green-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-amber-300 border-amber-700 font-mono text-xs">
                      {event.time}
                    </Badge>
                    <span className="text-slate-300 text-sm">{event.event}</span>
                  </div>
                  {timelineOrdered && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {!timelineOrdered && <span className="text-slate-600 text-xs">#{idx + 1}</span>}
                </div>
              </div>
            ))}
          </div>

          {timelineOrdered && (
            <>
              <Alert className="bg-red-950/30 border-red-900/50 animate-in fade-in duration-500">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-slate-300">
                  <strong className="text-red-300">Timeline Contradiction:</strong> Account K-02 (Kabir) accessed 
                  the storage cabinet at 14:18, <strong>after</strong> the tray was marked ready at 14:14. 
                  Kabir claimed he completed his work <strong>before</strong> the tray was ready.
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-amber-950/20 rounded-lg border border-amber-900/50">
                <h4 className="text-amber-200 font-semibold mb-2 text-sm">Account Permissions</h4>
                <p className="text-slate-300 text-sm">Account K-02 is registered to: <strong className="text-amber-300">Kabir</strong></p>
                <p className="text-slate-400 text-xs mt-1">
                  Same account edited the digital register at 14:26, changing S-17 label from white to blue.
                </p>
              </div>
            </>
          )}

          {!timelineOrdered && (
            <Button 
              onClick={handleTimelineSubmit}
              className="w-full bg-green-700 hover:bg-green-600"
            >
              ✓ Submit Timeline Order
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setCurrentScene('puzzle')}
          className="border-amber-800 text-amber-300 hover:bg-amber-950"
        >
          Previous Scene
        </Button>
        <Button 
          onClick={() => {
            setCurrentScene('register');
            discoverEvidence('torn-label');
          }}
          disabled={!timelineComplete}
          className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {timelineComplete ? 'Examine Register History' : 'Order Timeline First'}
        </Button>
      </div>
    </div>
  );

  const renderRegister = () => (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center gap-2">
        <History className="h-6 w-6 text-amber-500" />
        <h2 className="text-2xl font-bold text-amber-100">Scene 6: The Record That Remembers</h2>
      </div>

      <Card className="bg-slate-900/50 border-amber-900/30">
        <CardHeader>
          <CardTitle className="text-amber-100">Digital Register Version History</CardTitle>
          <CardDescription className="text-slate-400">
            Click on each version to examine. Compare all 3 versions to proceed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs text-slate-500 mb-3">
            Examined: {comparedVersions.length}/3 versions
          </div>

          <div className="space-y-3">
            {/* Version 1 */}
            <div 
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                selectedVersion === 1 
                  ? 'bg-slate-800/70 border-amber-600 ring-2 ring-amber-600/50' 
                  : comparedVersions.includes(1)
                    ? 'bg-slate-800/50 border-slate-600'
                    : 'bg-slate-800/30 border-slate-700 hover:border-amber-700/50'
              }`}
              onClick={() => selectVersion(1)}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-blue-900/50 text-blue-200 border-blue-700 text-xs">Version 1</Badge>
                <span className="text-xs text-slate-500">14:10</span>
              </div>
              {comparedVersions.includes(1) ? (
                <>
                  <p className="text-sm text-slate-300">
                    Sample S-17: <Badge className="bg-slate-700 text-slate-200 text-xs">White Label</Badge>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Created by: System (Initial)</p>
                </>
              ) : (
                <p className="text-xs text-slate-500">Click to examine this version</p>
              )}
            </div>

            {/* Version 2 */}
            <div 
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                selectedVersion === 2 
                  ? 'bg-slate-800/70 border-amber-600 ring-2 ring-amber-600/50' 
                  : comparedVersions.includes(2)
                    ? 'bg-slate-800/50 border-slate-600'
                    : 'bg-slate-800/30 border-slate-700 hover:border-amber-700/50'
              }`}
              onClick={() => selectVersion(2)}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-blue-900/50 text-blue-200 border-blue-700 text-xs">Version 2</Badge>
                <span className="text-xs text-slate-500">14:14</span>
              </div>
              {comparedVersions.includes(2) ? (
                <>
                  <p className="text-sm text-slate-300">
                    Sample S-17: <Badge className="bg-slate-700 text-slate-200 text-xs">White Label</Badge>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Modified by: R-05 (Riya) - Tray marked ready</p>
                </>
              ) : (
                <p className="text-xs text-slate-500">Click to examine this version</p>
              )}
            </div>

            {/* Version 3 - Critical */}
            <div 
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                selectedVersion === 3 
                  ? 'bg-amber-950/50 border-amber-500 ring-2 ring-amber-600/50' 
                  : comparedVersions.includes(3)
                    ? 'bg-amber-950/30 border-amber-700'
                    : 'bg-slate-800/30 border-amber-800/50 hover:border-amber-700'
              }`}
              onClick={() => selectVersion(3)}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-amber-900/50 text-amber-200 border-amber-700 text-xs">Version 3</Badge>
                <span className="text-xs text-amber-400 font-semibold">14:26</span>
              </div>
              {comparedVersions.includes(3) ? (
                <>
                  <p className="text-sm text-slate-300">
                    Sample S-17: <Badge className="bg-blue-900/50 text-blue-200 text-xs">Blue Label</Badge> ⚠️
                  </p>
                  <p className="text-xs text-amber-400 mt-1 font-semibold">Modified by: K-02 (Kabir) - Label changed!</p>
                </>
              ) : (
                <p className="text-xs text-slate-500">Click to examine this version</p>
              )}
            </div>
          </div>

          {comparedVersions.length === 3 && (
            <>
              <Alert className="bg-red-950/30 border-red-900/50 animate-in fade-in duration-500">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-slate-300">
                  <strong className="text-red-300">Critical Discovery:</strong> Version 3 shows the label field was 
                  edited from WHITE to BLUE at 14:26 by account K-02 (Kabir) — 8 minutes after cabinet access at 14:18.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-500">
                <div className="p-3 bg-slate-800/50 rounded border border-slate-700">
                  <h4 className="text-sm font-semibold text-amber-300 mb-2">🔍 Physical Evidence</h4>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">✓ Torn blue label fragment found</p>
                    <p className="text-xs text-slate-400">✓ Shoeprint matches Kabir's footwear</p>
                    <p className="text-xs text-slate-500">✗ Fingerprint: Inconclusive</p>
                  </div>
                </div>
                <div className="p-3 bg-amber-950/20 rounded border border-amber-900/50">
                  <h4 className="text-sm font-semibold text-amber-300 mb-2">💻 Digital Evidence</h4>
                  <div className="space-y-1">
                    <p className="text-xs text-amber-300">• K-02 accessed cabinet 14:18</p>
                    <p className="text-xs text-amber-300">• K-02 edited register 14:26</p>
                    <p className="text-xs text-amber-300 font-semibold">• K-02 = Kabir's account</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setCurrentScene('timeline')}
          className="border-amber-800 text-amber-300 hover:bg-amber-950"
        >
          Previous Scene
        </Button>
        <Button 
          onClick={() => setCurrentScene('verdict')}
          disabled={comparedVersions.length < 3}
          className="flex-1 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {comparedVersions.length === 3 ? 'Make Final Accusation' : `Examine ${3 - comparedVersions.length} More Versions`}
        </Button>
      </div>
    </div>
  );

  const renderVerdict = () => (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-amber-100">Scene 7: Final Verdict</h2>
        <p className="text-slate-400">Who switched the sample?</p>
      </div>

      <div className="grid gap-4">
        <div
          className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
            selectedSuspect === 'kabir'
              ? 'bg-red-950/30 border-red-700 ring-2 ring-red-600/50'
              : 'bg-slate-900/50 border-amber-900/30 hover:border-amber-700/50'
          }`}
          onClick={() => setSelectedSuspect('kabir')}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-semibold text-amber-100">KABIR - Project Coordinator</h3>
            {selectedSuspect === 'kabir' && (
              <Badge variant="destructive">Selected</Badge>
            )}
          </div>
          <div className="space-y-2 text-sm text-slate-300">
            <p>✓ Account K-02 accessed cabinet at 14:18 (after tray marked ready)</p>
            <p>✓ Same account changed register at 14:26 (white → blue label)</p>
            <p>✓ Statement contradicted by timeline</p>
            <p>✓ Shoeprint pattern matches recorded footwear</p>
          </div>
        </div>

        <div
          className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
            selectedSuspect === 'riya'
              ? 'bg-blue-950/30 border-blue-700'
              : 'bg-slate-900/50 border-slate-700/30 opacity-60 hover:opacity-100'
          }`}
          onClick={() => setSelectedSuspect('riya')}
        >
          <h3 className="text-xl font-semibold text-amber-100 mb-3">RIYA - Lab Assistant</h3>
          <div className="space-y-2 text-sm text-slate-400">
            <p>• Statement consistent with early preparation records</p>
            <p>• No access during suspicious timeframe</p>
            <p>• Timeline supports her account</p>
          </div>
        </div>

        <div
          className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
            selectedSuspect === 'sana'
              ? 'bg-blue-950/30 border-blue-700'
              : 'bg-slate-900/50 border-slate-700/30 opacity-60 hover:opacity-100'
          }`}
          onClick={() => setSelectedSuspect('sana')}
        >
          <h3 className="text-xl font-semibold text-amber-100 mb-3">SANA - Student Researcher</h3>
          <div className="space-y-2 text-sm text-slate-400">
            <p>• First to notice the discrepancy (witness)</p>
            <p>• No cabinet access recorded</p>
            <p>• No contradictions in statement</p>
          </div>
        </div>
      </div>

      {selectedSuspect && (
        <Card className="bg-slate-900/50 border-amber-900/30">
          <CardHeader>
            <CardTitle className="text-amber-100">Supporting Evidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {discoveredEvidence.map((evId) => {
                const evidence = evidenceList[evId];
                return evidence ? (
                  <div key={evId} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-amber-300 font-semibold">{evidence.name}</div>
                      <div className="text-slate-400">{evidence.description}</div>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setCurrentScene('register')}
          className="border-amber-800 text-amber-300 hover:bg-amber-950"
        >
          Review Evidence
        </Button>
        <Button 
          onClick={() => selectedSuspect && handleVerdictSubmission(selectedSuspect)}
          disabled={!selectedSuspect}
          className="flex-1 bg-red-700 hover:bg-red-600"
        >
          Submit Final Verdict
        </Button>
      </div>

      <Dialog open={showVerdictDialog} onOpenChange={setShowVerdictDialog}>
        <DialogContent className="bg-slate-900 border-amber-900/50">
          <DialogHeader>
            <DialogTitle className={isCorrectVerdict ? "text-green-400" : "text-red-400"}>
              {isCorrectVerdict ? "✓ CORRECT VERDICT" : "✗ INCORRECT VERDICT"}
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              {isCorrectVerdict ? (
                <>
                  Excellent work, investigator! The evidence clearly points to Kabir as the person who 
                  switched the sample. Your deductive reasoning was sound.
                </>
              ) : (
                <>
                  The evidence does not support this conclusion. Review the access timeline, register history, 
                  and timeline contradictions. Account K-02 belongs to Kabir, and his statement contradicts the logs.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {isCorrectVerdict ? (
              <Button onClick={() => setShowVerdictDialog(false)} className="bg-green-700 hover:bg-green-600">
                View Results
              </Button>
            ) : (
              <Button onClick={() => setShowVerdictDialog(false)} variant="outline" className="border-amber-700 text-amber-300">
                Review Evidence
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderComplete = () => (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-900/30 border-2 border-green-700 mb-4">
          <CheckCircle className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold text-amber-100">CASE CLOSED · TS-0418</h2>
        <p className="text-xl text-green-400">THE EVIDENCE HELD UP</p>
      </div>

      <Card className="bg-slate-900/50 border-green-900/30">
        <CardHeader>
          <CardTitle className="text-amber-100">Investigation Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-slate-300">
          <p>
            <strong className="text-green-400">Kabir</strong> switched the sample. The shoeprint comparison and access 
            timeline support the verdict. The register history reveals when the label changed, and the account record 
            connects the edit to Kabir.
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-amber-300">Time Elapsed</span>
              </div>
              <p className="text-2xl font-bold text-slate-100">{formatTime(elapsedTime)}</p>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-amber-300">Your Score</span>
              </div>
              <p className="text-2xl font-bold text-slate-100">{calculateScore(true, elapsedTime)}</p>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="playerName" className="text-amber-300">Enter Your Name for Leaderboard</Label>
              <Input
                id="playerName"
                placeholder="Your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-slate-800 border-slate-700 text-slate-100"
                maxLength={30}
              />
            </div>
            <Button 
              onClick={submitScore}
              disabled={!playerName.trim() || isSubmitting || hasSubmitted}
              className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : hasSubmitted ? '✓ Submitted to Leaderboard' : 'Submit to Leaderboard'}
            </Button>
            {hasSubmitted && (
              <p className="text-xs text-green-400 text-center">
                Your score has been added! Scroll down to see the full leaderboard.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {leaderboard.length > 0 && (
        <>
          <Card className="bg-slate-900/50 border-amber-900/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <CardTitle className="text-amber-100">Leaderboard - All Investigators</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                {leaderboard.length} total {leaderboard.length === 1 ? 'investigator' : 'investigators'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {leaderboard.map((entry, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                      entry.playerName === playerName.trim() && showLeaderboard
                        ? 'bg-amber-900/30 border-2 border-amber-600 animate-in fade-in duration-500' 
                        : 'bg-slate-800/30 border border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-base font-bold min-w-[2.5rem] ${
                        idx === 0 ? 'text-yellow-400' : 
                        idx === 1 ? 'text-slate-300' : 
                        idx === 2 ? 'text-amber-600' : 'text-slate-500'
                      }`}>
                        #{idx + 1}
                      </span>
                      <span className={`text-slate-200 font-semibold ${
                        entry.playerName === playerName.trim() && showLeaderboard ? 'text-amber-200' : ''
                      }`}>
                        {entry.playerName}
                        {entry.playerName === playerName.trim() && showLeaderboard && (
                          <span className="ml-2 text-xs text-amber-400">(You)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-amber-300 font-bold text-sm">{entry.score} pts</span>
                      <span className="text-slate-500 text-xs font-mono">{formatTime(entry.elapsedSeconds)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {analytics && (
            <Card className="bg-slate-900/50 border-amber-900/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-amber-100">Game Analytics</CardTitle>
                </div>
                <CardDescription className="text-slate-400">
                  Overall statistics from all investigations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <span className="text-xs text-slate-400">Total Plays</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-100">{analytics.totalPlays}</p>
                  </div>

                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Timer className="h-4 w-4 text-amber-400" />
                      <span className="text-xs text-slate-400">Avg Time</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-100">{formatTime(analytics.averageTime)}</p>
                  </div>

                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-green-400" />
                      <span className="text-xs text-slate-400">Success Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-100">{analytics.successRate}%</p>
                  </div>

                  <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-4 w-4 text-purple-400" />
                      <span className="text-xs text-slate-400">Avg Score</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-100">{analytics.averageScore}</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-800/30 rounded-lg">
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>• <strong className="text-slate-300">{analytics.totalPlays}</strong> investigators have attempted this case</p>
                    <p>• <strong className="text-green-400">{analytics.successRate}%</strong> correctly identified Kabir as the culprit</p>
                    <p>• Average investigation time: <strong className="text-amber-300">{formatTime(analytics.averageTime)}</strong></p>
                    <p>• Target time for 700+ score: <strong className="text-amber-300">5:00 or less</strong></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Button 
        onClick={() => window.location.reload()}
        variant="outline"
        className="w-full border-amber-800 text-amber-300 hover:bg-amber-950"
      >
        Start New Investigation
      </Button>
    </div>
  );

  const checkSudoku = () => {
    const solution = [
      [1, 2, 3, 4],
      [3, 4, 2, 1],
      [4, 3, 1, 2],
      [2, 1, 4, 3]
    ];
    
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (sudokuGrid[i][j] !== solution[i][j]) return false;
      }
    }
    return true;
  };

  const handleSudokuSubmit = () => {
    if (checkSudoku()) {
      setSudokuSolved(true);
      addToNotebook('Sudoku solved - Cabinet access log: 14:18, Account K-02');
      discoverEvidence('access-log');
    }
  };

  const handleMorseSubmit = () => {
    if (morseInput.toUpperCase() === 'ACCESSLOG' || morseInput.toUpperCase() === 'ACCESS LOG') {
      setMorseDecoded(true);
      addToNotebook('Morse code decoded - Directed to access log file');
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const checkTimelineOrder = () => {
    return draggedEvents.every((event, idx) => event.id === timelineEvents[idx].id);
  };

  const handleTimelineSubmit = () => {
    if (checkTimelineOrder()) {
      setTimelineOrdered(true);
      setTimelineComplete(true);
      addToNotebook('Timeline ordered correctly - K-02 accessed cabinet AFTER tray marked ready');
      discoverEvidence('register-history');
    }
  };

  const handleDragStart = (event: TimelineEvent) => {
    setDraggedEvent(event);
  };

  const handleDrop = (targetEvent: TimelineEvent) => {
    if (!draggedEvent) return;
    
    const draggedIdx = draggedEvents.findIndex(e => e.id === draggedEvent.id);
    const targetIdx = draggedEvents.findIndex(e => e.id === targetEvent.id);
    
    const newEvents = [...draggedEvents];
    newEvents[draggedIdx] = targetEvent;
    newEvents[targetIdx] = draggedEvent;
    
    setDraggedEvents(newEvents);
    setDraggedEvent(null);
  };

  const examineSample = (sampleId: string) => {
    setSelectedSample(sampleId);
    if (!examinedSamples.includes(sampleId)) {
      setExaminedSamples([...examinedSamples, sampleId]);
      if (sampleId === 'S-17') {
        addToNotebook('S-17 shows WHITE label physically, but BLUE in digital register');
        discoverEvidence('shoeprint');
      }
    }
  };

  const selectVersion = (versionNum: number) => {
    setSelectedVersion(versionNum);
    if (!comparedVersions.includes(versionNum)) {
      setComparedVersions([...comparedVersions, versionNum]);
      
      // Check if all 3 versions examined
      if (comparedVersions.length + 1 === 3) {
        setDiscoveredRegisterEvidence(true);
        addToNotebook('Register analysis complete: Kabir (K-02) changed label at 14:26');
        discoverEvidence('register-history');
      }
    }
  };

  const sceneProgress = {
    'intro': 0,
    'suspects': 12,
    'evidence': 25,
    'puzzle': 40,
    'timeline': 55,
    'register': 70,
    'verdict': 85,
    'complete': 100
  }[currentScene];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-amber-900/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-sm font-semibold text-amber-500 tracking-widest">NORTHWELL FORENSIC SERVICES</h1>
              <p className="text-xs text-slate-500 mt-1">Lead Investigator Interface</p>
            </div>
            <div className="flex items-center gap-4">
              {startTime && currentScene !== 'intro' && currentScene !== 'complete' && (
                <div className="flex items-center gap-2 text-amber-300">
                  <Timer className="h-4 w-4" />
                  <span className="font-mono text-sm">{formatTime(elapsedTime)}</span>
                </div>
              )}
              <Badge variant="outline" className="text-amber-300 border-amber-700">
                Scene {currentScene === 'intro' ? '1' : currentScene === 'suspects' ? '2' : currentScene === 'evidence' ? '3' : currentScene === 'puzzle' ? '4' : currentScene === 'timeline' ? '5' : currentScene === 'register' ? '6' : currentScene === 'verdict' ? '7' : '✓'} of 7
              </Badge>
            </div>
          </div>
          {currentScene !== 'intro' && currentScene !== 'complete' && (
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Investigation Progress</span>
                <span>{sceneProgress}%</span>
              </div>
              <Progress value={sceneProgress} className="h-2" />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="mb-8">
          {currentScene === 'intro' && renderIntro()}
          {currentScene === 'suspects' && renderSuspects()}
          {currentScene === 'evidence' && renderEvidence()}
          {currentScene === 'puzzle' && renderPuzzle()}
          {currentScene === 'timeline' && renderTimeline()}
          {currentScene === 'register' && renderRegister()}
          {currentScene === 'verdict' && renderVerdict()}
          {currentScene === 'complete' && renderComplete()}
        </div>

        {/* Case Notebook Sidebar */}
        {currentScene !== 'intro' && currentScene !== 'complete' && (
          <Card className="bg-slate-900/30 border-amber-900/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm text-amber-100">Case Notebook</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {caseNotebook.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No notes yet...</p>
                  ) : (
                    caseNotebook.map((note, idx) => (
                      <div key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                        <span className="text-amber-600">•</span>
                        <span>{note}</span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
