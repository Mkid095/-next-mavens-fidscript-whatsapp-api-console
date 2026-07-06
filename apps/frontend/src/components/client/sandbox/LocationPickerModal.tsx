import { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LocationPickerModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (lat: string, lng: string) => void;
}

export default function LocationPickerModal({ open, onClose, onApply }: LocationPickerModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#1a1915] border border-[#2d2813] text-[#cbd3cf] rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#181711]">
              <h4 className="font-bold text-sm">Pick Location</h4>
              <button onClick={onClose} className="text-[#5a554a] hover:text-[#cbd3cf]"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[10px] text-[#a8a99e]">Enter coordinates manually or use Google Maps to find them.</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-[#a8a99e] uppercase mb-1">Latitude</label>
                <input id="lat-input" type="text" placeholder="-1.286389" className="w-full px-3 py-2 border border-[#2d2813] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500 bg-[#181711] text-[#a8a99e]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#a8a99e] uppercase mb-1">Longitude</label>
                <input id="lng-input" type="text" placeholder="36.817223" className="w-full px-3 py-2 border border-[#2d2813] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500 bg-[#181711] text-[#a8a99e]" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => {
                const lat = (document.getElementById('lat-input') as HTMLInputElement).value;
                const lng = (document.getElementById('lng-input') as HTMLInputElement).value;
                if (lat && lng) {
                  onApply(lat, lng);
                  onClose();
                }
              }} className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-[#181711] font-bold text-xs rounded-xl">Apply</button>
              <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-2 border border-[#2d2813] text-[#6e684a] text-xs font-bold rounded-xl hover:bg-[#2d2813]">
                <MapPin className="w-3.5 h-3.5" /> Google Maps
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
