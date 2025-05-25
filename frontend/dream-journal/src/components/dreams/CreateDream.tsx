import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export function CreateDream() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [nightmareRating, setNightmareRating] = useState(5);
  const [vividnessRating, setVividnessRating] = useState(5);
  const [clarityRating, setClarityRating] = useState(5);
  const [emotionalIntensityRating, setEmotionalIntensityRating] = useState(5);
  const [ratingError, setRatingError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !user) return;
    // Validate ratings
    const ratings = [nightmareRating, vividnessRating, clarityRating, emotionalIntensityRating];
    if (ratings.some((r) => r < 1 || r > 10)) {
      setRatingError('All ratings must be between 1 and 10.');
      return;
    }
    setRatingError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const content = formData.get('content') as string;

    try {
      await client.createDream({
        title,
        text: content,
        public: isPublic,
        nightmare_rating: nightmareRating,
        vividness_rating: vividnessRating,
        clarity_rating: clarityRating,
        emotional_intensity_rating: emotionalIntensityRating,
      });
      navigate('/dreams');
    } catch (error) {
      console.error('Failed to create dream:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <h1 className="text-3xl font-bold mb-6">Record Your Dream</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Give your dream a title"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-2">
            Dream Content
          </label>
          <textarea
            id="content"
            name="content"
            required
            rows={10}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Describe your dream in detail..."
          />
        </div>

        {/* Ratings sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="nightmareRating" className="block text-sm font-medium mb-1">
              Nightmare → Great Dream
            </label>
            <input
              type="range"
              id="nightmareRating"
              min={1}
              max={10}
              value={nightmareRating}
              onChange={e => setNightmareRating(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Nightmare (1)</span>
              <span>Great (10)</span>
            </div>
            <div className="text-center text-sm font-semibold mt-1">{nightmareRating}</div>
          </div>
          <div>
            <label htmlFor="vividnessRating" className="block text-sm font-medium mb-1">
              Vividness
            </label>
            <input
              type="range"
              id="vividnessRating"
              min={1}
              max={10}
              value={vividnessRating}
              onChange={e => setVividnessRating(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Not vivid (1)</span>
              <span>Extremely vivid (10)</span>
            </div>
            <div className="text-center text-sm font-semibold mt-1">{vividnessRating}</div>
          </div>
          <div>
            <label htmlFor="clarityRating" className="block text-sm font-medium mb-1">
              Clarity
            </label>
            <input
              type="range"
              id="clarityRating"
              min={1}
              max={10}
              value={clarityRating}
              onChange={e => setClarityRating(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Foggy (1)</span>
              <span>Crystal clear (10)</span>
            </div>
            <div className="text-center text-sm font-semibold mt-1">{clarityRating}</div>
          </div>
          <div>
            <label htmlFor="emotionalIntensityRating" className="block text-sm font-medium mb-1">
              Emotional Intensity
            </label>
            <input
              type="range"
              id="emotionalIntensityRating"
              min={1}
              max={10}
              value={emotionalIntensityRating}
              onChange={e => setEmotionalIntensityRating(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Flat (1)</span>
              <span>Intense (10)</span>
            </div>
            <div className="text-center text-sm font-semibold mt-1">{emotionalIntensityRating}</div>
          </div>
        </div>
        {ratingError && <div className="text-red-500 text-sm">{ratingError}</div>}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="public"
            checked={isPublic}
            onChange={e => setIsPublic(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="public" className="text-sm">Make this dream public</label>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/dreams')}
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Dream'}
          </button>
        </div>
      </form>
    </motion.div>
  );
} 