import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import client, { Stats, Dream } from '../../api/client';
import { Badge } from '../ui/badge';
import { DreamCalendar } from './DreamCalendar';

export const StatsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [dreamDates, setDreamDates] = useState<string[]>([]);
  const [dreamsLoading, setDreamsLoading] = useState(true);
  const [dreams, setDreams] = useState<Dream[]>([]);

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

  useEffect(() => {
    if (!user) return;
    setAiLoading(true);
    setAiError(null);
    fetch('/api/ai-insights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ userId: user.id }),
    })
      .then((res) => res.json())
      .then((data) => setAiInsights(data))
      .catch(() => setAiError('Failed to fetch AI insights.'))
      .finally(() => setAiLoading(false));
  }, [user]);

  useEffect(() => {
    const fetchDreams = async () => {
      if (!user) return;
      setDreamsLoading(true);
      try {
        const dreams: Dream[] = await client.getDreams();
        const userDreams = dreams.filter((d) => d.userId === user.id);
        setDreamDates(userDreams.map((d) => d.createdAt.slice(0, 10)));
        setDreams(userDreams);
      } catch (error) {
        setDreamDates([]);
        setDreams([]);
      } finally {
        setDreamsLoading(false);
      }
    };
    fetchDreams();
  }, [user]);

  // Aggregate ratings
  function avg(arr: (number | undefined)[]) {
    const nums = arr.filter((n): n is number => typeof n === 'number');
    if (!nums.length) return null;
    return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
  }
  const nightmareAvg = avg(dreams.map(d => d.nightmare_rating));
  const vividnessAvg = avg(dreams.map(d => d.vividness_rating));
  const clarityAvg = avg(dreams.map(d => d.clarity_rating));
  const emotionalAvg = avg(dreams.map(d => d.emotional_intensity_rating));

  // Simple histogram/bar for each rating (1-10)
  function ratingHistogram(key: keyof Dream) {
    const counts = Array(10).fill(0);
    dreams.forEach(d => {
      const val = d[key] as number | undefined;
      if (typeof val === 'number' && val >= 1 && val <= 10) counts[val - 1]++;
    });
    return (
      <div className="flex items-end gap-1 h-12 mt-2">
        {counts.map((count, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="bg-blue-500 dark:bg-blue-300 w-3" style={{ height: `${count * 8}px` }}></div>
            <span className="text-xs text-muted-foreground">{i + 1}</span>
          </div>
        ))}
      </div>
    );
  }

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

      {/* Dream Calendar */}
      {!dreamsLoading && dreamDates.length > 0 && (
        <DreamCalendar dreamDates={dreamDates} />
      )}

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

      {/* Ratings Averages and Histograms */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-medium mb-4">Dream Ratings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="font-semibold">Nightmare → Great Dream</div>
            <div className="text-2xl font-bold">{nightmareAvg ?? '—'}</div>
            {ratingHistogram('nightmare_rating')}
          </div>
          <div>
            <div className="font-semibold">Vividness</div>
            <div className="text-2xl font-bold">{vividnessAvg ?? '—'}</div>
            {ratingHistogram('vividness_rating')}
          </div>
          <div>
            <div className="font-semibold">Clarity</div>
            <div className="text-2xl font-bold">{clarityAvg ?? '—'}</div>
            {ratingHistogram('clarity_rating')}
          </div>
          <div>
            <div className="font-semibold">Emotional Intensity</div>
            <div className="text-2xl font-bold">{emotionalAvg ?? '—'}</div>
            {ratingHistogram('emotional_intensity_rating')}
          </div>
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

      {/* AI Insights Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">AI Insights</h2>
        {aiLoading && <div>Loading AI insights...</div>}
        {aiError && <div className="text-red-500">{aiError}</div>}
        {!aiLoading && !aiError && aiInsights.length > 0 && (
          <div className="space-y-6">
            {aiInsights.map((insight) => (
              <div key={insight.dreamId} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
                <div className="mb-2 text-base text-gray-700 dark:text-gray-200">
                  <span className="font-semibold">Summary:</span> {insight.summary}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {insight.tags.map((tag: string) => (
                    <Badge key={tag} className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {!aiLoading && !aiError && aiInsights.length === 0 && <div>No AI insights available.</div>}
      </div>
    </div>
  );
}; 