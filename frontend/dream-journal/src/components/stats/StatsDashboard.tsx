import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import client, { Stats } from '../../api/client';

export const StatsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const data = await client.getStats(user.id);
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dream Statistics</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-medium">Total Dreams</h3>
          <p className="mt-2 text-3xl font-bold">{stats.totalDreams}</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-medium">Public Dreams</h3>
          <p className="mt-2 text-3xl font-bold">{stats.publicDreams}</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-medium">Private Dreams</h3>
          <p className="mt-2 text-3xl font-bold">{stats.privateDreams}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-medium mb-4">Most Common Tags</h3>
        <div className="flex flex-wrap gap-2">
          {stats.mostCommonTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
            >
              {tag.name} ({tag.count})
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}; 