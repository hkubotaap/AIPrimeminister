// AIプロバイダー管理システム
import { SecureAPIClient } from './api-client';
import { OllamaAPI } from './ollama-api';

export type AIProvider = 'gemini' | 'ollama' | 'fallback' | 'offline';

export interface AIProviderConfig {
    name: string;
    displayName: string;
    description: string;
    icon: string;
    available: boolean;
    requiresSetup: boolean;
    setupInstructions?: string;
}

export interface AIProviderStatus {
    provider: AIProvider;
    available: boolean;
    latency?: number;
    error?: string;
}

export class AIProviderManager {
    private currentProvider: AIProvider = 'fallback';
    private secureClient: SecureAPIClient;
    private ollamaClient: OllamaAPI;
    private providerStatus: Map<AIProvider, AIProviderStatus> = new Map();

    constructor() {
        this.secureClient = new SecureAPIClient();
        this.ollamaClient = new OllamaAPI();
        
        console.log('🤖 AIプロバイダーマネージャー初期化');
        this.initializeProviders();
    }

    // プロバイダー設定
    getProviderConfigs(): Record<AIProvider, AIProviderConfig> {
        return {
            gemini: {
                name: 'gemini',
                displayName: 'Google Gemini',
                description: '高品質なAI分析（サーバーサイドプロキシ経由）',
                icon: '🧠',
                available: true,
                requiresSetup: true,
                setupInstructions: 'サーバーサイドでGemini APIキーを設定してください'
            },
            ollama: {
                name: 'ollama',
                displayName: 'Ollama (ローカル)',
                description: 'プライベートなローカルAI（Ollama必須）',
                icon: '🦙',
                available: false,
                requiresSetup: true,
                setupInstructions: 'Ollamaをインストールし、llama3.1:8bモデルをダウンロードしてください'
            },
            fallback: {
                name: 'fallback',
                displayName: 'フォールバック',
                description: 'エラー時の緊急フォールバックモード',
                icon: '🔄',
                available: true,
                requiresSetup: false
            },
            offline: {
                name: 'offline',
                displayName: 'オフライン',
                description: 'インターネット不要の完全オフラインモード',
                icon: '📱',
                available: true,
                requiresSetup: false
            }
        };
    }

    // プロバイダー初期化
    private async initializeProviders(): Promise<void> {
        console.log('🔍 AIプロバイダー可用性チェック開始');

        // Gemini (サーバーサイド) チェック
        try {
            const geminiAvailable = await this.secureClient.checkServerHealth();
            this.providerStatus.set('gemini', {
                provider: 'gemini',
                available: geminiAvailable
            });
            console.log(geminiAvailable ? '✅ Gemini利用可能' : '❌ Gemini利用不可');
        } catch (error) {
            this.providerStatus.set('gemini', {
                provider: 'gemini',
                available: false,
                error: 'サーバー接続エラー'
            });
        }

        // Ollama チェック（サーバーサイド経由）
        try {
            const ollamaAvailable = await this.secureClient.checkOllamaHealth();
            this.providerStatus.set('ollama', {
                provider: 'ollama',
                available: ollamaAvailable
            });
            console.log(ollamaAvailable ? '✅ Ollama利用可能' : '❌ Ollama利用不可');
        } catch (error) {
            this.providerStatus.set('ollama', {
                provider: 'ollama',
                available: false,
                error: 'Ollama接続エラー'
            });
        }

        // フォールバック（常に利用可能）
        this.providerStatus.set('fallback', {
            provider: 'fallback',
            available: true
        });

        // 最適なプロバイダーを自動選択
        this.autoSelectProvider();
    }

    // 最適なプロバイダーを自動選択
    private autoSelectProvider(): void {
        const preferences: AIProvider[] = ['gemini', 'ollama', 'fallback'];
        
        for (const provider of preferences) {
            const status = this.providerStatus.get(provider);
            if (status?.available) {
                this.currentProvider = provider;
                console.log(`🎯 自動選択されたプロバイダー: ${provider}`);
                break;
            }
        }
    }

    // プロバイダー手動設定
    setProvider(provider: AIProvider): boolean {
        const status = this.providerStatus.get(provider);
        if (!status?.available) {
            console.warn(`⚠️ プロバイダー ${provider} は利用できません`);
            return false;
        }

        this.currentProvider = provider;
        console.log(`🔄 プロバイダー変更: ${provider}`);
        return true;
    }

    // 現在のプロバイダー取得
    getCurrentProvider(): AIProvider {
        return this.currentProvider;
    }

    // プロバイダーステータス取得
    getProviderStatus(): Map<AIProvider, AIProviderStatus> {
        return new Map(this.providerStatus);
    }

    // ツンデレコメント生成（プロバイダー自動選択）
    async generateTsundereComment(
        gameState: any,
        policyChoice: string,
        effect: any
    ): Promise<string> {
        const startTime = Date.now();
        
        try {
            let result: string;

            switch (this.currentProvider) {
                case 'gemini':
                    result = await this.secureClient.generateTsundereComment(gameState, policyChoice, effect);
                    break;
                
                case 'ollama':
                    result = await this.secureClient.generateOllamaTsundereComment(gameState, policyChoice, effect);
                    break;
                
                case 'fallback':
                default:
                    result = this.getFallbackComment(effect);
                    break;
            }

            const latency = Date.now() - startTime;
            console.log(`⚡ ${this.currentProvider} レスポンス時間: ${latency}ms`);

            // レスポンス時間を記録
            const status = this.providerStatus.get(this.currentProvider);
            if (status) {
                status.latency = latency;
            }

            return result;

        } catch (error) {
            console.error(`❌ ${this.currentProvider} エラー:`, error);
            
            // エラー時は自動的にフォールバックに切り替え
            if (this.currentProvider !== 'fallback') {
                console.log('🔄 フォールバックモードに自動切り替え');
                this.currentProvider = 'fallback';
                return this.getFallbackComment(effect);
            }
            
            return this.getFallbackComment(effect);
        }
    }

    // 政策分析（プロバイダー自動選択）
    async analyzePolicyChoice(
        policyChoice: string,
        gameState: any,
        eventContext: string
    ): Promise<any> {
        const startTime = Date.now();
        
        try {
            let result: any;

            switch (this.currentProvider) {
                case 'gemini':
                    result = await this.secureClient.analyzePolicyChoice(policyChoice, gameState, eventContext);
                    break;
                
                case 'ollama':
                    result = await this.ollamaClient.analyzePolicyChoice(policyChoice, gameState, eventContext);
                    break;
                
                case 'fallback':
                default:
                    result = this.getFallbackAnalysis(policyChoice);
                    break;
            }

            const latency = Date.now() - startTime;
            console.log(`⚡ ${this.currentProvider} 分析時間: ${latency}ms`);

            return result;

        } catch (error) {
            console.error(`❌ ${this.currentProvider} 分析エラー:`, error);
            
            // エラー時は自動的にフォールバックに切り替え
            if (this.currentProvider !== 'fallback') {
                console.log('🔄 フォールバック分析に自動切り替え');
                this.currentProvider = 'fallback';
                return this.getFallbackAnalysis(policyChoice);
            }
            
            return this.getFallbackAnalysis(policyChoice);
        }
    }

    // Ollamaモデル一覧取得
    async getOllamaModels(): Promise<string[]> {
        try {
            return await this.ollamaClient.getAvailableModels();
        } catch (error) {
            console.error('❌ Ollamaモデル取得エラー:', error);
            return [];
        }
    }

    // Ollamaモデル変更
    setOllamaModel(model: string): void {
        this.ollamaClient.setModel(model);
    }

    // プロバイダー再チェック
    async recheckProviders(): Promise<void> {
        console.log('🔄 プロバイダー再チェック開始');
        await this.initializeProviders();
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