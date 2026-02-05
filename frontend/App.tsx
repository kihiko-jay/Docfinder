
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import ReportForm from './components/ReportForm';
import SearchLost from './components/SearchLost';
import FeedbackModal from './components/FeedbackModal';
import PaymentModal from './components/PaymentModal';
import PrivacyPolicy from './components/PrivacyPolicy';
import { LostDocument, DocumentAlert, Feedback, DocumentType } from './types';
import {
  getUnlockedDocs,
  onDocumentsSnapshot,
  onAlertsSnapshot,
} from './src/services/firestore';
import { createAlert, createFeedback } from './src/services/functions';
import { ensureAnonymousAuth } from './src/services/auth';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'report' | 'search' | 'privacy'>('home');
  const [documents, setDocuments] = useState<LostDocument[]>([]);
  const [alerts, setAlerts] = useState<DocumentAlert[]>([]);
  const [unlockedDocIds, setUnlockedDocIds] = useState<string[]>([]);
  
  const [showNotification, setShowNotification] = useState(false);
  const [alertMatchNotification, setAlertMatchNotification] = useState<DocumentAlert | null>(null);
  
  const [pendingFeedbackDocId, setPendingFeedbackDocId] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  const [paymentTarget, setPaymentTarget] = useState<LostDocument | null>(null);
  const [alertToPay, setAlertToPay] = useState<DocumentAlert | null>(null);
  const matchedAlertIdsRef = useRef<Set<string>>(new Set());

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    ensureAnonymousAuth()
      .then((uid) => setUserId(uid))
      .catch((error) => console.error('Failed to sign in anonymously', error));
  }, []);

  useEffect(() => {
    if (!userId) return;
    const loadData = async () => {
      try {
        const unlocked = await getUnlockedDocs(userId);
        setUnlockedDocIds(unlocked);
      } catch (error) {
        console.error('Failed to load Firebase data', error);
      }
    };

    loadData();
  }, [userId]);

  useEffect(() => {
    if (!userId) return () => undefined;
    const unsubscribe = onDocumentsSnapshot(50, (items) => {
      setDocuments(items);
    });
    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!userId) return () => undefined;
    const unsubscribe = onAlertsSnapshot(userId, (items) => {
      setAlerts(items);
    });
    return () => unsubscribe();
  }, [userId]);

  const activeMatches = useMemo(() => {
    const matches: {alert: DocumentAlert, doc: LostDocument}[] = [];
    alerts.forEach(alert => {
      const match = documents.find(doc => 
        doc.documentNumber.toLowerCase() === alert.documentNumber.toLowerCase() &&
        (alert.type === 'All' || doc.type === alert.type)
      );
      if (match) {
        matches.push({ alert, doc: match });
      }
    });
    return matches;
  }, [documents, alerts]);

  useEffect(() => {
    const nextMatch = activeMatches.find(
      (match) => !matchedAlertIdsRef.current.has(match.alert.id)
    );

    if (nextMatch) {
      matchedAlertIdsRef.current.add(nextMatch.alert.id);
      setAlertMatchNotification(nextMatch.alert);
    }
  }, [activeMatches]);

  const handleReportSuccess = (newDoc: LostDocument) => {
    const updatedDocs = [newDoc, ...documents];
    setDocuments(updatedDocs);
    
    const triggeredAlert = alerts.find(alert => 
      alert.documentNumber.toLowerCase() === newDoc.documentNumber.toLowerCase() &&
      (alert.type === 'All' || newDoc.type === alert.type)
    );

    if (triggeredAlert) {
      setAlertMatchNotification(triggeredAlert);
    } else {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
    
    setView('home');
  };

  const handleAddAlert = (newAlert: DocumentAlert) => {
    // Intercept alert creation to request payment
    setAlertToPay(newAlert);
  };

  const finalizeAlertCreation = async (alert: DocumentAlert) => {
    try {
      await createAlert(alert);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
      setAlertToPay(null);
    } catch (error) {
      console.error('Failed to create alert', error);
    }
  };

  const removeAlert = (id: string) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
  };

  const handleClaimInitiated = (docId: string) => {
    setPendingFeedbackDocId(docId);
    setTimeout(() => {
      setShowFeedbackModal(true);
    }, 2000);
  };

  const handlePaymentSuccess = async () => {
    if (alertToPay) {
      await finalizeAlertCreation(alertToPay);
      return;
    }

    if (paymentTarget) {
      const updated = [...unlockedDocIds, paymentTarget.id];
      setUnlockedDocIds(updated);
      setPaymentTarget(null);
    }
  };

  const handleFeedbackSubmit = async (rating: number, isHelpful: boolean) => {
    if (!pendingFeedbackDocId) return;

    const newFeedback: Feedback = {
      docId: pendingFeedbackDocId,
      rating,
      isHelpful,
      timestamp: Date.now()
    };

    try {
      await createFeedback(newFeedback);
    } catch (error) {
      console.error('Failed to submit feedback', error);
    }
    
    setShowFeedbackModal(false);
    setPendingFeedbackDocId(null);
    
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const getDocPrice = (type: DocumentType) => {
    if (type === DocumentType.PASSPORT || type === DocumentType.SCHOOL_LEAVING_CERTIFICATE) {
      return 500;
    }
    return 100;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header currentView={view} onNavigate={setView} />

      {!userId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="bg-white px-6 py-4 rounded-2xl shadow-xl text-sm font-semibold text-gray-700">
            Preparing secure session...
          </div>
        </div>
      )}
      
      {showNotification && (
        <div className="fixed top-20 right-4 z-[110] animate-in slide-in-from-right duration-500">
          <div className="bg-green-600 text-white px-6 py-5 rounded-[2rem] shadow-2xl flex items-center space-x-4 border-4 border-green-500/30 backdrop-blur">
            <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-circle-check text-xl"></i>
            </div>
            <div>
              <p className="font-black text-sm uppercase tracking-wider">Confirmed!</p>
              <p className="text-xs font-medium opacity-90">Success!</p>
            </div>
          </div>
        </div>
      )}

      {alertMatchNotification && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 text-center shadow-2xl animate-in zoom-in-95 duration-500">
            <div className="h-24 w-24 bg-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-200 animate-bounce">
              <i className="fa-solid fa-bell text-4xl text-white"></i>
            </div>
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">IT'S A MATCH!</h2>
            <p className="text-gray-500 text-lg mb-10 leading-relaxed px-4">
              Great news! A document matching your alert for <b>"{alertMatchNotification.label}"</b> was just reported as found.
            </p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => {
                  setAlertMatchNotification(null);
                  setView('search');
                }}
                className="w-full bg-red-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-100"
              >
                View Found Document
              </button>
              <button 
                onClick={() => setAlertMatchNotification(null)}
                className="w-full bg-gray-100 text-gray-500 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
      />

      {paymentTarget && (
        <PaymentModal 
          isOpen={!!paymentTarget}
          onClose={() => setPaymentTarget(null)}
          onSuccess={handlePaymentSuccess}
          docName={paymentTarget.name}
          docType={paymentTarget.type}
          amount={getDocPrice(paymentTarget.type)}
          documentId={paymentTarget.id}
          userId={userId || ''}
        />
      )}

      {alertToPay && (
        <PaymentModal 
          isOpen={!!alertToPay}
          onClose={() => setAlertToPay(null)}
          onSuccess={handlePaymentSuccess}
          docName={alertToPay.label}
          docType="Real-time Alert Service"
          amount={100}
          documentId={alertToPay.id}
          userId={userId || ''}
        />
      )}

      <main className="flex-grow">
        {view === 'home' && (
          <>
            <Hero 
              onReport={() => setView('report')} 
              onSearch={() => setView('search')} 
            />
            
            {alerts.length > 0 && (
              <section className="bg-white py-12 px-4 border-b">
                <div className="max-w-7xl mx-auto">
                   <div className="flex items-center space-x-3 mb-8">
                     <div className="h-10 w-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                        <i className="fa-solid fa-bell"></i>
                     </div>
                     <h2 className="text-2xl font-black text-gray-900 tracking-tight">Your Active Alerts</h2>
                   </div>
                   <div className="flex overflow-x-auto pb-6 space-x-4 no-scrollbar">
                     {alerts.map(alert => {
                       const isMatched = activeMatches.some(m => m.alert.id === alert.id);
                       return (
                         <div key={alert.id} className={`flex-shrink-0 w-72 p-6 rounded-[2rem] border-2 transition-all relative ${isMatched ? 'bg-red-50 border-red-200 shadow-lg shadow-red-50' : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200'}`}>
                           <button onClick={() => removeAlert(alert.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500">
                             <i className="fa-solid fa-circle-xmark"></i>
                           </button>
                           {isMatched && (
                             <div className="absolute -top-3 left-6 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                               Match Found
                             </div>
                           )}
                           <h4 className="font-bold text-gray-900 mb-1">{alert.label}</h4>
                           <p className="text-xs font-mono text-gray-500 mb-4">{alert.documentNumber}</p>
                           <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-200 px-2 py-1 rounded">{alert.type}</span>
                             {isMatched && (
                               <button onClick={() => setView('search')} className="text-xs font-black text-red-600 hover:underline">
                                 Claim <i className="fa-solid fa-arrow-right ml-1"></i>
                               </button>
                             )}
                           </div>
                         </div>
                       );
                     })}
                   </div>
                </div>
              </section>
            )}

            <section className="bg-gray-50 py-20 px-4">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">Recently Found</h2>
                    <p className="text-gray-500 mt-2">New documents reported across Kenya</p>
                  </div>
                  <button onClick={() => setView('search')} className="text-red-600 font-bold hover:underline">
                    View All <i className="fa-solid fa-arrow-right ml-1"></i>
                  </button>
                </div>

                {documents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {documents.slice(0, 6).map(doc => (
                      <div 
                        key={doc.id} 
                        className="group bg-white rounded-3xl shadow-sm border border-gray-100 hover:scale-[1.02] transition-all cursor-pointer overflow-hidden flex flex-col" 
                        onClick={() => setView('search')}
                      >
                        {doc.imageUrl && doc.privacy?.imageDisplay !== 'hidden' && (
                          <div className="relative h-32 overflow-hidden bg-gray-50">
                            <img 
                              src={doc.imageUrl} 
                              alt="Found ID" 
                              className={`w-full h-full object-cover ${doc.privacy?.imageDisplay === 'blurred' ? 'blur-lg opacity-40 scale-110' : ''}`} 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                          </div>
                        )}
                        <div className="p-6">
                          <div className="flex items-center space-x-4 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                               <i className="fa-solid fa-file-invoice text-lg"></i>
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 line-clamp-1">{doc.name}</h3>
                              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">{doc.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mb-2 font-medium">
                             <i className="fa-solid fa-location-dot w-5 text-red-500 opacity-50"></i>
                             <span>{doc.locationFound}</span>
                          </div>
                          <div className="flex items-center text-xs text-gray-400 font-medium">
                             <i className="fa-solid fa-clock w-5 opacity-30"></i>
                             <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-gray-200">
                    <div className="bg-gray-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <i className="fa-solid fa-clipboard-list text-3xl text-gray-400"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No documents yet</h3>
                    <p className="text-gray-500 mt-2">Be the first to help someone by reporting a found ID.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="py-20 px-4 max-w-7xl mx-auto">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                 <div>
                    <h2 className="text-4xl font-extrabold text-gray-900 mb-6 tracking-tight">How it works</h2>
                    <div className="space-y-8">
                       <div className="flex items-start space-x-4">
                         <div className="bg-red-600 text-white h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
                         <div>
                            <h4 className="font-bold text-xl text-gray-900">Someone Finds an ID</h4>
                            <p className="text-gray-600">A citizen finds a lost document and uploads a photo. They choose which parts of the ID are visible to others.</p>
                         </div>
                       </div>
                       <div className="flex items-start space-x-4">
                         <div className="bg-red-600 text-white h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
                         <div>
                            <h4 className="font-bold text-xl text-gray-900">You Search or Set Alerts</h4>
                            <p className="text-gray-600">Enter your document number. If found, you can unlock the finder's contact details for a tiered recovery fee (KES 100-500).</p>
                         </div>
                       </div>
                       <div className="flex items-start space-x-4">
                         <div className="bg-red-600 text-white h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
                         <div>
                            <h4 className="font-bold text-xl text-gray-900">Safe Recovery</h4>
                            <p className="text-gray-600">Call the finder to arrange a meeting. We use the fee to maintain this community platform and secure the reconnection process.</p>
                         </div>
                       </div>
                    </div>
                 </div>
                 <div className="bg-gray-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 rounded-bl-full opacity-20"></div>
                    <h3 className="text-2xl font-bold mb-6">Service Excellence</h3>
                    <p className="text-gray-400 mb-6 leading-relaxed">
                      To ensure high-quality matching and secure delivery of contact information, we charge a nominal fee per document recovered. We support M-Pesa for local convenience and Stripe for international card payments.
                    </p>
                    <div className="flex items-center space-x-4 text-sm font-bold text-red-500">
                      <i className="fa-solid fa-lock"></i>
                      <span>SECURE MPESA & STRIPE PAYMENTS</span>
                    </div>
                 </div>
               </div>
            </section>
          </>
        )}

        {view === 'report' && (
          <div className="py-12 bg-gray-50 min-h-[calc(100vh-64px)] px-4">
            <ReportForm 
              onSuccess={handleReportSuccess} 
              onCancel={() => setView('home')} 
            />
          </div>
        )}

        {view === 'search' && (
          <div className="py-12 bg-white min-h-[calc(100vh-64px)]">
            <SearchLost 
              documents={documents} 
              unlockedDocIds={unlockedDocIds}
              onAddAlert={handleAddAlert}
              onClaimInitiated={handleClaimInitiated}
              onUnlockRequested={setPaymentTarget}
            />
          </div>
        )}

        {view === 'privacy' && (
          <div className="py-12 bg-gray-50 min-h-[calc(100vh-64px)]">
            <PrivacyPolicy />
          </div>
        )}
      </main>

      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center mb-6 cursor-pointer" onClick={() => setView('home')}>
              <div className="bg-red-600 p-2 rounded-lg mr-2">
                <i className="fa-solid fa-id-card text-white text-xl"></i>
              </div>
              <span className="text-xl font-bold tracking-tight">
                Kenya<span className="text-red-600">Lost</span>Found
              </span>
            </div>
            <p className="text-gray-400">
              A community initiative to reduce the headache of replacing lost IDs in Kenya.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li><button onClick={() => setView('search')} className="hover:text-white transition-colors">Search Documents</button></li>
              <li><button onClick={() => setView('report')} className="hover:text-white transition-colors">Report a Finding</button></li>
              <li><button onClick={() => setView('privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Contact Support</h4>
            <p className="text-gray-400 mb-4 text-sm">Have questions? Reach out to us.</p>
            <div className="flex space-x-4">
              <a href="#" className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                <i className="fa-brands fa-twitter"></i>
              </a>
              <a href="#" className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                <i className="fa-brands fa-whatsapp"></i>
              </a>
              <a href="#" className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                <i className="fa-solid fa-envelope"></i>
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Kenya Lost & Found System. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default App;
