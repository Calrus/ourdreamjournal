import { useEffect, useState } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/card';

export function FriendRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRequests() {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch all friend requests where the current user is the friend and status is 'pending'
        const res = await fetch(`/api/friends?pending_for=${user.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await res.json();
        setRequests(data.requests || []);
      } catch {
        setRequests([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, [user]);

  const handleAccept = async (fromUserId: string) => {
    if (!user) return;
    setAccepting(fromUserId);
    try {
      await client.acceptFriendRequest(fromUserId, user.id);
      setRequests((reqs) => reqs.filter((r) => r.id !== fromUserId));
    } finally {
      setAccepting(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6">Friend Requests</h1>
      {requests.length === 0 ? (
        <div className="text-center text-muted-foreground">No pending friend requests.</div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-bold">{req.username}</div>
                <div className="text-sm text-muted-foreground">{req.display_name}</div>
              </div>
              <button
                className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80 disabled:opacity-50"
                onClick={() => handleAccept(req.id)}
                disabled={accepting === req.id}
              >
                {accepting === req.id ? 'Accepting...' : 'Accept'}
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 