// Vercel Function: スコア登録 (Supabase対応)
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// フォールバック用インメモリランキング
let fallbackRankings = [];

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

  // Supabaseクライアント初期化
  let supabase = null;
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
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

    // ランクタイトル計算
    const getRankTitle = (score) => {
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
    };

    const rankTitle = getRankTitle(totalScore);

    // ランキングエントリー作成
    const rankingEntry = {
      id: playerId,
      playerName: sanitizedName,
      totalScore: Math.round(totalScore * 100) / 100,
      timestamp,
      rankTitle,
      gameData: {
        finalTurn: gameData?.turn || 5,
        approvalRating: gameData?.approvalRating || 50,
        gdp: gameData?.gdp || 540,
        nationalDebt: gameData?.nationalDebt || 1100,
        diplomacy: gameData?.diplomacy || 55,
        environment: gameData?.environment || 50,
        technology: gameData?.technology || 60,
        rank: gameData?.rank || rankTitle.title
      }
    };

    if (supabase) {
      // Supabaseに保存
      const { data, error } = await supabase
        .from('prime_minister_rankings')
        .insert([{
          player_name: sanitizedName,
          total_score: rankingEntry.totalScore,
          rank_title: rankTitle,
          final_turn: rankingEntry.gameData.finalTurn,
          approval_rating: rankingEntry.gameData.approvalRating,
          gdp: rankingEntry.gameData.gdp,
          national_debt: rankingEntry.gameData.nationalDebt,
          diplomacy: rankingEntry.gameData.diplomacy,
          environment: rankingEntry.gameData.environment,
          technology: rankingEntry.gameData.technology,
          created_at: timestamp
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // 順位計算
      const { data: rankings, error: rankError } = await supabase
        .from('prime_minister_rankings')
        .select('total_score')
        .order('total_score', { ascending: false });

      const rank = rankings ? rankings.findIndex(r => r.total_score <= totalScore) + 1 : 1;
      const totalPlayers = rankings ? rankings.length : 1;

      console.log(`🏆 スコア登録成功 (Supabase): ${sanitizedName} - ${totalScore}点 (${rank}位/${totalPlayers}人中)`);

      return res.status(200).json({
        success: true,
        message: 'Score submitted successfully',
        data: {
          playerId,
          playerName: sanitizedName,
          totalScore: rankingEntry.totalScore,
          rank,
          totalPlayers,
          rankTitle
        }
      });
    } else {
      // フォールバック: インメモリストレージ
      fallbackRankings.push(rankingEntry);
      fallbackRankings.sort((a, b) => b.totalScore - a.totalScore);
      if (fallbackRankings.length > 100) {
        fallbackRankings = fallbackRankings.slice(0, 100);
      }

      const playerRank = fallbackRankings.findIndex(entry => entry.id === playerId) + 1;

      console.log(`🏆 スコア登録 (フォールバック): ${sanitizedName} - ${totalScore}点 (${playerRank}位)`);

      return res.status(200).json({
        success: true,
        message: 'Score submitted successfully (fallback mode)',
        data: {
          playerId,
          playerName: sanitizedName,
          totalScore: rankingEntry.totalScore,
          rank: playerRank,
          totalPlayers: fallbackRankings.length,
          rankTitle
        }
      });
    }

  } catch (error) {
    console.error('スコア登録エラー:', error);
    return res.status(500).json({
      error: 'Failed to submit score',
      details: error.message
    });
  }
}