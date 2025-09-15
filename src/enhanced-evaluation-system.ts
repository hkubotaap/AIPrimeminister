// 拡張評価システム - 法治・ガバナンス、国民生活・文化、科学技術・産業政策指標
import { PolicyEffectAnalysis, PolicyContext } from './policy-analyzer';

// 7. 法治・ガバナンス指標
export interface GovernanceIndicators {
  corruptionPerceptionIndex: number; // 汚職認識指数（透明性）0-100
  judicialIndependence: number; // 司法の独立性（民主主義の基盤）0-100
  pressFreedomIndex: number; // 報道自由度指数（情報の自由）0-100
}

// 8. 国民生活・文化指標
export interface SocialCulturalIndicators {
  voterTurnout: number; // 投票率（民主主義の参加度）0-100%
  genderEqualityIndex: number; // 男女平等指数（社会の公平性）0-1
  suicideRate: number; // 自殺率（社会的幸福度）per 100,000
}

// 9. 科学技術・産業政策指標
export interface ScienceTechIndicators {
  rdSpendingGdpRatio: number; // 研究開発費対GDP比（科学技術力の基盤）%
  patentApplications: number; // 特許出願件数（技術競争力）
  digitalizationIndex: number; // デジタル化指数（DX進展度）0-100
}

// 拡張評価分析結果
export interface EnhancedPolicyAnalysis extends PolicyEffectAnalysis {
  enhancedEffects: {
    governance: GovernanceIndicators;
    socialCultural: SocialCulturalIndicators;
    scienceTech: ScienceTechIndicators;
  };
  overallScore: number; // 総合評価スコア 0-100
  categoryScores: {
    governance: number;
    socialCultural: number;
    scienceTech: number;
  };
  polscorResult?: any; // polscor.dat評価結果を後で追加
}

// 拡張政策文脈
export interface EnhancedPolicyContext extends PolicyContext {
  currentEnhancedState: {
    governance: GovernanceIndicators;
    socialCultural: SocialCulturalIndicators;
    scienceTech: ScienceTechIndicators;
  };
}

export class EnhancedEvaluationSystem {
  // 政策効果による指標変化を計算
  calculateEnhancedEffects(
    policyChoice: string,
    currentState: EnhancedPolicyContext['currentEnhancedState'],
    baseAnalysis: PolicyEffectAnalysis
  ): EnhancedPolicyAnalysis['enhancedEffects'] {

    const policyLower = policyChoice.toLowerCase();

    // 法治・ガバナンス指標への影響
    const governanceEffects = this.calculateGovernanceEffects(policyLower, currentState.governance);

    // 国民生活・文化指標への影響
    const socialCulturalEffects = this.calculateSocialCulturalEffects(policyLower, currentState.socialCultural);

    // 科学技術・産業政策指標への影響
    const scienceTechEffects = this.calculateScienceTechEffects(policyLower, currentState.scienceTech);

    return {
      governance: this.applyChanges(currentState.governance, governanceEffects),
      socialCultural: this.applyChanges(currentState.socialCultural, socialCulturalEffects),
      scienceTech: this.applyChanges(currentState.scienceTech, scienceTechEffects)
    };
  }

  // 法治・ガバナンス指標の効果計算
  private calculateGovernanceEffects(policyChoice: string, current: GovernanceIndicators): Partial<GovernanceIndicators> {
    const effects: Partial<GovernanceIndicators> = {};

    // 透明性・汚職対策関連
    if (policyChoice.includes('透明') || policyChoice.includes('公開') || policyChoice.includes('汚職対策')) {
      effects.corruptionPerceptionIndex = Math.floor(Math.random() * 8) + 3; // +3 to +10
    }

    // 司法制度改革関連
    if (policyChoice.includes('司法') || policyChoice.includes('法制度') || policyChoice.includes('裁判')) {
      effects.judicialIndependence = Math.floor(Math.random() * 6) + 2; // +2 to +7
    }

    // 報道・情報公開関連
    if (policyChoice.includes('報道') || policyChoice.includes('情報公開') || policyChoice.includes('メディア')) {
      effects.pressFreedomIndex = Math.floor(Math.random() * 7) + 2; // +2 to +8
    }

    // 権威主義的政策は負の影響
    if (policyChoice.includes('規制強化') || policyChoice.includes('監視') || policyChoice.includes('統制')) {
      effects.corruptionPerceptionIndex = -(Math.floor(Math.random() * 5) + 1); // -1 to -5
      effects.pressFreedomIndex = -(Math.floor(Math.random() * 8) + 2); // -2 to -9
    }

    return effects;
  }

  // 国民生活・文化指標の効果計算
  private calculateSocialCulturalEffects(policyChoice: string, current: SocialCulturalIndicators): Partial<SocialCulturalIndicators> {
    const effects: Partial<SocialCulturalIndicators> = {};

    // 民主主義参加促進
    if (policyChoice.includes('投票') || policyChoice.includes('参加') || policyChoice.includes('市民')) {
      effects.voterTurnout = Math.floor(Math.random() * 8) + 2; // +2 to +9
    }

    // 男女平等政策
    if (policyChoice.includes('男女平等') || policyChoice.includes('女性') || policyChoice.includes('ジェンダー')) {
      effects.genderEqualityIndex = (Math.floor(Math.random() * 6) + 2) / 100; // +0.02 to +0.07
    }

    // 社会保障・福祉政策
    if (policyChoice.includes('社会保障') || policyChoice.includes('福祉') || policyChoice.includes('医療')) {
      effects.suicideRate = -(Math.floor(Math.random() * 3) + 1); // -1 to -3 (減少が良い)
    }

    // メンタルヘルス・働き方改革
    if (policyChoice.includes('働き方改革') || policyChoice.includes('メンタルヘルス') || policyChoice.includes('労働環境')) {
      effects.suicideRate = -(Math.floor(Math.random() * 4) + 2); // -2 to -5
    }

    // 経済的困窮を招く政策は負の影響
    if (policyChoice.includes('増税') || policyChoice.includes('予算削減') || policyChoice.includes('緊縮')) {
      effects.suicideRate = Math.floor(Math.random() * 3) + 1; // +1 to +3 (増加は悪い)
    }

    return effects;
  }

  // 科学技術・産業政策指標の効果計算
  private calculateScienceTechEffects(policyChoice: string, current: ScienceTechIndicators): Partial<ScienceTechIndicators> {
    const effects: Partial<ScienceTechIndicators> = {};

    // 研究開発投資関連
    if (policyChoice.includes('研究開発') || policyChoice.includes('R&D') || policyChoice.includes('科学技術予算')) {
      effects.rdSpendingGdpRatio = (Math.floor(Math.random() * 4) + 1) / 10; // +0.1 to +0.4%
    }

    // 特許・イノベーション政策
    if (policyChoice.includes('特許') || policyChoice.includes('イノベーション') || policyChoice.includes('技術開発')) {
      effects.patentApplications = Math.floor(Math.random() * 5000) + 1000; // +1000 to +5999
    }

    // デジタル化・DX推進
    if (policyChoice.includes('デジタル') || policyChoice.includes('DX') || policyChoice.includes('IT')) {
      effects.digitalizationIndex = Math.floor(Math.random() * 12) + 3; // +3 to +14
    }

    // AI・先端技術
    if (policyChoice.includes('AI') || policyChoice.includes('人工知能') || policyChoice.includes('先端技術')) {
      effects.rdSpendingGdpRatio = (Math.floor(Math.random() * 6) + 2) / 10; // +0.2 to +0.7%
      effects.digitalizationIndex = Math.floor(Math.random() * 15) + 5; // +5 to +19
    }

    // 大学・教育制度改革
    if (policyChoice.includes('大学') || policyChoice.includes('教育') || policyChoice.includes('人材育成')) {
      effects.rdSpendingGdpRatio = (Math.floor(Math.random() * 3) + 1) / 10; // +0.1 to +0.3%
      effects.patentApplications = Math.floor(Math.random() * 3000) + 500; // +500 to +3499
    }

    return effects;
  }

  // 指標変化を適用
  private applyChanges<T extends GovernanceIndicators | SocialCulturalIndicators | ScienceTechIndicators>(current: T, changes: Partial<T>): T {
    const result = { ...current };

    Object.entries(changes).forEach(([key, change]) => {
      if (change !== undefined && change !== null && typeof change === 'number' && key in result) {
        (result as any)[key] = ((result as any)[key] as number) + change;

        // 各指標の上下限制約
        if (key === 'corruptionPerceptionIndex' || key === 'judicialIndependence' || key === 'pressFreedomIndex' || key === 'digitalizationIndex') {
          (result as any)[key] = Math.max(0, Math.min(100, (result as any)[key]));
        } else if (key === 'voterTurnout') {
          (result as any)[key] = Math.max(0, Math.min(100, (result as any)[key]));
        } else if (key === 'genderEqualityIndex') {
          (result as any)[key] = Math.max(0, Math.min(1, (result as any)[key]));
        } else if (key === 'suicideRate') {
          (result as any)[key] = Math.max(0, (result as any)[key]);
        } else if (key === 'rdSpendingGdpRatio') {
          (result as any)[key] = Math.max(0, Math.min(10, (result as any)[key]));
        } else if (key === 'patentApplications') {
          (result as any)[key] = Math.max(0, (result as any)[key]);
        }
      }
    });

    return result;
  }

  // カテゴリ別スコア計算
  calculateCategoryScores(enhancedEffects: EnhancedPolicyAnalysis['enhancedEffects']): EnhancedPolicyAnalysis['categoryScores'] {
    const governance = (
      enhancedEffects.governance.corruptionPerceptionIndex +
      enhancedEffects.governance.judicialIndependence +
      enhancedEffects.governance.pressFreedomIndex
    ) / 3;

    const socialCultural = (
      enhancedEffects.socialCultural.voterTurnout +
      (enhancedEffects.socialCultural.genderEqualityIndex * 100) +
      Math.max(0, 100 - enhancedEffects.socialCultural.suicideRate * 2) // 自殺率は逆算
    ) / 3;

    const scienceTech = (
      (enhancedEffects.scienceTech.rdSpendingGdpRatio * 20) + // 5%で100点換算
      Math.min(100, enhancedEffects.scienceTech.patentApplications / 500) + // 50,000件で100点換算
      enhancedEffects.scienceTech.digitalizationIndex
    ) / 3;

    return {
      governance: Math.round(Math.max(0, Math.min(100, governance))),
      socialCultural: Math.round(Math.max(0, Math.min(100, socialCultural))),
      scienceTech: Math.round(Math.max(0, Math.min(100, scienceTech)))
    };
  }

  // 総合スコア計算
  calculateOverallScore(categoryScores: EnhancedPolicyAnalysis['categoryScores']): number {
    return Math.round((categoryScores.governance + categoryScores.socialCultural + categoryScores.scienceTech) / 3);
  }

  // 指標名の日本語変換
  getIndicatorDisplayName(category: string, indicator: string): string {
    const names: Record<string, Record<string, string>> = {
      governance: {
        corruptionPerceptionIndex: '汚職認識指数',
        judicialIndependence: '司法の独立性',
        pressFreedomIndex: '報道自由度指数'
      },
      socialCultural: {
        voterTurnout: '投票率',
        genderEqualityIndex: '男女平等指数',
        suicideRate: '自殺率'
      },
      scienceTech: {
        rdSpendingGdpRatio: '研究開発費対GDP比',
        patentApplications: '特許出願件数',
        digitalizationIndex: 'デジタル化指数'
      }
    };

    return names[category]?.[indicator] || indicator;
  }

  // 指標の単位を取得
  getIndicatorUnit(category: string, indicator: string): string {
    const units: Record<string, Record<string, string>> = {
      governance: {
        corruptionPerceptionIndex: '点',
        judicialIndependence: '点',
        pressFreedomIndex: '点'
      },
      socialCultural: {
        voterTurnout: '%',
        genderEqualityIndex: '',
        suicideRate: '人/10万人'
      },
      scienceTech: {
        rdSpendingGdpRatio: '%',
        patentApplications: '件',
        digitalizationIndex: '点'
      }
    };

    return units[category]?.[indicator] || '';
  }

  // 評価コメント生成
  generateEvaluationComment(overallScore: number, categoryScores: EnhancedPolicyAnalysis['categoryScores']): string {
    let comment = '';

    if (overallScore >= 80) {
      comment = '優秀な政策効果です。';
    } else if (overallScore >= 60) {
      comment = '良好な政策効果です。';
    } else if (overallScore >= 40) {
      comment = '平均的な政策効果です。';
    } else {
      comment = '改善が必要な政策効果です。';
    }

    // 最も高いカテゴリを特定
    const maxScore = Math.max(categoryScores.governance, categoryScores.socialCultural, categoryScores.scienceTech);
    let strongArea = '';

    if (categoryScores.governance === maxScore) {
      strongArea = '法治・ガバナンス';
    } else if (categoryScores.socialCultural === maxScore) {
      strongArea = '国民生活・文化';
    } else {
      strongArea = '科学技術・産業政策';
    }

    comment += ` 特に${strongArea}分野で効果が期待されます。`;

    return comment;
  }
}