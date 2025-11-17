import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

const SUPABASE_URL = 'https://bpbtgkunrdzcoyfdhskh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwYnRna3VucmR6Y295ZmRoc2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MjAzNzUsImV4cCI6MjA3ODQ5NjM3NX0.ZAtjUoDnIWUOs6Os1NUGKIRUQVOuXDlaCJ4HwQqZu50';

interface Position {
  id: string;
  token_symbol: string;
  amount: number;
  avg_price: number;
  current_price?: number;
  total_value?: number;
  profit_loss?: number;
  profit_loss_percentage?: number;
}

interface NewPosition {
  token_symbol: string;
  amount: string;
  avg_price: string;
}

export default function PortfolioTab() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPosition, setNewPosition] = useState<NewPosition>({
    token_symbol: '',
    amount: '',
    avg_price: ''
  });

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/portfolio`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPositions(data.positions || []);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPosition = async () => {
    if (!newPosition.token_symbol || !newPosition.amount || !newPosition.avg_price) {
      alert('Mohon isi semua field');
      return;
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/portfolio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token_symbol: newPosition.token_symbol.toUpperCase(),
          amount: parseFloat(newPosition.amount),
          avg_price: parseFloat(newPosition.avg_price)
        })
      });

      if (response.ok) {
        setNewPosition({ token_symbol: '', amount: '', avg_price: '' });
        setShowAddForm(false);
        fetchPositions();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error?.message || 'Gagal menambahkan posisi'}`);
      }
    } catch (error) {
      console.error('Error adding position:', error);
      alert('Gagal menambahkan posisi');
    }
  };

  const deletePosition = async (id: string) => {
    if (!confirm('Yakin ingin menghapus posisi ini?')) return;

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/portfolio`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ position_id: id })
      });

      if (response.ok) {
        fetchPositions();
      } else {
        alert('Gagal menghapus posisi');
      }
    } catch (error) {
      console.error('Error deleting position:', error);
      alert('Gagal menghapus posisi');
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const totalValue = positions.reduce((sum, pos) => sum + (pos.total_value || 0), 0);
  const totalProfitLoss = positions.reduce((sum, pos) => sum + (pos.profit_loss || 0), 0);
  const totalProfitLossPercentage = positions.length > 0
    ? (totalProfitLoss / (totalValue - totalProfitLoss)) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <DollarSign className="w-5 h-5" />
            <span className="text-sm font-medium">Total Nilai Portfolio</span>
          </div>
          <div className="text-2xl font-bold text-white">
            ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className={`bg-slate-800/50 rounded-lg p-6 border ${
          totalProfitLoss >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'
        }`}>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            {totalProfitLoss >= 0 ? (
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
            <span className="text-sm font-medium">Total P/L</span>
          </div>
          <div className={`text-2xl font-bold ${
            totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className={`bg-slate-800/50 rounded-lg p-6 border ${
          totalProfitLossPercentage >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'
        }`}>
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">ROI</span>
          </div>
          <div className={`text-2xl font-bold ${
            totalProfitLossPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {totalProfitLossPercentage >= 0 ? '+' : ''}{totalProfitLossPercentage.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Posisi Portfolio</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchPositions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Posisi
          </button>
        </div>
      </div>

      {/* Add Position Form */}
      {showAddForm && (
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Tambah Posisi Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Token Symbol
              </label>
              <input
                type="text"
                placeholder="BTC, ETH, SOL..."
                value={newPosition.token_symbol}
                onChange={(e) => setNewPosition({ ...newPosition, token_symbol: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Jumlah
              </label>
              <input
                type="number"
                step="0.00000001"
                placeholder="0.00"
                value={newPosition.amount}
                onChange={(e) => setNewPosition({ ...newPosition, amount: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Harga Rata-rata
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newPosition.avg_price}
                onChange={(e) => setNewPosition({ ...newPosition, avg_price: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={addPosition}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Simpan
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewPosition({ token_symbol: '', amount: '', avg_price: '' });
              }}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Positions Table */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Jumlah
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Harga Avg
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Harga Saat Ini
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Nilai Total
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  P/L
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  P/L %
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              ) : positions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    Belum ada posisi. Klik "Tambah Posisi" untuk memulai.
                  </td>
                </tr>
              ) : (
                positions.map((position) => (
                  <tr key={position.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{position.token_symbol}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-300">
                      {position.amount.toLocaleString('en-US', { maximumFractionDigits: 8 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-300">
                      ${position.avg_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-slate-300">
                      ${(position.current_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-white font-medium">
                      ${(position.total_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${
                      (position.profit_loss || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {(position.profit_loss || 0) >= 0 ? '+' : ''}{(position.profit_loss || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${
                      (position.profit_loss_percentage || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {(position.profit_loss_percentage || 0) >= 0 ? '+' : ''}{(position.profit_loss_percentage || 0).toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => deletePosition(position.id)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
