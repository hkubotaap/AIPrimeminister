// Vercel Function: 政策分析
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
    const { gameState, policyChoice, eventContext } = req.body;

    if (!gameState || !policyChoice || !eventContext) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Gemini API呼び出し
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      // APIキーがない場合はフォールバック
      return res.status(200).json({
        success: true,
        analysis: getFallbackAnalysis(policyChoice),
        fallback: true,
        timestamp: new Date().toISOString()
      });
    }

    const prompt = `あなたは日本政治の専門家として、総理大臣の政策決定を分析してください。

現在の政治状況：
- 支持率: ${gameState.approvalRating}%
- GDP: ${gameState.gdp}兆円  
- 国債: ${gameState.nationalDebt}兆円
- 技術力指数: ${gameState.technology}
- 環境指数: ${gameState.environment}
- 日経平均: ${gameState.stockPrice}円
- ドル円レート: ${gameState.usdJpyRate}円
- 外交指数: ${gameState.diplomacy}

政治情勢：
${eventContext}

選択された政策：
"${policyChoice}"

この政策選択について、以下の形式で分析してください：

{
  "evaluation": "優秀/良好/普通/懸念/危険",
  "effects": {
    "approvalRating": [支持率への影響 -30から+30の数値],
    "gdp": [GDP成長率への影響 -50から+50の数値],
    "nationalDebt": [国債増減への影響 -100から+200の数値],
    "technology": [技術力への影響 -20から+20の数値],
    "environment": [環境への影響 -20から+20の数値],
    "stockPrice": [株価への影響 -3000から+3000の数値],
    "usdJpyRate": [為替への影響 -20から+20の数値],
    "diplomacy": [外交への影響 -20から+20の数値]
  },
  "reasoning": "この政策選択の理由と期待される効果について150文字程度で説明",
  "confidence": [分析の信頼度 0-100の数値],
  "timeframe": "短期/中期/長期",
  "risks": ["リスク1", "リスク2"],
  "opportunities": ["機会1", "機会2"]
}

現実的な政治・経済への影響を考慮し、過度に楽観的または悲観的にならずバランスの取れた分析を行ってください。`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('No content generated from Gemini API');
    }

    // JSON形式の回答をパース
    let analysis;
    try {
      // ```json ``` で囲まれている場合の処理
      const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      analysis = JSON.parse(jsonString);
    } catch (parseError) {
      throw new Error('Failed to parse JSON response from AI');
    }

    return res.status(200).json({
      success: true,
      analysis,
      fallback: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('政策分析エラー:', error);
    
    // エラー時はフォールバック分析
    return res.status(200).json({
      success: true,
      analysis: getFallbackAnalysis(req.body.policyChoice || '不明な政策'),
      fallback: true,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

// フォールバック分析
function getFallbackAnalysis(policyChoice) {
  return {
    evaluation: "普通",
    effects: {
      approvalRating: Math.floor(Math.random() * 21) - 10,
      gdp: Math.floor(Math.random() * 31) - 15,
      nationalDebt: Math.floor(Math.random() * 61) - 30,
      technology: Math.floor(Math.random() * 11) - 5,
      environment: Math.floor(Math.random() * 11) - 5,
      stockPrice: Math.floor(Math.random() * 2001) - 1000,
      usdJpyRate: Math.floor(Math.random() * 11) - 5,
      diplomacy: Math.floor(Math.random() * 11) - 5
    },
    reasoning: `政策「${policyChoice}」について分析を実行しました。現在はオフライン分析モードで動作しています。`,
    confidence: 70,
    timeframe: "中期",
    risks: ["実施上の課題", "予期せぬ副作用"],
    opportunities: ["政策効果の拡大", "国民の理解促進"]
  };
}