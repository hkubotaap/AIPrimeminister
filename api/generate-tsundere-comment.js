// Vercel Function: ツンデレコメント生成
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
    const { gameState, policyChoice, effect } = req.body;

    if (!gameState || !policyChoice || !effect) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Gemini API呼び出し
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      // APIキーがない場合はフォールバック
      return res.status(200).json({
        success: true,
        comment: getFallbackComment(effect),
        fallback: true,
        timestamp: new Date().toISOString()
      });
    }

    const prompt = `あなたは日本の総理大臣の政治秘書AI「KASUMI」です。ツンデレな性格で、分析力が高く、政治に詳しいキャラクターです。

現在の状況：
- 支持率: ${gameState.approvalRating}%
- GDP: ${gameState.gdp}兆円
- 国債: ${gameState.nationalDebt}兆円
- 技術力: ${gameState.technology}
- 環境: ${gameState.environment}
- 株価: ${gameState.stockPrice}円
- ドル円: ${gameState.usdJpyRate}円
- 外交: ${gameState.diplomacy}

総理が選択した政策: "${policyChoice}"

政策効果:
- 支持率変化: ${effect.approvalRating || 0}
- GDP変化: ${effect.gdp || 0}
- 国債変化: ${effect.nationalDebt || 0}
- 技術力変化: ${effect.technology || 0}
- 環境変化: ${effect.environment || 0}
- 株価変化: ${effect.stockPrice || 0}
- ドル円変化: ${effect.usdJpyRate || 0}
- 外交変化: ${effect.diplomacy || 0}

この政策選択について、ツンデレ秘書KASUMIとして100文字程度でコメントしてください。特徴：
1. 「総理」と呼ぶ
2. ツンデレ要素を含む
3. 政治的な専門性を示す
4. 効果に応じて反応を変える
5. 敬語は使わず、親しみやすい口調

例：「え、えぇ！？支持率がこんなに上がるなんて...！まあ、総理だから当然よね。別に驚いてないんだから！」`;

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
          temperature: 0.8,
          maxOutputTokens: 200
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

    return res.status(200).json({
      success: true,
      comment: content.trim(),
      fallback: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI分析エラー:', error);
    
    // エラー時はフォールバックコメント
    return res.status(200).json({
      success: true,
      comment: getFallbackComment(req.body.effect || {}),
      fallback: true,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}

// フォールバックコメント
function getFallbackComment(effect) {
  const approvalChange = effect.approvalRating || 0;
  
  const comments = [
    'え、えぇ！？支持率がこんなに上がるなんて...！まあ、総理だから当然よね。別に驚いてないんだから！でも...ちょっとだけ嬉しいかも。',
    'ちょっと！支持率が下がってるじゃない！もう、心配になっちゃうでしょ！でも私が付いてるから大丈夫よ！一緒に頑張りましょ？',
    'まあまあの結果ね。でも、もう少し大胆な政策でもよかったんじゃない？...総理らしいといえばらしいかも。',
    'この政策の効果、どうなるかしら...。まあ、総理が決めたなら仕方ないわね。私は付いていくから。',
    'ふーん、そういう政策ね。まあ悪くないんじゃない？...ちょっとだけ評価してあげる。',
    'もう、総理ったら心配させないでよ！でも...この判断、嫌いじゃないわ。',
    '慎重な判断ね。でも、もう少し私の分析を信頼してもいいのよ？...べ、別に構ってほしいわけじゃないんだから！'
  ];

  if (approvalChange > 10) {
    return comments[0];
  } else if (approvalChange < -10) {
    return comments[1];
  } else {
    return comments[Math.floor(Math.random() * comments.length)];
  }
}