import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// エラーハンドリング追加
try {
  console.log('🚀 React アプリケーション起動中...');
  console.log('📍 Environment:', import.meta.env.MODE);
  
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  
  console.log('✅ React アプリケーション起動完了');
} catch (error) {
  console.error('❌ React アプリケーション起動エラー:', error);
  
  // フォールバック表示
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
        <h1>🚨 アプリケーション起動エラー</h1>
        <p>アプリケーションの起動中にエラーが発生しました。</p>
        <p>ブラウザのコンソールで詳細なエラー情報を確認してください。</p>
        <p><strong>エラー:</strong> ${error}</p>
      </div>
    `;
  }
}
