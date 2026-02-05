
import React, { useState } from 'react';
import { DocumentType, DocumentAlert } from '../types';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (alert: DocumentAlert) => void;
  initialNumber?: string;
  initialType?: DocumentType | 'All';
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialNumber = '',
  initialType = 'All'
}) => {
  const [docNumber, setDocNumber] = useState(initialNumber);
  const [docType, setDocType] = useState<DocumentType | 'All'>(initialType);
  const [label, setLabel] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNumber) return;

    const newAlert: DocumentAlert = {
      id: crypto.randomUUID(),
      documentNumber: docNumber.trim(),
      type: docType,
      label: label.trim() || `Alert for ${docNumber}`,
      createdAt: Date.now(),
      isMatched: false
    };

    onSave(newAlert);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="bg-red-600 p-8 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-white/60 hover:text-white">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
          <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <i className="fa-solid fa-bell-concierge text-3xl"></i>
          </div>
          <h2 className="text-2xl font-black">Set Up Alert</h2>
          <p className="text-red-100 text-sm mt-1">Get notified immediately when your document is reported.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Document Number</label>
            <input 
              type="text" 
              required
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="e.g. 34567890"
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-red-500 outline-none transition-all font-bold"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Document Category</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType | 'All')}
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-red-500 outline-none transition-all font-bold"
            >
              <option value="All">Any Category</option>
              {Object.values(DocumentType).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Alert Label (Optional)</label>
            <input 
              type="text" 
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My ID, Mom's Passport"
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-red-500 outline-none transition-all font-bold"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-100 transition-all flex flex-col items-center justify-center"
          >
            <div className="flex items-center space-x-2">
              <i className="fa-solid fa-lock"></i>
              <span>Pay & Create Alert</span>
            </div>
            <span className="text-[10px] opacity-70 mt-1 font-bold">KES 100.00 SERVICE FEE</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AlertModal;
