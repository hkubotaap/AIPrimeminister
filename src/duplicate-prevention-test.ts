// 重複防止機能のテストファイル
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

// 重複防止機能のテスト関数
export async function testDuplicationPrevention() {
  console.log('🔬 重複防止機能テスト開始');

  // AIProviderManagerの初期化（テスト用）
  const aiProvider = new AIProviderManager({
    geminiApiKey: 'test_key',
    ollamaBaseUrl: 'http://localhost:11434',
    defaultProvider: 'gemini',
    enableFallback: true
  });

  // EventGeneratorの初期化（AI拡張機能統合版）
  const eventGenerator = new EventGenerator(aiProvider, true, true);

  // データ読み込み
  await eventGenerator.reloadQuestionData();

  console.log('\n📊 初期状態確認:');
  console.log(eventGenerator.getUsageStatus());
  console.log('\n🎯 カテゴリー別利用可能設問数:');
  console.log(eventGenerator.getAvailableQuestionsByCategory());
  console.log('\n🤖 AI拡張統計:');
  console.log(eventGenerator.getDataLoaderStatistics());

  // 複数回のイベント生成テスト（静的設問重複チェック）
  console.log('\n🎲 連続イベント生成テスト:');

  for (let i = 1; i <= 6; i++) {
    console.log(`\n--- ${i}回目のイベント生成 ---`);

    try {
      const event = await eventGenerator.generateEvent(testContext);
      console.log(`✅ 生成成功: ${event.title}`);
      console.log(`ID: ${event.id}`);
      console.log(`カテゴリー: ${event.category}`);
      console.log(`AI生成: ${event.aiGenerated ? 'Yes' : 'No'}`);

      // 現在の使用状況
      const status = eventGenerator.getUsageStatus();
      console.log(`📈 進捗: ${status.staticQuestions.used}/${status.staticQuestions.total} 静的設問使用`);

    } catch (error) {
      console.error(`❌ 生成エラー: ${error}`);
    }
  }

  console.log('\n📈 最終統計:');
  console.log(eventGenerator.getStatistics());

  console.log('\n🔄 リセット機能テスト:');
  eventGenerator.resetStaticQuestionsOnly();
  console.log('静的設問リセット後の状況:');
  console.log(eventGenerator.getUsageStatus());

  console.log('\n🔬 重複防止機能テスト完了');
}

// テスト実行（手動実行用）
if (require.main === module) {
  testDuplicationPrevention().catch(console.error);
}