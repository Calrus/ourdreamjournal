import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dream } from '../../api/client';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { dreamService } from '../../services/dreamService';
import { Badge } from '../ui/badge';
import client from '../../api/client';

export function DreamList() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [dreamTags, setDreamTags] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const fetchDreams = async () => {
      if (!user) {
        setDreams([]);
        setIsLoading(false);
        return;
      }
      try {
        const data = await dreamService.listDreams(user.id);
        setDreams(data);
        const tagsMap: Record<string, string[]> = {};
        await Promise.all(
          data.map(async (dream) => {
            try {
              const tags = await client.getDreamTags(dream.id);
              tagsMap[dream.id] = tags;
            } catch {
              tagsMap[dream.id] = [];
            }
          })
        );
        setDreamTags(tagsMap);
      } catch (error) {
        console.error('Failed to fetch dreams:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDreams();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Button group for dashboard navigation */}
      <div className="flex items-center gap-4 mb-4">
        <Link
          to="/public-dreams"
          className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          View Public Dreams
        </Link>
        {/* Add more buttons here in the future */}
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Dreams</h1>
        <Link
          to="/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          New Dream
        </Link>
      </div>

      {(dreams || []).length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-medium">No dreams yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Start recording your dreams to see them here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(dreams || []).map((dream) => (
            <motion.div
              key={dream.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative rounded-lg border p-6 hover:border-primary"
            >
              <Link to={`/dreams/${dream.id}`}>
                <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-2">
                  {dream.text.length > 100 ? dream.text.slice(0, 100) + '...' : dream.text}
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(dreamTags[dream.id] || []).map((tag) => (
                    <Badge key={tag} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">{format(new Date(dream.createdAt), 'MMM d, yyyy h:mm a')}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
} 