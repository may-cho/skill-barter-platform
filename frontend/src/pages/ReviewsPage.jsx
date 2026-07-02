import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Button, Card, Input, Spinner, Textarea } from '../components/ui';

export default function ReviewsPage() {
  const [searchParams] = useSearchParams();
  const preselectProposal = searchParams.get('proposal');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    proposal: preselectProposal || '',
    reviewee: '',
    rating: '5',
    comment: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getReviews()
      .then((data) => setReviews(data.results || data))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createReview({
        proposal: Number(form.proposal),
        reviewee: Number(form.reviewee),
        rating: Number(form.rating),
        comment: form.comment,
      });
      setForm({ proposal: '', reviewee: '', rating: '5', comment: '' });
      const data = await api.getReviews();
      setReviews(data.results || data);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reviews & Reputation</h1>
        <p className="text-slate-600 mt-1">
          Reviews can only be submitted after a proposal is marked Completed.
        </p>
      </div>

      <Card className="p-6 max-w-lg">
        <h2 className="font-semibold mb-4">Leave a Review</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Proposal ID" type="number" value={form.proposal} onChange={(e) => setForm({ ...form, proposal: e.target.value })} required />
          <Input label="Reviewee User ID" type="number" value={form.reviewee} onChange={(e) => setForm({ ...form, reviewee: e.target.value })} required />
          <Input label="Rating (1-5)" type="number" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} required />
          <Textarea label="Comment" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
          <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Review'}</Button>
        </form>
      </Card>

      <div>
        <h2 className="font-semibold mb-4">Your Reviews</h2>
        {reviews.length === 0 ? (
          <Card className="p-6 text-slate-500 text-sm">No reviews yet.</Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex justify-between">
                  <span className="font-medium">{r.reviewee_name}</span>
                  <span className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                {r.comment && <p className="text-sm text-slate-600 mt-2">{r.comment}</p>}
                <p className="text-xs text-slate-400 mt-2">Proposal #{r.proposal}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
