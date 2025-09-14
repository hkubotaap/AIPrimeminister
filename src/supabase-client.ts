// Supabaseクライアント設定
import { createClient } from '@supabase/supabase-js';

// 環境変数から設定を取得
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// URL形式の検証
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return url.startsWith('http://') || url.startsWith('https://');
  } catch {
    return false;
  }
};

// Supabaseクライアントを安全に作成
export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase環境変数が設定されていません。ローカルストレージを使用します。');
    return null;
  }
  
  if (!isValidUrl(supabaseUrl)) {
    console.warn('⚠️ 無効なSupabase URLです。ローカルストレージを使用します。');
    return null;
  }
  
  try {
    console.log('✅ Supabaseクライアントを初期化しました');
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.warn('⚠️ Supabaseクライアントの初期化に失敗しました:', error);
    return null;
  }
})();

// データベーステーブル定義
export interface RankingRecord {
  id?: string;
  player_name: string;
  score: number;
  rank: string;
  rank_title: string;
  final_stats: {
    approvalRating: number;
    gdp: number;
    nationalDebt: number;
    technology: number;
    environment: number;
    stockPrice: number;
    diplomacy: number;
  };
  game_date: string;
  play_time: number;
  ai_provider: string;
  total_turns: number;
  achievements: string[];
  created_at?: string;
}

// Supabase操作クラス
export class SupabaseRankingService {
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = !!supabase;
    if (this.isAvailable) {
      console.log('✅ Supabase接続が利用可能です');
    } else {
      console.log('⚠️ Supabase接続が利用できません。ローカルストレージを使用します。');
    }
  }

  // Supabaseが利用可能かチェック
  isSupabaseAvailable(): boolean {
    return this.isAvailable;
  }

  // ランキングデータを取得
  async getRankings(limit: number = 100): Promise<RankingRecord[]> {
    if (!supabase) {
      throw new Error('Supabase not available');
    }

    try {
      const { data, error } = await supabase
        .from('rankings')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Supabaseランキング取得エラー:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('ランキング取得エラー:', error);
      throw error;
    }
  }

  // ランキングに新しいエントリを追加
  async addRanking(ranking: Omit<RankingRecord, 'id' | 'created_at'>): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase not available');
    }

    try {
      const { error } = await supabase
        .from('rankings')
        .insert([ranking]);

      if (error) {
        console.error('Supabaseランキング追加エラー:', error);
        throw error;
      }

      console.log('✅ Supabaseにランキングを追加しました');
      return true;
    } catch (error) {
      console.error('ランキング追加エラー:', error);
      throw error;
    }
  }

  // プレイヤーの最高記録を取得
  async getPlayerBestScore(playerName: string): Promise<RankingRecord | null> {
    if (!supabase) {
      throw new Error('Supabase not available');
    }

    try {
      const { data, error } = await supabase
        .from('rankings')
        .select('*')
        .ilike('player_name', playerName)
        .order('score', { ascending: false })
        .limit(1);

      if (error) {
        console.error('プレイヤー記録取得エラー:', error);
        throw error;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('プレイヤー記録取得エラー:', error);
      throw error;
    }
  }

  // 統計情報を取得
  async getStatistics(): Promise<{
    totalGames: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    mostUsedProvider: string;
    rankDistribution: Record<string, number>;
  }> {
    if (!supabase) {
      throw new Error('Supabase not available');
    }

    try {
      const { data, error } = await supabase
        .from('rankings')
        .select('score, ai_provider, rank');

      if (error) {
        console.error('統計情報取得エラー:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          totalGames: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          mostUsedProvider: 'なし',
          rankDistribution: {}
        };
      }

      const scores = data.map(r => r.score);
      const providers = data.map(r => r.ai_provider);
      const ranks = data.map(r => r.rank);

      // プロバイダー使用頻度
      const providerCount = providers.reduce((acc, provider) => {
        acc[provider] = (acc[provider] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostUsedProvider = Object.entries(providerCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'なし';

      // ランク分布
      const rankDistribution = ranks.reduce((acc, rank) => {
        acc[rank] = (acc[rank] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalGames: data.length,
        averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        mostUsedProvider,
        rankDistribution
      };
    } catch (error) {
      console.error('統計情報取得エラー:', error);
      throw error;
    }
  }

  // ランキングテーブルを作成（初回セットアップ用）
  async createRankingTable(): Promise<boolean> {
    if (!supabase) {
      throw new Error('Supabase not available');
    }

    try {
      // この関数は通常、Supabase管理画面で実行するSQLを提供するためのものです
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS rankings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          player_name VARCHAR(50) NOT NULL,
          score INTEGER NOT NULL,
          rank VARCHAR(10) NOT NULL,
          rank_title VARCHAR(100) NOT NULL,
          final_stats JSONB NOT NULL,
          game_date TIMESTAMP WITH TIME ZONE NOT NULL,
          play_time INTEGER NOT NULL,
          ai_provider VARCHAR(20) NOT NULL,
          total_turns INTEGER NOT NULL,
          achievements TEXT[] DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- インデックスを作成
        CREATE INDEX IF NOT EXISTS idx_rankings_score ON rankings(score DESC);
        CREATE INDEX IF NOT EXISTS idx_rankings_player ON rankings(player_name);
        CREATE INDEX IF NOT EXISTS idx_rankings_date ON rankings(game_date DESC);

        -- Row Level Security (RLS) を有効化
        ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

        -- 全ユーザーが読み取り可能
        CREATE POLICY IF NOT EXISTS "Rankings are viewable by everyone" 
        ON rankings FOR SELECT 
        USING (true);

        -- 全ユーザーが挿入可能
        CREATE POLICY IF NOT EXISTS "Rankings are insertable by everyone" 
        ON rankings FOR INSERT 
        WITH CHECK (true);
      `;

      console.log('Supabaseでランキングテーブルを作成するには、以下のSQLを実行してください:');
      console.log(createTableSQL);
      
      return true;
    } catch (error) {
      console.error('テーブル作成エラー:', error);
      return false;
    }
  }
}