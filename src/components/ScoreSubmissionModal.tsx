import React, { useState } from 'react';

interface GameState {
  turn: number;
  approvalRating: number;
  gdp: number;
  nationalDebt: number;
  technology: number;
  environment: number;
  stockPrice: number;
  usdJpyRate: number;
  diplomacy: number;
}

interface ScoreSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  totalScore: number;
  rank: string;
}

const ScoreSubmissionModal: React.FC<ScoreSubmissionModalProps> = ({
  isOpen,
  onClose,
  gameState,
  totalScore,
  rank
}) => {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim() || playerName.length > 20) {
      setError('プレイヤー名は1文字以上20文字以下で入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const baseURL = (import.meta.env as any).PROD ? '' : 'http://localhost:3001';
      const response = await fetch(`${baseURL}/api/submit-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: playerName.trim(),
          totalScore,
          gameData: {
            turn: gameState.turn,
            approvalRating: gameState.approvalRating,
            gdp: gameState.gdp,
            nationalDebt: gameState.nationalDebt,
            rank
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSubmitResult(result.data);
        setSubmitted(true);
        console.log('🏆 スコア登録成功:', result.data);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('スコア登録エラー:', error);
      setError(`登録に失敗しました: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPlayerName('');
    setSubmitted(false);
    setSubmitResult(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const getRankTitle = (score: number) => {
    if (score >= 90) return { title: 'S+', label: '歴史的名宰相', color: 'text-yellow-400' };
    if (score >= 85) return { title: 'S', label: '優秀な指導者', color: 'text-yellow-300' };
    if (score >= 80) return { title: 'A+', label: '有能な総理大臣', color: 'text-green-400' };
    if (score >= 75) return { title: 'A', label: '安定した政権運営', color: 'text-green-300' };
    if (score >= 70) return { title: 'B+', label: '平均以上の成果', color: 'text-blue-400' };
    if (score >= 65) return { title: 'B', label: '標準的な政権', color: 'text-blue-300' };
    if (score >= 60) return { title: 'C+', label: '課題の多い政権', color: 'text-orange-400' };
    if (score >= 55) return { title: 'C', label: '困難な政権運営', color: 'text-orange-300' };
    if (score >= 50) return { title: 'D', label: '政治的混乱', color: 'text-red-400' };
    return { title: 'F', label: '政治的失敗', color: 'text-red-300' };
  };

  const rankInfo = getRankTitle(totalScore);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-lg border border-indigo-500 shadow-2xl max-w-md w-full">
        
        {!submitted ? (
          <>
            {/* ヘッダー */}
            <div className="p-6 border-b border-indigo-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <h2 className="text-xl font-bold text-white">ランキング登録</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-300 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* スコア表示 */}
            <div className="p-6 text-center border-b border-indigo-500">
              <div className="mb-4">
                <div className="text-3xl font-bold text-white mb-2">{totalScore}点</div>
                <div className={`text-lg font-bold ${rankInfo.color}`}>
                  {rankInfo.title} - {rankInfo.label}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-indigo-800/50 rounded p-2">
                  <div className="text-gray-300">ターン</div>
                  <div className="text-white font-bold">{gameState.turn}</div>
                </div>
                <div className="bg-purple-800/50 rounded p-2">
                  <div className="text-gray-300">支持率</div>
                  <div className="text-white font-bold">{gameState.approvalRating}%</div>
                </div>
                <div className="bg-pink-800/50 rounded p-2">
                  <div className="text-gray-300">GDP</div>
                  <div className="text-white font-bold">{gameState.gdp}兆円</div>
                </div>
                <div className="bg-red-800/50 rounded p-2">
                  <div className="text-gray-300">株価</div>
                  <div className="text-white font-bold">{gameState.stockPrice}円</div>
                </div>
              </div>
            </div>

            {/* 登録フォーム */}
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    プレイヤー名 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="総理大臣としてのお名前"
                    className="w-full px-3 py-2 bg-indigo-800/50 border border-indigo-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    maxLength={20}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    1-20文字（日本語・英数字対応）
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-800/50 border border-red-600 rounded-lg">
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !playerName.trim()}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        登録中...
                      </>
                    ) : (
                      '登録する'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          /* 登録完了 */
          <div className="p-6 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-4">登録完了！</h2>
            
            {submitResult && (
              <div className="bg-gradient-to-r from-green-800/50 to-blue-800/50 border border-green-500 rounded-lg p-4 mb-6">
                <div className="text-lg font-bold text-white mb-2">
                  {submitResult.playerName}総理大臣
                </div>
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  全国{submitResult.rank}位！
                </div>
                <div className="text-sm text-gray-300">
                  {submitResult.totalScore}点 (参加者{submitResult.totalPlayers}人中)
                </div>
              </div>
            )}

            <p className="text-gray-300 mb-6">
              あなたの政治的功績が歴史に刻まれました！<br />
              ランキングで他の総理大臣たちと競い合いましょう。
            </p>

            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-colors"
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoreSubmissionModal;