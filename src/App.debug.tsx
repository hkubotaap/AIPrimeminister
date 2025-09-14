import { useState } from 'react';
import React from 'react';

// ES6インポートをテスト
console.log('🔍 インポートテスト開始...');

// 各モジュールを個別にインポートしてテスト
import { AIProviderManager, AIProvider } from './ai-provider';
import { PolicyAnalyzer, PolicyContext } from './policy-analyzer';
import { EventGenerator, EventGenerationContext, GeneratedEvent } from './event-generator';
import { RankingSystem, RankingEntry } from './ranking-system';
import { SecurityValidator } from './security-config';
import RankingModal from './components/RankingModal';
import ScoreSubmissionModal from './components/ScoreSubmissionModal';

console.log('✅ すべてのインポートが成功しました');

function App() {
  const [debug] = useState(true);

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
          🔍 デバッグモード
        </h1>
        <p style={{ textAlign: 'center', color: '#666' }}>
          インポートテストが完了しました。ブラウザのコンソールを確認してください。
        </p>
        <div style={{ 
          background: '#f5f5f5', 
          padding: '10px', 
          borderRadius: '5px',
          marginTop: '20px',
          fontSize: '12px'
        }}>
          <strong>確認事項:</strong><br />
          1. ブラウザの開発者ツール（F12）を開く<br />
          2. コンソールタブを確認<br />
          3. エラーメッセージがないかチェック<br />
          4. すべてのインポートが成功しているか確認
        </div>
      </div>
    </div>
  );
}

export default App;