
import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-16">
        <div className="inline-block p-3 bg-red-50 rounded-2xl mb-4">
          <i className="fa-solid fa-shield-halved text-3xl text-red-600"></i>
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-gray-500 text-lg">Transparency is the foundation of our community recovery system.</p>
      </div>

      <div className="space-y-12 text-gray-700 leading-relaxed">
        <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <i className="fa-solid fa-microchip mr-3 text-red-600"></i>
            AI Document Processing
          </h2>
          <p className="mb-4">
            Our platform utilizes <strong>Google Gemini AI</strong> to analyze images of found documents. This process is designed to extract only the owner's name and document type. 
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li>Images are processed in real-time to identify identity details.</li>
            <li>We do not store full document images on our permanent database; they are handled within your browser session.</li>
            <li>Sensitive document numbers are automatically masked (e.g., 1234xxxx) before being displayed to the public.</li>
          </ul>
        </section>

        <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <i className="fa-solid fa-credit-card mr-3 text-red-600"></i>
            Payment & Transaction Security
          </h2>
          <p className="mb-4">
            To maintain platform integrity and facilitate secure recovery, we charge a nominal tiered fee to unlock finder contact details or set up real-time monitoring:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm mb-6">
            <li><strong>KES 100:</strong> National ID and Driving License recovery.</li>
            <li><strong>KES 500:</strong> Passports and School Leaving Certificates recovery.</li>
            <li><strong>KES 100:</strong> Real-time document monitoring alerts (One-time setup fee).</li>
          </ul>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="p-4 bg-green-50 rounded-xl border border-green-100">
              <h4 className="font-bold text-green-800 mb-2 flex items-center">
                <i className="fa-solid fa-mobile-screen mr-2"></i> M-Pesa (Kenya)
              </h4>
              <p className="text-xs text-green-700">Payments are processed via secure STK Push. We never see or store your M-Pesa PIN.</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <h4 className="font-bold text-indigo-800 mb-2 flex items-center">
                <i className="fa-brands fa-stripe mr-2"></i> Stripe (Global)
              </h4>
              <p className="text-xs text-indigo-700">Card details are handled directly by Stripe's encrypted infrastructure. We do not store card numbers.</p>
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <i className="fa-solid fa-database mr-3 text-red-600"></i>
            Data Storage & Persistence
          </h2>
          <p className="mb-4">
            Kenya Lost & Found is built as a privacy-first decentralized tool:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li><strong>Local Storage:</strong> Your reports, alerts, and payment history are stored locally in your browser's memory.</li>
            <li><strong>Persistence:</strong> If you clear your browser cache, you may lose access to previously unlocked contacts.</li>
            <li><strong>No Tracking:</strong> We do not sell your personal information to third parties or use invasive tracking cookies.</li>
          </ul>
        </section>

        <section className="bg-gray-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 rounded-bl-full opacity-20"></div>
          <h2 className="text-2xl font-bold mb-6">Your Rights</h2>
          <p className="text-gray-400 text-sm mb-6">
            As a user of this platform, you have the right to request the removal of any document report belonging to you. Since we prioritize community help, we encourage finders to be respectful and owners to verify details before arranging collection.
          </p>
          <div className="flex items-center space-x-4 text-xs font-black tracking-widest text-red-500 uppercase">
            <i className="fa-solid fa-circle-check"></i>
            <span>Compliant with Kenya Data Protection Act 2019 principles</span>
          </div>
        </section>
      </div>

      <div className="mt-16 text-center">
        <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">Last Updated: October 2023</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
