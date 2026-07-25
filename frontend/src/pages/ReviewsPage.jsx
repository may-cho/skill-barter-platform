import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Button, Card, Input, Spinner, Textarea } from '../components/ui';

// ရက်စွဲကို "1 day ago", "3 hours ago" စသည်ဖြင့် ပြောင်းပေးမည့် Helper Function
function timeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `${interval} year${interval === 1 ? '' : 's'} ago`;

  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `${interval} month${interval === 1 ? '' : 's'} ago`;

  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval} day${interval === 1 ? '' : 's'} ago`;

  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval} hour${interval === 1 ? '' : 's'} ago`;

  interval = Math.floor(seconds / 60);
  if (interval >= 1) return `${interval} minute${interval === 1 ? '' : 's'} ago`;

  return 'Just now';
}

export default function ReviewsPage() {
  const [searchParams] = useSearchParams();
  const preselectProposal = searchParams.get('proposal');

  const [activeTab, setActiveTab] = useState('received');
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [givenReviews, setGivenReviews] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    proposal: preselectProposal || '',
    rating: '5',
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [receivedData, givenData, proposalsData] = await Promise.all([
        api.json ? api.json('/reviews/received/') : api.getReviews('/reviews/received/'),
        api.json ? api.json('/reviews/given/') : api.getReviews('/reviews/given/'),
        api.getProposals()
      ]);

      setReceivedReviews(receivedData.results || receivedData);
      setGivenReviews(givenData.results || givenData);

      const allProps = proposalsData.results || proposalsData;
      setProposals(allProps.filter(p => p.status === 'Completed'));
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const proposalId = form.proposal || preselectProposal;

    if (!proposalId || isNaN(Number(proposalId))) {
      alert('Please select a valid completed proposal to review.');
      return;
    }

    setSubmitting(true);
    try {
      await api.createReview({
        proposal: Number(proposalId),
        rating: Number(form.rating),
        comment: form.comment,
      });
      setForm({ proposal: '', rating: '5', comment: '' });
      await fetchData();
      alert('Review submitted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Spinner />
    </div>
  );

  const reviewsToDisplay = activeTab === 'received' ? receivedReviews : givenReviews;

  const totalReviews = reviewsToDisplay.length || 1;
  const getRatingCount = (star) => reviewsToDisplay.filter(r => Number(r.rating) === star).length;

  const ratingBreakdown = [5, 4, 3, 2, 1].map(star => {
    const count = getRatingCount(star);
    const percentage = Math.round((count / totalReviews) * 100);
    return { star, count, percentage };
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-blue-600">
          Reviews & Reputation
        </h1>
        <p className="text-slate-600 max-w-lg mx-auto text-sm md:text-base font-medium">
          Reviews can only be submitted after a proposal is marked Completed.
        </p>
      </div>

      {/* Overall Ratings & Percentage Breakdown Section */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="text-center md:text-left border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
          <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">Overall Rating</h3>
          <div className="text-4xl md:text-5xl font-black text-slate-900 mt-2">
            {(reviewsToDisplay.reduce((acc, r) => acc + Number(r.rating), 0) / (reviewsToDisplay.length || 1)).toFixed(1)}
          </div>
          <p className="text-xs font-bold text-slate-400 mt-1">{reviewsToDisplay.length} total reviews</p>
        </div>

        <div className="md:col-span-2 space-y-2">
          {ratingBreakdown.map((item) => (
            <div key={item.star} className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <span className="w-12">{item.star} Star</span>
              <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              <span className="w-12 text-right text-blue-600">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leave a Review Card */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-5">
          Leave a Review
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!preselectProposal && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Select Completed Proposal</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all text-slate-700 text-sm outline-none font-medium"
                value={form.proposal}
                onChange={(e) => setForm({ ...form, proposal: e.target.value })}
                required
              >
                <option value="">-- Choose a completed proposal --</option>
                {proposals.map((p) => (
                  <option key={p.id} value={p.id}>
                    Proposal #{p.id} ({p.offered_skill_title} ↔ {p.requested_skill_title})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Input
              label="Rating (1-5)"
              type="number"
              min="1"
              max="5"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
              required
            />
          </div>

          <div>
            <Textarea
              label="Comment"
              placeholder="Share your experience working with this partner..."
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-sm text-sm"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>

      {/* Reviews Section with Tabs */}
      <div className="space-y-6">
        <div className="flex bg-slate-100 p-1.5 rounded-xl max-w-xs">
          <button
            type="button"
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-2 px-4 font-bold text-xs md:text-sm rounded-lg transition-all ${
              activeTab === 'received'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Received ({receivedReviews.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('given')}
            className={`flex-1 py-2 px-4 font-bold text-xs md:text-sm rounded-lg transition-all ${
              activeTab === 'given'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Given ({givenReviews.length})
          </button>
        </div>

        {reviewsToDisplay.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center text-slate-400 shadow-sm">
            <p className="text-xl">📭</p>
            <p className="mt-2 text-sm font-bold">No {activeTab} reviews found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviewsToDisplay.map((r) => (
              <div
                key={r.id}
                className="p-6 rounded-2xl bg-white border-2 border-blue-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Proposal # စာသားကို ဖြုတ်ပြီး အမည်နှင့် ကြယ်ပွင့်များကိုသာ ပြသထားသည် */}
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {activeTab === 'received' ? r.reviewer_name : r.reviewee_name}
                      </h3>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="flex items-center bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100 shadow-xs">
                        <span className="text-amber-600 font-bold text-xs mr-1">{r.rating}.0</span>
                        <span className="text-amber-400 text-[10px]">{'★'.repeat(r.rating)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Comment Box */}
                  {r.comment && (
                    <p className="text-slate-700 text-sm font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      "{r.comment}"
                    </p>
                  )}
                </div>

                {/* Review Date */}
                <div className="mt-6 pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-400">
                  <span>Review Date</span>
                  <span>{timeAgo(r.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}