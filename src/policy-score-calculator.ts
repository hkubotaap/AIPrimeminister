// 政策スコア計算システム（polscor.datベース）
import { PolicyEffectAnalysis } from './policy-analyzer';

// 評価分野の定義（polscor.datに基づく）
export interface PolicyFieldWeights {
  economic: number;      // 経済政策 15%
  fiscal: number;        // 財政・税制 10%
  welfare: number;       // 社会保障・福祉 10%
  education: number;     // 教育 10%
  diplomacy: number;     // 外交・安全保障 10%
  environment: number;   // 環境・エネルギー 10%
  governance: number;    // 法治・ガバナンス 10%
  social: number;        // 国民生活・文化 10%
  technology: number;    // 科学技術・産業政策 10%
  information: number;   // 情報・メディア環境 5%
}

// 各分野のパラメータ
export interface PolicyFieldParameters {
  economic: {
    gdpGrowth: number;           // GDP成長率
    employmentQuality: number;   // 雇用の質
    inequality: number;          // 格差
    priceStability: number;      // 物価安定
    industrialTransformation: number; // 産業構造転換
  };
  fiscal: {
    debtGdpRatio: number;        // 債務残高対GDP比
    fiscalBalance: number;       // 財政収支
    taxFairness: number;         // 税制の公平性
    socialSpending: number;      // 社会保障支出
    localFiscalIndependence: number; // 地方財政自立度
  };
  welfare: {
    birthRate: number;           // 出生率
    careSystem: number;          // 介護体制
    medicalAccess: number;       // 医療アクセス
    povertyRate: number;         // 貧困率
    socialInclusion: number;     // 社会的包摂
  };
  education: {
    academicAbility: number;     // 学力
    educationCostBurden: number; // 教育費負担
    teacherQuality: number;      // 教師の質
    ictEducation: number;        // ICT教育
    recurrentEducation: number;  // リカレント教育
  };
  diplomacy: {
    treatyCompliance: number;    // 条約履行
    defenseSpending: number;     // 防衛費
    cyberDefense: number;        // サイバー防衛力
    diplomaticTrust: number;     // 外交信頼度
    overseasProtection: number;  // 在外邦人保護
  };
  environment: {
    renewableRatio: number;      // 再エネ比率
    energySelfSufficiency: number; // エネルギー自給率
    co2Efficiency: number;       // CO₂効率
    disasterResponse: number;    // 防災対応
    biodiversity: number;        // 生物多様性
  };
  governance: {
    corruptionIndex: number;     // 汚職指数
    politicalTransparency: number; // 政治資金透明性
    judicialIndependence: number; // 司法独立性
    administrativeOpenness: number; // 行政公開度
    administrativeEfficiency: number; // 行政効率
  };
  social: {
    voterTurnout: number;        // 投票率
    genderEquality: number;      // 男女平等指数
    suicideRate: number;         // 自殺率
    regionalDisparity: number;   // 地域格差
    immigrantIntegration: number; // 移民統合度
  };
  technology: {
    rdSpending: number;          // 研究開発費
    patents: number;             // 特許件数
    digitalTransformation: number; // DX指数
    startupRate: number;         // スタートアップ率
    researcherFlow: number;      // 研究者流出入
  };
  information: {
    pressFreedom: number;        // 報道自由度
    snsRegulations: number;      // SNS規制件数
    fakeNewsSpread: number;      // フェイク拡散件数
    mediaMonopoly: number;       // メディア寡占度
    informationTrust: number;    // 情報信頼度
  };
}

// 政策スコア計算結果
export interface PolicyScoreResult {
  fieldScores: Record<string, number>; // 各分野のスコア（100点満点）
  weightedScores: Record<string, number>; // 重み付け後のスコア
  totalScore: number; // 総合スコア（100点満点）
  evaluation: string; // 評価コメント
  fieldDetails: PolicyFieldParameters;
}

export class PolicyScoreCalculator {
  // デフォルトの重み付け（polscor.datに基づく）
  private readonly fieldWeights: PolicyFieldWeights = {
    economic: 0.15,      // 15%
    fiscal: 0.10,        // 10%
    welfare: 0.10,       // 10%
    education: 0.10,     // 10%
    diplomacy: 0.10,     // 10%
    environment: 0.10,   // 10%
    governance: 0.10,    // 10%
    social: 0.10,        // 10%
    technology: 0.10,    // 10%
    information: 0.05    // 5%
  };

  // 初期パラメータ値（日本の現状を基準とした仮想値）
  private baselineParameters: PolicyFieldParameters = {
    economic: {
      gdpGrowth: 12,               // 1.2%成長 → 12点
      employmentQuality: 14,       // 雇用の質やや良好 → 14点
      inequality: 8,               // 格差問題 → 8点
      priceStability: 16,          // 物価安定 → 16点
      industrialTransformation: 10 // 産業転換途上 → 10点
    },
    fiscal: {
      debtGdpRatio: 3,            // 債務残高高い → 3点
      fiscalBalance: 5,           // 財政赤字 → 5点
      taxFairness: 12,            // 税制公平性中程度 → 12点
      socialSpending: 15,         // 社会保障充実 → 15点
      localFiscalIndependence: 8  // 地方財政自立度低 → 8点
    },
    welfare: {
      birthRate: 6,               // 出生率低下 → 6点
      careSystem: 11,             // 介護体制課題あり → 11点
      medicalAccess: 17,          // 医療アクセス良好 → 17点
      povertyRate: 13,            // 貧困率中程度 → 13点
      socialInclusion: 9          // 社会的包摂課題 → 9点
    },
    education: {
      academicAbility: 16,        // 学力高水準 → 16点
      educationCostBurden: 7,     // 教育費負担重い → 7点
      teacherQuality: 14,         // 教師の質良好 → 14点
      ictEducation: 11,           // ICT教育発展途上 → 11点
      recurrentEducation: 8       // リカレント教育課題 → 8点
    },
    diplomacy: {
      treatyCompliance: 15,       // 条約履行良好 → 15点
      defenseSpending: 9,         // 防衛費制約 → 9点
      cyberDefense: 10,           // サイバー防衛発展途上 → 10点
      diplomaticTrust: 13,        // 外交信頼度中程度 → 13点
      overseasProtection: 12      // 在外邦人保護体制 → 12点
    },
    environment: {
      renewableRatio: 8,          // 再エネ比率低 → 8点
      energySelfSufficiency: 6,   // エネルギー自給率低 → 6点
      co2Efficiency: 11,          // CO₂効率中程度 → 11点
      disasterResponse: 16,       // 防災対応優秀 → 16点
      biodiversity: 9             // 生物多様性課題 → 9点
    },
    governance: {
      corruptionIndex: 14,        // 汚職レベル低 → 14点
      politicalTransparency: 9,   // 政治資金透明性課題 → 9点
      judicialIndependence: 13,   // 司法独立性中程度 → 13点
      administrativeOpenness: 10, // 行政公開度中程度 → 10点
      administrativeEfficiency: 11 // 行政効率中程度 → 11点
    },
    social: {
      voterTurnout: 10,           // 投票率低下 → 10点
      genderEquality: 7,          // 男女平等課題 → 7点
      suicideRate: 8,             // 自殺率高 → 8点
      regionalDisparity: 9,       // 地域格差 → 9点
      immigrantIntegration: 12    // 移民統合度中程度 → 12点
    },
    technology: {
      rdSpending: 16,             // 研究開発費高水準 → 16点
      patents: 15,                // 特許件数多 → 15点
      digitalTransformation: 10,  // DX指数中程度 → 10点
      startupRate: 8,             // スタートアップ率低 → 8点
      researcherFlow: 11          // 研究者流出入バランス → 11点
    },
    information: {
      pressFreedom: 12,           // 報道自由度中程度 → 12点
      snsRegulations: 14,         // SNS規制適度 → 14点
      fakeNewsSpread: 10,         // フェイク拡散中程度 → 10点
      mediaMonopoly: 8,           // メディア寡占度高 → 8点
      informationTrust: 11        // 情報信頼度中程度 → 11点
    }
  };

  constructor() {
    console.log('📊 政策スコア計算システム初期化（polscor.datベース）');
  }

  // 政策選択に基づくスコア計算
  calculatePolicyScore(
    policyChoice: string,
    baseAnalysis: PolicyEffectAnalysis,
    currentParameters?: Partial<PolicyFieldParameters>
  ): PolicyScoreResult {
    console.log('🔍 政策スコア計算開始:', policyChoice);

    // 現在のパラメータを取得（更新があれば適用）
    const parameters = this.updateParametersFromPolicy(
      policyChoice,
      currentParameters || this.baselineParameters
    );

    // 各分野のスコアを計算
    const fieldScores = this.calculateFieldScores(parameters);

    // 重み付けスコアを計算
    const weightedScores = this.calculateWeightedScores(fieldScores);

    // 総合スコアを計算
    const totalScore = this.calculateTotalScore(weightedScores);

    // 評価コメントを生成
    const evaluation = this.generateEvaluation(totalScore, fieldScores);

    const result: PolicyScoreResult = {
      fieldScores,
      weightedScores,
      totalScore,
      evaluation,
      fieldDetails: parameters
    };

    console.log('✅ 政策スコア計算完了 - 総合スコア:', totalScore);
    return result;
  }

  // 政策選択に基づくパラメータ更新
  private updateParametersFromPolicy(
    policyChoice: string,
    baseParameters: PolicyFieldParameters | Partial<PolicyFieldParameters>
  ): PolicyFieldParameters {
    // ディープコピーを作成
    const parameters: PolicyFieldParameters = JSON.parse(JSON.stringify({
      ...this.baselineParameters,
      ...baseParameters
    }));

    const policyLower = policyChoice.toLowerCase();

    // 経済政策関連の更新
    if (policyLower.includes('経済') || policyLower.includes('投資') || policyLower.includes('gdp')) {
      parameters.economic.gdpGrowth += Math.floor(Math.random() * 6) + 2; // +2~7
      parameters.economic.industrialTransformation += Math.floor(Math.random() * 4) + 1; // +1~4
    }

    // 財政政策関連の更新
    if (policyLower.includes('財政') || policyLower.includes('税') || policyLower.includes('予算')) {
      parameters.fiscal.fiscalBalance += Math.floor(Math.random() * 5) + 1; // +1~5
      parameters.fiscal.taxFairness += Math.floor(Math.random() * 3) + 1; // +1~3
    }

    // 社会保障・福祉関連の更新
    if (policyLower.includes('社会保障') || policyLower.includes('福祉') || policyLower.includes('介護')) {
      parameters.welfare.careSystem += Math.floor(Math.random() * 5) + 2; // +2~6
      parameters.welfare.socialInclusion += Math.floor(Math.random() * 4) + 1; // +1~4
    }

    // 教育関連の更新
    if (policyLower.includes('教育') || policyLower.includes('学校') || policyLower.includes('ict')) {
      parameters.education.ictEducation += Math.floor(Math.random() * 6) + 3; // +3~8
      parameters.education.recurrentEducation += Math.floor(Math.random() * 4) + 2; // +2~5
    }

    // 外交・安全保障関連の更新
    if (policyLower.includes('外交') || policyLower.includes('防衛') || policyLower.includes('国際')) {
      parameters.diplomacy.diplomaticTrust += Math.floor(Math.random() * 5) + 2; // +2~6
      parameters.diplomacy.cyberDefense += Math.floor(Math.random() * 4) + 2; // +2~5
    }

    // 環境・エネルギー関連の更新
    if (policyLower.includes('環境') || policyLower.includes('再生可能') || policyLower.includes('脱炭素')) {
      parameters.environment.renewableRatio += Math.floor(Math.random() * 7) + 3; // +3~9
      parameters.environment.co2Efficiency += Math.floor(Math.random() * 5) + 2; // +2~6
    }

    // 法治・ガバナンス関連の更新
    if (policyLower.includes('司法') || policyLower.includes('透明') || policyLower.includes('汚職')) {
      parameters.governance.politicalTransparency += Math.floor(Math.random() * 6) + 3; // +3~8
      parameters.governance.judicialIndependence += Math.floor(Math.random() * 4) + 2; // +2~5
    }

    // 国民生活・文化関連の更新
    if (policyLower.includes('男女平等') || policyLower.includes('投票') || policyLower.includes('地域')) {
      parameters.social.genderEquality += Math.floor(Math.random() * 5) + 3; // +3~7
      parameters.social.voterTurnout += Math.floor(Math.random() * 4) + 2; // +2~5
    }

    // 科学技術・産業政策関連の更新
    if (policyLower.includes('研究') || policyLower.includes('特許') || policyLower.includes('dx')) {
      parameters.technology.rdSpending += Math.floor(Math.random() * 4) + 2; // +2~5
      parameters.technology.digitalTransformation += Math.floor(Math.random() * 6) + 4; // +4~9
    }

    // 情報・メディア関連の更新
    if (policyLower.includes('報道') || policyLower.includes('メディア') || policyLower.includes('情報')) {
      parameters.information.pressFreedom += Math.floor(Math.random() * 5) + 2; // +2~6
      parameters.information.informationTrust += Math.floor(Math.random() * 4) + 2; // +2~5
    }

    // 各パラメータを0-20の範囲に制限
    this.clampParameters(parameters);

    return parameters;
  }

  // パラメータの範囲制限
  private clampParameters(parameters: PolicyFieldParameters): void {
    Object.keys(parameters).forEach(fieldKey => {
      const field = parameters[fieldKey as keyof PolicyFieldParameters] as Record<string, number>;
      Object.keys(field).forEach(paramKey => {
        field[paramKey] = Math.max(0, Math.min(20, field[paramKey]));
      });
    });
  }

  // 各分野のスコア計算（各分野100点満点）
  private calculateFieldScores(parameters: PolicyFieldParameters): Record<string, number> {
    const fieldScores: Record<string, number> = {};

    Object.keys(parameters).forEach(fieldKey => {
      const field = parameters[fieldKey as keyof PolicyFieldParameters] as Record<string, number>;
      const fieldTotal = Object.values(field).reduce((sum, value) => sum + value, 0);
      fieldScores[fieldKey] = fieldTotal; // 5パラメータ × 20点 = 100点満点
    });

    return fieldScores;
  }

  // 重み付けスコア計算
  private calculateWeightedScores(fieldScores: Record<string, number>): Record<string, number> {
    const weightedScores: Record<string, number> = {};

    Object.keys(fieldScores).forEach(fieldKey => {
      const weight = this.fieldWeights[fieldKey as keyof PolicyFieldWeights];
      weightedScores[fieldKey] = (fieldScores[fieldKey] / 100) * weight * 100;
    });

    return weightedScores;
  }

  // 総合スコア計算
  private calculateTotalScore(weightedScores: Record<string, number>): number {
    return Math.round(Object.values(weightedScores).reduce((sum, score) => sum + score, 0));
  }

  // 評価コメント生成
  private generateEvaluation(totalScore: number, fieldScores: Record<string, number>): string {
    let evaluation = '';

    if (totalScore >= 80) {
      evaluation = '優秀 - 政策効果は非常に高く評価されます';
    } else if (totalScore >= 70) {
      evaluation = '良好 - 政策効果は高く評価されます';
    } else if (totalScore >= 60) {
      evaluation = '中程度 - 政策効果は一定の成果が期待されます';
    } else if (totalScore >= 50) {
      evaluation = '課題あり - 政策効果に改善の余地があります';
    } else {
      evaluation = '課題多し - 政策効果の大幅な改善が必要です';
    }

    // 最も高いスコアの分野を特定
    const maxFieldScore = Math.max(...Object.values(fieldScores));
    const topField = Object.keys(fieldScores).find(key => fieldScores[key] === maxFieldScore);

    const fieldNames: Record<string, string> = {
      economic: '経済政策',
      fiscal: '財政・税制',
      welfare: '社会保障・福祉',
      education: '教育',
      diplomacy: '外交・安全保障',
      environment: '環境・エネルギー',
      governance: '法治・ガバナンス',
      social: '国民生活・文化',
      technology: '科学技術・産業政策',
      information: '情報・メディア環境'
    };

    if (topField) {
      evaluation += `。特に${fieldNames[topField]}分野で高い効果が期待されます。`;
    }

    return evaluation;
  }

  // 分野名の日本語取得
  getFieldDisplayName(fieldKey: string): string {
    const fieldNames: Record<string, string> = {
      economic: '経済政策',
      fiscal: '財政・税制',
      welfare: '社会保障・福祉',
      education: '教育',
      diplomacy: '外交・安全保障',
      environment: '環境・エネルギー',
      governance: '法治・ガバナンス',
      social: '国民生活・文化',
      technology: '科学技術・産業政策',
      information: '情報・メディア環境'
    };

    return fieldNames[fieldKey] || fieldKey;
  }

  // 分野の重み取得
  getFieldWeight(fieldKey: string): number {
    return this.fieldWeights[fieldKey as keyof PolicyFieldWeights] || 0;
  }

  // ベースラインパラメータ取得
  getBaselineParameters(): PolicyFieldParameters {
    return JSON.parse(JSON.stringify(this.baselineParameters));
  }
}