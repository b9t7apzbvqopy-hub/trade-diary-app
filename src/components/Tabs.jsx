import React from 'react';

export default function Tabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'input', label: '📝 入力', icon: '📝' },
    { id: 'list', label: '📋 一覧', icon: '📋' },
    { id: 'stats', label: '📊 集計', icon: '📊' },
    { id: 'settings', label: '⚙️ 設定', icon: '⚙️' }
  ];

  return (
    <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', borderBottom: '2px solid #ddd', overflow: 'auto' }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: '12px 20px',
            border: 'none',
            backgroundColor: activeTab === tab.id ? '#3498db' : 'transparent',
            color: activeTab === tab.id ? 'white' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === tab.id ? 'bold' : 'normal',
            borderRadius: '4px 4px 0 0',
            fontSize: '14px'
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
