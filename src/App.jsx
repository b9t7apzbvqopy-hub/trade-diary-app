import React, { useState, useEffect } from 'react';
import InputForm from './components/InputForm.jsx';
import TradeList from './components/TradeList.jsx';
import Statistics from './components/Statistics.jsx';
import Settings from './components/Settings.jsx';
import Tabs from './components/Tabs.jsx';
import { saveTrade, getTrades, deleteTrade } from './utils/storage.js';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('input');
  const [trades, setTrades] = useState(() => getTrades());
  const [backgroundColor, setBackgroundColor] = useState(() => {
    return localStorage.getItem('backgroundColor') || '#ffffff';
  });

  const handleSaveTrade = (trade) => {
    saveTrade(trade);
    setTrades(getTrades());
  };

  const handleDeleteTrade = (id) => {
    deleteTrade(id);
    setTrades(getTrades());
  };

  const handleColorChange = (color) => {
    setBackgroundColor(color);
    localStorage.setItem('backgroundColor', color);
  };

  const handleExport = () => {
    const data = { trades, backgroundColor };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trade_diary_backup.json';
    a.click();
  };

  const handleImport = (data) => {
    if (data.trades && Array.isArray(data.trades)) {
      localStorage.setItem('trades', JSON.stringify(data.trades));
      setTrades(data.trades);
    }
    if (data.backgroundColor) {
      setBackgroundColor(data.backgroundColor);
      localStorage.setItem('backgroundColor', data.backgroundColor);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('trades');
    setTrades([]);
  };

  return (
    <div style={{ backgroundColor, minHeight: '100vh', transition: 'background-color 0.3s', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>🎯 トレード日記アプリ</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>PHASE 1 - 入力フォーム版</p>

        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div>
          {activeTab === 'input' && <InputForm onSave={handleSaveTrade} />}
          {activeTab === 'list' && <TradeList trades={trades} onDelete={handleDeleteTrade} />}
          {activeTab === 'stats' && <Statistics trades={trades} />}
          {activeTab === 'settings' && <Settings backgroundColor={backgroundColor} onColorChange={handleColorChange} onExport={handleExport} onImport={handleImport} onReset={handleReset} />}
        </div>
      </div>
    </div>
  );
}
