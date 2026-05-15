import React, { useState, useEffect } from 'react';
import InputForm from './components/InputForm.jsx';
import TradeList from './components/TradeList.jsx';
import Statistics from './components/Statistics.jsx';
import Settings from './components/Settings.jsx';
import Tabs from './components/Tabs.jsx';
import Login from './components/Login.jsx';
import {
  saveTrade,
  getTrades,
  deleteTrade,
  updateTrade,
  overwriteAllTrades,
  resetAll,
} from './utils/storage.js';
import {
  getStoredToken,
  clearToken,
  verifyToken,
  requestAccessToken,
  signOut,
} from './utils/auth.js';
import { resetFolderCache } from './utils/drive.js';
import './App.css';

export default function App() {
  const [token, setToken] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [trades, setTrades] = useState([]);
  const [tradesLoading, setTradesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('input');
  const [editingTrade, setEditingTrade] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState(() => {
    return localStorage.getItem('backgroundColor') || '#ffffff';
  });

  // 起動時のトークン検証
  useEffect(() => {
    const stored = getStoredToken();
    if (!stored) {
      setAuthChecked(true);
      return;
    }
    verifyToken(stored).then((ok) => {
      if (ok) setToken(stored);
      else clearToken();
      setAuthChecked(true);
    });
  }, []);

  // ログイン後の trades 取得
  useEffect(() => {
    if (!token) return;
    setTradesLoading(true);
    getTrades(token)
      .then((data) => setTrades(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('trades 取得失敗:', err);
        if (err && err.code === 401) {
          clearToken();
          setToken(null);
          window.alert('ログインの有効期限が切れました。再度ログインしてください。');
        } else {
          window.alert(err && err.message ? err.message : 'データ取得に失敗しました');
        }
      })
      .finally(() => setTradesLoading(false));
  }, [token]);

  const handleLogin = async () => {
    try {
      const t = await requestAccessToken();
      setToken(t);
    } catch (err) {
      console.error('ログイン失敗:', err);
      window.alert(err && err.message ? err.message : 'ログインに失敗しました');
    }
  };

  const handleLogout = () => {
    signOut();
    resetFolderCache();
    setToken(null);
    setTrades([]);
  };

  const handleSaveTrade = async (trade) => {
    await saveTrade(token, trade);
    const next = await getTrades(token);
    setTrades(Array.isArray(next) ? next : []);
  };

  const handleDeleteTrade = async (id) => {
    await deleteTrade(token, id);
    const next = await getTrades(token);
    setTrades(Array.isArray(next) ? next : []);
  };

  const handleUpdateTrade = async (trade) => {
    await updateTrade(token, trade);
    const next = await getTrades(token);
    setTrades(Array.isArray(next) ? next : []);
  };

  const handleStartEdit = (trade) => {
    setEditingTrade(trade);
    setActiveTab('input');
  };

  const handleEditComplete = () => {
    setEditingTrade(null);
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

  const handleImport = async (data) => {
    if (data.trades && Array.isArray(data.trades)) {
      await overwriteAllTrades(token, data.trades);
      setTrades(data.trades);
    }
    if (data.backgroundColor) {
      setBackgroundColor(data.backgroundColor);
      localStorage.setItem('backgroundColor', data.backgroundColor);
    }
  };

  const handleReset = async () => {
    await resetAll(token);
    setTrades([]);
  };

  if (!authChecked) {
    return null;
  }

  if (!token) {
    return <Login onLogin={handleLogin} backgroundColor={backgroundColor} />;
  }

  return (
    <div style={{ backgroundColor, minHeight: '100vh', transition: 'background-color 0.3s', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>🎯 トレード日記アプリ</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>PHASE 1 - 入力フォーム版</p>

        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div>
          {activeTab === 'input' && (
            <InputForm
              token={token}
              onSave={handleSaveTrade}
              editingTrade={editingTrade}
              onUpdate={handleUpdateTrade}
              onEditComplete={handleEditComplete}
            />
          )}
          {activeTab === 'list' && (
            <TradeList
              token={token}
              trades={trades}
              loading={tradesLoading}
              onDelete={handleDeleteTrade}
              onEdit={handleStartEdit}
            />
          )}
          {activeTab === 'stats' && <Statistics trades={trades} />}
          {activeTab === 'settings' && (
            <Settings
              backgroundColor={backgroundColor}
              onColorChange={handleColorChange}
              onExport={handleExport}
              onImport={handleImport}
              onReset={handleReset}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </div>
  );
}
