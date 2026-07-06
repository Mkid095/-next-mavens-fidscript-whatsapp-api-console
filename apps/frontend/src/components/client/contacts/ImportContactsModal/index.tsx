import React from 'react';
import { motion } from 'motion/react';
import { X, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { useImportModal } from './useImportModal';
import { GoogleSection } from './GoogleSection';
import { ImportStepUpload } from './ImportStepUpload';
import { ImportStepParse } from './ImportStepParse';
import { ImportStepMap } from './ImportStepMap';
import { ImportStepConfirm } from './ImportStepConfirm';

interface ImportContactsModalProps {
  onClose: () => void;
  onContactsImported: (newContacts: { id: string; phone: string; name: string; created_at: string }[]) => void;
  existingPhones?: Set<string>;
}

export default function ImportContactsModal(props: ImportContactsModalProps) {
  const h = useImportModal(props);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-3 sm:space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#2d2813]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2d2813] flex items-center justify-center text-[#eab308] text-xs font-bold">G</div>
            <h4 className="font-bold text-sm text-[#a8a99e]">Import Contacts</h4>
          </div>
          <button onClick={props.onClose} className="text-[#6e684a] hover:text-[#a8a99e]"><X className="w-4 h-4" /></button>
        </div>

        <GoogleSection googleStatus={h.googleStatus} googleLoading={h.googleLoading} googleSyncing={h.googleSyncing}
          googleError={h.googleError} googleResult={h.googleResult} successMsg={h.successMsg}
          onLink={h.handleLinkGoogle} onUnlink={h.handleUnlinkGoogle} onSync={h.handleGoogleSync} />

        {h.step === 'upload' && (
          <>
            <ImportStepUpload importText={h.importText} selectedCountry={h.selectedCountry} detectedCountry={h.detectedCountry}
              showCountryPicker={h.showCountryPicker} duplicateMode={h.duplicateMode} preview={h.preview} fileInputRef={h.fileInputRef}
              onTextChange={h.handleTextChange} onFileChange={h.handleFileChange}
              onCountryToggle={() => h.setShowCountryPicker(v => !v)} onCountryChange={h.handleCountryChange}
              onDuplicateModeChange={h.setDuplicateMode} />
            {h.preview.length > 0 && (
              <button onClick={h.handleGoToMap} className="w-full bg-[#eab308] hover:bg-yellow-400 text-[#181711] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>)}
          </>
        )}

        {h.step === 'map' && (
          <>
            <ImportStepMap sampleLines={h.sampleLines} mapping={h.mapping} onMappingChange={h.handleMappingChange} />
            <div className="flex gap-2">
              <button onClick={() => h.setStep('upload')} className="flex-1 py-2 bg-[#2d2813] hover:bg-[#3d3a1e] text-[#a8a99e] rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button onClick={h.handleGoToConfirm} className="flex-1 bg-[#eab308] hover:bg-yellow-400 text-[#181711] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                Review <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}

        {h.step === 'confirm' && (
          <>
            <ImportStepConfirm preview={h.preview} importing={h.importing} importProgress={h.importProgress}
              error={h.error} successMsg={h.successMsg} onImport={h.handleImport} />
            <button onClick={() => h.setStep('map')} className="w-full py-2 bg-[#2d2813] hover:bg-[#3d3a1e] text-[#a8a99e] rounded-xl text-xs font-bold flex items-center justify-center gap-2">
              <ChevronLeft className="w-3.5 h-3.5" /> Edit Mapping
            </button>
          </>
        )}

        {h.error && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-900/30 rounded-xl text-[11px] text-red-400 border border-red-900/50">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />{h.error}
          </div>
        )}
      </motion.div>
    </div>
  );
}
