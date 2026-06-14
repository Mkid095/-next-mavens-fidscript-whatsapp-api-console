import React, { useState, useRef } from 'react';
import { X, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { contactsApi } from '../../../services/api';

interface ImportContactsModalProps {
  onClose: () => void;
  onContactsImported: (newContacts: { id: string; phone: string; name: string; created_at: string }[]) => void;
}

export default function ImportContactsModal({ onClose, onContactsImported }: ImportContactsModalProps) {
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseContacts = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    return lines.map((line, i) => {
      const parts = line.split(/[,\t;]/);
      const phone = parts[0]?.trim() || '';
      const name = parts[1]?.trim() || `Contact ${i + 1}`;
      return { phone, name };
    }).filter(c => c.phone.length >= 8);
  };

  const downloadTemplate = () => {
    const csv = "phone,name\n254712345678,John Doe\n254798765432,Jane Smith\n254700111222,Bob Alice";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contacts_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseContacts(text);
      if (parsed.length > 0) {
        setImporting(true);
        const res = await contactsApi.importBatch(parsed);
        if (res.success) {
          const newContacts = parsed.map((c, i) => ({
            id: `contact-${Date.now()}-${i}`,
            phone: c.phone,
            name: c.name,
            created_at: new Date().toISOString(),
          }));
          onContactsImported(newContacts);
          onClose();
        }
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleTextImport = async () => {
    if (!importText.trim()) return;
    const parsed = parseContacts(importText);
    if (parsed.length > 0) {
      setImporting(true);
      const res = await contactsApi.importBatch(parsed);
      if (res.success) {
        const newContacts = parsed.map((c, i) => ({
          id: `contact-${Date.now()}-${i}`,
          phone: c.phone,
          name: c.name,
          created_at: new Date().toISOString(),
        }));
        onContactsImported(newContacts);
        setImportText('');
        onClose();
      }
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white border border-[#eaebe4] text-forest-deep rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <h4 className="font-bold text-sm">Import Contacts</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-black"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-3">
          <p className="text-[11px] text-graphite">
            Upload a CSV file or paste phone numbers. Format:{' '}
            <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">phone,name</code> (one per line).
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            className="w-full text-xs border border-[#eaebe4] rounded-xl p-2"
          />
          <button
            onClick={downloadTemplate}
            className="w-full flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-600 py-2 rounded-xl text-xs font-bold border border-stone-200 transition-all"
          >
            <Download className="w-3.5 h-3.5" /> Download CSV Template
          </button>
          <div className="text-center text-[10px] text-stone-400 font-semibold">OR</div>
          <textarea
            rows={5}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="254712345678, John Doe&#10;254798765432, Jane Smith"
            className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl focus:outline-none text-xs font-mono resize-none"
          />
          <button
            onClick={handleTextImport}
            disabled={!importText.trim() || importing}
            className="w-full bg-forest-deep hover:bg-[#33301a] text-white py-2.5 rounded-xl text-xs font-bold disabled:opacity-40"
          >
            {importing ? 'Importing...' : 'Import from Text'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
