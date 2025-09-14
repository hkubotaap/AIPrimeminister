// ランキングシステム
import { SupabaseRankingService, RankingRecord } from './supabase-client';

export interface RankingEntry {
  id: string;
  playerName: string;
  score: number;
  rank: string;
  rankTitle: string;
  finalStats: {
    approvalRating: number;
    gdp: number;
    nationalDebt: number;
    technology: number;
    environment: number;
    stockPrice: number;
    diplomacy: number;
  };
  gameDate: string;
  playTime: number; // 秒
  aiProvider: string;
  totalTurns: number;
  achievements: string[];
}

export class RankingSystem {
  private readonly STORAGE_KEY = 'ai_pm_rankings';
  private readonly MAX_ENTRIES = 100;
  private supabaseService: SupabaseRankingService;

  constructor() {
    this.supabaseService = new SupabaseRankingService();
  }

  // ランキングデータを取得（Supabase優先、フォールバックでローカル）
  async getRankings(): Promise<RankingEntry[]> {
    try {
      // Supabaseが利用可能な場合
      if (this.supabaseService.isSupabaseAvailable()) {
        const supabaseData = await this.supabaseService.getRankings(this.MAX_ENTRIES);
        return this.convertFromSupabaseFormat(supabaseData);
      }
      
      // ローカルストレージフォールバック
      return this.getLocalRankings();
    } catch (error) {
      console.error('Supabaseランキング取得エラー、ローカルストレージを使用:', error);
      return this.getLocalRankings();
    }
  }

  // ローカルストレージからランキングを取得
  private getLocalRankings(): RankingEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const rankings = JSON.parse(stored) as RankingEntry[];
      return rankings.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('ローカルランキングデータ読み込みエラー:', error);
      return [];
    }
  }

  // ランキングに新しいエントリを追加（Supabase優先、フォールバックでローカル）
  async addRanking(entry: Omit<RankingEntry, 'id' | 'gameDate'>): Promise<boolean> {
    const newEntry: RankingEntry = {
      ...entry,
      id: this.generateId(),
      gameDate: new Date().toISOString()
    };

    try {
      // Supabaseが利用可能な場合
      if (this.supabaseService.isSupabaseAvailable()) {
        const supabaseRecord = this.convertToSupabaseFormat(newEntry);
        await this.supabaseService.addRanking(supabaseRecord);
        
        // ローカルストレージにもバックアップとして保存
        this.addLocalRanking(newEntry);
        
        console.log('✅ Supabaseランキングに追加:', newEntry.playerName, newEntry.score);
        return true;
      }
      
      // ローカルストレージフォールバック
      return this.addLocalRanking(newEntry);
    } catch (error) {
      console.error('Supabaseランキング追加エラー、ローカルストレージを使用:', error);
      return this.addLocalRanking(newEntry);
    }
  }

  // ローカルストレージにランキングを追加
  private addLocalRanking(newEntry: RankingEntry): boolean {
    try {
      const rankings = this.getLocalRankings();
      rankings.push(newEntry);
      
      // スコア順でソートし、上位のみ保持
      const sortedRankings = rankings
        .sort((a, b) => b.score - a.score)
        .slice(0, this.MAX_ENTRIES);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sortedRankings));
      
      console.log('✅ ローカルランキングに追加:', newEntry.playerName, newEntry.score);
      return true;
    } catch (error) {
      console.error('❌ ローカルランキング追加エラー:', error);
      return false;
    }
  }

  // プレイヤーの順位を取得
  async getPlayerRank(score: number): Promise<number> {
    const rankings = await this.getRankings();
    const betterScores = rankings.filter(entry => entry.score > score).length;
    return betterScores + 1;
  }

  // トップ10を取得
  async getTop10(): Promise<RankingEntry[]> {
    const rankings = await this.getRankings();
    return rankings.slice(0, 10);
  }

  // プレイヤーの最高記録を取得
  async getPlayerBestScore(playerName: string): Promise<RankingEntry | null> {
    try {
      // Supabaseが利用可能な場合
      if (this.supabaseService.isSupabaseAvailable()) {
        const supabaseRecord = await this.supabaseService.getPlayerBestScore(playerName);
        return supabaseRecord ? this.convertFromSupabaseFormat([supabaseRecord])[0] : null;
      }
      
      // ローカルストレージフォールバック
      const rankings = this.getLocalRankings();
      const playerEntries = rankings.filter(entry => 
        entry.playerName.toLowerCase() === playerName.toLowerCase()
      );
      
      if (playerEntries.length === 0) return null;
      
      return playerEntries.reduce((best, current) => 
        current.score > best.score ? current : best
      );
    } catch (error) {
      console.error('プレイヤー記録取得エラー:', error);
      return null;
    }
  }

  // ランキングをクリア
  clearRankings(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🗑️ ランキングデータをクリアしました');
  }

  // ランキングデータをエクスポート
  exportRankings(): string {
    const rankings = this.getRankings();
    return JSON.stringify(rankings, null, 2);
  }

  // ランキングデータをインポート
  async importRankings(data: string): Promise<boolean> {
    try {
      const rankings = JSON.parse(data) as RankingEntry[];
      
      // データの妥当性チェック
      if (!Array.isArray(rankings)) {
        throw new Error('Invalid data format');
      }

      // 既存データとマージ
      const existingRankings = await this.getRankings();
      const mergedRankings = [...existingRankings, ...rankings]
        .sort((a, b) => b.score - a.score)
        .slice(0, this.MAX_ENTRIES);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(mergedRankings));
      
      console.log('✅ ランキングデータをインポートしました');
      return true;
    } catch (error) {
      console.error('❌ ランキングインポートエラー:', error);
      return false;
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
    try {
      // Supabaseが利用可能な場合
      if (this.supabaseService.isSupabaseAvailable()) {
        return await this.supabaseService.getStatistics();
      }
      
      // ローカルストレージフォールバック
      const rankings = this.getLocalRankings();
      
      if (rankings.length === 0) {
        return {
          totalGames: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          mostUsedProvider: 'なし',
          rankDistribution: {}
        };
      }

      const scores = rankings.map(r => r.score);
      const providers = rankings.map(r => r.aiProvider);
      const ranks = rankings.map(r => r.rank);

      // プロバイダー使用頻度
      const providerCount = providers.reduce((acc, provider) => {
        acc[provider] = (acc[provider] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostUsedProvider = Object.entries(providerCount)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'なし';

      // ランク分布
      const rankDistribution = ranks.reduce((acc, rank) => {
        acc[rank] = (acc[rank] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalGames: rankings.length,
        averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        highestScore: Math.max(...scores),
        lowestScore: Math.min(...scores),
        mostUsedProvider,
        rankDistribution
      };
    } catch (error) {
      console.error('統計情報取得エラー:', error);
      return {
        totalGames: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        mostUsedProvider: 'なし',
        rankDistribution: {}
      };
    }
  }

  // Supabase形式に変換
  private convertToSupabaseFormat(entry: RankingEntry): Omit<RankingRecord, 'id' | 'created_at'> {
    return {
      player_name: entry.playerName,
      score: entry.score,
      rank: entry.rank,
      rank_title: entry.rankTitle,
      final_stats: entry.finalStats,
      game_date: entry.gameDate,
      play_time: entry.playTime,
      ai_provider: entry.aiProvider,
      total_turns: entry.totalTurns,
      achievements: entry.achievements
    };
  }

  // Supabase形式から変換
  private convertFromSupabaseFormat(records: RankingRecord[]): RankingEntry[] {
    return records.map(record => ({
      id: record.id || this.generateId(),
      playerName: record.player_name,
      score: record.score,
      rank: record.rank,
      rankTitle: record.rank_title,
      finalStats: record.final_stats,
      gameDate: record.game_date,
      playTime: record.play_time,
      aiProvider: record.ai_provider,
      totalTurns: record.total_turns,
      achievements: record.achievements || []
    }));
  }

  // ユニークIDを生成
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // 実績を判定
  static calculateAchievements(entry: Omit<RankingEntry, 'id' | 'gameDate' | 'achievements'>): string[] {
    const achievements: string[] = [];
    const stats = entry.finalStats;

    // スコア関連
    if (entry.score >= 90) achievements.push('🏆 歴史的名宰相');
    if (entry.score >= 80) achievements.push('👑 優秀な指導者');
    if (entry.score < 30) achievements.push('💀 政治的混乱');

    // 指標関連
    if (stats.approvalRating >= 90) achievements.push('❤️ 国民の愛される総理');
    if (stats.approvalRating <= 10) achievements.push('😱 支持率一桁の危機');
    if (stats.gdp >= 700) achievements.push('💰 経済成長の立役者');
    if (stats.nationalDebt <= 800) achievements.push('💳 財政健全化の達人');
    if (stats.technology >= 90) achievements.push('🚀 技術立国の父');
    if (stats.environment >= 90) achievements.push('🌱 環境保護の先駆者');
    if (stats.diplomacy >= 90) achievements.push('🤝 外交の名手');
    if (stats.stockPrice >= 35000) achievements.push('📈 株価上昇の魔術師');

    // 特殊実績
    if (stats.approvalRating >= 80 && stats.gdp >= 600 && stats.diplomacy >= 80) {
      achievements.push('⭐ 完璧な政権運営');
    }
    
    if (entry.aiProvider === 'ollama') achievements.push('🦙 プライベートAI使い');
    if (entry.aiProvider === 'gemini') achievements.push('🧠 クラウドAI使い');
    if (entry.aiProvider === 'fallback') achievements.push('💪 オフライン達人');

    return achievements;
  }
}