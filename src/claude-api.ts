// Claude API統合
interface ClaudeResponse {
    content: Array<{
        type: string;
        text: string;
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

export class ClaudeAPI {
    private apiKey: string;
    private baseURL = 'https://api.anthropic.com/v1/messages';

    constructor() {
        // 本番環境では環境変数から取得（サーバーサイドで処理すべき）
        this.apiKey = (import.meta as any).env?.VITE_CLAUDE_API_KEY || '';

        if (!this.apiKey) {
            console.warn('Claude API key not found. Using fallback mode.');
        }
        
        // 本番環境警告
        if (import.meta.env.PROD && this.apiKey) {
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
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 1000,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`Claude API error: ${response.status}`);
            }

            const data: ClaudeResponse = await response.json();
            const content = data.content[0]?.text || '';

            // JSONレスポンスをパース
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            // フォールバック: デフォルト分析
            return this.getDefaultAnalysis(policyChoice);

        } catch (error) {
            console.error('Claude API error:', error);
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

    async generateModernPoliticalEvent(): Promise<any> {
        const prompt = `
日本が現在直面している現実的な政治・経済・外交問題を1つ生成してください。
以下のような現代的な課題から選んでください:

- 少子高齢化対策
- デジタル庁の政策
- 脱炭素・グリーン政策
- 半導体戦略
- 中国・韓国・アメリカとの外交
- インフレ対策
- 円安対策
- エネルギー安全保障
- サイバーセキュリティ
- 地方創生
- 働き方改革
- 社会保障制度改革

以下の形式でJSONを返してください:
{
  "title": "問題のタイトル",
  "description": "詳細な状況説明",
  "options": [
    {"text": "選択肢1", "type": "conservative"},
    {"text": "選択肢2", "type": "progressive"},
    {"text": "選択肢3", "type": "moderate"}
  ]
}
`;

        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 800,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`Claude API error: ${response.status}`);
            }

            const data: ClaudeResponse = await response.json();
            const content = data.content[0]?.text || '';

            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return this.getDefaultEvent();

        } catch (error) {
            console.error('Claude API error:', error);
            return this.getDefaultEvent();
        }
    }

    // ツンデレコメント生成
    async generateTsundereComment(
        gameState: any,
        policyChoice: string,
        effect: any
    ): Promise<string> {
        if (!this.apiKey) {
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
`;

        try {
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 300,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`Claude API error: ${response.status}`);
            }

            const data: ClaudeResponse = await response.json();
            return data.content[0]?.text || this.getFallbackTsundereComment(effect);

        } catch (error) {
            console.error('Claude API error:', error);
            return this.getFallbackTsundereComment(effect);
        }
    }

    private getFallbackTsundereComment(effect: any): string {
        const approvalChange = effect.approvalRating || 0;
        
        if (approvalChange > 10) {
            return 'え、えぇ！？支持率がこんなに上がるなんて...！まあ、総理だから当然よね。別に驚いてないんだから！';
        } else if (approvalChange < -10) {
            return 'ちょっと！支持率が下がってるじゃない！もう、心配になっちゃうでしょ！でも私が付いてるから大丈夫よ！';
        } else {
            return 'まあまあの結果ね。でも、もう少し大胆な政策でもよかったんじゃない？...総理らしいといえばらしいかも。';
        }
    }

    private getDefaultEvent() {
        const events = [
            {
                title: "急激な円安進行",
                description: "ドル円レートが150円を突破し、輸入物価の上昇が懸念されています。政府の対応が求められています。",
                options: [
                    { "text": "日銀と協調して為替介入を実施", "type": "conservative" },
                    { "text": "金利政策の見直しを検討", "type": "progressive" },
                    { "text": "市場の動向を注視し様子見", "type": "moderate" }
                ]
            },
            {
                title: "半導体不足による産業への影響",
                description: "世界的な半導体不足が日本の自動車産業に深刻な影響を与えています。対策が急務です。",
                options: [
                    { "text": "国内半導体工場建設に大規模投資", "type": "progressive" },
                    { "text": "海外企業との戦略的パートナーシップ強化", "type": "moderate" },
                    { "text": "既存企業への支援策を拡充", "type": "conservative" }
                ]
            }
        ];

        return events[Math.floor(Math.random() * events.length)];
    }
}