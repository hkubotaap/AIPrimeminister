// AI拡張機能テストファイル
import { EventGenerator, EventGenerationContext } from './event-generator';
import { AIProviderManager } from './ai-provider';

// テスト用のコンテキスト
const testContext: EventGenerationContext = {
  currentState: {
    turn: 1,
    maxTurns: 20,
    approvalRating: 50,
    gdp: 540,
    nationalDebt: 1200,
    technology: 50,
    environment: 50,
    stockPrice: 28000,
    usdJpyRate: 150,
    diplomacy: 50
  },
  politicalTrends: {
    approvalTrend: 'stable',
    economicTrend: 'stable',
    riskLevel: 'medium'
  },
  previousEvents: [],
  previousChoices: [],
  usedEventIds: [],
  gamePhase: 'early',
  currentSeason: 'spring',
  globalContext: {
    economicClimate: 'stable',
    internationalTensions: 'medium',
    domesticPressure: 'medium'
  }
};

// AI拡張機能の総合テスト関数
export async function testAIEnhancementFeatures() {
  console.log('🧪 AI拡張機能総合テスト開始');

  // AIProviderManagerの初期化
  const aiProvider = new AIProviderManager({
    geminiApiKey: process.env.GEMINI_API_KEY || 'test_key',
    ollamaBaseUrl: 'http://localhost:11434',
    defaultProvider: 'gemini',
    enableFallback: true
  });

  console.log('\n=== テスト1: AI拡張無効での動作 ===');
  await testWithoutAIEnhancement(aiProvider);

  console.log('\n=== テスト2: AI拡張有効での動作 ===');
  await testWithAIEnhancement(aiProvider);

  console.log('\n=== テスト3: バッチAI拡張機能 ===');
  await testBatchEnhancement(aiProvider);

  console.log('\n=== テスト4: 統計情報と制御機能 ===');
  await testStatisticsAndControls(aiProvider);

  console.log('\n🏁 AI拡張機能総合テスト完了');
}

// テスト1: AI拡張無効での基本動作
async function testWithoutAIEnhancement(aiProvider: AIProviderManager) {
  console.log('🔧 AI拡張無効モードでのEventGenerator初期化');

  // AI拡張無効でEventGenerator作成
  const eventGenerator = new EventGenerator(aiProvider, true, false);

  try {
    // データ読み込み
    await eventGenerator.reloadQuestionData();

    // 統計確認
    const stats = eventGenerator.getDataLoaderStatistics();
    console.log('📊 拡張無効時の統計:', stats);

    // イベント生成テスト
    console.log('🎲 イベント生成テスト...');
    const event = await eventGenerator.generateEvent(testContext);
    console.log(`✅ 生成成功: ${event.title}`);
    console.log(`📂 カテゴリー: ${event.category}`);
    console.log(`🤖 AI生成: ${event.aiGenerated ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error('❌ AI拡張無効テストでエラー:', error);
  }
}

// テスト2: AI拡張有効での動作
async function testWithAIEnhancement(aiProvider: AIProviderManager) {
  console.log('🤖 AI拡張有効モードでのEventGenerator初期化');

  // AI拡張有効でEventGenerator作成
  const eventGenerator = new EventGenerator(aiProvider, true, true);

  try {
    // データ読み込み（AI拡張付き）
    await eventGenerator.reloadQuestionData();

    // 統計確認
    const stats = eventGenerator.getDataLoaderStatistics();
    console.log('📊 拡張有効時の統計:', stats);

    if (stats.enhanced > 0) {
      console.log(`✨ ${stats.enhanced}問がAI拡張されました（拡張率: ${stats.enhancementRate}）`);
    } else {
      console.log('⚠️ AI拡張が実行されませんでした（APIキー未設定の可能性）');
    }

    // イベント生成テスト
    console.log('🎲 AI拡張設問でのイベント生成テスト...');

    for (let i = 1; i <= 3; i++) {
      const event = await eventGenerator.generateEvent(testContext);
      console.log(`\n--- ${i}回目の生成 ---`);
      console.log(`📋 タイトル: ${event.title}`);
      console.log(`📂 カテゴリー: ${event.category}`);

      // AI拡張された設問かチェック
      if (event.backgroundInfo && typeof event.backgroundInfo === 'object') {
        console.log('✨ AI拡張コンテンツ検出');
        if (event.backgroundInfo.theoreticalRelevance) {
          console.log(`📚 理論的関連性: ${event.backgroundInfo.theoreticalRelevance.substring(0, 100)}...`);
        }
      }

      // 選択肢の拡張情報チェック
      const enhancedOptions = event.options.filter(option =>
        option.theoreticalJustification || option.policyDetails
      );
      if (enhancedOptions.length > 0) {
        console.log(`🔧 ${enhancedOptions.length}個の選択肢がAI拡張されています`);
      }
    }

  } catch (error) {
    console.error('❌ AI拡張有効テストでエラー:', error);
  }
}

// テスト3: バッチAI拡張機能
async function testBatchEnhancement(aiProvider: AIProviderManager) {
  console.log('🚀 バッチAI拡張機能のテスト');

  const eventGenerator = new EventGenerator(aiProvider, true, false); // 初期は拡張無効

  try {
    // まず拡張無効でデータ読み込み
    await eventGenerator.reloadQuestionData();

    // 拡張前の統計
    let stats = eventGenerator.getDataLoaderStatistics();
    console.log('📊 拡張前の統計:', stats);

    // AI拡張機能を有効化
    eventGenerator.setAIEnhancementEnabled(true);

    // 特定カテゴリーでバッチ拡張テスト
    console.log('📂 「人口・社会保障」カテゴリーのバッチ拡張開始...');
    await eventGenerator.batchEnhanceQuestions('人口・社会保障');

    // 拡張後の統計
    stats = eventGenerator.getDataLoaderStatistics();
    console.log('📊 拡張後の統計:', stats);

    if (stats.enhanced > 0) {
      console.log(`✅ バッチ拡張成功: ${stats.enhanced}問が拡張されました`);
    } else {
      console.log('⚠️ バッチ拡張が実行されませんでした');
    }

  } catch (error) {
    console.error('❌ バッチ拡張テストでエラー:', error);
  }
}

// テスト4: 統計情報と制御機能
async function testStatisticsAndControls(aiProvider: AIProviderManager) {
  console.log('📈 統計情報と制御機能のテスト');

  const eventGenerator = new EventGenerator(aiProvider, true, true);

  try {
    // データ読み込み
    await eventGenerator.reloadQuestionData();

    // 各種統計情報の確認
    console.log('\n📊 使用状況統計:');
    console.log(eventGenerator.getUsageStatus());

    console.log('\n📂 カテゴリー別利用可能設問:');
    console.log(eventGenerator.getAvailableQuestionsByCategory());

    console.log('\n🤖 AI拡張統計:');
    console.log(eventGenerator.getDataLoaderStatistics());

    // 設定変更テスト
    console.log('\n🔧 AI拡張機能のON/OFF切り替えテスト');

    eventGenerator.setAIEnhancementEnabled(false);
    console.log('AI拡張無効化:', eventGenerator.getDataLoaderStatistics().aiEnabled);

    eventGenerator.setAIEnhancementEnabled(true);
    console.log('AI拡張有効化:', eventGenerator.getDataLoaderStatistics().aiEnabled);

  } catch (error) {
    console.error('❌ 統計情報テストでエラー:', error);
  }
}

// パフォーマンステスト
export async function performanceTest() {
  console.log('🏃 AI拡張機能パフォーマンステスト開始');

  const aiProvider = new AIProviderManager({
    geminiApiKey: process.env.GEMINI_API_KEY || 'test_key',
    ollamaBaseUrl: 'http://localhost:11434',
    defaultProvider: 'gemini',
    enableFallback: true
  });

  const eventGenerator = new EventGenerator(aiProvider, true, true);

  try {
    // データ読み込み時間計測
    console.time('データ読み込み時間');
    await eventGenerator.reloadQuestionData();
    console.timeEnd('データ読み込み時間');

    // イベント生成時間計測
    console.log('\n⏱️ イベント生成時間の計測（10回）:');
    const times: number[] = [];

    for (let i = 1; i <= 10; i++) {
      const startTime = Date.now();
      await eventGenerator.generateEvent(testContext);
      const endTime = Date.now();
      const duration = endTime - startTime;
      times.push(duration);
      console.log(`${i}回目: ${duration}ms`);
    }

    // 統計計算
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log(`\n📈 パフォーマンス統計:`);
    console.log(`平均時間: ${avgTime.toFixed(2)}ms`);
    console.log(`最小時間: ${minTime}ms`);
    console.log(`最大時間: ${maxTime}ms`);

  } catch (error) {
    console.error('❌ パフォーマンステストでエラー:', error);
  }
}

// メイン実行関数
export async function runAllTests() {
  console.log('🧪=== AI拡張機能テストスイート実行 ===');

  try {
    await testAIEnhancementFeatures();
    console.log('\n');
    await performanceTest();
  } catch (error) {
    console.error('❌ テスト実行中にエラー:', error);
  }

  console.log('\n🏁 全テスト完了');
}

// テスト実行（手動実行用）
if (require.main === module) {
  runAllTests().catch(console.error);
}