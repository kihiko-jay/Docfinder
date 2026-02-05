
import React, { useEffect, useState } from 'react';
import { LostDocument, DocumentType, DocumentAlert } from '../types';
import AlertModal from './AlertModal';
import { searchDocuments } from '../src/services/firestore';
import { getContact } from '../src/services/functions';

interface SearchLostProps {
  documents: LostDocument[];
  unlockedDocIds: string[];
  onAddAlert: (alert: DocumentAlert) => void;
  onClaimInitiated: (docId: string) => void;
  onUnlockRequested: (doc: LostDocument) => void;
}

const SearchLost: React.FC<SearchLostProps> = ({
  documents,
  unlockedDocIds,
  onAddAlert,
  onClaimInitiated,
  onUnlockRequested,
}) => {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<DocumentType | 'All'>('All');
  const [results, setResults] = useState<LostDocument[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [contactMap, setContactMap] = useState<Record<string, string>>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery && selectedType === 'All') {
      return;
    }

    setIsSearching(true);
    try {
      const filtered = await searchDocuments(trimmedQuery, selectedType);
      setResults(filtered);
      setHasSearched(true);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleShare = async (doc: LostDocument) => {
    // Only use window.location.href if it's a valid http/https URL. 
    // Browsers throw "Invalid URL" for things like data: or internal preview URLs.
    const currentUrl = window.location.href;
    const isValidUrl = currentUrl.startsWith('http');
    
    const shareData: ShareData = {
      title: `Found: ${doc.type} for ${doc.name}`,
      text: `Help someone find their ${doc.type}! Document belonging to ${doc.name} was found in ${doc.locationFound}. Check KenyaLostFound system.`,
      url: isValidUrl ? currentUrl : undefined,
    };

    try {
      // Check if navigator.share is available and the data is sharable
      if (navigator.share) {
        try {
          // Attempt to share with URL
          await navigator.share(shareData);
        } catch (shareErr: any) {
          // If the URL was the reason for failure (Invalid URL), try sharing without it
          if (shareErr.name === 'TypeError' || shareErr.message?.includes('URL')) {
            await navigator.share({
              title: shareData.title,
              text: shareData.text
            });
          } else {
            // Re-throw if it was a different error (like User Cancelled)
            throw shareErr;
          }
        }
      } else {
        throw new Error('Web Share not supported');
      }
    } catch (err: any) {
      // Fallback: Copy to clipboard if sharing fails or is not supported
      // Only log if it's not a user cancellation
      if (err.name !== 'AbortError') {
        console.debug('Navigator share failed, falling back to clipboard', err);
      }
      
      const shareLink = isValidUrl ? currentUrl : '';
      const shareText = `${shareData.text}${shareLink ? ` Link: ${shareLink}` : ''}`;
      
      try {
        await navigator.clipboard.writeText(shareText);
        setCopyFeedback(doc.id);
        setTimeout(() => setCopyFeedback(null), 3000);
      } catch (clipErr) {
        console.error('Failed to copy to clipboard:', clipErr);
      }
    }
  };

  const openInMap = (doc: LostDocument) => {
    if (doc.lat && doc.lng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${doc.lat},${doc.lng}`, '_blank');
    }
  };

  const docTypes = Object.values(DocumentType);

  const getMaskedNumber = (doc: LostDocument) => {
    if (doc.privacy?.numberDisplay === 'partial') {
      return `•••• •••• ${doc.documentNumber.slice(-4)}`;
    }
    return '•••• •••• ••••';
  };

  const isUnlocked = (docId: string) => unlockedDocIds.includes(docId);

  const getPrice = (type: DocumentType) => {
    return (type === DocumentType.PASSPORT || type === DocumentType.SCHOOL_LEAVING_CERTIFICATE) ? 500 : 100;
  };

  useEffect(() => {
    const fetchContacts = async () => {
      const unlockedDocs = results.filter((doc) => isUnlocked(doc.id));
      const missing = unlockedDocs.filter((doc) => !contactMap[doc.id]);
      if (missing.length === 0) return;

      try {
        const updates: Record<string, string> = {};
        for (const doc of missing) {
          const response = await getContact(doc.id);
          updates[doc.id] = response.finderPhone;
        }
        setContactMap((prev) => ({ ...prev, ...updates }));
      } catch (error) {
        console.error('Failed to load contact info', error);
      }
    };

    fetchContacts();
  }, [results, unlockedDocIds, contactMap]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Find Your Lost Document</h2>
        <p className="text-xl text-gray-600">Search by name or number across ID, Passports, and other documents.</p>
      </div>

      <div className="bg-white p-3 rounded-[2rem] shadow-2xl border border-gray-100 mb-16">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
          <div className="relative flex-grow">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
              <i className="fa-solid fa-magnifying-glass text-xl"></i>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Full name or Document number..."
              className="w-full pl-14 pr-4 py-5 text-lg rounded-2xl border-none focus:ring-0 focus:outline-none placeholder-gray-400"
            />
          </div>
          
          <div className="hidden md:block h-10 w-[1px] bg-gray-100"></div>

          <div className="relative px-2 flex items-center">
            <div className="absolute left-4 text-red-500 pointer-events-none">
              <i className="fa-solid fa-tags"></i>
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DocumentType | 'All')}
              className="appearance-none w-full md:w-56 pl-10 pr-10 py-5 bg-transparent border-none focus:ring-0 text-gray-700 font-semibold cursor-pointer outline-none"
            >
              <option value="All">All Categories</option>
              {docTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <div className="absolute right-4 text-gray-400 pointer-events-none">
              <i className="fa-solid fa-chevron-down text-xs"></i>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className={`px-10 py-5 rounded-[1.25rem] font-bold transition-all shadow-lg shadow-red-100 flex items-center justify-center space-x-2 active:scale-[0.98] ${isSearching ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
          >
            <span>{isSearching ? 'Searching...' : 'Search'}</span>
            <i className={`fa-solid ${isSearching ? 'fa-circle-notch animate-spin' : 'fa-arrow-right-long'}`}></i>
          </button>
        </form>
      </div>

      {hasSearched ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-6 gap-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Search Results ({results.length})
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Searching for <b>"{query}"</b> in {selectedType === 'All' ? 'all documents' : selectedType}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {query && (
                <span className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 flex items-center">
                  <i className="fa-solid fa-search mr-2 opacity-50"></i> "{query}"
                </span>
              )}
              {selectedType !== 'All' && (
                <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100 flex items-center">
                  <i className="fa-solid fa-tag mr-2 opacity-50"></i> {selectedType}
                </span>
              )}
            </div>
          </div>
          
          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {results.map(doc => (
                <div key={doc.id} className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 relative overflow-hidden flex flex-col">
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 transform -translate-x-full group-hover:translate-x-0 transition-transform z-10 ${isUnlocked(doc.id) ? 'bg-green-500' : 'bg-red-600'}`}></div>
                  
                  {doc.imageUrl && doc.privacy?.imageDisplay !== 'hidden' && (
                    <div className="relative h-40 overflow-hidden bg-gray-100">
                      <img 
                        src={doc.imageUrl} 
                        alt="Document Preview" 
                        className={`w-full h-full object-cover ${doc.privacy?.imageDisplay === 'blurred' ? 'blur-xl opacity-50 scale-110' : ''}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-2 py-1 rounded-lg text-[9px] font-black tracking-widest text-gray-600 shadow-sm border border-white/20">
                        {doc.privacy?.imageDisplay === 'blurred' ? 'BLURRED FOR PRIVACY' : 'PREVIEW'}
                      </div>
                    </div>
                  )}

                  <div className="p-7 flex-grow">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex space-x-2">
                        <span className="bg-gray-900 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          {doc.type}
                        </span>
                        {isUnlocked(doc.id) && (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center">
                            <i className="fa-solid fa-unlock mr-1"></i> Unlocked
                          </span>
                        )}
                      </div>
                      <span className="text-gray-400 text-[11px] font-semibold bg-gray-50 px-2 py-1 rounded-md">
                        {new Date(doc.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <h4 className="text-2xl font-black text-gray-900 mb-2 leading-tight group-hover:text-red-600 transition-colors">
                      {doc.name}
                    </h4>
                    
                    <div className="flex items-center text-gray-500 text-xs mb-8 font-medium">
                      <div className="h-5 w-5 bg-red-50 rounded-full flex items-center justify-center mr-2">
                         <i className="fa-solid fa-location-dot text-[9px] text-red-500"></i>
                      </div>
                      <span className="line-clamp-1 flex-grow">{doc.locationFound || 'Kenya'}</span>
                      {doc.lat && doc.lng && (
                        <button 
                          onClick={() => openInMap(doc)}
                          className="ml-2 text-red-600 hover:text-red-700 font-bold text-[10px] uppercase tracking-tighter whitespace-nowrap bg-red-50 px-2 py-1 rounded"
                        >
                          Show on Map
                        </button>
                      )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1 tracking-widest">Doc Number</p>
                      <p className="text-sm font-mono font-bold text-gray-700 tracking-wider">
                        {getMaskedNumber(doc)}
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 p-5 rounded-2xl mb-8 border border-gray-100 group-hover:bg-white group-hover:border-gray-200 transition-all relative overflow-hidden">
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-3 tracking-widest">Finder Profile</p>
                      
                      <div className={`flex items-center space-x-4 transition-all duration-500 ${!isUnlocked(doc.id) ? 'blur-md select-none opacity-50' : 'blur-0 opacity-100'}`}>
                        <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-600 border border-gray-100">
                           <i className="fa-solid fa-user-shield text-xl"></i>
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-900 text-lg leading-none mb-1">{doc.finderName}</p>
                          <p className="text-sm text-gray-500 font-medium">
                            {isUnlocked(doc.id) ? (contactMap[doc.id] || 'Loading...') : 'Hidden'}
                          </p>
                        </div>
                      </div>

                      {!isUnlocked(doc.id) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/20 group-hover:bg-white/20 backdrop-blur-[2px]">
                           <i className="fa-solid fa-lock text-red-600 mb-2"></i>
                           <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Contact Locked</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {isUnlocked(doc.id) ? (
                        (() => {
                          const contactPhone = contactMap[doc.id];
                          const isReady = !!contactPhone;
                          return (
                        <a 
                          href={isReady ? `tel:${contactPhone}` : undefined}
                          onClick={(event) => {
                            if (!isReady) {
                              event.preventDefault();
                              return;
                            }
                            onClaimInitiated(doc.id);
                          }}
                          className={`flex-[2] flex items-center justify-center space-x-3 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-green-50 ${isReady ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                        >
                          <i className="fa-solid fa-phone-volume"></i>
                          <span>{isReady ? 'Call to Claim' : 'Loading Contact'}</span>
                        </a>
                          );
                        })()
                      ) : (
                        <button 
                          onClick={() => onUnlockRequested(doc)}
                          className="flex-[2] flex items-center justify-center space-x-3 bg-red-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl shadow-red-50"
                        >
                          <i className="fa-solid fa-key"></i>
                          <span>Unlock (KES {getPrice(doc.type)})</span>
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleShare(doc)}
                        className="flex-1 flex items-center justify-center space-x-3 bg-gray-100 text-gray-700 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all border border-gray-200"
                      >
                        <i className={`fa-solid ${copyFeedback === doc.id ? 'fa-check text-green-600' : 'fa-share-nodes'}`}></i>
                        <span>{copyFeedback === doc.id ? 'Copied' : 'Share'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
              <div className="h-28 w-28 bg-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl border border-gray-50">
                <i className="fa-solid fa-search-minus text-5xl text-gray-200"></i>
              </div>
              <h4 className="text-3xl font-black text-gray-900 mb-3">No match found</h4>
              <p className="text-gray-500 text-lg max-w-sm mx-auto leading-relaxed">
                We couldn't find any documents matching <b>"{query}"</b>. We checked all categories including 'Other' documents.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                <button 
                  onClick={() => {
                    setQuery('');
                    setSelectedType('All');
                    setHasSearched(false);
                  }}
                  className="px-8 py-3 bg-white border-2 border-gray-200 rounded-2xl text-gray-900 font-black text-sm uppercase tracking-widest hover:border-red-600 hover:text-red-600 transition-all"
                >
                  Clear Filters
                </button>
                <button 
                  onClick={() => setIsAlertModalOpen(true)}
                  className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center space-x-2"
                >
                  <i className="fa-solid fa-bell"></i>
                  <span>Setup Alert</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="group p-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm text-center hover:shadow-2xl transition-all border-b-8 border-b-blue-500">
             <div className="h-16 w-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
               <i className="fa-solid fa-shield-halved text-3xl"></i>
             </div>
             <h4 className="font-black text-xl text-gray-900 mb-3">Privacy First</h4>
             <p className="text-gray-500 leading-relaxed text-sm">We mask document numbers to protect your identity from public scrapers.</p>
           </div>
           <div className="group p-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm text-center hover:shadow-2xl transition-all border-b-8 border-b-green-500">
             <div className="h-16 w-16 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
               <i className="fa-solid fa-handshake text-3xl"></i>
             </div>
             <h4 className="font-black text-xl text-gray-900 mb-3">Community Aid</h4>
             <p className="text-gray-500 leading-relaxed text-sm">A platform built on the integrity of Kenyan citizens helping each other.</p>
           </div>
           <div className="group p-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm text-center hover:shadow-2xl transition-all border-b-8 border-b-amber-500">
             <div className="h-16 w-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
               <i className="fa-solid fa-bolt text-3xl"></i>
             </div>
             <h4 className="font-black text-xl text-gray-900 mb-3">Instant Result</h4>
             <p className="text-gray-500 leading-relaxed text-sm">Check thousands of reports in seconds. No more visiting police stations daily.</p>
           </div>
        </div>
      )}

      <AlertModal 
        isOpen={isAlertModalOpen} 
        onClose={() => setIsAlertModalOpen(false)} 
        onSave={onAddAlert}
        initialNumber={query}
        initialType={selectedType}
      />
    </div>
  );
};

export default SearchLost;
