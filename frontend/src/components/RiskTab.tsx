import { useState } from 'react';
import { Shield, Calculator, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

const SUPABASE_URL = 'https://bpbtgkunrdzcoyfdhskh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwYnRna3VucmR6Y295ZmRoc2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MjAzNzUsImV4cCI6MjA3ODQ5NjM3NX0.ZAtjUoDnIWUOs6Os1NUGKIRUQVOuXDlaCJ4HwQqZu50';

interface PositionSizingInput {
  account_balance: string;
  risk_percentage: string;
  entry_price: string;
  stop_loss: string;
}

interface RiskRewardInput {
  entry_price: string;
  stop_loss: string;
  take_profit: string;
  position_size: string;
}

export default function RiskTab() {
  const [activeCalculator, setActiveCalculator] = useState<'position' | 'riskreward'>('position');
  
  // Position Sizing Calculator
  const [positionInput, setPositionInput] = useState<PositionSizingInput>({
    account_balance: '',
    risk_percentage: '2',
    entry_price: '',
    stop_loss: ''
  });
  const [positionResult, setPositionResult] = useState<any>(null);
  const [positionLoading, setPositionLoading] = useState(false);

  // Risk/Reward Calculator
  const [rrInput, setRRInput] = useState<RiskRewardInput>({
    entry_price: '',
    stop_loss: '',
    take_profit: '',
    position_size: ''
  });
  const [rrResult, setRRResult] = useState<any>(null);
  const [rrLoading, setRRLoading] = useState(false);

  const calculatePositionSize = async () => {
    if (!positionInput.account_balance || !positionInput.risk_percentage || 
        !positionInput.entry_price || !positionInput.stop_loss) {
      alert('Mohon isi semua field');
      return;
    }

    setPositionLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/risk?action=position-sizing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accountSize: parseFloat(positionInput.account_balance),
          riskPercentage: parseFloat(positionInput.risk_percentage),
          entryPrice: parseFloat(positionInput.entry_price),
          stopLoss: parseFloat(positionInput.stop_loss)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPositionResult(data.data);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error?.message || 'Gagal menghitung'}`);
      }
    } catch (error) {
      console.error('Error calculating position size:', error);
      alert('Gagal menghitung position size');
    } finally {
      setPositionLoading(false);
    }
  };

  const calculateRiskReward = async () => {
    if (!rrInput.entry_price || !rrInput.stop_loss || !rrInput.take_profit || !rrInput.position_size) {
      alert('Mohon isi semua field');
      return;
    }

    setRRLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/risk?action=risk-reward`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entryPrice: parseFloat(rrInput.entry_price),
          stopLoss: parseFloat(rrInput.stop_loss),
          takeProfit: parseFloat(rrInput.take_profit),
          positionSize: parseFloat(rrInput.position_size)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRRResult(data.data);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error?.message || 'Gagal menghitung'}`);
      }
    } catch (error) {
      console.error('Error calculating risk/reward:', error);
      alert('Gagal menghitung risk/reward');
    } finally {
      setRRLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-500/20 rounded-lg">
          <Shield className="w-8 h-8 text-purple-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Risk Management Tools</h2>
          <p className="text-slate-400">Kelola risiko trading dengan kalkulator profesional</p>
        </div>
      </div>

      {/* Calculator Tabs */}
      <div className="flex gap-2 bg-slate-800/50 p-2 rounded-lg border border-slate-700">
        <button
          onClick={() => setActiveCalculator('position')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            activeCalculator === 'position'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Calculator className="w-5 h-5" />
            Position Sizing
          </div>
        </button>
        <button
          onClick={() => setActiveCalculator('riskreward')}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            activeCalculator === 'riskreward'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Risk/Reward Ratio
          </div>
        </button>
      </div>

      {/* Position Sizing Calculator */}
      {activeCalculator === 'position' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-400" />
              Kalkulator Position Sizing
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Hitung ukuran posisi optimal berdasarkan saldo akun dan toleransi risiko Anda
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Saldo Akun ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="10000"
                  value={positionInput.account_balance}
                  onChange={(e) => setPositionInput({ ...positionInput, account_balance: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Risiko per Trade (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="2"
                  value={positionInput.risk_percentage}
                  onChange={(e) => setPositionInput({ ...positionInput, risk_percentage: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Harga Entry ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="50000"
                  value={positionInput.entry_price}
                  onChange={(e) => setPositionInput({ ...positionInput, entry_price: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Stop Loss ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="48000"
                  value={positionInput.stop_loss}
                  onChange={(e) => setPositionInput({ ...positionInput, stop_loss: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={calculatePositionSize}
              disabled={positionLoading}
              className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {positionLoading ? 'Menghitung...' : 'Hitung Position Size'}
            </button>
          </div>

          {/* Position Sizing Results */}
          {positionResult && (
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg p-6 border border-blue-500/30">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-400" />
                Hasil Perhitungan
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Position Size</div>
                  <div className="text-2xl font-bold text-white">
                    {positionResult.recommendedPositionSize} unit
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Nilai Posisi</div>
                  <div className="text-2xl font-bold text-white">
                    ${parseFloat(positionResult.maxInvestment).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Risiko per Trade</div>
                  <div className="text-2xl font-bold text-red-400">
                    ${parseFloat(positionResult.riskAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Risk per Unit</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    ${parseFloat(positionResult.priceRisk).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {positionResult.recommendation && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-400 mb-2">Rekomendasi</div>
                      <p className="text-sm text-slate-300">{positionResult.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Risk/Reward Calculator */}
      {activeCalculator === 'riskreward' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Kalkulator Risk/Reward Ratio
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Analisis potensi profit vs risiko untuk menentukan kelayakan trade
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Harga Entry ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="50000"
                  value={rrInput.entry_price}
                  onChange={(e) => setRRInput({ ...rrInput, entry_price: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Stop Loss ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="48000"
                  value={rrInput.stop_loss}
                  onChange={(e) => setRRInput({ ...rrInput, stop_loss: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Take Profit ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="56000"
                  value={rrInput.take_profit}
                  onChange={(e) => setRRInput({ ...rrInput, take_profit: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Position Size (unit)
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  placeholder="0.5"
                  value={rrInput.position_size}
                  onChange={(e) => setRRInput({ ...rrInput, position_size: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={calculateRiskReward}
              disabled={rrLoading}
              className="w-full mt-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {rrLoading ? 'Menghitung...' : 'Hitung Risk/Reward'}
            </button>
          </div>

          {/* Risk/Reward Results */}
          {rrResult && (
            <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-lg p-6 border border-emerald-500/30">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Hasil Analisis
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Risk/Reward Ratio</div>
                  <div className={`text-2xl font-bold ${
                    rrResult.risk_reward_ratio >= 2 ? 'text-emerald-400' : 
                    rrResult.risk_reward_ratio >= 1 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    1:{rrResult.risk_reward_ratio?.toFixed(2)}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Potensi Profit</div>
                  <div className="text-2xl font-bold text-emerald-400">
                    ${rrResult.potential_profit?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    +{rrResult.profit_percentage?.toFixed(2)}%
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Potensi Loss</div>
                  <div className="text-2xl font-bold text-red-400">
                    ${rrResult.potential_loss?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    -{rrResult.loss_percentage?.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className={`mt-4 p-4 rounded-lg border ${
                rrResult.is_good_trade 
                  ? 'bg-emerald-500/10 border-emerald-500/30' 
                  : 'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-start gap-2">
                  {rrResult.is_good_trade ? (
                    <TrendingUp className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className={`font-medium mb-2 ${
                      rrResult.is_good_trade ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {rrResult.is_good_trade ? 'Trade Layak' : 'Trade Tidak Disarankan'}
                    </div>
                    <p className="text-sm text-slate-300">
                      {rrResult.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Risk Management Tips */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          Tips Risk Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <div className="w-2 bg-blue-500 rounded-full flex-shrink-0"></div>
            <div>
              <div className="font-medium text-white mb-1">Risiko 1-2% per Trade</div>
              <p className="text-sm text-slate-400">
                Jangan risiko lebih dari 2% modal per trade untuk proteksi modal jangka panjang
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-2 bg-emerald-500 rounded-full flex-shrink-0"></div>
            <div>
              <div className="font-medium text-white mb-1">R/R Minimal 1:2</div>
              <p className="text-sm text-slate-400">
                Target profit minimal 2x lipat dari risiko untuk profitabilitas konsisten
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
            <div>
              <div className="font-medium text-white mb-1">Gunakan Stop Loss</div>
              <p className="text-sm text-slate-400">
                Selalu set stop loss sebelum entry untuk membatasi kerugian maksimal
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-2 bg-purple-500 rounded-full flex-shrink-0"></div>
            <div>
              <div className="font-medium text-white mb-1">Diversifikasi Portfolio</div>
              <p className="text-sm text-slate-400">
                Jangan taruh semua modal di satu aset, spread risiko di berbagai instrumen
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
