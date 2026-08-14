import { useEffect, useState } from "react";
import { Card, Button } from "../components/ui";
import { api, CATEGORIES, LEVELS, TIMEZONES } from "../lib/api";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);

  const [skills, setSkills] = useState({
    teach: [],
    learn: [],
  });

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // Profile Form
  const [form, setForm] = useState({
    bio: "",
    location: "",
    timezone: "UTC",
  });


  // Skill Modal
  const [showSkillModal, setShowSkillModal] = useState(false);

  const [skillForm, setSkillForm] = useState({
    id: null,
    type: "teach",
    title: "",
    category: CATEGORIES[0],
    experience_level: LEVELS[0],
    description: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const data = await api.getProfile();

      setProfile(data);

      setForm({
        bio: data.bio || "",
        location: data.location || "",
        timezone: data.timezone || "UTC",
      });

      const mySkills = await api.getMySkills();

      setSkills(mySkills);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    try {
      await api.updateProfile(form);

      const updated = await api.getProfile();

      setProfile(updated);

      setEditing(false);

    } catch (err) {
      alert(err.message);
    }
  }

  function openSkillModal(type, skill = null) {

    if (skill) {

      setSkillForm({
        id: skill.id,
        type: skill.type,
        title: skill.title,
        category: skill.category,
        experience_level: skill.experience_level,
        description: skill.description || "",
      });

    } else {

      setSkillForm({
        id: null,
        type,
        title: "",
        category: CATEGORIES[0],
        experience_level: LEVELS[0],
        description: "",
      });

    }

    setShowSkillModal(true);
  }

  async function saveSkill() {

    try {

      if (skillForm.id) {

        await api.updateSkill(skillForm.id, skillForm);

      } else {

        await api.createSkill(skillForm);

      }

      await loadProfile();

      setShowSkillModal(false);

    } catch (err) {

      alert(err.message);

    }

  }

  async function deleteSkill(id) {

    if (!window.confirm("Delete this skill?")) return;

    try {

      await api.deleteSkill(id);

      await loadProfile();

    } catch (err) {

      alert(err.message);

    }

  }

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    );
  }

  return (
  <div className="max-w-5xl mx-auto p-6 space-y-6">

    <h1 className="text-3xl font-bold">
      My Profile
    </h1>

    {/* Profile Header */}
    <Card className="p-6">

      <div className="flex gap-6 items-start">

        <img
          src={`https://ui-avatars.com/api/?name=${profile.username}&background=4F46E5&color=fff&size=120`}
          alt="Profile"
          className="w-28 h-28 rounded-full border"
        />

        <div className="flex-1">

          {!editing ? (

            <>
              <h2 className="text-2xl font-bold">
                {profile.username}
              </h2>

              <p className="text-gray-500">
                {profile.email}
              </p>

              <p className="mt-4">
                {profile.bio || "No bio yet."}
              </p>

              <div className="mt-4 space-y-1">

                <p>
                  <strong>Location:</strong>{" "}
                  {profile.location || "Not specified"}
                </p>

                <p>
                  <strong>Time Zone:</strong>{" "}
                  {profile.timezone}
                </p>

              </div>

              <Button
                className="mt-5"
                onClick={() => setEditing(true)}
              >
                Edit Profile
              </Button>

            </>

          ) : (

            <div className="space-y-4">

              <div>

                <label className="font-medium">
                  Bio
                </label>

                <textarea
                  rows={4}
                  className="w-full border rounded-lg p-2 mt-1"
                  value={form.bio}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bio: e.target.value,
                    })
                  }
                />

              </div>

              <div>

                <label className="font-medium">
                  Location
                </label>

                <input
                  className="w-full border rounded-lg p-2 mt-1"
                  value={form.location}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      location: e.target.value,
                    })
                  }
                />

              </div>

              <div>

                <label className="font-medium">
                  Time Zone
                </label>

                <select
                  className="w-full border rounded-lg p-2 mt-1"
                  value={form.timezone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      timezone: e.target.value,
                    })
                  }
                >
                  {TIMEZONES.map((tz) => (
                    <option
                      key={tz}
                      value={tz}
                    >
                      {tz}
                    </option>
                  ))}
                </select>

              </div>

              <div className="flex gap-3">

                <Button onClick={saveProfile}>
                  Save
                </Button>

                <Button
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>

              </div>

            </div>

          )}

        </div>

      </div>

    </Card>

    {/* Skills I Can Teach */}

    <Card className="p-6">

      <div className="flex justify-between items-center mb-5">

        <h2 className="text-xl font-bold text-green-700">
          Skills I Can Teach
        </h2>

        <Button
          onClick={() => openSkillModal("teach")}
        >
          + Add Skill
        </Button>

      </div>

      {skills.teach.length === 0 ? (

        <p className="text-gray-500">
          No teaching skills.
        </p>

      ) : (

        <div className="space-y-3">

          {skills.teach.map((skill) => (

            <div
              key={skill.id}
              className="border rounded-lg p-4 bg-green-50"
            >

              <h3 className="font-semibold">
                {skill.title}
              </h3>

              <p className="text-sm text-gray-500">
                {skill.category} • {skill.experience_level}
              </p>

              {skill.description && (
                <p className="mt-2">
                  {skill.description}
                </p>
              )}

              <div className="flex gap-2 mt-4">

                <Button
                  onClick={() =>
                    openSkillModal("teach", skill)
                  }
                >
                  Edit
                </Button>

                <Button
                  onClick={() =>
                    deleteSkill(skill.id)
                  }
                >
                  Delete
                </Button>

              </div>

            </div>

          ))}

        </div>

      )}

    </Card>

    {/* Skills I Want to Learn */}

    <Card className="p-6">

      <div className="flex justify-between items-center mb-5">

        <h2 className="text-xl font-bold text-blue-700">
          Skills I Want to Learn
        </h2>

        <Button
          onClick={() => openSkillModal("learn")}
        >
          + Add Skill
        </Button>

      </div>

      {skills.learn.length === 0 ? (

        <p className="text-gray-500">
          No learning skills.
        </p>

      ) : (

        <div className="space-y-3">

          {skills.learn.map((skill) => (

            <div
              key={skill.id}
              className="border rounded-lg p-4 bg-blue-50"
            >

              <h3 className="font-semibold">
                {skill.title}
              </h3>

              <p className="text-sm text-gray-500">
                {skill.category} • {skill.experience_level}
              </p>

              {skill.description && (
                <p className="mt-2">
                  {skill.description}
                </p>
              )}

              <div className="flex gap-2 mt-4">

                <Button
                  onClick={() =>
                    openSkillModal("learn", skill)
                  }
                >
                  Edit
                </Button>

                <Button
                  onClick={() =>
                    deleteSkill(skill.id)
                  }
                >
                  Delete
                </Button>

              </div>

            </div>

          ))}

        </div>

      )}
    </Card>

        {/* Add / Edit Skill Modal */}

    {showSkillModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

        <div className="bg-white rounded-xl p-6 w-full max-w-md">

          <h2 className="text-2xl font-bold mb-5">
            {skillForm.id ? "Edit Skill" : "Add Skill"}
          </h2>

          {/* Skill Title */}

          <div className="mb-4">
            <label className="font-medium">Skill Title</label>

            <input
              className="w-full border rounded-lg p-2 mt-1"
              value={skillForm.title}
              onChange={(e) =>
                setSkillForm({
                  ...skillForm,
                  title: e.target.value,
                })
              }
            />
          </div>

          {/* Category */}

          <div className="mb-4">
            <label className="font-medium">Category</label>

            <select
              className="w-full border rounded-lg p-2 mt-1"
              value={skillForm.category}
              onChange={(e) =>
                setSkillForm({
                  ...skillForm,
                  category: e.target.value,
                })
              }
            >
              {CATEGORIES.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Experience */}

          <div className="mb-4">
            <label className="font-medium">
              Experience Level
            </label>

            <select
              className="w-full border rounded-lg p-2 mt-1"
              value={skillForm.experience_level}
              onChange={(e) =>
                setSkillForm({
                  ...skillForm,
                  experience_level: e.target.value,
                })
              }
            >
              {LEVELS.map((level) => (
                <option
                  key={level}
                  value={level}
                >
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}

          <div className="mb-5">

            <label className="font-medium">
              Description
            </label>

            <textarea
              rows={4}
              className="w-full border rounded-lg p-2 mt-1"
              value={skillForm.description}
              onChange={(e) =>
                setSkillForm({
                  ...skillForm,
                  description: e.target.value,
                })
              }
            />

          </div>

          <div className="flex justify-end gap-3">

            <Button
              onClick={() => setShowSkillModal(false)}
            >
              Cancel
            </Button>

            <Button
              onClick={saveSkill}
            >
              {skillForm.id ? "Update Skill" : "Add Skill"}
            </Button>

          </div>

        </div>

      </div>
    )}

  </div>
);
}