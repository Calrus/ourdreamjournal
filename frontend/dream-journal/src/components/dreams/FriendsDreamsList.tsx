import { useEffect, useState } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';
import { format } from 'date-fns';

export function FriendsDreamsList() {
  const { user } = useAuth();
  const [dreams, setDreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDreams() {
      if (!user) return;
      setLoading(true);
      try {
        const res = await client.listFriendsDreams(user.id);
        setDreams(res.dreams || []);
      } finally {
        setLoading(false);
      }
    }
    fetchDreams();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>;
  }

  if (!dreams.length) {
    return <div className="text-center text-muted-foreground mt-10">No posts from friends yet.</div>;
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6">Friends' Posts</h1>
      {dreams.map((dream) => (
        <Card key={dream.id} className="p-4">
          <h3 className="font-bold text-lg mb-1">{dream.title || (dream.text.length > 40 ? dream.text.slice(0, 40) + '...' : dream.text)}</h3>
          <p className="text-sm text-muted-foreground mb-2">{dream.username} &middot; {dream.createdAt ? format(new Date(dream.createdAt), 'MMM d, yyyy h:mm a') : ''}</p>
          <p className="line-clamp-3 text-base">{dream.text.length > 180 ? dream.text.slice(0, 180) + '...' : dream.text}</p>
        </Card>
      ))}
    </div>
  );
} 