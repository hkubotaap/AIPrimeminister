// Vercel Function: スコア登録
import crypto from 'crypto';

// シンプルなインメモリランキング（本番では外部DBを推奨）
let rankings = [];

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { playerName, totalScore, gameData } = req.body;

    // 入力検証
    if (!playerName || typeof totalScore !== 'number') {
      return res.status(400).json({ error: 'Invalid input: playerName and totalScore are required' });
    }

    // プレイヤー名の検証
    if (playerName.length > 20 || playerName.length < 1) {
      return res.status(400).json({ error: 'Player name must be between 1 and 20 characters' });
    }

    // 不適切な文字列のフィルタリング
    const sanitizedName = playerName.replace(/[<>"\'/\\&]/g, '').trim();
    if (sanitizedName !== playerName) {
      return res.status(400).json({ error: 'Player name contains invalid characters' });
    }

    // スコア範囲の検証
    if (totalScore < 0 || totalScore > 100) {
      return res.status(400).json({ error: 'Score must be between 0 and 100' });
    }

    // ユニークIDの生成
    const playerId = crypto.randomBytes(8).toString('hex');
    
    // 現在時刻
    const timestamp = new Date().toISOString();

    // ランキングエントリー作成
    const rankingEntry = {
      id: playerId,
      playerName: sanitizedName,
      totalScore: Math.round(totalScore * 100) / 100, // 小数点2桁まで
      timestamp,
      gameData: {
        finalTurn: gameData?.turn || 0,
        approvalRating: gameData?.approvalRating || 0,
        gdp: gameData?.gdp || 0,
        nationalDebt: gameData?.nationalDebt || 0,
        rank: gameData?.rank || 'F'
      }
    };

    // ランキングに追加
    rankings.push(rankingEntry);

    // スコアでソート（降順）
    rankings.sort((a, b) => b.totalScore - a.totalScore);

    // 上位100位まで保持
    if (rankings.length > 100) {
      rankings = rankings.slice(0, 100);
    }

    // プレイヤーの順位を計算
    const playerRank = rankings.findIndex(entry => entry.id === playerId) + 1;

    console.log(`🏆 新しいスコア登録: ${sanitizedName} - ${totalScore}点 (${playerRank}位)`);

    return res.status(200).json({
      success: true,
      message: 'Score submitted successfully',
      data: {
        playerId,
        playerName: sanitizedName,
        totalScore: rankingEntry.totalScore,
        rank: playerRank,
        totalPlayers: rankings.length
      }
    });

  } catch (error) {
    console.error('スコア登録エラー:', error);
    return res.status(500).json({
      error: 'Failed to submit score',
      details: error.message
    });
  }
}