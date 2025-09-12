import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// 環境変数読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// セキュリティミドルウェア
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3001"],
    },
  },
}));

// CORS設定
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5175'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// レート制限
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1分
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100リクエスト/分
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// JSON解析
app.use(express.json({ limit: '10mb' }));

// Gemini API設定
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set in environment variables');
  process.exit(1);
}

console.log('✅ Gemini API Key loaded successfully');

// 入力検証ミドルウェア
const validateInput = (req, res, next) => {
  const { gameState, policyChoice, effect } = req.body;
  
  // 必須フィールドチェック
  if (!gameState || !policyChoice || !effect) {
    return res.status(400).json({
      error: 'Missing required fields: gameState, policyChoice, effect'
    });
  }
  
  // 文字数制限
  if (policyChoice.length > 200) {
    return res.status(400).json({
      error: 'Policy choice text is too long (max 200 characters)'
    });
  }
  
  // 危険な文字列チェック
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /function\s*\(/i
  ];
  
  if (dangerousPatterns.some(pattern => pattern.test(policyChoice))) {
    return res.status(400).json({
      error: 'Invalid characters detected in policy choice'
    });
  }
  
  next();
};

// ヘルスチェックエンドポイント
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// ツンデレコメント生成エンドポイント
app.post('/api/generate-tsundere-comment', validateInput, async (req, res) => {
  try {
    const { gameState, policyChoice, effect } = req.body;
    
    console.log('🤖 ツンデレコメント生成リクエスト受信');
    console.log('政策選択:', policyChoice);
    
    const prompt = `
あなたは日本の総理大臣のツンデレAI政治秘書KASUMIです。

現在の状況:
- 支持率: ${gameState.approvalRating}%
- GDP: ${gameState.gdp}兆円
- 国債: ${gameState.nationalDebt}兆円
- 株価: ${gameState.stockPrice}円
- ドル円: ${gameState.usdJpyRate}円
- 外交: ${gameState.diplomacy}%

選択した政策: ${policyChoice}
政策効果: 支持率${effect.approvalRating || 0}, GDP${effect.gdp || 0}, 株価${effect.stockPrice || 0}

150文字以内でツンデレ口調の分析コメントを生成してください。
「総理」と呼びかけ、照れや強がり、本音を含めてください。
政治的な専門用語も使いながら、感情豊かに表現してください。
`;

    const response = await fetch(`${GEMINI_BASE_URL}?key=${GEMINI_API_KEY}`, {
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
          temperature: 0.9,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 300,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API Error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const comment = data.candidates[0]?.content?.parts[0]?.text;
    
    if (!comment) {
      throw new Error('No comment generated from Gemini API');
    }
    
    console.log('✅ ツンデレコメント生成成功');
    
    res.json({
      success: true,
      comment: comment,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ツンデレコメント生成エラー:', error);
    
    // フォールバックコメント
    const fallbackComments = [
      'え、えぇ！？支持率がこんなに上がるなんて...！まあ、総理だから当然よね。別に驚いてないんだから！でも...ちょっとだけ嬉しいかも。',
      'ちょっと！支持率が下がってるじゃない！もう、心配になっちゃうでしょ！でも私が付いてるから大丈夫よ！一緒に頑張りましょ？',
      'まあまあの結果ね。でも、もう少し大胆な政策でもよかったんじゃない？...総理らしいといえばらしいかも。',
      'この政策の効果、どうなるかしら...。まあ、総理が決めたなら仕方ないわね。私は付いていくから。',
      'ふーん、そういう政策ね。まあ悪くないんじゃない？...ちょっとだけ評価してあげる。'
    ];
    
    const fallbackComment = fallbackComments[Math.floor(Math.random() * fallbackComments.length)];
    
    res.json({
      success: true,
      comment: fallbackComment,
      fallback: true,
      timestamp: new Date().toISOString()
    });
  }
});

// 政策分析エンドポイント
app.post('/api/analyze-policy', validateInput, async (req, res) => {
  try {
    const { gameState, policyChoice, eventContext } = req.body;
    
    console.log('📊 政策分析リクエスト受信');
    
    const prompt = `
あなたは日本の政治・経済の専門家AIです。以下の政策選択を分析し、現実的な影響を評価してください。

現在の状況:
- 支持率: ${gameState.approvalRating}%
- GDP: ${gameState.gdp}兆円
- 国債: ${gameState.nationalDebt}兆円
- 技術力: ${gameState.technology}%
- 環境: ${gameState.environment}%
- 株価: ${gameState.stockPrice}円
- ドル円レート: ${gameState.usdJpyRate}円
- 外交: ${gameState.diplomacy}%

問題: ${eventContext}
選択した政策: ${policyChoice}

以下の形式でJSONレスポンスを返してください:
{
  "evaluation": "政策の総合評価（良い/普通/悪い）",
  "effects": {
    "approvalRating": 数値変化(-20から+20),
    "gdp": 数値変化(-50から+50),
    "nationalDebt": 数値変化(-100から+100),
    "technology": 数値変化(-15から+15),
    "environment": 数値変化(-15から+15),
    "stockPrice": 数値変化(-2000から+2000),
    "usdJpyRate": 数値変化(-10から+10),
    "diplomacy": 数値変化(-15から+15)
  },
  "reasoning": "政策選択の詳細な分析と理由"
}
`;

    const response = await fetch(`${GEMINI_BASE_URL}?key=${GEMINI_API_KEY}`, {
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
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates[0]?.content?.parts[0]?.text || '';

    // JSONレスポンスをパース
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      res.json({
        success: true,
        analysis: analysis,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Invalid JSON response from Gemini API');
    }
    
  } catch (error) {
    console.error('❌ 政策分析エラー:', error);
    
    // フォールバック分析
    const fallbackAnalysis = {
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
      reasoning: "政策分析を実行しました。現在はオフラインモードで動作しています。"
    };
    
    res.json({
      success: true,
      analysis: fallbackAnalysis,
      fallback: true,
      timestamp: new Date().toISOString()
    });
  }
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404ハンドリング
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 AI Prime Minister Server running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Allowed Origins: ${allowedOrigins.join(', ')}`);
});