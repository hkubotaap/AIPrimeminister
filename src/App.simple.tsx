import { useState } from 'react';
import React from 'react';

// 段階的にインポートをテスト
console.log('🔍 基本インポートテスト開始...');

function App() {
  const [step, setStep] = useState(1);

  const testImport = async (moduleName: string, importFn: () => Promise<any>) => {
    try {
      console.log(`🔍 ${moduleName}をテスト中...`);
      await importFn();
      console.log(`✅ ${moduleName} 成功`);
      return true;
    } catch (error) {
      console.error(`❌ ${moduleName} エラー:`, error);
      return false;
    }
  };

  const runTests = async () => {
    const tests = [
      {
        name: 'AIProvider',
        test: () => import('./ai-provider')
      },
      {
        name: 'PolicyAnalyzer', 
        test: () => import('./policy-analyzer')
      },
      {
        name: 'EventGenerator',
        test: () => import('./event-generator')
      },
      {
        name: 'RankingSystem',
        test: () => import('./ranking-system')
      },
      {
        name: 'SecurityConfig',
        test: () => import('./security-config')
      }
    ];

    for (const test of tests) {
      const success = await testImport(test.name, test.test);
      if (!success) {
        console.log(`❌ ${test.name}で停止`);
        break;
      }
    }
  };

  React.useEffect(() => {
    runTests();
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'monospace'
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{ textAlign: 'center', color: '#333' }}>
          🔍 段階的インポートテスト
        </h1>
        <p style={{ textAlign: 'center', color: '#666' }}>
          各モジュールを個別にテストしています。<br />
          ブラウザのコンソールを確認してください。
        </p>
        <div style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '5px',
          marginTop: '20px',
          fontSize: '12px'
        }}>
          <strong>テスト手順:</strong><br />
          1. F12でコンソールを開く<br />
          2. どのモジュールでエラーが発生するか確認<br />
          3. エラーメッセージを詳しく確認
        </div>
      </div>
    </div>
  );
}

export default App;