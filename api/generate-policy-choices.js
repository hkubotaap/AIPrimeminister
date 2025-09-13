// Vercel Function: AI駆動政策選択肢生成
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    const { 
      eventTitle, 
      eventDescription, 
      gameState, 
      turn,
      difficulty = 'normal'
    } = req.body;

    // 入力検証
    if (!eventTitle || !eventDescription || !gameState) {
      return res.status(400).json({ 
        error: 'Required fields: eventTitle, eventDescription, gameState' 
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 難易度に応じた選択肢数と複雑さを調整
    const difficultySettings = {
      easy: { choices: 3, complexity: '初心者向けの分かりやすい' },
      normal: { choices: 4, complexity: '中級者向けの現実的な' },
      hard: { choices: 5, complexity: '上級者向けの複雑で高度な' }
    };

    const setting = difficultySettings[difficulty] || difficultySettings.normal;

    const prompt = `あなたは日本の政治・経済・外交の専門家として、現在の政治情勢に基づいて${setting.complexity}政策選択肢を${setting.choices}つ生成してください。

【現在の緊急課題】
ターン: ${turn}/20 (任期残り: ${20-turn}ターン)
イベント: ${eventTitle}
詳細状況: ${eventDescription}

【現在の国政指標】
- 支持率: ${gameState.approvalRating}% ${gameState.approvalRating < 30 ? '(危険水域)' : gameState.approvalRating > 70 ? '(高支持)' : '(中程度)'}
- GDP: ${gameState.gdp}兆円 ${gameState.gdp < 450 ? '(不況)' : gameState.gdp > 550 ? '(好況)' : '(安定)'}
- 国債残高: ${gameState.nationalDebt}兆円 ${gameState.nationalDebt > 1200 ? '(財政危機)' : '(財政健全)'}
- 技術競争力: ${gameState.technology} ${gameState.technology < 30 ? '(後進)' : gameState.technology > 70 ? '(先進)' : '(中位)'}
- 環境対策: ${gameState.environment} ${gameState.environment < 30 ? '(遅れ)' : gameState.environment > 70 ? '(先進)' : '(標準)'}
- 株価: ${gameState.stockPrice}円 ${gameState.stockPrice < 25000 ? '(低迷)' : gameState.stockPrice > 35000 ? '(高騰)' : '(安定)'}
- ドル円: ${gameState.usdJpyRate}円 ${gameState.usdJpyRate > 150 ? '(円安)' : gameState.usdJpyRate < 130 ? '(円高)' : '(適正)'}
- 外交関係: ${gameState.diplomacy} ${gameState.diplomacy < 30 ? '(孤立)' : gameState.diplomacy > 70 ? '(良好)' : '(普通)'}

【選択肢生成ガイドライン】
★政治的スペクトラム全体をカバー：
1. 極左的アプローチ（革命的・急進的変革）
2. 左派的アプローチ（社会民主的・福祉重視）
3. 中道的アプローチ（現実主義・漸進的改革）
4. 右派的アプローチ（市場原理・保守的価值観）
5. 極右的アプローチ（国家主義・権威主義的）

★ドラマチック要素：
- 政治的賭け・リスク要素を含む
- 国際的な注目を集める決断
- 歴史的意義のある政策転換
- 党内・連立内の対立を呼ぶ選択
- メディア・世論を二分する議論

★現実性の確保：
- 2024年現在の日本の政治・経済情勢を反映
- 実際の政策手続き・予算制約を考慮
- 国際情勢（米中対立、ウクライナ情勢、中東情勢）の影響
- 具体的な法案名・制度名・金額を使用
- 政界関係者の反応予測を含む

【効果値の範囲とドラマチック性】
- 支持率: -15〜+15% (極端な政策は大きな変動)
- GDP: -30〜+30兆円 (革命的政策は劇的変化)
- 国債残高: -50〜+50兆円 (財政政策の大胆さを反映)
- 技術力: -20〜+20 (技術立国政策の影響)
- 環境: -20〜+20 (環境vs経済の対立構造)
- 株価: -3000〜+3000円 (市場の激しい反応)
- ドル円レート: -15〜+15円 (為替政策の影響)
- 外交: -20〜+20 (国際関係の劇的変化)

【必須要素】
★各選択肢には以下を含めること：
1. 政治的ポジション（左派/中道/右派）の明示
2. 具体的な予算額・法案名・制度名
3. 政治的リスクと期待効果の詳細
4. 国際的な注目度・インパクト
5. 党内・世論の反応予測

★選択肢の文字数：
- text: 40-80文字（劇的で具体的に）
- description: 80-150文字（政治的背景とリスクを詳述）
- reasoning: 60-120文字（政策論理と政治戦略を解説）

以下のJSON形式で出力してください：
{
  "choices": [
    {
      "text": "【政治的ポジション】具体的政策名：劇的な政策内容（40-80文字）",
      "description": "政策の詳細内容、予算規模、実施方法、政治的リスク、期待効果（80-150文字）",
      "effect": {
        "approvalRating": 数値,
        "gdp": 数値,
        "nationalDebt": 数値,
        "technology": 数値,
        "environment": 数値,
        "stockPrice": 数値,
        "usdJpyRate": 数値,
        "diplomacy": 数値
      },
      "reasoning": "政策の理論的根拠、政治戦略、想定される政治的反応と結果（60-120文字）",
      "politicalRisk": "high/medium/low",
      "internationalImpact": "革命的/重大/中程度/軽微"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // JSONを抽出
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const aiResponse = JSON.parse(jsonMatch[0]);

    // レスポンス検証
    if (!aiResponse.choices || !Array.isArray(aiResponse.choices)) {
      throw new Error('Invalid response format: choices array required');
    }

    // 各選択肢の検証とフォーマット
    const validatedChoices = aiResponse.choices.slice(0, setting.choices).map((choice, index) => {
      if (!choice.text || !choice.effect) {
        throw new Error(`Invalid choice format at index ${index}`);
      }

      // 効果値の範囲チェックと調整（ドラマチック範囲）
      const effect = {
        approvalRating: Math.max(-15, Math.min(15, choice.effect.approvalRating || 0)),
        gdp: Math.max(-30, Math.min(30, choice.effect.gdp || 0)),
        nationalDebt: Math.max(-50, Math.min(50, choice.effect.nationalDebt || 0)),
        technology: Math.max(-20, Math.min(20, choice.effect.technology || 0)),
        environment: Math.max(-20, Math.min(20, choice.effect.environment || 0)),
        stockPrice: Math.max(-3000, Math.min(3000, choice.effect.stockPrice || 0)),
        usdJpyRate: Math.max(-15, Math.min(15, choice.effect.usdJpyRate || 0)),
        diplomacy: Math.max(-20, Math.min(20, choice.effect.diplomacy || 0))
      };

      return {
        text: choice.text.slice(0, 100), // 文字数制限拡大
        description: choice.description?.slice(0, 200) || '',
        effect,
        reasoning: choice.reasoning?.slice(0, 150) || '',
        politicalRisk: choice.politicalRisk || 'medium',
        internationalImpact: choice.internationalImpact || '中程度'
      };
    });

    console.log(`🎯 AI政策選択肢生成成功: ${validatedChoices.length}個の選択肢`);

    return res.status(200).json({
      success: true,
      message: 'Policy choices generated successfully',
      data: {
        choices: validatedChoices,
        metadata: {
          event: eventTitle,
          turn,
          difficulty,
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('政策選択肢生成エラー:', error);
    
    // フォールバック選択肢を提供
    const fallbackChoices = [
      {
        text: '慎重な対応を取る',
        description: '既存の枠組みで段階的に対応',
        effect: { approvalRating: 1, gdp: 1, nationalDebt: 2, technology: 0, environment: 0, stockPrice: 100, usdJpyRate: 0, diplomacy: 1 },
        reasoning: '安定性を重視した保守的アプローチ'
      },
      {
        text: '積極的な改革を実施',
        description: '新しい政策枠組みで根本的解決を図る',
        effect: { approvalRating: -2, gdp: 5, nationalDebt: -5, technology: 3, environment: 2, stockPrice: 300, usdJpyRate: -1, diplomacy: -1 },
        reasoning: '長期的視点での構造改革'
      },
      {
        text: '国際協調を重視',
        description: '他国との連携を強化して対応',
        effect: { approvalRating: 2, gdp: 2, nationalDebt: 1, technology: 1, environment: 1, stockPrice: 200, usdJpyRate: -2, diplomacy: 5 },
        reasoning: '多国間協力による解決'
      }
    ];

    return res.status(200).json({
      success: true,
      message: 'Fallback choices provided due to AI generation error',
      data: {
        choices: fallbackChoices,
        metadata: {
          event: req.body.eventTitle || 'Unknown Event',
          turn: req.body.turn || 1,
          difficulty: 'fallback',
          generatedAt: new Date().toISOString(),
          fallback: true,
          error: error.message
        }
      }
    });
  }
}