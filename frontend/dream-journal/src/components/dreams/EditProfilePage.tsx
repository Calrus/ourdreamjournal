import { useEffect, useState } from 'react';
import client from '../../api/client';
import { Avatar } from '../ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';

export function EditProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await client.getOwnProfile();
        setProfile(data);
      } catch {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await client.updateOwnProfile({
        displayName: profile.displayName,
        description: profile.description,
        profileImageURL: profile.profileImageURL,
      });
      setSuccess(true);
      setTimeout(() => navigate('/'), 1200);
    } catch {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]">Loading...</div>;
  if (!profile) return <div className="text-center mt-10">Profile not found.</div>;

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white dark:bg-gray-900 rounded-lg shadow p-8 relative">
      <button
        onClick={logout}
        className="absolute top-4 right-4 px-3 py-1 rounded bg-destructive text-white hover:bg-destructive/80 transition-colors"
      >
        Logout
      </button>
      <h1 className="text-2xl font-bold mb-6 text-center">Edit Profile</h1>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Avatar src={profile.profileImageURL} size={64} fallback={profile.displayName?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase()} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Display Name</label>
          <input
            type="text"
            className="w-full rounded border px-3 py-2"
            value={profile.displayName || ''}
            onChange={e => setProfile({ ...profile, displayName: e.target.value })}
            maxLength={32}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="w-full rounded border px-3 py-2"
            value={profile.description || ''}
            onChange={e => setProfile({ ...profile, description: e.target.value })}
            maxLength={160}
            rows={3}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Profile Image URL</label>
          <input
            type="url"
            className="w-full rounded border px-3 py-2"
            value={profile.profileImageURL || ''}
            onChange={e => setProfile({ ...profile, profileImageURL: e.target.value })}
            placeholder="https://..."
          />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">Profile updated!</div>}
        <div className="flex gap-2 justify-end">
          <button type="button" className="px-4 py-2 rounded border" onClick={() => navigate(-1)} disabled={saving}>Cancel</button>
          <button type="submit" className="px-4 py-2 rounded bg-primary text-white" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </div>
  );
} 