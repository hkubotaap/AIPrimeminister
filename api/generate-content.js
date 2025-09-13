// Vercel Function: 動的コンテンツ生成（課題・選択肢・AI秘書コメント）
import crypto from 'crypto';

// 生成されたコンテンツのキャッシュ（本番では外部DBを推奨）
let contentCache = {
  events: [], // 生成された課題
  comments: [] // AI秘書コメント
};

// 課題テンプレート（日本の政治課題）
const EVENT_TEMPLATES = [
  {
    category: '経済政策',
    context: '日本経済の課題と成長戦略',
    themes: ['インフレ対策', 'デフレ脱却', 'GDP成長', '雇用創出', '生産性向上', '賃金上昇']
  },
  {
    category: '社会保障',
    context: '少子高齢化社会への対応',
    themes: ['年金制度改革', '医療費抑制', '介護問題', '子育て支援', '教育無償化', '働き方改革']
  },
  {
    category: '外交・安全保障',
    context: '国際情勢と日本の立場',
    themes: ['日米同盟', '中国との関係', '北朝鮮問題', '防衛費増額', '平和外交', '経済安全保障']
  },
  {
    category: '環境・エネルギー',
    context: '脱炭素社会の実現',
    themes: ['再生可能エネルギー', '原発政策', '温室効果ガス削減', 'グリーンDX', '環境技術', 'エネルギー安全保障']
  },
  {
    category: '科学技術',
    context: 'デジタル化とイノベーション',
    themes: ['DX推進', 'AI活用', '5G/6G', 'スタートアップ支援', '研究開発投資', 'デジタル人材育成']
  }
];

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
    const { type, gameState, previousEvents, lastPolicyEffect } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Content type is required' });
    }

    let generatedContent;

    switch (type) {
      case 'event':
        generatedContent = await generateEvent(gameState, previousEvents);
        break;
      case 'secretary-comment':
        generatedContent = await generateSecretaryComment(gameState, lastPolicyEffect);
        break;
      case 'policy-choices':
        generatedContent = await generatePolicyChoices(gameState);
        break;
      default:
        return res.status(400).json({ error: 'Invalid content type' });
    }

    // キャッシュに保存
    if (type === 'event') {
      contentCache.events.push({
        id: crypto.randomBytes(8).toString('hex'),
        content: generatedContent,
        turn: gameState?.turn || 1,
        timestamp: new Date().toISOString()
      });
    } else if (type === 'secretary-comment') {
      contentCache.comments.push({
        id: crypto.randomBytes(8).toString('hex'),
        content: generatedContent,
        gameState: gameState,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      data: generatedContent
    });

  } catch (error) {
    console.error('❌ コンテンツ生成エラー:', error);
    return res.status(500).json({
      error: 'Failed to generate content',
      details: error.message
    });
  }
}

// イベント（課題）生成
async function generateEvent(gameState, previousEvents = []) {
  // 前回のイベントカテゴリを避けて多様性を確保
  const usedCategories = previousEvents.slice(-2).map(e => e.category || '');
  const availableTemplates = EVENT_TEMPLATES.filter(t => !usedCategories.includes(t.category));
  const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)] || EVENT_TEMPLATES[0];

  const theme = template.themes[Math.floor(Math.random() * template.themes.length)];

  // Gemini/Ollama APIでコンテンツ生成（フォールバック付き）
  try {
    const prompt = `あなたは日本の政治シミュレーションゲームのイベント作成者です。

現在の状況:
- ターン: ${gameState?.turn || 1}/5
- 支持率: ${gameState?.approvalRating || 50}%
- GDP: ${gameState?.gdp || 540}兆円
- 技術レベル: ${gameState?.technology || 60}
- 環境スコア: ${gameState?.environment || 50}
- 外交関係: ${gameState?.diplomacy || 55}

カテゴリ: ${template.category}
テーマ: ${theme}
背景: ${template.context}

以下の形式でイベントを生成してください：

タイトル: [30文字以内の印象的なタイトル]
詳細: [150-200文字の詳しい説明。現在の日本の実情に基づき、具体的な数値や事例を含める]
要約: [50文字以内の要約]

制約:
- 現実的で具体的な政治課題にする
- 政党色を出さず、政策判断に焦点を当てる
- プレイヤーが総理大臣として判断を求められる内容にする`;

    // 実際のAI生成（簡易版フォールバック）
    const generatedEvent = {
      id: crypto.randomBytes(8).toString('hex'),
      category: template.category,
      title: `${theme}への対応策`,
      description: generateFallbackDescription(template.category, theme, gameState),
      summary: `${theme}について政策判断が求められています。`,
      choices: await generatePolicyChoices(gameState, template.category)
    };

    return generatedEvent;

  } catch (error) {
    console.error('AI生成失敗、フォールバックを使用:', error);
    return generateFallbackEvent(template, theme, gameState);
  }
}

// AI秘書コメント生成
async function generateSecretaryComment(gameState, lastPolicyEffect) {
  try {
    const prompt = `あなたはツンデレなAI秘書として、総理大臣にコメントします。

現在の状況:
- 支持率: ${gameState?.approvalRating || 50}%
- GDP: ${gameState?.gdp || 540}兆円
- 前回の政策効果: ${JSON.stringify(lastPolicyEffect)}

ツンデレキャラクターとして以下の特徴でコメント（50文字以内）:
- 素直じゃない（「べ、別に...」「...じゃないんだから！」）
- でも実は心配している
- 政策結果に対する率直な評価
- 総理を「総理」と呼ぶ
- 日本語で自然な会話調

政策効果を踏まえた具体的なコメントをお願いします。`;

    // フォールバック用ツンデレコメント
    const fallbackComments = [
      "べ、別に心配してるわけじゃないんだから！でも...ちょっとだけ良い判断だったかも。",
      "もう、総理ったら！もう少し私のアドバイスを聞いてもいいのよ？",
      "まあまあの結果ね。でも、もっと大胆にいってもよかったんじゃない？",
      "ちょっと！もう少し慎重に判断してよね！...でも、総理らしいかも。",
      "結果はともかく、総理の判断力は認めてあげる。別に褒めてるわけじゃないけど！"
    ];

    return fallbackComments[Math.floor(Math.random() * fallbackComments.length)];

  } catch (error) {
    console.error('AI秘書コメント生成失敗:', error);
    return "総理の判断、見守ってるからね。べ、別に心配してるわけじゃないんだから！";
  }
}

// 政策選択肢生成
async function generatePolicyChoices(gameState, category = '経済政策') {
  const choiceTemplates = {
    '経済政策': [
      { text: '大規模な経済対策を実施する', effect: { approvalRating: 8, gdp: 15, nationalDebt: 100 } },
      { text: '規制緩和による民間活力を促進する', effect: { approvalRating: -3, gdp: 12, technology: 8 } },
      { text: '中小企業支援を強化する', effect: { approvalRating: 5, gdp: 8, technology: 3 } },
      { text: '税制改革を断行する', effect: { approvalRating: -8, gdp: 18, technology: 5 } }
    ],
    '社会保障': [
      { text: '年金制度を抜本的に改革する', effect: { approvalRating: -12, nationalDebt: -50 } },
      { text: '医療費削減策を導入する', effect: { approvalRating: -8, nationalDebt: -30, technology: 5 } },
      { text: '子育て支援を大幅拡充する', effect: { approvalRating: 12, nationalDebt: 80 } },
      { text: '高齢者雇用を促進する', effect: { approvalRating: 6, gdp: 5, technology: 3 } }
    ],
    '外交・安全保障': [
      { text: '防衛費を大幅に増額する', effect: { approvalRating: -5, diplomacy: 10, nationalDebt: 150 } },
      { text: '国際協調路線を強化する', effect: { approvalRating: 5, diplomacy: 8, technology: 5 } },
      { text: '経済安全保障を強化する', effect: { approvalRating: 3, technology: 12, diplomacy: 5 } },
      { text: '平和外交を推進する', effect: { approvalRating: 8, diplomacy: -3, environment: 5 } }
    ],
    '環境・エネルギー': [
      { text: '再生可能エネルギーに大規模投資する', effect: { approvalRating: 10, environment: 15, nationalDebt: 120 } },
      { text: '原発の再稼働を積極推進する', effect: { approvalRating: -8, environment: -10, gdp: 12 } },
      { text: '省エネ技術開発を促進する', effect: { approvalRating: 5, technology: 10, environment: 8 } },
      { text: '炭素税を導入する', effect: { approvalRating: -12, environment: 12, gdp: -5 } }
    ],
    '科学技術': [
      { text: 'AI・DX投資を大幅拡充する', effect: { approvalRating: 8, technology: 20, gdp: 10 } },
      { text: 'スタートアップ支援を強化する', effect: { approvalRating: 5, technology: 15, gdp: 8 } },
      { text: '大学の研究開発予算を倍増する', effect: { approvalRating: 3, technology: 18, nationalDebt: 80 } },
      { text: 'デジタル人材育成を加速する', effect: { approvalRating: 6, technology: 12, gdp: 6 } }
    ]
  };

  const choices = choiceTemplates[category] || choiceTemplates['経済政策'];

  // 基本選択肢4つ + 奇策2つを追加
  const extendedChoices = [...choices.slice(0, 8)];

  // 奇策を追加
  extendedChoices.push(
    { text: '🎯 総理が全国行脚で直接政策説明する', description: '【奇策】総理自ら47都道府県を回り政策を直接説明します。', effect: { approvalRating: 20, gdp: -2, technology: 3 } },
    { text: '🎲 政策決定にAI判断を導入する', description: '【奇策】AIが最適政策を判断し総理が承認する新システムです。', effect: { approvalRating: 15, technology: 25, diplomacy: -5 } }
  );

  return extendedChoices.slice(0, 10);
}

// フォールバック用のイベント生成
function generateFallbackEvent(template, theme, gameState) {
  return {
    id: crypto.randomBytes(8).toString('hex'),
    category: template.category,
    title: `${theme}への対応が急務`,
    description: generateFallbackDescription(template.category, theme, gameState),
    summary: `${theme}について重要な政策判断が求められています。`,
  };
}

// フォールバック用の説明文生成
function generateFallbackDescription(category, theme, gameState) {
  const descriptions = {
    '経済政策': `現在の経済状況（GDP${gameState?.gdp || 540}兆円、支持率${gameState?.approvalRating || 50}%）を踏まえ、${theme}に関する政策決定が求められています。国民の期待と経済成長のバランスを考慮した判断が必要です。`,
    '社会保障': `少子高齢化が進む中、${theme}への対応が急務となっています。財政健全性と社会保障の充実をどのように両立させるかが課題です。`,
    '外交・安全保障': `国際情勢の変化を受け、${theme}に関する戦略的判断が求められています。国益を守りつつ国際協調を進める必要があります。`,
    '環境・エネルギー': `2050年カーボンニュートラル目標の実現に向け、${theme}への取り組み強化が必要です。経済成長と環境保護の両立が課題となっています。`,
    '科学技術': `デジタル社会の実現に向け、${theme}の推進が重要課題となっています。国際競争力の向上と社会全体の利益向上を目指す必要があります。`
  };

  return descriptions[category] || `${theme}について重要な政策判断が必要な状況です。`;
}