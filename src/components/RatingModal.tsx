import React, { useState } from "react";
import { Star, X } from "lucide-react";

interface RatingModalProps {
  title: string;
  subtitle: string;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (rating: number, review: string) => Promise<void>;
}

export const RatingModal: React.FC<RatingModalProps> = ({ title, subtitle, loading = false, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(rating, review);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-5 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(value => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="rounded-2xl p-2 text-amber-400 transition hover:scale-110"
              aria-label={`Rate ${value} stars`}
            >
              <Star className={`h-8 w-8 ${value <= rating ? "fill-amber-400" : "fill-transparent text-slate-300"}`} />
            </button>
          ))}
        </div>

        <textarea
          value={review}
          onChange={(event) => setReview(event.target.value)}
          rows={4}
          placeholder="Optional review: punctuality, work quality, communication..."
          className="mb-5 block w-full rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Saving rating..." : "Submit Rating"}
        </button>
      </form>
    </div>
  );
};
