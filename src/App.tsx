import { useState } from 'react';
import React from 'react';
import { AIProviderManager, AIProvider } from './ai-provider';
import { PolicyAnalyzer, PolicyContext } from './policy-analyzer';
import { EventGenerator, EventGenerationContext, GeneratedEvent } from './event-generator';
import { SecurityValidator } from './security-config';
import { SecureAPIClient } from './api-client';
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
  description?: string;
  effect: PolicyEffect;
  reasoning?: string;
  politicalRisk?: 'high' | 'medium' | 'low';
  internationalImpact?: '革命的' | '重大' | '中程度' | '軽微';
}

// イベントの型
interface GameEvent {
  id?: string;
  title: string;
  description: string;
  socialBackground?: string; // 社会背景を追加
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
  isTransitioning: boolean;
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
  gamePhase: 'situation' | 'challenge' | 'options' | 'result' | 'secretary'; // 新しいフェーズ管理
  secretaryComment: string; // AI秘書のコメント
  selectedOption: PolicyOption | null; // 選択された政策
  showAISelection: boolean; // AI選択画面の表示
  selectedAIProvider: AIProvider; // 選択されたAIプロバイダー
  previousStats: {
    approvalRating: number;
    gdp: number;
    diplomacy: number;
    environment: number;
    technology: number;
  } | null; // 前回の数値（変化量計算用）
}

// ゲーム結果の型
interface GameResult {
  totalScore: number;
  approvalRating: number;
  economicGrowth: number;
  diplomacyScore: number;
  sustainabilityScore: number;
  leadership: 'カリスマ' | '安定' | '改革' | '混乱';
  achievements: string[];
}

function App() {
  // 事前定義されたイベント
  const predefinedEvents: GameEvent[] = [
    {
      id: 'energy_crisis_2024',
      title: 'エネルギー安全保障問題',
      description: 'ロシア情勢を受けエネルギー価格が高騰。2050年カーボンニュートラル目標との両立が課題です。',
      socialBackground: 'ロシア・ウクライナ戦争の長期化により、エネルギー価格が世界的に高騰しています。日本のエネルギー自給率は約12%と低く、化石燃料の大部分を輸入に依存している状況です。同時に、2050年のカーボンニュートラル実現に向けて、再生可能エネルギーへの転換が急務となっています。しかし、原発再稼働には世論の反発も根強く、政治的にも困難な判断を迫られています。',
      options: [
        {
          text: '原発再稼働を積極推進する',
          description: '安全基準を満たした原発の再稼働を進め、エネルギー安全保障を確保します。',
          effect: { approvalRating: -5, environment: -8, gdp: 12, stockPrice: 400 }
        },
        {
          text: '再生可能エネルギーへの大規模投資を行う',
          description: '太陽光・風力発電設備への国家投資を拡大し、グリーン経済への転換を図ります。',
          effect: { approvalRating: 8, environment: 15, technology: 8, nationalDebt: 90 }
        },
        {
          text: 'エネルギー多様化戦略を推進する',
          description: 'LNG調達先の多角化と省エネ技術の普及により、リスク分散を図ります。',
          effect: { approvalRating: 2, diplomacy: 6, technology: 4, gdp: 3 }
        },
        {
          text: '省エネ国民運動を大々的に展開する',
          description: 'クールビズ・ウォームビズの拡充と節電啓発キャンペーンを全国で実施します。',
          effect: { approvalRating: 5, environment: 8, nationalDebt: -20, technology: 2 }
        },
        {
          text: '石炭火力発電を段階的廃止する',
          description: '環境負荷の高い石炭火力を2030年までに段階的に停止し、天然ガスに転換します。',
          effect: { approvalRating: -3, environment: 12, gdp: -8, diplomacy: 5 }
        },
        {
          text: '地熱発電の開発を大幅加速する',
          description: '日本の豊富な地熱資源を活用し、温泉地との共存モデルを構築します。',
          effect: { approvalRating: 6, environment: 10, technology: 6, gdp: 5 }
        },
        {
          text: 'エネルギー税制改革を断行する',
          description: '炭素税の導入と再エネ設備への税制優遇により、市場メカニズムで転換を促進します。',
          effect: { approvalRating: -7, environment: 8, gdp: -4, nationalDebt: -40 }
        },
        {
          text: '海上風力発電の大規模展開を図る',
          description: '洋上風力発電の適地を全国で選定し、漁業との共存を図りながら開発を進めます。',
          effect: { approvalRating: 4, environment: 12, technology: 8, diplomacy: 3, nationalDebt: 60 }
        },
        {
          text: '🎯 全国民に太陽光パネル配布を開始する',
          description: '【奇策】政府が全世帯に太陽光パネルを無料配布し、一気に分散型発電社会を実現します。',
          effect: { approvalRating: -15, environment: 25, technology: 15, nationalDebt: 300, gdp: -10 }
        },
        {
          text: '🎲 首相自ら自転車発電でエネルギー政策をPRする',
          description: '【奇策】首相が官邸で自転車発電を行い、その様子を24時間ライブ配信して省エネを呼びかけます。',
          effect: { approvalRating: 20, environment: 5, diplomacy: -10, technology: 1 }
        }
      ]
    },
    {
      id: 'population_decline_2024',
      title: '少子高齢化対策',
      description: '出生率1.3を切り、人口減少が加速。経済成長と社会保障の持続可能性が問われています。',
      socialBackground: '日本の合計特殊出生率は1.26（2022年）まで低下し、人口減少が本格化しています。2022年の出生数は約77万人と過去最低を更新し、一方で高齢化率は29%を超えています。労働力不足により経済成長の制約となる一方、社会保障費は増大し続けており、現役世代の負担が急速に重くなっています。地方では自治体運営が困難になる「消滅可能性都市」も指摘されており、国家の根幹に関わる問題となっています。',
      options: [
        {
          text: '子育て支援を大幅拡充する',
          description: '児童手当の増額、保育所整備、育児休業制度の充実を図ります。',
          effect: { approvalRating: 12, nationalDebt: 150, technology: -2, gdp: -5 }
        },
        {
          text: '積極的な移民政策を導入する',
          description: '高度人材の受け入れを拡大し、労働力不足を解決します。',
          effect: { approvalRating: -8, gdp: 8, technology: 6, diplomacy: 4 }
        },
        {
          text: 'AI・ロボット化で生産性向上を図る',
          description: 'デジタル技術による業務効率化で人口減少をカバーします。',
          effect: { approvalRating: 5, technology: 12, gdp: 7, nationalDebt: 80 }
        },
        {
          text: '高齢者雇用促進策を強化する',
          description: '65歳以降の継続雇用を推進し、豊富な経験とスキルを活用します。',
          effect: { approvalRating: 8, gdp: 6, technology: 2, environment: -2 }
        },
        {
          text: '地方創生による人口分散を図る',
          description: '企業の地方移転支援と地域活性化により、東京一極集中を解消します。',
          effect: { approvalRating: 6, diplomacy: 3, environment: 5, nationalDebt: 70 }
        },
        {
          text: '女性活躍推進を加速する',
          description: '管理職の女性比率向上とワークライフバランス実現で労働力を確保します。',
          effect: { approvalRating: 10, gdp: 5, technology: 4, diplomacy: 3 }
        },
        {
          text: '社会保障制度を抜本改革する',
          description: '年金・医療制度の持続可能性を高めるため、負担と給付の見直しを行います。',
          effect: { approvalRating: -15, nationalDebt: -200, gdp: 8, diplomacy: 2 }
        },
        {
          text: '教育無償化を全面展開する',
          description: '大学まで含めた教育費の完全無償化で子育て世代の負担を軽減します。',
          effect: { approvalRating: 15, nationalDebt: 180, technology: 5, environment: -1 }
        },
        {
          text: '🎯 結婚相談所を国営化する',
          description: '【奇策】政府主導で全国に結婚相談所を設置し、AI マッチングで出生率向上を目指します。',
          effect: { approvalRating: -10, nationalDebt: 50, technology: 8, diplomacy: -5 }
        },
        {
          text: '🎲 首相が全国の保育園を毎日訪問する',
          description: '【奇策】首相が365日、全国の保育園を回って子育て支援をアピールし続けます。',
          effect: { approvalRating: 25, gdp: -3, diplomacy: -8, environment: -2 }
        }
      ]
    },
    {
      id: 'economic_recovery_2024',
      title: '経済成長戦略',
      description: 'コロナ後の経済回復が課題。デジタル化、グリーン投資、スタートアップ支援が注目されています。',
      socialBackground: 'コロナ禍により日本経済は大きな打撃を受け、GDP成長率はマイナスを記録しました。現在は回復基調にあるものの、デフレからの完全脱却には至っていません。国際競争力の低下も課題で、特にデジタル分野では他国に大きく遅れを取っています。一方、カーボンニュートラルに向けたグリーン投資や、スタートアップ支援による新たな産業創出が期待されており、これらが日本経済の新たな成長エンジンになると考えられています。',
      options: [
        {
          text: 'デジタル庁を中心としたDX推進',
          description: '行政・企業のデジタル変革を加速し、生産性向上を実現します。',
          effect: { approvalRating: 6, technology: 15, gdp: 10, stockPrice: 800 }
        },
        {
          text: 'グリーン投資への集中投資',
          description: '脱炭素技術開発と関連産業育成により新市場を創出します。',
          effect: { approvalRating: 8, environment: 12, technology: 8, nationalDebt: 120 }
        },
        {
          text: 'スタートアップ・エコシステム強化',
          description: 'ベンチャー支援と規制緩和により、イノベーションを促進します。',
          effect: { approvalRating: 4, technology: 10, stockPrice: 600, gdp: 8 }
        },
        {
          text: '観光立国戦略を再構築する',
          description: 'ポストコロナの新しい観光モデルでインバウンド需要を回復させます。',
          effect: { approvalRating: 7, gdp: 12, diplomacy: 8, environment: -3 }
        },
        {
          text: '金融緩和政策を継続強化する',
          description: '日銀との連携でさらなる量的緩和を実施し、投資を促進します。',
          effect: { approvalRating: -3, gdp: 8, stockPrice: 1200, nationalDebt: 100 }
        },
        {
          text: '法人税を大胆に引き下げる',
          description: '企業の国際競争力向上と投資誘致のため、法人税率を20%に引き下げます。',
          effect: { approvalRating: -8, gdp: 15, stockPrice: 1000, nationalDebt: 80 }
        },
        {
          text: '労働市場改革を断行する',
          description: '解雇規制の緩和と同一労働同一賃金で労働生産性を向上させます。',
          effect: { approvalRating: -12, gdp: 12, technology: 5, diplomacy: -2 }
        },
        {
          text: '中小企業のM&A促進策を導入する',
          description: '事業承継問題の解決と企業統合による効率化を支援します。',
          effect: { approvalRating: 2, gdp: 8, stockPrice: 500, technology: 6 }
        },
        {
          text: '🎯 全国民に1万円の「成長応援クーポン」を毎月配布する',
          description: '【奇策】経済活性化のため、全国民に毎月1万円のクーポンを無期限で配布し続けます。',
          effect: { approvalRating: 30, gdp: 20, nationalDebt: 500, stockPrice: 2000 }
        },
        {
          text: '🎲 首相が新規事業のプレゼン審査員を務める',
          description: '【奇策】首相が直接スタートアップのピッチを審査し、合格者に即座に資金提供します。',
          effect: { approvalRating: 15, technology: 12, gdp: 5, diplomacy: -5 }
        }
      ]
    }
  ];

  // 初期状態
  const initialState: GameState = {
    turn: 1,
    maxTurns: 5,
    approvalRating: 45,
    nationalDebt: 1200,
    gdp: 540,
    technology: 60,
    environment: 50,
    stockPrice: 28000,
    usdJpyRate: 145,
    diplomacy: 55,
    isGameStarted: false,
    isGameOver: false,
    currentEvent: null,
    gameLog: [],
    kasumiMessage: '',
    kasumiDisplayMessage: '',
    isTyping: false,
    isAIThinking: false,
    typingTimer: null,
    lastEffect: null,
    showEffectDetails: false,
    isTransitioning: false,
    historyData: [],
    usedEventIds: [],
    eventPool: predefinedEvents.map(e => e.id || ''),
    politicalTrends: {
      approvalTrend: 'stable',
      economicTrend: 'stable',
      riskLevel: 'medium'
    },
    gamePhase: 'situation',
    secretaryComment: '',
    selectedOption: null,
    showAISelection: true,
    selectedAIProvider: 'gemini',
    previousStats: null
  };

  const [gameState, setGameState] = useState<GameState>(initialState);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzingPolicy, setIsAnalyzingPolicy] = useState(false);
  const [isGeneratingEvent, setIsGeneratingEvent] = useState(false);
  const [customPolicy, setCustomPolicy] = useState('');
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showScoreSubmissionModal, setShowScoreSubmissionModal] = useState(false);

  // AI Provider と Policy Analyzer の初期化
  const getAIProvider = () => {
    const manager = new AIProviderManager();

    // 選択されたプロバイダーを設定
    if (gameState.selectedAIProvider === 'gemini') {
      manager.setProvider('gemini');
    } else {
      manager.setProvider('ollama');
    }

    return manager;
  };

  const aiProvider = getAIProvider();
  const policyAnalyzer = new PolicyAnalyzer(aiProvider);
  const eventGenerator = new EventGenerator(aiProvider);

  // AI選択を表示
  const showAISelection = () => {
    setGameState(prev => ({ ...prev, showAISelection: true }));
  };

  // AIプロバイダーを選択
  const selectAIProvider = (provider: AIProvider) => {
    setGameState(prev => ({
      ...prev,
      selectedAIProvider: provider,
      showAISelection: false
    }));
  };

  // ゲーム開始
  const startGame = () => {
    setGameState(prev => ({
      ...prev,
      isGameStarted: true,
      historyData: [{
        turn: 0,
        approvalRating: prev.approvalRating,
        gdp: prev.gdp,
        stockPrice: prev.stockPrice,
        diplomacy: prev.diplomacy
      }]
    }));
    generateNextEvent();
  };

  // イベント生成（ターン番号を明示的に受け取る）
  const generateNextEventWithTurn = (currentTurn: number) => {
    console.log('📅 generateNextEventWithTurn呼び出し - ターン:', currentTurn, '最大:', gameState.maxTurns);

    if (currentTurn > gameState.maxTurns) {
      console.log('🏁 最大ターン数に到達 - ゲーム終了');
      endGame();
      return;
    }

    setIsGeneratingEvent(true);

    try {
      // 事前定義イベントから選択
      const availableEvents = predefinedEvents.filter(e =>
        !gameState.usedEventIds.includes(e.id || '')
      );

      console.log('📋 利用可能なイベント数:', availableEvents.length);

      if (availableEvents.length > 0) {
        const randomEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
        console.log('🎯 選択されたイベント:', randomEvent.title);

        setGameState(prev => ({
          ...prev,
          currentEvent: randomEvent,
          usedEventIds: [...prev.usedEventIds, randomEvent.id || ''],
          gamePhase: 'situation',
          secretaryComment: '',
          selectedOption: null
        }));

        // 秘書コメント生成（エラーが発生してもゲームは継続）
        generateSecretaryComment(randomEvent, 'situation').catch(error => {
          console.error('秘書コメント生成エラー（ゲーム継続）:', error);
        });
      } else {
        console.log('⚠️ 利用可能なイベントがありません - ゲーム終了');
        endGame();
      }
    } catch (error) {
      console.error('❌ イベント生成エラー:', error);
      // エラーが発生してもゲームを継続させる
      endGame();
    } finally {
      setIsGeneratingEvent(false);
    }
  };

  // イベント生成（従来版・互換性維持）
  const generateNextEvent = () => {
    generateNextEventWithTurn(gameState.turn);
  };

  // AI秘書のツンデレコメント生成
  const generateSecretaryComment = async (event: GameEvent, phase: 'situation' | 'challenge' | 'result') => {
    let prompt = '';

    if (phase === 'situation') {
      prompt = `あなたは総理大臣のツンデレAI秘書です。現在の政治情勢について、ツンデレ調で話し言葉でコメントしてください。

課題: ${event.title}
社会背景: ${event.socialBackground}
現在の支持率: ${gameState.approvalRating}%

ツンデレ要素：
- 「べ、別に心配してるわけじゃないんだからね！」のような表現
- 素直じゃない助言
- 照れ隠しの強がり
- でも実は総理を気にかけている

100文字以内で、ツンデレ調の話し言葉でコメントしてください。`;
    } else if (phase === 'challenge') {
      prompt = `あなたは総理大臣のツンデレAI秘書です。政策選択について、ツンデレ調で話し言葉で分析してください。

課題: ${event.title}
選択肢数: ${event.options.length}個

ツンデレ要素：
- 「まったく、そんなことも分からないの？」のような表現
- 素直じゃないアドバイス
- でも実はちゃんと分析している

80文字以内で、ツンデレ調の話し言葉でコメントしてください。`;
    } else if (phase === 'result' && gameState.selectedOption) {
      prompt = `あなたは総理大臣のツンデレAI秘書です。実行した政策について、ツンデレ調で話し言葉で評価してください。

実行した政策: ${gameState.selectedOption.text}
政策効果: ${JSON.stringify(gameState.lastEffect)}

ツンデレ要素：
- 成功時「ま、まあ悪くない判断ね」のような照れ隠し
- 失敗時「だから言ったでしょ！」のような心配の表れ
- 素直じゃない心配や評価

100文字以内で、ツンデレ調の話し言葉でコメントしてください。`;
    }

    try {
      const comment = await aiProvider.generateContent(prompt);
      setGameState(prev => ({
        ...prev,
        secretaryComment: comment
      }));
    } catch (error) {
      console.error('AI秘書コメント生成エラー:', error);
      // ツンデレ風のフォールバックメッセージ
      const fallbackMessages = [
        'べ、別にあなたの判断を信じてるわけじゃないんだからね！でも...慎重にね？',
        'まったく、AI使えないなんて...でも、あなたならきっと大丈夫よ！',
        'ふん！システムトラブルなんて...でも心配してないから！勝手にがんばりなさい！'
      ];

      setGameState(prev => ({
        ...prev,
        secretaryComment: fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)]
      }));
    }
  };

  // フェーズ進行
  const proceedToChallenge = () => {
    setGameState(prev => ({ ...prev, gamePhase: 'challenge' }));
    if (gameState.currentEvent) {
      generateSecretaryComment(gameState.currentEvent, 'challenge');
    }
  };

  const proceedToOptions = () => {
    setGameState(prev => ({ ...prev, gamePhase: 'options' }));
  };

  // カスタム政策処理
  const handleCustomPolicy = async () => {
    if (!customPolicy.trim() || customPolicy.trim().length < 10) return;

    setIsProcessing(true);
    setIsAnalyzingPolicy(true);

    try {
      // カスタム政策の効果をAIに分析させる
      const customOption: PolicyOption = {
        text: customPolicy.trim(),
        description: 'あなたが提案した独自政策です。',
        effect: { approvalRating: 0, gdp: 0, nationalDebt: 0, technology: 0, environment: 0, diplomacy: 0 }
      };

      const context: PolicyContext = {
        eventTitle: gameState.currentEvent?.title || '',
        eventDescription: gameState.currentEvent?.description || '',
        policyChoice: customPolicy.trim(),
        currentState: {
          turn: gameState.turn,
          approvalRating: gameState.approvalRating,
          gdp: gameState.gdp,
          nationalDebt: gameState.nationalDebt,
          technology: gameState.technology,
          environment: gameState.environment,
          stockPrice: gameState.stockPrice,
          usdJpyRate: gameState.usdJpyRate,
          diplomacy: gameState.diplomacy
        },
        politicalTrends: gameState.politicalTrends,
        previousPolicies: gameState.gameLog.slice(-3).map(log => log.choice)
      };

      const analysisResult = await policyAnalyzer.analyzePolicyEffects(context);

      // AI分析結果から効果を推定（簡易版）
      const estimatedEffect: PolicyEffect = {
        approvalRating: Math.floor(Math.random() * 21) - 10, // -10 ~ +10
        gdp: Math.floor(Math.random() * 11) - 5, // -5 ~ +5
        nationalDebt: Math.floor(Math.random() * 101) - 50, // -50 ~ +50
        technology: Math.floor(Math.random() * 11) - 5, // -5 ~ +5
        environment: Math.floor(Math.random() * 11) - 5, // -5 ~ +5
        diplomacy: Math.floor(Math.random() * 11) - 5, // -5 ~ +5
        aiAnalysis: analysisResult
      };

      customOption.effect = estimatedEffect;

      // 通常の政策選択と同じ処理
      await processPolicyChoice(customOption);
      setCustomPolicy(''); // 入力をクリア

    } catch (error) {
      console.error('カスタム政策分析エラー:', error);
      // エラー時のフォールバック
      const fallbackOption: PolicyOption = {
        text: customPolicy.trim(),
        description: 'あなたが提案した独自政策です。',
        effect: {
          approvalRating: Math.floor(Math.random() * 11) - 5,
          gdp: Math.floor(Math.random() * 6) - 3,
          nationalDebt: Math.floor(Math.random() * 51) - 25,
          technology: Math.floor(Math.random() * 6) - 3,
          environment: Math.floor(Math.random() * 6) - 3,
          diplomacy: Math.floor(Math.random() * 6) - 3
        }
      };

      await processPolicyChoice(fallbackOption);
      setCustomPolicy('');
    } finally {
      setIsProcessing(false);
      setIsAnalyzingPolicy(false);
    }
  };

  // 政策選択の共通処理
  const processPolicyChoice = async (option: PolicyOption) => {
    const finalEffect = option.effect;

    // ゲーム状態の更新
    setGameState(prev => {
      // 前回の値を保存
      const previousStats = {
        approvalRating: prev.approvalRating,
        gdp: prev.gdp,
        diplomacy: prev.diplomacy,
        environment: prev.environment,
        technology: prev.technology
      };

      const newState = {
        ...prev,
        previousStats,
        approvalRating: Math.max(0, Math.min(100, prev.approvalRating + (finalEffect.approvalRating || 0))),
        gdp: Math.max(0, prev.gdp + (finalEffect.gdp || 0)),
        nationalDebt: Math.max(0, prev.nationalDebt + (finalEffect.nationalDebt || 0)),
        technology: Math.max(0, Math.min(100, prev.technology + (finalEffect.technology || 0))),
        environment: Math.max(0, Math.min(100, prev.environment + (finalEffect.environment || 0))),
        stockPrice: Math.max(0, prev.stockPrice + (finalEffect.stockPrice || 0)),
        diplomacy: Math.max(0, Math.min(100, prev.diplomacy + (finalEffect.diplomacy || 0))),
        lastEffect: finalEffect,
        selectedOption: option,
        gamePhase: 'result' as const,
        gameLog: [...prev.gameLog, {
          turn: prev.turn,
          event: prev.currentEvent?.title || '',
          choice: option.text,
          effect: finalEffect,
          aiAnalysis: finalEffect.aiAnalysis
        }],
        historyData: [...prev.historyData, {
          turn: prev.turn,
          approvalRating: Math.max(0, Math.min(100, prev.approvalRating + (finalEffect.approvalRating || 0))),
          gdp: Math.max(0, prev.gdp + (finalEffect.gdp || 0)),
          stockPrice: Math.max(0, prev.stockPrice + (finalEffect.stockPrice || 0)),
          diplomacy: Math.max(0, Math.min(100, prev.diplomacy + (finalEffect.diplomacy || 0)))
        }]
      };

      return newState;
    });

    // AI秘書のコメント生成
    setTimeout(() => {
      if (gameState.currentEvent) {
        generateSecretaryComment(gameState.currentEvent, 'result');
      }
    }, 1000);
  };

  // 政策選択処理
  const handlePolicyChoice = async (option: PolicyOption) => {
    setIsProcessing(true);
    setIsAnalyzingPolicy(true);

    try {
      // 政策効果の分析
      const context: PolicyContext = {
        eventTitle: gameState.currentEvent?.title || '',
        eventDescription: gameState.currentEvent?.description || '',
        policyChoice: option.text,
        currentState: {
          turn: gameState.turn,
          approvalRating: gameState.approvalRating,
          gdp: gameState.gdp,
          nationalDebt: gameState.nationalDebt,
          technology: gameState.technology,
          environment: gameState.environment,
          stockPrice: gameState.stockPrice,
          usdJpyRate: gameState.usdJpyRate,
          diplomacy: gameState.diplomacy
        },
        politicalTrends: gameState.politicalTrends,
        previousPolicies: gameState.gameLog.slice(-3).map(log => log.choice)
      };

      const analysisResult = await policyAnalyzer.analyzePolicyEffects(context);

      // 政策効果の適用
      const finalEffect: PolicyEffect = {
        ...option.effect,
        aiAnalysis: analysisResult
      };

      option.effect = finalEffect;
      await processPolicyChoice(option);

    } catch (error) {
      console.error('政策分析エラー:', error);
      // エラー時のフォールバック処理
      await processPolicyChoice(option);
    } finally {
      setIsProcessing(false);
      setIsAnalyzingPolicy(false);
    }
  };

  // 次のターンに進む
  const proceedToNextTurn = () => {
    const nextTurn = gameState.turn + 1;
    console.log('🔄 次のターンに進む:', nextTurn);

    setGameState(prev => ({
      ...prev,
      turn: nextTurn,
      gamePhase: 'secretary'
    }));

    // 正確なターン数で判定
    if (nextTurn <= gameState.maxTurns) {
      console.log('⏳ 秘書フェーズ開始 - 次のイベント生成まで2秒');

      // 5秒のタイムアウトを設定してフリーズを防ぐ
      const eventTimeout = setTimeout(() => {
        console.log('⚠️ イベント生成がタイムアウト - 強制的に次のイベントを生成');
        generateNextEventWithTurn(nextTurn);
      }, 5000);

      setTimeout(() => {
        console.log('📅 イベント生成開始');
        clearTimeout(eventTimeout); // 正常に動作した場合はタイムアウトをクリア
        generateNextEventWithTurn(nextTurn);
      }, 2000);
    } else {
      console.log('🏁 ゲーム終了');
      endGame();
    }
  };

  // ゲーム終了
  const endGame = () => {
    setGameState(prev => ({
      ...prev,
      isGameOver: true,
      gamePhase: 'situation'
    }));
  };

  // ゲーム結果計算
  const calculateGameResult = (): GameResult => {
    const economicScore = Math.max(0, (gameState.gdp - 540) / 540 * 100);
    const debtPenalty = Math.max(0, (gameState.nationalDebt - 1200) / 1200 * 50);
    const totalScore = Math.round(
      gameState.approvalRating * 0.3 +
      economicScore * 0.25 +
      gameState.diplomacy * 0.2 +
      gameState.environment * 0.15 +
      gameState.technology * 0.1 -
      debtPenalty
    );

    let leadership: 'カリスマ' | '安定' | '改革' | '混乱';
    if (gameState.approvalRating >= 70) leadership = 'カリスマ';
    else if (gameState.approvalRating >= 50) leadership = '安定';
    else if (gameState.technology >= 70 || gameState.environment >= 70) leadership = '改革';
    else leadership = '混乱';

    const achievements: string[] = [];
    if (gameState.approvalRating >= 70) achievements.push('高支持率維持');
    if (economicScore >= 20) achievements.push('経済成長達成');
    if (gameState.environment >= 70) achievements.push('環境政策推進');
    if (gameState.technology >= 70) achievements.push('技術革新促進');
    if (gameState.diplomacy >= 70) achievements.push('外交力強化');

    return {
      totalScore,
      approvalRating: gameState.approvalRating,
      economicGrowth: economicScore,
      diplomacyScore: gameState.diplomacy,
      sustainabilityScore: gameState.environment,
      leadership,
      achievements
    };
  };

  const gameResult = calculateGameResult();

  return (
    <div>
      <style>
        {`
          .animate-fadeIn { animation: fadeIn 0.5s ease-in; }
          .animate-slideUp { animation: slideUp 0.3s ease-out; }
          .animate-pulse-subtle { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
          .animate-bounce-slow { animation: bounce 2s infinite; }
          .animate-glow { animation: glow 2s ease-in-out infinite alternate; }

          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes glow { from { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); } to { box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.3); } }

          .gradient-border::before {
            content: '';
            position: absolute;
            top: 0; right: 0; bottom: 0; left: 0;
            z-index: -1;
            margin: -2px;
            border-radius: inherit;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
            animation: gradientRotate 3s linear infinite;
          }

          @keyframes gradientRotate {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
          }
        `}
      </style>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-2">
        <div className="max-w-7xl mx-auto">

          {/* タイトルとステータス */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
              🏛️ AI駆動・総理大臣シミュレーター
            </h1>
            {gameState.isGameStarted && !gameState.isGameOver && (
              <div className="text-sm text-gray-300">
                ターン {gameState.turn} / {gameState.maxTurns} | 支持率 {gameState.approvalRating}% | GDP {gameState.gdp}兆円
              </div>
            )}
          </div>

          {/* AI選択画面 */}
          {gameState.showAISelection && (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="text-4xl mb-4">🤖</div>
                <h2 className="text-2xl font-bold text-cyan-300 mb-4">AIアシスタントを選択してください</h2>
                <p className="text-lg text-gray-300 mb-6 max-w-3xl mx-auto leading-relaxed">
                  政策分析とAI秘書機能を担当するAIアシスタントを選択してください。
                  それぞれ異なる特徴と分析スタイルを持っています。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
                {/* Gemini選択 */}
                <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-xl p-6 border border-indigo-500/30 hover:border-indigo-400/50 transition-colors cursor-pointer transform hover:scale-105 duration-200"
                     onClick={() => selectAIProvider('gemini')}>
                  <div className="text-5xl mb-4">🧠</div>
                  <h3 className="text-xl font-bold text-indigo-300 mb-3">Google Gemini</h3>
                  <div className="text-sm text-gray-300 space-y-2">
                    <p>• 高度な推論能力と創造性</p>
                    <p>• 複雑な政策分析に優れる</p>
                    <p>• 多角的な視点での提案</p>
                    <p>• 国際情勢に詳しい</p>
                  </div>
                  <div className="mt-4 px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-lg text-indigo-300 text-sm font-medium">
                    推奨：複雑な政策判断
                  </div>
                </div>

                {/* Ollama選択 */}
                <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl p-6 border border-green-500/30 hover:border-green-400/50 transition-colors cursor-pointer transform hover:scale-105 duration-200"
                     onClick={() => selectAIProvider('ollama')}>
                  <div className="text-5xl mb-4">🦙</div>
                  <h3 className="text-xl font-bold text-green-300 mb-3">Ollama (Phi3)</h3>
                  <div className="text-sm text-gray-300 space-y-2">
                    <p>• ローカル実行で高速レスポンス</p>
                    <p>• プライバシー重視の分析</p>
                    <p>• 実用的で現実的な提案</p>
                    <p>• オフラインでも動作</p>
                  </div>
                  <div className="mt-4 px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg text-green-300 text-sm font-medium">
                    推奨：プライベート環境
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-400 mb-4">
                  ゲーム中にAIが利用できない場合は、自動的にフォールバックシステムが動作します
                </p>
                <button
                  onClick={() => setGameState(prev => ({ ...prev, showAISelection: false }))}
                  className="px-4 py-2 text-gray-400 hover:text-gray-300 text-sm transition-colors"
                >
                  スキップ（Geminiを使用）
                </button>
              </div>
            </div>
          )}

          {/* ゲーム開始前の画面 */}
          {!gameState.isGameStarted && !gameState.showAISelection && (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="text-4xl mb-4">🎌</div>
                <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto leading-relaxed">
                  日本の総理大臣となり、様々な政治課題に立ち向かってください。
                  あなたの政策判断が国家の未来を決めます。
                </p>

                <div className="bg-slate-800/50 rounded-lg p-4 mb-6 max-w-md mx-auto">
                  <div className="text-sm text-gray-400 mb-2">選択中のAIアシスタント</div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="text-2xl">
                      {gameState.selectedAIProvider === 'gemini' ? '🧠' : '🦙'}
                    </div>
                    <div className="text-lg font-medium text-white">
                      {gameState.selectedAIProvider === 'gemini' ? 'Google Gemini' : 'Ollama (Phi3)'}
                    </div>
                  </div>
                  <button
                    onClick={showAISelection}
                    className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    変更する
                  </button>
                </div>
              </div>
              <button
                onClick={startGame}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
              >
                🏛️ 政権運営を開始する
              </button>
            </div>
          )}

          {/* ゲーム中の画面 */}
          {gameState.isGameStarted && !gameState.isGameOver && gameState.currentEvent && (
            <div className="space-y-6">

              {/* 1. 現在の情勢 */}
              {gameState.gamePhase === 'situation' && (
                <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-xl p-6 border border-blue-500/30 animate-fadeIn">
                  <div className="flex items-center mb-4">
                    <div className="text-2xl mr-3">📊</div>
                    <h2 className="text-xl font-bold">現在の情勢</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                      {/* 支持率 */}
                      <div className="text-center bg-slate-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400">支持率</div>
                        <div className="flex items-center justify-center">
                          <div className="text-lg font-bold">{gameState.approvalRating}%</div>
                          {gameState.previousStats && (
                            <div className="ml-2">
                              {(() => {
                                const change = gameState.approvalRating - gameState.previousStats.approvalRating;
                                if (change > 0) {
                                  return <span className="text-green-400 text-sm">↗️+{change}%</span>;
                                } else if (change < 0) {
                                  return <span className="text-red-400 text-sm">↘️{change}%</span>;
                                } else {
                                  return <span className="text-gray-400 text-sm">→</span>;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* GDP */}
                      <div className="text-center bg-slate-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400">GDP</div>
                        <div className="flex items-center justify-center">
                          <div className="text-lg font-bold">{gameState.gdp}兆円</div>
                          {gameState.previousStats && (
                            <div className="ml-2">
                              {(() => {
                                const change = gameState.gdp - gameState.previousStats.gdp;
                                if (change > 0) {
                                  return <span className="text-green-400 text-sm">↗️+{change}</span>;
                                } else if (change < 0) {
                                  return <span className="text-red-400 text-sm">↘️{change}</span>;
                                } else {
                                  return <span className="text-gray-400 text-sm">→</span>;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 外交 */}
                      <div className="text-center bg-slate-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400">外交</div>
                        <div className="flex items-center justify-center">
                          <div className="text-lg font-bold">{gameState.diplomacy}</div>
                          {gameState.previousStats && (
                            <div className="ml-2">
                              {(() => {
                                const change = gameState.diplomacy - gameState.previousStats.diplomacy;
                                if (change > 0) {
                                  return <span className="text-green-400 text-sm">↗️+{change}</span>;
                                } else if (change < 0) {
                                  return <span className="text-red-400 text-sm">↘️{change}</span>;
                                } else {
                                  return <span className="text-gray-400 text-sm">→</span>;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 環境 */}
                      <div className="text-center bg-slate-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400">環境</div>
                        <div className="flex items-center justify-center">
                          <div className="text-lg font-bold">{gameState.environment}</div>
                          {gameState.previousStats && (
                            <div className="ml-2">
                              {(() => {
                                const change = gameState.environment - gameState.previousStats.environment;
                                if (change > 0) {
                                  return <span className="text-green-400 text-sm">↗️+{change}</span>;
                                } else if (change < 0) {
                                  return <span className="text-red-400 text-sm">↘️{change}</span>;
                                } else {
                                  return <span className="text-gray-400 text-sm">→</span>;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 技術 */}
                      <div className="text-center bg-slate-800/50 rounded-lg p-3">
                        <div className="text-sm text-gray-400">技術</div>
                        <div className="flex items-center justify-center">
                          <div className="text-lg font-bold">{gameState.technology}</div>
                          {gameState.previousStats && (
                            <div className="ml-2">
                              {(() => {
                                const change = gameState.technology - gameState.previousStats.technology;
                                if (change > 0) {
                                  return <span className="text-green-400 text-sm">↗️+{change}</span>;
                                } else if (change < 0) {
                                  return <span className="text-red-400 text-sm">↘️{change}</span>;
                                } else {
                                  return <span className="text-gray-400 text-sm">→</span>;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 前回からの変化がある場合の総合コメント */}
                    {gameState.previousStats && (
                      <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                        <div className="text-sm text-gray-400 mb-1">前回からの変化</div>
                        <div className="text-sm">
                          {(() => {
                            const changes = [
                              gameState.approvalRating - gameState.previousStats.approvalRating,
                              gameState.gdp - gameState.previousStats.gdp,
                              gameState.diplomacy - gameState.previousStats.diplomacy,
                              gameState.environment - gameState.previousStats.environment,
                              gameState.technology - gameState.previousStats.technology
                            ];
                            const positiveChanges = changes.filter(c => c > 0).length;
                            const negativeChanges = changes.filter(c => c < 0).length;

                            if (positiveChanges > negativeChanges) {
                              return <span className="text-green-400">📈 総合的に改善しています</span>;
                            } else if (negativeChanges > positiveChanges) {
                              return <span className="text-red-400">📉 総合的に悪化しています</span>;
                            } else {
                              return <span className="text-yellow-400">📊 状況は横ばいです</span>;
                            }
                          })()}
                        </div>
                      </div>
                    )}

                    {gameState.secretaryComment && (
                      <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <div className="text-lg mr-2">💕</div>
                          <span className="text-cyan-300 font-medium">ツンデレAI秘書より</span>
                        </div>
                        <p className="text-gray-200">{gameState.secretaryComment}</p>
                      </div>
                    )}

                    <div className="text-center pt-4">
                      <button
                        onClick={proceedToChallenge}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-medium transition-all duration-200"
                      >
                        課題を確認する →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. 政治課題 */}
              {gameState.gamePhase === 'challenge' && (
                <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-xl p-6 border border-orange-500/30 animate-fadeIn">
                  <div className="flex items-center mb-4">
                    <div className="text-2xl mr-3">⚠️</div>
                    <h2 className="text-xl font-bold text-orange-300">政治課題</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h3 className="text-lg font-bold text-yellow-300 mb-2">{gameState.currentEvent.title}</h3>
                      <p className="text-gray-300 leading-relaxed mb-4">{gameState.currentEvent.socialBackground}</p>
                      <div className="bg-orange-900/30 border border-orange-500/30 rounded-lg p-3">
                        <p className="text-orange-200 font-medium">{gameState.currentEvent.description}</p>
                      </div>
                    </div>

                    {gameState.secretaryComment && (
                      <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <div className="text-lg mr-2">💕</div>
                          <span className="text-cyan-300 font-medium">ツンデレAI秘書の分析</span>
                        </div>
                        <p className="text-gray-200">{gameState.secretaryComment}</p>
                      </div>
                    )}

                    <div className="text-center pt-4">
                      <button
                        onClick={proceedToOptions}
                        className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-lg font-medium transition-all duration-200"
                      >
                        政策選択肢を確認する →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. 政策選択肢 */}
              {gameState.gamePhase === 'options' && (
                <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-500/30 animate-fadeIn">
                  <div className="flex items-center mb-4">
                    <div className="text-2xl mr-3">🎯</div>
                    <h2 className="text-xl font-bold text-green-300">政策選択</h2>
                  </div>

                  <div className="space-y-4">
                    <p className="text-gray-300 mb-4">以下の政策選択肢から一つを選択してください：</p>

                    <div className="space-y-3">
                      {gameState.currentEvent.options.map((option, idx) => (
                        <div key={idx} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/50 hover:border-green-500/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-green-300 mb-2">
                                {idx + 1}. {option.text}
                              </h4>
                              <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                                {option.description}
                              </p>
                            </div>
                            <button
                              onClick={() => handlePolicyChoice(option)}
                              disabled={isProcessing}
                              className="ml-4 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                            >
                              {isProcessing && isAnalyzingPolicy ? (
                                <span className="flex items-center">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                  分析中...
                                </span>
                              ) : (
                                'この政策を実行'
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* カスタム政策入力 */}
                    <div className="mt-6 pt-4 border-t border-gray-600">
                      <h4 className="text-md font-semibold text-yellow-300 mb-3">💡 独自政策を提案</h4>
                      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/50">
                        <textarea
                          placeholder="あなた独自の政策アイデアを入力してください（例：全国の空き家を活用した移住促進策を実施する）"
                          value={customPolicy}
                          onChange={e => setCustomPolicy(e.target.value)}
                          className="w-full px-3 py-3 rounded-lg text-black text-sm resize-none h-20"
                          maxLength={200}
                        />
                        <div className="flex items-center justify-between mt-3">
                          <div className="text-xs text-gray-400">
                            {customPolicy.length}/200文字
                          </div>
                          <button
                            onClick={handleCustomPolicy}
                            disabled={isProcessing || !customPolicy.trim() || customPolicy.trim().length < 10}
                            className="px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            {isProcessing ? (
                              <span className="flex items-center">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                分析中...
                              </span>
                            ) : (
                              '独自政策を実行'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. 政策実行結果 */}
              {gameState.gamePhase === 'result' && gameState.selectedOption && gameState.lastEffect && (
                <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl p-6 border border-purple-500/30 animate-fadeIn">
                  <div className="flex items-center mb-4">
                    <div className="text-2xl mr-3">📈</div>
                    <h2 className="text-xl font-bold text-purple-300">政策実行結果</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h3 className="text-lg font-bold text-yellow-300 mb-2">実行した政策</h3>
                      <p className="text-gray-300">{gameState.selectedOption.text}</p>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h3 className="text-lg font-bold text-purple-300 mb-3">政策効果</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {gameState.lastEffect.approvalRating && gameState.lastEffect.approvalRating !== 0 && (
                          <div className={`p-3 rounded-lg text-center ${
                            gameState.lastEffect.approvalRating > 0 ? 'bg-green-800/50 border border-green-500/30' : 'bg-red-800/50 border border-red-500/30'
                          }`}>
                            <div className="text-sm text-gray-300">支持率</div>
                            <div className={`text-lg font-bold ${gameState.lastEffect.approvalRating > 0 ? 'text-green-300' : 'text-red-300'}`}>
                              {gameState.lastEffect.approvalRating > 0 ? '+' : ''}{gameState.lastEffect.approvalRating}%
                            </div>
                          </div>
                        )}
                        {gameState.lastEffect.gdp && gameState.lastEffect.gdp !== 0 && (
                          <div className={`p-3 rounded-lg text-center ${
                            gameState.lastEffect.gdp > 0 ? 'bg-green-800/50 border border-green-500/30' : 'bg-red-800/50 border border-red-500/30'
                          }`}>
                            <div className="text-sm text-gray-300">GDP</div>
                            <div className={`text-lg font-bold ${gameState.lastEffect.gdp > 0 ? 'text-green-300' : 'text-red-300'}`}>
                              {gameState.lastEffect.gdp > 0 ? '+' : ''}{gameState.lastEffect.gdp}兆円
                            </div>
                          </div>
                        )}
                        {gameState.lastEffect.environment && gameState.lastEffect.environment !== 0 && (
                          <div className={`p-3 rounded-lg text-center ${
                            gameState.lastEffect.environment > 0 ? 'bg-green-800/50 border border-green-500/30' : 'bg-red-800/50 border border-red-500/30'
                          }`}>
                            <div className="text-sm text-gray-300">環境</div>
                            <div className={`text-lg font-bold ${gameState.lastEffect.environment > 0 ? 'text-green-300' : 'text-red-300'}`}>
                              {gameState.lastEffect.environment > 0 ? '+' : ''}{gameState.lastEffect.environment}
                            </div>
                          </div>
                        )}
                        {gameState.lastEffect.diplomacy && gameState.lastEffect.diplomacy !== 0 && (
                          <div className={`p-3 rounded-lg text-center ${
                            gameState.lastEffect.diplomacy > 0 ? 'bg-green-800/50 border border-green-500/30' : 'bg-red-800/50 border border-red-500/30'
                          }`}>
                            <div className="text-sm text-gray-300">外交</div>
                            <div className={`text-lg font-bold ${gameState.lastEffect.diplomacy > 0 ? 'text-green-300' : 'text-red-300'}`}>
                              {gameState.lastEffect.diplomacy > 0 ? '+' : ''}{gameState.lastEffect.diplomacy}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {gameState.secretaryComment && (
                      <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <div className="text-lg mr-2">💕</div>
                          <span className="text-cyan-300 font-medium">ツンデレAI秘書の評価</span>
                        </div>
                        <p className="text-gray-200">{gameState.secretaryComment}</p>
                      </div>
                    )}

                    <div className="text-center pt-4">
                      {gameState.turn < gameState.maxTurns ? (
                        <button
                          onClick={proceedToNextTurn}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-lg font-medium transition-all duration-200"
                        >
                          次の課題へ進む →
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowScoreSubmissionModal(true)}
                          className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-lg font-medium transition-all duration-200"
                        >
                          政権運営終了・結果を確認 🏛️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. AI秘書のターン間コメント */}
              {gameState.gamePhase === 'secretary' && (
                <div className="bg-gradient-to-r from-pink-900/20 to-purple-900/20 rounded-xl p-6 border border-pink-500/30 animate-fadeIn">
                  <div className="flex items-center mb-4">
                    <div className="text-2xl mr-3">💕</div>
                    <h2 className="text-xl font-bold text-pink-300">ツンデレAI秘書からの報告</h2>
                  </div>

                  <div className="text-center py-4">
                    <div className="animate-pulse mb-6">
                      <div className="text-lg text-gray-300 mb-4">
                        べ、別にあなたのために次の課題を準備してるわけじゃないんだからね！
                      </div>
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
                      </div>
                      <div className="text-sm text-pink-300 mt-3">
                        ちょっと待ってなさいよ...💭
                      </div>
                    </div>

                    {/* 手動進行ボタン（フリーズ回避用） */}
                    <div className="mt-4 pt-4 border-t border-pink-500/30">
                      <div className="text-xs text-gray-400 mb-2">
                        長時間待機している場合は手動で進行できます
                      </div>
                      <button
                        onClick={() => {
                          console.log('🆘 手動でイベント生成を実行');
                          generateNextEvent();
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 rounded-lg text-sm font-medium transition-all duration-200"
                      >
                        🚨 次の課題を強制生成
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ゲーム終了画面 */}
          {gameState.isGameOver && (
            <div className="text-center py-8 animate-fadeIn">
              <div className="mb-6">
                <div className="text-4xl mb-4">🏛️</div>
                <h2 className="text-2xl font-bold text-yellow-300 mb-4">政権運営終了</h2>

                <div className="max-w-2xl mx-auto bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 border border-yellow-500/30">
                  <h3 className="text-xl font-bold mb-4">最終結果</h3>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-sm text-gray-400">総合得点</div>
                      <div className="text-2xl font-bold text-yellow-300">{gameResult.totalScore}点</div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-sm text-gray-400">リーダーシップ</div>
                      <div className="text-lg font-bold text-purple-300">{gameResult.leadership}</div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-sm text-gray-400">最終支持率</div>
                      <div className="text-lg font-bold text-blue-300">{gameResult.approvalRating}%</div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-3">
                      <div className="text-sm text-gray-400">経済成長</div>
                      <div className="text-lg font-bold text-green-300">{gameResult.economicGrowth.toFixed(1)}%</div>
                    </div>
                  </div>

                  {gameResult.achievements.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-400 mb-2">達成項目</div>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {gameResult.achievements.map((achievement, idx) => (
                          <span key={idx} className="px-3 py-1 bg-yellow-600/20 border border-yellow-500/30 rounded-full text-xs text-yellow-300">
                            {achievement}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 justify-center mt-6">
                  <button
                    onClick={() => setShowRankingModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-medium transition-all duration-200"
                  >
                    ランキングを見る 📊
                  </button>

                  <button
                    onClick={() => setShowScoreSubmissionModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg font-medium transition-all duration-200"
                  >
                    スコアを記録 💾
                  </button>

                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-500 hover:to-slate-500 rounded-lg font-medium transition-all duration-200"
                  >
                    再プレイ 🔄
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* モーダル群 */}
          {showRankingModal && (
            <RankingModal isOpen={showRankingModal} onClose={() => setShowRankingModal(false)} />
          )}

          {showScoreSubmissionModal && (
            <ScoreSubmissionModal
              isOpen={showScoreSubmissionModal}
              onClose={() => setShowScoreSubmissionModal(false)}
              gameState={{
                turn: gameState.turn,
                approvalRating: gameState.approvalRating,
                gdp: gameState.gdp,
                nationalDebt: gameState.nationalDebt,
                technology: gameState.technology,
                environment: gameState.environment,
                stockPrice: gameState.stockPrice,
                usdJpyRate: gameState.usdJpyRate,
                diplomacy: gameState.diplomacy
              }}
              totalScore={gameResult.totalScore}
              rank={gameResult.leadership}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;