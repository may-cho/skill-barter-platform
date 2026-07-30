
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Card, Spinner } from '../components/ui';

export default function UserProfilePage() {
  const { id } = useParams(); // URL ထဲက user ID ကို ယူရန်
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    api.getUserProfile(id)
      .then(setUserProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;

  if (!userProfile) {
    return (
      <Card className="p-8 text-center text-slate-500">
        <p>User profile not found.</p>
        <Link to="/discover" className="text-indigo-600 font-medium mt-2 inline-block">Back to Discover</Link>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Back Button */}
      <Link to="/discover" className="text-sm font-medium text-indigo-600 hover:underline mb-4 inline-block">
        &larr; Back to Smart Matches
      </Link>

      <Card className="p-6">
        {/* Profile Header */}
        <div className="flex justify-between items-start border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{userProfile.username}'s Profile</h1>
            <p className="text-sm text-slate-500 mt-1">
              {userProfile.location || 'No location'} · {userProfile.timezone || 'No timezone'}
            </p>
          </div>
          <span className="bg-yellow-100 text-yellow-800 text-sm font-bold px-3 py-1 rounded-full">
            ⭐ {userProfile.overall_rating ? Number(userProfile.overall_rating).toFixed(1) : 'No rating'}
          </span>
        </div>

        {/* Bio Section */}
        <div className="mt-4">
          <h3 className="font-semibold text-slate-700 text-sm">Bio</h3>
          <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded mt-1">
            {userProfile.bio && userProfile.bio.trim() !== "" ? userProfile.bio : "No bio provided yet."}
          </p>
        </div>

        {/* 1. Skills & Proficiency Levels */}
        <div className="mt-6">
          <h3 className="font-semibold text-slate-700 text-sm mb-2">Skills & Proficiency Levels</h3>
          <div className="space-y-2">
            {userProfile.skills_detail?.length > 0 ? (
              userProfile.skills_detail.map((s, index) => (
                <div key={index} className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-200">
                  <div>
                    <span className="font-medium text-sm text-slate-800">{s.title}</span>
                    {s.category && <span className="text-xs text-slate-500 ml-2">({s.category})</span>}
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded font-medium">
                    {s.level}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded">No skills listed yet.</p>
            )}
          </div>
        </div>

        {/* 2. Recent Reviews Section */}
        <div className="mt-6">
          <h3 className="font-semibold text-slate-700 text-sm mb-2">Recent Reviews</h3>
          <div className="space-y-3">
            {userProfile.reviews?.length > 0 ? (
              userProfile.reviews.map((rev, idx) => (
                <div key={idx} className="bg-slate-50 p-3.5 rounded border border-slate-100 text-sm">
                  <p className="text-slate-800 font-medium">"{rev.comment}"</p>
                  <p className="text-xs text-slate-500 mt-1">
                    - {rev.partner_name} ({rev.skill_name}) · ⭐ {rev.rating}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded">No reviews yet.</p>
            )}
          </div>
        </div>

        {/* 3. Barter History Section */}
        <div className="mt-6">
          <h3 className="font-semibold text-slate-700 text-sm mb-2">Barter History (Completed Exchanges)</h3>
          <div className="space-y-3">
            {userProfile.barter_history?.length > 0 ? (
              userProfile.barter_history.map((hist, idx) => (
                <div key={idx} className="bg-slate-50 p-3.5 rounded border border-slate-100 text-sm flex justify-between items-center">
                  <div>
                    <p className="text-slate-800 font-medium">Exchanged with {hist.partner_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Taught: {hist.taught_skill} | Learned: {hist.learned_skill}</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded font-medium">
                    Completed
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 bg-slate-50 p-3 rounded">No completed exchanges yet.</p>
            )}
          </div>
        </div>

        {/* Action Footer */}

       {/* Action Footer */}
<div className="mt-8 pt-4 border-t flex justify-end">
  <Link
    to={`/proposals/new?user=${userProfile.id}`} // 👈 user_id အစား id သို့ ပြောင်းပါ
    className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
  >
    Send Barter Proposal &rarr;
  </Link>
</div>
      </Card>
    </div>
  );
}
