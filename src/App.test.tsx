import React from 'react';

function TestApp() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🎌 AI駆動総理大臣シミュレーター</h1>
      <p>テストモード - アプリケーションが正常に動作しています</p>
      <button onClick={() => alert('動作確認OK!')}>
        動作テスト
      </button>
    </div>
  );
}

export default TestApp;