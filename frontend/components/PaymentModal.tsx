
import React, { useEffect, useRef, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { functions } from '../src/config/firebase';
import { getUnlockedDocs } from '../src/services/firestore';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  docName: string;
  docType: string;
  amount: number;
  documentId: string;
  userId: string;
}

// Only load Stripe if we have a valid publishable key
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey && stripeKey !== 'pk_test_placeholder_key' 
  ? loadStripe(stripeKey)
  : Promise.resolve(null);

const StripeCheckoutForm: React.FC<{
  amount: number;
  documentId: string;
  onSuccess: () => void;
}> = ({ amount, documentId, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initPayment = async () => {
      try {
        const createIntent = httpsCallable(functions, 'createPaymentIntent');
        const response = await createIntent({ amount, documentId });
        const data = response.data as { clientSecret?: string };
        if (!data.clientSecret) {
          setError('Failed to create payment intent.');
          return;
        }
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Stripe init failed', err);
        setError('Failed to initialize Stripe payment.');
      }
    };

    initPayment();
  }, [amount, documentId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    const card = elements.getElement(CardElement);
    if (!card) return;

    setIsSubmitting(true);
    setError(null);

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });

    if (result.error) {
      setError(result.error.message || 'Payment failed.');
      setIsSubmitting(false);
      return;
    }

    if (result.paymentIntent?.status === 'succeeded') {
      onSuccess();
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="animate-in slide-in-from-right duration-300 space-y-4">
        <div className="flex items-center justify-center mb-6">
          <i className="fa-brands fa-stripe text-5xl text-indigo-600"></i>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Card Details</label>
          <div className="bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-4 focus-within:border-indigo-500 transition-all">
            <CardElement options={{ hidePostalCode: true }} />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-600 text-center">{error}</div>
      )}

      <button
        disabled={!stripe || !clientSecret || isSubmitting}
        type="submit"
        className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all flex items-center justify-center space-x-3 active:scale-[0.98] ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}
      >
        {isSubmitting ? (
          <>
            <i className="fa-solid fa-circle-notch animate-spin"></i>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <i className="fa-solid fa-lock"></i>
            <span>Pay KES {amount.toFixed(2)}</span>
          </>
        )}
      </button>
    </form>
  );
};

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  docName,
  docType,
  amount,
  documentId,
  userId
}) => {
  const [method, setMethod] = useState<'mpesa' | 'stripe'>('mpesa');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  if (!isOpen) return null;

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
      }
    };
  }, []);

  const handleSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onSuccess();
      setIsSuccess(false);
    }, 2000);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage(null);

    try {
        const initiatePayment = httpsCallable(functions, 'initiateMpesaPayment');
        await initiatePayment({
          phoneNumber: phone,
          amount,
          documentId
        });

      setStatusMessage('STK Push sent. Please complete payment on your phone.');

      pollRef.current = window.setInterval(async () => {
        const unlocked = await getUnlockedDocs(userId);
        if (unlocked.includes(documentId)) {
          if (pollRef.current) window.clearInterval(pollRef.current);
          setLoading(false);
          handleSuccess();
        }
      }, 5000);

      window.setTimeout(() => {
        if (pollRef.current) window.clearInterval(pollRef.current);
        setLoading(false);
        setStatusMessage('Payment verification timed out. Please try again.');
      }, 60000);
    } catch (error) {
      console.error('M-Pesa payment failed', error);
      setStatusMessage('Failed to initiate M-Pesa payment. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {!isSuccess ? (
          <>
            <div className="bg-red-600 p-8 text-white relative">
              <button onClick={onClose} className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <i className="fa-solid fa-unlock-keyhole text-2xl"></i>
                </div>
                <div>
                  <h2 className="text-2xl font-black">Unlock Contact</h2>
                  <p className="text-red-100 text-sm">Securely view finder's details</p>
                </div>
              </div>
              <div className="bg-red-700/50 rounded-2xl p-4 border border-red-500/30">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-red-200">Amount Due</span>
                  <span className="text-2xl font-black">KES {amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="flex bg-gray-100 p-1 rounded-2xl mb-8">
                <button 
                  onClick={() => setMethod('mpesa')}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${method === 'mpesa' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
                >
                  <i className="fa-solid fa-mobile-screen-button mr-2"></i> M-Pesa
                </button>
                <button 
                  onClick={() => setMethod('stripe')}
                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${method === 'stripe' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}
                >
                  <i className="fa-solid fa-credit-card mr-2"></i> Stripe
                </button>
              </div>

              {method === 'mpesa' ? (
                <form onSubmit={handlePayment} className="space-y-6">
                  <div className="animate-in slide-in-from-left duration-300">
                    <div className="flex items-center justify-center mb-6">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" alt="M-Pesa" className="h-12" />
                    </div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Safaricom Phone Number</label>
                    <div className="relative">
                      <i className="fa-solid fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-green-600"></i>
                      <input 
                        type="tel" 
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="07XX XXX XXX"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-green-500 outline-none transition-all font-bold"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-4 text-center">
                      A prompt will be sent to your phone to enter your M-Pesa PIN.
                    </p>
                  </div>
                  {statusMessage && (
                    <p className="text-[10px] text-gray-500 mt-4 text-center">
                      {statusMessage}
                    </p>
                  )}

                  <button 
                    disabled={loading}
                    type="submit"
                    className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all flex items-center justify-center space-x-3 active:scale-[0.98] ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-green-100'}`}
                  >
                    {loading ? (
                      <>
                        <i className="fa-solid fa-circle-notch animate-spin"></i>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-lock"></i>
                        <span>Pay KES {amount.toFixed(2)}</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                stripeKey && stripeKey !== 'pk_test_placeholder_key' ? (
                  <Elements stripe={stripePromise}>
                    <StripeCheckoutForm
                      amount={amount}
                      documentId={documentId}
                      onSuccess={handleSuccess}
                    />
                  </Elements>
                ) : (
                  <div className="animate-in slide-in-from-right duration-300 text-center py-12">
                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fa-solid fa-credit-card text-gray-400 text-2xl"></i>
                    </div>
                    <p className="text-gray-500 mb-4">Stripe payment is not configured yet.</p>
                    <p className="text-sm text-gray-400">Please use M-Pesa for now.</p>
                    <button 
                      onClick={() => setMethod('mpesa')}
                      className="mt-4 px-6 py-2 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all"
                    >
                      <i className="fa-solid fa-mobile-screen-button mr-2"></i>
                      Switch to M-Pesa
                    </button>
                  </div>
                )
              )}
            </div>
          </>
        ) : (
          <div className="p-12 text-center animate-in zoom-in duration-500">
            <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
              <i className="fa-solid fa-check text-4xl"></i>
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">Payment Verified!</h2>
            <p className="text-gray-500 mb-8">You have successfully unlocked the contact details for this document.</p>
            <div className="inline-flex items-center space-x-2 text-green-600 font-bold bg-green-50 px-4 py-2 rounded-full">
               <i className="fa-solid fa-shield-check"></i>
               <span className="text-xs uppercase tracking-widest">Access Granted</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
