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
    type: 'conservative' | 'progressive' | 'moderate' | 'radical';
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
  private emergencyEventThreshold = 0.15; // 15%の確率で緊急イベント

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
        throw new Error(`Server error: ${response.status}`);
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
        throw new Error(`Server error: ${response.status}`);
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

    return `あなたは日本の政治・経済・社会情勢の専門家AIです。現在の状況に基づいて、リアルな政治イベントを生成してください。

## 現在の政治状況
- ターン: ${context.currentState.turn}/${context.currentState.maxTurns} (${phaseText})
- 支持率: ${context.currentState.approvalRating}% (${context.politicalTrends.approvalTrend})
- GDP: ${context.currentState.gdp}兆円 (${context.politicalTrends.economicTrend})
- 国債: ${context.currentState.nationalDebt}兆円
- 技術力: ${context.currentState.technology}%
- 環境: ${context.currentState.environment}%
- 株価: ${context.currentState.stockPrice}円
- ドル円: ${context.currentState.usdJpyRate}円
- 外交: ${context.currentState.diplomacy}%
- リスクレベル: ${context.politicalTrends.riskLevel}

## 時期・背景
- 季節: ${seasonText}
- 国際情勢: ${context.globalContext.internationalTensions}
- 経済情勢: ${context.globalContext.economicClimate}
- 国内圧力: ${context.globalContext.domesticPressure}

## 過去のイベント
${context.previousEvents.length > 0 ? context.previousEvents.slice(-3).join(', ') : 'なし'}

## 過去の政策選択
${context.previousChoices.length > 0 ? context.previousChoices.slice(-3).join(', ') : 'なし'}

## 生成要求
現在の状況に適した政治イベントを生成してください。以下の条件を満たすこと：

1. **現実性**: 実際に起こりうる日本の政治・経済・社会問題
2. **時宜性**: 現在の季節や政治情勢に適合
3. **継続性**: 過去の選択や状況との整合性
4. **複雑性**: 単純すぎず、複雑すぎない適度な難易度
5. **多様性**: 過去のイベントと重複しない新しい視点

以下の形式でJSONレスポンスを返してください：

{
  "id": "ai_generated_YYYYMMDD_XXX",
  "title": "イベントタイトル（30文字以内）",
  "description": "詳細な状況説明（150-250文字）",
  "category": "economy|diplomacy|social|environment|technology|security|disaster",
  "urgency": "low|medium|high|critical",
  "complexity": "simple|moderate|complex",
  "options": [
    {
      "text": "選択肢1（保守的アプローチ）",
      "type": "conservative",
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
    },
    {
      "text": "選択肢2（革新的アプローチ）",
      "type": "progressive",
      "expectedEffects": { /* 同様の形式 */ }
    },
    {
      "text": "選択肢3（中道的アプローチ）",
      "type": "moderate",
      "expectedEffects": { /* 同様の形式 */ }
    }
  ],
  "backgroundInfo": "背景情報（100文字以内）",
  "stakeholders": ["関係者1", "関係者2", "関係者3"],
  "timeConstraint": "対応期限（例：即座に、1週間以内、1ヶ月以内）",
  "generationReason": "このイベントを生成した理由（100文字以内）"
}

## 重要な注意点
- 現在の支持率や経済状況を反映した現実的なイベント
- 過去の選択の結果として自然に発生するイベント
- 日本の政治制度や社会情勢に即した内容
- 選択肢は明確に異なるアプローチを提示
- 効果は現在の状況を考慮した現実的な範囲

JSONのみを返してください：`;
  }

  // 緊急イベント生成
  private async generateEmergencyEvent(context: EventGenerationContext): Promise<GeneratedEvent> {
    const emergencyTypes = [
      'natural_disaster', 'economic_crisis', 'diplomatic_crisis', 
      'security_threat', 'social_unrest', 'technological_crisis'
    ];
    
    const selectedType = emergencyTypes[Math.floor(Math.random() * emergencyTypes.length)];
    
    const prompt = `緊急事態が発生しました。以下の条件で緊急政治イベントを生成してください：

緊急事態タイプ: ${selectedType}
現在の政治状況: 支持率${context.currentState.approvalRating}%、リスクレベル${context.politicalTrends.riskLevel}

${this.buildEventGenerationPrompt(context)}

※ 緊急事態として、urgencyを"critical"に設定し、タイトルに🚨を含めてください。`;

    try {
      const currentProvider = this.aiProvider.getCurrentProvider();
      
      if (currentProvider === 'gemini') {
        return await this.generateWithGemini(context);
      } else if (currentProvider === 'ollama') {
        return await this.generateWithOllama(context);
      } else {
        return this.generateFallbackEmergencyEvent(context);
      }
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
    const generatedId = `ai_generated_${timestamp}_${randomSuffix}`;

    // 効果値の正規化
    const normalizeEffects = (effects: any) => {
      return {
        approvalRating: Math.max(-20, Math.min(20, Math.round(effects.approvalRating || 0))),
        gdp: Math.max(-50, Math.min(50, Math.round(effects.gdp || 0))),
        nationalDebt: Math.max(-100, Math.min(100, Math.round(effects.nationalDebt || 0))),
        technology: Math.max(-15, Math.min(15, Math.round(effects.technology || 0))),
        environment: Math.max(-15, Math.min(15, Math.round(effects.environment || 0))),
        stockPrice: Math.max(-2000, Math.min(2000, Math.round(effects.stockPrice || 0))),
        usdJpyRate: Math.max(-10, Math.min(10, Math.round(effects.usdJpyRate || 0))),
        diplomacy: Math.max(-15, Math.min(15, Math.round(effects.diplomacy || 0)))
      };
    };

    return {
      id: generatedId,
      title: event.title || '新たな政治課題',
      description: event.description || '政治的な課題が発生しました。適切な対応が求められています。',
      category: event.category || 'general',
      urgency: ['low', 'medium', 'high', 'critical'].includes(event.urgency) ? event.urgency : 'medium',
      complexity: ['simple', 'moderate', 'complex'].includes(event.complexity) ? event.complexity : 'moderate',
      options: (event.options || []).slice(0, 3).map((option: any) => ({
        text: option.text || '対応を検討する',
        type: ['conservative', 'progressive', 'moderate', 'radical'].includes(option.type) ? option.type : 'moderate',
        expectedEffects: normalizeEffects(option.expectedEffects || {})
      })),
      backgroundInfo: event.backgroundInfo || '詳細な背景情報は調査中です。',
      stakeholders: Array.isArray(event.stakeholders) ? event.stakeholders.slice(0, 5) : ['政府', '国民'],
      timeConstraint: event.timeConstraint || '適切なタイミングで',
      aiGenerated: true,
      generationReason: event.generationReason || `現在の政治状況（支持率${context.currentState.approvalRating}%、${context.politicalTrends.riskLevel}リスク）に基づいて生成`
    };
  }

  // フォールバックイベント生成
  private generateFallbackEvent(context: EventGenerationContext): GeneratedEvent {
    console.log('🔄 フォールバックイベント生成を使用');

    const fallbackEvents = [
      {
        title: '地方自治体からの予算要請',
        description: '複数の地方自治体から、インフラ整備や社会保障充実のための予算増額要請が寄せられています。地方の声にどう応えるかが問われています。',
        category: 'social'
      },
      {
        title: '新技術導入に関する議論',
        description: 'AI・IoT技術の急速な発展により、社会システムの変革が求められています。技術革新と雇用への影響のバランスが課題となっています。',
        category: 'technology'
      },
      {
        title: '国際会議での日本の立場',
        description: '重要な国際会議が開催され、日本の外交姿勢が注目されています。国際協調と国益のバランスを取る必要があります。',
        category: 'diplomacy'
      }
    ];

    const selectedEvent = fallbackEvents[Math.floor(Math.random() * fallbackEvents.length)];
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substr(2, 3);

    return {
      id: `fallback_${timestamp}_${randomSuffix}`,
      title: selectedEvent.title,
      description: selectedEvent.description,
      category: selectedEvent.category,
      urgency: 'medium',
      complexity: 'moderate',
      options: [
        {
          text: '積極的な対応を行う',
          type: 'progressive',
          expectedEffects: {
            approvalRating: Math.floor(Math.random() * 16) + 5,
            gdp: Math.floor(Math.random() * 21) - 5,
            nationalDebt: Math.floor(Math.random() * 81) + 20,
            technology: Math.floor(Math.random() * 11) + 2,
            environment: Math.floor(Math.random() * 11) - 2,
            stockPrice: Math.floor(Math.random() * 601) + 100,
            usdJpyRate: Math.floor(Math.random() * 7) - 3,
            diplomacy: Math.floor(Math.random() * 11) + 2
          }
        },
        {
          text: '慎重に検討する',
          type: 'conservative',
          expectedEffects: {
            approvalRating: Math.floor(Math.random() * 11) + 2,
            gdp: Math.floor(Math.random() * 11) - 2,
            nationalDebt: Math.floor(Math.random() * 31) + 5,
            technology: Math.floor(Math.random() * 7) - 1,
            environment: Math.floor(Math.random() * 7) - 1,
            stockPrice: Math.floor(Math.random() * 301) - 100,
            usdJpyRate: Math.floor(Math.random() * 5) - 2,
            diplomacy: Math.floor(Math.random() * 7) - 1
          }
        },
        {
          text: '関係者と協議して決定',
          type: 'moderate',
          expectedEffects: {
            approvalRating: Math.floor(Math.random() * 13) + 3,
            gdp: Math.floor(Math.random() * 15) - 3,
            nationalDebt: Math.floor(Math.random() * 51) + 10,
            technology: Math.floor(Math.random() * 9) + 1,
            environment: Math.floor(Math.random() * 9) + 1,
            stockPrice: Math.floor(Math.random() * 401) - 50,
            usdJpyRate: Math.floor(Math.random() * 6) - 2,
            diplomacy: Math.floor(Math.random() * 9) + 1
          }
        }
      ],
      backgroundInfo: '現在の政治情勢を踏まえた重要な課題です。',
      stakeholders: ['政府', '国民', '関係団体'],
      timeConstraint: '適切なタイミングで',
      aiGenerated: false,
      generationReason: 'AI生成が利用できないため、フォールバックイベントを使用'
    };
  }

  // フォールバック緊急イベント生成
  private generateFallbackEmergencyEvent(context: EventGenerationContext): GeneratedEvent {
    const emergencyEvents = [
      {
        title: '🚨 緊急事態：大規模システム障害',
        description: '政府の重要システムに大規模な障害が発生し、行政サービスが停止しています。迅速な対応と国民への説明が求められています。',
        category: 'technology'
      },
      {
        title: '🚨 緊急事態：経済指標の急激な悪化',
        description: '主要経済指標が急激に悪化し、市場に動揺が広がっています。緊急の経済対策が必要な状況です。',
        category: 'economy'
      },
      {
        title: '🚨 緊急事態：国際関係の急激な悪化',
        description: '近隣国との関係が急激に悪化し、外交的な緊張が高まっています。慎重かつ迅速な対応が求められています。',
        category: 'diplomacy'
      }
    ];

    const selectedEvent = emergencyEvents[Math.floor(Math.random() * emergencyEvents.length)];
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substr(2, 3);

    return {
      id: `emergency_fallback_${timestamp}_${randomSuffix}`,
      title: selectedEvent.title,
      description: selectedEvent.description,
      category: selectedEvent.category,
      urgency: 'critical',
      complexity: 'complex',
      options: [
        {
          text: '緊急対策本部を設置し全力対応',
          type: 'progressive',
          expectedEffects: {
            approvalRating: Math.floor(Math.random() * 21) + 10,
            gdp: Math.floor(Math.random() * 31) - 15,
            nationalDebt: Math.floor(Math.random() * 101) + 50,
            technology: Math.floor(Math.random() * 16) + 5,
            environment: Math.floor(Math.random() * 11) - 5,
            stockPrice: Math.floor(Math.random() * 1001) - 500,
            usdJpyRate: Math.floor(Math.random() * 11) - 5,
            diplomacy: Math.floor(Math.random() * 16) + 5
          }
        },
        {
          text: '段階的に対応策を実施',
          type: 'moderate',
          expectedEffects: {
            approvalRating: Math.floor(Math.random() * 16) + 5,
            gdp: Math.floor(Math.random() * 21) - 10,
            nationalDebt: Math.floor(Math.random() * 61) + 30,
            technology: Math.floor(Math.random() * 11) + 2,
            environment: Math.floor(Math.random() * 11) - 2,
            stockPrice: Math.floor(Math.random() * 601) - 300,
            usdJpyRate: Math.floor(Math.random() * 8) - 4,
            diplomacy: Math.floor(Math.random() * 11) + 2
          }
        },
        {
          text: '慎重に状況を分析してから対応',
          type: 'conservative',
          expectedEffects: {
            approvalRating: Math.floor(Math.random() * 21) - 5,
            gdp: Math.floor(Math.random() * 16) - 8,
            nationalDebt: Math.floor(Math.random() * 41) + 10,
            technology: Math.floor(Math.random() * 11) - 2,
            environment: Math.floor(Math.random() * 11) - 2,
            stockPrice: Math.floor(Math.random() * 801) - 400,
            usdJpyRate: Math.floor(Math.random() * 6) - 3,
            diplomacy: Math.floor(Math.random() * 11) - 2
          }
        }
      ],
      backgroundInfo: '緊急事態により迅速な判断が求められています。',
      stakeholders: ['政府', '国民', '関係機関', '国際社会'],
      timeConstraint: '即座に',
      aiGenerated: false,
      generationReason: '緊急事態が発生したため、フォールバック緊急イベントを使用'
    };
  }

  // ヘルパー関数
  private getSeasonText(season: string): string {
    const seasons = {
      spring: '春（新年度・予算審議期）',
      summer: '夏（参院選・政治的重要期）',
      autumn: '秋（臨時国会・政策転換期）',
      winter: '冬（通常国会準備・年末調整期）'
    };
    return seasons[season as keyof typeof seasons] || '通年';
  }

  private getPhaseText(phase: string): string {
    const phases = {
      early: '政権初期',
      middle: '政権中期',
      late: '政権終盤'
    };
    return phases[phase as keyof typeof phases] || '政権運営期';
  }

  // イベント履歴取得
  getEventHistory(): GeneratedEvent[] {
    return [...this.eventHistory];
  }

  // 統計情報取得
  getGenerationStats(): {
    totalGenerated: number;
    aiGenerated: number;
    fallbackGenerated: number;
    emergencyGenerated: number;
    categoryDistribution: Record<string, number>;
  } {
    const stats = {
      totalGenerated: this.eventHistory.length,
      aiGenerated: this.eventHistory.filter(e => e.aiGenerated).length,
      fallbackGenerated: this.eventHistory.filter(e => !e.aiGenerated).length,
      emergencyGenerated: this.eventHistory.filter(e => e.urgency === 'critical').length,
      categoryDistribution: {} as Record<string, number>
    };

    this.eventHistory.forEach(event => {
      stats.categoryDistribution[event.category] = (stats.categoryDistribution[event.category] || 0) + 1;
    });

    return stats;
  }
}