// Gemini API統合
interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{
                text: string;
            }>;
        };
    }>;
}

interface PolicyAnalysis {
    evaluation: string;
    effects: {
        approvalRating: number;
        gdp: number;
        nationalDebt: number;
        technology: number;
        environment: number;
        stockPrice: number;
        usdJpyRate: number;
        diplomacy: number;
    };
    reasoning: string;
}

export class GeminiAPI {
    private apiKey: string;
    private baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

    constructor() {
        // 環境変数から取得
        this.apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

        console.log('🔑 Gemini API初期化');
        console.log('環境変数確認:', {
            hasApiKey: !!this.apiKey,
            keyLength: this.apiKey ? this.apiKey.length : 0,
            keyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'なし'
        });

        if (!this.apiKey) {
            console.warn('⚠️ Gemini API key not found. Using fallback mode.');
        } else {
            console.log('✅ Gemini APIキーが設定されています');
        }
        
        // 本番環境警告
        if ((import.meta.env as any).PROD && this.apiKey) {
            console.warn('⚠️ セキュリティ警告: APIキーがクライアントサイドで使用されています。本番環境ではサーバーサイドプロキシを使用してください。');
        }
    }

    async analyzePolicyChoice(
        policyChoice: string,
        currentState: any,
        eventContext: string
    ): Promise<PolicyAnalysis> {
        const prompt = `
あなたは日本の政治・経済の専門家AIです。以下の政策選択を分析し、現実的な影響を評価してください。

現在の状況:
- 支持率: ${currentState.approvalRating}%
- GDP: ${currentState.gdp}兆円
- 国債: ${currentState.nationalDebt}兆円
- 技術力: ${currentState.technology}%
- 環境: ${currentState.environment}%
- 株価: ${currentState.stockPrice}円
- ドル円レート: ${currentState.usdJpyRate}円
- 外交: ${currentState.diplomacy}%

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

        try {
            const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
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

            const data: GeminiResponse = await response.json();
            const content = data.candidates[0]?.content?.parts[0]?.text || '';

            // JSONレスポンスをパース
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            // フォールバック: デフォルト分析
            return this.getDefaultAnalysis(policyChoice);

        } catch (error) {
            console.error('Gemini API error:', error);
            return this.getDefaultAnalysis(policyChoice);
        }
    }

    private getDefaultAnalysis(policyChoice: string): PolicyAnalysis {
        // APIが利用できない場合のフォールバック分析
        const effects = {
            approvalRating: Math.floor(Math.random() * 21) - 10,
            gdp: Math.floor(Math.random() * 31) - 15,
            nationalDebt: Math.floor(Math.random() * 61) - 30,
            technology: Math.floor(Math.random() * 11) - 5,
            environment: Math.floor(Math.random() * 11) - 5,
            stockPrice: Math.floor(Math.random() * 2001) - 1000,
            usdJpyRate: Math.floor(Math.random() * 11) - 5,
            diplomacy: Math.floor(Math.random() * 11) - 5
        };

        return {
            evaluation: "普通",
            effects,
            reasoning: `政策「${policyChoice}」の分析を実行しました。現在はオフラインモードで動作しています。`
        };
    }

    // ツンデレコメント生成
    async generateTsundereComment(
        gameState: any,
        policyChoice: string,
        effect: any
    ): Promise<string> {
        console.log('🤖 Gemini API呼び出し開始');
        console.log('APIキー存在:', !!this.apiKey);
        
        if (!this.apiKey) {
            console.log('⚠️ APIキーなし - フォールバックモード');
            return this.getFallbackTsundereComment(effect);
        }

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

        try {
            console.log('🚀 Gemini APIリクエスト送信中...');
            const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
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

            console.log('📡 APIレスポンス:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Gemini APIエラー:', response.status, errorText);
                throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
            }

            const data: GeminiResponse = await response.json();
            console.log('✅ Gemini APIレスポンス受信:', data);
            const result = data.candidates[0]?.content?.parts[0]?.text || this.getFallbackTsundereComment(effect);
            console.log('🎭 生成されたツンデレコメント:', result);
            return result;

        } catch (error) {
            console.error('❌ Gemini API呼び出しエラー:', error);
            console.log('🔄 フォールバックモードに切り替え');
            return this.getFallbackTsundereComment(effect);
        }
    }

    private getFallbackTsundereComment(effect: any): string {
        const approvalChange = effect.approvalRating || 0;
        
        if (approvalChange > 10) {
            return 'え、えぇ！？支持率がこんなに上がるなんて...！まあ、総理だから当然よね。別に驚いてないんだから！でも...ちょっとだけ嬉しいかも。';
        } else if (approvalChange < -10) {
            return 'ちょっと！支持率が下がってるじゃない！もう、心配になっちゃうでしょ！でも私が付いてるから大丈夫よ！一緒に頑張りましょ？';
        } else {
            return 'まあまあの結果ね。でも、もう少し大胆な政策でもよかったんじゃない？...総理らしいといえばらしいかも。';
        }
    }

    async generateModernPoliticalEvent(): Promise<any> {
        const prompt = `
日本が現在直面している現実的な政治・経済・外交問題を1つ生成してください。
2024年の現代的な課題から選んでください:

- 少子高齢化対策と異次元の少子化対策
- デジタル庁のマイナンバー政策
- 脱炭素・グリーン政策とGX戦略
- 半導体戦略と経済安全保障
- 中国・韓国・アメリカとの外交関係
- インフレ対策と金融政策
- 円安対策と為替介入
- エネルギー安全保障とウクライナ情勢
- サイバーセキュリティ強化
- 地方創生と東京一極集中
- 働き方改革と人手不足
- 社会保障制度改革と2025年問題

以下の形式でJSONを返してください:
{
  "title": "問題のタイトル",
  "description": "詳細な状況説明（200文字程度）",
  "options": [
    {"text": "選択肢1（保守的アプローチ）", "type": "conservative"},
    {"text": "選択肢2（革新的アプローチ）", "type": "progressive"},
    {"text": "選択肢3（中道的アプローチ）", "type": "moderate"}
  ]
}
`;

        try {
            const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
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
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 800,
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const data: GeminiResponse = await response.json();
            const content = data.candidates[0]?.content?.parts[0]?.text || '';

            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return this.getDefaultEvent();

        } catch (error) {
            console.error('Gemini API error:', error);
            return this.getDefaultEvent();
        }
    }

    private getDefaultEvent() {
        const events = [
            {
                title: "急激な円安進行（150円突破）",
                description: "ドル円レートが150円を突破し、輸入物価の上昇で国民生活に影響が出ています。日銀の金融政策との整合性も問われています。",
                options: [
                    { "text": "日銀と協調して為替介入を実施", "type": "conservative" },
                    { "text": "金利政策の見直しを日銀に要請", "type": "progressive" },
                    { "text": "市場の動向を注視し様子見", "type": "moderate" }
                ]
            },
            {
                title: "半導体戦略と経済安全保障",
                description: "世界的な半導体不足が続く中、台湾有事リスクも高まっています。日本の半導体戦略の見直しが急務です。",
                options: [
                    { "text": "TSMC誘致など海外企業との連携強化", "type": "progressive" },
                    { "text": "国内半導体産業への大規模投資", "type": "conservative" },
                    { "text": "日米半導体協定の再構築", "type": "moderate" }
                ]
            }
        ];

        return events[Math.floor(Math.random() * events.length)];
    }
}