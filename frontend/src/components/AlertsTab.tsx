import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Bell, BellOff, TrendingUp, TrendingDown } from 'lucide-react';

const SUPABASE_URL = 'https://bpbtgkunrdzcoyfdhskh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwYnRna3VucmR6Y295ZmRoc2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MjAzNzUsImV4cCI6MjA3ODQ5NjM3NX0.ZAtjUoDnIWUOs6Os1NUGKIRUQVOuXDlaCJ4HwQqZu50';

interface Alert {
  id: string;
  token_symbol: string;
  alert_type: string;
  threshold_value: number;
  direction: string;
  is_active: boolean;
  created_at: string;
  current_value?: number;
  triggered?: boolean;
}

interface NewAlert {
  token_symbol: string;
  alert_type: string;
  threshold_value: string;
  direction: string;
}

export default function AlertsTab() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAlert, setNewAlert] = useState<NewAlert>({
    token_symbol: '',
    alert_type: 'price',
    threshold_value: '',
    direction: 'above'
  });

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/alerts`, {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAlert = async () => {
    if (!newAlert.token_symbol || !newAlert.threshold_value) {
      alert('Mohon isi semua field');
      return;
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/alerts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token_symbol: newAlert.token_symbol.toUpperCase(),
          alert_type: newAlert.alert_type,
          threshold_value: parseFloat(newAlert.threshold_value),
          direction: newAlert.direction
        })
      });

      if (response.ok) {
        setNewAlert({ token_symbol: '', alert_type: 'price', threshold_value: '', direction: 'above' });
        setShowAddForm(false);
        fetchAlerts();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error?.message || 'Gagal menambahkan alert'}`);
      }
    } catch (error) {
      console.error('Error adding alert:', error);
      alert('Gagal menambahkan alert');
    }
  };

  const toggleAlert = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/alerts`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alert_id: id,
          is_active: !currentStatus
        })
      });

      if (response.ok) {
        fetchAlerts();
      } else {
        alert('Gagal mengubah status alert');
      }
    } catch (error) {
      console.error('Error toggling alert:', error);
      alert('Gagal mengubah status alert');
    }
  };

  const deleteAlert = async (id: string) => {
    if (!confirm('Yakin ingin menghapus alert ini?')) return;

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/alerts`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ alert_id: id })
      });

      if (response.ok) {
        fetchAlerts();
      } else {
        alert('Gagal menghapus alert');
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      alert('Gagal menghapus alert');
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const activeAlerts = alerts.filter(a => a.is_active).length;
  const triggeredAlerts = alerts.filter(a => a.triggered).length;

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Bell className="w-5 h-5" />
            <span className="text-sm font-medium">Total Alerts</span>
          </div>
          <div className="text-2xl font-bold text-white">{alerts.length}</div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-6 border border-emerald-500/30">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium">Alert Aktif</span>
          </div>
          <div className="text-2xl font-bold text-emerald-400">{activeAlerts}</div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-6 border border-yellow-500/30">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Bell className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-medium">Alert Terpicu</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">{triggeredAlerts}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Daftar Price Alerts</h2>
        <div className="flex gap-2">
          <button
            onClick={fetchAlerts}
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
            Buat Alert
          </button>
        </div>
      </div>

      {/* Add Alert Form */}
      {showAddForm && (
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Buat Alert Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Token Symbol
              </label>
              <input
                type="text"
                placeholder="BTC, ETH, SOL..."
                value={newAlert.token_symbol}
                onChange={(e) => setNewAlert({ ...newAlert, token_symbol: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tipe Alert
              </label>
              <select
                value={newAlert.alert_type}
                onChange={(e) => setNewAlert({ ...newAlert, alert_type: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="price">Price</option>
                <option value="volume">Volume</option>
                <option value="percentage">Percentage Change</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nilai Threshold
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newAlert.threshold_value}
                onChange={(e) => setNewAlert({ ...newAlert, threshold_value: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Arah
              </label>
              <select
                value={newAlert.direction}
                onChange={(e) => setNewAlert({ ...newAlert, direction: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="above">Di Atas</option>
                <option value="below">Di Bawah</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={addAlert}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Simpan
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewAlert({ token_symbol: '', alert_type: 'price', threshold_value: '', direction: 'above' });
              }}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700 text-center text-slate-400">
            Loading...
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-slate-800/50 rounded-lg p-8 border border-slate-700 text-center text-slate-400">
            Belum ada alert. Klik "Buat Alert" untuk memulai.
          </div>
        ) : (
          alerts.map((alertItem) => (
            <div
              key={alertItem.id}
              className={`bg-slate-800/50 rounded-lg p-6 border transition-all ${
                alertItem.triggered
                  ? 'border-yellow-500/50 bg-yellow-500/5'
                  : alertItem.is_active
                  ? 'border-emerald-500/30'
                  : 'border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${
                    alertItem.triggered
                      ? 'bg-yellow-500/20'
                      : alertItem.is_active
                      ? 'bg-emerald-500/20'
                      : 'bg-slate-700/50'
                  }`}>
                    {alertItem.direction === 'above' ? (
                      <TrendingUp className={`w-6 h-6 ${
                        alertItem.triggered ? 'text-yellow-400' : 'text-emerald-400'
                      }`} />
                    ) : (
                      <TrendingDown className={`w-6 h-6 ${
                        alertItem.triggered ? 'text-yellow-400' : 'text-red-400'
                      }`} />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">
                        {alertItem.token_symbol}
                      </h3>
                      {alertItem.triggered && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded">
                          TERPICU
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      {alertItem.alert_type === 'price' && 'Harga'}
                      {alertItem.alert_type === 'volume' && 'Volume'}
                      {alertItem.alert_type === 'percentage' && 'Perubahan Persentase'}
                      {' '}
                      {alertItem.direction === 'above' ? 'di atas' : 'di bawah'}
                      {' '}
                      <span className="font-semibold text-white">
                        {alertItem.alert_type === 'percentage' 
                          ? `${alertItem.threshold_value}%`
                          : `$${alertItem.threshold_value.toLocaleString()}`
                        }
                      </span>
                    </p>
                    {alertItem.current_value !== undefined && (
                      <p className="text-sm text-slate-500 mt-1">
                        Nilai saat ini:{' '}
                        <span className="text-slate-300">
                          {alertItem.alert_type === 'percentage' 
                            ? `${alertItem.current_value}%`
                            : `$${alertItem.current_value.toLocaleString()}`
                          }
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAlert(alertItem.id, alertItem.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      alertItem.is_active
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                    title={alertItem.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {alertItem.is_active ? (
                      <Bell className="w-5 h-5" />
                    ) : (
                      <BellOff className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteAlert(alertItem.id)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
