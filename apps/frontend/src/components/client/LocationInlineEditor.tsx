import React, { useState } from 'react';
import { MapPin, Navigation, SendHorizontal, RefreshCw, X } from 'lucide-react';
import type { Instance } from '../../services/api';
import { instancesApi } from '../../services/api';
import { TOKEN_COST } from '../../utils/tokenCosts';

interface LocationInlineEditorProps {
  instance: Instance;
  to: string;
  onSend: (tokenCost: number) => void;
  onCancel: () => void;
}

export default function LocationInlineEditor({ instance, to, onSend, onCancel }: LocationInlineEditorProps) {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6)); },
      () => setError('Could not get location')
    );
  };

  const handleSend = async () => {
    const la = parseFloat(lat);
    const ln = parseFloat(lng);
    if (!la || !ln) { setError('Valid latitude and longitude required'); return; }
    setSending(true); setError('');
    try {
      const res = await instancesApi.sendLocation(instance.name, to, la, ln, name.trim());
      if (res.success) { onSend(TOKEN_COST.LOCATION); onCancel(); }
      else { setError(res.error || 'Failed to send'); }
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to send'); }
    finally { setSending(false); }
  };

  return (
    <div className="border-t border-[#eaebe4] bg-white p-3">
      <div className="flex items-start gap-2">
        <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={handleCurrentLocation}
              className="flex-1 py-2 border border-[#eaebe4] rounded-xl text-xs font-bold text-forest-deep hover:bg-stone-50 transition-all flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5" /> Use Current Location
            </button>
            <button onClick={onCancel} className="px-3 py-2 text-stone-400 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <input type="number" value={lat} onChange={e => setLat(e.target.value)} placeholder="Latitude"
              step="any" className="flex-1 px-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 font-mono" />
            <input type="number" value={lng} onChange={e => setLng(e.target.value)} placeholder="Longitude"
              step="any" className="flex-1 px-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 font-mono" />
          </div>

          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Location name (optional)"
            className="w-full px-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500" />

          {error && <p className="text-[10px] text-red-500">{error}</p>}

          <button
            onClick={handleSend}
            disabled={!lat || !lng || sending}
            className="w-full py-2 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
          >
            {sending ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...</> : <><MapPin className="w-3.5 h-3.5" /> Send Location</>}
          </button>
        </div>
      </div>
    </div>
  );
}
