import { useState, useEffect, useCallback } from 'react';
import { 
  Search, TrendingUp, TrendingDown, Activity, Bell, 
  BarChart3, Shield, Newspaper, AlertTriangle, LineChart,
  Plus, Trash2, RefreshCw, DollarSign, Percent, Briefcase
} from 'lucide-react';
import './App.css';
import PortfolioTab from './components/PortfolioTab';
import AlertsTab from './components/AlertsTab';
import RiskTab from './components/RiskTab';

const SUPABASE_URL = 'https://bpbtgkunrdzcoyfdhskh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwYnRna3VucmR6Y295ZmRoc2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MjAzNzUsImV4cCI6MjA3ODQ5NjM3NX0.ZAtjUoDnIWUOs6Os1NUGKIRUQVOuXDlaCJ4HwQqZu50';

interface SentimentData {
  token: string;
  sentiment: {
    score: number;
    label: string;
    fearGreedIndex: number;
    marketMomentum: string;
    socialSentiment: string;
  };
  indicators: {
    bullishSignals: string[];
    bearishSignals: string[];
    neutralFactors: string[];
  };
  analysis: string;
  recommendation: string;
  timestamp: string;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  sentiment: string;
  category: string;
}

interface AnalyticsData {
  token: string;
  indicators: {
    rsi: { value: number; signal: string; period: number };
    macd: { macd: string; signal: string; histogram: string; trend: string };
    movingAverages: any;
    bollingerBands: any;
    supportResistance: any;
  };
  priceData: {
    current: number;
    high24h: number;
    low24h: number;
    volume24h: number;
  };
}

function App() {
  const [token, setToken] = useState('bitcoin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'news' | 'portfolio' | 'alerts' | 'risk'>('dashboard');

  // Data states
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [newsData, setNewsData] = useState<NewsItem[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!token.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch sentiment data with retry
      let sentimentAttempts = 0;
      let sentimentSuccess = false;
      
      while (sentimentAttempts < 2 && !sentimentSuccess) {
        try {
          const sentimentResponse = await fetch(
            `${SUPABASE_URL}/functions/v1/sentiment?token=${encodeURIComponent(token)}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
              }
            }
          );

          if (sentimentResponse.ok) {
            const sentimentResult = await sentimentResponse.json();
            if (sentimentResult?.data) {
              setSentimentData(sentimentResult.data);
              sentimentSuccess = true;
            }
          } else if (sentimentAttempts === 0) {
            // Retry once on failure
            sentimentAttempts++;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
          } else {
            throw new Error('Sentiment data unavailable. This may be due to cold start or API limits. Please try again.');
          }
        } catch (e) {
          sentimentAttempts++;
          if (sentimentAttempts >= 2) {
            throw e;
          }
        }
      }

      // Fetch news (non-critical)
      try {
        const newsResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/news?category=general&limit=5`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            }
          }
        );

        if (newsResponse.ok) {
          const newsResult = await newsResponse.json();
          if (newsResult?.data?.news) {
            setNewsData(newsResult.data.news);
          }
        }
      } catch (e) {
        // News fetch failure is non-critical
        console.log('News fetch failed, continuing...');
      }

      // Fetch analytics (non-critical)
      try {
        const analyticsResponse = await fetch(
          `${SUPABASE_URL}/functions/v1/analytics?token=${encodeURIComponent(token)}&indicator=all`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            }
          }
        );

        if (analyticsResponse.ok) {
          const analyticsResult = await analyticsResponse.json();
          if (analyticsResult?.data) {
            setAnalyticsData(analyticsResult.data);
          }
        }
      } catch (e) {
        // Analytics fetch failure is non-critical
        console.log('Analytics fetch failed, continuing...');
      }

    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to fetch data. This may be due to API rate limits or cold start. Please try again in a few seconds.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchDashboardData]);

  const getSentimentColor = (score: number) => {
    if (score >= 75) return 'text-green-600 bg-green-50 border-green-500';
    if (score >= 60) return 'text-green-500 bg-green-50 border-green-400';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-500';
    if (score >= 25) return 'text-orange-600 bg-orange-50 border-orange-500';
    return 'text-red-600 bg-red-50 border-red-500';
  };

  const getSentimentIcon = (score: number) => {
    if (score >= 60) return <TrendingUp className="w-5 h-5" />;
    if (score >= 40) return <Activity className="w-5 h-5" />;
    return <TrendingDown className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Professional Header */}
      <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-lg border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-10 h-10 text-blue-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Professional Market Intelligence</h1>
                <p className="text-sm text-slate-300">Advanced Crypto Market Analysis & Risk Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-300">Auto-refresh (10s)</span>
              </label>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Token Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Token Symbol or CoinGecko ID
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="bitcoin, ethereum, solana..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchDashboardData}
                disabled={loading}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-5 h-5 inline mr-2" />
              Market Overview
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LineChart className="w-5 h-5 inline mr-2" />
              Technical Analysis
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'news'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Newspaper className="w-5 h-5 inline mr-2" />
              Market News
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'portfolio'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-5 h-5 inline mr-2" />
              Portfolio
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'alerts'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="w-5 h-5 inline mr-2" />
              Price Alerts
            </button>
            <button
              onClick={() => setActiveTab('risk')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'risk'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-5 h-5 inline mr-2" />
              Risk Tools
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && sentimentData && (
          <div className="space-y-6">
            {/* Sentiment Overview */}
            <div className={`bg-white rounded-lg shadow-lg p-6 border-l-4 ${getSentimentColor(sentimentData.sentiment.score)}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getSentimentIcon(sentimentData.sentiment.score)}
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Market Sentiment Analysis</h2>
                    <p className="text-sm text-slate-600">Token: {sentimentData.token}</p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-full font-bold text-lg ${getSentimentColor(sentimentData.sentiment.score)}`}>
                  {sentimentData.sentiment.score}/100
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-600 mb-1">Sentiment Label</p>
                  <p className="text-lg font-semibold text-slate-900">{sentimentData.sentiment.label}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-600 mb-1">Fear & Greed</p>
                  <p className="text-lg font-semibold text-slate-900">{sentimentData.sentiment.fearGreedIndex}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-600 mb-1">Market Momentum</p>
                  <p className="text-lg font-semibold text-slate-900">{sentimentData.sentiment.marketMomentum}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-600 mb-1">Social Sentiment</p>
                  <p className="text-lg font-semibold text-slate-900">{sentimentData.sentiment.socialSentiment}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-700 leading-relaxed">{sentimentData.analysis}</p>
              </div>
            </div>

            {/* Market Signals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bullish Signals */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Bullish Signals</h3>
                </div>
                <ul className="space-y-2">
                  {sentimentData.indicators.bullishSignals.length > 0 ? (
                    sentimentData.indicators.bullishSignals.map((signal, idx) => (
                      <li key={idx} className="flex items-start text-sm text-slate-700">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>{signal}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">No bullish signals detected</li>
                  )}
                </ul>
              </div>

              {/* Bearish Signals */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Bearish Signals</h3>
                </div>
                <ul className="space-y-2">
                  {sentimentData.indicators.bearishSignals.length > 0 ? (
                    sentimentData.indicators.bearishSignals.map((signal, idx) => (
                      <li key={idx} className="flex items-start text-sm text-slate-700">
                        <span className="text-red-500 mr-2">✗</span>
                        <span>{signal}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">No bearish signals detected</li>
                  )}
                </ul>
              </div>

              {/* Neutral Factors */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-slate-600" />
                  <h3 className="text-lg font-semibold text-slate-900">Neutral Factors</h3>
                </div>
                <ul className="space-y-2">
                  {sentimentData.indicators.neutralFactors.length > 0 ? (
                    sentimentData.indicators.neutralFactors.map((factor, idx) => (
                      <li key={idx} className="flex items-start text-sm text-slate-700">
                        <span className="text-slate-400 mr-2">•</span>
                        <span>{factor}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-slate-500">No neutral factors</li>
                  )}
                </ul>
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg shadow-md p-6 border border-blue-200">
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Professional Recommendation</h3>
                  <p className="text-slate-700">{sentimentData.recommendation}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analyticsData && (
          <div className="space-y-6">
            {/* Price Data */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Price Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-600 mb-1">Current Price</p>
                  <p className="text-xl font-bold text-slate-900">${analyticsData.priceData.current.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-600 mb-1">24h High</p>
                  <p className="text-xl font-bold text-green-600">${analyticsData.priceData.high24h.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-600 mb-1">24h Low</p>
                  <p className="text-xl font-bold text-red-600">${analyticsData.priceData.low24h.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-600 mb-1">24h Volume</p>
                  <p className="text-xl font-bold text-slate-900">${(analyticsData.priceData.volume24h / 1e9).toFixed(2)}B</p>
                </div>
              </div>
            </div>

            {/* Technical Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* RSI */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">RSI Indicator</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">RSI Value</span>
                    <span className="text-2xl font-bold text-slate-900">{analyticsData.indicators.rsi.value}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Signal</span>
                    <span className={`font-semibold ${
                      analyticsData.indicators.rsi.signal === 'Overbought' ? 'text-red-600' :
                      analyticsData.indicators.rsi.signal === 'Oversold' ? 'text-green-600' :
                      'text-slate-600'
                    }`}>{analyticsData.indicators.rsi.signal}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        analyticsData.indicators.rsi.value > 70 ? 'bg-red-500' :
                        analyticsData.indicators.rsi.value < 30 ? 'bg-green-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${analyticsData.indicators.rsi.value}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* MACD */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">MACD</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">MACD</span>
                    <span className="font-semibold text-slate-900">{analyticsData.indicators.macd.macd}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Signal</span>
                    <span className="font-semibold text-slate-900">{analyticsData.indicators.macd.signal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Histogram</span>
                    <span className="font-semibold text-slate-900">{analyticsData.indicators.macd.histogram}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Trend</span>
                    <span className={`font-semibold ${
                      analyticsData.indicators.macd.trend === 'Bullish' ? 'text-green-600' : 'text-red-600'
                    }`}>{analyticsData.indicators.macd.trend}</span>
                  </div>
                </div>
              </div>

              {/* Moving Averages */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Moving Averages</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">SMA 5</span>
                    <span className="font-semibold text-slate-900">${analyticsData.indicators.movingAverages.sma5}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">SMA 20</span>
                    <span className="font-semibold text-slate-900">${analyticsData.indicators.movingAverages.sma20}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">SMA 50</span>
                    <span className="font-semibold text-slate-900">${analyticsData.indicators.movingAverages.sma50}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">SMA 200</span>
                    <span className="font-semibold text-slate-900">${analyticsData.indicators.movingAverages.sma200}</span>
                  </div>
                </div>
              </div>

              {/* Support & Resistance */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Support & Resistance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Resistance 2</span>
                    <span className="font-semibold text-red-600">${analyticsData.indicators.supportResistance.resistance2}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-500">Resistance 1</span>
                    <span className="font-semibold text-red-500">${analyticsData.indicators.supportResistance.resistance1}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Pivot Point</span>
                    <span className="font-semibold text-slate-900">${analyticsData.indicators.supportResistance.pivotPoint}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-500">Support 1</span>
                    <span className="font-semibold text-green-500">${analyticsData.indicators.supportResistance.support1}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Support 2</span>
                    <span className="font-semibold text-green-600">${analyticsData.indicators.supportResistance.support2}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Latest Crypto News</h3>
              <div className="space-y-4">
                {newsData.map((news) => (
                  <div key={news.id} className="border-b border-slate-200 pb-4 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-base font-semibold text-slate-900 flex-1">{news.title}</h4>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        news.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                        news.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {news.sentiment}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{news.summary}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{news.source}</span>
                      <span>{new Date(news.publishedAt).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <PortfolioTab />
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <AlertsTab />
          </div>
        )}

        {/* Risk Tab */}
        {activeTab === 'risk' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <RiskTab />
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-600">
          <p>Professional Market Intelligence Platform</p>
          <p className="mt-1">Advanced Analytics & Risk Management Tools</p>
        </div>
      </main>
    </div>
  );
}

export default App;
