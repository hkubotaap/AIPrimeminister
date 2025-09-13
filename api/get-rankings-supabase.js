// Vercel Function: Supabaseを使用したランキング取得
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

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

  // Supabaseクライアント初期化
  let supabase = null;
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }

  try {
    const { limit = '20', offset = '0' } = req.query;

    const limitNum = Math.min(parseInt(limit), 50); // 最大50件
    const offsetNum = Math.max(parseInt(offset), 0);

    if (supabase) {
      // Supabaseからデータ取得
      const { data: rankings, error } = await supabase
        .from('prime_minister_rankings')
        .select('*')
        .order('total_score', { ascending: false })
        .range(offsetNum, offsetNum + limitNum - 1);

      if (error) {
        console.error('Supabase select error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      // 総数取得
      const { count, error: countError } = await supabase
        .from('prime_minister_rankings')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Supabase count error:', countError);
      }

      // 統計計算
      const { data: allScores, error: statsError } = await supabase
        .from('prime_minister_rankings')
        .select('total_score');

      let stats = {
        totalPlayers: count || 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0
      };

      if (!statsError && allScores && allScores.length > 0) {
        const scores = allScores.map(r => r.total_score);
        stats = {
          totalPlayers: count || allScores.length,
          averageScore: Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100) / 100,
          highestScore: Math.max(...scores),
          lowestScore: Math.min(...scores)
        };
      }

      // ランキング形式に変換
      const formattedRankings = rankings.map((entry, index) => ({
        rank: offsetNum + index + 1,
        playerName: entry.player_name,
        totalScore: entry.total_score,
        rank_title: entry.rank_title,
        timestamp: entry.created_at,
        gameData: {
          finalTurn: entry.final_turn,
          approvalRating: entry.approval_rating,
          gdp: entry.gdp,
          nationalDebt: entry.national_debt,
          diplomacy: entry.diplomacy,
          environment: entry.environment,
          technology: entry.technology,
          rank: entry.rank_title.title
        }
      }));

      console.log(`📊 ランキング取得成功 (Supabase): ${formattedRankings.length}件 / 総数${stats.totalPlayers}件`);

      return res.status(200).json({
        success: true,
        data: {
          rankings: formattedRankings,
          pagination: {
            limit: limitNum,
            offset: offsetNum,
            total: stats.totalPlayers,
            hasNext: offsetNum + limitNum < stats.totalPlayers
          },
          stats
        }
      });
    } else {
      // Supabaseが利用できない場合の空のレスポンス
      console.log('⚠️ Supabase not configured, returning empty rankings');

      return res.status(200).json({
        success: true,
        data: {
          rankings: [],
          pagination: {
            limit: limitNum,
            offset: offsetNum,
            total: 0,
            hasNext: false
          },
          stats: {
            totalPlayers: 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0
          },
          note: 'Database not configured - no rankings available'
        }
      });
    }

  } catch (error) {
    console.error('❌ ランキング取得エラー:', error);
    return res.status(500).json({
      error: 'Failed to get rankings',
      details: error.message
    });
  }
}