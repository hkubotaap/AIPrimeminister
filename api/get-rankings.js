// Vercel Function: ランキング取得
// 注意: この実装はデモ用です。本番では外部データベース（Supabase、PlanetScale等）を推奨

// グローバルランキング（メモリ内）
let rankings = [];

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = '10', offset = '0' } = req.query;
    
    const limitNum = Math.min(parseInt(limit), 50); // 最大50件
    const offsetNum = Math.max(parseInt(offset), 0);

    // スコアでソート（降順）
    const sortedRankings = [...rankings].sort((a, b) => b.totalScore - a.totalScore);
    
    // ページネーション
    const paginatedRankings = sortedRankings
      .slice(offsetNum, offsetNum + limitNum)
      .map((entry, index) => ({
        rank: offsetNum + index + 1,
        playerName: entry.playerName,
        totalScore: entry.totalScore,
        rank_title: getRankTitle(entry.totalScore),
        timestamp: entry.timestamp,
        gameData: entry.gameData
      }));

    // 統計情報
    const stats = {
      totalPlayers: rankings.length,
      averageScore: rankings.length > 0 
        ? Math.round((rankings.reduce((sum, r) => sum + r.totalScore, 0) / rankings.length) * 100) / 100 
        : 0,
      highestScore: rankings.length > 0 ? Math.max(...rankings.map(r => r.totalScore)) : 0,
      lowestScore: rankings.length > 0 ? Math.min(...rankings.map(r => r.totalScore)) : 0
    };

    return res.status(200).json({
      success: true,
      data: {
        rankings: paginatedRankings,
        pagination: {
          limit: limitNum,
          offset: offsetNum,
          total: rankings.length,
          hasNext: offsetNum + limitNum < rankings.length
        },
        stats
      }
    });

  } catch (error) {
    console.error('ランキング取得エラー:', error);
    return res.status(500).json({
      error: 'Failed to get rankings',
      details: error.message
    });
  }
}

// ランクタイトルを取得
function getRankTitle(score) {
  if (score >= 90) return { title: 'S+', label: '歴史的名宰相' };
  if (score >= 85) return { title: 'S', label: '優秀な指導者' };
  if (score >= 80) return { title: 'A+', label: '有能な総理大臣' };
  if (score >= 75) return { title: 'A', label: '安定した政権運営' };
  if (score >= 70) return { title: 'B+', label: '平均以上の成果' };
  if (score >= 65) return { title: 'B', label: '標準的な政権' };
  if (score >= 60) return { title: 'C+', label: '課題の多い政権' };
  if (score >= 55) return { title: 'C', label: '困難な政権運営' };
  if (score >= 50) return { title: 'D', label: '政治的混乱' };
  return { title: 'F', label: '政治的失敗' };
}