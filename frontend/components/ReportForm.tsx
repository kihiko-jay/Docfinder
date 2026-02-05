
import React, { useEffect, useRef, useState } from 'react';
import { extractDocumentDetails } from '../services/gemini';
import { DocumentType, LostDocument, PrivacyPreferences } from '../types';
import LocationPicker from './LocationPicker';
import { uploadDocumentImage } from '../src/services/storage';
import { createDocument } from '../src/services/functions';
import { ensureAnonymousAuth } from '../src/services/auth';

interface ReportFormProps {
  onSuccess: (doc: LostDocument) => void;
  onCancel: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ onSuccess, onCancel }) => {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: Upload/Preview, 2: Review/Privacy, 3: Contact Info
  const [isConfirming, setIsConfirming] = useState(false);

  const [extractedData, setExtractedData] = useState<{
    name: string;
    type: DocumentType;
    documentNumber: string;
  } | null>(null);

  const [privacy, setPrivacy] = useState<PrivacyPreferences>({
    numberDisplay: 'partial',
    imageDisplay: 'blurred'
  });

  const [finderInfo, setFinderInfo] = useState({
    name: '',
    phone: '',
    location: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined
  });

  // Load previously used contact info from local storage
  useEffect(() => {
    const savedFinder = localStorage.getItem('last_finder_info');
    if (savedFinder) {
      try {
        const parsed = JSON.parse(savedFinder);
        setFinderInfo(prev => ({
          ...prev,
          name: parsed.name || '',
          phone: parsed.phone || ''
        }));
      } catch (e) {
        console.error("Failed to load saved finder info");
      }
    }
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      setIsConfirming(true);
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmExtraction = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setIsConfirming(false);

    try {
      const details = await extractDocumentDetails(image);
      if (details) {
        setExtractedData(details);
        setStep(2);
      } else {
        setError("We couldn't read the document clearly. Please try a clearer photo.");
        setIsConfirming(true);
      }
    } catch (err) {
      setError("Failed to process image. Please try again.");
      setIsConfirming(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setImage(null);
    setImageFile(null);
    setIsConfirming(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLocationSelected = (lat: number, lng: number, address: string) => {
    setFinderInfo(prev => ({
      ...prev,
      lat,
      lng,
      location: address
    }));
  };

  const handleSubmit = async () => {
    if (
      !extractedData ||
      !finderInfo.name ||
      !finderInfo.phone ||
      !finderInfo.location
    ) {
      setError("Please fill in your name, phone, and pick a location on the map.");
      return;
    }
    if (!imageFile) {
      setError("Please upload a document photo.");
      return;
    }
    setError(null);
    setLoading(true);

    // Save common info for next time
    localStorage.setItem('last_finder_info', JSON.stringify({
      name: finderInfo.name,
      phone: finderInfo.phone
    }));

    try {
      await ensureAnonymousAuth();
      const docId = crypto.randomUUID();
      const imageUrl = await uploadDocumentImage(imageFile, docId);

      const newDoc: LostDocument = {
        id: docId,
        name: extractedData.name,
        type: extractedData.type,
        documentNumber: extractedData.documentNumber,
        finderName: finderInfo.name,
        finderPhone: finderInfo.phone,
        locationFound: finderInfo.location,
        lat: finderInfo.lat,
        lng: finderInfo.lng,
        imageUrl,
        createdAt: Date.now(),
        privacy: privacy
      };

      await createDocument(newDoc);
      onSuccess({
        ...newDoc,
        finderPhone: undefined
      });
    } catch (submitError) {
      console.error("Failed to submit report", submitError);
      setError("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const docTypes = Object.values(DocumentType);

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-100 relative">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Report Found Document</h2>
        <p className="text-gray-500 mt-2">Help someone recover their identity. Accurate locations matter.</p>
      </div>

      {step === 1 && (
        <div className="space-y-6">
          {!image && !loading ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-red-500 hover:bg-red-50 cursor-pointer transition-all group"
            >
              <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-red-100 transition-colors">
                <i className="fa-solid fa-camera text-2xl text-gray-400 group-hover:text-red-600"></i>
              </div>
              <p className="text-lg font-bold text-gray-900">Snap or Upload Photo</p>
              <p className="text-sm text-gray-500 mt-1">AI will extract the owner's name automatically.</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>
          ) : null}

          {image && isConfirming && !loading && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <div className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200 mb-6 bg-gray-50 flex items-center justify-center min-h-[300px]">
                <img src={image} alt="Document Preview" className="max-h-[500px] object-contain" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm">
                  Preview
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleRetake}
                  className="px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                >
                  <i className="fa-solid fa-rotate-left"></i>
                  <span>Retake</span>
                </button>
                <button 
                  onClick={handleConfirmExtraction}
                  className="px-6 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center justify-center space-x-2"
                >
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  <span>Scan Document</span>
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="border-2 border-red-100 bg-red-50 rounded-xl p-16 text-center animate-pulse">
              <div className="flex flex-col items-center">
                <div className="relative h-20 w-20 mb-6">
                  <div className="absolute inset-0 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                  <i className="fa-solid fa-robot text-3xl text-red-600 absolute inset-0 flex items-center justify-center"></i>
                </div>
                <p className="text-xl font-black text-gray-900">Analyzing Document...</p>
                <p className="text-sm text-gray-500 mt-2 max-w-xs">AI is masking sensitive parts and reading the name.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start space-x-3 text-red-700">
              <i className="fa-solid fa-triangle-exclamation mt-1"></i>
              <div className="text-sm font-medium">{error}</div>
            </div>
          )}
        </div>
      )}

      {step === 2 && extractedData && (
        <div className="space-y-8 animate-in slide-in-from-right duration-300">
          <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
            <h3 className="font-black text-green-800 text-xl mb-6 flex items-center">
              <i className="fa-solid fa-check-double mr-3 bg-green-200 p-2 rounded-lg"></i> 
              Review Extraction
            </h3>
            <p className="text-xs text-green-700 font-medium mb-4">AI extraction might not be perfect. Please verify the owner's name and document type.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-xl border border-green-50 shadow-sm">
                <label className="block text-[10px] text-green-600 uppercase font-black tracking-widest mb-1">Owner Name</label>
                <input 
                  type="text"
                  value={extractedData.name}
                  onChange={(e) => setExtractedData({...extractedData, name: e.target.value})}
                  className="w-full text-lg font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 outline-none"
                />
              </div>
              <div className="bg-white p-4 rounded-xl border border-green-50 shadow-sm relative">
                <label className="block text-[10px] text-green-600 uppercase font-black tracking-widest mb-1">Doc Type</label>
                <select
                  value={extractedData.type}
                  onChange={(e) => setExtractedData({...extractedData, type: e.target.value as DocumentType})}
                  className="w-full text-lg font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 outline-none appearance-none cursor-pointer"
                >
                  {docTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <i className="fa-solid fa-caret-down absolute right-4 bottom-5 text-green-300 pointer-events-none"></i>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-black text-gray-900 flex items-center">
              <i className="fa-solid fa-user-lock mr-2 text-red-600"></i>
              Privacy Settings
            </h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 rounded-2xl border-2 border-gray-100 bg-gray-50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Masking Format</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setPrivacy({...privacy, numberDisplay: 'partial'})}
                    className={`flex-1 p-3 rounded-xl text-xs font-bold border-2 transition-all ${privacy.numberDisplay === 'partial' ? 'bg-white border-red-500 text-red-600 shadow-md' : 'bg-transparent border-gray-200 text-gray-500'}`}
                  >
                    •••• •••• {extractedData.documentNumber.slice(-4) || 'XXXX'}
                  </button>
                  <button 
                    onClick={() => setPrivacy({...privacy, numberDisplay: 'hidden'})}
                    className={`flex-1 p-3 rounded-xl text-xs font-bold border-2 transition-all ${privacy.numberDisplay === 'hidden' ? 'bg-white border-red-500 text-red-600 shadow-md' : 'bg-transparent border-gray-200 text-gray-500'}`}
                  >
                    •••• •••• ••••
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl border-2 border-gray-100 bg-gray-50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Image Blur</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setPrivacy({...privacy, imageDisplay: 'blurred'})}
                    className={`flex-1 p-3 rounded-xl text-xs font-bold border-2 transition-all ${privacy.imageDisplay === 'blurred' ? 'bg-white border-red-500 text-red-600 shadow-md' : 'bg-transparent border-gray-200 text-gray-500'}`}
                  >
                    <i className="fa-solid fa-eye-low-vision mr-2"></i> Blurred
                  </button>
                  <button 
                    onClick={() => setPrivacy({...privacy, imageDisplay: 'hidden'})}
                    className={`flex-1 p-3 rounded-xl text-xs font-bold border-2 transition-all ${privacy.imageDisplay === 'hidden' ? 'bg-white border-red-500 text-red-600 shadow-md' : 'bg-transparent border-gray-200 text-gray-500'}`}
                  >
                    <i className="fa-solid fa-eye-slash mr-2"></i> Hidden
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={handleRetake} 
              className="flex-1 px-6 py-4 border-2 border-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all"
            >
              Retake Photo
            </button>
            <button 
              onClick={() => setStep(3)} 
              className="flex-[2] px-6 py-4 bg-red-600 text-white rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 hover:translate-y-[-2px] transition-all"
            >
              Continue to Location
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="group">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Your Name</label>
                <div className="relative">
                  <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500"></i>
                  <input 
                    type="text" 
                    value={finderInfo.name}
                    onChange={(e) => setFinderInfo({...finderInfo, name: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-red-500 outline-none transition-all" 
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div className="group">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Your Phone</label>
                <div className="relative">
                  <i className="fa-solid fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500"></i>
                  <input 
                    type="tel" 
                    value={finderInfo.phone}
                    onChange={(e) => setFinderInfo({...finderInfo, phone: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-red-500 outline-none transition-all" 
                    placeholder="07XX XXX XXX"
                  />
                </div>
              </div>
            </div>

            <LocationPicker 
              onLocationSelect={handleLocationSelected}
              initialLat={finderInfo.lat}
              initialLng={finderInfo.lng}
            />

            <div className="group">
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 px-1">Resolved Address</label>
              <div className="relative">
                <i className="fa-solid fa-map-pin absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500"></i>
                <input 
                  type="text" 
                  readOnly
                  value={finderInfo.location}
                  className="w-full pl-12 pr-4 py-4 bg-gray-100 border-none rounded-2xl text-sm text-gray-600 outline-none" 
                  placeholder="Tap map above to set address"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start space-x-3 text-red-700 text-xs">
              <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button 
              onClick={() => setStep(2)} 
              className="flex-1 px-6 py-4 border-2 border-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-50"
            >
              Back to Privacy
            </button>
            <button 
              onClick={handleSubmit} 
              className="flex-[2] px-6 py-4 bg-red-600 text-white rounded-2xl font-black shadow-xl shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center space-x-2"
            >
              <i className="fa-solid fa-circle-check"></i>
              <span>Finalize & Post Report</span>
            </button>
          </div>
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <button onClick={onCancel} className="text-gray-400 hover:text-red-600 text-xs font-black uppercase tracking-widest transition-colors">
          Cancel Report
        </button>
      </div>
    </div>
  );
};

export default ReportForm;
