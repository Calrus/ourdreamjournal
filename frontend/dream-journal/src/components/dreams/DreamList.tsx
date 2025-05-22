import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dream } from '../../api/client';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { dreamService } from '../../services/dreamService';
import { Tag as TagIcon } from 'lucide-react';
import { DreamCalendar } from '../stats/DreamCalendar';

export function DreamList() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // Collect all tags from dreams
  const allTags = Array.from(new Set((dreams ?? []).flatMap((d) => d.tags || [])));

  // Extract dream dates for the calendar
  const dreamDates = dreams.map((d) => d.createdAt.slice(0, 10));

  useEffect(() => {
    const fetchDreams = async () => {
      if (!user) {
        setDreams([]);
        setIsLoading(false);
        return;
      }
      try {
        const data = await dreamService.listDreams(undefined, user.id);
        setDreams((data ?? []).filter(d => d.userId === user.id));
      } catch (error) {
        console.error('Failed to fetch dreams:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDreams();
  }, [user]);

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredDreams = (dreams ?? []).filter((dream) =>
    selectedTags.length === 0 || (dream.tags || []).some((tag) => selectedTags.includes(tag))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dream Calendar */}
      {dreamDates.length > 0 && <DreamCalendar dreamDates={dreamDates} />}
      {/* Tag Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {allTags.map((tag) => (
          <button
            key={tag}
            className={`flex items-center gap-1 px-3 py-1 rounded-full border ${selectedTags.includes(tag) ? 'bg-primary text-white' : 'bg-background text-primary border-primary'} transition`}
            onClick={() => handleTagClick(tag)}
          >
            <TagIcon className="w-4 h-4" />
            {tag}
          </button>
        ))}
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

      {(filteredDreams || []).length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <h3 className="text-lg font-medium">No dreams yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Start recording your dreams to see them here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(filteredDreams || []).map((dream) => (
            <motion.div
              key={dream.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative rounded-lg border p-6 hover:border-primary"
            >
              <Link to={`/dreams/${dream.id}`}>
                {/* Title as main heading */}
                <h2 className="text-lg font-bold mb-2 truncate">{dream.title || (dream.text.length > 40 ? dream.text.slice(0, 40) + '...' : dream.text)}</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-2">
                  {dream.text.length > 100 ? dream.text.slice(0, 100) + '...' : dream.text}
                </p>
                {/* Tags row - below post, smaller */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {(dream.tags || []).map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded text-xs">
                      <TagIcon className="w-3 h-3" />
                      {tag}
                    </span>
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