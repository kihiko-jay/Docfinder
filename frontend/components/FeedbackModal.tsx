
import React, { useState } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, isHelpful: boolean) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (rating > 0 && isHelpful !== null) {
      onSubmit(rating, isHelpful);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[130] w-full max-w-sm animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gray-900 p-6 text-white flex justify-between items-center">
          <h3 className="font-black text-sm uppercase tracking-widest">Help us improve</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <p className="text-gray-600 font-medium text-sm text-center">
            We hope you got your document back! How was the experience?
          </p>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Rate the process</p>
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl transition-all transform active:scale-90 ${
                      star <= rating ? 'text-amber-400' : 'text-gray-200'
                    }`}
                  >
                    <i className="fa-solid fa-star"></i>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Was this service helpful?</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setIsHelpful(true)}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all ${
                    isHelpful === true ? 'bg-green-600 text-white shadow-lg shadow-green-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <i className="fa-solid fa-thumbs-up mr-2"></i> Yes
                </button>
                <button
                  onClick={() => setIsHelpful(false)}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase transition-all ${
                    isHelpful === false ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  <i className="fa-solid fa-thumbs-down mr-2"></i> No
                </button>
              </div>
            </div>
          </div>

          <button
            disabled={rating === 0 || isHelpful === null}
            onClick={handleSubmit}
            className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
