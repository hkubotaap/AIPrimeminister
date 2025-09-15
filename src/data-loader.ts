// JSONファイルからの問題データ読み込みシステム
import { StaticQuestion, StaticQuestionOption } from './static-questions';
import { AIProviderManager } from './ai-provider';

// 既存JSONファイルの構造に対応した型定義
export interface RawQuestionData {
  [category: string]: Array<{
    設問番号: number;
    本文: string;
    注釈?: { [key: string]: string };
    選択肢: { [key: string]: string };
  }>;
}

export interface LoadedQuestionFile {
  fileName: string;
  category: string;
  questions: StaticQuestion[];
  loadedAt: Date;
}

export class DataLoader {
  private loadedFiles: LoadedQuestionFile[] = [];
  private allQuestions: StaticQuestion[] = [];
  private dataPath = './data'; // 相対パス
  private aiProvider?: AIProviderManager;
  private aiEnhancementEnabled = false; // AI拡張機能のON/OFF

  constructor(aiProvider?: AIProviderManager, enableAIEnhancement = true) {
    console.log('📁 データローダー初期化（相対パス: ./data）');
    this.aiProvider = aiProvider;
    this.aiEnhancementEnabled = enableAIEnhancement && !!aiProvider;

    if (this.aiEnhancementEnabled) {
      console.log('🤖 AI拡張機能が有効です');
    } else {
      console.log('📋 静的データのみで動作します');
    }
  }

  // 全JSONファイルを動的に読み込み
  public async loadAllQuestionFiles(): Promise<void> {
    console.log('📚 JSONファイル一括読み込み開始');

    try {
      // dataフォルダ内の全JSONファイルを取得
      const jsonFiles = await this.getJsonFileList();
      console.log(`🔍 発見されたJSONファイル: ${jsonFiles.length}個`);

      // 各ファイルを並列読み込み（AI拡張オプション付き）
      const loadPromises = jsonFiles.map(fileName => this.loadSingleFile(fileName, this.aiEnhancementEnabled));
      const results = await Promise.allSettled(loadPromises);

      // 読み込み結果の集計
      let successCount = 0;
      let totalQuestions = 0;
      let enhancedQuestions = 0;

      for (let index = 0; index < results.length; index++) {
        const result = results[index];
        if (result.status === 'fulfilled' && result.value) {
          successCount++;
          totalQuestions += result.value.questions.length;
          this.loadedFiles.push(result.value);

          // AI拡張された問題の数をカウント
          const enhanced = result.value.questions.filter(q => q.contextualBackground).length;
          enhancedQuestions += enhanced;
        } else {
          console.error(`❌ ${jsonFiles[index]} 読み込み失敗:`,
            result.status === 'rejected' ? result.reason : 'Unknown error');
        }
      }

      // 全問題を統合
      this.allQuestions = this.loadedFiles.flatMap(file => file.questions);

      console.log(`✅ 読み込み完了: ${successCount}/${jsonFiles.length}ファイル, 合計${totalQuestions}問`);
      if (this.aiEnhancementEnabled && enhancedQuestions > 0) {
        console.log(`🤖 AI拡張: ${enhancedQuestions}問が拡張されました`);
      }
      console.log(`📊 カテゴリー別内訳:`, this.getCategoryBreakdown());

    } catch (error) {
      console.error('❌ ファイル読み込み中にエラー:', error);
      throw error;
    }
  }

  // 単一JSONファイルの読み込み（AI拡張オプション付き）
  private async loadSingleFile(fileName: string, enableAIEnhancement = false): Promise<LoadedQuestionFile | null> {
    try {
      // Vite対応の静的インポートマップを使用
      const rawData = await this.importJsonFile(fileName);

      console.log(`📖 ${fileName} 読み込み中...`);

      // JSON構造の検証と変換
      let convertedQuestions = this.convertRawDataToStaticQuestions(rawData.default || rawData, fileName);

      if (convertedQuestions.length === 0) {
        console.warn(`⚠️ ${fileName}: 有効な問題が見つかりませんでした`);
        return null;
      }

      // AI拡張機能が有効な場合、設問と選択肢を拡張
      if (enableAIEnhancement && this.aiProvider) {
        console.log(`🤖 ${fileName}: AI拡張処理中...`);
        const enhancedQuestions = [];

        for (const question of convertedQuestions) {
          try {
            // 設問本体の拡張
            const enhancedQuestion = await this.enhanceQuestionWithAI(question);

            // 各選択肢の拡張
            const enhancedOptions = [];
            for (const option of enhancedQuestion.options) {
              const enhancedOption = await this.enhanceOptionWithAI(option, enhancedQuestion.description);
              enhancedOptions.push(enhancedOption);
            }

            enhancedQuestions.push({
              ...enhancedQuestion,
              options: enhancedOptions
            });

          } catch (error) {
            console.warn(`⚠️ ${fileName} 問題${question.id} AI拡張エラー:`, error);
            // 拡張失敗時は元の問題を使用
            enhancedQuestions.push(question);
          }
        }

        convertedQuestions = enhancedQuestions;
        console.log(`✨ ${fileName}: ${enhancedQuestions.length}問のAI拡張完了`);
      }

      const categoryName = this.extractCategoryFromFileName(fileName);

      return {
        fileName,
        category: categoryName,
        questions: convertedQuestions,
        loadedAt: new Date()
      };

    } catch (error) {
      console.error(`❌ ${fileName} 読み込みエラー:`, error);
      return null;
    }
  }

  // 生データをStaticQuestion形式に変換
  private convertRawDataToStaticQuestions(rawData: RawQuestionData, fileName: string): StaticQuestion[] {
    const questions: StaticQuestion[] = [];

    // カテゴリーごとに処理
    Object.entries(rawData).forEach(([categoryKey, categoryQuestions]) => {
      if (!Array.isArray(categoryQuestions)) return;

      categoryQuestions.forEach((rawQuestion, index) => {
        try {
          const convertedQuestion = this.convertSingleQuestion(
            rawQuestion,
            categoryKey,
            fileName,
            index
          );
          if (convertedQuestion) {
            questions.push(convertedQuestion);
          }
        } catch (error) {
          console.error(`❌ ${fileName} 設問${rawQuestion.設問番号}変換エラー:`, error);
        }
      });
    });

    return questions;
  }

  // 単一問題の変換
  private convertSingleQuestion(
    rawQuestion: any,
    categoryKey: string,
    fileName: string,
    index: number
  ): StaticQuestion | null {
    if (!rawQuestion.本文 || !rawQuestion.選択肢) {
      console.warn(`⚠️ ${fileName}: 不完全な問題データをスキップ`);
      return null;
    }

    // ユニークIDの生成（ファイル名 + 設問番号）
    const questionId = `${fileName.replace('.json', '')}_q${rawQuestion.設問番号 || index + 1}`;

    // 選択肢の変換
    const options: StaticQuestionOption[] = [];
    Object.entries(rawQuestion.選択肢).forEach(([optionId, optionText]) => {
      if (typeof optionText === 'string') {
        options.push(this.createDefaultOption(optionId, optionText));
      }
    });

    // 注釈の処理
    let description = rawQuestion.本文;
    if (rawQuestion.注釈) {
      const annotations = Object.entries(rawQuestion.注釈)
        .map(([key, value]) => `${key} ${value}`)
        .join('\n');
      description += `\n\n${annotations}`;
    }

    return {
      id: questionId,
      category: this.cleanCategoryName(categoryKey),
      subcategory: '一般',
      questionNumber: rawQuestion.設問番号 || index + 1,
      title: this.generateTitleFromText(rawQuestion.本文),
      description,
      options,
      academicElements: {
        theoreticalFramework: '政治学・公共政策学の基礎理論',
        comparativeCase: '国際比較分析による政策評価',
        keyStakeholders: ['政府', '国民', '関係団体'],
        evaluationCriteria: ['政策効果', '実現可能性', '社会的影響'],
        researchQuestions: ['この政策の長期的効果は？', '他国との比較での優位性は？']
      },
      difficulty: 'intermediate',
      timeConstraint: '政策検討期間（1-3年）'
    };
  }

  // AI APIによる選択肢拡張機能
  public async enhanceOptionWithAI(option: StaticQuestionOption, questionContext: string): Promise<StaticQuestionOption> {
    try {
      const enhancementPrompt = `
以下の政策選択肢を大学研究レベルで拡張してください：

【問題文】: ${questionContext}
【選択肢】: ${option.text}
【現在のタイプ】: ${option.type}

以下のJSON形式で改善された選択肢を返してください：
{
  "enhancedText": "より詳細で学術的な選択肢文",
  "policyDetails": {
    "implementationSteps": "具体的実施手順",
    "budgetEstimate": "予算規模",
    "timeframe": "実施期間",
    "responsibleMinistry": "担当省庁"
  },
  "theoreticalJustification": "政策理論的根拠",
  "academicReferences": "関連学術理論や研究",
  "effectsRefinement": {
    "approvalRating": "支持率への影響（-50〜+50）",
    "gdp": "GDP影響（-100〜+100）",
    "nationalDebt": "国債への影響（-200〜+200）",
    "technology": "技術革新（-20〜+20）",
    "environment": "環境影響（-30〜+30）",
    "stockPrice": "株価影響（-1000〜+1000）",
    "usdJpyRate": "為替影響（-10〜+10）",
    "diplomacy": "外交影響（-20〜+20）"
  }
}`;

      const response = await this.aiProvider!.generateResponse(enhancementPrompt);
      const enhancement = JSON.parse(response);

      return {
        ...option,
        text: enhancement.enhancedText || option.text,
        policyDetails: enhancement.policyDetails,
        theoreticalJustification: enhancement.theoreticalJustification,
        academicReferences: enhancement.academicReferences,
        expectedEffects: {
          approvalRating: parseInt(enhancement.effectsRefinement.approvalRating) || option.expectedEffects.approvalRating,
          gdp: parseInt(enhancement.effectsRefinement.gdp) || option.expectedEffects.gdp,
          nationalDebt: parseInt(enhancement.effectsRefinement.nationalDebt) || option.expectedEffects.nationalDebt,
          technology: parseInt(enhancement.effectsRefinement.technology) || option.expectedEffects.technology,
          environment: parseInt(enhancement.effectsRefinement.environment) || option.expectedEffects.environment,
          stockPrice: parseInt(enhancement.effectsRefinement.stockPrice) || option.expectedEffects.stockPrice,
          usdJpyRate: parseInt(enhancement.effectsRefinement.usdJpyRate) || option.expectedEffects.usdJpyRate,
          diplomacy: parseInt(enhancement.effectsRefinement.diplomacy) || option.expectedEffects.diplomacy
        }
      };

    } catch (error) {
      console.warn(`⚠️ AI拡張失敗 (${option.id}):`, error);
      return option; // 拡張失敗時は元の選択肢を返す
    }
  }

  // AI APIによる設問拡張機能
  public async enhanceQuestionWithAI(question: StaticQuestion): Promise<StaticQuestion> {
    try {
      const enhancementPrompt = `
以下の政策設問を大学研究レベルで拡張してください：

【カテゴリー】: ${question.category}
【設問】: ${question.description}
【現在の学術要素】: ${JSON.stringify(question.academicElements)}

以下のJSON形式で改善された設問を返してください：
{
  "enhancedDescription": "より詳細で学術的な設問文",
  "contextualBackground": "政策的背景と現状分析",
  "academicEnhancements": {
    "theoreticalFramework": "適用可能な政治学・政策学理論",
    "comparativeCase": "国際比較事例と先行研究",
    "keyStakeholders": ["主要関係者1", "主要関係者2"],
    "evaluationCriteria": ["評価基準1", "評価基準2"],
    "researchQuestions": ["研究課題1", "研究課題2"]
  },
  "difficulty": "beginner|intermediate|advanced",
  "timeConstraint": "政策検討・実施の時間枠"
}`;

      const response = await this.aiProvider!.generateResponse(enhancementPrompt);
      const enhancement = JSON.parse(response);

      return {
        ...question,
        description: enhancement.enhancedDescription || question.description,
        contextualBackground: enhancement.contextualBackground,
        academicElements: {
          ...question.academicElements,
          ...enhancement.academicEnhancements
        },
        difficulty: enhancement.difficulty || question.difficulty,
        timeConstraint: enhancement.timeConstraint || question.timeConstraint
      };

    } catch (error) {
      console.warn(`⚠️ 設問AI拡張失敗 (${question.id}):`, error);
      return question; // 拡張失敗時は元の設問を返す
    }
  }

  // デフォルトの選択肢作成
  private createDefaultOption(id: string, text: string): StaticQuestionOption {
    // テキスト解析による効果推定
    const effects = this.estimateEffectsFromText(text);
    const type = this.determineOptionType(text);
    const stance = this.determineStance(text, type);

    return {
      id,
      text,
      type,
      stance,
      expectedEffects: effects
    };
  }

  // テキストから効果を推定
  private estimateEffectsFromText(text: string): any {
    const baseEffects = {
      approvalRating: 0, gdp: 0, nationalDebt: 0, technology: 0,
      environment: 0, stockPrice: 0, usdJpyRate: 0, diplomacy: 0
    };

    // キーワードベースの効果推定
    if (text.includes('無償') || text.includes('支援') || text.includes('手当')) {
      baseEffects.approvalRating = Math.floor(Math.random() * 15) + 5;
      baseEffects.nationalDebt = Math.floor(Math.random() * 80) + 20;
    }

    if (text.includes('極端') || text.includes('義務化')) {
      baseEffects.approvalRating = Math.floor(Math.random() * 20) - 25;
      baseEffects.gdp = Math.floor(Math.random() * 20) - 10;
    }

    if (text.includes('珍回答')) {
      baseEffects.approvalRating = Math.floor(Math.random() * 15) + 10;
      baseEffects.diplomacy = Math.floor(Math.random() * 6) - 3;
    }

    return baseEffects;
  }

  // 選択肢タイプの判定
  private determineOptionType(text: string): 'realistic' | 'humorous' | 'extreme' {
    if (text.includes('珍回答')) return 'humorous';
    if (text.includes('極端') || text.includes('全面') || text.includes('完全')) return 'extreme';
    return 'realistic';
  }

  // 政治的立場の判定
  private determineStance(text: string, type: 'realistic' | 'humorous' | 'extreme'): 'conservative' | 'liberal' | 'moderate' | 'progressive' | 'populist' | 'technocratic' | 'centrist' {
    if (type === 'humorous') return 'populist';
    if (type === 'extreme') return 'conservative';

    if (text.includes('支援') || text.includes('無償') || text.includes('拡大')) return 'progressive';
    if (text.includes('規制') || text.includes('削減') || text.includes('見直し')) return 'conservative';
    if (text.includes('技術') || text.includes('AI') || text.includes('効率')) return 'technocratic';

    return 'moderate';
  }

  // Vite対応のJSONファイルインポート
  private async importJsonFile(fileName: string): Promise<any> {
    // 静的インポートマップを使用（Vite最適化対応）
    const importMap: Record<string, () => Promise<any>> = {
      'A_人口・社会保障.json': () => import('../data/A_人口・社会保障.json'),
      'B_財政・経済.json': () => import('../data/B_財政・経済.json'),
      'C_外交・安全保障.json': () => import('../data/C_外交・安全保障.json'),
      'D_環境・エネルギー.json': () => import('../data/D_環境・エネルギー.json'),
      'E_科学技術・デジタル.json': () => import('../data/E_科学技術・デジタル.json'),
      'F_地方・都市.json': () => import('../data/F_地方・都市.json'),
      'G_教育・労働.json': () => import('../data/G_教育・労働.json'),
      'H_法制度・統治.json': () => import('../data/H_法制度・統治.json'),
      'I_文化・移民.json': () => import('../data/I_文化・移民.json'),
      'J_国際秩序・地政学.json': () => import('../data/J_国際秩序・地政学.json')
    };

    const importFunction = importMap[fileName];
    if (!importFunction) {
      throw new Error(`未知のファイル: ${fileName}`);
    }

    return await importFunction();
  }

  // JSONファイル一覧取得（ブラウザ環境対応）
  private async getJsonFileList(): Promise<string[]> {
    // 静的ファイルリスト（Vite最適化済み）
    return [
      'A_人口・社会保障.json',
      'B_財政・経済.json',
      'C_外交・安全保障.json',
      'D_環境・エネルギー.json',
      'E_科学技術・デジタル.json',
      'F_地方・都市.json',
      'G_教育・労働.json',
      'H_法制度・統治.json',
      'I_文化・移民.json',
      'J_国際秩序・地政学.json'
    ];
  }

  // ファイル名からカテゴリー名を抽出
  private extractCategoryFromFileName(fileName: string): string {
    const match = fileName.match(/^[A-J]_(.+)\.json$/);
    return match ? match[1] : fileName.replace('.json', '');
  }

  // カテゴリー名のクリーンアップ
  private cleanCategoryName(categoryName: string): string {
    return categoryName.replace(/^[A-J]\.\s*/, '');
  }

  // タイトル生成
  private generateTitleFromText(text: string): string {
    if (text.length <= 30) return text;
    return text.substring(0, 30) + '...';
  }

  // カテゴリー別内訳取得
  private getCategoryBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    this.loadedFiles.forEach(file => {
      breakdown[file.category] = file.questions.length;
    });
    return breakdown;
  }

  // パブリックメソッド
  public getAllQuestions(): StaticQuestion[] {
    return [...this.allQuestions];
  }

  public getQuestionsByCategory(category: string): StaticQuestion[] {
    return this.allQuestions.filter(q => q.category === category);
  }

  public getTotalQuestionCount(): number {
    return this.allQuestions.length;
  }

  public getLoadedFileInfo(): LoadedQuestionFile[] {
    return [...this.loadedFiles];
  }

  public getCategoryList(): string[] {
    return [...new Set(this.allQuestions.map(q => q.category))];
  }

  // AI拡張の設定変更
  public setAIEnhancementEnabled(enabled: boolean): void {
    this.aiEnhancementEnabled = enabled && !!this.aiProvider;
    console.log(`🤖 AI拡張機能: ${this.aiEnhancementEnabled ? '有効' : '無効'}`);
  }

  // バッチAI拡張処理（既にロードされた設問に対して）
  public async batchEnhanceQuestions(categoryFilter?: string): Promise<void> {
    if (!this.aiEnhancementEnabled) {
      console.warn('⚠️ AI拡張機能が無効です');
      return;
    }

    console.log('🚀 バッチAI拡張処理開始...');

    let targetQuestions = this.allQuestions;
    if (categoryFilter) {
      targetQuestions = this.allQuestions.filter(q => q.category === categoryFilter);
      console.log(`📂 カテゴリー「${categoryFilter}」のみ処理: ${targetQuestions.length}問`);
    }

    let enhancedCount = 0;

    for (let i = 0; i < targetQuestions.length; i++) {
      const question = targetQuestions[i];

      // 既に拡張済みかチェック
      if (question.contextualBackground) {
        console.log(`⏩ ${question.id}: 既に拡張済み`);
        continue;
      }

      try {
        console.log(`🔄 ${i + 1}/${targetQuestions.length}: ${question.id} 拡張中...`);

        // 設問拡張
        const enhancedQuestion = await this.enhanceQuestionWithAI(question);

        // 選択肢拡張
        const enhancedOptions = [];
        for (const option of enhancedQuestion.options) {
          const enhancedOption = await this.enhanceOptionWithAI(option, enhancedQuestion.description);
          enhancedOptions.push(enhancedOption);
        }

        // 元の配列の該当箇所を更新
        const index = this.allQuestions.findIndex(q => q.id === question.id);
        if (index !== -1) {
          this.allQuestions[index] = {
            ...enhancedQuestion,
            options: enhancedOptions
          };
          enhancedCount++;
        }

      } catch (error) {
        console.error(`❌ ${question.id} バッチ拡張エラー:`, error);
      }
    }

    console.log(`✅ バッチAI拡張完了: ${enhancedCount}問が拡張されました`);
  }

  // AI拡張の統計情報
  public getEnhancementStatistics() {
    const totalQuestions = this.allQuestions.length;
    const enhancedQuestions = this.allQuestions.filter(q => q.contextualBackground).length;
    const enhancementRate = totalQuestions > 0 ? (enhancedQuestions / totalQuestions * 100).toFixed(1) : '0.0';

    return {
      total: totalQuestions,
      enhanced: enhancedQuestions,
      enhancementRate: `${enhancementRate}%`,
      aiEnabled: this.aiEnhancementEnabled
    };
  }
}