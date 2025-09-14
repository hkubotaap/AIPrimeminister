import { useState } from 'react';
import React from 'react';
import { AIProviderManager, AIProvider } from './ai-provider';
import { PolicyAnalyzer, PolicyContext } from './policy-analyzer';
import { EventGenerator, EventGenerationContext, GeneratedEvent } from './event-generator';
import { RankingSystem, RankingEntry } from './ranking-system';
import { SecurityValidator } from './security-config';
import RankingModal from './components/RankingModal';
import ScoreSubmissionModal from './components/ScoreSubmissionModal';

// ポリシー効果の型
interface PolicyEffect {
  approvalRating?: number;
  gdp?: number;
  nationalDebt?: number;
  technology?: number;
  environment?: number;
  stockPrice?: number;
  usdJpyRate?: number;
  diplomacy?: number;
  aiAnalysis?: {
    reasoning: string;
    confidence: number;
    timeframe: string;
    risks: string[];
    opportunities: string[];
  };
}

// 選択肢の型
interface PolicyOption {
  text: string;
  effect: PolicyEffect;
}

// イベントの型
interface GameEvent {
  id?: string;
  title: string;
  description: string;
  options: PolicyOption[];
}

// ログエントリの型
interface GameLog {
  turn: number;
  event: string;
  choice: string;
  effect: PolicyEffect;
  aiAnalysis?: {
    reasoning: string;
    confidence: number;
    timeframe: string;
    risks: string[];
    opportunities: string[];
  };
}

// ゲームステートの型
interface GameState {
  turn: number;
  maxTurns: number;
  approvalRating: number;
  nationalDebt: number;
  gdp: number;
  technology: number;
  environment: number;
  stockPrice: number;
  usdJpyRate: number;
  diplomacy: number;
  isGameStarted: boolean;
  isGameOver: boolean;
  currentEvent: GameEvent | null;
  gameLog: GameLog[];
  kasumiMessage: string;
  kasumiDisplayMessage: string;
  isTyping: boolean;
  isAIThinking: boolean;
  typingTimer: number | null;
  lastEffect: PolicyEffect | null;
  showEffectDetails: boolean;
  historyData: Array<{
    turn: number;
    approvalRating: number;
    gdp: number;
    stockPrice: number;
    diplomacy: number;
  }>;
  usedEventIds: string[];
  eventPool: string[];
  politicalTrends: {
    approvalTrend: 'rising' | 'falling' | 'stable';
    economicTrend: 'growth' | 'recession' | 'stable';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  emergencyEventCount: number;
}

function App() {
  // すべてのstateを最上位で定義
  const [gameState, setGameState] = useState<GameState>({
    turn: 1,
    maxTurns: 5,
    approvalRating: 50,
    nationalDebt: 1000,
    gdp: 500,
    technology: 50,
    environment: 50,
    stockPrice: 28000,
    usdJpyRate: 148,
    diplomacy: 50,
    isGameStarted: false,
    isGameOver: false,
    currentEvent: null,
    gameLog: [],
    kasumiMessage: '総理、お疲れ様です。政治情勢の分析を開始いたします。',
    kasumiDisplayMessage: '',
    isTyping: false,
    isAIThinking: false,
    typingTimer: null,
    lastEffect: null,
    showEffectDetails: false,
    historyData: [],
    usedEventIds: [],
    eventPool: [],
    politicalTrends: {
      approvalTrend: 'stable',
      economicTrend: 'stable',
      riskLevel: 'low'
    },
    emergencyEventCount: 0,
  });

  const [customPolicy, setCustomPolicy] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setFinalScore] = useState(0);
  const [secretaryComment, setSecretaryComment] = useState<string>('');
  const [isGeneratingComment, setIsGeneratingComment] = useState(false);
  
  // ランキング機能用のstate
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showScoreSubmissionModal, setShowScoreSubmissionModal] = useState(false);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [stats, setStats] = useState<any>({});
  const [isLoadingRankings, setIsLoadingRankings] = useState(true);

  // AI Provider Managerインスタンス
  const [aiProvider] = useState(() => new AIProviderManager());
  const [policyAnalyzer] = useState(() => new PolicyAnalyzer(aiProvider));
  const [eventGenerator] = useState(() => new EventGenerator(aiProvider));
  const [rankingSystem] = useState(() => new RankingSystem());
  const [currentProvider, setCurrentProvider] = useState<AIProvider>('fallback');
  const [showProviderSettings, setShowProviderSettings] = useState(false);
  const [isAnalyzingPolicy, setIsAnalyzingPolicy] = useState(false);
  const [isGeneratingEvent, setIsGeneratingEvent] = useState(false);
  
  // ランキング関連の状態
  const [showRanking, setShowRanking] = useState(false);
  const [showRankingRegistration, setShowRankingRegistration] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [gameStartTime] = useState(Date.now());

  // すべてのuseEffectを最上位で定義
  // ゲーム終了時の総括評価生成
  React.useEffect(() => {
    if (gameState.isGameOver && !secretaryComment && !isGeneratingComment) {
      setIsGeneratingComment(true);
      const rankData = calculateFinalRank();
      generateFinalSecretaryComment(rankData).then(comment => {
        setSecretaryComment(comment);
        setIsGeneratingComment(false);
        setTimeout(() => {
          displayMessage(comment);
        }, 500);
      });
    }
  }, [gameState.isGameOver, secretaryComment, isGeneratingComment]);

  // AIプロバイダー初期化
  React.useEffect(() => {
    const initProvider = async () => {
      try {
        console.log('🔄 AIプロバイダー初期化開始...');
        await aiProvider.recheckProviders();
        const provider = aiProvider.getCurrentProvider();
        setCurrentProvider(provider);
        console.log('✅ AIプロバイダー初期化完了:', provider);
      } catch (error) {
        console.error('❌ AIプロバイダー初期化エラー:', error);
        setCurrentProvider('fallback');
      }
    };
    initProvider();
  }, [aiProvider]);

  // ランキングデータ読み込み用のuseEffect
  React.useEffect(() => {
    if (showRanking) {
      const loadRankings = async () => {
        try {
          setIsLoadingRankings(true);
          const [rankingData, statsData] = await Promise.all([
            rankingSystem.getTop10(),
            rankingSystem.getStatistics()
          ]);
          setRankings(rankingData);
          setStats(statsData);
        } catch (error) {
          console.error('ランキング読み込みエラー:', error);
        } finally {
          setIsLoadingRankings(false);
        }
      };
      loadRankings();
    }
  }, [showRanking, rankingSystem]);

  // 基本的な関数定義
  const displayMessage = (message: string) => {
    setGameState(prev => {
      if (prev.typingTimer) {
        window.clearInterval(prev.typingTimer);
      }
      return { 
        ...prev, 
        kasumiMessage: message,
        kasumiDisplayMessage: message,
        isTyping: false,
        typingTimer: null
      };
    });
  };

  const calculateFinalRank = (state = gameState) => {
    const scores = {
      approval: Math.max(0, Math.min(100, state.approvalRating)),
      gdp: Math.max(0, Math.min(100, (state.gdp - 400) / 4)),
      technology: Math.max(0, Math.min(100, state.technology)),
      environment: Math.max(0, Math.min(100, state.environment)),
      diplomacy: Math.max(0, Math.min(100, state.diplomacy)),
      debt: Math.max(0, Math.min(100, 100 - ((state.nationalDebt - 800) / 10)))
    };

    const totalScore = Math.round(
      (scores.approval * 0.3 + 
       scores.gdp * 0.25 + 
       scores.technology * 0.15 + 
       scores.environment * 0.15 + 
       scores.diplomacy * 0.1 + 
       scores.debt * 0.05)
    );

    let rank = 'F';
    let rankTitle = '政治的失敗';
    let rankColor = 'text-red-500';

    if (totalScore >= 90) {
      rank = 'S+';
      rankTitle = '歴史的名宰相';
      rankColor = 'text-purple-400';
    } else if (totalScore >= 85) {
      rank = 'S';
      rankTitle = '優秀な指導者';
      rankColor = 'text-yellow-400';
    } else if (totalScore >= 80) {
      rank = 'A+';
      rankTitle = '有能な総理大臣';
      rankColor = 'text-blue-400';
    } else if (totalScore >= 75) {
      rank = 'A';
      rankTitle = '安定した政権運営';
      rankColor = 'text-green-400';
    } else if (totalScore >= 70) {
      rank = 'B+';
      rankTitle = '平均以上の成果';
      rankColor = 'text-green-300';
    } else if (totalScore >= 65) {
      rank = 'B';
      rankTitle = '標準的な政権';
      rankColor = 'text-yellow-300';
    } else if (totalScore >= 60) {
      rank = 'C+';
      rankTitle = '課題の多い政権';
      rankColor = 'text-orange-400';
    } else if (totalScore >= 55) {
      rank = 'C';
      rankTitle = '困難な政権運営';
      rankColor = 'text-orange-300';
    } else if (totalScore >= 50) {
      rank = 'D';
      rankTitle = '政治的混乱';
      rankColor = 'text-red-400';
    }

    return { rank, rankTitle, rankColor, totalScore, scores };
  };

  const generateFinalSecretaryComment = async (rankData: any): Promise<string> => {
    return `総理、お疲れ様でした！${rankData.totalScore}点という結果でしたね。${rankData.rankTitle}として歴史に名を残すことになりました。私も総理と一緒に頑張れて光栄でした！`;
  };

  const startGame = async () => {
    console.log('🎮 ゲーム開始');
    setGameState(prev => ({ 
      ...prev, 
      isGameStarted: true, 
      turn: 1, 
      currentEvent: {
        id: 'start_event',
        title: '政権発足',
        description: '新しい政権が発足しました。国民の期待を背負い、日本の未来を導いてください。',
        options: [
          { text: '経済政策を最優先に取り組む', effect: { approvalRating: 5, gdp: 10 } },
          { text: '外交関係の強化を図る', effect: { approvalRating: 3, diplomacy: 8 } },
          { text: '環境問題に積極的に取り組む', effect: { approvalRating: 4, environment: 10 } },
        ]
      }
    }));
    
    setTimeout(() => {
      displayMessage('総理、いよいよ政権運営の始まりね！私がしっかりサポートするから頑張りましょ！');
    }, 1000);
  };

  const handlePolicyChoice = async (option: PolicyOption) => {
    if (isProcessing || !gameState.currentEvent) return;
    setIsProcessing(true);
    
    setTimeout(() => {
      setGameState(prev => {
        const next = { ...prev };
        const eff = option.effect;
        
        // 効果適用
        if (eff.approvalRating) next.approvalRating = Math.max(0, Math.min(100, next.approvalRating + eff.approvalRating));
        if (eff.gdp) next.gdp = Math.max(0, next.gdp + eff.gdp);
        if (eff.nationalDebt) next.nationalDebt = Math.max(0, next.nationalDebt + eff.nationalDebt);
        if (eff.technology) next.technology = Math.max(0, Math.min(100, next.technology + eff.technology));
        if (eff.environment) next.environment = Math.max(0, Math.min(100, next.environment + eff.environment));
        if (eff.stockPrice) next.stockPrice = Math.max(10000, next.stockPrice + eff.stockPrice);
        if (eff.usdJpyRate) next.usdJpyRate = Math.max(100, Math.min(200, next.usdJpyRate + eff.usdJpyRate));
        if (eff.diplomacy) next.diplomacy = Math.max(0, Math.min(100, next.diplomacy + eff.diplomacy));
        
        // ログ追加
        next.gameLog = [
          ...next.gameLog,
          { turn: next.turn, event: next.currentEvent!.title, choice: option.text, effect: eff },
        ];
        
        // 次ターンor終了判定
        if (next.turn >= next.maxTurns) {
          next.isGameOver = true;
          const score = Math.round((next.approvalRating + next.technology + next.environment + next.diplomacy) / 4);
          setFinalScore(score);
        } else {
          next.turn += 1;
          // 次のイベント（簡単な例）
          next.currentEvent = {
            id: `event_${next.turn}`,
            title: `政治課題 ${next.turn}`,
            description: `ターン${next.turn}の政治課題が発生しました。`,
            options: [
              { text: '慎重に対応する', effect: { approvalRating: 2 } },
              { text: '積極的に対応する', effect: { approvalRating: 4, nationalDebt: 20 } },
              { text: '専門家に相談する', effect: { approvalRating: 1, technology: 3 } },
            ]
          };
        }
        
        return next;
      });
      
      setIsProcessing(false);
      
      // KASUMIメッセージ
      setTimeout(() => {
        displayMessage('なかなか良い判断だったんじゃない？次も頑張りましょ！');
      }, 1000);
    }, 800);
  };

  const resetGame = () => {
    setGameState({
      turn: 1,
      maxTurns: 5,
      approvalRating: 50,
      nationalDebt: 1000,
      gdp: 500,
      technology: 50,
      environment: 50,
      stockPrice: 28000,
      usdJpyRate: 148,
      diplomacy: 50,
      isGameStarted: false,
      isGameOver: false,
      currentEvent: null,
      gameLog: [],
      kasumiMessage: '総理、お疲れ様です。政治情勢の分析を開始いたします。',
      kasumiDisplayMessage: '',
      isTyping: false,
      isAIThinking: false,
      typingTimer: null,
      lastEffect: null,
      showEffectDetails: false,
      historyData: [],
      usedEventIds: [],
      eventPool: [],
      politicalTrends: {
        approvalTrend: 'stable',
        economicTrend: 'stable',
        riskLevel: 'low'
      },
      emergencyEventCount: 0,
    });
    setSecretaryComment('');
    setIsGeneratingComment(false);
  };

  // レンダリング
  if (!gameState.isGameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            🎌 AI駆動総理大臣シミュレーター
          </h1>
          <p className="text-xl mb-8 text-gray-300">
            AIが生成する政治課題に対して、あなたの判断で日本を導いてください。
          </p>
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            🏛️ ゲーム開始
          </button>
        </div>
      </div>
    );
  }

  if (gameState.isGameOver) {
    const rankData = calculateFinalRank();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-2">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">🏛️ 政権終了</h1>
            <div className="bg-slate-800 rounded-lg p-6 mb-6">
              <div className="text-6xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {rankData.totalScore}点
              </div>
              <div className={`text-2xl font-bold ${rankData.rankColor} mb-4`}>
                {rankData.rank} - {rankData.rankTitle}
              </div>
            </div>
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={resetGame}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
              >
                🔄 もう一度プレイ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ゲーム画面
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-2">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">🏛️ 総理大臣シミュレーター</h1>
          <div className="text-lg">
            ターン {gameState.turn}/{gameState.maxTurns} | 支持率: {gameState.approvalRating}%
          </div>
        </div>

        {/* 現在のイベント */}
        {gameState.currentEvent && (
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-cyan-300">
              {gameState.currentEvent.title}
            </h2>
            <p className="text-gray-300 mb-6 leading-relaxed">
              {gameState.currentEvent.description}
            </p>
            
            <div className="space-y-3">
              {gameState.currentEvent.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handlePolicyChoice(option)}
                  disabled={isProcessing}
                  className="w-full text-left p-4 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all duration-200 border border-slate-600 hover:border-cyan-500"
                >
                  <div className="font-medium text-white">{option.text}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* KASUMIメッセージ */}
        <div className="bg-gradient-to-r from-pink-900/50 to-purple-900/50 rounded-lg p-4 mb-6 border border-pink-500/30">
          <div className="flex items-start gap-3">
            <div className="text-2xl">👩‍💼</div>
            <div>
              <div className="font-bold text-pink-300 mb-1">AI政治秘書 KASUMI</div>
              <div className="text-gray-300">
                {gameState.kasumiDisplayMessage || gameState.kasumiMessage}
              </div>
            </div>
          </div>
        </div>

        {/* ステータス表示 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">支持率</div>
            <div className="text-2xl font-bold text-cyan-300">{gameState.approvalRating}%</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">GDP</div>
            <div className="text-2xl font-bold text-green-300">{gameState.gdp}兆円</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">外交</div>
            <div className="text-2xl font-bold text-blue-300">{gameState.diplomacy}</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="text-sm text-gray-400">環境</div>
            <div className="text-2xl font-bold text-purple-300">{gameState.environment}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;