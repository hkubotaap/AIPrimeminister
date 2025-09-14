// サーバーサイドプロキシ経由でのAPI呼び出し
interface ServerResponse {
    success: boolean;
    comment?: string;
    analysis?: any;
    fallback?: boolean;
    timestamp: string;
    error?: string;
}

interface PolicyChoice {
    text: string;
    description?: string;
    effect: {
        approvalRating: number;
        gdp: number;
        nationalDebt: number;
        technology: number;
        environment: number;
        stockPrice: number;
        usdJpyRate: number;
        diplomacy: number;
    };
    reasoning?: string;
    politicalRisk?: 'high' | 'medium' | 'low';
    internationalImpact?: '革命的' | '重大' | '中程度' | '軽微';
}

interface PolicyChoicesResponse {
    success: boolean;
    data: {
        choices: PolicyChoice[];
        metadata: {
            event: string;
            turn: number;
            difficulty: string;
            generatedAt: string;
            fallback?: boolean;
        };
    };
    message: string;
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
        console.log('🌍 Environment:', (import.meta.env as any).PROD ? 'Production' : 'Development');
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

    // AI政策選択肢生成（サーバーサイドプロキシ経由）
    async generatePolicyChoices(
        eventTitle: string,
        eventDescription: string,
        gameState: any,
        turn: number,
        difficulty: 'easy' | 'normal' | 'hard' = 'normal'
    ): Promise<PolicyChoice[]> {
        try {
            console.log('🎯 AI政策選択肢生成API呼び出し開始');
            
            const response = await fetch(`${this.baseURL}/generate-policy-choices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    eventTitle,
                    eventDescription,
                    gameState,
                    turn,
                    difficulty
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Server error: ${response.status} - ${errorData.error || response.statusText}`);
            }

            const data: PolicyChoicesResponse = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Server returned unsuccessful response');
            }

            if (data.data.metadata.fallback) {
                console.log('⚠️ フォールバック政策選択肢を使用');
            } else {
                console.log('✅ AI政策選択肢生成成功:', data.data.choices.length, '個の選択肢');
            }

            return data.data.choices;

        } catch (error) {
            console.error('❌ AI政策選択肢生成エラー:', error);
            console.log('🔄 クライアントサイドフォールバックに切り替え');
            return this.getFallbackPolicyChoices();
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
            return data.available || false;
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

    // フォールバック政策選択肢
    private getFallbackPolicyChoices(): PolicyChoice[] {
        return [
            {
                text: '【中道保守】段階的対応策：既存制度の漸進的改革で安定性を重視',
                description: '現行法制度の枠組みを維持しつつ、部分的な改善を図る。政治的リスクを最小化し、着実な成果を目指す保守的アプローチ。',
                effect: {
                    approvalRating: 2,
                    gdp: 2,
                    nationalDebt: 3,
                    technology: 1,
                    environment: 1,
                    stockPrice: 150,
                    usdJpyRate: 0,
                    diplomacy: 2
                },
                reasoning: '政治的安定を最優先とし、急激な変化を避けることで支持基盤を維持する現実主義的戦略',
                politicalRisk: 'low',
                internationalImpact: '軽微'
            },
            {
                text: '【中道革新】構造改革断行：10兆円規模の投資で抜本的制度改革',
                description: '既存制度の根本的見直しを実施。大規模予算投入により長期的な競争力強化を図るが、短期的な財政負担と政治的対立は不可避。',
                effect: {
                    approvalRating: -3,
                    gdp: 8,
                    nationalDebt: -8,
                    technology: 5,
                    environment: 3,
                    stockPrice: 400,
                    usdJpyRate: -2,
                    diplomacy: -1
                },
                reasoning: '長期的国家競争力向上を目指し、短期的政治コストを覚悟した改革志向の政治的賭け',
                politicalRisk: 'medium',
                internationalImpact: '中程度'
            },
            {
                text: '【国際協調】多国間連携強化：G7・ASEAN首脳会議の緊急招集',
                description: '外交チャンネルを最大限活用し、国際協調による問題解決を図る。短期的には外交成果重視だが、国内世論の反発リスクも存在。',
                effect: {
                    approvalRating: 3,
                    gdp: 3,
                    nationalDebt: 2,
                    technology: 2,
                    environment: 2,
                    stockPrice: 250,
                    usdJpyRate: -3,
                    diplomacy: 8
                },
                reasoning: '国際的信頼関係を政治資源として活用し、多国間協力による解決を模索する外交重視戦略',
                politicalRisk: 'medium',
                internationalImpact: '重大'
            },
            {
                text: '【緊急対応】危機管理内閣発足：5兆円緊急経済対策の即時実行',
                description: '政府一体となった緊急対応体制を構築。大規模な財政出動で即効性を重視するが、財政規律への懸念と将来世代への負担転嫁が問題。',
                effect: {
                    approvalRating: 5,
                    gdp: -2,
                    nationalDebt: 12,
                    technology: 0,
                    environment: -2,
                    stockPrice: 600,
                    usdJpyRate: 2,
                    diplomacy: 1
                },
                reasoning: '短期的な危機対応を最優先とし、将来的なツケを承知で即効性のある政策を選択する危機管理型戦略',
                politicalRisk: 'high',
                internationalImpact: '中程度'
            }
        ];
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