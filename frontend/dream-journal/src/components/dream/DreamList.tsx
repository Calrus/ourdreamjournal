import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { dreamService, Dream } from '../../services/dreamService';
import DreamEntry from './DreamEntry';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';

const DreamList: React.FC = () => {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDreams = async () => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const fetchedDreams = await dreamService.listDreams(user.id);
      setDreams(fetchedDreams);
      setError(null);
    } catch (err) {
      setError('Failed to fetch dreams. Please try again later.');
      console.error('Error fetching dreams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDreams();
  }, [user]);

  const handleDelete = async (id: string) => {
    try {
      await dreamService.deleteDream(id);
      setDreams(dreams.filter(dream => dream.id !== id));
    } catch (err) {
      console.error('Error deleting dream:', err);
      setError('Failed to delete dream. Please try again later.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{user?.username}'s Dreams</h1>
        <Link to="/new">
          <Button>New Dream</Button>
        </Link>
      </div>

      {error && (
        <div className="text-center text-destructive p-4">
          <p>{error}</p>
          <Button
            variant="link"
            onClick={fetchDreams}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {!error && dreams.length === 0 && (
        <div className="text-center text-muted-foreground p-8 border rounded-lg">
          <p className="text-lg font-medium">No dreams recorded yet</p>
          <p className="text-sm mt-2">Start by recording your first dream!</p>
          <Link to="/new">
            <Button className="mt-4">Record Dream</Button>
          </Link>
        </div>
      )}

      {!error && dreams.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dreams.map((dream) => (
            <DreamEntry
              key={dream.id}
              {...dream}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DreamList; 