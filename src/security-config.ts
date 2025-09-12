// セキュリティ設定とベストプラクティス

export const SECURITY_CONFIG = {
    // 本番環境でのAPIキー使用警告
    WARN_CLIENT_SIDE_API_KEY: true,
    
    // CSP (Content Security Policy) 推奨設定
    CSP_DIRECTIVES: {
        'default-src': "'self'",
        'script-src': "'self' 'unsafe-inline'",
        'style-src': "'self' 'unsafe-inline'",
        'img-src': "'self' data: https:",
        'connect-src': "'self' https://generativelanguage.googleapis.com",
        'font-src': "'self'",
        'object-src': "'none'",
        'media-src': "'self'",
        'frame-src': "'none'"
    },
    
    // レート制限設定
    RATE_LIMITS: {
        API_CALLS_PER_MINUTE: 15,
        API_CALLS_PER_HOUR: 100
    },
    
    // 入力検証
    INPUT_VALIDATION: {
        MAX_CUSTOM_POLICY_LENGTH: 200,
        ALLOWED_CHARACTERS: /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s\-.,!?()（）「」。、]*$/
    }
};

// セキュリティチェック関数
export class SecurityValidator {
    private static apiCallCount = 0;
    private static lastResetTime = Date.now();

    // レート制限チェック
    static checkRateLimit(): boolean {
        const now = Date.now();
        const timeDiff = now - this.lastResetTime;
        
        // 1分ごとにリセット
        if (timeDiff > 60000) {
            this.apiCallCount = 0;
            this.lastResetTime = now;
        }
        
        if (this.apiCallCount >= SECURITY_CONFIG.RATE_LIMITS.API_CALLS_PER_MINUTE) {
            console.warn('⚠️ レート制限に達しました。しばらくお待ちください。');
            return false;
        }
        
        this.apiCallCount++;
        return true;
    }

    // 入力検証
    static validateInput(input: string): boolean {
        if (!input || input.length > SECURITY_CONFIG.INPUT_VALIDATION.MAX_CUSTOM_POLICY_LENGTH) {
            return false;
        }
        
        return SECURITY_CONFIG.INPUT_VALIDATION.ALLOWED_CHARACTERS.test(input);
    }

    // XSS防止のためのサニタイズ
    static sanitizeInput(input: string): string {
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    // APIキーの検証（開発環境用）
    static validateApiKey(apiKey: string): boolean {
        if (!apiKey) return false;
        
        // Gemini APIキーの形式チェック
        const geminiKeyPattern = /^AIza[0-9A-Za-z-_]{35}$/;
        return geminiKeyPattern.test(apiKey);
    }

    // 本番環境での警告表示
    static checkProductionSecurity(): void {
        if ((import.meta.env as any).PROD) {
            const hasApiKey = !!(import.meta as any).env?.VITE_GEMINI_API_KEY;
            
            if (hasApiKey && SECURITY_CONFIG.WARN_CLIENT_SIDE_API_KEY) {
                console.warn(`
🚨 セキュリティ警告 🚨
APIキーがクライアントサイドで使用されています。

本番環境では以下の対策を推奨します：
1. サーバーサイドプロキシの実装
2. APIキーの環境変数での管理
3. CORS設定の適切な構成
4. レート制限の実装
5. ログ監視の設定

詳細: https://developers.google.com/ai/gemini-api/docs/api-key
                `);
            }
        }
    }
}

// 本番環境用の推奨設定
export const PRODUCTION_RECOMMENDATIONS = {
    // サーバーサイドプロキシの実装例
    PROXY_ENDPOINT: '/api/gemini-proxy',
    
    // 環境変数の推奨設定
    ENV_VARS: {
        'NODE_ENV': 'production',
        'VITE_API_ENDPOINT': 'https://your-api-proxy.com',
        // APIキーはサーバーサイドでのみ使用
    },
    
    // Nginx設定例
    NGINX_CONFIG: `
        # レート制限
        limit_req_zone $binary_remote_addr zone=api:10m rate=10r/m;
        
        # APIプロキシ
        location /api/gemini-proxy {
            limit_req zone=api burst=5;
            proxy_pass https://generativelanguage.googleapis.com;
            proxy_set_header Authorization "Bearer $GEMINI_API_KEY";
        }
    `,
    
    // セキュリティヘッダー
    SECURITY_HEADERS: {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
};

// 初期化時のセキュリティチェック
SecurityValidator.checkProductionSecurity();