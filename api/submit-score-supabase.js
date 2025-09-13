// Vercel Function: Supabaseを使用したスコア登録
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

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

  // Supabaseクライアント初期化（環境変数がない場合はフォールバック）
  let supabase = null;
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }

  try {
    const { playerName, totalScore, gameData } = req.body;

    // 入力検証
    if (!playerName || typeof totalScore !== 'number' || !gameData) {
      return res.status(400).json({ error: 'Invalid input data' });
    }

    if (playerName.length > 20 || playerName.length < 1) {
      return res.status(400).json({ error: 'Player name must be 1-20 characters' });
    }

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
    const now = new Date().toISOString();

    const scoreEntry = {
      player_name: playerName.trim(),
      total_score: totalScore,
      rank_title: rankTitle,
      final_turn: gameData.turn || 5,
      approval_rating: gameData.approvalRating,
      gdp: gameData.gdp,
      national_debt: gameData.nationalDebt,
      diplomacy: gameData.diplomacy || 55,
      environment: gameData.environment || 50,
      technology: gameData.technology || 60,
      created_at: now
    };

    if (supabase) {
      // Supabaseに保存
      const { data, error } = await supabase
        .from('prime_minister_rankings')
        .insert([scoreEntry])
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

      if (rankError) {
        console.error('Supabase rank calculation error:', rankError);
      }

      const rank = rankings ? rankings.findIndex(r => r.total_score <= totalScore) + 1 : 1;
      const totalPlayers = rankings ? rankings.length : 1;

      console.log(`🏆 スコア登録成功 (Supabase): ${playerName} - ${totalScore}点 (${rank}位/${totalPlayers}人中)`);

      return res.status(200).json({
        success: true,
        message: 'Score submitted successfully',
        data: {
          playerName,
          totalScore,
          rank,
          totalPlayers,
          rankTitle
        }
      });
    } else {
      // Supabaseが利用できない場合はローカルファイルに保存（開発用）
      console.log('⚠️ Supabase not configured, using fallback storage');

      return res.status(200).json({
        success: true,
        message: 'Score submitted (fallback mode)',
        data: {
          playerName,
          totalScore,
          rank: 1,
          totalPlayers: 1,
          rankTitle,
          note: 'Database not configured - using fallback mode'
        }
      });
    }

  } catch (error) {
    console.error('❌ スコア登録エラー:', error);
    return res.status(500).json({
      error: 'Failed to submit score',
      details: error.message
    });
  }
}