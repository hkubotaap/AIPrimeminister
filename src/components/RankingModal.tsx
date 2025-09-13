import React, { useState, useEffect } from 'react';

interface RankingEntry {
  rank: number;
  playerName: string;
  totalScore: number;
  rank_title: {
    title: string;
    label: string;
  };
  timestamp: string;
  gameData: {
    finalTurn: number;
    approvalRating: number;
    gdp: number;
    nationalDebt: number;
    rank: string;
  };
}

interface RankingData {
  rankings: RankingEntry[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasNext: boolean;
  };
  stats: {
    totalPlayers: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
  };
}

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RankingModal: React.FC<RankingModalProps> = ({ isOpen, onClose }) => {
  const [rankings, setRankings] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const baseURL = (import.meta.env as any).PROD ? '' : 'http://localhost:3001';
      const response = await fetch(`${baseURL}/api/get-rankings?limit=20`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rankings: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRankings(data.data);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('ランキング取得エラー:', error);
      setError('ランキングの取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRankings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-white';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '🏅';
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-lg border border-indigo-500 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* ヘッダー */}
        <div className="p-6 border-b border-indigo-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <h2 className="text-2xl font-bold text-white">全国総理大臣ランキング</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>

          {/* 統計情報 */}
          {rankings && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-indigo-800/50 rounded-lg p-3">
                <div className="text-sm text-gray-300">総参加者数</div>
                <div className="text-lg font-bold text-white">{rankings.stats.totalPlayers}人</div>
              </div>
              <div className="bg-purple-800/50 rounded-lg p-3">
                <div className="text-sm text-gray-300">平均スコア</div>
                <div className="text-lg font-bold text-white">{rankings.stats.averageScore}点</div>
              </div>
              <div className="bg-pink-800/50 rounded-lg p-3">
                <div className="text-sm text-gray-300">最高スコア</div>
                <div className="text-lg font-bold text-yellow-400">{rankings.stats.highestScore}点</div>
              </div>
              <div className="bg-red-800/50 rounded-lg p-3">
                <div className="text-sm text-gray-300">最低スコア</div>
                <div className="text-lg font-bold text-white">{rankings.stats.lowestScore}点</div>
              </div>
            </div>
          )}
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-3 text-white">ランキング取得中...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-800/50 border border-red-600 rounded-lg p-4 mb-4">
              <p className="text-red-200">{error}</p>
              <button 
                onClick={fetchRankings}
                className="mt-2 text-sm text-red-300 hover:text-red-100 underline"
              >
                再試行
              </button>
            </div>
          )}

          {rankings && rankings.rankings.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🏛️</span>
              <p className="text-gray-300 text-lg">まだランキングが登録されていません</p>
              <p className="text-gray-400 text-sm mt-2">最初の歴史的名宰相になりましょう！</p>
            </div>
          )}

          {rankings && rankings.rankings.length > 0 && (
            <div className="space-y-3">
              {rankings.rankings.map((entry, index) => (
                <div 
                  key={index}
                  className={`bg-gradient-to-r ${
                    entry.rank === 1 ? 'from-yellow-900/50 to-yellow-800/50 border-yellow-500' :
                    entry.rank === 2 ? 'from-gray-800/50 to-gray-700/50 border-gray-400' :
                    entry.rank === 3 ? 'from-orange-900/50 to-orange-800/50 border-orange-500' :
                    'from-indigo-800/30 to-purple-800/30 border-indigo-600'
                  } border rounded-lg p-4`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getRankIcon(entry.rank)}</span>
                        <span className={`text-xl font-bold ${getRankColor(entry.rank)}`}>
                          {entry.rank}位
                        </span>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white text-lg">{entry.playerName}</span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            entry.rank_title.title.startsWith('S') ? 'bg-yellow-600 text-yellow-100' :
                            entry.rank_title.title.startsWith('A') ? 'bg-green-600 text-green-100' :
                            entry.rank_title.title.startsWith('B') ? 'bg-blue-600 text-blue-100' :
                            entry.rank_title.title.startsWith('C') ? 'bg-orange-600 text-orange-100' :
                            'bg-red-600 text-red-100'
                          }`}>
                            {entry.rank_title.title} {entry.rank_title.label}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300 mt-1">
                          {formatDate(entry.timestamp)} • ターン{entry.gameData.finalTurn} • 支持率{entry.gameData.approvalRating}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{entry.totalScore}点</div>
                      <div className="text-sm text-gray-300">
                        GDP {entry.gameData.gdp}兆円
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {rankings && rankings.pagination.hasNext && (
            <div className="text-center mt-6">
              <p className="text-gray-400 text-sm">
                {rankings.pagination.total}人中 上位{rankings.pagination.limit}位まで表示
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RankingModal;