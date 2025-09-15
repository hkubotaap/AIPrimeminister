// 拡張評価結果表示コンポーネント
import React from 'react';
import { EnhancedPolicyAnalysis } from '../enhanced-evaluation-system';

interface EnhancedEvaluationDisplayProps {
  analysis: EnhancedPolicyAnalysis;
  isVisible: boolean;
  onClose: () => void;
}

const EnhancedEvaluationDisplay: React.FC<EnhancedEvaluationDisplayProps> = ({
  analysis,
  isVisible,
  onClose
}) => {
  if (!isVisible) return null;

  // スコアに基づく色の決定
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#10B981'; // green-500
    if (score >= 60) return '#F59E0B'; // amber-500
    if (score >= 40) return '#EF4444'; // red-500
    return '#DC2626'; // red-600
  };

  // スコアバーコンポーネント
  const ScoreBar: React.FC<{ score: number; label: string }> = ({ score, label }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold" style={{ color: getScoreColor(score) }}>
          {score}/100
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="h-3 rounded-full transition-all duration-500"
          style={{
            width: `${score}%`,
            backgroundColor: getScoreColor(score)
          }}
        />
      </div>
    </div>
  );

  // 指標変化表示コンポーネント
  const IndicatorChange: React.FC<{
    label: string;
    current: number;
    change: number;
    unit: string;
  }> = ({ label, current, change, unit }) => {
    const changeColor = change > 0 ? '#10B981' : change < 0 ? '#EF4444' : '#6B7280';
    const changeIcon = change > 0 ? '↗️' : change < 0 ? '↘️' : '→';

    return (
      <div className="flex justify-between items-center py-2 border-b border-gray-100">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="text-right">
          <div className="text-sm text-gray-600">
            {current.toFixed(2)}{unit}
          </div>
          <div className="text-xs flex items-center" style={{ color: changeColor }}>
            {change > 0 ? '+' : ''}{change.toFixed(2)}{unit} {changeIcon}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">政策評価レポート</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4">
          {/* 総合評価 */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 mb-1">拡張評価スコア</div>
                  <div
                    className="text-3xl font-bold"
                    style={{ color: getScoreColor(analysis.overallScore) }}
                  >
                    {analysis.overallScore}/100
                  </div>
                </div>
                {analysis.polscorResult && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600 mb-1">政策スコア (polscor.dat)</div>
                    <div
                      className="text-3xl font-bold"
                      style={{ color: getScoreColor(analysis.polscorResult.totalScore) }}
                    >
                      {analysis.polscorResult.totalScore}/100
                    </div>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-500">
                信頼度: {analysis.confidence}% | 期間: {analysis.timeframe}
              </div>
              {analysis.polscorResult && (
                <div className="text-sm text-gray-600 mt-1">
                  政策評価: {analysis.polscorResult.evaluation}
                </div>
              )}
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700">{analysis.reasoning}</p>
            </div>
          </div>

          {/* カテゴリ別スコア */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">カテゴリ別評価</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-3">法治・ガバナンス</h4>
                <ScoreBar score={analysis.categoryScores.governance} label="" />
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3">国民生活・文化</h4>
                <ScoreBar score={analysis.categoryScores.socialCultural} label="" />
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-3">科学技術・産業政策</h4>
                <ScoreBar score={analysis.categoryScores.scienceTech} label="" />
              </div>
            </div>
          </div>

          {/* polscor.dat分野別評価 */}
          {analysis.polscorResult && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">polscor.dat分野別評価</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(analysis.polscorResult.fieldScores).map(([fieldKey, score]) => {
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

                  const fieldWeights: Record<string, number> = {
                    economic: 15,
                    fiscal: 10,
                    welfare: 10,
                    education: 10,
                    diplomacy: 10,
                    environment: 10,
                    governance: 10,
                    social: 10,
                    technology: 10,
                    information: 5
                  };

                  return (
                    <div key={fieldKey} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        {fieldNames[fieldKey]}
                        <span className="text-xs text-gray-500 ml-1">
                          (重み{fieldWeights[fieldKey]}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${score}%`,
                            backgroundColor: getScoreColor(Number(score))
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-600">
                        {score}/100 → {analysis.polscorResult.weightedScores[fieldKey].toFixed(1)}点
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 詳細指標変化 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* 法治・ガバナンス指標 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
                ⚖️ 法治・ガバナンス指標
              </h4>
              <div className="space-y-1">
                <IndicatorChange
                  label="汚職認識指数"
                  current={analysis.enhancedEffects.governance.corruptionPerceptionIndex}
                  change={0} // 変化量は別途計算が必要
                  unit="点"
                />
                <IndicatorChange
                  label="司法の独立性"
                  current={analysis.enhancedEffects.governance.judicialIndependence}
                  change={0}
                  unit="点"
                />
                <IndicatorChange
                  label="報道自由度指数"
                  current={analysis.enhancedEffects.governance.pressFreedomIndex}
                  change={0}
                  unit="点"
                />
              </div>
            </div>

            {/* 国民生活・文化指標 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-4 flex items-center">
                🏠 国民生活・文化指標
              </h4>
              <div className="space-y-1">
                <IndicatorChange
                  label="投票率"
                  current={analysis.enhancedEffects.socialCultural.voterTurnout}
                  change={0}
                  unit="%"
                />
                <IndicatorChange
                  label="男女平等指数"
                  current={analysis.enhancedEffects.socialCultural.genderEqualityIndex}
                  change={0}
                  unit=""
                />
                <IndicatorChange
                  label="自殺率"
                  current={analysis.enhancedEffects.socialCultural.suicideRate}
                  change={0}
                  unit="人/10万人"
                />
              </div>
            </div>

            {/* 科学技術・産業政策指標 */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-800 mb-4 flex items-center">
                🔬 科学技術・産業政策指標
              </h4>
              <div className="space-y-1">
                <IndicatorChange
                  label="研究開発費対GDP比"
                  current={analysis.enhancedEffects.scienceTech.rdSpendingGdpRatio}
                  change={0}
                  unit="%"
                />
                <IndicatorChange
                  label="特許出願件数"
                  current={analysis.enhancedEffects.scienceTech.patentApplications}
                  change={0}
                  unit="件"
                />
                <IndicatorChange
                  label="デジタル化指数"
                  current={analysis.enhancedEffects.scienceTech.digitalizationIndex}
                  change={0}
                  unit="点"
                />
              </div>
            </div>
          </div>

          {/* 基本経済・政治指標 */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">基本経済・政治指標への影響</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(analysis.effects).map(([key, value]) => {
                const labels: Record<string, string> = {
                  approvalRating: '支持率',
                  gdp: 'GDP',
                  nationalDebt: '国債',
                  technology: '技術力',
                  environment: '環境',
                  stockPrice: '株価',
                  usdJpyRate: 'ドル円',
                  diplomacy: '外交'
                };

                const units: Record<string, string> = {
                  approvalRating: '%',
                  gdp: '兆円',
                  nationalDebt: '兆円',
                  technology: '%',
                  environment: '%',
                  stockPrice: '円',
                  usdJpyRate: '円',
                  diplomacy: '%'
                };

                const changeColor = value > 0 ? '#10B981' : value < 0 ? '#EF4444' : '#6B7280';

                return (
                  <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-600 mb-1">{labels[key]}</div>
                    <div
                      className="text-lg font-bold"
                      style={{ color: changeColor }}
                    >
                      {value > 0 ? '+' : ''}{value}{units[key]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* リスクと機会 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* リスク */}
            {analysis.risks.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4">
                <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                  ⚠️ 予想されるリスク
                </h4>
                <ul className="space-y-1">
                  {analysis.risks.map((risk, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 機会 */}
            {analysis.opportunities.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center">
                  🌟 期待される機会
                </h4>
                <ul className="space-y-1">
                  {analysis.opportunities.map((opportunity, index) => (
                    <li key={index} className="text-sm text-green-700 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{opportunity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            レポートを閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedEvaluationDisplay;