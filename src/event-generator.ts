// AI駆動イベント生成システム
import { AIProviderManager } from './ai-provider';
import {
  StaticQuestion,
  getRandomQuestion,
  getQuestionsByCategory,
  getQuestionsByDifficulty
} from './static-questions';
import { DataLoader } from './data-loader';

export interface EventGenerationContext {
  currentState: {
    turn: number;
    maxTurns: number;
    approvalRating: number;
    gdp: number;
    nationalDebt: number;
    technology: number;
    environment: number;
    stockPrice: number;
    usdJpyRate: number;
    diplomacy: number;
  };
  politicalTrends: {
    approvalTrend: 'rising' | 'falling' | 'stable';
    economicTrend: 'growth' | 'recession' | 'stable';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  previousEvents: string[];
  previousChoices: string[];
  usedEventIds: string[];
  gamePhase: 'early' | 'middle' | 'late';
  currentSeason: 'spring' | 'summer' | 'autumn' | 'winter';
  globalContext: {
    economicClimate: 'stable' | 'volatile' | 'crisis';
    internationalTensions: 'low' | 'medium' | 'high';
    domesticPressure: 'low' | 'medium' | 'high';
  };
}

export interface GeneratedEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'simple' | 'moderate' | 'complex';
  options: Array<{
    text: string;
    type: 'conservative' | 'progressive' | 'moderate' | 'radical' | 'liberal' | 'nationalist' | 'populist' | 'technocratic' | 'centrist' | 'extremist';
    politicalStance: 'right' | 'left' | 'center' | 'far-right' | 'far-left' | 'liberal' | 'conservative' | 'populist' | 'technocratic' | 'pragmatic';
    policyDetails?: {
      policyName?: string;
      budget?: string;
      duration?: string;
      ministry?: string;
      legalBasis?: string;
      targetMetrics?: string;
    };
    theoreticalJustification?: string;
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
  }>;
  backgroundInfo: string | {
    historicalContext: string;
    currentSituation: string;
    internationalComparison: string;
    theoreticalRelevance?: string;
    stakeholderPositions?: string;
    researchImplications?: string;
  };
  academicElements?: {
    theoreticalFramework: string;
    comparativeCase: string;
    evaluationCriteria: string[];
    researchQuestions: string[];
  };
  stakeholders: string[];
  timeConstraint: string | {
    urgency: string;
    politicalDeadline?: string;
    legislativeSchedule?: string;
    administrativeConstraint?: string;
  };
  aiGenerated: boolean;
  generationReason: string;
}

export class EventGenerator {
  private aiProvider: AIProviderManager;
  private eventHistory: GeneratedEvent[] = [];
  private emergencyEventThreshold = 0.1;
  private useStaticQuestions = true; // 静的設問を使用するかのフラグ
  private staticQuestionProbability = 0.7; // 70%の確率で静的設問を使用
  private usedStaticQuestionIds: Set<string> = new Set(); // 使用済み静的設問ID
  private usedAIEventIds: Set<string> = new Set(); // 使用済みAI生成イベントID
  private maxRetries = 5; // 重複回避の最大再試行回数
  private dataLoader: DataLoader; // AI拡張機能付きデータローダー

  constructor(aiProvider: AIProviderManager, useStaticQuestions = true, enableAIEnhancement = true) {
    this.aiProvider = aiProvider;
    this.useStaticQuestions = useStaticQuestions;

    // DataLoaderを初期化（AI拡張機能付き）
    this.dataLoader = new DataLoader(aiProvider, enableAIEnhancement);

    console.log('📰 AI駆動イベント生成システム初期化（AI拡張機能統合版）');
    console.log(`📚 静的設問使用: ${useStaticQuestions ? 'ON' : 'OFF'}`);
    console.log(`🤖 AI拡張機能: ${enableAIEnhancement ? 'ON' : 'OFF'}`);
    console.log('🔒 重複防止システム: 有効');
  }

  // メインイベント生成関数
  async generateEvent(context: EventGenerationContext): Promise<GeneratedEvent> {
    console.log('🎲 ハイブリッドイベント生成開始');
    console.log('ゲームフェーズ:', context.gamePhase);
    console.log('政治リスクレベル:', context.politicalTrends.riskLevel);

    try {
      // 緊急イベントの判定
      if (this.shouldGenerateEmergencyEvent(context)) {
        console.log('🚨 緊急イベント生成');
        return await this.generateEmergencyEvent(context);
      }

      // 静的設問 vs AI生成の選択
      if (this.useStaticQuestions && Math.random() < this.staticQuestionProbability) {
        console.log('📚 静的設問を使用');
        return await this.generateStaticQuestionEvent(context);
      }

      // AI生成イベント
      console.log('🤖 AI生成イベント使用');
      const currentProvider = this.aiProvider.getCurrentProvider();

      switch (currentProvider) {
        case 'gemini':
          return await this.generateWithGemini(context);
        case 'ollama':
          return await this.generateWithOllama(context);
        default:
          return this.generateFallbackEvent(context);
      }
    } catch (error) {
      console.error('❌ ハイブリッドイベント生成エラー:', error);
      return this.generateFallbackEvent(context);
    }
  }

  // 緊急イベント判定
  private shouldGenerateEmergencyEvent(context: EventGenerationContext): boolean {
    let emergencyProbability = this.emergencyEventThreshold;

    // リスクレベルに応じて確率調整
    switch (context.politicalTrends.riskLevel) {
      case 'critical':
        emergencyProbability = 0.4; // 40%
        break;
      case 'high':
        emergencyProbability = 0.25; // 25%
        break;
      case 'medium':
        emergencyProbability = 0.15; // 15%
        break;
      case 'low':
        emergencyProbability = 0.05; // 5%
        break;
    }

    // 支持率が低い場合は政治的危機の確率上昇
    if (context.currentState.approvalRating < 30) {
      emergencyProbability += 0.1;
    }

    // 経済状況が悪い場合は経済危機の確率上昇
    if (context.politicalTrends.economicTrend === 'recession') {
      emergencyProbability += 0.1;
    }

    // 終盤は重要イベントの確率上昇
    if (context.gamePhase === 'late') {
      emergencyProbability += 0.1;
    }

    return Math.random() < emergencyProbability;
  }

  // 静的設問イベント生成（重複防止機能付き）
  private async generateStaticQuestionEvent(context: EventGenerationContext): Promise<GeneratedEvent> {
    console.log('📚 既存の静的設問システムを使用（一時的）');
    console.log(`🔍 使用済み静的設問数: ${this.usedStaticQuestionIds.size}`);
    console.log(`🔍 外部からの使用済みID: ${context.usedEventIds?.length || 0}`);

    // 外部から渡された使用済みIDも考慮
    const allUsedIds = new Set([
      ...this.usedStaticQuestionIds,
      ...(context.usedEventIds || [])
    ]);

    // DataLoaderから利用可能な設問を取得（重複除外）
    const allQuestions = this.dataLoader.getAllQuestions();
    const availableQuestions = allQuestions.filter(question =>
      !allUsedIds.has(question.id)
    );

    console.log(`📚 総設問数: ${allQuestions.length}`);
    console.log(`✅ 利用可能設問数: ${availableQuestions.length}`);

    if (availableQuestions.length === 0) {
      console.log('⚠️ 未使用の設問がないため、リセットしてから選択');
      this.resetUsedStaticQuestions();

      // リセット後に再度取得
      const resetQuestions = allQuestions.filter(question =>
        !this.usedStaticQuestionIds.has(question.id)
      );

      if (resetQuestions.length === 0) {
        console.log('⚠️ 設問が見つからないため、フォールバックイベントを使用');
        return this.generateFallbackEvent(context);
      }

      // リセット後の利用可能設問から選択
      const randomIndex = Math.floor(Math.random() * resetQuestions.length);
      const selectedQuestion = resetQuestions[randomIndex];

      // 使用済みリストに追加
      this.usedStaticQuestionIds.add(selectedQuestion.id);

      console.log(`📋 リセット後設問選択: ${selectedQuestion.title} (${selectedQuestion.category})`);
      console.log(`📊 使用済み設問数: ${this.usedStaticQuestionIds.size}/${allQuestions.length}`);

      // StaticQuestionをGeneratedEventに変換
      const generatedEvent = this.convertStaticQuestionToGeneratedEvent(selectedQuestion, context);

      // イベント履歴に追加
      this.eventHistory.push(generatedEvent);

      return generatedEvent;
    }

    // 利用可能な設問からランダム選択
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const selectedQuestion = availableQuestions[randomIndex];

    // 使用済みリストに追加
    this.usedStaticQuestionIds.add(selectedQuestion.id);

    console.log(`📋 設問選択: ${selectedQuestion.title} (${selectedQuestion.category})`);
    if (selectedQuestion.contextualBackground) {
      console.log('✨ AI拡張設問が選択されました');
    }
    console.log(`📊 使用済み設問数: ${this.usedStaticQuestionIds.size}/${allQuestions.length}`);

    // StaticQuestionをGeneratedEventに変換
    const generatedEvent = this.convertStaticQuestionToGeneratedEvent(selectedQuestion, context);

    // イベント履歴に追加
    this.eventHistory.push(generatedEvent);

    return generatedEvent;
  }

  // DataLoaderから利用可能な設問を取得
  private getAvailableDataLoaderQuestions(): StaticQuestion[] {
    const allQuestions = this.dataLoader.getAllQuestions();
    return allQuestions.filter(question =>
      !this.usedStaticQuestionIds.has(question.id)
    );
  }

  // フォールバック用：従来の静的設問取得
  private getAvailableStaticQuestions(): StaticQuestion[] {
    import('./static-questions').then(module => {
      const { allStaticQuestions } = module;
      return allStaticQuestions.filter((question: StaticQuestion) =>
        !this.usedStaticQuestionIds.has(question.id)
      );
    });

    // 一時的にgetRandomQuestionを使用
    const randomQuestion = getRandomQuestion();
    return randomQuestion ? [randomQuestion] : [];
  }

  // 全設問数を取得（DataLoader優先）
  private getTotalStaticQuestionCount(): number {
    if (this.dataLoader.getTotalQuestionCount() > 0) {
      return this.dataLoader.getTotalQuestionCount();
    }
    const { allStaticQuestions } = require('./static-questions');
    return allStaticQuestions.length;
  }

  // 使用済み静的設問IDをリセット
  private resetUsedStaticQuestions(): void {
    this.usedStaticQuestionIds.clear();
    console.log('🔄 静的設問使用履歴をリセットしました');
  }

  // 静的設問をGeneratedEventフォーマットに変換
  private convertStaticQuestionToGeneratedEvent(
    staticQuestion: StaticQuestion,
    context: EventGenerationContext
  ): GeneratedEvent {
    // 選択肢を適切なフォーマットに変換
    const convertedOptions = staticQuestion.options.map(option => ({
      text: option.text,
      type: this.convertStaticTypeToEventType(option.type, option.stance),
      politicalStance: this.convertStaticStanceToEventStance(option.stance),
      expectedEffects: option.expectedEffects
    }));

    // 学術的背景情報の構造化
    const backgroundInfo = {
      historicalContext: `${staticQuestion.category}分野の重要課題として継続的に議論されている`,
      currentSituation: staticQuestion.description,
      internationalComparison: `類似の政策課題は先進国でも共通して検討されている`,
      theoreticalRelevance: staticQuestion.academicElements.theoreticalFramework,
      stakeholderPositions: `主要関係者: ${staticQuestion.academicElements.keyStakeholders.join('、')}`,
      researchImplications: '大学生の政治学研究・学習に適した学術的価値の高い課題'
    };

    return {
      id: staticQuestion.id,
      title: `📋 ${staticQuestion.title}`,
      description: staticQuestion.description + (staticQuestion.context ? `\n\n${staticQuestion.context}` : ''),
      category: `academic_${staticQuestion.category}`,
      urgency: 'medium',
      complexity: staticQuestion.difficulty === 'advanced' ? 'complex' : 'moderate',
      options: convertedOptions,
      backgroundInfo: backgroundInfo,
      academicElements: staticQuestion.academicElements,
      stakeholders: staticQuestion.academicElements.keyStakeholders,
      timeConstraint: {
        urgency: staticQuestion.timeConstraint,
        politicalDeadline: '政策検討・実施のタイミング',
        legislativeSchedule: '関連法制度の審議スケジュール',
        administrativeConstraint: '行政機関での実施体制構築'
      },
      aiGenerated: false,
      generationReason: `静的設問データベースより選出（難易度: ${staticQuestion.difficulty}、分野: ${staticQuestion.category}）`
    };
  }

  // 静的設問のタイプをイベントタイプに変換
  private convertStaticTypeToEventType(
    staticType: 'realistic' | 'humorous' | 'extreme',
    stance: string
  ): 'conservative' | 'progressive' | 'moderate' | 'radical' | 'liberal' | 'nationalist' | 'populist' | 'technocratic' | 'centrist' | 'extremist' {
    if (staticType === 'extreme') return 'extremist';
    if (staticType === 'humorous') return 'populist';

    // realistic の場合は stance に基づいて決定
    switch (stance) {
      case 'conservative': return 'conservative';
      case 'liberal': return 'liberal';
      case 'progressive': return 'progressive';
      case 'populist': return 'populist';
      case 'technocratic': return 'technocratic';
      case 'centrist':
      case 'moderate':
      default:
        return 'moderate';
    }
  }

  // 静的設問のstanceをイベントstanceに変換
  private convertStaticStanceToEventStance(
    stance: string
  ): 'right' | 'left' | 'center' | 'far-right' | 'far-left' | 'liberal' | 'conservative' | 'populist' | 'technocratic' | 'pragmatic' {
    switch (stance) {
      case 'conservative': return 'conservative';
      case 'liberal': return 'liberal';
      case 'progressive': return 'left';
      case 'populist': return 'populist';
      case 'technocratic': return 'technocratic';
      case 'centrist':
      case 'moderate':
      default:
        return 'center';
    }
  }

  // Gemini APIを使用したイベント生成
  private async generateWithGemini(context: EventGenerationContext): Promise<GeneratedEvent> {
    const prompt = this.buildEventGenerationPrompt(context);
    
    try {
      const response = await fetch('/api/generate-political-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          context
        })
      });

      if (!response.ok) {
        throw new Error('Server error: ' + response.status);
      }

      const data = await response.json();
      
      if (data.success && data.event) {
        console.log('✅ Geminiイベント生成成功');
        const generatedEvent = this.validateAndNormalizeEvent(data.event, context);
        this.eventHistory.push(generatedEvent);
        return generatedEvent;
      } else {
        throw new Error('Invalid response from Gemini API');
      }
    } catch (error) {
      console.error('❌ Geminiイベント生成エラー:', error);
      return this.generateFallbackEvent(context);
    }
  }

  // Ollama APIを使用したイベント生成
  private async generateWithOllama(context: EventGenerationContext): Promise<GeneratedEvent> {
    const prompt = this.buildEventGenerationPrompt(context);
    
    try {
      const response = await fetch('/api/ollama/generate-political-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          context
        })
      });

      if (!response.ok) {
        throw new Error('Server error: ' + response.status);
      }

      const data = await response.json();
      
      if (data.success && data.event) {
        console.log('✅ Ollamaイベント生成成功');
        const generatedEvent = this.validateAndNormalizeEvent(data.event, context);
        this.eventHistory.push(generatedEvent);
        return generatedEvent;
      } else {
        throw new Error('Invalid response from Ollama API');
      }
    } catch (error) {
      console.error('❌ Ollamaイベント生成エラー:', error);
      return this.generateFallbackEvent(context);
    }
  }

  // イベント生成プロンプト構築
  private buildEventGenerationPrompt(context: EventGenerationContext): string {
    const currentDate = new Date();
    const seasonText = this.getSeasonText(context.currentSeason);
    const phaseText = this.getPhaseText(context.gamePhase);
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    return `あなたは政治学・経済学・公共政策学の専門教育者AIです。大学生の政治学習・研究に最適な、学術的で教育価値の高い政治設問を生成してください。

## 📊 現在の政治状況（データ分析）
- 政権期: ${context.currentState.turn}/${context.currentState.maxTurns}ターン (${phaseText})
- 内閣支持率: ${context.currentState.approvalRating}% (トレンド: ${context.politicalTrends.approvalTrend})
- 実質GDP: ${context.currentState.gdp}兆円 (経済動向: ${context.politicalTrends.economicTrend})
- 国債残高: ${context.currentState.nationalDebt}兆円 (対GDP比率: ${Math.round((context.currentState.nationalDebt / context.currentState.gdp) * 100)}%)
- 科学技術競争力指数: ${context.currentState.technology}/100
- 環境パフォーマンス指数: ${context.currentState.environment}/100
- 日経平均株価: ${context.currentState.stockPrice}円
- USD/JPY為替レート: ${context.currentState.usdJpyRate}円
- 外交関係総合指数: ${context.currentState.diplomacy}/100
- 政治リスク評価: ${context.politicalTrends.riskLevel}レベル

## 現実的な政治課題テーマ（以下から選択または組み合わせ）

### 外交・安全保障
- 憲法9条改正と自衛隊明記、防衛費GDP比2％増額、台湾有事対応、北方領土交渉、核共有議論、沖縄基地問題、中国海洋進出、北朝鮮拉致問題、武器輸出三原則

### 内政・司法・治安  
- 少年法適用年齢、通信傍受拡大、死刑制度存廃、入管長期収容、検察独立性、GPS監視、警察権限、宗教法人課税、公務員制度改革、マイナンバー活用

### 財政・経済
- 消費税率引き上げ、国債償還計画、ベーシックインカム、外国人労働者、富裕層課税、公共事業、規制緩和、カジノ推進、最低賃金、非正規雇用

### 社会保障・福祉
- 年金支給年齢70歳、医療費自己負担、子育て社会負担、外国人介護士、高齢者優遇見直し、出産奨励金、障害者雇用、生活保護改革、無戸籍児、医師偏在

### 教育・文化・科学技術
- 大学無償化、教員働き方改革、AI雇用規制、学術会議、学校統廃合、英語教育、道徳教育、私学助成、職業訓練、芸術文化予算

### 環境・エネルギー
- 原発再稼働、脱炭素vs産業、再エネ景観問題、炭素税、森林買収規制、水資源管理、温室ガス目標、ごみ発電、EV推進、プラスチック規制

### 農林水産・食料
- 食料自給率向上、農協改革、漁業資源管理、米減反政策、遺伝子組換え、農産物関税、農地企業参入、有機農業、漁獲制限、食料備蓄

### インフラ・国土交通
- 高速道路無料化、地方鉄道維持、都市再開発、バリアフリー、無人運転、新幹線整備、空港統廃合、首都機能移転、道路民営化、インフラ更新

### 防災・危機管理
- 首都機能分散、災害復旧費分担、感染症行動制限、原発事故対応、水害対策、南海トラフ対策、防災教育、災害ボランティア、ワクチン義務化、外国軍支援

### 行政運営・統治
- 衆院定数削減、参院廃止、首相公選制、選挙権16歳、被選挙権年齢、政党助成金、官僚依存、デジタル庁、地方交付税、国民投票制度

## 🎓 大学生レベル政治設問の設計原則

### 📚 学術的設問構造（研究対応版）
1. **問題提起**（100-150文字）: 政策課題の社会的背景と緊急性
2. **データ・統計**（50-80文字）: 客観的数値による現状把握
3. **理論的枠組み**（80-120文字）: 政治学・経済学理論との関連
4. **利害関係者分析**（各40-60文字）: 主要アクターの立場・動機・制約
5. **政策選択肢**（10個）: 理論的・実務的に検証可能なオプション
6. **評価軸**（30-50文字）: 政策評価の判断基準

### 🔬 学習価値の最大化ポイント
- **理論との接続**: 政治学・経済学理論の実践的応用
- **複合的思考**: 単一領域を超えた学際的アプローチ
- **データ重視**: 統計・調査に基づく実証的判断
- **比較分析**: 他国事例・歴史的類例との対比
- **長期視点**: 短期効果と長期影響の両面考慮
- **制約の明示**: 政治的・経済的・制度的制約の理解

### 📊 設問例の参考構造

**🏭 原発問題**
- 背景: 資源小国→原発推進→福島事故→方針転換
- 利害関係者: 政府vs電力会社vs住民vs国際社会
- ジレンマ: 電力安定vs安全性、CO2削減vs脱原発

**👶 少子化問題**  
- 背景: 出生率1.2台→人口減少→社会保障危機
- 利害関係者: 若者vs高齢者vs企業vs国際社会
- ジレンマ: 子育て支援vs財政負担、価値観vs政策

**🛡️ 防衛費問題**
- 背景: GDP比1%抑制→安保環境悪化→NATO基準2%
- 利害関係者: 防衛省vs財務省vs市民vs米国
- ジレンマ: 安全保障vs生活保障、国際要請vs財政制約

## 生成指示
以下の形式で、シンプルで面白い政治設問を生成してください：

### 必須要素
1. **タイトル**: 「○○をどうする？」形式（20文字以内）
2. **背景**: 問題の経緯を2-3行で簡潔に（100文字程度）
3. **利害関係者**: 4-5つの立場を箇条書き（各30文字程度）
4. **選択肢**: 10個の多様な政策オプション

### 選択肢の学術的分類（政治学理論基準）
1. **新自由主義型**: 市場機能・規制緩和・民営化重視（例：法人減税、金融緩和）
2. **社会民主主義型**: 再分配・社会保障・労働者保護重視（例：最低賃金上昇、累進課税）
3. **保守主義型**: 伝統・安定・漸進的変化重視（例：既存制度維持、慎重改革）
4. **ポピュリズム型**: 直接民意・反エリート・国民優先（例：直接給付、住民投票）
5. **テクノクラート型**: 専門知識・技術革新・合理性重視（例：AI活用、データ重視）
6. **権威主義型**: 強力指導・秩序維持・効率性重視（例：行政権拡大、規律強化）
7. **国際協調型**: 多国間協力・国際基準・グローバル統合（例：国際機関連携）
8. **ナショナリズム型**: 国家主権・自国優先・独立性重視（例：保護主義、主権回復）
9. **地方分権型**: 補完性原理・多層統治・地域自治（例：権限移譲、財源移転）
10. **参加民主主義型**: 市民参加・熟議・協働統治（例：市民会議、協働ガバナンス）

## 🎯 大学生レベル学術設問の出力形式

JSON形式で以下を必須として返してください：

{
  "id": "academic_politics_${currentYear}${currentMonth}_XXX",
  "title": "📋 [政策分野] 具体的で学術的な設問タイトル（50文字以内）",
  "description": "【問題状況】現状と課題の客観的記述（150文字）\\n【統計データ】関連する数値・調査結果（80文字）\\n【理論的背景】政治学・経済学理論との関連（100文字）\\n\\n利害関係者分析：\\n・[主体1]：立場・動機・制約（50文字）\\n・[主体2]：立場・動機・制約（50文字）\\n・[主体3]：立場・動機・制約（50文字）\\n・[主体4]：立場・動機・制約（50文字）\\n・[主体5]：立場・動機・制約（50文字）",
  "category": "academic_[外交|内政|経済|社会|環境|技術]",
  "urgency": "medium",
  "complexity": "complex",
  "academicElements": {
    "theoreticalFramework": "適用される政治学・経済学理論",
    "comparativeCase": "他国・歴史的類例との比較分析",
    "evaluationCriteria": ["効率性", "公平性", "持続可能性", "政治的実現可能性", "国際整合性"],
    "researchQuestions": ["この政策の効果測定方法は？", "ステークホルダー間の利害調整は？", "長期的影響の予測は？"]
  },
  "options": [
    {
      "text": "【[理論型]・[具体的政策名]】法的根拠・実施体制・予算規模・期間・効果指標を明記した詳細政策（120文字以内）",
      "type": "academic_[新自由主義|社会民主主義|保守主義|ポピュリズム|テクノクラート|権威主義|国際協調|ナショナリズム|地方分権|参加民主主義]",
      "politicalStance": "理論に基づく政治的立場",
      "policyDetails": {
        "legalBasis": "政策の法的根拠",
        "implementationBody": "実施機関・体制",
        "budgetScale": "予算規模（兆円単位）",
        "timeframe": "実施期間・スケジュール",
        "targetIndicators": "達成目標・評価指標",
        "riskFactors": "実施上のリスク要因"
      },
      "theoreticalJustification": "この選択肢の政治学・経済学的根拠",
      "expectedEffects": {
        "approvalRating": -20から+20の数値,
        "gdp": -50から+50の数値,
        "nationalDebt": -100から+100の数値,
        "technology": -15から+15の数値,
        "environment": -15から+15の数値,
        "stockPrice": -2000から+2000の数値,
        "usdJpyRate": -10から+10の数値,
        "diplomacy": -15から+15の数値
      }
    }
  ],
  "backgroundInfo": {
    "historicalContext": "この問題の歴史的経緯・先例",
    "currentSituation": "現在の状況・緊急性の根拠",
    "internationalComparison": "他国での類似事例・成功/失敗例",
    "theoreticalRelevance": "関連する政治学・経済学理論の適用"
  },
  "stakeholders": ["政府", "国民", "企業", "地方自治体", "国際社会", "専門家・学者", "メディア"],
  "timeConstraint": {
    "urgency": "政治的決定期限",
    "legislativeSchedule": "国会・議会スケジュール",
    "administrativeConstraint": "行政手続き上の制約"
  },
  "aiGenerated": true,
  "generationReason": "大学生の政治学研究・学習に最適化した学術的設問として生成"
}`;
  }

  // 緊急イベント生成
  private async generateEmergencyEvent(context: EventGenerationContext): Promise<GeneratedEvent> {
    const emergencyTypes = [
      { type: 'natural_disaster', name: '自然災害', examples: ['大地震', '台風', '豪雨災害', '火山噴火'] },
      { type: 'economic_crisis', name: '経済危機', examples: ['金融市場暴落', '円急落', '企業倒産連鎖', 'インフレ急騰'] },
      { type: 'diplomatic_crisis', name: '外交危機', examples: ['領土問題激化', '貿易摩擦', '同盟国との対立', '国際制裁'] },
      { type: 'security_threat', name: '安全保障脅威', examples: ['サイバー攻撃', 'テロ脅威', '軍事的威嚇', '情報漏洩'] },
      { type: 'social_unrest', name: '社会不安', examples: ['大規模デモ', '労働争議', '社会分裂', '治安悪化'] },
      { type: 'technological_crisis', name: '技術危機', examples: ['システム障害', 'AI暴走', '通信遮断', 'インフラ停止'] }
    ];
    
    const selectedEmergency = emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)];
    const selectedExample = selectedEmergency.examples[Math.floor(Math.random() * selectedEmergency.examples.length)];
    
    const prompt = `🚨 緊急政治課題：大学生の危機管理・政策分析学習として、学術的価値の高い緊急政治設問を生成してください：

## 📊 緊急事態の政治分析コンテキスト
- 危機事象タイプ: ${selectedEmergency.name} (${selectedExample})
- 政治情勢: 内閣支持率${context.currentState.approvalRating}%、政治リスク${context.politicalTrends.riskLevel}レベル
- 政権段階: ${this.getPhaseText(context.gamePhase)} (統治経験・政治資源の観点)
- 政策履歴: ${context.previousChoices.slice(-2).join(', ') || '政策実績なし'}

## 🎓 危機管理学習の学術的要求水準

### 📚 分析フレームワーク
1. **危機発生メカニズム**（120文字）
   - 構造的要因・引き金要因の分析
   - 類似危機の歴史的パターン比較
   - 政策失敗・制度的脆弱性の関連

2. **影響波及分析**（180文字）
   - 直接的被害・間接的影響の定量評価
   - セクター別・地域別影響の差異
   - 時系列での影響拡大プロセス
   - 国際的波及・相互依存性

3. **政治アクター分析**（各60文字）
   - 政府：危機対応能力・政治的制約・責任論
   - 国民：被害認識・期待・政治的行動
   - 企業：損失規模・復旧戦略・政府依存度
   - 自治体：現場対応・中央との関係・地域格差
   - 国際社会：支援意向・外交的思惑・評価視点
   - 専門家：技術的評価・政策提言・責任の所在

4. **政策選択のディレンマ構造**（80文字）
   - 効率性vs公平性の価値対立
   - 短期安定化vs長期構造改革の時間軸葛藤
   - 国内対応vs国際協調の戦略選択

### 緊急事態の現実的テーマ例
- **自然災害**: 南海トラフ地震、首都直下地震、スーパー台風、富士山噴火
- **経済危機**: 金融市場暴落、円急落、銀行破綻、インフレ急騰
- **外交危機**: 台湾有事、北朝鮮ミサイル、領土問題激化、同盟国対立
- **安全保障**: 大規模サイバー攻撃、テロ脅威、情報漏洩、軍事挑発
- **社会危機**: パンデミック、大規模デモ、インフラ停止、食料危機
- **技術危機**: AI暴走、システム障害、通信遮断、宇宙デブリ

### 危機対応の政治学分類（必ず10個の学術的選択肢生成）

1. **権威主義的危機管理**: 強権発動・中央集権・迅速決定（例：緊急事態宣言、行政権限拡大）
2. **民主主義的熟議**: 透明性・説明責任・合意形成重視（例：国民対話、議会承認）
3. **福祉国家的保護**: 社会保障・再分配・弱者配慮（例：生活保障、格差是正）
4. **新自由主義的市場重視**: 効率性・競争・民間活力（例：規制緩和、市場メカニズム）
5. **国際協調・多国間主義**: グローバル連携・制度協力（例：国際機関、多国間枠組み）
6. **国家主義・自力救済**: 主権重視・独立対応・内政不干渉（例：国産技術、自主防衛）
7. **テクノクラート・専門知重視**: 科学的根拠・合理的判断（例：データ重視、専門家会議）
8. **地方分権・補完性**: 現場主導・多層協力・地域特性（例：自治体権限、広域連携）
9. **予防原則・長期視点**: リスク回避・持続可能性（例：構造改革、制度見直し）
10. **政治的安定・超党派**: 政権維持・国民統合・政治休戦（例：挙国一致、大連立）

### 各選択肢の必須要素
- 具体的な対応策・政策名
- 予算規模・人員配置
- 実施期間・対応スケジュール
- 担当組織・責任体制
- 期待される効果・リスク
- 国民・国際社会への影響

## 生成要求
以下のJSON形式で、教育的価値の高い緊急政治イベントを生成してください：

{
  "id": "emergency_${selectedEmergency.type}_YYYYMMDD_XXX",
  "title": "🚨 緊急事態：具体的で現実的なタイトル",
  "description": "【背景】歴史的経緯と発生要因（100文字）\\n【現状】具体的被害と緊急性（150文字）\\n\\n利害関係者：\\n・政府：対応方針と政治的責任\\n・国民：生活影響と要求\\n・企業：経済損失と期待\\n・国際社会：支援と期待\\n・専門家：技術的見解",
  "category": "emergency",
  "urgency": "critical",
  "complexity": "complex",
  "options": [10個の多様な緊急対応選択肢],
  "backgroundInfo": "緊急事態の政治的・歴史的背景",
  "stakeholders": ["政府", "国民", "企業", "国際社会", "専門家"],
  "timeConstraint": "緊急対応期限（72時間以内等）",
  "aiGenerated": true,
  "generationReason": "AI駆動緊急事態生成"
}`;

    try {
      const currentProvider = this.aiProvider.getCurrentProvider();
      
      if (currentProvider === 'gemini') {
        const response = await fetch('/api/generate-political-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, context, emergency: true })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.event) {
            return this.validateAndNormalizeEvent(data.event, context);
          }
        }
      } else if (currentProvider === 'ollama') {
        const response = await fetch('/api/ollama/generate-political-event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, context, emergency: true })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.event) {
            return this.validateAndNormalizeEvent(data.event, context);
          }
        }
      }
      
      return this.generateFallbackEmergencyEvent(context);
    } catch (error) {
      console.error('❌ 緊急イベント生成エラー:', error);
      return this.generateFallbackEmergencyEvent(context);
    }
  }

  // イベント検証と正規化（重複防止機能付き）
  private validateAndNormalizeEvent(event: any, context: EventGenerationContext): GeneratedEvent {
    // IDの生成（重複回避）
    let generatedId: string;
    let attempts = 0;

    do {
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.random().toString(36).substr(2, 3);
      generatedId = 'ai_generated_' + timestamp + '_' + randomSuffix;
      attempts++;
    } while (this.usedAIEventIds.has(generatedId) && attempts < this.maxRetries);

    // 重複チェック後、使用済みリストに追加
    this.usedAIEventIds.add(generatedId);

    // 効果値の正規化（現在の状況を考慮した動的調整）
    const normalizeEffects = (effects: any) => {
      const baseEffects = {
        approvalRating: Math.max(-20, Math.min(20, Math.round(effects.approvalRating || 0))),
        gdp: Math.max(-50, Math.min(50, Math.round(effects.gdp || 0))),
        nationalDebt: Math.max(-100, Math.min(100, Math.round(effects.nationalDebt || 0))),
        technology: Math.max(-15, Math.min(15, Math.round(effects.technology || 0))),
        environment: Math.max(-15, Math.min(15, Math.round(effects.environment || 0))),
        stockPrice: Math.max(-2000, Math.min(2000, Math.round(effects.stockPrice || 0))),
        usdJpyRate: Math.max(-10, Math.min(10, Math.round(effects.usdJpyRate || 0))),
        diplomacy: Math.max(-15, Math.min(15, Math.round(effects.diplomacy || 0)))
      };

      // 現在の状況に応じた効果調整
      if (context.currentState.approvalRating < 30) {
        // 支持率が低い場合、政策効果を減衰
        baseEffects.approvalRating = Math.round(baseEffects.approvalRating * 0.8);
        baseEffects.gdp = Math.round(baseEffects.gdp * 0.9);
      }

      if (context.politicalTrends.riskLevel === 'critical') {
        // 危機的状況では効果が増幅
        Object.keys(baseEffects).forEach(key => {
          baseEffects[key as keyof typeof baseEffects] = Math.round(baseEffects[key as keyof typeof baseEffects] * 1.2);
        });
      }

      return baseEffects;
    };

    // 選択肢の詳細情報を保持
    const processedOptions = (event.options || []).slice(0, 10).map((option: any, index: number) => {
      const politicalStances = ['right', 'left', 'center', 'populist', 'technocratic', 'far-right', 'pragmatic', 'far-left', 'liberal', 'conservative'];
      const optionTypes = ['conservative', 'progressive', 'moderate', 'populist', 'technocratic', 'nationalist', 'radical', 'liberal', 'centrist', 'extremist'];
      
      return {
        text: option.text || `政策選択肢 ${index + 1}`,
        type: option.type || optionTypes[index] || 'moderate',
        politicalStance: option.politicalStance || politicalStances[index] || 'center',
        policyDetails: option.policyDetails || {
          policyName: '政策名未設定',
          budget: '予算未設定',
          duration: '期間未設定',
          ministry: '担当省庁未設定',
          legalBasis: '法的根拠未設定',
          targetMetrics: '目標未設定'
        },
        expectedEffects: normalizeEffects(option.expectedEffects || {})
      };
    });

    // 学術的背景情報の構造化
    const processedBackgroundInfo = typeof event.backgroundInfo === 'object' ?
      event.backgroundInfo : {
        historicalContext: event.backgroundInfo || '政治学・政策学研究における類似課題の分析',
        currentSituation: `内閣支持率${context.currentState.approvalRating}%、実質GDP${context.currentState.gdp}兆円、政治リスク${context.politicalTrends.riskLevel}下での学術的政策分析課題`,
        internationalComparison: '比較政治学的観点による他国制度・政策の成功失敗事例分析',
        theoreticalRelevance: '政治学・経済学・公共政策学理論の実践的適用と検証',
        stakeholderPositions: '政治アクター理論に基づく利害関係者の戦略的行動分析',
        researchImplications: '大学生の政治学研究・政策分析能力向上に資する学習課題'
      };

    // 学術的要素の追加
    const academicElements = event.academicElements || {
      theoreticalFramework: '政治学・経済学・公共政策学の複合的理論適用',
      comparativeCase: '先進民主主義国における類似政策の比較制度分析',
      evaluationCriteria: ['政策効率性', '社会公平性', '政治的実現可能性', '長期持続可能性', '国際整合性'],
      researchQuestions: [
        'この政策選択の政治学的意義は何か？',
        'ステークホルダー間の利害調整メカニズムは？',
        '政策効果の測定・評価方法は？',
        '他国との比較における日本の特殊性は？'
      ]
    };

    return {
      id: generatedId,
      title: event.title || '📋 新たな政治学研究課題',
      description: event.description || '現在の政治状況において学術的分析価値の高い政策課題が浮上しました。政治学・経済学理論を適用した多面的な政策判断分析が求められています。',
      category: event.category || 'academic_general',
      urgency: event.urgency || 'medium',
      complexity: event.complexity || 'complex',
      options: processedOptions,
      backgroundInfo: processedBackgroundInfo,
      academicElements: academicElements,
      stakeholders: Array.isArray(event.stakeholders) ? event.stakeholders :
        ['政府', '国民', '企業', '地方自治体', '国際社会', '専門家・学者', 'メディア'],
      timeConstraint: typeof event.timeConstraint === 'object' ?
        event.timeConstraint : {
          urgency: event.timeConstraint || '政策決定の適切なタイミング',
          politicalDeadline: '国会審議・行政手続きスケジュール',
          legislativeSchedule: '立法府での議論・承認プロセス',
          administrativeConstraint: '行政府での実施・執行上の制約'
        },
      aiGenerated: true,
      generationReason: event.generationReason ||
        `大学生の政治学研究・学習に最適化：現在の政治状況（内閣支持率${context.currentState.approvalRating}%、政治リスク${context.politicalTrends.riskLevel}）を学術的分析コンテキストとして活用`
    };
  }

  // フォールバックイベント生成（重複防止機能付き・10個の選択肢）
  private generateFallbackEvent(context: EventGenerationContext): GeneratedEvent {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substr(2, 3);

    const fallbackEvents = [
      {
        id: 'economy_reform',
        title: '経済政策の抜本的見直し',
        description: `現在の支持率${context.currentState.approvalRating}%、GDP${context.currentState.gdp}兆円の状況下で、政府の経済政策の抜本的見直しが求められています。国債残高${context.currentState.nationalDebt}兆円、日経平均${context.currentState.stockPrice}円という経済指標を踏まえ、持続可能な成長戦略の策定が急務となっています。`,
        category: 'economy'
      },
      {
        id: 'diplomatic_strategy',
        title: '外交・安全保障政策の戦略的転換',
        description: `外交関係${context.currentState.diplomacy}%の現状において、国際情勢の変化に対応した外交・安全保障政策の戦略的転換が必要です。近隣諸国との関係調整、同盟国との連携強化、多国間外交の推進など、複合的なアプローチが求められています。`,
        category: 'diplomacy'
      },
      {
        id: 'technology_nation',
        title: '科学技術立国への政策転換',
        description: `技術力${context.currentState.technology}%の現状を踏まえ、AI、量子コンピューター、バイオテクノロジーなど先端技術分野での国際競争力強化が急務です。研究開発投資、人材育成、産学官連携の抜本的強化により、科学技術立国としての地位確立を目指す必要があります。`,
        category: 'technology'
      },
      {
        id: 'social_security_reform',
        title: '社会保障制度の持続可能性確保',
        description: `高齢化社会の進展により、社会保障制度の持続可能性が問われています。年金制度改革、医療費抑制、介護保険制度の見直しなど、世代間公平を考慮した制度設計が急務となっています。`,
        category: 'social'
      },
      {
        id: 'environmental_policy',
        title: '脱炭素社会実現に向けた環境政策',
        description: `環境指数${context.currentState.environment}%の現状において、2050年カーボンニュートラル目標達成に向けた具体的な政策展開が求められています。再生可能エネルギー拡大、産業構造転換、国民生活の変革が必要です。`,
        category: 'environment'
      },
      {
        id: 'education_innovation',
        title: '教育システムのデジタル変革',
        description: `急速なデジタル化時代に対応した教育システムの抜本的変革が必要です。ICT教育の充実、教員の働き方改革、大学入試制度改革など、未来人材育成に向けた包括的な政策が求められています。`,
        category: 'education'
      },
      {
        id: 'regional_revitalization',
        title: '地方創生と東京一極集中の是正',
        description: `人口減少と東京一極集中が地方経済に深刻な影響を与えています。デジタル田園都市構想、企業の地方移転促進、観光立国戦略など、地方創生の新たなアプローチが必要です。`,
        category: 'regional'
      },
      {
        id: 'healthcare_reform',
        title: '医療制度改革と健康立国戦略',
        description: `超高齢社会における医療制度の持続可能性確保が急務です。医師の偏在解消、医療DX推進、予防医療の充実など、国民の健康と医療制度の両立を図る政策が求められています。`,
        category: 'healthcare'
      }
    ];

    // 使用済みIDを除外してイベントを選択
    const availableEvents = fallbackEvents.filter(event => {
      // このイベントタイプが既に使用されているかチェック
      const isEventTypeUsed = context.usedEventIds.some(usedId =>
        usedId.includes(`fallback_${event.id}_`)
      );
      return !isEventTypeUsed;
    });

    // 利用可能なイベントがない場合は全てリセット
    let selectedEvent;
    if (availableEvents.length === 0) {
      console.log('⚠️ 全フォールバックイベントが使用済み、リセットして選択');
      selectedEvent = { ...fallbackEvents[Math.floor(Math.random() * fallbackEvents.length)] };
      selectedEvent.id = `fallback_${selectedEvent.id}_${timestamp}_reset`;
    } else {
      selectedEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
    }

    // ユニークIDを生成
    const uniqueId = `fallback_${selectedEvent.id}_${timestamp}_${randomSuffix}`;
    console.log(`🎲 フォールバックイベント生成: ${uniqueId}`);

    // 10個の多様な政治的立場を反映した選択肢
    const generateTenOptions = () => {
      const baseOptions = [
        {
          text: '【右派・保守】市場原理活用法を制定し、経産省主導で年間2.5兆円の規制緩和・税制優遇を実施。3年間で法人税率を20%から15%に段階的引き下げ、企業の設備投資を促進し、民間活力による経済成長を目指す。',
          type: 'conservative' as const, politicalStance: 'conservative' as const,
          expectedEffects: { approvalRating: 6, gdp: 15, nationalDebt: -20, technology: 8, environment: -5, stockPrice: 800, usdJpyRate: -3, diplomacy: 2 }
        },
        {
          text: '【左派・リベラル】社会保障拡充基本法を改正し、厚労省主導で年間4.8兆円の包括的社会保障制度を構築。最低賃金1500円への段階的引き上げ、全世代型社会保障の実現により格差是正を図る。',
          type: 'progressive' as const, politicalStance: 'liberal' as const,
          expectedEffects: { approvalRating: 12, gdp: -8, nationalDebt: 80, technology: 3, environment: 5, stockPrice: -300, usdJpyRate: 2, diplomacy: 5 }
        },
        {
          text: '【中道・穏健】段階的改革推進法を制定し、内閣府調整で年間1.8兆円の漸進的政策を実施。既存制度の効率化とデジタル化により、安定的な政策運営を継続する。',
          type: 'moderate' as const, politicalStance: 'center' as const,
          expectedEffects: { approvalRating: 4, gdp: 5, nationalDebt: 30, technology: 6, environment: 3, stockPrice: 200, usdJpyRate: 0, diplomacy: 3 }
        },
        {
          text: '【ポピュリスト】国民生活第一法を制定し、総務省主導で年間8兆円の直接給付を実施。全国民に一律20万円支給、消費税5%減税により国民生活を直接支援する。',
          type: 'populist' as const, politicalStance: 'populist' as const,
          expectedEffects: { approvalRating: 18, gdp: 8, nationalDebt: 120, technology: -2, environment: -3, stockPrice: 400, usdJpyRate: 5, diplomacy: -5 }
        },
        {
          text: '【テクノクラート】AI政策最適化法を制定し、デジタル庁主導で年間3.2兆円のデータ駆動型政策を展開。ビッグデータ解析により最適な資源配分を実現し、エビデンスベースの政策決定を推進する。',
          type: 'technocratic' as const, politicalStance: 'technocratic' as const,
          expectedEffects: { approvalRating: 7, gdp: 12, nationalDebt: 50, technology: 15, environment: 8, stockPrice: 600, usdJpyRate: -2, diplomacy: 4 }
        },
        {
          text: '【ナショナリスト】経済安全保障強化法を改正し、経産省主導で年間4.5兆円の国産技術育成を実施。戦略物資の国内自給率80%達成、外国企業買収規制強化により経済主権を確立する。',
          type: 'nationalist' as const, politicalStance: 'far-right' as const,
          expectedEffects: { approvalRating: 10, gdp: 3, nationalDebt: 70, technology: 12, environment: -8, stockPrice: -200, usdJpyRate: -5, diplomacy: -10 }
        },
        {
          text: '【プラグマティスト】官民連携最適化法を制定し、国交省・財務省連携で年間2.7兆円のPPP事業を展開。VFM15%向上を目標とし、実効性重視の柔軟な政策運営を実現する。',
          type: 'moderate' as const, politicalStance: 'pragmatic' as const,
          expectedEffects: { approvalRating: 5, gdp: 8, nationalDebt: 40, technology: 7, environment: 4, stockPrice: 300, usdJpyRate: -1, diplomacy: 6 }
        },
        {
          text: '【急進・革新】社会システム革新法を制定し、内閣府特別チーム主導で10年間12兆円の構造改革を断行。既存制度の抜本的見直しにより、社会システムを根本的に変革する。',
          type: 'radical' as const, politicalStance: 'far-left' as const,
          expectedEffects: { approvalRating: -5, gdp: 20, nationalDebt: 150, technology: 18, environment: 12, stockPrice: -800, usdJpyRate: 8, diplomacy: -8 }
        },
        {
          text: '【国際協調】グローバル協調推進法を制定し、外務省・財務省主導で年間3.8兆円の国際協力を実施。G7・OECD基準完全準拠により国際競争力を向上させる。',
          type: 'liberal' as const, politicalStance: 'liberal' as const,
          expectedEffects: { approvalRating: 3, gdp: 6, nationalDebt: 60, technology: 10, environment: 10, stockPrice: 400, usdJpyRate: -4, diplomacy: 15 }
        },
        {
          text: '【地方分権】地方主権確立法を制定し、総務省・地方創生担当で年間5.5兆円の権限・財源移譲を実施。国税の35%を地方税に移管し、地域主導の多様な政策展開を可能にする。',
          type: 'centrist' as const, politicalStance: 'center' as const,
          expectedEffects: { approvalRating: 8, gdp: 4, nationalDebt: 80, technology: 5, environment: 7, stockPrice: 100, usdJpyRate: 1, diplomacy: 3 }
        }
      ];

      return baseOptions;
    };

    return {
      id: uniqueId,
      title: selectedEvent.title,
      description: selectedEvent.description,
      category: selectedEvent.category,
      urgency: 'medium',
      complexity: 'moderate',
      options: generateTenOptions(),
      backgroundInfo: '過去の類似政策の成果と課題を踏まえた政策選択。現在の政治状況（支持率' + context.currentState.approvalRating + '%、GDP' + context.currentState.gdp + '兆円）を考慮し、他国の成功事例・失敗事例を参考にした政策設計。各ステークホルダーの利害関係を考慮した政策調整が必要。',
      stakeholders: ['政府', '国民', '企業', '地方自治体', '国際社会'],
      timeConstraint: '3ヶ月以内（次回国会会期中）',
      aiGenerated: false,
      generationReason: 'AI生成が利用できないため、高品質フォールバックイベントを使用'
    };
  }

  // フォールバック緊急イベント生成
  private generateFallbackEmergencyEvent(context: EventGenerationContext): GeneratedEvent {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substr(2, 3);

    const emergencyEvents = [
      {
        title: '🚨 緊急事態：全国の猫が政治に興味を持った！',
        description: '全国の猫が突然政治討論を始め、国会前でデモを開催。「にゃーにゃー政治改革」を要求しています。意外にも的確な指摘で、政治家たちがタジタジ。',
        category: 'social'
      },
      {
        title: '🚨 緊急事態：日本全国でラーメンが売り切れ！',
        description: '謎の現象により全国のラーメンが一斉に売り切れ。国民が「ラーメンなしでは生きられない」と大パニック。でも皆で手作りラーメンを作り始めて、意外に楽しい雰囲気。',
        category: 'economy'
      },
      {
        title: '🚨 緊急事態：桜が一年中咲き続ける現象発生！',
        description: '全国の桜が季節を無視して一年中咲き続ける謎の現象が発生。お花見が日常になり、観光客が殺到。でも「いつでも桜」で逆に新鮮味がなくなったという声も。',
        category: 'environment'
      },
      {
        title: '🚨 緊急事態：全国の電車が「お疲れ様」と挨拶し始めた！',
        description: '全国の電車のアナウンスが突然「お疲れ様でした」「今日も一日頑張りましたね」と優しくなり、乗客が感動で涙。でも朝の通勤ラッシュで泣く人続出で電車が遅延。',
        category: 'technology'
      }
    ];

    const selectedEvent = emergencyEvents[Math.floor(Math.random() * emergencyEvents.length)];

    return {
      id: 'emergency_fallback_' + timestamp + '_' + randomSuffix,
      title: selectedEvent.title,
      description: selectedEvent.description,
      category: selectedEvent.category,
      urgency: 'critical',
      complexity: 'complex',
      options: [
        {
          text: '「これは面白い！」と国民と一緒に楽しむ',
          type: 'populist' as const,
          politicalStance: 'populist' as const,
          expectedEffects: {
            approvalRating: Math.floor(Math.random() * 20) + 15,
            gdp: Math.floor(Math.random() * 11) + 5,
            nationalDebt: Math.floor(Math.random() * 41) + 20,
            technology: Math.floor(Math.random() * 8) + 5,
            environment: Math.floor(Math.random() * 8) + 3,
            stockPrice: Math.floor(Math.random() * 601) + 200,
            usdJpyRate: Math.floor(Math.random() * 6) - 3,
            diplomacy: Math.floor(Math.random() * 11) + 8
          }
        },
        {
          text: '新しい観光資源として世界にアピール',
          type: 'liberal' as const,
          politicalStance: 'liberal' as const,
          expectedEffects: {
            approvalRating: Math.floor(Math.random() * 15) + 10,
            gdp: Math.floor(Math.random() * 16) + 8,
            nationalDebt: Math.floor(Math.random() * 31) + 15,
            technology: Math.floor(Math.random() * 6) + 3,
            environment: Math.floor(Math.random() * 6) + 2,
            stockPrice: Math.floor(Math.random() * 501) + 300,
            usdJpyRate: Math.floor(Math.random() * 8) - 4,
            diplomacy: Math.floor(Math.random() * 16) + 10
          }
        },
        {
          text: '科学的に研究して新発見を目指す',
          type: 'technocratic' as const,
          politicalStance: 'technocratic' as const,
          expectedEffects: {
            approvalRating: Math.floor(Math.random() * 12) + 8,
            gdp: Math.floor(Math.random() * 8) + 3,
            nationalDebt: Math.floor(Math.random() * 51) + 40,
            technology: Math.floor(Math.random() * 16) + 12,
            environment: Math.floor(Math.random() * 8) + 5,
            stockPrice: Math.floor(Math.random() * 401) + 100,
            usdJpyRate: Math.floor(Math.random() * 6) - 3,
            diplomacy: Math.floor(Math.random() * 8) + 5
          }
        }
      ],
      backgroundInfo: '緊急事態により迅速な判断が求められています。',
      stakeholders: ['政府', '国民', '関係機関'],
      timeConstraint: '即座に',
      aiGenerated: false,
      generationReason: '緊急事態が発生したため、フォールバック緊急イベントを使用'
    };
  }

  // ヘルパー関数
  private getSeasonText(season: string): string {
    const seasons = {
      spring: '春',
      summer: '夏',
      autumn: '秋',
      winter: '冬'
    };
    return seasons[season as keyof typeof seasons] || '通年';
  }

  private getPhaseText(phase: string): string {
    const phases = {
      early: '政権初期',
      middle: '政権中期',
      late: '政権後期'
    };
    return phases[phase as keyof typeof phases] || '政権運営期';
  }

  // イベント履歴取得
  getEventHistory(): GeneratedEvent[] {
    return [...this.eventHistory];
  }

  // 統計情報取得（重複防止機能統計を含む）
  getStatistics() {
    const stats = {
      totalEvents: this.eventHistory.length,
      categoryDistribution: {} as Record<string, number>,
      averageComplexity: 0,
      emergencyEventCount: 0,
      staticQuestionsUsed: this.usedStaticQuestionIds.size,
      aiEventsUsed: this.usedAIEventIds.size,
      totalStaticQuestions: this.getTotalStaticQuestionCount(),
      staticQuestionProgress: `${this.usedStaticQuestionIds.size}/${this.getTotalStaticQuestionCount()}`,
      duplicationPrevention: {
        staticQuestionsRemaining: this.getAvailableStaticQuestions().length,
        canGenerateUniqueEvents: this.getAvailableStaticQuestions().length > 0 || this.useStaticQuestions
      }
    };

    this.eventHistory.forEach(event => {
      stats.categoryDistribution[event.category] = (stats.categoryDistribution[event.category] || 0) + 1;
      if (event.urgency === 'critical') {
        stats.emergencyEventCount++;
      }
    });

    return stats;
  }

  // 全履歴をリセット（新しいゲーム開始時など）
  public resetAllHistory(): void {
    this.usedStaticQuestionIds.clear();
    this.usedAIEventIds.clear();
    this.eventHistory = [];
    console.log('🔄 全イベント履歴をリセットしました');
  }

  // 静的設問のみリセット（AI生成は継続）
  public resetStaticQuestionsOnly(): void {
    this.resetUsedStaticQuestions();
  }

  // 使用済み設問の状況確認
  public getUsageStatus(): {
    staticQuestions: { used: number; total: number; remaining: number };
    aiEvents: { used: number };
  } {
    const totalStatic = this.getTotalStaticQuestionCount();
    const usedStatic = this.usedStaticQuestionIds.size;

    return {
      staticQuestions: {
        used: usedStatic,
        total: totalStatic,
        remaining: totalStatic - usedStatic
      },
      aiEvents: {
        used: this.usedAIEventIds.size
      }
    };
  }

  // カテゴリー別の利用可能設問数取得（DataLoader優先）
  public getAvailableQuestionsByCategory(): Record<string, number> {
    let availableQuestions: StaticQuestion[];

    if (this.dataLoader.getTotalQuestionCount() > 0) {
      availableQuestions = this.getAvailableDataLoaderQuestions();
    } else {
      availableQuestions = this.getAvailableStaticQuestions();
    }

    const categoryCount: Record<string, number> = {};

    availableQuestions.forEach(question => {
      categoryCount[question.category] = (categoryCount[question.category] || 0) + 1;
    });

    return categoryCount;
  }

  // DataLoaderの統計情報を取得
  public getDataLoaderStatistics() {
    return this.dataLoader.getEnhancementStatistics();
  }

  // DataLoaderでAI拡張機能の設定変更
  public setAIEnhancementEnabled(enabled: boolean): void {
    this.dataLoader.setAIEnhancementEnabled(enabled);
  }

  // バッチAI拡張処理の委譲
  public async batchEnhanceQuestions(categoryFilter?: string): Promise<void> {
    await this.dataLoader.batchEnhanceQuestions(categoryFilter);
  }

  // DataLoaderから設問を強制再読み込み
  public async reloadQuestionData(): Promise<void> {
    console.log('🔄 設問データの再読み込み開始...');
    await this.dataLoader.loadAllQuestionFiles();
    console.log('✅ 設問データの再読み込み完了');
  }
}