import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import client, { Tag } from '../../api/client';

interface TagFilterProps {
  onFilter: (selectedTags: string[]) => void;
}

export const TagFilter: React.FC<TagFilterProps> = ({ onFilter }) => {
  const { user } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      if (!user) return;
      try {
        const data = await client.getTags(user.id);
        setTags(data);
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, [user]);

  const handleTagToggle = (tagId: string) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter((id) => id !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newSelectedTags);
    onFilter(newSelectedTags);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>
    );
  }

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by tags:</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => handleTagToggle(tag.id)}
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
              selectedTags.includes(tag.id)
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {tag.name}
            <span className="ml-1 text-xs opacity-75">({tag.count})</span>
          </button>
        ))}
      </div>
    </div>
  );
}; 