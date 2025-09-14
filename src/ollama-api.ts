// Ollama API統合
interface OllamaResponse {
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

interface OllamaStreamResponse {
    response: string;
    done: boolean;
}

export class OllamaAPI {
    private baseURL: string;
    private model: string;
    private timeout: number;

    constructor(baseURL: string = 'http://localhost:11434', model: string = 'llama3.1:8b') {
        this.baseURL = baseURL;
        this.model = model;
        this.timeout = 30000; // 30秒タイムアウト
        
        console.log('🦙 Ollama API初期化');
        console.log('Base URL:', this.baseURL);
        console.log('Model:', this.model);
    }

    // 利用可能なモデル一覧を取得
    async getAvailableModels(): Promise<string[]> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const response = await fetch(`${this.baseURL}/api/tags`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }

            const data = await response.json();
            return data.models?.map((model: any) => model.name) || [];
        } catch (error) {
            console.error('❌ Ollama models fetch error:', error);
            return [];
        }
    }

    // Ollamaサーバーの接続確認
    async checkConnection(): Promise<boolean> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.baseURL}/api/version`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            const isConnected = response.ok;
            console.log(isConnected ? '✅ Ollama接続成功' : '❌ Ollama接続失敗');
            return isConnected;
        } catch (error) {
            console.error('❌ Ollama接続エラー:', error);
            return false;
        }
    }

    // ツンデレコメント生成
    async generateTsundereComment(
        gameState: any,
        policyChoice: string,
        effect: any
    ): Promise<string> {
        console.log('🦙 Ollama APIでツンデレコメント生成開始');

        const prompt = `あなたは日本の総理大臣のツンデレAI政治秘書KASUMIです。

## 現在の政治状況
- ターン: ${gameState.turn}/${gameState.maxTurns}
- 支持率: ${gameState.approvalRating}% (${gameState.politicalTrends?.approvalTrend || 'stable'})
- GDP: ${gameState.gdp}兆円 (${gameState.politicalTrends?.economicTrend || 'stable'})
- 国債: ${gameState.nationalDebt}兆円
- 技術力: ${gameState.technology}%
- 環境: ${gameState.environment}%
- 株価: ${gameState.stockPrice}円
- ドル円: ${gameState.usdJpyRate}円
- 外交: ${gameState.diplomacy}%
- 政治リスク: ${gameState.politicalTrends?.riskLevel || 'medium'}

## 過去の政策履歴
${gameState.gameLog && gameState.gameLog.length > 0 
  ? gameState.gameLog.slice(-3).map((log: any) => `第${log.turn}ターン: ${log.choice}`).join('\n')
  : 'まだ政策実行なし'}

## 今回の政策選択
選択した政策: ${policyChoice}
政策効果: 支持率${effect.approvalRating || 0}, GDP${effect.gdp || 0}, 株価${effect.stockPrice || 0}, 外交${effect.diplomacy || 0}

## 指示
200文字以内でツンデレ口調の分析コメントを生成してください。以下を含めること：
1. 「総理」と呼びかけ
2. 過去の政策選択や現在のスコアを踏まえた分析
3. 照れや強がり、本音を含むツンデレ要素
4. 政治的な専門用語を使った具体的な評価
5. 今後への期待や心配を表現

例：「総理...前回の経済政策で株価は上がったけど、支持率がまだ50%台なんて...国民ったら総理の努力をわかってないのよ！でも私は総理を信じてるから！」

回答:`;

        try {
            const response = await fetch(`${this.baseURL}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
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
                signal: AbortSignal.timeout(this.timeout)
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }

            const data: OllamaResponse = await response.json();
            let comment = data.response.trim();

            // 不要な部分を除去
            comment = comment.replace(/^回答:\s*/, '');
            comment = comment.replace(/例:.*$/s, '');
            comment = comment.replace(/注意:.*$/s, '');
            comment = comment.trim();

            // 文字数制限
            if (comment.length > 150) {
                comment = comment.substring(0, 147) + '...';
            }

            console.log('✅ Ollama APIコメント生成成功');
            console.log('生成時間:', data.total_duration ? `${Math.round(data.total_duration / 1000000)}ms` : 'N/A');
            
            return comment || this.getFallbackTsundereComment(effect);

        } catch (error) {
            console.error('❌ Ollama API呼び出しエラー:', error);
            return this.getFallbackTsundereComment(effect);
        }
    }

    // 政策分析
    async analyzePolicyChoice(
        policyChoice: string,
        currentState: any,
        eventContext: string
    ): Promise<any> {
        console.log('🦙 Ollama APIで政策分析開始');

        const prompt = `あなたは日本の政治・経済の専門家AIです。以下の政策選択を分析し、現実的な影響を評価してください。

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

JSONのみを返してください:`;

        try {
            const response = await fetch(`${this.baseURL}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        top_p: 0.9,
                        top_k: 40,
                        num_predict: 500,
                        stop: ['\n\n注意:', '\n\n例:']
                    }
                }),
                signal: AbortSignal.timeout(this.timeout)
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }

            const data: OllamaResponse = await response.json();
            const content = data.response.trim();

            // JSONレスポンスをパース
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const analysis = JSON.parse(jsonMatch[0]);
                    console.log('✅ Ollama API政策分析成功');
                    return analysis;
                } catch (parseError) {
                    console.error('❌ JSON解析エラー:', parseError);
                    throw new Error('Invalid JSON response');
                }
            }

            throw new Error('No valid JSON found in response');

        } catch (error) {
            console.error('❌ Ollama API政策分析エラー:', error);
            return this.getDefaultAnalysis(policyChoice);
        }
    }

    // ストリーミング生成（将来の拡張用）
    async generateStream(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: true,
                    options: {
                        temperature: 0.8,
                        top_p: 0.9,
                        top_k: 40
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body reader');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const data: OllamaStreamResponse = JSON.parse(line);
                            onChunk(data.response);
                            if (data.done) return;
                        } catch (e) {
                            console.warn('Invalid JSON line:', line);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ Ollama streaming error:', error);
            throw error;
        }
    }

    // モデル変更
    setModel(model: string): void {
        this.model = model;
        console.log('🦙 Ollamaモデル変更:', model);
    }

    // ベースURL変更
    setBaseURL(baseURL: string): void {
        this.baseURL = baseURL;
        console.log('🦙 Ollama URL変更:', baseURL);
    }

    // フォールバックコメント
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

    // デフォルト分析
    private getDefaultAnalysis(policyChoice: string): any {
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
            reasoning: `政策「${policyChoice}」の分析を実行しました。現在はオフラインモードで動作しています。`
        };
    }
}