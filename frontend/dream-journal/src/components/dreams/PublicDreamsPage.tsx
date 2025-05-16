import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { dreamService, Dream } from '../../services/dreamService';
import { format } from 'date-fns';
import { Tag as TagIcon, ArrowLeft } from 'lucide-react';
import { Avatar } from '../ui/avatar';
import client from '../../api/client';

export function PublicDreamsPage() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // Collect all tags from dreams
  const allTags = Array.from(new Set((dreams ?? []).flatMap((d) => d.tags || [])));

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredDreams = dreams.filter((dream) =>
    selectedTags.length === 0 || (dream.tags || []).some((tag) => selectedTags.includes(tag))
  );

  useEffect(() => {
    const fetchDreams = async () => {
      try {
        const data = await dreamService.listDreams(true); // publicOnly=true
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
      className="min-h-screen bg-background"
    >
      {/* Sticky Top Navigation Bar */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-border flex items-center px-4 py-3 mb-6 shadow-sm">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-primary hover:text-blue-600 transition px-2 py-1 rounded hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium hidden sm:inline">Back</span>
        </button>
        <h1 className="flex-1 text-center text-2xl sm:text-3xl font-bold tracking-tight text-primary">Public Dreams</h1>
        <div className="w-16" /> {/* Spacer for symmetry */}
      </div>
      {/* Tag Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-6 px-4">
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
      <div className="px-4">
        {(filteredDreams?.length ?? 0) === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <h3 className="text-lg font-medium">No public dreams yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              When users make their dreams public, you'll see them here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(filteredDreams ?? []).map((dream) => (
              <motion.div
                key={dream.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative rounded-xl border bg-white dark:bg-gray-900 shadow-md hover:shadow-lg transition p-5 flex flex-col min-h-[200px]"
              >
                <Link to={`/dreams/${dream.id}`} className="block h-full">
                  {/* Title as main heading */}
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar src={dream.profileImageURL} size={24} fallback={dream.displayName?.[0]?.toUpperCase() || dream.username?.[0]?.toUpperCase()} />
                    <Link to={`/users/${dream.username}`} className="text-sm font-semibold hover:underline">{dream.displayName || dream.username}</Link>
                  </div>
                  <h2 className="text-lg font-bold truncate">{dream.title || (dream.text.length > 40 ? dream.text.slice(0, 40) + '...' : dream.text)}</h2>
                  <p className="text-gray-900 dark:text-gray-100 text-base font-medium mb-2 line-clamp-3">
                    {dream.text.length > 180 ? dream.text.slice(0, 180) + '...' : dream.text}
                  </p>
                  {/* Tags row - below post, smaller */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(dream.tags || []).map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded text-xs font-medium">
                        <TagIcon className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-4">
                    <span className="text-xs text-muted-foreground">{format(new Date(dream.createdAt), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
} 