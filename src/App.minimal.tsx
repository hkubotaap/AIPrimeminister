import { useState } from 'react';
import React from 'react';

function App() {
  const [gameStarted, setGameStarted] = useState(false);

  if (!gameStarted) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          maxWidth: '500px'
        }}>
          <h1 style={{ color: '#333', marginBottom: '20px' }}>
            🎌 AI駆動総理大臣シミュレーター
          </h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            AIが生成する政治課題に対して、あなたの判断で日本を導いてください。
          </p>
          <button 
            onClick={() => setGameStarted(true)}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '10px',
              fontSize: '18px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.background = '#5a67d8'}
            onMouseOut={(e) => (e.target as HTMLElement).style.background = '#667eea'}
          >
            ゲーム開始
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{ textAlign: 'center', color: '#333' }}>
          🏛️ 政権運営中...
        </h1>
        <p style={{ textAlign: 'center', color: '#666' }}>
          ゲームが開始されました！（最小限バージョン）
        </p>
        <button 
          onClick={() => setGameStarted(false)}
          style={{
            background: '#e53e3e',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'block',
            margin: '20px auto'
          }}
        >
          タイトルに戻る
        </button>
      </div>
    </div>
  );
}

export default App;