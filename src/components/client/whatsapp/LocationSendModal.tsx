import React, { useState } from 'react';
import { X, MapPin, SendHorizontal, RefreshCw, Navigation } from 'lucide-react';
import { motion } from 'motion/react';
import type { Instance } from '../../../services/api';
import { instancesApi } from '../../../services/api';
import { TOKEN_COST } from '../../../utils/tokenCosts';

interface LocationSendModalProps {
  instance: Instance;
  to: string;
  onClose: () => void;
  onSend: (tokenCost: number) => void;
}

export default function LocationSendModal({ instance, to, onClose, onSend }: LocationSendModalProps) {
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
      },
      () => setError('Could not get your location. Please enter manually.')
    );
  };

  const handleSend = async () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!latitude || !lat || !longitude || !lng) {
      setError('Valid latitude and longitude are required');
      return;
    }
    setSending(true);
    setError('');
    try {
      const res = await instancesApi.sendLocation(instance.name, to, lat, lng, name.trim(), address.trim());
      if (res.success) {
        onSend(TOKEN_COST.LOCATION);
        onClose();
      } else {
        setError(res.error || 'Failed to send location');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send location');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-md mx-4 overflow-hidden shadow-2xl"
      >
        <div className="px-5 py-4 border-b border-[#eaebe4] flex items-center justify-between bg-[#fafaf5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-forest-deep">Send Location</h3>
              <p className="text-[10px] text-stone-500 font-mono">{to}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-stone-200 flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <button
            onClick={handleUseCurrentLocation}
            className="w-full py-2.5 border border-[#eaebe4] rounded-xl text-xs font-bold text-forest-deep hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
          >
            <Navigation className="w-3.5 h-3.5" />
            Use Current Location
          </button>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Latitude</label>
              <input
                type="number"
                value={latitude}
                onChange={e => setLatitude(e.target.value)}
                placeholder="-1.286389"
                step="any"
                className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 font-mono"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Longitude</label>
              <input
                type="number"
                value={longitude}
                onChange={e => setLongitude(e.target.value)}
                placeholder="36.817223"
                step="any"
                className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nairobi CBD"
              className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Address (optional)</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Kenyatta Avenue"
              className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
            />
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-600">{error}</div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-stone-400">{TOKEN_COST.LOCATION} token</span>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#eaebe4] flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#eaebe4] rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!latitude || !longitude || sending}
            className="flex-1 py-2.5 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <SendHorizontal className="w-3.5 h-3.5" />}
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
