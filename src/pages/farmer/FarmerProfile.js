// src/pages/farmer/FarmerProfile.js
import React, { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/config";
import { updateUser, getSubscription, activatePaidPlan } from "../../firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import { Button, Input, Card, Badge } from "../../components/UI";
import toast from "react-hot-toast";

export default function FarmerProfile() {
  const { userProfile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", address: "" });
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (userProfile) {
      setForm({ name: userProfile.name || "", address: userProfile.location?.address || "" });
    }
    if (userProfile?.id) {
      getSubscription(userProfile.id).then(setSubscription);
    }
  }, [userProfile]);

  const save = async () => {
    if (!form.name.trim()) { toast.error("Name required"); return; }
    setLoading(true);
    try {
      await updateUser(userProfile.id, {
        name: form.name.trim(),
        "location.address": form.address,
      });
      await refreshProfile();
      setEditing(false);
      toast.success("Profile updated!");
    } catch (e) {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  // Pro plan — payment not yet integrated
  const upgradePlan = () => {
    toast("Pro plan coming soon! We will notify you when it launches. 🚀", {
      icon: "🌟",
      duration: 4000,
    });
  };

  const isPaid = subscription && new Date(subscription.endDate) > new Date();
  const endDate = subscription ? new Date(subscription.endDate).toLocaleDateString("en-IN") : null;

  return (
    <div className="px-5 py-6 pb-28">
      <h1 className="text-xl font-black text-gray-800 mb-5">My Profile</h1>

      {/* Avatar + Name */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-3 shadow-lg shadow-green-200">
          <span className="text-3xl font-black text-white">
            {userProfile?.name?.[0]?.toUpperCase()}
          </span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">{userProfile?.name}</h2>
        <p className="text-gray-500 text-sm">{userProfile?.phone}</p>
        <div className="mt-2 flex gap-2">
          <Badge color="green">🌾 Farmer</Badge>
          {isPaid ? <Badge color="blue">⭐ Pro Plan</Badge> : <Badge color="gray">Free Plan</Badge>}
        </div>
      </div>

      {/* Edit Form */}
      {editing ? (
        <Card className="mb-4">
          <h3 className="font-bold text-gray-700 mb-3">Edit Profile</h3>
          <div className="space-y-3">
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Location / Address"
              value={form.address}
              onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
            />
            <div className="flex gap-2">
              <Button variant="secondary" size="md" onClick={() => setEditing(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={save} loading={loading} className="flex-1">
                Save
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mb-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Name</p>
              <p className="font-semibold text-gray-800">{userProfile?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="font-semibold text-gray-800">{userProfile?.phone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-semibold text-gray-800">{userProfile?.location?.address || "Not set"}</p>
            </div>
          </div>
          <Button variant="secondary" size="md" onClick={() => setEditing(true)} className="w-full mt-4">
            ✏️ Edit Profile
          </Button>
        </Card>
      )}

      {/* Subscription */}
      <Card className="mb-4">
        <h3 className="font-bold text-gray-700 mb-3">Subscription Plan</h3>
        {isPaid ? (
          <div>
            <div className="bg-blue-50 rounded-xl p-4 mb-3">
              <p className="font-bold text-blue-700">⭐ Pro Plan Active</p>
              <p className="text-blue-600 text-sm mt-1">Unlimited worker contacts</p>
              <p className="text-blue-500 text-xs mt-1">Valid until: {endDate}</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="font-bold text-gray-600 text-sm">Free</p>
                <p className="text-2xl font-black text-gray-800 mt-1">₹0</p>
                <ul className="text-xs text-gray-500 mt-2 space-y-1">
                  <li>• 5 contacts/month</li>
                  <li>• Basic search</li>
                </ul>
                <Badge color="gray" className="mt-2">Current Plan</Badge>
              </div>
              <div className="bg-green-50 border-2 border-green-400 rounded-xl p-3">
                <p className="font-bold text-green-700 text-sm">Pro</p>
                <p className="text-2xl font-black text-green-700 mt-1">₹99</p>
                <p className="text-xs text-green-600">per 2 months</p>
                <ul className="text-xs text-green-700 mt-2 space-y-1">
                  <li>• Unlimited contacts</li>
                  <li>• Priority search</li>
                </ul>
              </div>
            </div>
            <Button variant="primary" size="lg" onClick={upgradePlan}>
              &#127775; Upgrade to Pro (Coming Soon)
            </Button>
            <p className="text-xs text-gray-400 text-center mt-2">
              Payment integration launching soon
            </p>
          </div>
        )}
      </Card>

      <Button
        variant="danger"
        size="lg"
        onClick={() => signOut(auth)}>
        Logout / लॉग आउट
      </Button>
    </div>
  );
}