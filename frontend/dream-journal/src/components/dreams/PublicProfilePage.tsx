import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import client from '../../api/client';
import { Avatar } from '../ui/avatar';
import { Card } from '../ui/card';

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await client.getPublicProfile(username!);
        setProfile(data);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [username]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Loading...</div>;
  }
  if (!profile) {
    return <div className="text-center mt-10">User not found.</div>;
  }
  const { user, dreams } = profile;
  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div className="flex flex-col items-center mb-8">
        <Avatar src={user.profileImageURL} size={64} fallback={user.displayName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()} />
        <h1 className="text-2xl font-bold mt-2">{user.displayName || user.username}</h1>
        {user.description && <p className="text-muted-foreground mt-1 text-center">{user.description}</p>}
      </div>
      <h2 className="text-xl font-semibold mb-4">Public Dreams</h2>
      {dreams.length === 0 ? (
        <div className="text-center text-muted-foreground">No public dreams yet.</div>
      ) : (
        <div className="space-y-4">
          {dreams.map((dream: any) => (
            <Card key={dream.id} className="p-4">
              <h3 className="font-bold text-lg mb-1">{dream.title || (dream.text.length > 40 ? dream.text.slice(0, 40) + '...' : dream.text)}</h3>
              <p className="text-sm text-muted-foreground mb-2">{new Date(dream.createdAt).toLocaleString()}</p>
              <p className="line-clamp-3 text-base">{dream.text.length > 180 ? dream.text.slice(0, 180) + '...' : dream.text}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 