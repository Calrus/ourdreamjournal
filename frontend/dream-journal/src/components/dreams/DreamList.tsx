import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import client, { Dream } from '../../api/client';

export function DreamList() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDreams = async () => {
      try {
        const data = await client.getDreams();
        setDreams(data);
      } catch (error) {
        console.error('Failed to fetch dreams:', error);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Dreams</h1>
        <Link
          to="/create-dream"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New Dream
        </Link>
      </div>

      {dreams.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-medium">No dreams yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Start recording your dreams to see them here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {dreams.map((dream) => (
            <motion.div
              key={dream.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative rounded-lg border p-6 hover:border-primary"
            >
              <Link to={`/dreams/${dream.id}`}>
                <h2 className="text-xl font-semibold">{dream.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                  {dream.content}
                </p>
                <p className="mt-4 text-xs text-muted-foreground">{dream.date}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
} 