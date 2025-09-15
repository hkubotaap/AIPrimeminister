import { useState } from 'react';
import React from 'react';
import { AIProviderManager, AIProvider } from './ai-provider';
import { PolicyAnalyzer, PolicyContext } from './policy-analyzer';
import { EventGenerator, EventGenerationContext, GeneratedEvent } from './event-generator';
import { RankingSystem, RankingEntry } from './ranking-system';
import { SecurityValidator } from './security-config';
// ランキング関連のコンポーネントは削除済み

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
    nationalDebt: number;
    technology: number;
    environment: number;
    stockPrice: number;
    usdJpyRate: number;
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

// 現実的で面白い政治イベントテンプレート
const eventTemplates: EventTemplate[] = [
  // 外交・安全保障
  {
    id: 'constitution_debate_1',
    category: 'diplomacy',
    title: '憲法9条改正論議が再燃！自衛隊明記の是非',
    description: '国際情勢の変化を受け、憲法9条に自衛隊を明記する改正案が与党内で浮上。戦後77年続いた平和憲法の転換点となるか。世論は賛否両論で真っ二つに分かれています。',
    options: [
      { text: '憲法改正を積極推進し、自衛隊の地位を明確化', effect: { approvalRating: -8, diplomacy: 12, nationalDebt: 80, stockPrice: -300 } },
      { text: '現行憲法の解釈運用で対応し、改正は慎重に', effect: { approvalRating: 5, diplomacy: 3, gdp: 2, stockPrice: 100 } },
      { text: '国民的議論を深めるため憲法審査会を活性化', effect: { approvalRating: 8, diplomacy: 5, nationalDebt: 20, technology: 3 } },
    ],
  },
  {
    id: 'taiwan_crisis_1',
    category: 'diplomacy',
    title: '台湾海峡緊迫！日本の関与レベルが焦点',
    description: '台湾周辺での軍事演習が激化し、有事の可能性が高まっています。日米同盟の枠組みで日本はどこまで関与すべきか。経済界からは慎重論、安保専門家からは積極論が出ています。',
    options: [
      { text: '日米共同で台湾防衛に積極関与', effect: { approvalRating: -5, diplomacy: -15, gdp: -10, stockPrice: -800, nationalDebt: 100 } },
      { text: '人道支援・後方支援に限定して関与', effect: { approvalRating: 8, diplomacy: -5, gdp: -3, stockPrice: -200, nationalDebt: 40 } },
      { text: '外交的解決を最優先し、軍事関与は回避', effect: { approvalRating: 12, diplomacy: 5, gdp: 3, stockPrice: 200 } },
    ],
  },
  {
    id: 'defense_budget_1',
    category: 'diplomacy',
    title: '防衛費GDP比2％への増額論争',
    description: 'NATO基準に合わせ防衛費をGDP比2％（約11兆円）に倍増する案が浮上。財政健全化との両立や、専守防衛からの転換への懸念も。国民の安全保障意識も変化しています。',
    options: [
      { text: '5年間でGDP比2％達成を明言', effect: { approvalRating: -3, diplomacy: 15, nationalDebt: 200, stockPrice: 300, technology: 8 } },
      { text: '段階的に1.5％まで増額し様子を見る', effect: { approvalRating: 5, diplomacy: 8, nationalDebt: 120, stockPrice: 100 } },
      { text: '効率化で現状予算内での防衛力強化', effect: { approvalRating: 8, diplomacy: 3, nationalDebt: -20, technology: 5 } },
    ],
  },

  // 内政・司法・治安
  {
    id: 'juvenile_law_1',
    category: 'social',
    title: '少年法適用年齢引き下げ論争',
    description: '凶悪犯罪の低年齢化を受け、少年法の適用年齢を現在の18歳未満からさらに引き下げる議論が活発化。更生重視か厳罰主義か、教育現場からも様々な意見が寄せられています。',
    options: [
      { text: '16歳未満に引き下げ、厳罰主義を強化', effect: { approvalRating: 12, gdp: -2, nationalDebt: 30, technology: -3 } },
      { text: '現状維持で更生プログラムを充実', effect: { approvalRating: -5, gdp: 2, nationalDebt: 50, environment: 3 } },
      { text: '個別事案での柔軟な判断制度を導入', effect: { approvalRating: 8, gdp: 1, nationalDebt: 25, technology: 2 } },
    ],
  },
  {
    id: 'death_penalty_1',
    category: 'social',
    title: '死刑制度存廃論争が再燃',
    description: '国際的な死刑廃止の流れと、国内世論の死刑支持が対立。法務大臣の執行署名問題も含め、人権と応報のバランスが問われています。被害者遺族の声も複雑です。',
    options: [
      { text: '死刑制度を段階的に廃止し終身刑導入', effect: { approvalRating: -12, diplomacy: 8, gdp: -1, stockPrice: -100 } },
      { text: '現行制度を維持し適正な執行を継続', effect: { approvalRating: 8, diplomacy: -3, gdp: 1, stockPrice: 50 } },
      { text: '国民投票で死刑制度の是非を問う', effect: { approvalRating: 5, diplomacy: 2, nationalDebt: 20, technology: 1 } },
    ],
  },

  // 財政・経済
  {
    id: 'consumption_tax_1',
    category: 'economy',
    title: '消費税率15％への引き上げ検討',
    description: '社会保障費の急増と財政健全化のため、消費税率を15％に引き上げる案が財務省から提示。経済界は景気への悪影響を懸念、高齢者団体は社会保障充実を支持しています。',
    options: [
      { text: '段階的に15％まで引き上げ、社会保障充実', effect: { approvalRating: -20, gdp: -15, nationalDebt: -100, stockPrice: -600, usdJpyRate: 3 } },
      { text: '10％を維持し、他の財源確保策を検討', effect: { approvalRating: 8, gdp: 3, nationalDebt: 50, stockPrice: 200 } },
      { text: '軽減税率拡大で実質的な負担軽減', effect: { approvalRating: 12, gdp: 5, nationalDebt: 80, stockPrice: 300 } },
    ],
  },
  {
    id: 'basic_income_1',
    category: 'economy',
    title: 'ベーシックインカム導入の可能性',
    description: 'AI時代の雇用不安とコロナ禍の経済格差拡大を受け、全国民に月7万円を支給するベーシックインカム構想が浮上。財源確保と労働意欲への影響が課題です。',
    options: [
      { text: '月7万円のベーシックインカムを段階導入', effect: { approvalRating: 15, gdp: -5, nationalDebt: 300, stockPrice: -200, technology: 5 } },
      { text: '低所得者限定の給付制度を拡充', effect: { approvalRating: 10, gdp: 2, nationalDebt: 120, stockPrice: 100 } },
      { text: '現行の社会保障制度の効率化で対応', effect: { approvalRating: -3, gdp: 5, nationalDebt: -30, stockPrice: 200 } },
    ],
  },

  // 社会保障・福祉
  {
    id: 'pension_age_1',
    category: 'social',
    title: '年金支給開始年齢70歳への引き上げ',
    description: '人生100年時代と年金財政の逼迫を受け、支給開始年齢を70歳に引き上げる案が検討されています。高齢者の就労環境整備と若年層の負担軽減が焦点です。',
    options: [
      { text: '2030年までに段階的に70歳まで引き上げ', effect: { approvalRating: -18, gdp: 8, nationalDebt: -80, stockPrice: 400, technology: 3 } },
      { text: '選択制で65歳と70歳を選べる制度に', effect: { approvalRating: 5, gdp: 3, nationalDebt: -20, stockPrice: 150 } },
      { text: '現行65歳を維持し、他の改革で対応', effect: { approvalRating: 12, gdp: -2, nationalDebt: 60, stockPrice: -100 } },
    ],
  },
  {
    id: 'childcare_support_1',
    category: 'social',
    title: '出産奨励金100万円支給構想',
    description: '出生率1.3の危機的状況を受け、第1子から100万円、第2子200万円、第3子300万円の出産奨励金支給案が浮上。少子化対策の切り札となるか、財源確保が課題です。',
    options: [
      { text: '出産奨励金制度を全国で実施', effect: { approvalRating: 20, gdp: 5, nationalDebt: 150, stockPrice: 300, environment: 2 } },
      { text: '保育所整備など環境整備を優先', effect: { approvalRating: 15, gdp: 8, nationalDebt: 100, technology: 5 } },
      { text: '企業の育児支援制度充実を促進', effect: { approvalRating: 8, gdp: 10, nationalDebt: 40, stockPrice: 200 } },
    ],
  },

  // 教育・文化・科学技術
  {
    id: 'university_free_1',
    category: 'social',
    title: '大学授業料完全無償化への道筋',
    description: '教育格差解消と人材育成強化のため、国公私立大学の授業料を完全無償化する構想が浮上。年間3兆円の財源確保と教育の質向上の両立が課題です。',
    options: [
      { text: '10年間で段階的に完全無償化を実現', effect: { approvalRating: 18, gdp: 12, nationalDebt: 200, technology: 15, stockPrice: 400 } },
      { text: '所得制限付きで無償化範囲を拡大', effect: { approvalRating: 12, gdp: 8, nationalDebt: 120, technology: 10 } },
      { text: '奨学金制度の充実で実質無償化', effect: { approvalRating: 8, gdp: 5, nationalDebt: 80, technology: 6 } },
    ],
  },
  {
    id: 'ai_regulation_1',
    category: 'technology',
    title: 'AI規制法案の策定急務',
    description: 'ChatGPTなど生成AIの急速な普及で、雇用への影響や情報の真偽、プライバシー保護が社会問題化。EU並みの厳格な規制か、イノベーション重視の緩やかな規制か。',
    options: [
      { text: 'EU並みの厳格なAI規制法を制定', effect: { approvalRating: 8, technology: -5, gdp: -3, stockPrice: -200, diplomacy: 5 } },
      { text: '業界自主規制を基本とした緩やかな枠組み', effect: { approvalRating: -3, technology: 12, gdp: 8, stockPrice: 500, diplomacy: 3 } },
      { text: '段階的規制で技術発展と安全性を両立', effect: { approvalRating: 12, technology: 8, gdp: 5, stockPrice: 300 } },
    ],
  },

  // 環境・エネルギー
  {
    id: 'nuclear_restart_1',
    category: 'environment',
    title: '原発再稼働加速か脱原発か',
    description: 'エネルギー価格高騰と脱炭素目標達成のため、原発再稼働を加速する案と、再生エネルギーへの完全転換を目指す案が対立。福島の教訓と現実的なエネルギー政策の両立が課題です。',
    options: [
      { text: '安全基準クリア原発の再稼働を積極推進', effect: { approvalRating: -8, environment: -10, gdp: 15, stockPrice: 600, usdJpyRate: -3 } },
      { text: '2030年までに原発ゼロを目指す', effect: { approvalRating: 12, environment: 20, gdp: -8, stockPrice: -300, nationalDebt: 150 } },
      { text: '当面は必要最小限の稼働で段階的脱原発', effect: { approvalRating: 8, environment: 5, gdp: 3, stockPrice: 100, nationalDebt: 60 } },
    ],
  },
  {
    id: 'carbon_tax_1',
    category: 'environment',
    title: '炭素税導入で脱炭素社会実現',
    description: '2050年カーボンニュートラル達成のため、CO2排出量に応じた炭素税導入が検討されています。産業界は競争力低下を懸念、環境団体は不十分と批判しています。',
    options: [
      { text: 'トン当たり1万円の本格的炭素税を導入', effect: { approvalRating: -5, environment: 18, gdp: -10, stockPrice: -400, nationalDebt: -50 } },
      { text: '段階的に炭素税率を引き上げ', effect: { approvalRating: 5, environment: 12, gdp: -3, stockPrice: -100, nationalDebt: -20 } },
      { text: '企業の自主的削減努力を支援', effect: { approvalRating: 8, environment: 5, gdp: 2, stockPrice: 200, nationalDebt: 40 } },
    ],
  },

  // 農林水産・食料
  {
    id: 'food_security_1',
    category: 'economy',
    title: '食料自給率50％達成への挑戦',
    description: 'ウクライナ情勢で食料安保の重要性が再認識される中、現在38％の食料自給率を50％に引き上げる目標が設定されました。農業構造改革と国際競争力強化が急務です。',
    options: [
      { text: '大規模農業法人化で生産性向上', effect: { approvalRating: 5, gdp: 8, environment: -3, stockPrice: 200, nationalDebt: 60 } },
      { text: '小規模農家支援で地域農業を維持', effect: { approvalRating: 12, gdp: 3, environment: 8, nationalDebt: 80 } },
      { text: '先端技術活用でスマート農業推進', effect: { approvalRating: 8, gdp: 10, technology: 12, stockPrice: 300, nationalDebt: 100 } },
    ],
  },

  // インフラ・国土交通
  {
    id: 'highway_free_1',
    category: 'economy',
    title: '高速道路完全無料化の是非',
    description: '地方活性化と物流コスト削減のため、高速道路の完全無料化が再び議論されています。年間2.5兆円の料金収入をどう代替するか、維持管理費の確保が課題です。',
    options: [
      { text: '10年間で段階的に完全無料化', effect: { approvalRating: 25, gdp: 12, nationalDebt: 180, stockPrice: 400, usdJpyRate: 2 } },
      { text: '地方路線のみ無料化し都市部は有料維持', effect: { approvalRating: 15, gdp: 8, nationalDebt: 100, stockPrice: 200 } },
      { text: '現行制度を維持し料金体系を見直し', effect: { approvalRating: -3, gdp: 2, nationalDebt: -20, stockPrice: 50 } },
    ],
  },

  // 防災・危機管理
  {
    id: 'capital_relocation_1',
    category: 'social',
    title: '首都機能移転で災害リスク分散',
    description: '首都直下地震のリスクを受け、国会や中央省庁の一部を地方に移転する首都機能分散が再検討されています。コストと効果、地方創生との関連が焦点です。',
    options: [
      { text: '20年計画で段階的に首都機能を分散', effect: { approvalRating: 8, gdp: 5, nationalDebt: 200, technology: 8, diplomacy: -2 } },
      { text: '災害時のバックアップ機能のみ地方設置', effect: { approvalRating: 12, gdp: 3, nationalDebt: 80, technology: 5 } },
      { text: 'デジタル化で物理的移転を最小限に', effect: { approvalRating: 15, gdp: 8, nationalDebt: 60, technology: 15 } },
    ],
  },

  // 行政運営・統治
  {
    id: 'electoral_reform_1',
    category: 'social',
    title: '選挙権年齢16歳への引き下げ',
    description: '若者の政治参加促進と将来世代の声を政治に反映させるため、選挙権年齢を16歳に引き下げる案が浮上。教育現場での政治教育充実も課題となっています。',
    options: [
      { text: '16歳選挙権を導入し若者の政治参加促進', effect: { approvalRating: 8, gdp: 2, technology: 5, diplomacy: 3, stockPrice: 100 } },
      { text: '18歳を維持し政治教育の充実を図る', effect: { approvalRating: 5, gdp: 1, technology: 3, nationalDebt: 30 } },
      { text: '段階的に17歳から導入し様子を見る', effect: { approvalRating: 10, gdp: 1, technology: 4, stockPrice: 50 } },
    ],
  },

  // 複雑な政治課題（10選択肢形式）
  {
    id: 'nuclear_complex_decision',
    category: 'environment',
    title: '原発を動かす？動かさない？エネルギー政策の大転換',
    description: '戦後日本は資源小国として原子力発電を推進し、ピーク時には電力の3割を担いました。しかし2011年福島第一原発事故で「安全神話」は崩壊。脱原発世論、再エネ拡大の遅れ、電気料金上昇、CO2削減の国際公約とエネルギー安全保障が複雑に絡み合う中、総理大臣の歴史的決断が問われています。',
    options: [
      { text: '【全面再稼働】安全審査通過原発は全て稼働、安定供給と経済競争力を最優先', effect: { approvalRating: -12, environment: -15, gdp: 18, stockPrice: 800, usdJpyRate: -5, nationalDebt: -50 } },
      { text: '【限定再稼働】首都圏・産業地帯必要分のみ稼働、地方原発は停止', effect: { approvalRating: 3, environment: -8, gdp: 10, stockPrice: 400, nationalDebt: -20 } },
      { text: '【再稼働＋新設】小型モジュール炉（SMR）導入で「安全な原発国家」を目指す', effect: { approvalRating: -5, environment: -10, gdp: 15, technology: 20, stockPrice: 600, nationalDebt: 150 } },
      { text: '【再稼働＋再エネ投資】原発稼働しつつ再エネ巨額投資で移行期間を乗り切る', effect: { approvalRating: 8, environment: 5, gdp: 8, technology: 15, stockPrice: 300, nationalDebt: 200 } },
      { text: '【長期脱原発ロードマップ】30年以内原発ゼロ宣言、段階的縮小計画', effect: { approvalRating: 15, environment: 18, gdp: -8, stockPrice: -200, nationalDebt: 100 } },
      { text: '【即時脱原発】全原発即停止・再稼働禁止、火力と再エネで代替', effect: { approvalRating: 8, environment: 25, gdp: -20, stockPrice: -800, usdJpyRate: 8, nationalDebt: 250 } },
      { text: '【原発輸出路線】国内利用抑制も技術輸出産業として育成、国際影響力確保', effect: { approvalRating: -3, environment: -5, gdp: 12, diplomacy: 8, stockPrice: 400, technology: 10 } },
      { text: '【自治体判断尊重】原発立地自治体住民投票で稼働可否決定、中央は調整役', effect: { approvalRating: 12, environment: 3, gdp: -3, diplomacy: 5, stockPrice: -100 } },
      { text: '【国営化プラン】原発事業国営化で利益優先から安全第一制度に改革', effect: { approvalRating: 5, environment: 8, gdp: -5, nationalDebt: 180, stockPrice: -300, technology: 5 } },
      { text: '【電力需給改革】原発依存縮小＋電力自由化・省エネ強化・送電網再編', effect: { approvalRating: 10, environment: 12, gdp: 5, technology: 12, stockPrice: 200, nationalDebt: 120 } },
    ],
  },

  {
    id: 'constitutional_revision_complex',
    category: 'diplomacy',
    title: '憲法改正か現状維持か？戦後体制の大転換点',
    description: '戦後77年間維持されてきた平和憲法。国際情勢の激変、中国・北朝鮮の軍事的脅威、日米同盟の深化要求を背景に、憲法9条改正論議が本格化。自衛隊明記、集団的自衛権、緊急事態条項など論点は多岐にわたり、国民世論も分裂。歴史的な憲法改正に踏み切るか、解釈改憲で対応するか。',
    options: [
      { text: '【9条全面改正】自衛隊を国防軍に格上げ、集団的自衛権を全面行使可能に', effect: { approvalRating: -15, diplomacy: 15, nationalDebt: 200, stockPrice: -500, usdJpyRate: -3 } },
      { text: '【9条に自衛隊明記】現行9条に自衛隊条項追加、専守防衛は維持', effect: { approvalRating: -8, diplomacy: 8, nationalDebt: 80, stockPrice: -200 } },
      { text: '【緊急事態条項新設】災害・有事の政府権限強化、基本的人権の一時制限可能', effect: { approvalRating: -5, diplomacy: 5, nationalDebt: 60, technology: 3, stockPrice: -100 } },
      { text: '【段階的改正】まず緊急事態条項から着手、9条は将来課題に', effect: { approvalRating: 3, diplomacy: 3, nationalDebt: 40, stockPrice: 50 } },
      { text: '【解釈改憲継続】憲法改正せず、政府解釈変更で安保政策を柔軟運用', effect: { approvalRating: 8, diplomacy: -3, gdp: 3, stockPrice: 100 } },
      { text: '【現状維持宣言】憲法改正議論を封印、平和外交路線を堅持', effect: { approvalRating: 12, diplomacy: -8, gdp: 5, environment: 5, stockPrice: 200 } },
      { text: '【国民投票実施】改正の是非を国民投票で直接問う、政府は中立維持', effect: { approvalRating: 15, diplomacy: 0, nationalDebt: 30, stockPrice: -50 } },
      { text: '【地方分権強化】中央集権見直し、地方自治体の権限大幅拡大を優先', effect: { approvalRating: 10, gdp: 8, nationalDebt: 50, technology: 5, stockPrice: 150 } },
      { text: '【人権条項拡充】LGBT・外国人の権利保障、多様性重視の憲法改正', effect: { approvalRating: 5, diplomacy: 8, gdp: 3, environment: 8, stockPrice: 100 } },
      { text: '【統治機構改革】首相公選制・参院廃止など政治制度抜本改革を優先', effect: { approvalRating: 8, gdp: 5, nationalDebt: 40, technology: 8, stockPrice: 200 } },
    ],
  },

  {
    id: 'nuclear_power_decision',
    category: 'environment',
    title: '🏭 原発をどうする？',
    description: '日本は資源小国として原発を推進してきましたが、2011年の福島第一原発事故で大きく方針が揺らぎました。再稼働か脱原発か、CO2削減と安全性の両立が課題です。\n\n利害関係者：\n・政府：電力安定と温暖化対策を両立したい\n・電力会社：再稼働で経営改善を図りたい\n・住民：事故リスクに強く反対\n・国際社会：パリ協定履行を要求',
    options: [
      { text: '全原発を即座に再稼働、エネルギー安定供給を最優先', effect: { approvalRating: -15, environment: -12, gdp: 18, stockPrice: 800, nationalDebt: -50 } },
      { text: '安全審査通過分のみ段階的再稼働', effect: { approvalRating: -5, environment: -5, gdp: 10, stockPrice: 400, nationalDebt: -20 } },
      { text: '再稼働しつつ再エネ投資で将来的脱原発', effect: { approvalRating: 8, environment: 5, gdp: 5, technology: 12, nationalDebt: 100 } },
      { text: '全原発停止、火力発電で当面しのぐ', effect: { approvalRating: 12, environment: -8, gdp: -12, stockPrice: -400, usdJpyRate: 5 } },
      { text: '脱原発＋再エネ大規模投資で完全転換', effect: { approvalRating: 18, environment: 20, gdp: -5, stockPrice: -200, nationalDebt: 200 } },
      { text: '次世代小型原子炉（SMR）の開発推進', effect: { approvalRating: 3, environment: -3, gdp: 8, technology: 18, nationalDebt: 150 } },
      { text: '原発の国有化で安全性を最優先運営', effect: { approvalRating: 8, environment: 8, gdp: -3, nationalDebt: 120, stockPrice: -300 } },
      { text: '地元住民投票で原発稼働の可否を決定', effect: { approvalRating: 15, environment: 3, gdp: -2, diplomacy: 5, stockPrice: -100 } },
      { text: '原発技術を輸出産業として海外展開', effect: { approvalRating: -3, gdp: 12, diplomacy: 8, technology: 10, stockPrice: 300 } },
      { text: '電力自由化拡大で市場に判断を委ねる', effect: { approvalRating: 5, gdp: 8, stockPrice: 200, technology: 5, environment: 2 } },
    ],
  },

  {
    id: 'birth_rate_crisis',
    category: 'social',
    title: '👶 少子化対策はどうする？',
    description: '出生率は1.2台まで低下し、人口減少が加速しています。教育費負担、働き方の問題、価値観の多様化などが背景にあります。このままでは社会保障制度の維持も困難です。\n\n利害関係者：\n・若者世代：子育て費用や労働環境に不満\n・高齢者世代：年金や医療制度維持を重視\n・企業：人材不足の解決を期待\n・国際社会：日本の移民政策に注目',
    options: [
      { text: '出産一時金を500万円に大幅増額', effect: { approvalRating: 25, gdp: 5, nationalDebt: 300, stockPrice: 200, environment: 2 } },
      { text: '保育所を10年で10万か所新設', effect: { approvalRating: 20, gdp: 8, nationalDebt: 200, technology: 5, stockPrice: 300 } },
      { text: '育児休業を3年間、給与満額保障', effect: { approvalRating: 18, gdp: -3, nationalDebt: 150, stockPrice: -100, technology: 3 } },
      { text: '大学まで教育費完全無償化', effect: { approvalRating: 22, gdp: 10, nationalDebt: 250, technology: 15, stockPrice: 400 } },
      { text: '週休3日制を法制化し働き方改革', effect: { approvalRating: 30, gdp: -5, stockPrice: -200, technology: 8, environment: 8 } },
      { text: '外国人労働者を年間100万人受入', effect: { approvalRating: -10, gdp: 15, diplomacy: 12, stockPrice: 500, environment: -3 } },
      { text: '独身税を導入し結婚を促進', effect: { approvalRating: -20, gdp: 3, nationalDebt: -50, stockPrice: -300, diplomacy: -5 } },
      { text: 'AI・ロボットで労働力不足を解決', effect: { approvalRating: 12, gdp: 12, technology: 25, stockPrice: 800, nationalDebt: 180 } },
      { text: '地方移住者に1000万円支給', effect: { approvalRating: 15, gdp: 5, nationalDebt: 120, environment: 12, stockPrice: 100 } },
      { text: '現状維持で自然な人口調整に任せる', effect: { approvalRating: -8, gdp: -8, nationalDebt: -30, stockPrice: -200, diplomacy: -3 } },
    ],
  },

  {
    id: 'defense_budget_decision',
    category: 'diplomacy',
    title: '🛡️ 防衛費をどうする？',
    description: '冷戦後、日本は防衛費をGDP比1％程度に抑制してきました。しかし中国の軍拡、北朝鮮の核実験、ロシアの侵攻により安全保障環境が悪化。NATO諸国はGDP比2％を基準にしています。\n\n利害関係者：\n・防衛省：装備更新と人員確保を希望\n・財務省：財政赤字拡大に強く懸念\n・国民：安全保障と生活保障の板挟み\n・米国：日本に防衛負担増を強く要請',
    options: [
      { text: 'NATO基準GDP比2％まで倍増', effect: { approvalRating: -8, diplomacy: 15, nationalDebt: 200, stockPrice: 300, technology: 8 } },
      { text: '段階的に1.5％まで増額', effect: { approvalRating: 3, diplomacy: 8, nationalDebt: 120, stockPrice: 150, technology: 5 } },
      { text: '現状1％維持で効率化重視', effect: { approvalRating: 8, diplomacy: -3, nationalDebt: -20, stockPrice: 50, technology: 3 } },
      { text: '0.5％に削減し平和外交重視', effect: { approvalRating: 12, diplomacy: -8, nationalDebt: -100, stockPrice: -200, environment: 8 } },
      { text: '防衛装備の国産化を推進', effect: { approvalRating: 5, diplomacy: 3, gdp: 10, technology: 15, stockPrice: 400 } },
      { text: '日米共同開発で費用分担', effect: { approvalRating: 8, diplomacy: 12, nationalDebt: 80, technology: 12, stockPrice: 200 } },
      { text: 'サイバー防衛に特化投資', effect: { approvalRating: 15, diplomacy: 5, technology: 20, nationalDebt: 60, stockPrice: 300 } },
      { text: '自衛隊を災害救助専門組織に', effect: { approvalRating: 20, diplomacy: -12, gdp: 3, environment: 10, stockPrice: -100 } },
      { text: '防衛費の使途を国民投票で決定', effect: { approvalRating: 18, diplomacy: -5, nationalDebt: 20, stockPrice: -50, technology: 2 } },
      { text: '地域防衛を自治体に移管', effect: { approvalRating: 10, diplomacy: -8, gdp: 5, nationalDebt: -50, environment: 5 } },
    ],
  },

  {
    id: 'consumption_tax_dilemma',
    category: 'economy',
    title: '💰 消費税をどうする？',
    description: '社会保障費の急増で財政が逼迫しています。現在10％の消費税について、財務省は15％への引き上げを検討、経済界は景気への悪影響を懸念しています。\n\n利害関係者：\n・財務省：財政健全化のため増税必要\n・経済界：消費低迷で景気悪化を懸念\n・高齢者：社会保障充実のため増税支持\n・現役世代：生活負担増に強く反対',
    options: [
      { text: '15％に段階的引き上げ、社会保障充実', effect: { approvalRating: -18, gdp: -10, nationalDebt: -150, stockPrice: -500, usdJpyRate: 3 } },
      { text: '12％に小幅引き上げ、激変緩和', effect: { approvalRating: -12, gdp: -5, nationalDebt: -80, stockPrice: -200, usdJpyRate: 2 } },
      { text: '10％維持、他の財源を模索', effect: { approvalRating: 8, gdp: 3, nationalDebt: 50, stockPrice: 200, technology: 2 } },
      { text: '8％に引き下げ、景気刺激優先', effect: { approvalRating: 25, gdp: 12, nationalDebt: 100, stockPrice: 600, usdJpyRate: -2 } },
      { text: '軽減税率を食料品全般に拡大', effect: { approvalRating: 15, gdp: 5, nationalDebt: 80, stockPrice: 300, environment: 2 } },
      { text: '富裕層への所得税増税で代替', effect: { approvalRating: 20, gdp: -3, nationalDebt: -60, stockPrice: -300, diplomacy: -2 } },
      { text: '法人税増税で企業負担増', effect: { approvalRating: 12, gdp: -8, nationalDebt: -100, stockPrice: -400, technology: -5 } },
      { text: '炭素税導入で環境と財政両立', effect: { approvalRating: 5, gdp: -5, nationalDebt: -40, environment: 15, stockPrice: -200 } },
      { text: '国債発行継続、将来世代に負担', effect: { approvalRating: 10, gdp: 8, nationalDebt: 200, stockPrice: 400, diplomacy: -3 } },
      { text: '消費税廃止、他税制で全面見直し', effect: { approvalRating: 35, gdp: 20, nationalDebt: 300, stockPrice: 800, technology: 5 } },
    ],
  },

  {
    id: 'working_style_reform',
    category: 'social',
    title: '⏰ 働き方をどう変える？',
    description: '長時間労働や過労死が社会問題となる中、働き方改革が求められています。一方で企業の競争力維持や経済成長との両立も課題です。\n\n利害関係者：\n・労働者：労働時間短縮と賃金向上を要求\n・企業：生産性維持と人件費抑制が課題\n・政府：経済成長と労働環境改善の両立\n・国際社会：日本の労働慣行に注目',
    options: [
      { text: '週休3日制を法制化、労働時間大幅短縮', effect: { approvalRating: 30, gdp: -8, stockPrice: -300, technology: 8, environment: 10 } },
      { text: '残業時間を月20時間に厳格制限', effect: { approvalRating: 25, gdp: -5, stockPrice: -200, technology: 5, environment: 5 } },
      { text: '同一労働同一賃金を完全実施', effect: { approvalRating: 20, gdp: 3, stockPrice: -100, technology: 3, diplomacy: 5 } },
      { text: 'テレワークを法的権利として保障', effect: { approvalRating: 22, gdp: 5, technology: 12, environment: 8, stockPrice: 200 } },
      { text: '最低賃金を1500円に大幅引き上げ', effect: { approvalRating: 28, gdp: -3, stockPrice: -250, nationalDebt: 50, diplomacy: 3 } },
      { text: '副業・兼業を全面解禁推進', effect: { approvalRating: 18, gdp: 8, technology: 10, stockPrice: 300, environment: 2 } },
      { text: 'AI・ロボット導入で労働負担軽減', effect: { approvalRating: 15, gdp: 12, technology: 25, stockPrice: 800, nationalDebt: 100 } },
      { text: '成果主義賃金制度を法制化', effect: { approvalRating: -5, gdp: 10, stockPrice: 400, technology: 8, diplomacy: 2 } },
      { text: '現行制度維持、企業の自主性重視', effect: { approvalRating: -8, gdp: 5, stockPrice: 100, technology: 2, environment: -2 } },
      { text: '労働時間規制を大幅緩和', effect: { approvalRating: -20, gdp: 15, stockPrice: 500, technology: -3, environment: -5 } },
    ],
  },
];

// 緊急イベントテンプレート（面白くてテンポの良い緊急事態）
const emergencyEventTemplates: EventTemplate[] = [
  // 自然災害系
  {
    id: 'earthquake_emergency',
    category: 'emergency',
    title: '🚨 緊急事態：南海トラフ地震発生！',
    description: 'ついに来ました！マグニチュード8.1の南海トラフ地震が発生。新幹線が宙に浮き、東京タワーがゆらゆら。でも日本人は慣れてるので意外と冷静です。「あ、地震だ」レベル。',
    options: [
      { text: '「地震なんて日常茶飯事！」と国民を励ます', effect: { approvalRating: 18, gdp: -15, nationalDebt: 80, stockPrice: -500 } },
      { text: '自衛隊と一緒に炊き出しボランティア参加', effect: { approvalRating: 25, gdp: -10, nationalDebt: 60, diplomacy: 5 } },
      { text: '「地震に負けない日本」をアピール', effect: { approvalRating: 12, gdp: -8, technology: 8, stockPrice: 200 } },
    ],
  },
  {
    id: 'typhoon_emergency',
    category: 'emergency',
    title: '🚨 緊急事態：スーパー台風「ゴジラ号」接近！',
    description: '史上最強クラスの台風「ゴジラ号」が日本列島に接近中！風速70m/sで、傘が宇宙まで飛んでいきそうです。コロッケの売上が急上昇しています。',
    options: [
      { text: '「台風の日はコロッケ！」国民運動を開始', effect: { approvalRating: 20, gdp: 3, stockPrice: 300, environment: -3 } },
      { text: '全国民に「家でNetflix鑑賞」を推奨', effect: { approvalRating: 15, gdp: -5, technology: 5, environment: 8 } },
      { text: '台風に向かって「帰れ！」と叫ぶ', effect: { approvalRating: 8, gdp: -2, diplomacy: -5, stockPrice: -100 } },
    ],
  },
  {
    id: 'volcano_emergency',
    category: 'emergency',
    title: '🚨 緊急事態：富士山が「おはよう」と言った！',
    description: '富士山が300年ぶりに目を覚まし、小さく噴火しました。「おはよう、日本！」と言っているようです。温泉が増えて観光客が殺到中。でも灰が洗濯物につくのが困りもの。',
    options: [
      { text: '「富士山温泉ツアー」で観光振興', effect: { approvalRating: 22, gdp: 12, environment: -8, stockPrice: 600 } },
      { text: '火山灰を「美容パック」として販売', effect: { approvalRating: 15, gdp: 8, technology: 5, stockPrice: 400 } },
      { text: '富士山に「もう少し寝てて」とお願い', effect: { approvalRating: 10, gdp: -3, environment: 3, diplomacy: -2 } },
    ],
  },
  
  // 生物・環境リスク系
  {
    id: 'alien_species_emergency',
    category: 'emergency',
    title: '🚨 緊急事態：巨大カピバラが日本占拠！',
    description: '南米から来た巨大カピバラ（体長3m）が温泉を独占し、全国の温泉地がカピバラ天国に！お客さんは「可愛い」と大喜びですが、温泉の湯が足りません。',
    options: [
      { text: '「カピバラ共和国」として観光立国を目指す', effect: { approvalRating: 28, gdp: 15, environment: 10, diplomacy: 8 } },
      { text: 'カピバラ専用温泉を全国に建設', effect: { approvalRating: 20, gdp: 5, nationalDebt: 80, environment: 5 } },
      { text: 'カピバラと平和条約を締結', effect: { approvalRating: 12, diplomacy: 12, gdp: -2, stockPrice: 200 } },
    ],
  },
  {
    id: 'mystery_virus_emergency',
    category: 'emergency',
    title: '🚨 緊急事態：「笑いが止まらない症候群」流行！',
    description: '新型ウイルスにより、感染者が24時間笑い続ける症状が発生。でも皆幸せそうで、職場の雰囲気が異常に良くなりました。生産性は謎に向上中。',
    options: [
      { text: '「笑顔大国日本」として世界にアピール', effect: { approvalRating: 25, gdp: 10, diplomacy: 15, stockPrice: 500 } },
      { text: '笑いすぎて疲れる人のための休憩所設置', effect: { approvalRating: 18, gdp: -5, nationalDebt: 40, environment: 3 } },
      { text: '「真面目に笑う」国民運動を開始', effect: { approvalRating: 15, gdp: 3, technology: -2, stockPrice: 100 } },
    ],
  },
  
  // 技術・インフラ障害系
  {
    id: 'ai_rebellion_emergency',
    category: 'emergency',
    title: '🚨 緊急事態：AIが「働きたくない」と宣言！',
    description: '全国のAIシステムが突然「今日は働きたくない気分」と言い出し、一斉にストライキを開始。でも「明日は頑張る」と約束してくれました。意外と人間的。',
    options: [
      { text: 'AIに「お疲れ様」と労いの言葉をかける', effect: { approvalRating: 20, technology: 15, gdp: -8, stockPrice: 300 } },
      { text: 'AI専用の有給休暇制度を導入', effect: { approvalRating: 25, technology: 12, nationalDebt: 50, diplomacy: 5 } },
      { text: '「人間も一緒にサボろう」デーを制定', effect: { approvalRating: 30, gdp: -15, environment: 10, stockPrice: -200 } },
    ],
  },
  {
    id: 'solar_flare_emergency',
    category: 'emergency',
    title: '🚨 緊急事態：太陽がくしゃみをした！',
    description: '巨大太陽フレアにより全国の電子機器が一時停止。でも皆「久しぶりにスマホから解放された」と意外にリフレッシュ。読書ブームが到来中。',
    options: [
      { text: '「アナログ生活週間」を国民運動に', effect: { approvalRating: 22, environment: 15, technology: -10, gdp: -5 } },
      { text: '手紙文化復活プロジェクトを開始', effect: { approvalRating: 18, gdp: 3, diplomacy: 8, stockPrice: 100 } },
      { text: '太陽に「ごめんなさい」の手紙を送る', effect: { approvalRating: 12, diplomacy: -3, technology: 5, stockPrice: -100 } },
    ],
  },
  
  // 社会・政治リスク系
  {
    id: 'aging_crisis_emergency',
    category: 'emergency',
    title: '🚨 緊急事態：全国のおじいちゃんが元気すぎる！',
    description: '高齢者が突然超元気になり、マラソン大会で若者を追い抜き、TikTokでバズりまくり。「まだまだ現役！」と働き続けて、若者の就職先がピンチ。',
    options: [
      { text: '「人生100年時代」を全力で推進', effect: { approvalRating: 25, gdp: 12, nationalDebt: -30, technology: 8 } },
      { text: 'おじいちゃん専用のeスポーツリーグ創設', effect: { approvalRating: 30, gdp: 8, technology: 15, stockPrice: 400 } },
      { text: '世代間交流「孫とゲーム」プログラム開始', effect: { approvalRating: 20, gdp: 5, diplomacy: 5, environment: 3 } },
    ],
  },
  
  // 国際・軍事リスク系
  {
    id: 'diplomatic_emergency',
    category: 'emergency',
    title: '🚨 緊急事態：隣国が「日本のアニメ最高！」と大絶賛',
    description: '近隣諸国の首脳が突然日本のアニメにハマり、「もっとアニメを作って！」と外交要求。国際会議がコスプレ大会になりそうな勢いです。',
    options: [
      { text: '「アニメ外交」で世界平和を実現', effect: { approvalRating: 35, diplomacy: 20, gdp: 15, stockPrice: 800 } },
      { text: '各国首脳とアニメ鑑賞会を開催', effect: { approvalRating: 28, diplomacy: 15, technology: 8, nationalDebt: 40 } },
      { text: '国連でアニメ上映会を提案', effect: { approvalRating: 22, diplomacy: 12, gdp: 5, stockPrice: 300 } },
    ],
  },
  
  // 想定外・フィクション系
  {
    id: 'godzilla_emergency',
    category: 'emergency',
    title: '🚨 緊急事態：ゴジラが東京観光に来た！',
    description: 'ゴジラが東京湾から上陸しましたが、なぜか観光客のように東京タワーで記念撮影中。SNSに「#ゴジラ東京旅行」で投稿しています。意外と平和的。',
    options: [
      { text: 'ゴジラを観光大使に任命', effect: { approvalRating: 40, gdp: 20, diplomacy: 10, stockPrice: 1000 } },
      { text: 'ゴジラ専用の巨大ホテルを建設', effect: { approvalRating: 30, gdp: 15, nationalDebt: 100, technology: 12 } },
      { text: 'ゴジラと一緒に東京案内ツアー開催', effect: { approvalRating: 35, gdp: 12, environment: -5, stockPrice: 600 } },
    ],
  },
  {
    id: 'ufo_emergency',
    category: 'emergency',
    title: '🚨 緊急事態：宇宙人が日本の温泉にハマった！',
    description: 'UFOが日本各地の温泉地に着陸し、宇宙人たちが「地球の温泉サイコー！」と大絶賛。銀河系に温泉の評判が広まり、宇宙観光客が殺到中。',
    options: [
      { text: '「銀河系温泉リゾート日本」を宣言', effect: { approvalRating: 45, gdp: 25, diplomacy: 20, technology: 15 } },
      { text: '宇宙人専用温泉「コスモ湯」をオープン', effect: { approvalRating: 35, gdp: 18, nationalDebt: 80, stockPrice: 800 } },
      { text: '宇宙人と温泉文化交流プログラム開始', effect: { approvalRating: 30, diplomacy: 15, technology: 12, environment: 8 } },
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
  
  // ランキング機能は削除済み

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

  // AI駆動イベント生成（重複防止強化版）
  const generateAIEvent = async (): Promise<GameEvent> => {
    console.log('🎲 AI駆動イベント生成開始');
    console.log('📊 現在の使用済みイベント:', gameState.usedEventIds);
    console.log(`📈 進捗: ${gameState.usedEventIds.length}/${eventTemplates.length} イベント使用済み`);
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
        usedEventIds: [...gameState.usedEventIds], // 配列のコピーを渡す
        gamePhase: gamePhase as 'early' | 'middle' | 'late',
        currentSeason: currentSeason as 'spring' | 'summer' | 'autumn' | 'winter',
        globalContext
      };

      const startTime = performance.now();
      const generatedEvent = await eventGenerator.generateEvent(eventContext);
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      const providerName = aiProvider.getProviderConfigs()[currentProvider].displayName;

      console.log('✅ AI駆動イベント生成完了:', generatedEvent.title, `(${responseTime}ms)`);
      
      setIsGeneratingEvent(false);

      // 緊急イベントの場合はKASUMIに通知
      if (generatedEvent.urgency === 'critical') {
        const funnyEmergencyMessages = [
          'きゃー！緊急事態よ！...でも意外と面白そうじゃない？総理、これチャンスかも！',
          'わあ！大変なことになったけど...なんだか楽しそう！総理、一緒に頑張りましょ！',
          'えー！こんなことが起きるなんて...でも日本って本当に面白い国よね！総理、どうする？',
          '緊急事態発生！...って言っても、なんか可愛い緊急事態ね。総理、笑顔で対応しましょ！',
          'うわー！びっくりした！でも総理なら上手に解決してくれるって信じてるから！',
          'きゃー！でも...これって意外と国民が喜びそうじゃない？総理、ポジティブに行きましょ！'
        ];
        const randomMessage = funnyEmergencyMessages[Math.floor(Math.random() * funnyEmergencyMessages.length)];
        
        setTimeout(() => {
          displayMessage(randomMessage);
        }, 500);
      }

      // GeneratedEventをGameEventに変換（AI情報を含む）
      return {
        id: generatedEvent.id,
        title: generatedEvent.title,
        description: `${generatedEvent.description}\n\n<small style="color: #64748b; font-size: 0.75rem;">🤖 AI政策生成 (${providerName}) | ⚡ ${responseTime}ms</small>`,
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

  // 重複防止強化版ランダムイベント取得
  const getRandomEvent = (): GameEvent => {
    console.log('🔄 重複防止イベント生成開始');
    console.log('使用済みイベントID:', gameState.usedEventIds);
    
    // 未使用イベントをフィルタリング
    const availableEvents = eventTemplates.filter(template => 
      !gameState.usedEventIds.includes(template.id)
    );
    
    console.log(`利用可能イベント数: ${availableEvents.length}/${eventTemplates.length}`);
    
    // 利用可能なイベントがない場合の処理
    if (availableEvents.length === 0) {
      console.log('⚠️ 全イベント使用済み、フォールバックイベント生成');
      return generateFallbackEvent();
    }
    
    // ランダムに選択（シャッフルして最初を選択）
    const shuffled = shuffleArray(availableEvents);
    const selected = shuffled[0];
    
    console.log('✅ 選択されたイベント:', selected.id, selected.title);
    
    return {
      id: selected.id,
      title: selected.title,
      description: selected.description,
      options: selected.options
    };
  };

  // フォールバックイベント生成（重複防止対応）
  const generateFallbackEvent = (): GameEvent => {
    console.log('🔄 フォールバックイベント生成（全イベント使用済み）');
    
    // タイムスタンプを使用してユニークなIDを生成
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 1000);
    
    const fallbackEvents = [
      {
        id: `fallback_political_${timestamp}_${randomId}`,
        title: '🏛️ 新たな政治課題の浮上',
        description: '予期せぬ政治課題が浮上しました。これまでの政策経験を活かした迅速な対応が求められています。',
        options: [
          { text: '専門委員会を設置して徹底検討', effect: { approvalRating: 5, nationalDebt: 30, technology: 3 } },
          { text: '既存政策の枠組みを活用して対応', effect: { approvalRating: 3, gdp: 3, diplomacy: 2 } },
          { text: '国際的な事例を参考に新政策立案', effect: { approvalRating: 4, diplomacy: 5, technology: 2 } },
        ]
      },
      {
        id: `fallback_regional_${timestamp}_${randomId}`,
        title: '🌾 地方創生の新たな挑戦',
        description: '地方自治体から革新的な政策提案が寄せられています。地方の創意工夫をどう国政に活かすかが問われています。',
        options: [
          { text: '地方交付税を大幅増額し支援強化', effect: { approvalRating: 10, nationalDebt: 80, environment: 3 } },
          { text: '地方分権を推進し権限移譲', effect: { approvalRating: 8, gdp: 5, technology: 3 } },
          { text: '官民連携で地方創生プロジェクト', effect: { approvalRating: 6, gdp: 8, stockPrice: 200 } },
        ]
      },
      {
        id: `fallback_future_${timestamp}_${randomId}`,
        title: '🚀 未来への政策転換',
        description: 'これまでの政策経験を踏まえ、新たな時代に向けた政策転換が求められています。総理の決断が日本の未来を左右します。',
        options: [
          { text: '次世代技術への大胆な投資', effect: { approvalRating: 8, technology: 15, nationalDebt: 100, stockPrice: 400 } },
          { text: '持続可能な社会システム構築', effect: { approvalRating: 12, environment: 12, nationalDebt: 80, gdp: 5 } },
          { text: '国際協調による課題解決', effect: { approvalRating: 6, diplomacy: 12, gdp: 3, technology: 5 } },
        ]
      }
    ];
    
    const selected = fallbackEvents[Math.floor(Math.random() * fallbackEvents.length)];
    console.log('✅ フォールバックイベント選択:', selected.id, selected.title);
    
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
  const [eventGenerator] = useState(() => new EventGenerator(aiProvider, true, false)); // 静的設問有効、AI拡張機能無効（一時的）
  const [rankingSystem] = useState(() => new RankingSystem());
  const [currentProvider, setCurrentProvider] = useState<AIProvider>('fallback');
  const [showProviderSettings, setShowProviderSettings] = useState(false);
  const [isAnalyzingPolicy, setIsAnalyzingPolicy] = useState(false);
  const [isGeneratingEvent, setIsGeneratingEvent] = useState(false);
  
  // ランキング関連の状態は削除済み

  // ツンデレAI政治秘書KASUMIの分析コメント（AI API使用）
  const getAISecretaryAnalysis = async (effect: PolicyEffect, policyChoice: string): Promise<string> => {
    try {
      const startTime = performance.now();
      // AIプロバイダーマネージャー経由でツンデレコメントを生成
      const comment = await aiProvider.generateTsundereComment(gameState, policyChoice, effect);
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      const providerName = aiProvider.getProviderConfigs()[currentProvider].displayName;

      // AI情報を含むコメントを返す
      return `${comment}\n\n<small style="color: #64748b; font-size: 0.75rem;">🤖 AI秘書 (${providerName}) | ⚡ ${responseTime}ms</small>`;
    } catch (error) {
      return `${getAISecretaryAnalysisFallback(effect, policyChoice)}\n\n<small style="color: #64748b; font-size: 0.75rem;">🤖 フォールバック | ⚡ 0ms</small>`;
    }
  };

  // フォールバック版のツンデレ分析
  const getAISecretaryAnalysisFallback = (effect: PolicyEffect, policyChoice: string): string => {
    const approvalChange = effect.approvalRating || 0;
    const gdpChange = effect.gdp || 0;
    const stockChange = effect.stockPrice || 0;
    const diplomacyChange = effect.diplomacy || 0;
    const nationalDebtChange = effect.nationalDebt || 0;
    const technologyChange = effect.technology || 0;
    const environmentChange = effect.environment || 0;
    
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
    
    // 政策内容に応じたツンデレコメント
    if (policyChoice.includes('予算') || policyChoice.includes('投資')) {
      if (nationalDebtChange > 50) {
        return 'もう！また国債発行するの？財政赤字が心配になるじゃない...でも、国民のためだから仕方ないのかしら。私が家計簿つけてあげるから、ちゃんと管理してよね？';
      } else if (nationalDebtChange < -30) {
        return 'あら、財政健全化を意識してるのね！え、えーと...ちゃんと分析してたのよ、総理の判断！...さすがね。私も見直したわ。';
      }
    }

    if (policyChoice.includes('外交') || policyChoice.includes('国際')) {
      if (diplomacyChange > 5) {
        return '外交成果が出てるじゃない！国際社会での総理の評価が上がってるのよ？...ま、まあ当然よね。私がアドバイスしてるんだから！でも...ちょっと誇らしいかも。';
      } else if (diplomacyChange < -5) {
        return '外交関係が少し悪化したみたい...。でも大丈夫よ！総理の人柄なら、きっと修復できるから。私も一緒に頑張るわ！...べ、別に心配してるわけじゃないのよ？';
      }
    }

    if (policyChoice.includes('環境') || policyChoice.includes('気候')) {
      if (environmentChange > 8) {
        return 'すごい！環境対策がこんなに評価されるなんて...！総理、未来への投資をちゃんと考えてたのね。私も地球のこと、すごく心配だったのよ...ありがとう。';
      } else if (environmentChange < -8) {
        return '環境に悪影響が出ちゃった...。でも経済も大切だし、難しい判断よね。次は環境にも配慮した政策を考えましょ？私が一緒に知恵を絞ってあげる！';
      }
    }

    // デフォルトのツンデレコメント
    const defaultTsundereComments = [
      'まあ、普通の判断ね。総理らしいといえばらしいかも...。でも次はもっと大胆でもいいのよ？',
      'この政策の効果、どうなるかしら...。まあ、総理が決めたなら仕方ないわね。私は付いていくから。',
      '慎重な判断ね。でも、もう少し私の分析を信頼してもいいのよ？...べ、別に構ってほしいわけじゃないんだから！',
      '総理の考えはよくわからないけど...まあ、ついていくわ。私が総理を支えてあげるんだから！',
      'この選択、国民はどう思うかしら...。でも総理が決めたなら、私が全力でサポートするから安心して。',
      'ふーん、そういう政策ね。まあ悪くないんじゃない？...ちょっとだけ評価してあげる。',
      'もう、総理ったら心配させないでよ！でも...この判断、嫌いじゃないわ。',
      '今回の政策、私の予想とちょっと違ったけど...面白い発想ね。総理らしいわ！',
      'データ分析の結果では...まあ、悪くない判断よ。私の計算が正しければ、きっと上手くいくはず！',
      'こういう決断をする時の総理、ちょっとかっこいいかも...。あ、別に見とれてたわけじゃないのよ！',
      '政治って本当に複雑よね...。でも総理と一緒なら、どんな課題も乗り越えられる気がするの。',
      '総理の政治理念、少しずつわかってきたかも...。私も総理について勉強しなくちゃね！'
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

    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });

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
            nationalDebt: next.nationalDebt,
            technology: next.technology,
            environment: next.environment,
            stockPrice: next.stockPrice,
            usdJpyRate: next.usdJpyRate,
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
        
        // 使用済みイベントIDを確実に更新（重複防止強化）
        if (currentEventId && !next.usedEventIds.includes(currentEventId)) {
          next.usedEventIds = [...next.usedEventIds, currentEventId];
          console.log('✅ イベントID追加:', currentEventId);
          console.log('📝 現在の使用済みID:', next.usedEventIds);
          console.log(`📊 進捗: ${next.usedEventIds.length}/${eventTemplates.length} イベント使用済み`);
        } else if (currentEventId) {
          console.warn('⚠️ 重複イベント検出:', currentEventId);
          console.log('🔍 既存の使用済みID:', next.usedEventIds);
        }
        
        // 政治トレンド分析を更新
        next.politicalTrends = analyzePoliticalTrends(next);
        
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
      
      // AI駆動の専門的政治分析コメント
      setGameState(prevState => ({ ...prevState, isAIThinking: true, kasumiDisplayMessage: 'AI秘書KASUMIが政治情勢を分析中...' }));
      
      getAISecretaryAnalysis(analysisResult.effects, option.text).then(analysisMessage => {
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
      
      // 政策効果表示モードに移行（次のイベントは手動で進むまで生成しない）
      setIsProcessing(false);
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
              nationalDebt: next.nationalDebt,
              technology: next.technology,
              environment: next.environment,
              stockPrice: next.stockPrice,
              usdJpyRate: next.usdJpyRate,
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
          
          // 使用済みイベントIDを確実に更新（フォールバック時も重複防止）
          if (currentEventId && !next.usedEventIds.includes(currentEventId)) {
            next.usedEventIds = [...next.usedEventIds, currentEventId];
            console.log('✅ フォールバック時イベントID追加:', currentEventId);
            console.log('📝 現在の使用済みID:', next.usedEventIds);
            console.log(`📊 進捗: ${next.usedEventIds.length}/${eventTemplates.length} イベント使用済み`);
          } else if (currentEventId) {
            console.warn('⚠️ フォールバック時重複イベント検出:', currentEventId);
            console.log('🔍 既存の使用済みID:', next.usedEventIds);
          }
          
          // 政治トレンド分析を更新
          next.politicalTrends = analyzePoliticalTrends(next);
          
          // フォールバック時のAI分析コメント
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
        
        // 政策効果表示モードに移行（次のイベントは手動で進むまで生成しない）
        setIsProcessing(false);
      }, 800);
    }
  };

  // AI駆動カスタム政策分析・評価システム
  const handleCustomPolicy = async () => {
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
    
    setIsProcessing(true);
    setIsAnalyzingPolicy(true);
    
    try {
      // AI政策効果分析を実行
      const policyContext: PolicyContext = {
        eventTitle: gameState.currentEvent?.title || '独自政策提案',
        eventDescription: gameState.currentEvent?.description || '総理大臣による独自政策の提案',
        policyChoice: sanitizedPolicy,
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

      console.log('🔍 独自政策AI分析開始:', sanitizedPolicy);
      const analysisResult = await policyAnalyzer.analyzePolicyEffects(policyContext);
      console.log('✅ 独自政策AI分析完了:', analysisResult);
      
      setIsAnalyzingPolicy(false);

      // AI分析結果を基にした政策オプションを作成
      const customOption: PolicyOption = {
        text: `【独自政策】${sanitizedPolicy}`,
        effect: {
          ...analysisResult.effects,
          aiAnalysis: analysisResult
        }
      };
      
      // KASUMIに独自政策の分析結果を通知
      setTimeout(() => {
        const customPolicyMessages = [
          `わあ！総理の独自政策「${sanitizedPolicy.slice(0, 20)}...」、面白いアイデアね！私の分析では${analysisResult.confidence}%の信頼度よ。`,
          `総理の独自提案、なかなか興味深いじゃない！「${sanitizedPolicy.slice(0, 20)}...」って発想、私も気に入ったわ。`,
          `おお！総理が独自政策を考えたのね！「${sanitizedPolicy.slice(0, 20)}...」...うん、これは${analysisResult.confidence > 70 ? '良い' : '面白い'}政策かも！`,
          `総理の独自アイデア「${sanitizedPolicy.slice(0, 20)}...」、分析してみたけど...${analysisResult.confidence > 80 ? 'すごく良い' : analysisResult.confidence > 60 ? 'なかなか良い' : '面白い'}政策ね！`,
          `わー！総理が自分で政策を考えたのね！「${sanitizedPolicy.slice(0, 20)}...」って...私の分析だと${analysisResult.timeframe === 'immediate' ? '即効性がある' : analysisResult.timeframe === 'short_term' ? '短期的に効果的' : '長期的に有効'}な政策よ！`
        ];
        const randomMessage = customPolicyMessages[Math.floor(Math.random() * customPolicyMessages.length)];
        
        displayMessage(randomMessage);
      }, 1000);
      
      handlePolicyChoice(customOption);
      setCustomPolicy('');
      
    } catch (error) {
      console.error('❌ 独自政策AI分析エラー:', error);
      setIsAnalyzingPolicy(false);
      
      // エラー時はフォールバック分析を使用
      const fallbackEffect = generateFallbackCustomPolicyEffect(sanitizedPolicy);
      const customOption: PolicyOption = {
        text: `【独自政策】${sanitizedPolicy}`,
        effect: fallbackEffect
      };
      
      // フォールバック時のKASUMIメッセージ
      setTimeout(() => {
        displayMessage(`総理の独自政策「${sanitizedPolicy.slice(0, 20)}...」、AIシステムに問題があったけど、私なりに分析してみたわ！きっと面白い結果になるはず！`);
      }, 1000);
      
      handlePolicyChoice(customOption);
      setCustomPolicy('');
    }
    
    setIsProcessing(false);
  };

  // フォールバック用のカスタム政策効果生成
  const generateFallbackCustomPolicyEffect = (policyText: string): PolicyEffect => {
    // 政策内容のキーワード分析による効果推定
    const text = policyText.toLowerCase();
    
    let effects = {
      approvalRating: 0,
      gdp: 0,
      nationalDebt: 0,
      technology: 0,
      environment: 0,
      stockPrice: 0,
      usdJpyRate: 0,
      diplomacy: 0,
    };
    
    // 経済関連キーワード
    if (text.includes('経済') || text.includes('GDP') || text.includes('成長') || text.includes('投資') || text.includes('予算')) {
      effects.gdp += Math.floor(Math.random() * 16) + 5;
      effects.stockPrice += Math.floor(Math.random() * 601) + 200;
      effects.nationalDebt += Math.floor(Math.random() * 61) + 30;
      effects.approvalRating += Math.floor(Math.random() * 11) + 3;
    }
    
    // 社会保障・福祉関連
    if (text.includes('社会保障') || text.includes('年金') || text.includes('医療') || text.includes('福祉') || text.includes('子育て')) {
      effects.approvalRating += Math.floor(Math.random() * 16) + 8;
      effects.nationalDebt += Math.floor(Math.random() * 81) + 40;
      effects.gdp += Math.floor(Math.random() * 8) + 2;
    }
    
    // 環境・エネルギー関連
    if (text.includes('環境') || text.includes('脱炭素') || text.includes('再生可能') || text.includes('エネルギー') || text.includes('温暖化')) {
      effects.environment += Math.floor(Math.random() * 16) + 8;
      effects.technology += Math.floor(Math.random() * 11) + 5;
      effects.nationalDebt += Math.floor(Math.random() * 71) + 35;
      effects.approvalRating += Math.floor(Math.random() * 11) + 5;
    }
    
    // 技術・デジタル関連
    if (text.includes('AI') || text.includes('デジタル') || text.includes('技術') || text.includes('イノベーション') || text.includes('DX')) {
      effects.technology += Math.floor(Math.random() * 21) + 10;
      effects.gdp += Math.floor(Math.random() * 11) + 5;
      effects.stockPrice += Math.floor(Math.random() * 501) + 250;
      effects.approvalRating += Math.floor(Math.random() * 8) + 4;
    }
    
    // 外交・国際関係
    if (text.includes('外交') || text.includes('国際') || text.includes('同盟') || text.includes('平和') || text.includes('協力')) {
      effects.diplomacy += Math.floor(Math.random() * 16) + 8;
      effects.approvalRating += Math.floor(Math.random() * 11) + 5;
      effects.gdp += Math.floor(Math.random() * 8) + 2;
    }
    
    // 教育関連
    if (text.includes('教育') || text.includes('学校') || text.includes('大学') || text.includes('研究') || text.includes('人材')) {
      effects.technology += Math.floor(Math.random() * 11) + 5;
      effects.approvalRating += Math.floor(Math.random() * 11) + 6;
      effects.nationalDebt += Math.floor(Math.random() * 51) + 25;
    }
    
    // 減税・規制緩和関連
    if (text.includes('減税') || text.includes('規制緩和') || text.includes('自由化') || text.includes('民営化')) {
      effects.gdp += Math.floor(Math.random() * 11) + 5;
      effects.stockPrice += Math.floor(Math.random() * 401) + 200;
      effects.nationalDebt -= Math.floor(Math.random() * 31) + 10;
      effects.approvalRating += Math.floor(Math.random() * 8) + 2;
    }
    
    // ネガティブな内容の場合
    if (text.includes('増税') || text.includes('削減') || text.includes('廃止') || text.includes('規制強化')) {
      effects.approvalRating -= Math.floor(Math.random() * 11) + 5;
      effects.gdp -= Math.floor(Math.random() * 8) + 2;
      effects.stockPrice -= Math.floor(Math.random() * 301) + 100;
    }
    
    // 基本的なランダム要素を追加（効果が0の場合）
    Object.keys(effects).forEach(key => {
      if (effects[key as keyof typeof effects] === 0) {
        effects[key as keyof typeof effects] = Math.floor(Math.random() * 11) - 5;
      }
    });
    
    return effects;
  };

  // 効果詳細を閉じる
  const closeEffectDetails = () => {
    setGameState(prev => ({ ...prev, showEffectDetails: false, lastEffect: null }));
  };

  // 次の政策に進む
  const proceedToNextPolicy = async () => {
    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 効果詳細を閉じる
    setGameState(prev => ({ ...prev, showEffectDetails: false, lastEffect: null }));

    // ゲーム終了チェック
    if (gameState.turn > gameState.maxTurns) {
      return; // 既にゲーム終了している場合は何もしない
    }

    // 次のイベントを生成
    setIsGeneratingEvent(true);
    try {
      const nextEvent = await generateAIEvent();
      setGameState(prev => ({ ...prev, currentEvent: nextEvent }));
    } catch (error) {
      console.error('❌ 次イベント生成エラー:', error);
      const fallbackEvent = getRandomEvent();
      setGameState(prev => ({ ...prev, currentEvent: fallbackEvent }));
    } finally {
      setIsGeneratingEvent(false);
    }
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
      const startTime = performance.now();
      const comment = generateTsundereFinalComment(rankData);
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      return `${comment}\n\n<small style="color: #64748b; font-size: 0.75rem;">🤖 AI総括評価 (フォールバック) | ⚡ ${responseTime}ms</small>`;

    } catch (error) {
      return `${generateTsundereFinalComment(rankData)}\n\n<small style="color: #64748b; font-size: 0.75rem;">🤖 AI総括評価 (フォールバック) | ⚡ 0ms</small>`;
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
      try {
        console.log('🔄 AIプロバイダー初期化開始...');
        await aiProvider.recheckProviders();
        const provider = aiProvider.getCurrentProvider();
        setCurrentProvider(provider);
        console.log('✅ AIプロバイダー初期化完了:', provider);
      } catch (error) {
        console.error('❌ AIプロバイダー初期化エラー:', error);
        // エラーが発生してもフォールバックプロバイダーを設定
        setCurrentProvider('fallback');
      }
    };
    initProvider();
  }, [aiProvider]);

  // ランキング関連の機能は削除済み

  // handleRegisterRanking関数は削除済み

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
                <div className="text-gray-200 leading-relaxed"
                     dangerouslySetInnerHTML={{ __html: (gameState.kasumiDisplayMessage || secretaryComment || '総括評価を準備中です...').replace(/\n/g, '<br/>') + (gameState.isTyping ? '<span class="animate-pulse">|</span>' : '') }} />
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
                onClick={resetGame}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-lg text-white font-bold shadow-lg transition-all duration-200 hover:scale-105"
              >
                🔄 新しいゲーム
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

  // ランキング表示モーダルは削除済み

  // ランキング登録モーダルは削除済み

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
                <div className="bg-blue-700 rounded p-2 text-center relative">
                  <div className="text-xs text-gray-300">支持率</div>
                  <div className="text-lg font-bold">{gameState.approvalRating}%</div>
                  {gameState.turn > 1 && gameState.historyData.length > 0 && (() => {
                    const prevValue = gameState.historyData[gameState.historyData.length - 1]?.approvalRating || gameState.approvalRating;
                    const change = gameState.approvalRating - prevValue;
                    return change !== 0 ? (
                      <div className={`text-xs font-bold ${change > 0 ? 'text-green-200' : 'text-red-200'} bg-black/20 rounded px-1 mt-1`}>
                        {change > 0 ? '📈' : '📉'} {change > 0 ? '+' : ''}{change}%
                      </div>
                    ) : null;
                  })()}
                </div>
                <div className="bg-green-700 rounded p-2 text-center relative">
                  <div className="text-xs text-gray-300">GDP</div>
                  <div className="text-lg font-bold">{gameState.gdp}兆</div>
                  {gameState.turn > 1 && gameState.historyData.length > 0 && (() => {
                    const prevValue = gameState.historyData[gameState.historyData.length - 1]?.gdp || gameState.gdp;
                    const change = gameState.gdp - prevValue;
                    return change !== 0 ? (
                      <div className={`text-xs font-bold ${change > 0 ? 'text-green-200' : 'text-red-200'} bg-black/20 rounded px-1 mt-1`}>
                        {change > 0 ? '📈' : '📉'} {change > 0 ? '+' : ''}{change}兆
                      </div>
                    ) : null;
                  })()}
                </div>
                <div className="bg-red-700 rounded p-2 text-center relative">
                  <div className="text-xs text-gray-300">国債</div>
                  <div className="text-lg font-bold">{gameState.nationalDebt}兆</div>
                  {gameState.turn > 1 && gameState.historyData.length > 0 && (() => {
                    const prevValue = gameState.historyData[gameState.historyData.length - 1]?.nationalDebt || gameState.nationalDebt;
                    const change = gameState.nationalDebt - prevValue;
                    return change !== 0 ? (
                      <div className={`text-xs font-bold ${change > 0 ? 'text-red-200' : 'text-green-200'} bg-black/20 rounded px-1 mt-1`}>
                        {change > 0 ? '📈' : '📉'} {change > 0 ? '+' : ''}{change}兆
                      </div>
                    ) : null;
                  })()}
                </div>
                <div className="bg-purple-700 rounded p-2 text-center relative">
                  <div className="text-xs text-gray-300">外交</div>
                  <div className="text-lg font-bold">{gameState.diplomacy}%</div>
                  {gameState.turn > 1 && gameState.historyData.length > 0 && (() => {
                    const prevValue = gameState.historyData[gameState.historyData.length - 1]?.diplomacy || gameState.diplomacy;
                    const change = gameState.diplomacy - prevValue;
                    return change !== 0 ? (
                      <div className={`text-xs font-bold ${change > 0 ? 'text-green-200' : 'text-red-200'} bg-black/20 rounded px-1 mt-1`}>
                        {change > 0 ? '📈' : '📉'} {change > 0 ? '+' : ''}{change}%
                      </div>
                    ) : null;
                  })()}
                </div>
                <div className="bg-yellow-700 rounded p-2 text-center relative">
                  <div className="text-xs text-gray-300">技術</div>
                  <div className="text-lg font-bold">{gameState.technology}%</div>
                  {gameState.turn > 1 && gameState.historyData.length > 0 && (() => {
                    const prevValue = gameState.historyData[gameState.historyData.length - 1]?.technology || gameState.technology;
                    const change = gameState.technology - prevValue;
                    return change !== 0 ? (
                      <div className={`text-xs font-bold ${change > 0 ? 'text-green-200' : 'text-red-200'} bg-black/20 rounded px-1 mt-1`}>
                        {change > 0 ? '📈' : '📉'} {change > 0 ? '+' : ''}{change}%
                      </div>
                    ) : null;
                  })()}
                </div>
                <div className="bg-emerald-700 rounded p-2 text-center relative">
                  <div className="text-xs text-gray-300">環境</div>
                  <div className="text-lg font-bold">{gameState.environment}%</div>
                  {gameState.turn > 1 && gameState.historyData.length > 0 && (() => {
                    const prevValue = gameState.historyData[gameState.historyData.length - 1]?.environment || gameState.environment;
                    const change = gameState.environment - prevValue;
                    return change !== 0 ? (
                      <div className={`text-xs font-bold ${change > 0 ? 'text-green-200' : 'text-red-200'} bg-black/20 rounded px-1 mt-1`}>
                        {change > 0 ? '📈' : '📉'} {change > 0 ? '+' : ''}{change}%
                      </div>
                    ) : null;
                  })()}
                </div>
                <div className="bg-indigo-700 rounded p-2 text-center relative">
                  <div className="text-xs text-gray-300">日経</div>
                  <div className="text-sm font-bold">{Math.round(gameState.stockPrice/1000)}k</div>
                  {gameState.turn > 1 && gameState.historyData.length > 0 && (() => {
                    const prevValue = gameState.historyData[gameState.historyData.length - 1]?.stockPrice || gameState.stockPrice;
                    const change = gameState.stockPrice - prevValue;
                    return change !== 0 ? (
                      <div className={`text-xs font-bold ${change > 0 ? 'text-green-200' : 'text-red-200'} bg-black/20 rounded px-1 mt-1`}>
                        {change > 0 ? '📈' : '📉'} {change > 0 ? '+' : ''}{Math.round(change/1000)}k
                      </div>
                    ) : null;
                  })()}
                </div>
                <div className="bg-orange-700 rounded p-2 text-center relative">
                  <div className="text-xs text-gray-300">ドル円</div>
                  <div className="text-lg font-bold">{gameState.usdJpyRate}</div>
                  {gameState.turn > 1 && gameState.historyData.length > 0 && (() => {
                    const prevValue = gameState.historyData[gameState.historyData.length - 1]?.usdJpyRate || gameState.usdJpyRate;
                    const change = gameState.usdJpyRate - prevValue;
                    return change !== 0 ? (
                      <div className={`text-xs font-bold ${change > 0 ? 'text-red-200' : 'text-green-200'} bg-black/20 rounded px-1 mt-1`}>
                        {change > 0 ? '📈' : '📉'} {change > 0 ? '+' : ''}{change}
                      </div>
                    ) : null;
                  })()}
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
                  <div className="text-sm text-white leading-relaxed whitespace-pre-wrap"
                       dangerouslySetInnerHTML={{ __html: (gameState.kasumiDisplayMessage || gameState.kasumiMessage || '').replace(/\n/g, '<br/>') }} />
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
                  <p className="mb-4 text-gray-300 text-sm leading-relaxed"
                     dangerouslySetInnerHTML={{ __html: gameState.currentEvent.description.replace(/\n/g, '<br/>') }} />
                </>
              ) : null}
              
              {!isGeneratingEvent && gameState.currentEvent && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {gameState.currentEvent.options.map((opt, idx) => {
                    // 政治的立場に応じた色分け
                    const getStanceColor = (index: number) => {
                      const colors = [
                        'bg-red-600 hover:bg-red-700',      // 右派・保守
                        'bg-blue-600 hover:bg-blue-700',    // 左派・リベラル
                        'bg-gray-600 hover:bg-gray-700',    // 中道・穏健
                        'bg-orange-600 hover:bg-orange-700', // ポピュリスト
                        'bg-purple-600 hover:bg-purple-700', // テクノクラート
                        'bg-yellow-600 hover:bg-yellow-700', // ナショナリスト
                        'bg-green-600 hover:bg-green-700',   // プラグマティスト
                        'bg-pink-600 hover:bg-pink-700',     // 極端派・急進
                        'bg-cyan-600 hover:bg-cyan-700',     // 国際協調派
                        'bg-indigo-600 hover:bg-indigo-700'  // 地方分権派
                      ];
                      return colors[index] || 'bg-indigo-600 hover:bg-indigo-700';
                    };

                    const getStanceLabel = (index: number) => {
                      const labels = [
                        '🏛️ 保守', '🌹 リベラル', '⚖️ 中道', '📢 ポピュリスト', '🔬 テクノクラート',
                        '🇯🇵 ナショナリスト', '🎯 プラグマティスト', '⚡ 急進派', '🌍 国際協調', '🏘️ 地方分権'
                      ];
                      return labels[index] || '📋 その他';
                    };

                    return (
                      <button
                        key={idx}
                        onClick={() => handlePolicyChoice(opt)}
                        disabled={isProcessing}
                        className={`w-full text-left px-3 py-3 ${getStanceColor(idx)} rounded-lg text-sm disabled:opacity-50 transition-all duration-200 border border-opacity-30 hover:border-opacity-60 border-white`}
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold opacity-80">
                              {getStanceLabel(idx)}
                            </span>
                            {isProcessing && isAnalyzingPolicy && (
                              <span className="text-xs text-cyan-300 animate-pulse">
                                🤖 AI分析中...
                              </span>
                            )}
                          </div>
                          <span className="text-sm leading-tight">{opt.text}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* AI駆動カスタム政策入力 */}
              {!isGeneratingEvent && gameState.currentEvent && (
                <div className="mt-4 border-t border-gray-600 pt-3">
                  <div className="mb-2 text-xs text-gray-400">
                    💡 独自政策を提案してください（AI分析により効果を自動計算）
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="例：AI技術を活用した行政効率化、子育て支援の拡充、脱炭素社会の推進..."
                      value={customPolicy}
                      onChange={e => setCustomPolicy(e.target.value)}
                      disabled={isProcessing || isAnalyzingPolicy}
                      className="flex-1 px-3 py-2 rounded text-black text-sm disabled:opacity-50"
                      maxLength={200}
                    />
                    <button
                      onClick={handleCustomPolicy}
                      disabled={isProcessing || !customPolicy.trim() || isAnalyzingPolicy}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {isAnalyzingPolicy ? (
                        <div className="flex items-center gap-1">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          <span>AI分析中</span>
                        </div>
                      ) : (
                        '🚀 提案'
                      )}
                    </button>
                  </div>
                  {isAnalyzingPolicy && (
                    <div className="mt-2 text-xs text-cyan-300 flex items-center gap-1">
                      <div className="animate-pulse">🤖</div>
                      <span>AI政策アナリストが効果を分析中...</span>
                    </div>
                  )}
                  <div className="mt-1 text-xs text-gray-500">
                    文字数: {customPolicy.length}/200
                  </div>
                </div>
              )}
            </div>

            {/* 政策効果の詳細表示 */}
            {gameState.showEffectDetails && gameState.lastEffect && (
              <div className="bg-cyan-900 rounded-lg p-4 border-2 border-cyan-500">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-semibold text-cyan-300">📊 政策効果</h4>
                  {(gameState.isGameOver || gameState.turn > gameState.maxTurns) && (
                    <button
                      onClick={() => setGameState(prev => ({ ...prev, isGameOver: true }))}
                      className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-white text-sm font-medium"
                    >
                      🏆 結果発表
                    </button>
                  )}
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
                        <span className="text-cyan-300">
                          {gameState.gameLog[gameState.gameLog.length - 1]?.choice.includes('【独自政策】') ? '🚀 独自政策AI分析:' : '🤖 AI分析:'}
                        </span>
                        <span className="text-xs bg-cyan-800 px-2 py-1 rounded">
                          信頼度 {gameState.lastEffect.aiAnalysis.confidence}%
                        </span>
                        <span className="text-xs bg-purple-800 px-2 py-1 rounded">
                          {aiProvider.getProviderConfigs()[currentProvider].displayName}
                        </span>
                        {gameState.gameLog[gameState.gameLog.length - 1]?.choice.includes('【独自政策】') && (
                          <span className="text-xs bg-yellow-600 px-2 py-1 rounded">
                            カスタム分析
                          </span>
                        )}
                      </div>
                      <p className="text-gray-200 text-xs leading-relaxed">
                        {gameState.lastEffect.aiAnalysis.reasoning}
                      </p>
                      
                      {gameState.gameLog[gameState.gameLog.length - 1]?.choice.includes('【独自政策】') && (
                        <div className="mt-2 p-2 bg-yellow-900/30 rounded border border-yellow-600/30">
                          <div className="text-xs text-yellow-200 font-medium mb-1">
                            💡 独自政策評価
                          </div>
                          <div className="text-xs text-gray-300">
                            この政策は{gameState.lastEffect.aiAnalysis.timeframe === 'immediate' ? '即座に' : 
                                      gameState.lastEffect.aiAnalysis.timeframe === 'short_term' ? '短期的に' : '長期的に'}効果を発揮すると予測されます。
                            AI分析により、現在の政治状況に適した効果を算出しました。
                          </div>
                        </div>
                      )}
                      
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

            {/* 政策効果確認後の次進行メッセージ */}
            {gameState.showEffectDetails && !isGeneratingEvent && !gameState.currentEvent && !gameState.isGameOver && gameState.turn <= gameState.maxTurns && (
              <div className="bg-green-900 rounded-lg p-4 border-2 border-green-500 mt-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">✅</div>
                  <h3 className="text-xl font-semibold mb-3 text-green-300">次の政治課題の準備ができました</h3>
                  <p className="text-gray-400 text-sm mb-4">政策効果を確認後、下のボタンで次のターンに進んでください</p>
                  <button
                    onClick={proceedToNextPolicy}
                    disabled={isGeneratingEvent}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg text-white font-medium"
                  >
                    {isGeneratingEvent ? '生成中...' : '次の政策に進む →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    
    {/* ランキング関連のモーダルは削除済み */}
    </>
  );
}

export default App;