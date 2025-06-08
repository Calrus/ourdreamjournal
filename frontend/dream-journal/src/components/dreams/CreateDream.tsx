import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export function CreateDream() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [nightmareRating, setNightmareRating] = useState(5);
  const [vividnessRating, setVividnessRating] = useState(5);
  const [clarityRating, setClarityRating] = useState(5);
  const [emotionalIntensityRating, setEmotionalIntensityRating] = useState(5);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'tags'>('form');
  const [dreamId, setDreamId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);
  const [tagLoading, setTagLoading] = useState(false);
  const [tagGenError, setTagGenError] = useState<string | null>(null);

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
      const dream = await client.createDream({
        title,
        text: content,
        public: isPublic,
        nightmare_rating: nightmareRating,
        vividness_rating: vividnessRating,
        clarity_rating: clarityRating,
        emotional_intensity_rating: emotionalIntensityRating,
      });
      setTagLoading(true);
      setTagGenError(null);
      let aiTags: string[] = [];
      try {
        const tagResp = await axios.post(`/api/dreams/tags`, {
          title,
          text: content,
          public: isPublic,
          nightmare_rating: nightmareRating,
          vividness_rating: vividnessRating,
          clarity_rating: clarityRating,
          emotional_intensity_rating: emotionalIntensityRating,
        });
        aiTags = tagResp.data.tags || [];
      } catch (err) {
        setTagGenError('Failed to generate tags automatically. You can add tags manually.');
      }
      setTags(aiTags);
      setDreamId(dream.id);
      setStep('tags');
      setTagLoading(false);
      return;
    } catch (error) {
      console.error('Failed to create dream:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (!tag) return;
    if (tag.split(' ').length > 2) {
      setTagError('Tags must be 1-2 words.');
      return;
    }
    if (tags.includes(tag)) {
      setTagError('Tag already added.');
      return;
    }
    setTags([...tags, tag]);
    setNewTag('');
    setTagError(null);
  };
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  const handleConfirmTags = async () => {
    if (!dreamId) return;
    try {
      await axios.put(`/api/dreams/${dreamId}/tags`, { tags });
      navigate(`/dreams/${dreamId}`);
    } catch (err) {
      setTagError('Failed to save tags.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      {step === 'form' && (
        <>
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
            <div>
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
                id="private"
                checked={!isPublic}
                onChange={e => setIsPublic(!e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="private" className="text-sm">Mark as private</label>
            </div>
            <div className="flex items-center gap-2">
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
        </>
      )}
      {step === 'tags' && (
        <div className="space-y-6">
          {tagLoading ? (
            <div className="text-center py-8">Generating tags...</div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-4">Edit Tags</h2>
              {tagGenError && <div className="text-red-500 text-sm mb-2">{tagGenError}</div>}
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <span key={tag} className="bg-primary text-white px-3 py-1 rounded-full flex items-center gap-2">
                    {tag}
                    <button type="button" className="ml-1 text-white hover:text-red-300" onClick={() => handleRemoveTag(tag)}>&times;</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  placeholder="Add a tag (1-2 words)"
                  className="border rounded px-2 py-1"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                />
                <button type="button" className="bg-primary text-white px-3 py-1 rounded" onClick={handleAddTag}>Add</button>
              </div>
              {tagError && <div className="text-red-500 text-sm">{tagError}</div>}
              <div className="flex gap-2 mt-4">
                <button type="button" className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground" onClick={() => navigate('/dreams')}>Cancel</button>
                <button type="button" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90" onClick={handleConfirmTags}>Save Dream</button>
              </div>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
} 