import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Spinner, Button } from "../components/ui";
import { useAuth } from "../context/AuthContext";

function timeAgo(dateString) {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return `${interval} year${interval === 1 ? "" : "s"} ago`;
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return `${interval} month${interval === 1 ? "" : "s"} ago`;
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return `${interval} day${interval === 1 ? "" : "s"} ago`;
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return `${interval} hour${interval === 1 ? "" : "s"} ago`;
  interval = Math.floor(seconds / 60);
  if (interval >= 1)
    return `${interval} minute${interval === 1 ? "" : "s"} ago`;

  return "Just now";
}

export default function ReviewsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const proposalId = searchParams.get("proposal");

  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState(null);
  const [targetUserId, setTargetUserId] = useState(null);
  const [targetUserName, setTargetUserName] = useState("");
  const [targetUserReviews, setTargetUserReviews] = useState([]);

  // Form states
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (proposalId && user) {
      fetchProposalAndReviews();
    }
  }, [proposalId, user]);

  const fetchProposalAndReviews = async () => {
    try {
      setLoading(true);
      const [receivedData, givenData, proposalsData] = await Promise.all([
        api.json
          ? api.json("/reviews/received/")
          : api.getReviews("/reviews/received/"),
        api.json
          ? api.json("/reviews/given/")
          : api.getReviews("/reviews/given/"),
        api.getMyProposals(),
      ]);

      setReceivedReviews(receivedData.results || receivedData);
      setGivenReviews(givenData.results || givenData);

      const allProps = proposalsData.results || proposalsData;
      const currentProp = allProps.find(
        (p) => String(p.id) === String(proposalId),
      );

      if (currentProp) {
        setProposal(currentProp);

        const isSender = Number(currentProp.sender) === Number(user.id);
        const partnerId = isSender ? currentProp.receiver : currentProp.sender;
        const partnerName = isSender
          ? currentProp.receiver_name || "Partner"
          : currentProp.sender_name || "Partner";

        setTargetUserId(partnerId);
        setTargetUserName(partnerName);

        const token =
          localStorage.getItem("access_token") ||
          localStorage.getItem("token") ||
          localStorage.getItem("access");

        try {
          const response = await fetch(
            `/api/reviews/received/?user_id=${partnerId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
              },
            },
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reviewsData = await response.json();
          const fetchedList = reviewsData.results || reviewsData;
          setTargetUserReviews(Array.isArray(fetchedList) ? fetchedList : []);
        } catch (reviewErr) {
          console.error("Error fetching partner reviews:", reviewErr);
          setTargetUserReviews([]);
        }
      }
    } catch (err) {
      console.error("Failed to load review context:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!proposalId || !targetUserId) return;

    setSubmitting(true);
    try {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("access");
      const payload = {
        proposal: Number(proposalId),
        reviewee: Number(targetUserId),
        rating: Number(rating),
        comment: comment,
      };

      const response = await fetch("/api/reviews/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      alert("Review submitted successfully!");
      await fetchProposalAndReviews();

      setComment("");
      setRating("5");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner />
      </div>
    );

  const totalReviews = targetUserReviews.length || 1;
  const getRatingCount = (star) =>
    targetUserReviews.filter((r) => Number(r.rating) === star).length;

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = getRatingCount(star);
    const percentage = Math.round((count / totalReviews) * 100);
    return { star, count, percentage };
  });

  const averageRating = (
    targetUserReviews.reduce((acc, r) => acc + Number(r.rating), 0) /
    (targetUserReviews.length || 1)
  ).toFixed(1);

  const sortedReviews = [...targetUserReviews].sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-blue-600">
          Leave a Review{" "}
          <span className="text-slate-800 text-2xl font-semibold"></span>
        </h1>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="text-center md:text-left border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
          <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">
            {targetUserName}'s Rating
          </h3>
          <div className="text-4xl md:text-5xl font-black text-slate-900 mt-2">
            {targetUserReviews.length > 0 ? averageRating : "0.0"}
          </div>
          <p className="text-xs font-bold text-slate-400 mt-1">
            {targetUserReviews.length} total reviews
          </p>
        </div>

        <div className="md:col-span-2 space-y-2">
          {ratingBreakdown.map((item) => (
            <div
              key={item.star}
              className="flex items-center gap-3 text-xs font-bold text-slate-600"
            >
              <span className="w-12">{item.star} Star</span>
              <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              <span className="w-12 text-right text-blue-600">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {proposalId && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-slate-900">
            Write a Review for {targetUserName}
          </h2>

          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Rating (1-5)
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 bg-white focus:outline-blue-600"
              >
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Poor</option>
                <option value="1">1 - Terrible</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Comment
              </label>
              <textarea
                rows="4"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`Share your experience working with ${targetUserName}...`}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 font-medium text-slate-800 bg-white focus:outline-blue-600"
                required
              />
            </div>

            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </form>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            Reviews Received by {targetUserName} ({sortedReviews.length})
          </h2>
        </div>

        {sortedReviews.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center text-slate-400 shadow-sm">
            <p className="text-xl">📭</p>
            <p className="mt-2 text-sm font-bold">
              No reviews found for {targetUserName} yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedReviews.map((r, index) => (
              <div
                key={r.id || index}
                className="p-6 rounded-2xl bg-white border-2 border-blue-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative"
              >
                {index === 0 && (
                  <span className="absolute top-4 right-4 bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Latest
                  </span>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {r.reviewer_name || "Anonymous User"}
                      </h3>
                    </div>
                    <div className="flex flex-col items-end pt-1">
                      <div className="flex items-center bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100 shadow-xs">
                        <span className="text-amber-600 font-bold text-xs mr-1">
                          {r.rating}.0
                        </span>
                        <span className="text-amber-400 text-[10px]">
                          {"★".repeat(r.rating)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {r.comment && (
                    <p className="text-slate-700 text-sm font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      "{r.comment}"
                    </p>
                  )}
                </div>

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
