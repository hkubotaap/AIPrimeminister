// AI駆動イベント生成システム
import { AIProviderManager } from './ai-provider';

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
  backgroundInfo: string;
  stakeholders: string[];
  timeConstraint: string;
  aiGenerated: boolean;
  generationReason: string;
}

export class EventGenerator {
  private aiProvider: AIProviderManager;
  private eventHistory: GeneratedEvent[] = [];
  private emergencyEventThreshold = 0.1;

  constructor(aiProvider: AIProviderManager) {
    this.aiProvider = aiProvider;
    console.log('📰 AI駆動イベント生成システム初期化');
  }

  // メインイベント生成関数
  async generateEvent(context: EventGenerationContext): Promise<GeneratedEvent> {
    console.log('🎲 AI駆動イベント生成開始');
    console.log('ゲームフェーズ:', context.gamePhase);
    console.log('政治リスクレベル:', context.politicalTrends.riskLevel);

    try {
      // 緊急イベントの判定
      if (this.shouldGenerateEmergencyEvent(context)) {
        console.log('🚨 緊急イベント生成');
        return await this.generateEmergencyEvent(context);
      }

      // 通常イベントの生成
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
      console.error('❌ AI駆動イベント生成エラー:', error);
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

    return `あなたは日本の政治・経済・社会情勢の専門家AIです。現在の状況に基づいて、極めてリアルで専門的な政治イベントを生成してください。

## 現在の政治状況
- ターン: ${context.currentState.turn}/${context.currentState.maxTurns} (${phaseText})
- 支持率: ${context.currentState.approvalRating}% (${context.politicalTrends.approvalTrend})
- GDP: ${context.currentState.gdp}兆円 (${context.politicalTrends.economicTrend})
- 国債残高: ${context.currentState.nationalDebt}兆円 (対GDP比: ${Math.round((context.currentState.nationalDebt / context.currentState.gdp) * 100)}%)
- 科学技術力: ${context.currentState.technology}%
- 環境指標: ${context.currentState.environment}%
- 日経平均: ${context.currentState.stockPrice}円
- ドル円レート: ${context.currentState.usdJpyRate}円
- 外交関係: ${context.currentState.diplomacy}%
- 政治リスクレベル: ${context.politicalTrends.riskLevel}

## 時期・背景情報
- 現在時期: ${currentYear}年${currentMonth}月 (${seasonText})
- 国際情勢: ${context.globalContext.internationalTensions}
- 世界経済情勢: ${context.globalContext.economicClimate}
- 国内政治圧力: ${context.globalContext.domesticPressure}
- ゲームフェーズ: ${phaseText}

## 過去の政策履歴
- 過去のイベント: ${context.previousEvents.length > 0 ? context.previousEvents.slice(-3).join(', ') : 'なし'}
- 過去の政策選択: ${context.previousChoices.length > 0 ? context.previousChoices.slice(-3).join(', ') : 'なし'}

## 生成要求
現在の状況に適した高度に専門的で現実的な政治イベントを生成してください。以下の条件を満たすこと：

### 必須要件
1. **現実性**: 実際に起こりうる日本の政治・経済・社会問題
2. **専門性**: 具体的な省庁名、法律名、制度名、統計データを含む
3. **時宜性**: 現在の季節、政治情勢、国際情勢に適合
4. **継続性**: 過去の政策選択の結果として自然に発生する問題
5. **複雑性**: 複数の省庁、利害関係者、国際的要因が絡む複合的問題
6. **具体性**: 予算規模、実施期間、法的根拠、数値目標を明記

### 選択肢要件（必ず10個生成）
各選択肢は以下の政治的立場を反映し、150文字以上の詳細な説明を含むこと：

1. **右派・保守**: 市場原理重視、規制緩和、伝統的価値観
2. **左派・リベラル**: 社会保障拡充、政府介入、平等主義
3. **中道・穏健**: バランス重視、漸進的改革、現実的解決
4. **ポピュリスト**: 国民感情重視、直接給付、既存エリート批判
5. **テクノクラート**: データ駆動、科学的根拠、効率性追求
6. **ナショナリスト**: 国益優先、自国第一、主権重視
7. **プラグマティスト**: 実用性重視、結果重視、柔軟な政策運営
8. **急進・革新**: 抜本的変革、既存制度改革、大胆な構造改革
9. **国際協調派**: 多国間協力、グローバル視点、国際基準準拠
10. **地方分権派**: 地方自治重視、権限移譲、地域主導政策

### 各選択肢の必須要素
- 具体的な政策名・法律名
- 予算規模（兆円・億円単位）
- 実施期間（年月単位）
- 担当省庁（主管・関連省庁）
- 法的根拠（新法制定・既存法改正）
- 定量的目標（GDP成長率、失業率、CO2削減率等）
- 国際的影響・他国事例

### 専門用語の活用
- 経済: GDP、CPI、失業率、財政乗数、クラウディングアウト、量的緩和、YCC
- 行政: 政令、省令、通達、特別会計、一般会計、補正予算、概算要求
- 法律: 基本法、特別法、議員立法、内閣提出法案、修正案
- 国際: WTO、IMF、OECD、G7、G20、二国間協定、多国間枠組み、FTA、EPA

以下のJSON形式で返してください：
{
  "id": "ai_generated_YYYYMMDD_XXX",
  "title": "具体的なイベントタイトル（30文字以内）",
  "description": "詳細な状況説明（300-500文字、問題の背景・関係者の立場・時代背景・統計データを含む）",
  "category": "economy|diplomacy|social|environment|technology|security|disaster",
  "urgency": "low|medium|high|critical",
  "complexity": "moderate|complex",
  "options": [
    {
      "text": "【右派・保守】具体的な政策名を含む詳細な説明（150文字以上）",
      "type": "conservative",
      "politicalStance": "right",
      "policyDetails": {
        "policyName": "具体的な法律名・制度名",
        "budget": "具体的な予算額",
        "duration": "実施期間",
        "ministry": "担当省庁",
        "legalBasis": "法的根拠",
        "targetMetrics": "定量的目標"
      },
      "expectedEffects": {
        "approvalRating": 数値(-20から+20),
        "gdp": 数値(-50から+50),
        "nationalDebt": 数値(-100から+100),
        "technology": 数値(-15から+15),
        "environment": 数値(-15から+15),
        "stockPrice": 数値(-2000から+2000),
        "usdJpyRate": 数値(-10から+10),
        "diplomacy": 数値(-15から+15)
      }
    }
    // ... 残り9個の選択肢も同様の形式
  ],
  "backgroundInfo": {
    "historicalContext": "過去の類似政策とその結果",
    "currentSituation": "現在の状況（統計データ含む）",
    "internationalComparison": "他国の事例",
    "stakeholderPositions": "各ステークホルダーの立場"
  },
  "timeConstraint": {
    "urgency": "対応期限",
    "politicalDeadline": "政治的期限（国会会期、予算編成等）"
  },
  "generationReason": "このイベントを生成した理由（現在の政治状況との関連）"
}

## 重要な注意点
- 必ず10個すべての選択肢を生成すること
- 各選択肢は政治的立場が明確に異なること
- 予算規模、期間、省庁、法的根拠を必ず明記すること
- 現在の日本の政治制度・社会情勢に即した内容とすること
- 選択肢は実際の政治家が提案しうる現実的な内容とすること`;
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
    
    const prompt = `🚨 緊急事態が発生しました。以下の条件で緊急政治イベントを生成してください：

## 緊急事態情報
- 緊急事態タイプ: ${selectedEmergency.name} (${selectedExample})
- 現在の政治状況: 支持率${context.currentState.approvalRating}%、リスクレベル${context.politicalTrends.riskLevel}
- 政権フェーズ: ${this.getPhaseText(context.gamePhase)}

${this.buildEventGenerationPrompt(context)}

## 緊急事態特別要件
- タイトルに🚨を含めること
- urgencyを"critical"に設定
- complexityを"complex"に設定
- 即座の対応が必要な状況として設定
- 各選択肢は緊急時の政治的判断を反映
- 短期的影響と長期的影響の両方を考慮
- 国民の安全・安心に直結する内容
- メディア対応・国際的な注目も考慮

## 緊急時の政治的立場
1. **危機管理重視**: 迅速な対応、強力なリーダーシップ
2. **慎重派**: 情報収集優先、段階的対応
3. **国民保護優先**: 人命最優先、避難・救援重視
4. **経済影響最小化**: 経済活動継続、市場安定化
5. **国際協調**: 他国・国際機関との連携
6. **自力対応**: 国内資源での解決、自主防衛
7. **抜本対策**: 根本的解決、制度改革
8. **情報公開**: 透明性重視、国民への説明責任
9. **専門家主導**: 科学的根拠、専門知識活用
10. **政治的安定**: 政権維持、政治的混乱回避

緊急事態として適切な10個の選択肢を生成してください。`;

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

  // イベント検証と正規化
  private validateAndNormalizeEvent(event: any, context: EventGenerationContext): GeneratedEvent {
    // IDの生成（重複回避）
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substr(2, 3);
    const generatedId = 'ai_generated_' + timestamp + '_' + randomSuffix;

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

    // 背景情報の構造化
    const processedBackgroundInfo = typeof event.backgroundInfo === 'object' ? 
      event.backgroundInfo : {
        historicalContext: event.backgroundInfo || '現在の政治状況に基づく課題',
        currentSituation: `支持率${context.currentState.approvalRating}%、GDP${context.currentState.gdp}兆円の状況下での政治課題`,
        internationalComparison: '他国の類似事例を参考に政策を検討',
        stakeholderPositions: '各ステークホルダーの立場を考慮した政策選択が必要'
      };

    return {
      id: generatedId,
      title: event.title || '新たな政治課題',
      description: event.description || '現在の政治状況において新たな課題が浮上しました。適切な政策判断が求められています。',
      category: event.category || 'general',
      urgency: event.urgency || 'medium',
      complexity: event.complexity || 'moderate',
      options: processedOptions,
      backgroundInfo: processedBackgroundInfo,
      stakeholders: Array.isArray(event.stakeholders) ? event.stakeholders : ['政府', '国民', '企業', '地方自治体'],
      timeConstraint: typeof event.timeConstraint === 'object' ? 
        event.timeConstraint : {
          urgency: event.timeConstraint || '適切なタイミングで',
          politicalDeadline: '次回国会会期まで'
        },
      aiGenerated: true,
      generationReason: event.generationReason || `現在の政治状況（支持率${context.currentState.approvalRating}%、${context.politicalTrends.riskLevel}リスク）に基づいて生成`
    };
  }

  // フォールバックイベント生成（10個の選択肢）
  private generateFallbackEvent(context: EventGenerationContext): GeneratedEvent {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substr(2, 3);

    const fallbackEvents = [
      {
        title: '経済政策の抜本的見直し',
        description: `現在の支持率${context.currentState.approvalRating}%、GDP${context.currentState.gdp}兆円の状況下で、政府の経済政策の抜本的見直しが求められています。国債残高${context.currentState.nationalDebt}兆円、日経平均${context.currentState.stockPrice}円という経済指標を踏まえ、持続可能な成長戦略の策定が急務となっています。`,
        category: 'economy'
      },
      {
        title: '外交・安全保障政策の戦略的転換',
        description: `外交関係${context.currentState.diplomacy}%の現状において、国際情勢の変化に対応した外交・安全保障政策の戦略的転換が必要です。近隣諸国との関係調整、同盟国との連携強化、多国間外交の推進など、複合的なアプローチが求められています。`,
        category: 'diplomacy'
      },
      {
        title: '科学技術立国への政策転換',
        description: `技術力${context.currentState.technology}%の現状を踏まえ、AI、量子コンピューター、バイオテクノロジーなど先端技術分野での国際競争力強化が急務です。研究開発投資、人材育成、産学官連携の抜本的強化により、科学技術立国としての地位確立を目指す必要があります。`,
        category: 'technology'
      }
    ];

    const selectedEvent = fallbackEvents[Math.floor(Math.random() * fallbackEvents.length)];

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
      id: 'fallback_' + timestamp + '_' + randomSuffix,
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
        title: '🚨 緊急事態: 大規模システム障害',
        description: '政府の重要システムに大規模な障害が発生し、行政サービスが停止しています。',
        category: 'technology'
      },
      {
        title: '🚨 緊急事態: 経済指標の急激な悪化',
        description: '主要経済指標が急激に悪化し、市場に動揺が広がっています。',
        category: 'economy'
      },
      {
        title: '🚨 緊急事態: 国際関係の急激な悪化',
        description: '近隣国との関係が急激に悪化し、外交的な緊張が高まっています。',
        category: 'diplomacy'
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
          text: '緊急対策本部を設置し全力対応',
          type: 'moderate',
          politicalStance: 'center',
          expectedEffects: {
            approvalRating: Math.floor(Math.random() * 16) + 5,
            gdp: Math.floor(Math.random() * 21) - 10,
            nationalDebt: Math.floor(Math.random() * 51) + 30,
            technology: Math.floor(Math.random() * 11) + 5,
            environment: Math.floor(Math.random() * 7) - 3,
            stockPrice: Math.floor(Math.random() * 801) - 400,
            usdJpyRate: Math.floor(Math.random() * 11) - 5,
            diplomacy: Math.floor(Math.random() * 16) + 5
          }
        },
        {
          text: '段階的対応で慎重に進める',
          type: 'conservative',
          politicalStance: 'right',
          expectedEffects: {
            approvalRating: Math.floor(Math.random() * 11) + 2,
            gdp: Math.floor(Math.random() * 11) - 5,
            nationalDebt: Math.floor(Math.random() * 21) + 10,
            technology: Math.floor(Math.random() * 7) + 2,
            environment: Math.floor(Math.random() * 5) - 2,
            stockPrice: Math.floor(Math.random() * 401) - 200,
            usdJpyRate: Math.floor(Math.random() * 8) - 4,
            diplomacy: Math.floor(Math.random() * 11) + 2
          }
        },
        {
          text: '抜本的改革で根本解決を図る',
          type: 'radical' as const,
          politicalStance: 'far-left' as const,
          expectedEffects: {
            approvalRating: Math.floor(Math.random() * 21) - 5,
            gdp: Math.floor(Math.random() * 31) - 10,
            nationalDebt: Math.floor(Math.random() * 71) + 50,
            technology: Math.floor(Math.random() * 16) + 10,
            environment: Math.floor(Math.random() * 11) - 5,
            stockPrice: Math.floor(Math.random() * 1001) - 500,
            usdJpyRate: Math.floor(Math.random() * 6) - 3,
            diplomacy: Math.floor(Math.random() * 11) - 2
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

  // 統計情報取得
  getStatistics() {
    const stats = {
      totalEvents: this.eventHistory.length,
      categoryDistribution: {} as Record<string, number>,
      averageComplexity: 0,
      emergencyEventCount: 0
    };

    this.eventHistory.forEach(event => {
      stats.categoryDistribution[event.category] = (stats.categoryDistribution[event.category] || 0) + 1;
    });

    return stats;
  }
}