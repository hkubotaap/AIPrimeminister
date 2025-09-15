// 拡張政策分析システム - 既存システムと新指標の統合
import { PolicyAnalyzer, PolicyEffectAnalysis, PolicyContext } from './policy-analyzer';
import {
  EnhancedEvaluationSystem,
  EnhancedPolicyAnalysis,
  EnhancedPolicyContext,
  GovernanceIndicators,
  SocialCulturalIndicators,
  ScienceTechIndicators
} from './enhanced-evaluation-system';
import { PolicyScoreCalculator, PolicyScoreResult } from './policy-score-calculator';

export type { EnhancedPolicyAnalysis, EnhancedPolicyContext };
import { AIProviderManager } from './ai-provider';

export class EnhancedPolicyAnalyzer extends PolicyAnalyzer {
  private enhancedEvaluationSystem: EnhancedEvaluationSystem;
  private policyScoreCalculator: PolicyScoreCalculator;

  constructor(aiProvider: AIProviderManager) {
    super(aiProvider);
    this.enhancedEvaluationSystem = new EnhancedEvaluationSystem();
    this.policyScoreCalculator = new PolicyScoreCalculator();
    console.log('📊 拡張政策分析システム初期化（polscor.dat統合）');
  }

  // メイン拡張分析関数
  async analyzeEnhancedPolicyEffects(context: EnhancedPolicyContext): Promise<EnhancedPolicyAnalysis> {
    console.log('🔍 拡張政策効果分析開始:', context.policyChoice);

    try {
      // 基本分析を実行
      const baseAnalysis = await super.analyzePolicyEffects(context);

      // 拡張指標の効果を計算
      const enhancedEffects = this.enhancedEvaluationSystem.calculateEnhancedEffects(
        context.policyChoice,
        context.currentEnhancedState,
        baseAnalysis
      );

      // カテゴリ別スコアを計算
      const categoryScores = this.enhancedEvaluationSystem.calculateCategoryScores(enhancedEffects);

      // 総合スコアを計算
      const overallScore = this.enhancedEvaluationSystem.calculateOverallScore(categoryScores);

      // polscor.datベースの政策スコアを計算
      const polscorResult = this.policyScoreCalculator.calculatePolicyScore(
        context.policyChoice,
        baseAnalysis
      );

      // 拡張分析結果を構築
      const enhancedAnalysis: EnhancedPolicyAnalysis = {
        ...baseAnalysis,
        enhancedEffects,
        overallScore,
        categoryScores,
        polscorResult
      };

      console.log('✅ 拡張政策効果分析完了 - 総合スコア:', overallScore);
      return enhancedAnalysis;

    } catch (error) {
      console.error('❌ 拡張政策効果分析エラー:', error);
      return this.generateFallbackEnhancedAnalysis(context);
    }
  }

  // フォールバック拡張分析
  private generateFallbackEnhancedAnalysis(context: EnhancedPolicyContext): EnhancedPolicyAnalysis {
    console.log('🔄 フォールバック拡張政策効果分析を使用');

    // 基本分析のフォールバックを取得（プライベートメソッドのため、新規作成）
    const baseAnalysis = this.createFallbackAnalysis(context);

    // 簡易的な拡張効果を生成
    const enhancedEffects = this.enhancedEvaluationSystem.calculateEnhancedEffects(
      context.policyChoice,
      context.currentEnhancedState,
      baseAnalysis
    );

    const categoryScores = this.enhancedEvaluationSystem.calculateCategoryScores(enhancedEffects);
    const overallScore = this.enhancedEvaluationSystem.calculateOverallScore(categoryScores);

    // polscor.datベースのスコア計算
    const polscorResult = this.policyScoreCalculator.calculatePolicyScore(
      context.policyChoice,
      baseAnalysis
    );

    return {
      ...baseAnalysis,
      enhancedEffects,
      overallScore,
      categoryScores,
      polscorResult
    };
  }

  // 基本フォールバック分析の代替実装
  private createFallbackAnalysis(context: EnhancedPolicyContext): PolicyEffectAnalysis {
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

    // 政治トレンドによる調整
    if (context.politicalTrends.riskLevel === 'critical') {
      Object.keys(effects).forEach(key => {
        effects[key as keyof typeof effects] = Math.round(effects[key as keyof typeof effects] * 0.7);
      });
    }

    return {
      effects,
      reasoning: `政策「${context.policyChoice}」の効果を分析しました。現在の政治情勢と政策内容を考慮した結果です。`,
      confidence: Math.floor(Math.random() * 30) + 60, // 60-90%
      timeframe: 'short_term' as const,
      risks: ['政策実行の困難さ', '予期せぬ副作用'],
      opportunities: ['政策効果の拡大', '国民の理解促進']
    };
  }

  // 詳細評価レポート生成
  async generateDetailedEvaluationReport(analysis: EnhancedPolicyAnalysis, context: EnhancedPolicyContext): Promise<string> {
    let report = `## 政策評価レポート\n\n`;

    // 基本情報
    report += `**政策**: ${context.policyChoice}\n`;
    report += `**総合評価スコア**: ${analysis.overallScore}/100\n`;

    // polscor.datスコアがある場合は追加
    if (analysis.polscorResult) {
      report += `**政策スコア (polscor.dat基準)**: ${analysis.polscorResult.totalScore}/100\n`;
      report += `**政策評価**: ${analysis.polscorResult.evaluation}\n`;
    }

    report += `**評価コメント**: ${this.enhancedEvaluationSystem.generateEvaluationComment(analysis.overallScore, analysis.categoryScores)}\n\n`;

    // カテゴリ別評価
    report += `### カテゴリ別評価\n\n`;
    report += `- **法治・ガバナンス**: ${analysis.categoryScores.governance}/100\n`;
    report += `- **国民生活・文化**: ${analysis.categoryScores.socialCultural}/100\n`;
    report += `- **科学技術・産業政策**: ${analysis.categoryScores.scienceTech}/100\n\n`;

    // polscor.dat分野別評価
    if (analysis.polscorResult) {
      report += `### polscor.dat分野別評価（重み付け前）\n\n`;
      Object.entries(analysis.polscorResult.fieldScores).forEach(([fieldKey, score]) => {
        const fieldName = this.policyScoreCalculator.getFieldDisplayName(fieldKey);
        const weight = this.policyScoreCalculator.getFieldWeight(fieldKey);
        const weightedScore = analysis.polscorResult.weightedScores[fieldKey];
        report += `- **${fieldName}**: ${score}/100 (重み${(weight * 100).toFixed(0)}% → ${weightedScore.toFixed(1)}点)\n`;
      });
      report += `\n`;
    }

    // 詳細指標変化
    report += `### 詳細指標変化\n\n`;

    // 法治・ガバナンス指標
    report += `#### 7. 法治・ガバナンス\n`;
    report += this.formatIndicatorChanges('governance', context.currentEnhancedState.governance, analysis.enhancedEffects.governance);

    // 国民生活・文化指標
    report += `#### 8. 国民生活・文化\n`;
    report += this.formatIndicatorChanges('socialCultural', context.currentEnhancedState.socialCultural, analysis.enhancedEffects.socialCultural);

    // 科学技術・産業政策指標
    report += `#### 9. 科学技術・産業政策\n`;
    report += this.formatIndicatorChanges('scienceTech', context.currentEnhancedState.scienceTech, analysis.enhancedEffects.scienceTech);

    // 基本指標への影響
    report += `### 基本経済・政治指標への影響\n\n`;
    report += await super.generateEffectExplanation(analysis, context);

    // リスクと機会
    if (analysis.risks.length > 0) {
      report += `\n### 予想されるリスク\n\n`;
      analysis.risks.forEach((risk, index) => {
        report += `${index + 1}. ${risk}\n`;
      });
    }

    if (analysis.opportunities.length > 0) {
      report += `\n### 期待される機会\n\n`;
      analysis.opportunities.forEach((opportunity, index) => {
        report += `${index + 1}. ${opportunity}\n`;
      });
    }

    // 信頼度情報
    report += `\n### 分析信頼度\n\n`;
    report += `**信頼度**: ${analysis.confidence}%\n`;
    report += `**分析時間軸**: ${this.getTimeframeDescription(analysis.timeframe)}\n`;

    return report;
  }

  // 指標変化のフォーマット
  private formatIndicatorChanges(
    category: string,
    current: GovernanceIndicators | SocialCulturalIndicators | ScienceTechIndicators,
    newValues: GovernanceIndicators | SocialCulturalIndicators | ScienceTechIndicators
  ): string {
    let output = '';

    Object.entries(current).forEach(([key, currentValue]) => {
      const newValue = (newValues as any)[key];
      if (typeof currentValue === 'number' && typeof newValue === 'number') {
        const change = newValue - currentValue;
        const displayName = this.enhancedEvaluationSystem.getIndicatorDisplayName(category, key);
        const unit = this.enhancedEvaluationSystem.getIndicatorUnit(category, key);

        const changeText = change > 0 ? `+${change.toFixed(2)}` : change.toFixed(2);
        const arrow = change > 0 ? '↗️' : change < 0 ? '↘️' : '→';

        output += `- **${displayName}**: ${currentValue.toFixed(2)}${unit} → ${newValue.toFixed(2)}${unit} (${changeText}${unit}) ${arrow}\n`;
      }
    });

    output += '\n';
    return output;
  }

  // 時間軸の説明
  private getTimeframeDescription(timeframe: string): string {
    const descriptions = {
      immediate: '即座（1-3ヶ月）',
      short_term: '短期（3-12ヶ月）',
      long_term: '長期（1-3年）'
    };
    return descriptions[timeframe as keyof typeof descriptions] || timeframe;
  }

  // 初期拡張状態の生成（ゲーム開始時）
  static generateInitialEnhancedState(): EnhancedPolicyContext['currentEnhancedState'] {
    return {
      governance: {
        corruptionPerceptionIndex: 73, // 日本の実際の値を参考
        judicialIndependence: 78,
        pressFreedomIndex: 71
      },
      socialCultural: {
        voterTurnout: 52, // 最近の選挙投票率を参考
        genderEqualityIndex: 0.65, // 国際比較での日本の値
        suicideRate: 16.5 // 人口10万人あたり
      },
      scienceTech: {
        rdSpendingGdpRatio: 3.3, // 日本の実際の値
        patentApplications: 45000, // 年間特許出願件数（概算）
        digitalizationIndex: 68 // 国際比較での日本のDX指数
      }
    };
  }

  // 拡張状態の妥当性チェック
  validateEnhancedState(state: EnhancedPolicyContext['currentEnhancedState']): boolean {
    try {
      // 各カテゴリの値が妥当な範囲内かチェック
      const { governance, socialCultural, scienceTech } = state;

      // ガバナンス指標（0-100）
      if (governance.corruptionPerceptionIndex < 0 || governance.corruptionPerceptionIndex > 100) return false;
      if (governance.judicialIndependence < 0 || governance.judicialIndependence > 100) return false;
      if (governance.pressFreedomIndex < 0 || governance.pressFreedomIndex > 100) return false;

      // 社会・文化指標
      if (socialCultural.voterTurnout < 0 || socialCultural.voterTurnout > 100) return false;
      if (socialCultural.genderEqualityIndex < 0 || socialCultural.genderEqualityIndex > 1) return false;
      if (socialCultural.suicideRate < 0) return false;

      // 科学技術指標
      if (scienceTech.rdSpendingGdpRatio < 0 || scienceTech.rdSpendingGdpRatio > 10) return false;
      if (scienceTech.patentApplications < 0) return false;
      if (scienceTech.digitalizationIndex < 0 || scienceTech.digitalizationIndex > 100) return false;

      return true;
    } catch (error) {
      console.error('❌ 拡張状態の妥当性チェックエラー:', error);
      return false;
    }
  }

  // デバッグ用：現在の拡張状態を表示
  debugLogEnhancedState(state: EnhancedPolicyContext['currentEnhancedState']): void {
    console.log('🔍 現在の拡張指標状態:');
    console.log('法治・ガバナンス:', state.governance);
    console.log('国民生活・文化:', state.socialCultural);
    console.log('科学技術・産業政策:', state.scienceTech);
  }
}