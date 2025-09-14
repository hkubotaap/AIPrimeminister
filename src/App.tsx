import { useState } from 'react';
import React from 'react';
import { AIProviderManager, AIProvider } from './ai-provider';
import { PolicyAnalyzer, PolicyContext } from './policy-analyzer';
import { EventGenerator, EventGenerationContext, GeneratedEvent } from './event-generator';
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

// 動的イベント生成システム
interface EventTemplate {
  id: string;
  category: string;
  title: string;
  description: string;
  options: PolicyOption[];
  conditions?: {
    minTurn?: number;
    maxTurn?: number;
    requiredPreviousEvents?: string[];
    gameStateConditions?: {
      approvalRating?: { min?: number; max?: number };
      gdp?: { min?: number; max?: number };
      stockPrice?: { min?: number; max?: number };
      diplomacy?: { min?: number; max?: number };
    };
  };
}

// 基本イベントテンプレート
const eventTemplates: EventTemplate[] = [
  {
    id: 'yen_crisis_1',
    category: 'economy',
    title: '急激な円安進行（150円突破）',
    description: 'ドル円レートが150円を突破し、輸入物価の上昇で国民生活に影響が出ています。日銀の金融政策との整合性も問われています。',
    options: [
      { text: '日銀と協調して為替介入を実施', effect: { approvalRating: 8, gdp: -5, nationalDebt: 30, usdJpyRate: -8, stockPrice: 500 } },
      { text: '金利政策の見直しを日銀に要請', effect: { approvalRating: -3, gdp: -8, stockPrice: -800, usdJpyRate: -5 } },
      { text: '市場の動向を注視し様子見', effect: { approvalRating: -5, usdJpyRate: 3, stockPrice: -200 } },
    ],
  },
  {
    id: 'semiconductor_1',
    category: 'technology',
    title: '半導体戦略と経済安全保障',
    description: '世界的な半導体不足が続く中、台湾有事リスクも高まっています。日本の半導体戦略の見直しが急務です。',
    options: [
      { text: 'TSMC誘致など海外企業との連携強化', effect: { approvalRating: 6, technology: 12, gdp: 15, nationalDebt: 80, diplomacy: 5 } },
      { text: '国内半導体産業への大規模投資', effect: { approvalRating: 4, technology: 8, gdp: 8, nationalDebt: 120, stockPrice: 300 } },
      { text: '日米半導体協定の再構築', effect: { approvalRating: 3, diplomacy: 8, technology: 5, stockPrice: 200 } },
    ],
  },
  {
    id: 'aging_society_1',
    category: 'social',
    title: '少子高齢化と社会保障制度改革',
    description: '出生率が1.3を下回り、社会保障費が急増しています。持続可能な制度設計が求められています。',
    options: [
      { text: '子育て支援予算を大幅拡充', effect: { approvalRating: 12, nationalDebt: 100, gdp: 5 } },
      { text: '年金支給開始年齢の段階的引き上げ', effect: { approvalRating: -15, nationalDebt: -50, gdp: 3 } },
      { text: '外国人労働者受け入れ拡大', effect: { approvalRating: -8, gdp: 8, diplomacy: 3 } },
    ],
  },
  {
    id: 'energy_1',
    category: 'environment',
    title: '脱炭素政策とエネルギー安全保障',
    description: 'ロシア情勢を受けエネルギー価格が高騰。2050年カーボンニュートラル目標との両立が課題です。',
    options: [
      { text: '原発再稼働を積極推進', effect: { approvalRating: -5, environment: -8, gdp: 12, stockPrice: 400 } },
      { text: '再生可能エネルギーへの大規模投資', effect: { approvalRating: 8, environment: 15, technology: 8, nationalDebt: 90 } },
      { text: 'LNG調達先の多角化推進', effect: { approvalRating: 3, gdp: -3, diplomacy: 5, environment: -3 } },
    ],
  },
  {
    id: 'china_relations_1',
    category: 'diplomacy',
    title: '中国との経済・外交関係',
    description: '中国の台湾政策強化により日中関係が緊張。一方で経済的結びつきは依然として強い状況です。',
    options: [
      { text: '対中制裁措置を段階的に強化', effect: { approvalRating: 5, diplomacy: -10, gdp: -12, stockPrice: -600 } },
      { text: '経済関係維持しつつ外交圧力', effect: { approvalRating: 2, diplomacy: -3, gdp: -2 } },
      { text: '日中首脳会談の早期実現を模索', effect: { approvalRating: -3, diplomacy: 8, gdp: 5, stockPrice: 300 } },
    ],
  },
  {
    id: 'digital_1',
    category: 'technology',
    title: 'デジタル庁とDX推進',
    description: 'マイナンバーカード普及率は向上したものの、システム障害が頻発。デジタル化の信頼回復が急務です。',
    options: [
      { text: 'システム刷新に追加予算投入', effect: { approvalRating: -2, technology: 8, nationalDebt: 50 } },
      { text: '民間IT企業との連携強化', effect: { approvalRating: 4, technology: 12, gdp: 6, stockPrice: 200 } },
      { text: 'デジタル庁の組織体制見直し', effect: { approvalRating: 6, technology: 5 } },
    ],
  },
];

// 緊急イベントテンプレート
const emergencyEventTemplates: EventTemplate[] = [
  {
    id: 'earthquake_emergency',
    category: 'emergency',
    title: '🚨 緊急事態：大規模地震発生',
    description: 'マグニチュード7.2の大地震が首都圏を襲いました。多数の建物が倒壊し、交通機関が麻痺。政府の迅速な対応が求められています。',
    options: [
      { text: '緊急事態宣言を発令し自衛隊を総動員', effect: { approvalRating: 15, gdp: -20, nationalDebt: 100, stockPrice: -800 } },
      { text: '災害対策本部を設置し段階的対応', effect: { approvalRating: 8, gdp: -10, nationalDebt: 60, stockPrice: -400 } },
      { text: '国際支援を要請し復旧を急ぐ', effect: { approvalRating: 5, gdp: -5, diplomacy: 8, nationalDebt: 40 } },
    ],
  },
  {
    id: 'volcano_emergency',
    category: 'emergency',
    title: '🚨 緊急事態：富士山噴火警戒',
    description: '富士山で火山活動が活発化し、噴火警戒レベルが最高レベルに引き上げられました。周辺住民の避難と経済への影響が懸念されます。',
    options: [
      { text: '大規模避難計画を即座に実行', effect: { approvalRating: 12, gdp: -15, nationalDebt: 80, environment: -5 } },
      { text: '観測体制を強化し慎重に対応', effect: { approvalRating: 6, gdp: -8, nationalDebt: 40, technology: 5 } },
      { text: '経済支援策を優先し企業を保護', effect: { approvalRating: 3, gdp: -5, nationalDebt: 60, stockPrice: 200 } },
    ],
  },
  {
    id: 'cyber_attack_emergency',
    category: 'emergency',
    title: '🚨 緊急事態：大規模サイバーテロ',
    description: '政府機関や重要インフラに対する大規模サイバー攻撃が発生。電力網や金融システムに深刻な影響が出ています。',
    options: [
      { text: 'サイバーセキュリティ緊急対策本部設置', effect: { approvalRating: 10, technology: 15, nationalDebt: 70, stockPrice: -600 } },
      { text: '国際協力でサイバー防衛を強化', effect: { approvalRating: 8, diplomacy: 12, technology: 8, nationalDebt: 50 } },
      { text: '民間企業との連携で復旧を急ぐ', effect: { approvalRating: 5, technology: 10, gdp: -5, stockPrice: -200 } },
    ],
  },
  {
    id: 'pandemic_emergency',
    category: 'emergency',
    title: '🚨 緊急事態：新型感染症流行',
    description: '新型感染症の感染が急拡大し、医療体制が逼迫しています。経済活動への影響も深刻化しています。',
    options: [
      { text: '緊急事態宣言と大規模医療支援', effect: { approvalRating: 12, gdp: -25, nationalDebt: 120, environment: 5 } },
      { text: 'ワクチン開発に集中投資', effect: { approvalRating: 8, technology: 12, gdp: -10, nationalDebt: 80 } },
      { text: '経済支援と感染対策のバランス重視', effect: { approvalRating: 5, gdp: -8, nationalDebt: 60, stockPrice: -300 } },
    ],
  },
  {
    id: 'territorial_emergency',
    category: 'emergency',
    title: '🚨 緊急事態：領土問題激化',
    description: '近隣国との領土問題が急激に悪化し、軍事的緊張が高まっています。国際社会の注目が集まる中、慎重な対応が求められます。',
    options: [
      { text: '外交チャンネルを通じた平和的解決', effect: { approvalRating: 8, diplomacy: 15, gdp: -5, stockPrice: 300 } },
      { text: '防衛力強化と同盟国との連携', effect: { approvalRating: 12, diplomacy: 8, nationalDebt: 90, stockPrice: -400 } },
      { text: '国際機関への提訴と多国間協議', effect: { approvalRating: 6, diplomacy: 10, gdp: -3, nationalDebt: 30 } },
    ],
  },
  {
    id: 'economic_emergency',
    category: 'emergency',
    title: '🚨 緊急事態：金融市場大暴落',
    description: '世界的な金融不安により日本の株式市場が大暴落。円安も急激に進行し、経済パニックが発生しています。',
    options: [
      { text: '緊急経済対策と市場介入を実施', effect: { approvalRating: 10, gdp: 5, nationalDebt: 150, stockPrice: 800, usdJpyRate: -10 } },
      { text: '日銀と協調し金融緩和を拡大', effect: { approvalRating: 6, gdp: 8, nationalDebt: 100, stockPrice: 500, usdJpyRate: -5 } },
      { text: '構造改革で長期的安定を目指す', effect: { approvalRating: 3, gdp: -5, technology: 8, stockPrice: -200 } },
    ],
  },
];

function App() {
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
    eventPool: eventTemplates.map(t => t.id),
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
  const [currentProvider, setCurrentProvider] = useState<AIProvider>('gemini');

  // ゲーム終了時の総括評価生成
  React.useEffect(() => {
    if (gameState.isGameOver && !secretaryComment && !isGeneratingComment) {
      setIsGeneratingComment(true);
      const rankData = calculateFinalRank();
      generateFinalSecretaryComment(rankData).then(comment => {
        setSecretaryComment(comment);
        setIsGeneratingComment(false);
        // メッセージを即座に表示
        setTimeout(() => {
          displayMessage(comment);
        }, 500);
      });
    }
  }, [gameState.isGameOver]);

  // 配列をシャッフルする関数
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // 即座にメッセージを表示（タイプライター効果廃止）
  const displayMessage = (message: string) => {
    setGameState(prev => {
      // 既存のタイマーがあればクリア
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

  // 緊急イベントの判定
  const shouldTriggerEmergencyEvent = (): boolean => {
    // 5回に1回の確率で緊急イベント発生
    return Math.random() < 0.2;
  };

  // AI駆動イベント生成
  const generateAIEvent = async (): Promise<GameEvent> => {
    console.log('🎲 AI駆動イベント生成開始');
    setIsGeneratingEvent(true);
    
    try {
      // 現在の季節を取得
      const currentDate = new Date();
      const month = currentDate.getMonth();
      const currentSeason = month < 3 ? 'winter' : month < 6 ? 'spring' : month < 9 ? 'summer' : 'autumn';
      
      // ゲームフェーズを判定
      const gamePhase = gameState.turn <= 2 ? 'early' : gameState.turn <= 4 ? 'middle' : 'late';
      
      // グローバルコンテキストを生成
      const globalContext = {
        economicClimate: (gameState.politicalTrends.economicTrend === 'recession' ? 'crisis' : 
                        gameState.politicalTrends.economicTrend === 'growth' ? 'stable' : 'volatile') as 'stable' | 'volatile' | 'crisis',
        internationalTensions: (gameState.diplomacy < 40 ? 'high' : gameState.diplomacy < 70 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
        domesticPressure: (gameState.approvalRating < 30 ? 'high' : gameState.approvalRating < 60 ? 'medium' : 'low') as 'low' | 'medium' | 'high'
      };

      const eventContext: EventGenerationContext = {
        currentState: {
          turn: gameState.turn,
          maxTurns: gameState.maxTurns,
          approvalRating: gameState.approvalRating,
          gdp: gameState.gdp,
          nationalDebt: gameState.nationalDebt,
          technology: gameState.technology,
          environment: gameState.environment,
          stockPrice: gameState.stockPrice,
          usdJpyRate: gameState.usdJpyRate,
          diplomacy: gameState.diplomacy,
        },
        politicalTrends: gameState.politicalTrends,
        previousEvents: gameState.gameLog.map(log => log.event),
        previousChoices: gameState.gameLog.map(log => log.choice),
        usedEventIds: gameState.usedEventIds,
        gamePhase: gamePhase as 'early' | 'middle' | 'late',
        currentSeason: currentSeason as 'spring' | 'summer' | 'autumn' | 'winter',
        globalContext
      };

      const generatedEvent = await eventGenerator.generateEvent(eventContext);
      console.log('✅ AI駆動イベント生成完了:', generatedEvent.title);
      
      setIsGeneratingEvent(false);

      // 緊急イベントの場合はKASUMIに通知
      if (generatedEvent.urgency === 'critical') {
        setTimeout(() => {
          displayMessage('きゃー！緊急事態よ！総理、しっかりして！私が付いてるから大丈夫...大丈夫よね？');
        }, 500);
      }

      // GeneratedEventをGameEventに変換
      return {
        id: generatedEvent.id,
        title: generatedEvent.title,
        description: generatedEvent.description,
        options: generatedEvent.options.map(option => ({
          text: option.text,
          effect: option.expectedEffects
        }))
      };

    } catch (error) {
      console.error('❌ AI駆動イベント生成エラー:', error);
      setIsGeneratingEvent(false);
      
      // エラー時は従来のフォールバックイベントを使用
      return generateFallbackEvent();
    }
  };

  // 従来のランダムイベント取得（フォールバック用）
  const getRandomEvent = (): GameEvent => {
    console.log('🔄 フォールバックイベント生成');
    
    // 通常イベント
    const availableEvents = eventTemplates.filter(template => 
      !gameState.usedEventIds.includes(template.id)
    );
    
    if (availableEvents.length === 0) {
      return generateFallbackEvent();
    }
    
    const shuffled = shuffleArray(availableEvents);
    const selected = shuffled[0];
    
    return {
      id: selected.id,
      title: selected.title,
      description: selected.description,
      options: selected.options
    };
  };

  // フォールバックイベント生成
  const generateFallbackEvent = (): GameEvent => {
    const fallbackEvents = [
      {
        id: 'fallback_1',
        title: '新たな政治課題の浮上',
        description: '予期せぬ政治課題が浮上しました。迅速な対応が求められています。',
        options: [
          { text: '専門委員会を設置して検討', effect: { approvalRating: 3, nationalDebt: 20 } },
          { text: '既存政策の枠組みで対応', effect: { approvalRating: 1, gdp: 2 } },
          { text: '国際的な事例を参考に対策', effect: { approvalRating: 2, diplomacy: 3 } },
        ]
      },
      {
        id: 'fallback_2',
        title: '地方自治体からの要望',
        description: '複数の地方自治体から政府への要望が寄せられています。地方の声にどう応えるかが問われています。',
        options: [
          { text: '地方交付税を増額', effect: { approvalRating: 8, nationalDebt: 60 } },
          { text: '地方分権を推進', effect: { approvalRating: 5, gdp: 3 } },
          { text: '個別協議で対応', effect: { approvalRating: 3, diplomacy: 2 } },
        ]
      }
    ];
    
    const selected = fallbackEvents[Math.floor(Math.random() * fallbackEvents.length)];
    return {
      id: selected.id,
      title: selected.title,
      description: selected.description,
      options: selected.options
    };
  };

  // AI Provider Managerインスタンス
  const [aiProvider] = useState(() => new AIProviderManager());
  const [policyAnalyzer] = useState(() => new PolicyAnalyzer(aiProvider));
  const [eventGenerator] = useState(() => new EventGenerator(aiProvider));
  const [showProviderSettings, setShowProviderSettings] = useState(false);
  const [isAnalyzingPolicy, setIsAnalyzingPolicy] = useState(false);
  const [isGeneratingEvent, setIsGeneratingEvent] = useState(false);

  // ツンデレAI政治秘書KASUMIの分析コメント（Claude API使用）
  const getAISecretaryAnalysis = async (effect: PolicyEffect, policyChoice: string): Promise<string> => {
    try {
      // AIプロバイダーマネージャー経由でツンデレコメントを生成
      return await aiProvider.generateTsundereComment(gameState, policyChoice, effect);
    } catch (error) {
      return getAISecretaryAnalysisFallback(effect, policyChoice);
    }
  };

  // フォールバック版のツンデレ分析
  const getAISecretaryAnalysisFallback = (effect: PolicyEffect, _policyChoice: string): string => {
    const approvalChange = effect.approvalRating || 0;
    const gdpChange = effect.gdp || 0;
    const stockChange = effect.stockPrice || 0;
    const diplomacyChange = effect.diplomacy || 0;
    
    // 緊急イベント時の特別コメント
    if (gameState.currentEvent?.title.includes('🚨 緊急事態')) {
      if (approvalChange > 10) {
        return 'すごい！緊急事態なのに支持率がこんなに上がるなんて...！総理、やっぱりすごいのね！私、ちょっと感動しちゃった...べ、別に泣いてないんだからね！';
      } else if (approvalChange > 5) {
        return '緊急事態への対応、お疲れ様でした...。国民も総理の判断を評価してるみたい。私も...ちょっとだけ安心したわ。';
      } else if (approvalChange < -5) {
        return '緊急事態で大変だったのに...もう、国民ったら総理の苦労をわかってないのよ！でも大丈夫、私は総理の味方だから！';
      } else {
        return '緊急事態、本当にお疲れ様でした...。総理が頑張ってるの、私はちゃんと見てるから。次も一緒に頑張りましょ？';
      }
    }
    
    // 支持率に基づくツンデレコメント
    if (approvalChange > 12) {
      return 'え、えぇ！？支持率がこんなに上がるなんて...！まあ、総理だから当然よね。別に驚いてないんだから！でも...ちょっとだけ嬉しいかも。';
    } else if (approvalChange > 8) {
      return 'ふーん、支持率が上がったのね。まあ、私の分析通りよ。総理がちゃんと私の助言を聞いてるからでしょ？...べ、別に褒めてるわけじゃないんだからね！';
    } else if (approvalChange > 3) {
      return 'まあまあの結果ね。でも、もう少し大胆な政策でもよかったんじゃない？...あ、でも慎重なのも総理らしいかも。';
    } else if (approvalChange < -12) {
      return 'ちょっと！支持率が大幅に下がってるじゃない！もう、なんでこんな政策選んだのよ...でも、でも！まだ挽回できるから！私が付いてるんだから大丈夫よ！';
    } else if (approvalChange < -8) {
      return 'あーあ、支持率下がっちゃった...。私の分析をもっとちゃんと聞いてよね！でも...総理が困ってるなら、仕方ないから助けてあげる。';
    } else if (approvalChange < -3) {
      return 'ちょっと支持率が下がったけど...まあ、政治なんてそんなものよね。でも次はもっと慎重にしなさいよ？';
    }
    
    // 経済指標に基づくツンデレコメント
    if (gdpChange > 12) {
      return 'わあ！GDP成長率がすごいことになってる！...べ、別に総理を褒めてるわけじゃないのよ？ただ、市場が反応してるだけ。でも...ちょっとだけ誇らしいかも。';
    } else if (gdpChange < -12) {
      return '経済指標が悪化してるじゃない...もう、心配になっちゃうでしょ！でも大丈夫、私がいるから何とかなるわよ。総理のことは...私が守るんだから。';
    }
    
    // 株価に基づくツンデレコメント
    if (stockChange > 500) {
      return '株価が急上昇してるわね！市場が総理の政策を評価してるのよ。ふん、当たり前じゃない。私が分析してるんだから！...でも総理もよくやったわ。';
    } else if (stockChange < -500) {
      return '株価が下がっちゃった...投資家たちったら、総理の真意を理解してないのよ！でも大丈夫、長期的には良い政策だと思うから...私は総理を信じてる。';
    }
    
    // 外交に基づくツンデレコメント
    if (diplomacyChange > 8) {
      return '外交関係が改善したのね。まあ、総理の人柄が良いからでしょ？...べ、別に総理を褒めてるわけじゃないのよ！ただ事実を言ってるだけ。';
    } else if (diplomacyChange < -8) {
      return '外交関係が悪化してるじゃない...もう、心配で夜も眠れないわよ！でも総理なら何とかしてくれるって信じてるから...頑張って。';
    }
    
    // 総合的な政治情勢分析（ツンデレ版）
    const politicalAnalysis = [
      {
        condition: gameState.approvalRating < 30,
        comment: "総理...支持率がこんなに低いなんて...。でも、でも！私は総理の味方だから！一緒に立て直しましょ？...べ、別に心配してるわけじゃないんだからね！"
      },
      {
        condition: gameState.nationalDebt > 1300,
        comment: "財政状況がヤバいじゃない！もう、将来のことちゃんと考えてよね...。でも総理が困ってるなら、私が何とかしてあげる。任せなさい！"
      },
      {
        condition: gameState.turn >= 5,
        comment: "もう任期終盤なのね...。総理のレガシー、ちゃんと残せるかしら？...私、総理が歴史に名を残せるように頑張るから！べ、別に総理のためじゃないのよ？"
      },
      {
        condition: gameState.stockPrice < 25000,
        comment: "市場の信頼が...。もう、投資家たちったら総理の本当の価値をわかってないのよ！でも大丈夫、私が総理の政策の素晴らしさを証明してみせる！"
      },
      {
        condition: gameState.diplomacy < 35,
        comment: "外交関係が心配ね...。総理、一人で抱え込まないで？私がいるんだから...。べ、別に総理を心配してるわけじゃないのよ！国益のためよ！"
      }
    ];
    
    const applicableAnalysis = politicalAnalysis.find(analysis => analysis.condition);
    
    if (applicableAnalysis) {
      return applicableAnalysis.comment;
    }
    
    // デフォルトのツンデレコメント
    const defaultTsundereComments = [
      'まあ、普通の判断ね。総理らしいといえばらしいかも...。でも次はもっと大胆でもいいのよ？',
      'この政策の効果、どうなるかしら...。まあ、総理が決めたなら仕方ないわね。私は付いていくから。',
      '慎重な判断ね。でも、もう少し私の分析を信頼してもいいのよ？...べ、別に構ってほしいわけじゃないんだから！',
      '総理の考えはよくわからないけど...まあ、ついていくわ。私が総理を支えてあげるんだから！',
      'この選択、国民はどう思うかしら...。でも総理が決めたなら、私が全力でサポートするから安心して。',
      'ふーん、そういう政策ね。まあ悪くないんじゃない？...ちょっとだけ評価してあげる。',
      'もう、総理ったら心配させないでよ！でも...この判断、嫌いじゃないわ。'
    ];
    
    return defaultTsundereComments[Math.floor(Math.random() * defaultTsundereComments.length)];
  };

  // 政治トレンド分析
  const analyzePoliticalTrends = (state: GameState) => {
    const recentHistory = state.historyData.slice(-2);
    
    let approvalTrend: 'rising' | 'falling' | 'stable' = 'stable';
    if (recentHistory.length >= 2) {
      const approvalChange = state.approvalRating - recentHistory[0].approvalRating;
      if (approvalChange > 5) approvalTrend = 'rising';
      else if (approvalChange < -5) approvalTrend = 'falling';
    }
    
    let economicTrend: 'growth' | 'recession' | 'stable' = 'stable';
    if (recentHistory.length >= 2) {
      const gdpChange = state.gdp - recentHistory[0].gdp;
      const stockChange = state.stockPrice - recentHistory[0].stockPrice;
      if (gdpChange > 10 && stockChange > 500) economicTrend = 'growth';
      else if (gdpChange < -10 || stockChange < -1000) economicTrend = 'recession';
    }
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (state.approvalRating < 25 || state.nationalDebt > 1500) {
      riskLevel = 'critical';
    } else if (state.approvalRating < 35 || state.nationalDebt > 1300 || state.diplomacy < 30) {
      riskLevel = 'high';
    } else if (state.approvalRating < 45 || state.nationalDebt > 1100 || state.stockPrice < 26000) {
      riskLevel = 'medium';
    }
    
    return { approvalTrend, economicTrend, riskLevel };
  };

  // ゲーム開始
  // AI駆動ゲーム開始
  const startGame = async () => {
    console.log('🎮 AI駆動ゲーム開始');
    setIsGeneratingEvent(true);
    
    try {
      const firstEvent = await generateAIEvent();
      setGameState(prev => ({ ...prev, isGameStarted: true, turn: 1, currentEvent: firstEvent }));
      
      // 開始時のKASUMIメッセージを表示
      setTimeout(() => {
        displayMessage('総理、いよいよ政権運営の始まりね！私がしっかりサポートするから...べ、別に心配してるわけじゃないのよ？頑張りましょ！');
      }, 1000);
    } catch (error) {
      console.error('❌ ゲーム開始エラー:', error);
      // エラー時は従来の方法でゲーム開始
      const firstEvent = getRandomEvent();
      setGameState(prev => ({ ...prev, isGameStarted: true, turn: 1, currentEvent: firstEvent }));
      
      setTimeout(() => {
        displayMessage('総理、ゲームを開始します！何か問題が発生しましたが、私が付いてるから大丈夫よ！');
      }, 1000);
    }
    
    setIsGeneratingEvent(false);
  };

  // 政策選択ハンドラ
  // AI駆動政策選択ハンドラ
  const handlePolicyChoice = async (option: PolicyOption) => {
    if (isProcessing || !gameState.currentEvent) return;
    setIsProcessing(true);
    setIsAnalyzingPolicy(true);
    
    try {
      // AI政策効果分析を実行
      const policyContext: PolicyContext = {
        eventTitle: gameState.currentEvent.title,
        eventDescription: gameState.currentEvent.description,
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
          diplomacy: gameState.diplomacy,
        },
        politicalTrends: gameState.politicalTrends,
        previousPolicies: gameState.gameLog.map(log => log.choice)
      };

      console.log('🔍 AI政策効果分析開始...');
      const analysisResult = await policyAnalyzer.analyzePolicyEffects(policyContext);
      console.log('✅ AI政策効果分析完了:', analysisResult);
      
      setIsAnalyzingPolicy(false);

      // 分析結果を適用
      setTimeout(() => {
        setGameState(prev => {
          const next = { ...prev };
          const eff = analysisResult.effects;
        
        // 履歴データに現在の状態を保存
        next.historyData = [
          ...next.historyData,
          {
            turn: next.turn,
            approvalRating: next.approvalRating,
            gdp: next.gdp,
            stockPrice: next.stockPrice,
            diplomacy: next.diplomacy,
          }
        ];
        
        // AI分析による効果適用
        next.approvalRating = Math.max(0, Math.min(100, next.approvalRating + eff.approvalRating));
        next.gdp = Math.max(0, next.gdp + eff.gdp);
        next.nationalDebt = Math.max(0, next.nationalDebt + eff.nationalDebt);
        next.technology = Math.max(0, Math.min(100, next.technology + eff.technology));
        next.environment = Math.max(0, Math.min(100, next.environment + eff.environment));
        next.stockPrice = Math.max(10000, next.stockPrice + eff.stockPrice);
        next.usdJpyRate = Math.max(100, Math.min(200, next.usdJpyRate + eff.usdJpyRate));
        next.diplomacy = Math.max(0, Math.min(100, next.diplomacy + eff.diplomacy));
        
        // 効果の詳細を保存（AI分析結果を含む）
        next.lastEffect = {
          ...eff,
          aiAnalysis: analysisResult
        };
        next.showEffectDetails = true;
        
        // ログ追加
        const currentEventId = next.currentEvent!.id || next.currentEvent!.title;
        next.gameLog = [
          ...next.gameLog,
          { 
            turn: next.turn, 
            event: currentEventId, 
            choice: option.text, 
            effect: eff,
            aiAnalysis: analysisResult
          },
        ];
        
        // 使用済みイベントIDを更新
        if (!next.usedEventIds.includes(currentEventId)) {
          next.usedEventIds = [...next.usedEventIds, currentEventId];
          console.log('イベントID追加:', currentEventId, '使用済み:', next.usedEventIds);
        } else {
          console.warn('重複イベント検出:', currentEventId);
        }
        
        // 政治トレンド分析を更新
        next.politicalTrends = analyzePoliticalTrends(next);
        
        // AI駆動の専門的政治分析コメント
        setGameState(prevState => ({ ...prevState, isAIThinking: true, kasumiDisplayMessage: 'AI秘書KASUMIが政治情勢を分析中...' }));
        
        getAISecretaryAnalysis(eff, option.text).then(analysisMessage => {
          setGameState(prevState => {
            const newState = { ...prevState };
            newState.kasumiMessage = analysisMessage;
            newState.isAIThinking = false;
            
            // メッセージを即座に表示
            setTimeout(() => {
              displayMessage(analysisMessage);
            }, 500);
            
            return newState;
          });
        }).catch(() => {
          setGameState(prevState => ({ ...prevState, isAIThinking: false }));
        });
        
        // 次ターンor終了判定
        if (next.turn >= next.maxTurns) {
          next.isGameOver = true;
          const score = Math.round((next.approvalRating + next.technology + next.environment + next.diplomacy) / 4);
          setFinalScore(score);
        } else {
          next.turn += 1;
          // 次のイベントは非同期で生成するため、一時的にnullに設定
          next.currentEvent = null;
        }
        return next;
      });
      
      // 次ターンがある場合は新しいイベントを生成
      if (gameState.turn + 1 <= gameState.maxTurns) {
        generateAIEvent().then(nextEvent => {
          setGameState(prev => ({ ...prev, currentEvent: nextEvent }));
          setIsProcessing(false);
        }).catch(error => {
          console.error('❌ 次イベント生成エラー:', error);
          const fallbackEvent = getRandomEvent();
          setGameState(prev => ({ ...prev, currentEvent: fallbackEvent }));
          setIsProcessing(false);
        });
      } else {
        setIsProcessing(false);
      }
    }, 500);

    } catch (error) {
      console.error('❌ AI政策効果分析エラー:', error);
      setIsAnalyzingPolicy(false);
      
      // エラー時は従来の固定効果を使用
      setTimeout(() => {
        setGameState(prev => {
          const next = { ...prev };
          const eff = option.effect;
          
          // 履歴データに現在の状態を保存
          next.historyData = [
            ...next.historyData,
            {
              turn: next.turn,
              approvalRating: next.approvalRating,
              gdp: next.gdp,
              stockPrice: next.stockPrice,
              diplomacy: next.diplomacy,
            }
          ];
          
          // 従来の効果適用
          if (eff.approvalRating) next.approvalRating = Math.max(0, Math.min(100, next.approvalRating + eff.approvalRating));
          if (eff.gdp) next.gdp = Math.max(0, next.gdp + eff.gdp);
          if (eff.nationalDebt) next.nationalDebt = Math.max(0, next.nationalDebt + eff.nationalDebt);
          if (eff.technology) next.technology = Math.max(0, Math.min(100, next.technology + eff.technology));
          if (eff.environment) next.environment = Math.max(0, Math.min(100, next.environment + eff.environment));
          if (eff.stockPrice) next.stockPrice = Math.max(10000, next.stockPrice + eff.stockPrice);
          if (eff.usdJpyRate) next.usdJpyRate = Math.max(100, Math.min(200, next.usdJpyRate + eff.usdJpyRate));
          if (eff.diplomacy) next.diplomacy = Math.max(0, Math.min(100, next.diplomacy + eff.diplomacy));
          
          // 効果の詳細を保存
          next.lastEffect = eff;
          next.showEffectDetails = true;
          
          // ログ追加
          const currentEventId = next.currentEvent!.id || next.currentEvent!.title;
          next.gameLog = [
            ...next.gameLog,
            { turn: next.turn, event: currentEventId, choice: option.text, effect: eff },
          ];
          
          // 使用済みイベントIDを更新
          if (!next.usedEventIds.includes(currentEventId)) {
            next.usedEventIds = [...next.usedEventIds, currentEventId];
            console.log('イベントID追加:', currentEventId, '使用済み:', next.usedEventIds);
          } else {
            console.warn('重複イベント検出:', currentEventId);
          }
          
          // 政治トレンド分析を更新
          next.politicalTrends = analyzePoliticalTrends(next);
          
          // AI駆動の専門的政治分析コメント
          getAISecretaryAnalysis(eff, option.text).then(analysisMessage => {
            next.kasumiMessage = analysisMessage;
            
            // メッセージを即座に表示
            setTimeout(() => {
              displayMessage(analysisMessage);
            }, 1000);
          });
          
          // 次ターンor終了判定
          if (next.turn >= next.maxTurns) {
            next.isGameOver = true;
            const score = Math.round((next.approvalRating + next.technology + next.environment + next.diplomacy) / 4);
            setFinalScore(score);
          } else {
            next.turn += 1;
            // 次のイベントは非同期で生成するため、一時的にnullに設定
            next.currentEvent = null;
          }
          return next;
        });
        
        // 次ターンがある場合は新しいイベントを生成（エラー時はフォールバック）
        if (gameState.turn + 1 <= gameState.maxTurns) {
          const nextEvent = getRandomEvent();
          setGameState(prev => ({ ...prev, currentEvent: nextEvent }));
        }
        
        setIsProcessing(false);
      }, 800);
    }
  };

  // カスタム政策（セキュリティ強化版）
  const handleCustomPolicy = () => {
    if (!customPolicy.trim()) return;
    
    // 入力検証
    if (!SecurityValidator.validateInput(customPolicy)) {
      alert('不正な文字が含まれているか、文字数が多すぎます。日本語、英数字、基本的な記号のみ200文字以内で入力してください。');
      return;
    }
    
    // レート制限チェック
    if (!SecurityValidator.checkRateLimit()) {
      alert('リクエストが多すぎます。しばらく待ってから再試行してください。');
      return;
    }
    
    // 入力をサニタイズ
    const sanitizedPolicy = SecurityValidator.sanitizeInput(customPolicy);
    
    const customOption: PolicyOption = {
      text: sanitizedPolicy,
      effect: {
        approvalRating: Math.floor(Math.random() * 21) - 10,
        gdp: Math.floor(Math.random() * 21) - 10,
        nationalDebt: Math.floor(Math.random() * 51) - 25,
        technology: Math.floor(Math.random() * 11) - 5,
        environment: Math.floor(Math.random() * 11) - 5,
        stockPrice: Math.floor(Math.random() * 1001) - 500,
        usdJpyRate: Math.floor(Math.random() * 11) - 5,
        diplomacy: Math.floor(Math.random() * 11) - 5,
      }
    };
    
    handlePolicyChoice(customOption);
    setCustomPolicy('');
  };

  // 効果詳細を閉じる
  const closeEffectDetails = () => {
    setGameState(prev => ({ ...prev, showEffectDetails: false, lastEffect: null }));
  };

  // 総合ランク評価システム
  const calculateFinalRank = (state = gameState) => {
    const scores = {
      approval: Math.max(0, Math.min(100, state.approvalRating)),
      economy: Math.max(0, Math.min(100, ((state.gdp - 400) / 200) * 100 + 50)),
      fiscal: Math.max(0, Math.min(100, 100 - ((state.nationalDebt - 800) / 800) * 100)),
      technology: Math.max(0, Math.min(100, state.technology)),
      environment: Math.max(0, Math.min(100, state.environment)),
      diplomacy: Math.max(0, Math.min(100, state.diplomacy)),
      market: Math.max(0, Math.min(100, ((state.stockPrice - 25000) / 5000) * 100 + 50)),
      currency: Math.max(0, Math.min(100, 100 - ((state.usdJpyRate - 140) / 20) * 100))
    };

    const totalScore = (
      scores.approval * 0.25 +
      scores.economy * 0.20 +
      scores.fiscal * 0.15 +
      scores.diplomacy * 0.15 +
      scores.technology * 0.10 +
      scores.environment * 0.10 +
      scores.market * 0.03 +
      scores.currency * 0.02
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
      rankColor = 'text-orange-300';
    } else if (totalScore >= 55) {
      rank = 'C';
      rankTitle = '困難な政権運営';
      rankColor = 'text-orange-400';
    } else if (totalScore >= 50) {
      rank = 'D';
      rankTitle = '政治的混乱';
      rankColor = 'text-red-400';
    }

    return { rank, rankTitle, rankColor, totalScore: Math.round(totalScore), scores };
  };

  // ツンデレAI秘書による総括評価コメント
  const generateFinalSecretaryComment = async (rankData: any): Promise<string> => {
    const { rank, totalScore, scores } = rankData;
    
    // AI APIを使用した総括評価生成を試行
    try {
      // 実際のAPI呼び出しはここでは省略し、フォールバック版を使用
      return generateTsundereFinalComment(rankData);
      
    } catch (error) {
      return generateTsundereFinalComment(rankData);
    }
  };

  // ツンデレ総括評価のフォールバック版
  const generateTsundereFinalComment = (rankData: any): string => {
    const { rank, scores } = rankData;
    
    const strengths = [];
    const weaknesses = [];
    
    if (scores.approval >= 70) strengths.push('国民の支持');
    else if (scores.approval < 40) weaknesses.push('支持率の低迷');
    
    if (scores.economy >= 70) strengths.push('経済成長');
    else if (scores.economy < 40) weaknesses.push('経済の課題');
    
    if (scores.fiscal >= 70) strengths.push('財政健全化');
    else if (scores.fiscal < 40) weaknesses.push('財政悪化');
    
    if (scores.diplomacy >= 70) strengths.push('外交成果');
    else if (scores.diplomacy < 40) weaknesses.push('外交の問題');

    const tsundereRankComments = {
      'S+': `総理...！こ、こんなに素晴らしい結果になるなんて...！${strengths.join('、')}で歴史に名を残すのね。私、ちょっと感動しちゃった...べ、別に泣いてないんだからね！でも...本当にお疲れ様でした。`,
      'S': `すごいじゃない、総理！${strengths.join('、')}なんて、私の分析通りよ！...ま、まあ私がサポートしたからでもあるけど。でも総理も頑張ったわね...認めてあげる。`,
      'A+': `総理、お疲れ様でした！${strengths.length > 0 ? strengths.join('、') + 'は素晴らしかったわ。' : ''}${weaknesses.length > 0 ? 'でも' + weaknesses.join('、') + 'はちょっと心配だったの...' : ''}でも全体的には合格点よ！`,
      'A': `まあまあの結果ね、総理。${weaknesses.length > 0 ? weaknesses.join('、') + 'が気になったけど、' : ''}大きな失敗はなかったし...私がついてたからでしょ？次はもっと頑張りなさいよ？`,
      'B+': `総理...${strengths.length > 0 ? strengths.join('、') + 'は良かったけど、' : ''}${weaknesses.join('、')}が心配だったの。でも私、総理のこと見捨てたりしないから！一緒に頑張りましょ？`,
      'B': `総理、お疲れ様...。${weaknesses.length > 0 ? weaknesses.join('、') + 'で' : ''}ちょっと大変だったわね。でも大丈夫！私がいるんだから、次はきっと良くなるわよ！`,
      'C+': `総理...${weaknesses.join('、')}で苦労したのね。見てて心配だったわ...。でも！私は総理の味方だから！一緒に立て直しましょ？諦めちゃダメよ！`,
      'C': `総理...${weaknesses.join('、')}で大変だったでしょ？私、すごく心配してたのよ...。でも総理が頑張ってるの、ちゃんと見てたから。次は絶対に良くしてみせるわ！`,
      'D': `総理...！こんな結果になっちゃって...私、悔しいわ！${weaknesses.join('、')}で苦しんでる総理を見てるのが辛かった...。でも諦めないで！私が絶対に支えるから！`,
      'F': `総理...！どうしてこんなことに...！${weaknesses.join('、')}で...私、総理を守れなかった...。ごめんなさい...。でも、でも！まだ終わりじゃないわ！私と一緒にやり直しましょ？`
    };

    let recommendations = '';
    if (scores.approval < 50) {
      recommendations += 'もっと国民の声を聞いて？私も一緒に考えるから...';
    }
    if (scores.economy < 50) {
      recommendations += '経済政策、私がもっと勉強して助けるわ！';
    }
    if (scores.fiscal < 50) {
      recommendations += '財政のこと、一緒に何とかしましょ？';
    }

    const baseComment = tsundereRankComments[rank as keyof typeof tsundereRankComments] || tsundereRankComments['F'];
    return recommendations ? `${baseComment} ${recommendations}` : baseComment;
  };

  // グラフ用のデータ生成
  const generateChartData = () => {
    const data = [
      { turn: 0, approvalRating: 50, gdp: 500, stockPrice: 28000, diplomacy: 50 },
      ...gameState.historyData,
      {
        turn: gameState.turn,
        approvalRating: gameState.approvalRating,
        gdp: gameState.gdp,
        stockPrice: gameState.stockPrice,
        diplomacy: gameState.diplomacy,
      }
    ];
    return data;
  };

  // AIプロバイダー変更
  const handleProviderChange = (provider: AIProvider) => {
    const success = aiProvider.setProvider(provider);
    if (success) {
      setCurrentProvider(provider);
      console.log(`🔄 AIプロバイダー変更: ${provider}`);
    }
  };

  // プロバイダー設定の初期化
  React.useEffect(() => {
    const initProvider = async () => {
      await aiProvider.recheckProviders();
      setCurrentProvider(aiProvider.getCurrentProvider());
    };
    initProvider();
  }, []);

  // リセット
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
      emergencyEventCount: 0,
      lastEffect: null,
      showEffectDetails: false,
      historyData: [],
      usedEventIds: [],
      eventPool: shuffleArray(eventTemplates.map(t => t.id)),
      politicalTrends: {
        approvalTrend: 'stable',
        economicTrend: 'stable',
        riskLevel: 'low'
      },
    });
    setFinalScore(0);
    setCustomPolicy('');
    setIsProcessing(false);
    setSecretaryComment('');
    setIsGeneratingComment(false);
    setShowRankingModal(false);
    setShowScoreSubmissionModal(false);
  };

  // 開始前
  if (!gameState.isGameStarted) {
    const providerConfigs = aiProvider.getProviderConfigs();
    const providerStatus = aiProvider.getProviderStatus();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <div className="flex items-center justify-center gap-4 mb-6">
            <h1 className="text-4xl font-bold">🏛️ AI総理大臣シミュレーター</h1>
            <button
              onClick={() => setShowRankingModal(true)}
              className="px-3 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-lg text-sm font-bold text-white shadow-lg transition-all duration-200 hover:scale-105"
            >
              🏆 ランキング
            </button>
          </div>
          <p className="mb-4 text-gray-300">現代日本の政治課題に挑戦しよう</p>
          <p className="mb-6 text-sm text-cyan-300">📊 現実的な政策シミュレーション</p>
          
          {/* AIプロバイダー選択 */}
          <div className="mb-8 p-4 bg-slate-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-center">
              🤖 AI秘書KASUMIの頭脳を選択
              <button
                onClick={() => setShowProviderSettings(!showProviderSettings)}
                className="ml-2 text-sm text-cyan-400 hover:text-cyan-300"
              >
                ⚙️
              </button>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {Object.entries(providerConfigs).map(([key, config]) => {
                const status = providerStatus.get(key as AIProvider);
                const isSelected = currentProvider === key;
                const isAvailable = status?.available || false;
                
                return (
                  <button
                    key={key}
                    onClick={() => handleProviderChange(key as AIProvider)}
                    disabled={!isAvailable}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-900/30 text-cyan-300'
                        : isAvailable
                        ? 'border-slate-600 bg-slate-700 hover:border-slate-500 text-white'
                        : 'border-slate-700 bg-slate-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-2xl mb-1">{config.icon}</div>
                    <div className="font-semibold text-sm">{config.displayName}</div>
                    <div className="text-xs text-gray-400 mt-1">{config.description}</div>
                    {status?.latency && (
                      <div className="text-xs text-green-400 mt-1">
                        ⚡ {status.latency}ms
                      </div>
                    )}
                    {!isAvailable && (
                      <div className="text-xs text-red-400 mt-1">
                        ❌ 利用不可
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {showProviderSettings && (
              <div className="text-left bg-slate-900 p-4 rounded-lg text-sm">
                <h4 className="font-semibold mb-2">🔧 設定情報</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-cyan-400">🧠 Gemini:</span> サーバーサイドプロキシ経由で高品質なAI分析
                  </div>
                  <div>
                    <span className="text-cyan-400">🦙 Ollama:</span> ローカルで動作するプライベートAI
                    <div className="text-xs text-gray-400 ml-4">
                      • Ollamaをインストール: <code>curl -fsSL https://ollama.ai/install.sh | sh</code>
                      <br />
                      • モデルダウンロード: <code>ollama pull llama3.1:8b</code>
                    </div>
                  </div>
                  <div>
                    <span className="text-cyan-400">🔄 オフライン:</span> インターネット不要のフォールバックモード
                  </div>
                </div>
                <button
                  onClick={() => aiProvider.recheckProviders().then(() => setCurrentProvider(aiProvider.getCurrentProvider()))}
                  className="mt-3 px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-xs"
                >
                  🔄 再チェック
                </button>
              </div>
            )}
            
            <div className="text-xs text-gray-400">
              現在選択: <span className="text-cyan-400">{providerConfigs[currentProvider].displayName}</span>
            </div>
          </div>
          
          <button
            onClick={startGame}
            disabled={isGeneratingEvent}
            className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingEvent ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">🎲</span>
                AIイベント生成中...
              </span>
            ) : (
              'ゲームスタート'
            )}
          </button>
        </div>
      </div>
    );
  }

  // 終了画面
  if (gameState.isGameOver) {
    const rankData = calculateFinalRank();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-2">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold mb-2">🏛️ 政権運営終了</h1>
            <div className="mb-4">
              <div className={`text-6xl font-bold ${rankData.rankColor} mb-2`}>
                {rankData.rank}
              </div>
              <div className="text-xl mb-1">{rankData.rankTitle}</div>
              <div className="text-lg text-gray-300">総合スコア: {rankData.totalScore}/100</div>
            </div>
          </div>
          
          {/* 詳細スコア分析 */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-3 text-center">📊 分野別評価</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>支持率 (25%)</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${rankData.scores.approval >= 70 ? 'bg-green-500' : rankData.scores.approval >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${rankData.scores.approval}%` }}
                    ></div>
                  </div>
                  <span className="font-bold w-8">{Math.round(rankData.scores.approval)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>経済 (20%)</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${rankData.scores.economy >= 70 ? 'bg-green-500' : rankData.scores.economy >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${rankData.scores.economy}%` }}
                    ></div>
                  </div>
                  <span className="font-bold w-8">{Math.round(rankData.scores.economy)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>財政 (15%)</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${rankData.scores.fiscal >= 70 ? 'bg-green-500' : rankData.scores.fiscal >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${rankData.scores.fiscal}%` }}
                    ></div>
                  </div>
                  <span className="font-bold w-8">{Math.round(rankData.scores.fiscal)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>外交 (15%)</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${rankData.scores.diplomacy >= 70 ? 'bg-green-500' : rankData.scores.diplomacy >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${rankData.scores.diplomacy}%` }}
                    ></div>
                  </div>
                  <span className="font-bold w-8">{Math.round(rankData.scores.diplomacy)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>技術 (10%)</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${rankData.scores.technology >= 70 ? 'bg-green-500' : rankData.scores.technology >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${rankData.scores.technology}%` }}
                    ></div>
                  </div>
                  <span className="font-bold w-8">{Math.round(rankData.scores.technology)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>環境 (10%)</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${rankData.scores.environment >= 70 ? 'bg-green-500' : rankData.scores.environment >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${rankData.scores.environment}%` }}
                    ></div>
                  </div>
                  <span className="font-bold w-8">{Math.round(rankData.scores.environment)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* AI秘書による総括評価 */}
          <div className="bg-indigo-900 rounded-lg p-4 mb-4 border-2 border-indigo-500">
            <div className="flex items-center mb-3">
              <h3 className="text-lg font-semibold text-indigo-300">🤖 AI政治秘書KASUMIによる総括評価</h3>
              {isGeneratingComment && (
                <div className="ml-2 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-300"></div>
                  <span className="ml-2 text-xs text-indigo-300">AI分析中...</span>
                </div>
              )}
            </div>
            <div className="text-sm text-indigo-100 leading-relaxed min-h-[4rem]">
              {isGeneratingComment ? (
                <div className="flex items-center justify-center h-16">
                  <div className="animate-pulse text-indigo-300">
                    KASUMIが総理の政権運営を分析しています...
                  </div>
                </div>
              ) : (
                <p>
                  {gameState.kasumiDisplayMessage || secretaryComment || '総括評価を準備中です...'}
                  {gameState.isTyping && <span className="animate-pulse">|</span>}
                </p>
              )}
            </div>
          </div>

          {/* 実績データ */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-3 text-center">📈 政権実績データ</h3>
            <div className="grid grid-cols-4 gap-4 text-xs text-center">
              <div>
                <div className="text-gray-400">最終支持率</div>
                <div className={`text-lg font-bold ${gameState.approvalRating >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                  {gameState.approvalRating}%
                </div>
              </div>
              <div>
                <div className="text-gray-400">GDP成長</div>
                <div className={`text-lg font-bold ${gameState.gdp >= 500 ? 'text-green-400' : 'text-red-400'}`}>
                  {gameState.gdp >= 500 ? '+' : ''}{gameState.gdp - 500}兆円
                </div>
              </div>
              <div>
                <div className="text-gray-400">財政収支</div>
                <div className={`text-lg font-bold ${gameState.nationalDebt <= 1000 ? 'text-green-400' : 'text-red-400'}`}>
                  {gameState.nationalDebt <= 1000 ? '-' : '+'}{Math.abs(gameState.nationalDebt - 1000)}兆円
                </div>
              </div>
              <div>
                <div className="text-gray-400">株価変動</div>
                <div className={`text-lg font-bold ${gameState.stockPrice >= 28000 ? 'text-green-400' : 'text-red-400'}`}>
                  {gameState.stockPrice >= 28000 ? '+' : ''}{gameState.stockPrice - 28000}円
                </div>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowScoreSubmissionModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-lg text-white font-bold shadow-lg transition-all duration-200 hover:scale-105"
              >
                🏆 ランキングに登録
              </button>
              <button
                onClick={() => setShowRankingModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded-lg text-white font-bold shadow-lg transition-all duration-200 hover:scale-105"
              >
                📊 ランキング表示
              </button>
            </div>
            <button
              onClick={resetGame}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white font-semibold"
            >
              新たな政権に挑戦
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ゲーム画面
  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-2">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-3 flex justify-between items-center">
          <h2 className="text-xl font-bold">🏛️ ターン {gameState.turn} / {gameState.maxTurns}</h2>
          <div className="text-sm text-cyan-300">📊 政策シミュレーション</div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 左側: 現在の状況 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold mb-3 text-center">📊 現在の状況</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-blue-700 rounded p-2 text-center">
                  <div className="text-xs text-gray-300">支持率</div>
                  <div className="text-lg font-bold">{gameState.approvalRating}%</div>
                </div>
                <div className="bg-green-700 rounded p-2 text-center">
                  <div className="text-xs text-gray-300">GDP</div>
                  <div className="text-lg font-bold">{gameState.gdp}兆</div>
                </div>
                <div className="bg-red-700 rounded p-2 text-center">
                  <div className="text-xs text-gray-300">国債</div>
                  <div className="text-lg font-bold">{gameState.nationalDebt}兆</div>
                </div>
                <div className="bg-purple-700 rounded p-2 text-center">
                  <div className="text-xs text-gray-300">外交</div>
                  <div className="text-lg font-bold">{gameState.diplomacy}%</div>
                </div>
                <div className="bg-yellow-700 rounded p-2 text-center">
                  <div className="text-xs text-gray-300">技術</div>
                  <div className="text-lg font-bold">{gameState.technology}%</div>
                </div>
                <div className="bg-emerald-700 rounded p-2 text-center">
                  <div className="text-xs text-gray-300">環境</div>
                  <div className="text-lg font-bold">{gameState.environment}%</div>
                </div>
                <div className="bg-indigo-700 rounded p-2 text-center">
                  <div className="text-xs text-gray-300">日経</div>
                  <div className="text-sm font-bold">{Math.round(gameState.stockPrice/1000)}k</div>
                </div>
                <div className="bg-orange-700 rounded p-2 text-center">
                  <div className="text-xs text-gray-300">ドル円</div>
                  <div className="text-lg font-bold">{gameState.usdJpyRate}</div>
                </div>
              </div>
            </div>

            {/* AI政治秘書の専門分析 */}
            <div className={`rounded-lg p-4 border-2 shadow-lg transition-all duration-500 ${
              gameState.isAIThinking 
                ? 'bg-gradient-to-br from-cyan-900 to-indigo-900 border-cyan-400 shadow-cyan-500/20' 
                : 'bg-gradient-to-br from-indigo-900 to-purple-900 border-indigo-500 shadow-indigo-500/20'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 flex items-center justify-center text-sm">
                    🤖
                  </div>
                  <div className="ml-2">
                    <h4 className="text-sm font-bold text-white">AI政治秘書 KASUMI</h4>
                    <div className="text-xs text-gray-300">専門政治分析AI</div>
                  </div>
                  {gameState.isAIThinking && (
                    <div className="ml-3 flex items-center bg-cyan-800/50 px-2 py-1 rounded-full">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-cyan-300"></div>
                      <span className="ml-2 text-xs text-cyan-200 font-medium">分析中</span>
                    </div>
                  )}
                </div>
                
                {/* ステータス表示 */}
                {!gameState.isAIThinking && (
                  <div className="flex flex-col items-end gap-1 text-xs">
                    <div className="flex gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        gameState.politicalTrends.riskLevel === 'critical' ? 'bg-red-600 text-white' :
                        gameState.politicalTrends.riskLevel === 'high' ? 'bg-orange-600 text-white' :
                        gameState.politicalTrends.riskLevel === 'medium' ? 'bg-yellow-600 text-black' : 'bg-green-600 text-white'
                      }`}>
                        {
                          gameState.politicalTrends.riskLevel === 'critical' ? '⚠️ 危機' :
                          gameState.politicalTrends.riskLevel === 'high' ? '🔶 高リスク' :
                          gameState.politicalTrends.riskLevel === 'medium' ? '🔸 中リスク' : '✅ 安定'
                        }
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      gameState.politicalTrends.approvalTrend === 'rising' ? 'bg-green-600 text-white' :
                      gameState.politicalTrends.approvalTrend === 'falling' ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
                    }`}>
                      支持率 {
                        gameState.politicalTrends.approvalTrend === 'rising' ? '📈' :
                        gameState.politicalTrends.approvalTrend === 'falling' ? '📉' : '➡️'
                      }
                    </div>
                  </div>
                )}
              </div>
              
              {/* メッセージエリア */}
              <div className={`min-h-[5rem] max-h-[15rem] overflow-y-auto rounded-lg p-3 transition-all duration-300 ${
                gameState.isAIThinking 
                  ? 'bg-cyan-950/50 border border-cyan-600/30' 
                  : 'bg-indigo-950/50 border border-indigo-600/30'
              }`}>
                {gameState.isAIThinking ? (
                  <div className="flex flex-col items-center justify-center h-16 space-y-3">
                    <div className="flex items-center space-x-2">
                      <div className="text-2xl">🧠</div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '200ms'}}></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '400ms'}}></div>
                      </div>
                    </div>
                    <div className="text-sm text-cyan-200 font-medium animate-pulse">
                      政治情勢を詳細分析しています...
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                    {gameState.kasumiDisplayMessage || gameState.kasumiMessage}
                  </div>
                )}
              </div>
              
              {/* AI情報 */}
              <div className="mt-3 pt-2 border-t border-gray-600/30">
                <div className="flex items-center justify-between text-xs text-gray-300">
                  <div className="flex items-center space-x-2">
                    <span>🤖 {aiProvider.getProviderConfigs()[currentProvider].displayName}</span>
                    {aiProvider.getProviderStatus().get(currentProvider)?.latency && (
                      <span className="px-1 py-0.5 bg-gray-700/50 rounded text-xs">
                        ⚡ {aiProvider.getProviderStatus().get(currentProvider)?.latency}ms
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Turn {gameState.turn}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 中央: イベントと選択肢 */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              {isGeneratingEvent ? (
                <div className="text-center py-8">
                  <div className="animate-spin text-4xl mb-4">🎲</div>
                  <h3 className="text-xl font-semibold mb-2">AIが新しい政治課題を生成中...</h3>
                  <p className="text-gray-400 text-sm">現在の政治情勢を分析して、リアルなイベントを作成しています</p>
                  <div className="mt-4 text-xs text-cyan-300">
                    🤖 AI: {aiProvider.getProviderConfigs()[currentProvider].displayName}
                  </div>
                </div>
              ) : gameState.currentEvent ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold">{gameState.currentEvent.title}</h3>
                    <span className="text-xs bg-purple-800 px-2 py-1 rounded">
                      🤖 AI生成
                    </span>
                  </div>
                  <p className="mb-4 text-gray-300 text-sm leading-relaxed">{gameState.currentEvent.description}</p>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">⏳</div>
                  <h3 className="text-xl font-semibold mb-2">次の政治課題を準備中...</h3>
                  <p className="text-gray-400 text-sm">しばらくお待ちください</p>
                </div>
              )}
              
              {!isGeneratingEvent && gameState.currentEvent && (
                <div className="space-y-2">
                  {gameState.currentEvent.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePolicyChoice(opt)}
                    disabled={isProcessing}
                    className="w-full text-left px-3 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm disabled:opacity-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt.text}</span>
                      {isProcessing && isAnalyzingPolicy && (
                        <span className="text-xs text-cyan-300 animate-pulse">
                          🤖 AI分析中...
                        </span>
                      )}
                    </div>
                  </button>
                  ))}
                </div>
              )}
              
              {/* カスタム政策入力 */}
              {!isGeneratingEvent && gameState.currentEvent && (
                <div className="mt-4 border-t border-gray-600 pt-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="独自政策を提案..."
                    value={customPolicy}
                    onChange={e => setCustomPolicy(e.target.value)}
                    className="flex-1 px-3 py-2 rounded text-black text-sm"
                  />
                  <button
                    onClick={handleCustomPolicy}
                    disabled={isProcessing || !customPolicy.trim()}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded text-sm disabled:opacity-50"
                  >
                    提出
                  </button>
                </div>
                </div>
              )}
            </div>

            {/* 政策効果の詳細表示 */}
            {gameState.showEffectDetails && gameState.lastEffect && (
              <div className="bg-cyan-900 rounded-lg p-4 border-2 border-cyan-500">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-semibold text-cyan-300">📊 政策効果</h4>
                  <button
                    onClick={closeEffectDetails}
                    className="text-cyan-300 hover:text-white text-lg"
                  >
                    ×
                  </button>
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {gameState.lastEffect.approvalRating && (
                    <div className={`p-2 rounded text-center ${gameState.lastEffect.approvalRating > 0 ? 'bg-green-800' : 'bg-red-800'}`}>
                      <div className="text-gray-300">支持率</div>
                      <div className="font-bold">
                        {gameState.lastEffect.approvalRating > 0 ? '+' : ''}{gameState.lastEffect.approvalRating}%
                      </div>
                    </div>
                  )}
                  
                  {gameState.lastEffect.gdp && (
                    <div className={`p-2 rounded text-center ${gameState.lastEffect.gdp > 0 ? 'bg-green-800' : 'bg-red-800'}`}>
                      <div className="text-gray-300">GDP</div>
                      <div className="font-bold">
                        {gameState.lastEffect.gdp > 0 ? '+' : ''}{gameState.lastEffect.gdp}兆
                      </div>
                    </div>
                  )}
                  
                  {gameState.lastEffect.stockPrice && (
                    <div className={`p-2 rounded text-center ${gameState.lastEffect.stockPrice > 0 ? 'bg-green-800' : 'bg-red-800'}`}>
                      <div className="text-gray-300">株価</div>
                      <div className="font-bold">
                        {gameState.lastEffect.stockPrice > 0 ? '+' : ''}{Math.round(gameState.lastEffect.stockPrice/100)/10}k
                      </div>
                    </div>
                  )}
                  
                  {gameState.lastEffect.diplomacy && (
                    <div className={`p-2 rounded text-center ${gameState.lastEffect.diplomacy > 0 ? 'bg-green-800' : 'bg-red-800'}`}>
                      <div className="text-gray-300">外交</div>
                      <div className="font-bold">
                        {gameState.lastEffect.diplomacy > 0 ? '+' : ''}{gameState.lastEffect.diplomacy}%
                      </div>
                    </div>
                  )}
                </div>
                
                {/* AI分析結果表示 */}
                {gameState.lastEffect.aiAnalysis && (
                  <div className="mt-4 pt-3 border-t border-cyan-700">
                    <div className="text-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-cyan-300">🤖 AI分析:</span>
                        <span className="text-xs bg-cyan-800 px-2 py-1 rounded">
                          信頼度 {gameState.lastEffect.aiAnalysis.confidence}%
                        </span>
                        <span className="text-xs bg-purple-800 px-2 py-1 rounded">
                          {aiProvider.getProviderConfigs()[currentProvider].displayName}
                        </span>
                      </div>
                      <p className="text-gray-200 text-xs leading-relaxed">
                        {gameState.lastEffect.aiAnalysis.reasoning}
                      </p>
                      
                      {gameState.lastEffect.aiAnalysis.risks.length > 0 && (
                        <div className="mt-2">
                          <span className="text-red-300 text-xs">⚠️ リスク: </span>
                          <span className="text-gray-300 text-xs">
                            {gameState.lastEffect.aiAnalysis.risks.join(', ')}
                          </span>
                        </div>
                      )}
                      
                      {gameState.lastEffect.aiAnalysis.opportunities.length > 0 && (
                        <div className="mt-1">
                          <span className="text-green-300 text-xs">💡 機会: </span>
                          <span className="text-gray-300 text-xs">
                            {gameState.lastEffect.aiAnalysis.opportunities.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    
    {/* ランキングモーダル */}
    <RankingModal 
      isOpen={showRankingModal}
      onClose={() => setShowRankingModal(false)}
    />
    
    {/* スコア登録モーダル */}
    <ScoreSubmissionModal
      isOpen={showScoreSubmissionModal}
      onClose={() => setShowScoreSubmissionModal(false)}
      gameState={gameState}
      totalScore={calculateFinalRank().totalScore}
      rank={calculateFinalRank().rank}
    />
    </>
  );
}

export default App;