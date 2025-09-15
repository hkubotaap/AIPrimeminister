import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Ollama API設定
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

if (!GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY is not set - Gemini features will be disabled');
} else {
  console.log('✅ Gemini API Key loaded successfully');
}

console.log('🦙 Ollama configuration:', { baseURL: OLLAMA_BASE_URL, model: OLLAMA_MODEL });

// 拡張APIログ管理とキャッシュシステム
class APIQuotaManager {
  constructor() {
    this.requestCounts = new Map();
    this.cache = new Map();
    this.dailyLimit = 45; // 安全マージンを設けて45に設定
    this.resetTime = new Date();
    this.resetTime.setHours(24, 0, 0, 0); // 次の午前0時にリセット
    this.apiLogs = []; // API呼び出しログ
    this.maxLogSize = 100; // 最大ログ保持数
  }

  canMakeRequest(apiType = 'gemini') {
    const today = new Date().toDateString();
    const key = `${apiType}_${today}`;
    const count = this.requestCounts.get(key) || 0;

    if (new Date() > this.resetTime) {
      this.requestCounts.clear();
      this.resetTime.setDate(this.resetTime.getDate() + 1);
    }

    return count < this.dailyLimit;
  }

  incrementRequestCount(apiType = 'gemini') {
    const today = new Date().toDateString();
    const key = `${apiType}_${today}`;
    const count = this.requestCounts.get(key) || 0;
    this.requestCounts.set(key, count + 1);

    console.log(`📊 ${apiType} API使用回数: ${count + 1}/${this.dailyLimit}`);
  }

  // APIコール結果をログに記録
  logAPICall(endpoint, apiType, status, provider, responseTime, errorMessage = null, fallbackUsed = false) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      endpoint: endpoint,
      apiType: apiType,
      status: status, // 'success', 'error', 'fallback'
      provider: provider, // 'gemini', 'ollama', 'static'
      responseTime: responseTime,
      errorMessage: errorMessage,
      fallbackUsed: fallbackUsed
    };

    this.apiLogs.unshift(logEntry);

    // ログサイズ制限
    if (this.apiLogs.length > this.maxLogSize) {
      this.apiLogs = this.apiLogs.slice(0, this.maxLogSize);
    }

    // コンソールログ出力
    this.outputStatusLog(logEntry);
  }

  // ログステータスをコンソールに出力
  outputStatusLog(logEntry) {
    const { endpoint, status, provider, responseTime, errorMessage, fallbackUsed } = logEntry;
    const timeStr = responseTime ? `(${responseTime}ms)` : '';

    switch (status) {
      case 'success':
        if (fallbackUsed) {
          console.log(`✅ ${endpoint} - ${provider}フォールバック成功 ${timeStr}`);
        } else {
          console.log(`✅ ${endpoint} - ${provider} API成功 ${timeStr}`);
        }
        break;
      case 'error':
        console.log(`❌ ${endpoint} - ${provider} APIエラー: ${errorMessage} ${timeStr}`);
        break;
      case 'fallback':
        console.log(`🔄 ${endpoint} - ${provider}からフォールバックに切り替え ${timeStr}`);
        break;
      case 'static':
        console.log(`📊 ${endpoint} - 内部データ使用 ${timeStr}`);
        break;
      case 'cache':
        console.log(`🎯 ${endpoint} - キャッシュデータ使用 ${timeStr}`);
        break;
      default:
        console.log(`ℹ️ ${endpoint} - ${status}: ${provider} ${timeStr}`);
    }
  }

  // API使用状況レポート生成
  generateUsageReport() {
    const successCount = this.apiLogs.filter(log => log.status === 'success').length;
    const errorCount = this.apiLogs.filter(log => log.status === 'error').length;
    const fallbackCount = this.apiLogs.filter(log => log.status === 'fallback' || log.fallbackUsed).length;
    const cacheCount = this.apiLogs.filter(log => log.status === 'cache').length;
    const staticCount = this.apiLogs.filter(log => log.status === 'static').length;

    const geminiLogs = this.apiLogs.filter(log => log.provider === 'gemini');
    const ollamaLogs = this.apiLogs.filter(log => log.provider === 'ollama');

    return {
      totalCalls: this.apiLogs.length,
      successRate: this.apiLogs.length > 0 ? Math.round((successCount / this.apiLogs.length) * 100) : 0,
      counts: {
        success: successCount,
        error: errorCount,
        fallback: fallbackCount,
        cache: cacheCount,
        static: staticCount
      },
      providers: {
        gemini: {
          total: geminiLogs.length,
          success: geminiLogs.filter(log => log.status === 'success').length,
          avgResponseTime: geminiLogs.length > 0 ? Math.round(geminiLogs.reduce((sum, log) => sum + (log.responseTime || 0), 0) / geminiLogs.length) : 0
        },
        ollama: {
          total: ollamaLogs.length,
          success: ollamaLogs.filter(log => log.status === 'success').length,
          avgResponseTime: ollamaLogs.length > 0 ? Math.round(ollamaLogs.reduce((sum, log) => sum + (log.responseTime || 0), 0) / ollamaLogs.length) : 0
        }
      },
      recentErrors: this.apiLogs.filter(log => log.status === 'error').slice(0, 5).map(log => ({
        timestamp: log.timestamp,
        endpoint: log.endpoint,
        error: log.errorMessage
      }))
    };
  }

  // 最近のAPIログを取得
  getRecentLogs(limit = 20) {
    return this.apiLogs.slice(0, limit);
  }

  getFromCache(promptHash) {
    const cached = this.cache.get(promptHash);
    if (cached) {
      // キャッシュヒット時はログに記録
      this.logAPICall('cache-hit', 'cache', 'cache', 'cache', 0);
    }
    return cached;
  }

  setCache(promptHash, response) {
    // 最大100件まで保持
    if (this.cache.size >= 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(promptHash, {
      response,
      timestamp: Date.now()
    });
  }

  getStatus() {
    const today = new Date().toDateString();
    const geminiCount = this.requestCounts.get(`gemini_${today}`) || 0;
    const usageReport = this.generateUsageReport();

    return {
      geminiUsed: geminiCount,
      geminiRemaining: this.dailyLimit - geminiCount,
      resetTime: this.resetTime,
      cacheSize: this.cache.size,
      usage: usageReport
    };
  }
}

const quotaManager = new APIQuotaManager();

// APIログシステム初期化メッセージ
console.log('📋 拡張APIログシステム初期化完了');
console.log('  ✅ API成功/失敗状況をリアルタイム記録');
console.log('  🔄 フォールバック使用状況を自動検出');
console.log('  📊 内部データ使用時の詳細ログ出力');
console.log('  🎯 キャッシュヒット/ミス状況を追跡');
console.log('  📈 使用状況レポート機能 (/api/usage-report)');
console.log('  🧹 ログクリア機能 (/api/clear-logs)');

// プロンプトのハッシュ生成（簡易版）
function generatePromptHash(prompt) {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit整数に変換
  }
  return hash.toString();
}

// ES Module用のディレクトリパス設定
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadStaticChoices() {
  const dataDir = path.join(__dirname, '..', 'data');
  const choices = {};

  try {
    const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
    files.forEach(file => {
      const filePath = path.join(dataDir, file);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      Object.assign(choices, content);
    });
  } catch (error) {
    console.error('静的データ読み込みエラー:', error);
  }

  return choices;
}

// 静的選択肢を使用したフォールバック
function generateStaticChoices(prompt, type) {
  const staticData = loadStaticChoices();

  // プロンプトに基づいて適切なカテゴリを選択
  const categories = Object.keys(staticData);
  let selectedCategory = categories[0]; // デフォルト

  // キーワードマッチングで適切なカテゴリを選択
  if (prompt.includes('人口') || prompt.includes('社会保障') || prompt.includes('出生')) {
    selectedCategory = categories.find(cat => cat.includes('人口')) || selectedCategory;
  } else if (prompt.includes('経済') || prompt.includes('財政') || prompt.includes('税')) {
    selectedCategory = categories.find(cat => cat.includes('財政')) || selectedCategory;
  } else if (prompt.includes('外交') || prompt.includes('安全保障') || prompt.includes('防衛')) {
    selectedCategory = categories.find(cat => cat.includes('外交')) || selectedCategory;
  } else if (prompt.includes('環境') || prompt.includes('エネルギー')) {
    selectedCategory = categories.find(cat => cat.includes('環境')) || selectedCategory;
  } else if (prompt.includes('技術') || prompt.includes('デジタル')) {
    selectedCategory = categories.find(cat => cat.includes('科学技術')) || selectedCategory;
  } else if (prompt.includes('教育') || prompt.includes('労働')) {
    selectedCategory = categories.find(cat => cat.includes('教育')) || selectedCategory;
  }

  const categoryData = staticData[selectedCategory];
  if (!categoryData || !Array.isArray(categoryData) || categoryData.length === 0) {
    return generateBasicChoices(prompt, type);
  }

  // ランダムに問題を選択
  const randomQuestion = categoryData[Math.floor(Math.random() * categoryData.length)];

  return {
    enhancedText: randomQuestion.本文,
    contextualBackground: randomQuestion.注釈 ? Object.values(randomQuestion.注釈).join(' ') : "",
    policyDetails: {
      choices: randomQuestion.選択肢,
      questionNumber: randomQuestion.設問番号
    }
  };
}

// 基本的なフォールバック（データが読み込めない場合）
function generateBasicChoices(prompt, type) {
  const basicChoices = {
    a: "現状維持を基本とした段階的改革を実施する",
    b: "予算を重点配分して集中的に取り組む",
    c: "民間活力を活用した市場メカニズムで解決する",
    d: "国際協調を重視した多国間での対応を図る",
    e: "規制緩和により自由競争を促進する",
    f: "政府主導で強力な政策パッケージを実行する"
  };

  return {
    enhancedText: "政策選択が必要です",
    contextualBackground: "現在AI機能は制限中のため、基本的な選択肢を表示しています",
    policyDetails: {
      choices: basicChoices
    }
  };
}

// Ollamaを使用したツンデレコメント生成
async function tryOllamaTsundereComment(requestBody) {
  const { gameState, policyChoice, effect } = requestBody;

  const prompt = `あなたは日本の総理大臣のツンデレAI政治秘書KASUMIです。

現在の状況:
- 支持率: ${gameState.approvalRating}%
- GDP: ${gameState.gdp}兆円
- 国債: ${gameState.nationalDebt}兆円
- 株価: ${gameState.stockPrice}円
- ドル円: ${gameState.usdJpyRate}円
- 外交: ${gameState.diplomacy}%

選択した政策: ${policyChoice}
政策効果: 支持率${effect.approvalRating || 0}, GDP${effect.gdp || 0}, 株価${effect.stockPrice || 0}

KASUMIのツンデレ的な反応を日本語で返してください。
- 素直じゃない、でも優しさがある
- 総理を心配している
- 政策の結果に応じた反応
- 可愛らしい口調

コメントのみを返してください（その他の説明は不要）。`;

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: 200
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = await response.json();
  const comment = data.response?.trim() || '';

  if (!comment) {
    throw new Error('No comment generated from Ollama');
  }

  return { comment };
}

// Ollamaを使用した拡張機能
async function tryOllamaEnhancement(prompt, type) {
  const enhancementPrompt = `
日本の政治・政策について詳細に分析してください。

プロンプト: ${prompt}
タイプ: ${type}

以下の形式でJSON形式で回答してください：
{
  "enhancedText": "政策の詳細説明",
  "contextualBackground": "背景情報",
  "policyDetails": {
    "implementationSteps": "実施手順",
    "budgetEstimate": "予算規模",
    "timeframe": "実施期間",
    "responsibleMinistry": "担当省庁"
  },
  "theoreticalJustification": "理論的根拠",
  "effectsRefinement": {
    "approvalRating": 数値,
    "gdp": 数値,
    "nationalDebt": 数値,
    "technology": 数値,
    "environment": 数値,
    "stockPrice": 数値,
    "usdJpyRate": 数値,
    "diplomacy": 数値
  }
}

日本語で専門的かつ具体的に回答してください。`;

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt: enhancementPrompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 2000
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`);
  }

  const data = await response.json();
  let enhancedContent;

  try {
    // JSONレスポンスをパース
    enhancedContent = JSON.parse(data.response);
  } catch (parseError) {
    // JSONパースに失敗した場合は基本的な構造で返す
    enhancedContent = {
      enhancedText: data.response || "Ollamaからの拡張内容",
      contextualBackground: "Ollamaを使用した政策分析",
      policyDetails: {
        implementationSteps: "段階的実施",
        budgetEstimate: "適切な予算配分",
        timeframe: "3-5年間",
        responsibleMinistry: "関係省庁"
      },
      effectsRefinement: {
        approvalRating: Math.floor(Math.random() * 20) - 5,
        gdp: Math.floor(Math.random() * 30) - 10,
        nationalDebt: Math.floor(Math.random() * 100) + 20,
        technology: Math.floor(Math.random() * 15) + 2,
        environment: Math.floor(Math.random() * 10) - 2,
        stockPrice: Math.floor(Math.random() * 400) - 100,
        usdJpyRate: Math.floor(Math.random() * 6) - 2,
        diplomacy: Math.floor(Math.random() * 8) + 1
      }
    };
  }

  return enhancedContent;
}

// 高品質フォールバック機能（従来版）
function generateEnhancedFallback(prompt, type) {
  const politicalTerms = [
    '社会保障制度', '財政政策', '金融政策', '規制緩和', '構造改革',
    '地方分権', '行政改革', '税制改革', '労働市場改革', '教育制度'
  ];

  const theoreticalFrameworks = [
    '公共選択理論', 'ケインズ経済学', '新古典派経済学', '制度経済学',
    '社会民主主義', 'ガバナンス理論', '政策過程論', '比較政治学'
  ];

  const implementationSteps = [
    '政策立案委員会の設置', '関係省庁との調整会議', 'パブリックコメントの実施',
    '予算案への反映', '法案の国会提出', '段階的導入による効果検証'
  ];

  const budgetEstimates = [
    '年間予算5,000億円規模', '3年間で1.2兆円の投資',
    '既存予算の再配分により実現', '地方交付税との連携'
  ];

  const responsibleMinistries = [
    '内閣府', '総務省', '財務省', '厚生労働省', '経済産業省',
    '国土交通省', '文部科学省', 'デジタル庁'
  ];

  // プロンプトからキーワード抽出による内容カスタマイズ
  let enhancedText = "大学研究レベルの政策分析：";
  let selectedFramework = theoreticalFrameworks[Math.floor(Math.random() * theoreticalFrameworks.length)];
  let selectedMinistry = responsibleMinistries[Math.floor(Math.random() * responsibleMinistries.length)];

  if (prompt.includes('人口') || prompt.includes('社会保障')) {
    enhancedText = "人口動態変化に対応した社会保障制度の最適化";
    selectedFramework = "社会保障制度論・人口経済学";
    selectedMinistry = "厚生労働省";
  } else if (prompt.includes('経済') || prompt.includes('財政')) {
    enhancedText = "持続可能な経済成長を実現する財政政策";
    selectedFramework = "マクロ経済学・財政学";
    selectedMinistry = "財務省";
  } else if (prompt.includes('環境') || prompt.includes('エネルギー')) {
    enhancedText = "脱炭素社会実現に向けた包括的環境政策";
    selectedFramework = "環境経済学・持続可能発展論";
    selectedMinistry = "環境省";
  } else if (prompt.includes('技術') || prompt.includes('デジタル')) {
    enhancedText = "デジタル変革による社会システムの最適化";
    selectedFramework = "情報経済学・テクノロジー政策論";
    selectedMinistry = "デジタル庁";
  }

  return {
    enhancedText: enhancedText,
    contextualBackground: "現代日本が直面する複合的政策課題に対し、エビデンスベースの政策形成と多様なステークホルダーとの合意形成が求められています。",
    policyDetails: {
      implementationSteps: implementationSteps[Math.floor(Math.random() * implementationSteps.length)],
      budgetEstimate: budgetEstimates[Math.floor(Math.random() * budgetEstimates.length)],
      timeframe: "短期的対応（1年）→中期的制度設計（3-5年）→長期的効果検証（10年）",
      responsibleMinistry: selectedMinistry
    },
    theoreticalJustification: `${selectedFramework}の観点から、政策効果の最大化と制度的持続可能性を両立する設計が重要です。`,
    academicReferences: "OECD諸国比較研究、日本政策学会論文集、内閣府政策研究所レポート",
    academicEnhancements: {
      theoreticalFramework: selectedFramework,
      comparativeCase: "北欧諸国・ドイツ・韓国における類似政策の実施経験",
      keyStakeholders: ["政府", "地方自治体", "民間企業", "市民社会", "学術機関"],
      evaluationCriteria: ["政策効果測定", "費用対効果分析", "社会的受容性", "制度的持続性"],
      researchQuestions: ["最適な政策mix は？", "ステークホルダー間の利益調整方法は？"]
    },
    effectsRefinement: {
      approvalRating: Math.floor(Math.random() * 20) - 5,
      gdp: Math.floor(Math.random() * 30) - 10,
      nationalDebt: Math.floor(Math.random() * 100) + 20,
      technology: Math.floor(Math.random() * 15) + 2,
      environment: Math.floor(Math.random() * 10) - 2,
      stockPrice: Math.floor(Math.random() * 400) - 100,
      usdJpyRate: Math.floor(Math.random() * 6) - 2,
      diplomacy: Math.floor(Math.random() * 8) + 1
    }
  };
}

// API制限状況確認エンドポイント
app.get('/api/quota-status', (req, res) => {
  res.json({
    success: true,
    quotaStatus: quotaManager.getStatus(),
    timestamp: new Date().toISOString()
  });
});

// API使用状況詳細レポートエンドポイント
app.get('/api/usage-report', (req, res) => {
  const report = quotaManager.generateUsageReport();
  res.json({
    success: true,
    report: report,
    recentLogs: quotaManager.getRecentLogs(10),
    timestamp: new Date().toISOString()
  });
});

// APIログクリアエンドポイント（開発用）
app.post('/api/clear-logs', (req, res) => {
  quotaManager.apiLogs = [];
  console.log('🧹 APIログをクリアしました');
  res.json({
    success: true,
    message: 'API logs cleared',
    timestamp: new Date().toISOString()
  });
});

console.log('🦙 Ollama configuration:', { baseURL: OLLAMA_BASE_URL, model: OLLAMA_MODEL });

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
app.get('/api/health', async (req, res) => {
  // Ollamaの接続確認
  let ollamaStatus = false;
  try {
    const ollamaResponse = await fetch(`${OLLAMA_BASE_URL}/api/version`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    });
    ollamaStatus = ollamaResponse.ok;
  } catch (error) {
    console.log('Ollama not available:', error.message);
  }

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    providers: {
      gemini: !!GEMINI_API_KEY,
      ollama: ollamaStatus
    }
  });
});

// Ollama接続確認エンドポイント
app.get('/api/ollama/health', async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/version`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();
      res.json({
        status: 'OK',
        available: true,
        version: data.version || 'unknown',
        baseURL: OLLAMA_BASE_URL,
        model: OLLAMA_MODEL
      });
    } else {
      throw new Error(`Ollama server error: ${response.status}`);
    }
  } catch (error) {
    res.json({
      status: 'ERROR',
      available: false,
      error: error.message,
      baseURL: OLLAMA_BASE_URL
    });
  }
});

// Ollamaモデル一覧エンドポイント
app.get('/api/ollama/models', async (req, res) => {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    const models = data.models?.map(model => ({
      name: model.name,
      size: model.size,
      modified_at: model.modified_at
    })) || [];

    res.json({
      success: true,
      models: models,
      count: models.length
    });
  } catch (error) {
    console.error('❌ Ollama models fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      models: []
    });
  }
});

// ツンデレコメント生成エンドポイント
app.post('/api/generate-tsundere-comment', validateInput, async (req, res) => {
  const startTime = Date.now();
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

    const responseTime = Date.now() - startTime;
    quotaManager.logAPICall('/api/generate-tsundere-comment', 'tsundere-comment', 'success', 'gemini', responseTime);

    res.json({
      success: true,
      comment: comment,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    quotaManager.logAPICall('/api/generate-tsundere-comment', 'tsundere-comment', 'error', 'gemini', responseTime, error.message);

    // Ollamaフォールバックを試行
    try {
      const ollamaStartTime = Date.now();
      const ollamaResult = await tryOllamaTsundereComment(req.body);
      const ollamaResponseTime = Date.now() - ollamaStartTime;

      quotaManager.logAPICall('/api/generate-tsundere-comment', 'tsundere-comment', 'success', 'ollama', ollamaResponseTime, null, true);

      return res.json({
        success: true,
        comment: ollamaResult.comment,
        provider: 'ollama',
        timestamp: new Date().toISOString()
      });
    } catch (ollamaError) {
      const ollamaResponseTime = Date.now() - startTime;
      quotaManager.logAPICall('/api/generate-tsundere-comment', 'tsundere-comment', 'fallback', 'ollama', ollamaResponseTime, ollamaError.message, true);
    }

    // 政策効果に応じた静的フォールバックコメント
    const effect = req.body.effect || {};
    const approvalChange = effect.approvalRating || 0;
    const gdpChange = effect.gdp || 0;

    let fallbackComments = [];

    if (approvalChange > 5) {
      fallbackComments = [
        'え、えぇ！？支持率がこんなに上がるなんて...！まあ、総理だから当然よね。別に驚いてないんだから！でも...ちょっとだけ嬉しいかも。',
        'わあ！すごいじゃない！...でも調子に乗っちゃダメよ？これくらいで満足しないで、もっと頑張らなきゃ！',
        'まあ...悪くない結果ね。総理が頑張った甲斐があったってことかしら？私も少しだけ安心したかも。'
      ];
    } else if (approvalChange < -5) {
      fallbackComments = [
        'ちょっと！支持率が下がってるじゃない！もう、心配になっちゃうでしょ！でも私が付いてるから大丈夫よ！一緒に頑張りましょ？',
        'あーあ、また支持率が...でも仕方ないわね。政治は難しいものよ。次は気をつけましょ？',
        'うーん、厳しい結果ね。でも落ち込まないで！失敗から学ぶことだってあるんだから！'
      ];
    } else if (gdpChange > 10) {
      fallbackComments = [
        'おお！経済効果がすごいじゃない！...まあ、私がアドバイスしたおかげもあるのよね？少しは認めてもいいわよ。',
        'GDP成長ね...悪くないんじゃない？でも経済だけじゃダメよ。国民の生活も考えなさい！',
        'わあ！お金の話は難しいけど、良い数字なのよね？総理、たまには良い判断するじゃない！'
      ];
    } else {
      fallbackComments = [
        'まあまあの結果ね。でも、もう少し大胆な政策でもよかったんじゃない？...総理らしいといえばらしいかも。',
        'この政策の効果、どうなるかしら...。まあ、総理が決めたなら仕方ないわね。私は付いていくから。',
        'ふーん、そういう政策ね。まあ悪くないんじゃない？...ちょっとだけ評価してあげる。',
        '政治って難しいのね...でも総理なら大丈夫！私も一緒にいるし...って、別に心配してるわけじゃないんだから！',
        'この政策で国民が喜んでくれるといいわね。総理の頑張りが報われますように...あ、別に祈ってないわよ！'
      ];
    }

    const fallbackComment = fallbackComments[Math.floor(Math.random() * fallbackComments.length)];
    const staticResponseTime = Date.now() - startTime;
    quotaManager.logAPICall('/api/generate-tsundere-comment', 'tsundere-comment', 'static', 'static', staticResponseTime);

    res.json({
      success: true,
      comment: fallbackComment,
      fallback: true,
      timestamp: new Date().toISOString()
    });
  }
});

// AI拡張機能専用エンドポイント（制限対応版）
app.post('/api/enhance-question', async (req, res) => {
  const startTime = Date.now();
  try {
    const { prompt, type = 'question' } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Prompt is required'
      });
    }

    console.log(`🧠 AI拡張リクエスト (${type}) 受信`);

    // キャッシュチェック
    const promptHash = generatePromptHash(prompt);
    const cachedResult = quotaManager.getFromCache(promptHash);

    if (cachedResult) {
      return res.json({
        success: true,
        enhancedContent: cachedResult.response,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // API制限チェック
    if (!quotaManager.canMakeRequest('gemini')) {
      // Ollamaフォールバックを試行
      try {
        const ollamaStartTime = Date.now();
        const ollamaResult = await tryOllamaEnhancement(prompt, type);
        const ollamaResponseTime = Date.now() - ollamaStartTime;

        quotaManager.logAPICall('/api/enhance-question', 'enhance-question', 'success', 'ollama', ollamaResponseTime, null, true);

        return res.json({
          success: true,
          enhancedContent: JSON.stringify(ollamaResult),
          provider: 'ollama',
          quotaStatus: quotaManager.getStatus(),
          timestamp: new Date().toISOString()
        });
      } catch (ollamaError) {
        const ollamaResponseTime = Date.now() - startTime;
        quotaManager.logAPICall('/api/enhance-question', 'enhance-question', 'fallback', 'ollama', ollamaResponseTime, ollamaError.message, true);
      }

      // 静的データフォールバック
      const staticStartTime = Date.now();
      const staticFallback = generateStaticChoices(prompt, type);
      const staticResponseTime = Date.now() - staticStartTime;

      quotaManager.logAPICall('/api/enhance-question', 'enhance-question', 'static', 'static', staticResponseTime);

      res.json({
        success: true,
        enhancedContent: JSON.stringify(staticFallback),
        provider: 'static',
        quotaStatus: quotaManager.getStatus(),
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Gemini APIを使用したAI拡張
    quotaManager.incrementRequestCount('gemini');

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
          topK: 30,
          topP: 0.9,
          maxOutputTokens: 2000,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini AI拡張エラー:', response.status, errorText);

      // 429エラー（レート制限）の場合は静かに処理
      if (response.status === 429) {
        console.log('⚠️ Gemini API制限 - フォールバックに切り替え');
        // 明日のリセット時刻まで待つように設定
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        quotaManager.resetTime = tomorrow;

        throw new Error('QUOTA_EXCEEDED');
      }

      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const enhancedContent = data.candidates[0]?.content?.parts[0]?.text;

    if (!enhancedContent) {
      throw new Error('No enhanced content generated from Gemini API');
    }

    // キャッシュに保存
    quotaManager.setCache(promptHash, enhancedContent);

    const responseTime = Date.now() - startTime;
    quotaManager.logAPICall('/api/enhance-question', 'enhance-question', 'success', 'gemini', responseTime);

    res.json({
      success: true,
      enhancedContent,
      quotaStatus: quotaManager.getStatus(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // 429エラーの場合はログを静かに処理
    if (error.message === 'QUOTA_EXCEEDED') {
      console.log('📊 API制限のためOllamaフォールバック試行中');
    } else {
      console.error('❌ AI拡張処理エラー:', error);
    }

    // Ollamaフォールバックを試行
    try {
      const ollamaResult = await tryOllamaEnhancement(req.body.prompt, req.body.type);
      return res.json({
        success: true,
        enhancedContent: JSON.stringify(ollamaResult),
        provider: 'ollama',
        quotaStatus: quotaManager.getStatus(),
        timestamp: new Date().toISOString()
      });
    } catch (ollamaError) {
      console.log('📊 Ollama利用不可のため静的データ使用');
    }

    // 静的データフォールバック
    const staticFallback = generateStaticChoices(req.body.prompt, req.body.type);

    res.json({
      success: true,
      enhancedContent: JSON.stringify(staticFallback),
      provider: 'static',
      quotaStatus: quotaManager.getStatus(),
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

// Ollamaツンデレコメント生成エンドポイント
app.post('/api/ollama/generate-tsundere-comment', validateInput, async (req, res) => {
  try {
    const { gameState, policyChoice, effect } = req.body;
    
    console.log('🦙 Ollamaツンデレコメント生成リクエスト受信');
    console.log('政策選択:', policyChoice);
    
    const prompt = `あなたは日本の総理大臣のツンデレAI政治秘書KASUMIです。

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

例:
- "え、えぇ！？支持率がこんなに上がるなんて...！まあ、総理だから当然よね。別に驚いてないんだから！"
- "ちょっと！支持率が下がってるじゃない！もう、心配になっちゃうでしょ！でも私が付いてるから大丈夫よ！"

回答:`;

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.9,
          top_p: 0.9,
          top_k: 40,
          num_predict: 200,
          stop: ['\n\n', '例:', '注意:']
        }
      }),
      signal: AbortSignal.timeout(30000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Ollama API Error:', response.status, errorText);
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    let comment = data.response?.trim() || '';
    
    // 不要な部分を除去
    comment = comment.replace(/^回答:\s*/, '');
    comment = comment.replace(/例:.*$/s, '');
    comment = comment.replace(/注意:.*$/s, '');
    comment = comment.trim();

    // 文字数制限
    if (comment.length > 150) {
      comment = comment.substring(0, 147) + '...';
    }
    
    if (!comment) {
      throw new Error('No comment generated from Ollama');
    }
    
    console.log('✅ Ollamaツンデレコメント生成成功');
    console.log('生成時間:', data.total_duration ? `${Math.round(data.total_duration / 1000000)}ms` : 'N/A');
    
    res.json({
      success: true,
      comment: comment,
      provider: 'ollama',
      model: OLLAMA_MODEL,
      generation_time: data.total_duration ? Math.round(data.total_duration / 1000000) : null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Ollamaツンデレコメント生成エラー:', error);
    
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
      provider: 'ollama',
      fallback: true,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Gemini政策効果分析エンドポイント
app.post('/api/analyze-policy-effects', validateInput, async (req, res) => {
  try {
    const { prompt, context } = req.body;
    
    console.log('📊 Gemini政策効果分析リクエスト受信');
    console.log('政策:', context.policyChoice);
    
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
          temperature: 0.3, // 政策分析は一貫性を重視
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 1500,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API Error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates[0]?.content?.parts[0]?.text || '';

    // JSONレスポンスをパース
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const analysis = JSON.parse(jsonMatch[0]);
        console.log('✅ Gemini政策効果分析成功');
        
        res.json({
          success: true,
          analysis: analysis,
          provider: 'gemini',
          timestamp: new Date().toISOString()
        });
      } catch (parseError) {
        console.error('❌ JSON解析エラー:', parseError);
        throw new Error('Invalid JSON response from Gemini');
      }
    } else {
      throw new Error('No valid JSON found in Gemini response');
    }
    
  } catch (error) {
    console.error('❌ Gemini政策効果分析エラー:', error);
    
    // フォールバック分析
    const fallbackAnalysis = {
      effects: {
        approvalRating: Math.floor(Math.random() * 21) - 10,
        gdp: Math.floor(Math.random() * 41) - 20,
        nationalDebt: Math.floor(Math.random() * 101) - 50,
        technology: Math.floor(Math.random() * 21) - 10,
        environment: Math.floor(Math.random() * 21) - 10,
        stockPrice: Math.floor(Math.random() * 2001) - 1000,
        usdJpyRate: Math.floor(Math.random() * 11) - 5,
        diplomacy: Math.floor(Math.random() * 21) - 10
      },
      reasoning: "政策効果を分析しました。現在はフォールバックモードで動作しています。",
      confidence: Math.floor(Math.random() * 30) + 60,
      timeframe: "short_term",
      risks: ["政策実行の困難さ", "予期せぬ副作用"],
      opportunities: ["政策効果の拡大", "国民の理解促進"]
    };
    
    res.json({
      success: true,
      analysis: fallbackAnalysis,
      provider: 'gemini',
      fallback: true,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Ollama政策効果分析エンドポイント
app.post('/api/ollama/analyze-policy-effects', validateInput, async (req, res) => {
  try {
    const { prompt, context } = req.body;
    
    console.log('🦙 Ollama政策効果分析リクエスト受信');
    console.log('政策:', context.policyChoice);
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3, // 政策分析は一貫性を重視
          top_p: 0.8,
          top_k: 40,
          num_predict: 800,
          stop: ['\n\n注意:', '\n\n例:', '説明:']
        }
      }),
      signal: AbortSignal.timeout(45000) // 政策分析は時間がかかる可能性
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Ollama API Error:', response.status, errorText);
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.response?.trim() || '';
    
    // JSONレスポンスをパース
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const analysis = JSON.parse(jsonMatch[0]);
        console.log('✅ Ollama政策効果分析成功');
        console.log('生成時間:', data.total_duration ? `${Math.round(data.total_duration / 1000000)}ms` : 'N/A');
        
        res.json({
          success: true,
          analysis: analysis,
          provider: 'ollama',
          model: OLLAMA_MODEL,
          generation_time: data.total_duration ? Math.round(data.total_duration / 1000000) : null,
          timestamp: new Date().toISOString()
        });
      } catch (parseError) {
        console.error('❌ JSON解析エラー:', parseError);
        throw new Error('Invalid JSON response from Ollama');
      }
    } else {
      throw new Error('No valid JSON found in Ollama response');
    }
    
  } catch (error) {
    console.error('❌ Ollama政策効果分析エラー:', error);
    
    // フォールバック分析
    const fallbackAnalysis = {
      effects: {
        approvalRating: Math.floor(Math.random() * 21) - 10,
        gdp: Math.floor(Math.random() * 41) - 20,
        nationalDebt: Math.floor(Math.random() * 101) - 50,
        technology: Math.floor(Math.random() * 21) - 10,
        environment: Math.floor(Math.random() * 21) - 10,
        stockPrice: Math.floor(Math.random() * 2001) - 1000,
        usdJpyRate: Math.floor(Math.random() * 11) - 5,
        diplomacy: Math.floor(Math.random() * 21) - 10
      },
      reasoning: "政策効果を分析しました。現在はフォールバックモードで動作しています。",
      confidence: Math.floor(Math.random() * 30) + 60,
      timeframe: "short_term",
      risks: ["政策実行の困難さ", "予期せぬ副作用"],
      opportunities: ["政策効果の拡大", "国民の理解促進"]
    };
    
    res.json({
      success: true,
      analysis: fallbackAnalysis,
      provider: 'ollama',
      fallback: true,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Gemini政治イベント生成エンドポイント
app.post('/api/generate-political-event', validateInput, async (req, res) => {
  try {
    const { prompt, context } = req.body;
    
    console.log('📰 Gemini政治イベント生成リクエスト受信');
    console.log('ゲームフェーズ:', context.gamePhase);
    console.log('リスクレベル:', context.politicalTrends?.riskLevel);
    
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
          temperature: 0.8, // イベント生成は創造性を重視
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 2000,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Gemini API Error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates[0]?.content?.parts[0]?.text || '';

    // JSONレスポンスをパース
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const event = JSON.parse(jsonMatch[0]);
        console.log('✅ Gemini政治イベント生成成功');
        console.log('生成イベント:', event.title);
        
        res.json({
          success: true,
          event: event,
          provider: 'gemini',
          timestamp: new Date().toISOString()
        });
      } catch (parseError) {
        console.error('❌ JSON解析エラー:', parseError);
        throw new Error('Invalid JSON response from Gemini');
      }
    } else {
      throw new Error('No valid JSON found in Gemini response');
    }
    
  } catch (error) {
    console.error('❌ Gemini政治イベント生成エラー:', error);
    
    // フォールバックイベント
    const fallbackEvent = {
      id: `fallback_${Date.now()}`,
      title: '新たな政治課題の浮上',
      description: '予期せぬ政治課題が浮上しました。現在の政治情勢を踏まえた適切な対応が求められています。',
      category: 'general',
      urgency: 'medium',
      complexity: 'moderate',
      options: [
        {
          text: '積極的な政策展開を行う',
          type: 'progressive',
          expectedEffects: {
            approvalRating: Math.floor(Math.random() * 16) + 5,
            gdp: Math.floor(Math.random() * 21) - 5,
            nationalDebt: Math.floor(Math.random() * 81) + 20,
            technology: Math.floor(Math.random() * 11) + 2,
            environment: Math.floor(Math.random() * 11) - 2,
            stockPrice: Math.floor(Math.random() * 601) + 100,
            usdJpyRate: Math.floor(Math.random() * 7) - 3,
            diplomacy: Math.floor(Math.random() * 11) + 2
          }
        },
        {
          text: '慎重な段階的対応を取る',
          type: 'conservative',
          expectedEffects: {
            approvalRating: Math.floor(Math.random() * 11) + 2,
            gdp: Math.floor(Math.random() * 11) - 2,
            nationalDebt: Math.floor(Math.random() * 31) + 5,
            technology: Math.floor(Math.random() * 7) - 1,
            environment: Math.floor(Math.random() * 7) - 1,
            stockPrice: Math.floor(Math.random() * 301) - 100,
            usdJpyRate: Math.floor(Math.random() * 5) - 2,
            diplomacy: Math.floor(Math.random() * 7) - 1
          }
        },
        {
          text: '関係者との協議を重視',
          type: 'moderate',
          expectedEffects: {
            approvalRating: Math.floor(Math.random() * 13) + 3,
            gdp: Math.floor(Math.random() * 15) - 3,
            nationalDebt: Math.floor(Math.random() * 51) + 10,
            technology: Math.floor(Math.random() * 9) + 1,
            environment: Math.floor(Math.random() * 9) + 1,
            stockPrice: Math.floor(Math.random() * 401) - 50,
            usdJpyRate: Math.floor(Math.random() * 6) - 2,
            diplomacy: Math.floor(Math.random() * 9) + 1
          }
        }
      ],
      backgroundInfo: '現在の政治情勢を踏まえた重要な課題です。',
      stakeholders: ['政府', '国民', '関係団体'],
      timeConstraint: '適切なタイミングで',
      generationReason: 'フォールバックイベントとして生成'
    };
    
    res.json({
      success: true,
      event: fallbackEvent,
      provider: 'gemini',
      fallback: true,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Ollama政治イベント生成エンドポイント
app.post('/api/ollama/generate-political-event', validateInput, async (req, res) => {
  try {
    const { prompt, context } = req.body;
    
    console.log('🦙 Ollama政治イベント生成リクエスト受信');
    console.log('ゲームフェーズ:', context.gamePhase);
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.8, // イベント生成は創造性を重視
          top_p: 0.9,
          top_k: 40,
          num_predict: 1200,
          stop: ['\n\n注意:', '\n\n例:', '説明:']
        }
      }),
      signal: AbortSignal.timeout(60000) // イベント生成は時間がかかる可能性
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Ollama API Error:', response.status, errorText);
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.response?.trim() || '';
    
    // JSONレスポンスをパース
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const event = JSON.parse(jsonMatch[0]);
        console.log('✅ Ollama政治イベント生成成功');
        console.log('生成イベント:', event.title);
        console.log('生成時間:', data.total_duration ? `${Math.round(data.total_duration / 1000000)}ms` : 'N/A');
        
        res.json({
          success: true,
          event: event,
          provider: 'ollama',
          model: OLLAMA_MODEL,
          generation_time: data.total_duration ? Math.round(data.total_duration / 1000000) : null,
          timestamp: new Date().toISOString()
        });
      } catch (parseError) {
        console.error('❌ JSON解析エラー:', parseError);
        throw new Error('Invalid JSON response from Ollama');
      }
    } else {
      throw new Error('No valid JSON found in Ollama response');
    }
    
  } catch (error) {
    console.error('❌ Ollama政治イベント生成エラー:', error);
    
    // フォールバックイベント
    const fallbackEvent = {
      id: `ollama_fallback_${Date.now()}`,
      title: '地域からの政策要望',
      description: '地方自治体や市民団体から新たな政策要望が寄せられています。地域の声と国政のバランスを取る必要があります。',
      category: 'social',
      urgency: 'medium',
      complexity: 'moderate',
      options: [
        {
          text: '要望を積極的に政策に反映',
          type: 'progressive',
          expectedEffects: {
            approvalRating: Math.floor(Math.random() * 16) + 8,
            gdp: Math.floor(Math.random() * 21) - 3,
            nationalDebt: Math.floor(Math.random() * 71) + 30,
            technology: Math.floor(Math.random() * 9) + 1,
            environment: Math.floor(Math.random() * 9) + 1,
            stockPrice: Math.floor(Math.random() * 401) + 50,
            usdJpyRate: Math.floor(Math.random() * 5) - 2,
            diplomacy: Math.floor(Math.random() * 7) + 2
          }
        },
        {
          text: '既存制度の範囲内で対応',
          type: 'conservative',
          expectedEffects: {
            approvalRating: Math.floor(Math.random() * 11) + 3,
            gdp: Math.floor(Math.random() * 11) - 1,
            nationalDebt: Math.floor(Math.random() * 21) + 5,
            technology: Math.floor(Math.random() * 5) + 1,
            environment: Math.floor(Math.random() * 5) + 1,
            stockPrice: Math.floor(Math.random() * 201) + 50,
            usdJpyRate: Math.floor(Math.random() * 3) - 1,
            diplomacy: Math.floor(Math.random() * 5) + 1
          }
        },
        {
          text: '関係者と協議して段階的に実施',
          type: 'moderate',
          expectedEffects: {
            approvalRating: Math.floor(Math.random() * 13) + 5,
            gdp: Math.floor(Math.random() * 15) - 2,
            nationalDebt: Math.floor(Math.random() * 41) + 15,
            technology: Math.floor(Math.random() * 7) + 1,
            environment: Math.floor(Math.random() * 7) + 1,
            stockPrice: Math.floor(Math.random() * 301) + 25,
            usdJpyRate: Math.floor(Math.random() * 4) - 1,
            diplomacy: Math.floor(Math.random() * 7) + 1
          }
        }
      ],
      backgroundInfo: '地域の声を政策に反映することが求められています。',
      stakeholders: ['地方自治体', '市民団体', '政府', '国民'],
      timeConstraint: '1ヶ月以内',
      generationReason: 'Ollamaフォールバックイベントとして生成'
    };
    
    res.json({
      success: true,
      event: fallbackEvent,
      provider: 'ollama',
      fallback: true,
      error: error.message,
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
  console.log(`📋 APIログ機能有効 - 使用状況は /api/usage-report で確認できます`);
  console.log(`📊 キャッシュ、フォールバック、内部データ使用状況を詳細ログ出力中`);
  console.log(`🔍 API成功/失敗/フォールバック切り替え状況をリアルタイム監視中`);
});