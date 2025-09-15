// 大学生レベル政治学研究用静的設問データベース
// 100問の学術的設問を体系的に整理

export interface StaticQuestionOption {
  id: string;
  text: string;
  type: 'realistic' | 'humorous' | 'extreme';
  stance: 'conservative' | 'liberal' | 'moderate' | 'progressive' | 'populist' | 'technocratic' | 'centrist';
  expectedEffects: {
    approvalRating: number;
    gdp: number;
    nationalDebt: number;
    technology: number;
    environment: number;
    stockPrice: number;
    usdJpyRate: number;
    diplomacy: number;
  };
  // AI拡張機能で追加される項目
  policyDetails?: {
    implementationSteps?: string;
    budgetEstimate?: string;
    timeframe?: string;
    responsibleMinistry?: string;
  };
  theoreticalJustification?: string;
  academicReferences?: string;
}

export interface StaticQuestion {
  id: string;
  category: string;
  subcategory: string;
  questionNumber: number;
  title: string;
  description: string;
  context?: string;
  options: StaticQuestionOption[];
  academicElements: {
    theoreticalFramework: string;
    comparativeCase: string;
    keyStakeholders: string[];
    evaluationCriteria: string[];
    researchQuestions: string[];
  };
  difficulty: 'basic' | 'intermediate' | 'advanced';
  timeConstraint: string;
  // AI拡張機能で追加される項目
  contextualBackground?: string;
}

// A. 人口・社会保障 (設問1-10)
export const populationSocialSecurityQuestions: StaticQuestion[] = [
  {
    id: "static_population_01",
    category: "人口・社会保障",
    subcategory: "出生率・少子化",
    questionNumber: 1,
    title: "出生率回復のための政策的介入",
    description: "日本の合計特殊出生率（※1）は低下し続けています。出生率回復のためにどのような政策的介入が必要でしょうか。\n\n※1 合計特殊出生率：15～49歳の女性が一生に産む子どもの平均数。",
    options: [
      {
        id: "a", text: "出産・育児費用を完全無償化する。", type: "realistic", stance: "progressive",
        expectedEffects: { approvalRating: 15, gdp: -20, nationalDebt: 120, technology: 2, environment: 0, stockPrice: -200, usdJpyRate: 3, diplomacy: 2 }
      },
      {
        id: "b", text: "保育所を全国どこでも即時利用可能に整備する。", type: "realistic", stance: "progressive",
        expectedEffects: { approvalRating: 18, gdp: -15, nationalDebt: 80, technology: 5, environment: -2, stockPrice: 100, usdJpyRate: 2, diplomacy: 1 }
      },
      {
        id: "c", text: "児童手当を大幅増額し、18歳まで支給する。", type: "realistic", stance: "liberal",
        expectedEffects: { approvalRating: 12, gdp: -10, nationalDebt: 100, technology: 1, environment: 0, stockPrice: 50, usdJpyRate: 2, diplomacy: 0 }
      },
      {
        id: "d", text: "男性の育休取得を義務化する。", type: "realistic", stance: "progressive",
        expectedEffects: { approvalRating: 8, gdp: -5, nationalDebt: 20, technology: 3, environment: 2, stockPrice: -100, usdJpyRate: 1, diplomacy: 4 }
      },
      {
        id: "e", text: "高齢者の資産を子育て世代に移転する税制を導入する。", type: "realistic", stance: "progressive",
        expectedEffects: { approvalRating: -5, gdp: 5, nationalDebt: -30, technology: 1, environment: 0, stockPrice: -400, usdJpyRate: -1, diplomacy: -2 }
      },
      {
        id: "f", text: "移民を受け入れて人口減少を補う。", type: "realistic", stance: "liberal",
        expectedEffects: { approvalRating: -10, gdp: 15, nationalDebt: -20, technology: 8, environment: -1, stockPrice: 300, usdJpyRate: -2, diplomacy: 8 }
      },
      {
        id: "g", text: "出生率1.8達成を国家目標とし、政府が年次評価する。", type: "realistic", stance: "technocratic",
        expectedEffects: { approvalRating: 3, gdp: 2, nationalDebt: 10, technology: 2, environment: 1, stockPrice: 100, usdJpyRate: 0, diplomacy: 1 }
      },
      {
        id: "h", text: "子どもを産んだ家庭に「金の卵カード」を配布する（珍回答）。", type: "humorous", stance: "populist",
        expectedEffects: { approvalRating: 20, gdp: -5, nationalDebt: 30, technology: -2, environment: 0, stockPrice: 200, usdJpyRate: 1, diplomacy: -3 }
      },
      {
        id: "i", text: "全国民に「二人目割引制度」を導入する（珍回答）。", type: "humorous", stance: "populist",
        expectedEffects: { approvalRating: 15, gdp: -8, nationalDebt: 50, technology: -1, environment: 0, stockPrice: 150, usdJpyRate: 1, diplomacy: -2 }
      },
      {
        id: "j", text: "子ども3人以上を義務化する「多産法」を制定する（極端）。", type: "extreme", stance: "conservative",
        expectedEffects: { approvalRating: -25, gdp: -30, nationalDebt: 200, technology: -8, environment: -10, stockPrice: -1000, usdJpyRate: 8, diplomacy: -15 }
      }
    ],
    academicElements: {
      theoreticalFramework: "人口転換理論、福祉国家論、ジェンダー政策学",
      comparativeCase: "フランス・ドイツ・スウェーデンの出生率回復成功事例、韓国・シンガポールの課題",
      keyStakeholders: ["子育て世代", "高齢者", "企業", "地方自治体", "保育・教育機関"],
      evaluationCriteria: ["出生率向上効果", "財政持続可能性", "社会公平性", "労働市場への影響"],
      researchQuestions: ["経済的支援vs社会環境整備のどちらが効果的か？", "ジェンダー平等と出生率向上は両立可能か？"]
    },
    difficulty: "intermediate",
    timeConstraint: "長期的政策（10-20年スパン）"
  },
  // 設問6: 子育て支援における現金給付とサービス給付
  {
    id: "static_population_06",
    category: "人口・社会保障",
    subcategory: "子育て支援",
    questionNumber: 6,
    title: "現金給付とサービス給付の効果比較",
    description: "子育て支援における現金給付とサービス給付（保育・教育無償化）、どちらが有効か。",
    options: [
      {
        id: "a", text: "現金給付を重視する。", type: "realistic", stance: "conservative",
        expectedEffects: { approvalRating: 8, gdp: -5, nationalDebt: 60, technology: 0, environment: 0, stockPrice: 150, usdJpyRate: 1, diplomacy: 0 }
      },
      {
        id: "b", text: "サービス給付を重視する。", type: "realistic", stance: "progressive",
        expectedEffects: { approvalRating: 12, gdp: -10, nationalDebt: 80, technology: 5, environment: 2, stockPrice: 100, usdJpyRate: 1, diplomacy: 2 }
      },
      {
        id: "c", text: "双方をバランスよく配分する。", type: "realistic", stance: "moderate",
        expectedEffects: { approvalRating: 10, gdp: -8, nationalDebt: 70, technology: 3, environment: 1, stockPrice: 120, usdJpyRate: 1, diplomacy: 1 }
      },
      {
        id: "d", text: "地域ごとに選択できる制度にする。", type: "realistic", stance: "centrist",
        expectedEffects: { approvalRating: 6, gdp: -3, nationalDebt: 40, technology: 4, environment: 0, stockPrice: 80, usdJpyRate: 0, diplomacy: 1 }
      },
      {
        id: "e", text: "高所得者への給付は縮小する。", type: "realistic", stance: "progressive",
        expectedEffects: { approvalRating: 2, gdp: -2, nationalDebt: 20, technology: 1, environment: 0, stockPrice: -100, usdJpyRate: 0, diplomacy: -1 }
      },
      {
        id: "f", text: "保育士の待遇改善を前提にサービス給付を拡充する。", type: "realistic", stance: "progressive",
        expectedEffects: { approvalRating: 14, gdp: -12, nationalDebt: 90, technology: 3, environment: 1, stockPrice: 80, usdJpyRate: 2, diplomacy: 1 }
      },
      {
        id: "g", text: "出生時に国が一括で「子ども資金」を給付する。", type: "realistic", stance: "technocratic",
        expectedEffects: { approvalRating: 11, gdp: -15, nationalDebt: 100, technology: 2, environment: 0, stockPrice: 50, usdJpyRate: 2, diplomacy: 0 }
      },
      {
        id: "h", text: "ポイント制の子育て通貨を発行する（珍回答）。", type: "humorous", stance: "populist",
        expectedEffects: { approvalRating: 18, gdp: -8, nationalDebt: 40, technology: -2, environment: 0, stockPrice: 200, usdJpyRate: 1, diplomacy: -3 }
      },
      {
        id: "i", text: "全給付を打ち切り完全自助にする（極端）。", type: "extreme", stance: "conservative",
        expectedEffects: { approvalRating: -20, gdp: 10, nationalDebt: -50, technology: -5, environment: -2, stockPrice: -500, usdJpyRate: -3, diplomacy: -8 }
      },
      {
        id: "j", text: "子どもを持たない人から特別税を徴収する（極端）。", type: "extreme", stance: "conservative",
        expectedEffects: { approvalRating: -15, gdp: 5, nationalDebt: -30, technology: -3, environment: -1, stockPrice: -400, usdJpyRate: -2, diplomacy: -5 }
      }
    ],
    academicElements: {
      theoreticalFramework: "社会政策学、行動経済学、公共選択理論",
      comparativeCase: "フィンランドの現金給付制度、ドイツの保育制度、カナダの子育て税額控除",
      keyStakeholders: ["子育て世代", "保育事業者", "税制担当部署", "地方自治体", "労働組合"],
      evaluationCriteria: ["政策効果測定方法", "行政コスト", "利用者満足度", "労働参加への影響"],
      researchQuestions: ["現金とサービスの最適な組み合わせは？", "地域特性に応じた制度設計は可能か？"]
    },
    difficulty: "intermediate",
    timeConstraint: "中期的制度設計（3-5年）"
  }
];

// 外交・安全保障分野の設問
export const diplomaticSecurityQuestions: StaticQuestion[] = [
  {
    id: "static_diplomatic_21",
    category: "外交・安全保障",
    subcategory: "防衛政策",
    questionNumber: 21,
    title: "日米同盟と自主防衛の戦略選択",
    description: "日本は米国依存（※21）を続けるべきか、自主防衛体制を強化すべきか。\n\n※21 米国依存：日米安保条約に基づき、軍事的に米国に大きく依存する状態。",
    options: [
      {
        id: "a", text: "現状維持で米国依存を続ける。", type: "realistic", stance: "conservative",
        expectedEffects: { approvalRating: 5, gdp: 2, nationalDebt: 10, technology: 1, environment: 0, stockPrice: 100, usdJpyRate: -1, diplomacy: 8 }
      },
      {
        id: "b", text: "自主防衛体制を段階的に強化する。", type: "realistic", stance: "conservative",
        expectedEffects: { approvalRating: -3, gdp: -8, nationalDebt: 80, technology: 8, environment: -2, stockPrice: 200, usdJpyRate: -2, diplomacy: -3 }
      },
      {
        id: "c", text: "日米同盟を基盤にしつつ多国間安全保障に参加する。", type: "realistic", stance: "moderate",
        expectedEffects: { approvalRating: 8, gdp: -3, nationalDebt: 40, technology: 5, environment: 1, stockPrice: 150, usdJpyRate: -1, diplomacy: 12 }
      },
      {
        id: "d", text: "防衛産業の国産化を進める。", type: "realistic", stance: "technocratic",
        expectedEffects: { approvalRating: 6, gdp: -10, nationalDebt: 60, technology: 12, environment: -3, stockPrice: 300, usdJpyRate: -2, diplomacy: 2 }
      },
      {
        id: "e", text: "NATOとの連携を拡大する。", type: "realistic", stance: "liberal",
        expectedEffects: { approvalRating: 4, gdp: -5, nationalDebt: 30, technology: 3, environment: 0, stockPrice: 120, usdJpyRate: -1, diplomacy: 10 }
      },
      {
        id: "f", text: "アジア諸国との安全保障協定を模索する。", type: "realistic", stance: "progressive",
        expectedEffects: { approvalRating: 7, gdp: -2, nationalDebt: 20, technology: 4, environment: 1, stockPrice: 100, usdJpyRate: 0, diplomacy: 15 }
      },
      {
        id: "g", text: "日米地位協定の改定を優先する。", type: "realistic", stance: "progressive",
        expectedEffects: { approvalRating: 12, gdp: 0, nationalDebt: 5, technology: 1, environment: 2, stockPrice: 50, usdJpyRate: 1, diplomacy: -5 }
      },
      {
        id: "h", text: "米国の州になる交渉を開始する（珍回答）。", type: "humorous", stance: "populist",
        expectedEffects: { approvalRating: -30, gdp: 20, nationalDebt: -100, technology: 15, environment: 5, stockPrice: 500, usdJpyRate: -10, diplomacy: -20 }
      },
      {
        id: "i", text: "米国依存を完全廃止して独立防衛のみで生きる（極端）。", type: "extreme", stance: "conservative",
        expectedEffects: { approvalRating: -10, gdp: -25, nationalDebt: 200, technology: 10, environment: -8, stockPrice: -300, usdJpyRate: 5, diplomacy: -15 }
      },
      {
        id: "j", text: "日本を非武装化し防衛は全て国連軍に任せる（極端）。", type: "extreme", stance: "progressive",
        expectedEffects: { approvalRating: -25, gdp: 15, nationalDebt: -80, technology: -10, environment: 8, stockPrice: -500, usdJpyRate: 3, diplomacy: -10 }
      }
    ],
    academicElements: {
      theoreticalFramework: "同盟理論、集団安全保障論、軍事戦略論",
      comparativeCase: "韓国の対米依存、豪州の防衛協力多角化、イスラエルの自主防衛",
      keyStakeholders: ["防衛省", "外務省", "在日米軍", "防衛産業", "周辺国"],
      evaluationCriteria: ["安全保障効果", "コスト効率性", "政治的自立性", "地域安定への貢献"],
      researchQuestions: ["同盟依存と自主防衛の最適バランスは？", "多国間安全保障は有効な選択肢か？"]
    },
    difficulty: "advanced",
    timeConstraint: "長期戦略（15-30年）"
  }
];

// 環境・エネルギー分野の設問
export const environmentEnergyQuestions: StaticQuestion[] = [
  {
    id: "static_environment_31",
    category: "環境・エネルギー",
    subcategory: "原子力政策",
    questionNumber: 31,
    title: "原子力発電の将来方針",
    description: "福島第一原発事故後の日本において、原子力発電をどのように位置づけるべきか。",
    options: [
      {
        id: "a", text: "段階的に原発を廃止する。", type: "realistic", stance: "progressive",
        expectedEffects: { approvalRating: 15, gdp: -15, nationalDebt: 50, technology: -5, environment: 15, stockPrice: -200, usdJpyRate: 3, diplomacy: 5 }
      },
      {
        id: "b", text: "安全性を確認した原発から再稼働する。", type: "realistic", stance: "moderate",
        expectedEffects: { approvalRating: -5, gdp: 10, nationalDebt: -20, technology: 5, environment: -8, stockPrice: 300, usdJpyRate: -2, diplomacy: 2 }
      },
      {
        id: "c", text: "小型モジュール炉（SMR）の開発を推進する。", type: "realistic", stance: "technocratic",
        expectedEffects: { approvalRating: 3, gdp: -8, nationalDebt: 40, technology: 15, environment: -3, stockPrice: 250, usdJpyRate: -1, diplomacy: 8 }
      },
      {
        id: "d", text: "再生可能エネルギーへの全面転換を図る。", type: "realistic", stance: "progressive",
        expectedEffects: { approvalRating: 18, gdp: -20, nationalDebt: 100, technology: 12, environment: 20, stockPrice: 150, usdJpyRate: 4, diplomacy: 12 }
      },
      {
        id: "e", text: "核燃料サイクルを継続する。", type: "realistic", stance: "conservative",
        expectedEffects: { approvalRating: -8, gdp: -12, nationalDebt: 80, technology: 8, environment: -10, stockPrice: 100, usdJpyRate: 1, diplomacy: -3 }
      },
      {
        id: "f", text: "原発輸出を戦略産業として育成する。", type: "realistic", stance: "technocratic",
        expectedEffects: { approvalRating: -10, gdp: 8, nationalDebt: 20, technology: 10, environment: -5, stockPrice: 200, usdJpyRate: -3, diplomacy: -5 }
      },
      {
        id: "g", text: "国際的な廃炉技術センターを設立する。", type: "realistic", stance: "liberal",
        expectedEffects: { approvalRating: 12, gdp: -5, nationalDebt: 30, technology: 12, environment: 8, stockPrice: 100, usdJpyRate: 0, diplomacy: 15 }
      },
      {
        id: "h", text: "原発を「エネルギーの鬼ごっこ」のベース基地にする（珍回答）。", type: "humorous", stance: "populist",
        expectedEffects: { approvalRating: 20, gdp: 0, nationalDebt: 10, technology: -3, environment: -2, stockPrice: 300, usdJpyRate: 0, diplomacy: -5 }
      },
      {
        id: "i", text: "原発を即座に全廃する（極端）。", type: "extreme", stance: "progressive",
        expectedEffects: { approvalRating: 10, gdp: -40, nationalDebt: 150, technology: -15, environment: 25, stockPrice: -800, usdJpyRate: 8, diplomacy: 5 }
      },
      {
        id: "j", text: "原発を大幅に増設し全電力を原子力で賄う（極端）。", type: "extreme", stance: "conservative",
        expectedEffects: { approvalRating: -30, gdp: 30, nationalDebt: 200, technology: 20, environment: -25, stockPrice: 500, usdJpyRate: -5, diplomacy: -15 }
      }
    ],
    academicElements: {
      theoreticalFramework: "エネルギー安全保障論、環境経済学、リスク管理理論",
      comparativeCase: "ドイツの脱原発政策、フランスの原子力依存、韓国の原発政策見直し",
      keyStakeholders: ["電力会社", "立地自治体", "環境団体", "産業界", "国際原子力機関"],
      evaluationCriteria: ["エネルギー安定供給", "経済性", "安全性", "環境影響", "国際整合性"],
      researchQuestions: ["脱原発と経済成長は両立可能か？", "代替エネルギーの現実的な移行期間は？"]
    },
    difficulty: "advanced",
    timeConstraint: "長期エネルギー戦略（20-50年）"
  }
];

// 設問データをすべて統合したマスター配列
export const allStaticQuestions: StaticQuestion[] = [
  ...populationSocialSecurityQuestions,
  ...diplomaticSecurityQuestions,
  ...environmentEnergyQuestions,
  // 他のカテゴリーも追加予定
];

// カテゴリー別設問取得関数
export function getQuestionsByCategory(category: string): StaticQuestion[] {
  return allStaticQuestions.filter(q => q.category === category);
}

// 難易度別設問取得関数
export function getQuestionsByDifficulty(difficulty: 'basic' | 'intermediate' | 'advanced'): StaticQuestion[] {
  return allStaticQuestions.filter(q => q.difficulty === difficulty);
}

// ランダム設問選択関数
export function getRandomQuestion(): StaticQuestion | null {
  if (allStaticQuestions.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * allStaticQuestions.length);
  return allStaticQuestions[randomIndex];
}

// 特定の設問取得関数
export function getQuestionById(id: string): StaticQuestion | null {
  return allStaticQuestions.find(q => q.id === id) || null;
}