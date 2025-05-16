import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { dreamService, Dream } from '../../services/dreamService';
import { format } from 'date-fns';

export function PublicDreamsPage() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDreams = async () => {
      try {
        const data = await dreamService.listDreams('', true); // '' for userId, publicOnly=true
        setDreams(data ?? []);
      } catch (error) {
        console.error('Failed to fetch public dreams:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDreams();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Public Dreams</h1>
        <button
          onClick={() => navigate('/')}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Back to Dashboard
        </button>
      </div>
      {(dreams?.length ?? 0) === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-medium">No public dreams yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            When users make their dreams public, you'll see them here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(dreams ?? []).map((dream) => (
            <motion.div
              key={dream.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative rounded-lg border p-6 hover:border-primary"
            >
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                {dream.text}
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                {format(new Date(dream.createdAt), 'MMM d, yyyy h:mm a')}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
} 