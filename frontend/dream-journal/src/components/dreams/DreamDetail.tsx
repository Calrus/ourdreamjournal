import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import client, { Dream } from '../../api/client';

export function DreamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dream, setDream] = useState<Dream | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDream = async () => {
      try {
        const data = await client.getDream(id!);
        setDream(data);
      } catch (error) {
        console.error('Failed to fetch dream:', error);
        navigate('/dreams');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDream();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dream) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{dream.title}</h1>
        <button
          onClick={() => navigate('/dreams')}
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Back to Dreams
        </button>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <p className="text-sm text-muted-foreground mb-4">{dream.date}</p>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {dream.content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </motion.div>
  );
} 