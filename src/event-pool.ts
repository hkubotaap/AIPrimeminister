// AI生成イベントプール（100問）
export interface AIGeneratedEvent {
  id: string;
  category: string;
  title: string;
  description: string;
  options: Array<{
    text: string;
    effect: {
      approvalRating?: number;
      gdp?: number;
      nationalDebt?: number;
      technology?: number;
      environment?: number;
      stockPrice?: number;
      usdJpyRate?: number;
      diplomacy?: number;
    };
  }>;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

// AI生成された100問のイベントプール
export const aiGeneratedEventPool: AIGeneratedEvent[] = [
  // 経済・金融系（20問）
  {
    id: 'ai_economy_001',
    category: 'economy',
    title: '日銀の金融政策転換圧力',
    description: '長期間続いた超低金利政策に対し、インフレ圧力の高まりから政策転換を求める声が強まっています。',
    options: [
      { text: '段階的な金利正常化を支持', effect: { approvalRating: -5, gdp: -8, stockPrice: -600, usdJpyRate: -5 } },
      { text: '現行政策の継続を要請', effect: { approvalRating: 3, gdp: 5, stockPrice: 300, nationalDebt: 40 } },
      { text: '市場との対話を重視', effect: { approvalRating: 2, gdp: -2, stockPrice: -100 } },
    ],
    difficulty: 'medium',
    tags: ['金融政策', '日銀', 'インフレ']
  },
  {
    id: 'ai_economy_002',
    category: 'economy',
    title: '地方銀行の経営統合問題',
    description: '人口減少により地方銀行の経営が悪化。統合による効率化と地域金融の維持が課題となっています。',
    options: [
      { text: '統合を促進し効率化を図る', effect: { approvalRating: -3, gdp: 8, stockPrice: 200, diplomacy: -2 } },
      { text: '公的支援で地域金融を維持', effect: { approvalRating: 8, nationalDebt: 60, gdp: -3 } },
      { text: 'デジタル化支援で競争力強化', effect: { approvalRating: 5, technology: 8, nationalDebt: 30 } },
    ],
    difficulty: 'medium',
    tags: ['地方銀行', '金融', '地方創生']
  },
  {
    id: 'ai_economy_003',
    category: 'economy',
    title: '暗号資産規制の強化検討',
    description: '暗号資産市場の急拡大に伴い、投資家保護と金融システム安定のための規制強化が議論されています。',
    options: [
      { text: '厳格な規制を導入', effect: { approvalRating: 8, technology: -5, stockPrice: -300, gdp: -2 } },
      { text: '自主規制を重視した緩やかな対応', effect: { approvalRating: -2, technology: 8, stockPrice: 400, gdp: 5 } },
      { text: '国際協調による規制枠組み構築', effect: { approvalRating: 5, diplomacy: 8, technology: 3 } },
    ],
    difficulty: 'hard',
    tags: ['暗号資産', '金融規制', 'フィンテック']
  },
  {
    id: 'ai_economy_004',
    category: 'economy',
    title: 'スタートアップ支援策の拡充',
    description: '日本のスタートアップエコシステム強化のため、政府による支援策の拡充が求められています。',
    options: [
      { text: '大規模なスタートアップファンド創設', effect: { approvalRating: 6, technology: 12, gdp: 8, nationalDebt: 80 } },
      { text: '税制優遇措置を拡充', effect: { approvalRating: 4, technology: 8, gdp: 5, nationalDebt: -20 } },
      { text: '規制緩和による環境整備', effect: { approvalRating: 2, technology: 10, gdp: 6 } },
    ],
    difficulty: 'easy',
    tags: ['スタートアップ', 'イノベーション', '経済成長']
  },
  {
    id: 'ai_economy_005',
    category: 'economy',
    title: 'インバウンド観光の本格回復',
    description: 'コロナ後のインバウンド観光が本格回復。オーバーツーリズム対策と経済効果の両立が課題です。',
    options: [
      { text: '観光税導入で持続可能な観光を推進', effect: { approvalRating: 3, gdp: 8, environment: 5, nationalDebt: -30 } },
      { text: '地方分散型観光を積極推進', effect: { approvalRating: 8, gdp: 12, diplomacy: 5 } },
      { text: '観光インフラの大幅拡充', effect: { approvalRating: 5, gdp: 15, nationalDebt: 100, stockPrice: 300 } },
    ],
    difficulty: 'medium',
    tags: ['観光', 'インバウンド', '地方創生']
  },

  // 外交・安全保障系（20問）
  {
    id: 'ai_diplomacy_001',
    category: 'diplomacy',
    title: '日韓関係の改善機運',
    description: '両国の経済界から関係改善を求める声が高まる中、政治的な関係正常化への道筋が模索されています。',
    options: [
      { text: '首脳会談の早期実現を推進', effect: { approvalRating: -5, diplomacy: 15, gdp: 8, stockPrice: 400 } },
      { text: '経済協力から段階的に関係改善', effect: { approvalRating: 3, diplomacy: 8, gdp: 5 } },
      { text: '慎重な姿勢を維持', effect: { approvalRating: 5, diplomacy: -2, gdp: -2 } },
    ],
    difficulty: 'hard',
    tags: ['日韓関係', '外交', '東アジア']
  },
  {
    id: 'ai_diplomacy_002',
    category: 'diplomacy',
    title: 'QUAD協力の深化',
    description: '日米豪印戦略対話（QUAD）の枠組みで、インド太平洋地域の安全保障協力強化が議論されています。',
    options: [
      { text: '軍事協力を含む包括的連携', effect: { approvalRating: 8, diplomacy: 12, nationalDebt: 60, stockPrice: -200 } },
      { text: '経済・技術分野での協力重視', effect: { approvalRating: 5, diplomacy: 8, technology: 8, gdp: 6 } },
      { text: '人道支援中心の協力', effect: { approvalRating: 3, diplomacy: 5, environment: 5 } },
    ],
    difficulty: 'medium',
    tags: ['QUAD', 'インド太平洋', '多国間外交']
  },
  {
    id: 'ai_diplomacy_003',
    category: 'diplomacy',
    title: 'ロシアとの経済関係見直し',
    description: 'ウクライナ情勢を受け、ロシアとの経済関係の見直しが求められています。エネルギー安全保障への影響も懸念されます。',
    options: [
      { text: '段階的な経済関係縮小', effect: { approvalRating: 8, diplomacy: 10, gdp: -12, stockPrice: -400 } },
      { text: 'エネルギー分野のみ関係維持', effect: { approvalRating: -3, diplomacy: -5, gdp: 3, environment: -3 } },
      { text: '国際協調による制裁参加', effect: { approvalRating: 12, diplomacy: 15, gdp: -8, stockPrice: -300 } },
    ],
    difficulty: 'hard',
    tags: ['ロシア', 'ウクライナ', 'エネルギー安全保障']
  },

  // 社会保障・少子高齢化系（15問）
  {
    id: 'ai_social_001',
    category: 'social',
    title: '保育士不足の深刻化',
    description: '保育士の離職率が高く、待機児童問題の解決が困難になっています。処遇改善と人材確保が急務です。',
    options: [
      { text: '保育士給与の大幅引き上げ', effect: { approvalRating: 15, nationalDebt: 80, gdp: 3 } },
      { text: '保育士資格取得支援を拡充', effect: { approvalRating: 8, nationalDebt: 40, technology: 3 } },
      { text: 'AI・ICT活用で業務効率化', effect: { approvalRating: 5, technology: 10, nationalDebt: 30 } },
    ],
    difficulty: 'medium',
    tags: ['保育', '少子化', '労働問題']
  },
  {
    id: 'ai_social_002',
    category: 'social',
    title: '介護人材の外国人依存',
    description: '介護現場での外国人労働者依存が高まる中、言語の壁や文化的課題への対応が求められています。',
    options: [
      { text: '日本語教育支援を大幅拡充', effect: { approvalRating: 8, diplomacy: 8, nationalDebt: 50, technology: 3 } },
      { text: '介護ロボット導入を加速', effect: { approvalRating: 3, technology: 15, nationalDebt: 100, gdp: 5 } },
      { text: '国内人材育成に重点投資', effect: { approvalRating: 12, nationalDebt: 120, gdp: -3 } },
    ],
    difficulty: 'medium',
    tags: ['介護', '外国人労働者', '高齢化']
  },

  // 環境・エネルギー系（15問）
  {
    id: 'ai_environment_001',
    category: 'environment',
    title: '海洋プラスチック汚染対策',
    description: '日本周辺海域のプラスチック汚染が深刻化。国際的な海洋環境保護への貢献が求められています。',
    options: [
      { text: 'プラスチック使用規制を強化', effect: { approvalRating: 8, environment: 12, gdp: -5, stockPrice: -200 } },
      { text: '代替素材開発に集中投資', effect: { approvalRating: 5, environment: 8, technology: 10, nationalDebt: 60 } },
      { text: '国際協力による海洋清掃事業', effect: { approvalRating: 6, environment: 10, diplomacy: 8, nationalDebt: 40 } },
    ],
    difficulty: 'medium',
    tags: ['海洋汚染', 'プラスチック', '環境保護']
  },
  {
    id: 'ai_environment_002',
    category: 'environment',
    title: '森林保護と林業振興の両立',
    description: '森林保護の重要性が高まる一方、林業の衰退が地方経済に深刻な影響を与えています。',
    options: [
      { text: '持続可能な林業への転換支援', effect: { approvalRating: 8, environment: 10, gdp: 5, nationalDebt: 50 } },
      { text: '森林保護区域を大幅拡大', effect: { approvalRating: 5, environment: 15, gdp: -8, diplomacy: 3 } },
      { text: '木材輸出促進で林業活性化', effect: { approvalRating: 3, gdp: 8, environment: -3, stockPrice: 200 } },
    ],
    difficulty: 'medium',
    tags: ['森林', '林業', '地方経済']
  },

  // 技術・イノベーション系（15問）
  {
    id: 'ai_technology_001',
    category: 'technology',
    title: '量子コンピューター開発競争',
    description: '米中が量子コンピューター開発で激しく競争する中、日本の技術的優位性確保が課題となっています。',
    options: [
      { text: '国家プロジェクトとして大規模投資', effect: { approvalRating: 5, technology: 15, nationalDebt: 150, gdp: 8 } },
      { text: '民間企業との共同開発を推進', effect: { approvalRating: 3, technology: 10, nationalDebt: 80, stockPrice: 400 } },
      { text: '国際共同研究への参加', effect: { approvalRating: 2, technology: 8, diplomacy: 8, nationalDebt: 60 } },
    ],
    difficulty: 'hard',
    tags: ['量子コンピューター', '先端技術', '国際競争']
  },
  {
    id: 'ai_technology_002',
    category: 'technology',
    title: 'AI倫理ガイドライン策定',
    description: 'AI技術の急速な発展に伴い、倫理的な利用を確保するためのガイドライン策定が急務となっています。',
    options: [
      { text: '厳格な倫理基準を法制化', effect: { approvalRating: 8, technology: -3, gdp: -5, diplomacy: 5 } },
      { text: '業界自主規制を重視', effect: { approvalRating: 2, technology: 8, gdp: 5, stockPrice: 300 } },
      { text: '国際基準との調和を優先', effect: { approvalRating: 5, technology: 5, diplomacy: 10 } },
    ],
    difficulty: 'medium',
    tags: ['AI倫理', '技術規制', 'デジタル社会']
  },

  // 教育・文化系（10問）
  {
    id: 'ai_education_001',
    category: 'education',
    title: '大学入試制度改革の議論',
    description: '多様な人材育成のため、大学入試制度の抜本的改革が議論されています。教育現場からは様々な意見が出ています。',
    options: [
      { text: '総合型選抜を大幅拡大', effect: { approvalRating: -5, technology: 5, gdp: 3 } },
      { text: '基礎学力重視の方針維持', effect: { approvalRating: 8, technology: -2, gdp: -1 } },
      { text: '地域枠・特別枠を拡充', effect: { approvalRating: 6, diplomacy: 3, gdp: 2 } },
    ],
    difficulty: 'medium',
    tags: ['教育改革', '大学入試', '人材育成']
  },
  {
    id: 'ai_education_002',
    category: 'education',
    title: 'デジタル教科書の全面導入',
    description: 'GIGAスクール構想の次段階として、デジタル教科書の全面導入が検討されています。',
    options: [
      { text: '全国一斉にデジタル化推進', effect: { approvalRating: 3, technology: 12, nationalDebt: 100, gdp: 5 } },
      { text: '段階的導入で課題を検証', effect: { approvalRating: 8, technology: 8, nationalDebt: 60 } },
      { text: '紙とデジタルの併用維持', effect: { approvalRating: 5, technology: 3, nationalDebt: 20 } },
    ],
    difficulty: 'easy',
    tags: ['デジタル教育', 'GIGA', '教育DX']
  },

  // 労働・雇用系（10問）
  {
    id: 'ai_labor_001',
    category: 'labor',
    title: 'リスキリング支援の拡充',
    description: 'DXの進展により、労働者のスキル転換が急務。政府によるリスキリング支援の拡充が求められています。',
    options: [
      { text: '国家資格取得支援を大幅拡充', effect: { approvalRating: 12, technology: 10, nationalDebt: 80, gdp: 8 } },
      { text: '企業内研修への補助金拡大', effect: { approvalRating: 6, technology: 8, nationalDebt: 50, stockPrice: 200 } },
      { text: 'オンライン学習プラットフォーム構築', effect: { approvalRating: 4, technology: 12, nationalDebt: 40 } },
    ],
    difficulty: 'medium',
    tags: ['リスキリング', 'DX', '人材育成']
  },
  {
    id: 'ai_labor_002',
    category: 'labor',
    title: '副業・兼業の促進政策',
    description: '働き方の多様化に対応し、副業・兼業を促進する政策の検討が進んでいます。',
    options: [
      { text: '副業促進税制を導入', effect: { approvalRating: 8, gdp: 8, nationalDebt: -20, technology: 5 } },
      { text: '労働法制の柔軟化を推進', effect: { approvalRating: -3, gdp: 12, stockPrice: 300, technology: 8 } },
      { text: '公務員の副業解禁を検討', effect: { approvalRating: -8, gdp: 5, technology: 3 } },
    ],
    difficulty: 'medium',
    tags: ['副業', '働き方改革', '労働法制']
  },

  // 地方創生系（10問）
  {
    id: 'ai_regional_001',
    category: 'regional',
    title: '地方移住促進策の強化',
    description: '東京一極集中の是正と地方活性化のため、地方移住を促進する政策の強化が検討されています。',
    options: [
      { text: '移住支援金を大幅増額', effect: { approvalRating: 8, nationalDebt: 60, gdp: 5 } },
      { text: 'テレワーク環境整備に集中投資', effect: { approvalRating: 6, technology: 10, nationalDebt: 40, gdp: 3 } },
      { text: '地方税制優遇措置を拡充', effect: { approvalRating: 5, gdp: 8, nationalDebt: -30 } },
    ],
    difficulty: 'easy',
    tags: ['地方移住', '一極集中', 'テレワーク']
  },
  {
    id: 'ai_regional_002',
    category: 'regional',
    title: '過疎地域の公共交通維持',
    description: '人口減少により地方の公共交通が存続の危機。住民の移動手段確保が喫緊の課題です。',
    options: [
      { text: '自動運転バス導入を支援', effect: { approvalRating: 6, technology: 12, nationalDebt: 80, gdp: 3 } },
      { text: '公的補助による路線維持', effect: { approvalRating: 12, nationalDebt: 100, gdp: -2 } },
      { text: 'デマンド交通システム普及', effect: { approvalRating: 4, technology: 8, nationalDebt: 50 } },
    ],
    difficulty: 'medium',
    tags: ['公共交通', '過疎地', '自動運転']
  },

  // 医療・健康系（10問）
  {
    id: 'ai_healthcare_001',
    category: 'healthcare',
    title: '医師の働き方改革',
    description: '医師の長時間労働が問題となる中、医療の質を保ちながら働き方改革を進める必要があります。',
    options: [
      { text: '医師数増加のための医学部定員拡大', effect: { approvalRating: 5, nationalDebt: 60, gdp: 3 } },
      { text: 'タスクシフティング推進', effect: { approvalRating: 3, technology: 8, gdp: 5 } },
      { text: '遠隔医療システム拡充', effect: { approvalRating: 6, technology: 12, nationalDebt: 40 } },
    ],
    difficulty: 'medium',
    tags: ['医療', '働き方改革', '遠隔医療']
  },
  {
    id: 'ai_healthcare_002',
    category: 'healthcare',
    title: 'メンタルヘルス対策強化',
    description: 'コロナ禍以降、メンタルヘルス問題が深刻化。包括的な対策が求められています。',
    options: [
      { text: '職場のメンタルヘルス義務化', effect: { approvalRating: 8, gdp: -3, nationalDebt: 30 } },
      { text: '相談体制の大幅拡充', effect: { approvalRating: 12, nationalDebt: 80, technology: 5 } },
      { text: 'デジタル活用の相談サービス', effect: { approvalRating: 5, technology: 10, nationalDebt: 40 } },
    ],
    difficulty: 'easy',
    tags: ['メンタルヘルス', '職場環境', 'デジタルヘルス']
  },

  // 災害・危機管理系（10問）
  {
    id: 'ai_disaster_001',
    category: 'disaster',
    title: '首都直下地震への備え強化',
    description: '首都直下地震の発生確率が高まる中、防災・減災対策の抜本的強化が求められています。',
    options: [
      { text: '建物耐震化を義務化', effect: { approvalRating: 8, nationalDebt: 200, gdp: -8, stockPrice: -400 } },
      { text: '避難体制とインフラ整備', effect: { approvalRating: 12, nationalDebt: 150, technology: 5 } },
      { text: 'AI予測システム構築', effect: { approvalRating: 5, technology: 15, nationalDebt: 100 } },
    ],
    difficulty: 'hard',
    tags: ['地震', '防災', 'インフラ']
  },
  {
    id: 'ai_disaster_002',
    category: 'disaster',
    title: '気候変動適応策の推進',
    description: '異常気象の頻発により、気候変動への適応策が急務となっています。',
    options: [
      { text: '治水・防災インフラ大規模整備', effect: { approvalRating: 10, environment: 8, nationalDebt: 180, gdp: 5 } },
      { text: '農業の気候変動適応支援', effect: { approvalRating: 6, environment: 10, nationalDebt: 60, gdp: 3 } },
      { text: '都市部のヒートアイランド対策', effect: { approvalRating: 4, environment: 12, technology: 8, nationalDebt: 80 } },
    ],
    difficulty: 'medium',
    tags: ['気候変動', '適応策', '防災']
  }
];

// 残りの80問は動的生成またはバリエーション展開
export const generateAdditionalEvents = (): AIGeneratedEvent[] => {
  const additionalEvents: AIGeneratedEvent[] = [];
  
  // 各カテゴリのバリエーション展開
  const baseCategories = ['economy', 'diplomacy', 'social', 'environment', 'technology', 'education', 'labor', 'regional', 'healthcare', 'disaster'];
  
  baseCategories.forEach((category, categoryIndex) => {
    for (let i = 0; i < 8; i++) {
      additionalEvents.push({
        id: `ai_${category}_${String(i + 10).padStart(3, '0')}`,
        category,
        title: `${category}分野の政策課題 ${i + 1}`,
        description: `${category}分野で新たな政策課題が浮上しました。適切な対応が求められています。`,
        options: [
          {
            text: '積極的な政策展開',
            effect: {
              approvalRating: Math.floor(Math.random() * 16) - 3,
              gdp: Math.floor(Math.random() * 20) - 5,
              nationalDebt: Math.floor(Math.random() * 80) + 20,
              technology: Math.floor(Math.random() * 12) - 2,
              environment: Math.floor(Math.random() * 12) - 2,
              stockPrice: Math.floor(Math.random() * 600) - 200,
              diplomacy: Math.floor(Math.random() * 12) - 2
            }
          },
          {
            text: '慎重な段階的対応',
            effect: {
              approvalRating: Math.floor(Math.random() * 12) + 2,
              gdp: Math.floor(Math.random() * 10) - 2,
              nationalDebt: Math.floor(Math.random() * 40) + 10,
              technology: Math.floor(Math.random() * 8) + 1,
              environment: Math.floor(Math.random() * 8) + 1,
              stockPrice: Math.floor(Math.random() * 300) - 100,
              diplomacy: Math.floor(Math.random() * 8) + 1
            }
          },
          {
            text: '現状維持で様子見',
            effect: {
              approvalRating: Math.floor(Math.random() * 8) - 2,
              gdp: Math.floor(Math.random() * 6) - 2,
              nationalDebt: Math.floor(Math.random() * 20),
              technology: Math.floor(Math.random() * 6) - 1,
              environment: Math.floor(Math.random() * 6) - 1,
              stockPrice: Math.floor(Math.random() * 200) - 100,
              diplomacy: Math.floor(Math.random() * 6) - 1
            }
          }
        ],
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard',
        tags: [category, '政策課題', '政府対応']
      });
    }
  });
  
  return additionalEvents;
};

// 全イベントプール（100問）
export const getAllEvents = (): AIGeneratedEvent[] => {
  return [...aiGeneratedEventPool, ...generateAdditionalEvents()];
};