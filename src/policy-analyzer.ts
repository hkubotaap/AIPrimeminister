// AI駆動政策効果分析システム
import { AIProviderManager } from './ai-provider';

export interface PolicyEffectAnalysis {
  effects: {
    approvalRating: number;
    gdp: number;
    nationalDebt: number;
    technology: number;
    environment: number;
    stockPrice: number;
    usdJpyRate: number;
    diplomacy: number;
  };
  reasoning: string;
  confidence: number; // 0-100の信頼度
  timeframe: 'immediate' | 'short_term' | 'long_term';
  risks: string[];
  opportunities: string[];
}

export interface PolicyContext {
  eventTitle: string;
  eventDescription: string;
  policyChoice: string;
  currentState: {
    turn: number;
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
  previousPolicies: string[];
}

export class PolicyAnalyzer {
  private aiProvider: AIProviderManager;

  constructor(aiProvider: AIProviderManager) {
    this.aiProvider = aiProvider;
    console.log('📊 AI政策効果分析システム初期化');
  }

  // メイン分析関数
  async analyzePolicyEffects(context: PolicyContext): Promise<PolicyEffectAnalysis> {
    console.log('🔍 AI政策効果分析開始:', context.policyChoice);

    try {
      // AIプロバイダーに応じて分析手法を選択
      const currentProvider = this.aiProvider.getCurrentProvider();
      
      switch (currentProvider) {
        case 'gemini':
          return await this.analyzeWithGemini(context);
        case 'ollama':
          return await this.analyzeWithOllama(context);
        default:
          return this.generateFallbackAnalysis(context);
      }
    } catch (error) {
      console.error('❌ AI政策効果分析エラー:', error);
      return this.generateFallbackAnalysis(context);
    }
  }

  // Gemini APIを使用した分析
  private async analyzeWithGemini(context: PolicyContext): Promise<PolicyEffectAnalysis> {
    const prompt = this.buildAnalysisPrompt(context);
    
    try {
      // サーバーサイドプロキシ経由でGemini APIを呼び出し
      const response = await fetch('/api/analyze-policy-effects', {
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
      
      if (data.success && data.analysis) {
        console.log('✅ Gemini政策効果分析成功');
        return this.validateAndNormalizeAnalysis(data.analysis, context);
      } else {
        throw new Error('Invalid response from Gemini API');
      }
    } catch (error) {
      console.error('❌ Gemini政策効果分析エラー:', error);
      return this.generateFallbackAnalysis(context);
    }
  }

  // Ollama APIを使用した分析
  private async analyzeWithOllama(context: PolicyContext): Promise<PolicyEffectAnalysis> {
    const prompt = this.buildAnalysisPrompt(context);
    
    try {
      // サーバーサイドプロキシ経由でOllama APIを呼び出し
      const response = await fetch('/api/ollama/analyze-policy-effects', {
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
      
      if (data.success && data.analysis) {
        console.log('✅ Ollama政策効果分析成功');
        return this.validateAndNormalizeAnalysis(data.analysis, context);
      } else {
        throw new Error('Invalid response from Ollama API');
      }
    } catch (error) {
      console.error('❌ Ollama政策効果分析エラー:', error);
      return this.generateFallbackAnalysis(context);
    }
  }

  // 分析プロンプト構築
  private buildAnalysisPrompt(context: PolicyContext): string {
    return `あなたは日本の政治・経済の専門家AIです。以下の政策選択の効果を詳細に分析してください。

## 現在の状況
- ターン: ${context.currentState.turn}/6
- 支持率: ${context.currentState.approvalRating}%
- GDP: ${context.currentState.gdp}兆円
- 国債: ${context.currentState.nationalDebt}兆円
- 技術力: ${context.currentState.technology}%
- 環境: ${context.currentState.environment}%
- 株価: ${context.currentState.stockPrice}円
- ドル円レート: ${context.currentState.usdJpyRate}円
- 外交: ${context.currentState.diplomacy}%

## 政治トレンド
- 支持率トレンド: ${context.politicalTrends.approvalTrend}
- 経済トレンド: ${context.politicalTrends.economicTrend}
- リスクレベル: ${context.politicalTrends.riskLevel}

## 発生した問題
**${context.eventTitle}**
${context.eventDescription}

## 選択した政策
${context.policyChoice}

## 過去の政策履歴
${context.previousPolicies.length > 0 ? context.previousPolicies.join(', ') : 'なし'}

## 分析要求
以下の形式でJSONレスポンスを返してください：

{
  "effects": {
    "approvalRating": 数値変化(-30から+30),
    "gdp": 数値変化(-100から+100),
    "nationalDebt": 数値変化(-200から+200),
    "technology": 数値変化(-20から+20),
    "environment": 数値変化(-20から+20),
    "stockPrice": 数値変化(-3000から+3000),
    "usdJpyRate": 数値変化(-15から+15),
    "diplomacy": 数値変化(-20から+20)
  },
  "reasoning": "政策効果の詳細な分析理由（200文字以内）",
  "confidence": 信頼度(0-100),
  "timeframe": "immediate|short_term|long_term",
  "risks": ["リスク1", "リスク2"],
  "opportunities": ["機会1", "機会2"]
}

## 分析のポイント
1. 現在の政治・経済状況を考慮
2. 政策の実現可能性を評価
3. 短期・長期の影響を区別
4. 国際情勢や市場反応を予測
5. 過去の類似政策の効果を参考
6. 現実的な数値範囲で効果を算出

JSONのみを返してください：`;
  }

  // 分析結果の検証と正規化
  private validateAndNormalizeAnalysis(analysis: any, context: PolicyContext): PolicyEffectAnalysis {
    // 数値の範囲チェックと正規化
    const normalizeValue = (value: number, min: number, max: number): number => {
      return Math.max(min, Math.min(max, Math.round(value || 0)));
    };

    // 現在の状況に基づく動的調整
    const adjustForContext = (baseValue: number, indicator: string): number => {
      let adjustment = 0;
      
      // 政治トレンドによる調整
      if (context.politicalTrends.riskLevel === 'critical') {
        adjustment -= Math.abs(baseValue) * 0.2; // リスクが高い時は効果を減少
      } else if (context.politicalTrends.riskLevel === 'low') {
        adjustment += Math.abs(baseValue) * 0.1; // リスクが低い時は効果を増加
      }

      // 支持率トレンドによる調整
      if (indicator === 'approvalRating') {
        if (context.politicalTrends.approvalTrend === 'falling' && baseValue > 0) {
          adjustment -= baseValue * 0.3; // 下降トレンド時は正の効果を減少
        } else if (context.politicalTrends.approvalTrend === 'rising' && baseValue > 0) {
          adjustment += baseValue * 0.2; // 上昇トレンド時は正の効果を増加
        }
      }

      // 経済トレンドによる調整
      if (['gdp', 'stockPrice'].includes(indicator)) {
        if (context.politicalTrends.economicTrend === 'recession' && baseValue > 0) {
          adjustment -= baseValue * 0.4; // 不況時は経済効果を減少
        } else if (context.politicalTrends.economicTrend === 'growth' && baseValue > 0) {
          adjustment += baseValue * 0.3; // 成長時は経済効果を増加
        }
      }

      return Math.round(baseValue + adjustment);
    };

    const normalizedEffects = {
      approvalRating: adjustForContext(normalizeValue(analysis.effects?.approvalRating, -30, 30), 'approvalRating'),
      gdp: adjustForContext(normalizeValue(analysis.effects?.gdp, -100, 100), 'gdp'),
      nationalDebt: normalizeValue(analysis.effects?.nationalDebt, -200, 200),
      technology: normalizeValue(analysis.effects?.technology, -20, 20),
      environment: normalizeValue(analysis.effects?.environment, -20, 20),
      stockPrice: adjustForContext(normalizeValue(analysis.effects?.stockPrice, -3000, 3000), 'stockPrice'),
      usdJpyRate: normalizeValue(analysis.effects?.usdJpyRate, -15, 15),
      diplomacy: normalizeValue(analysis.effects?.diplomacy, -20, 20)
    };

    return {
      effects: normalizedEffects,
      reasoning: analysis.reasoning || '政策効果を分析しました。',
      confidence: normalizeValue(analysis.confidence, 0, 100),
      timeframe: ['immediate', 'short_term', 'long_term'].includes(analysis.timeframe) 
        ? analysis.timeframe 
        : 'short_term',
      risks: Array.isArray(analysis.risks) ? analysis.risks.slice(0, 3) : [],
      opportunities: Array.isArray(analysis.opportunities) ? analysis.opportunities.slice(0, 3) : []
    };
  }

  // フォールバック分析（AIが利用できない場合）
  private generateFallbackAnalysis(context: PolicyContext): PolicyEffectAnalysis {
    console.log('🔄 フォールバック政策効果分析を使用');

    // 政策内容に基づく簡易分析
    const policyLower = context.policyChoice.toLowerCase();
    
    // キーワードベースの効果算出
    let effects = {
      approvalRating: 0,
      gdp: 0,
      nationalDebt: 0,
      technology: 0,
      environment: 0,
      stockPrice: 0,
      usdJpyRate: 0,
      diplomacy: 0
    };

    // 経済関連キーワード
    if (policyLower.includes('投資') || policyLower.includes('予算')) {
      effects.gdp += Math.floor(Math.random() * 20) + 5;
      effects.nationalDebt += Math.floor(Math.random() * 80) + 20;
      effects.stockPrice += Math.floor(Math.random() * 600) + 200;
    }

    // 外交関連キーワード
    if (policyLower.includes('外交') || policyLower.includes('国際') || policyLower.includes('協力')) {
      effects.diplomacy += Math.floor(Math.random() * 15) + 5;
      effects.approvalRating += Math.floor(Math.random() * 8) + 2;
    }

    // 環境関連キーワード
    if (policyLower.includes('環境') || policyLower.includes('脱炭素') || policyLower.includes('再生可能')) {
      effects.environment += Math.floor(Math.random() * 15) + 5;
      effects.technology += Math.floor(Math.random() * 10) + 3;
    }

    // 技術関連キーワード
    if (policyLower.includes('デジタル') || policyLower.includes('AI') || policyLower.includes('技術')) {
      effects.technology += Math.floor(Math.random() * 15) + 5;
      effects.gdp += Math.floor(Math.random() * 12) + 3;
    }

    // 慎重な政策
    if (policyLower.includes('慎重') || policyLower.includes('様子見') || policyLower.includes('検討')) {
      effects.approvalRating += Math.floor(Math.random() * 6) + 1;
      effects.nationalDebt += Math.floor(Math.random() * 20);
    }

    // 政治トレンドによる調整
    if (context.politicalTrends.riskLevel === 'critical') {
      Object.keys(effects).forEach(key => {
        effects[key as keyof typeof effects] = Math.round(effects[key as keyof typeof effects] * 0.7);
      });
    }

    // ランダム要素を追加
    Object.keys(effects).forEach(key => {
      const randomAdjustment = Math.floor(Math.random() * 11) - 5; // -5 to +5
      effects[key as keyof typeof effects] += randomAdjustment;
    });

    return {
      effects,
      reasoning: `政策「${context.policyChoice}」の効果を分析しました。現在の政治情勢と政策内容を考慮した結果です。`,
      confidence: Math.floor(Math.random() * 30) + 60, // 60-90%
      timeframe: 'short_term',
      risks: ['政策実行の困難さ', '予期せぬ副作用'],
      opportunities: ['政策効果の拡大', '国民の理解促進']
    };
  }

  // 政策効果の詳細説明生成
  async generateEffectExplanation(analysis: PolicyEffectAnalysis, context: PolicyContext): Promise<string> {
    const significantEffects = [];
    
    Object.entries(analysis.effects).forEach(([key, value]) => {
      if (Math.abs(value) >= 5) {
        const indicator = this.getIndicatorName(key);
        const direction = value > 0 ? '上昇' : '下降';
        const magnitude = Math.abs(value) >= 15 ? '大幅' : Math.abs(value) >= 10 ? '中程度' : '軽微';
        significantEffects.push(`${indicator}が${magnitude}に${direction}（${value > 0 ? '+' : ''}${value}）`);
      }
    });

    let explanation = `政策「${context.policyChoice}」の分析結果：\n`;
    
    if (significantEffects.length > 0) {
      explanation += `主な効果：${significantEffects.join('、')}\n`;
    }
    
    explanation += `\n${analysis.reasoning}`;
    
    if (analysis.confidence < 70) {
      explanation += `\n※ 信頼度${analysis.confidence}% - 不確実性が高い分析結果です`;
    }

    return explanation;
  }

  // 指標名の日本語変換
  private getIndicatorName(key: string): string {
    const names: Record<string, string> = {
      approvalRating: '支持率',
      gdp: 'GDP',
      nationalDebt: '国債',
      technology: '技術力',
      environment: '環境指標',
      stockPrice: '株価',
      usdJpyRate: 'ドル円レート',
      diplomacy: '外交関係'
    };
    return names[key] || key;
  }
}