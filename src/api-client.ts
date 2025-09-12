// サーバーサイドプロキシ経由でのAPI呼び出し
interface ServerResponse {
    success: boolean;
    comment?: string;
    analysis?: any;
    fallback?: boolean;
    timestamp: string;
    error?: string;
}

export class SecureAPIClient {
    private baseURL: string;

    constructor() {
        // 開発環境とプロダクション環境で自動切り替え
        this.baseURL = (import.meta.env as any).PROD 
            ? '/api'  // プロダクション環境
            : 'http://localhost:3001/api';  // 開発環境
        
        console.log('🔒 Secure API Client initialized');
        console.log('📡 Base URL:', this.baseURL);
    }

    // ツンデレコメント生成（サーバーサイドプロキシ経由）
    async generateTsundereComment(
        gameState: any,
        policyChoice: string,
        effect: any
    ): Promise<string> {
        try {
            console.log('🤖 サーバーサイドAPI呼び出し開始');
            
            const response = await fetch(`${this.baseURL}/generate-tsundere-comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameState,
                    policyChoice,
                    effect
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Server error: ${response.status} - ${errorData.error || response.statusText}`);
            }

            const data: ServerResponse = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Server returned unsuccessful response');
            }

            if (data.fallback) {
                console.log('⚠️ フォールバックコメントを使用');
            } else {
                console.log('✅ Gemini APIからコメント生成成功');
            }

            return data.comment || this.getFallbackComment(effect);

        } catch (error) {
            console.error('❌ サーバーサイドAPI呼び出しエラー:', error);
            console.log('🔄 クライアントサイドフォールバックに切り替え');
            return this.getFallbackComment(effect);
        }
    }

    // 政策分析（サーバーサイドプロキシ経由）
    async analyzePolicyChoice(
        policyChoice: string,
        gameState: any,
        eventContext: string
    ): Promise<any> {
        try {
            console.log('📊 政策分析API呼び出し開始');
            
            const response = await fetch(`${this.baseURL}/analyze-policy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameState,
                    policyChoice,
                    eventContext
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Server error: ${response.status} - ${errorData.error || response.statusText}`);
            }

            const data: ServerResponse = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Server returned unsuccessful response');
            }

            if (data.fallback) {
                console.log('⚠️ フォールバック分析を使用');
            } else {
                console.log('✅ Gemini APIから政策分析成功');
            }

            return data.analysis || this.getFallbackAnalysis(policyChoice);

        } catch (error) {
            console.error('❌ 政策分析API呼び出しエラー:', error);
            return this.getFallbackAnalysis(policyChoice);
        }
    }

    // サーバーヘルスチェック
    async checkServerHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            const data = await response.json();
            console.log('🏥 サーバーヘルスチェック:', data);
            return response.ok && data.status === 'OK';
        } catch (error) {
            console.error('❌ サーバーヘルスチェック失敗:', error);
            return false;
        }
    }

    // Ollamaツンデレコメント生成（サーバーサイドプロキシ経由）
    async generateOllamaTsundereComment(
        gameState: any,
        policyChoice: string,
        effect: any
    ): Promise<string> {
        try {
            console.log('🦙 OllamaサーバーサイドAPI呼び出し開始');
            
            const response = await fetch(`${this.baseURL}/ollama/generate-tsundere-comment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameState,
                    policyChoice,
                    effect
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Server error: ${response.status} - ${errorData.error || response.statusText}`);
            }

            const data: ServerResponse = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Server returned unsuccessful response');
            }

            if (data.fallback) {
                console.log('⚠️ Ollamaフォールバックコメントを使用');
            } else {
                console.log('✅ Ollama APIからコメント生成成功');
            }

            return data.comment || this.getFallbackComment(effect);

        } catch (error) {
            console.error('❌ OllamaサーバーサイドAPI呼び出しエラー:', error);
            console.log('🔄 クライアントサイドフォールバックに切り替え');
            return this.getFallbackComment(effect);
        }
    }

    // Ollama接続確認
    async checkOllamaHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseURL}/ollama/health`);
            const data = await response.json();
            console.log('🦙 Ollamaヘルスチェック:', data);
            return data.available;
        } catch (error) {
            console.error('❌ Ollamaヘルスチェック失敗:', error);
            return false;
        }
    }

    // フォールバックコメント
    private getFallbackComment(effect: any): string {
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

    // フォールバック分析
    private getFallbackAnalysis(policyChoice: string): any {
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