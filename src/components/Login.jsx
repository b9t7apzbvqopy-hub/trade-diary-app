import React, { useState } from 'react';

export default function Login({ onLogin, backgroundColor }) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await onLogin();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: backgroundColor || '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: '420px',
          width: '100%',
          backgroundColor: 'white',
          padding: '40px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
          textAlign: 'center',
        }}
      >
        <h1 style={{ marginBottom: '8px' }}>🎯 トレード日記アプリ</h1>
        <p style={{ color: '#666', marginBottom: '32px', fontSize: '14px' }}>
          Google Drive にデータを保存します
        </p>
        <button
          onClick={handleClick}
          disabled={busy}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: 'white',
            backgroundColor: '#4285f4',
            border: 'none',
            borderRadius: '8px',
            cursor: busy ? 'not-allowed' : 'pointer',
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? 'ログイン中...' : 'Google でログイン'}
        </button>
        <p style={{ color: '#999', marginTop: '24px', fontSize: '12px', lineHeight: 1.6 }}>
          スコープ: drive.file（このアプリが作成したファイルのみアクセス）
        </p>
      </div>
    </div>
  );
}
