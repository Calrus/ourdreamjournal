import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import client, { Dream } from '../../api/client';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { Tag as TagIcon, Trash, MoreVertical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function DreamDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dream, setDream] = useState<Dream | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showProphecy, setShowProphecy] = useState(false);
  const [prophecy, setProphecy] = useState<string | null>(null);
  const [isProphesizing, setIsProphesizing] = useState(false);
  const [prophecyError, setProphecyError] = useState<string | null>(null);
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    const fetchDream = async () => {
      try {
        const data = await client.getDream(id!);
        setDream(data);
      } catch (error) {
        console.error('Failed to fetch dream:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDream();
  }, [id, navigate]);

  useEffect(() => {
    async function fetchComments() {
      if (!dream) return;
      try {
        const res = await client.getComments(dream.id);
        setComments(res.comments || []);
      } catch {
        setComments([]);
      }
    }
    fetchComments();
  }, [dream]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !dream) return;
    setCommentLoading(true);
    try {
      await client.addComment(dream.id, commentText);
      setCommentText('');
      // Refresh comments
      const res = await client.getComments(dream.id);
      setComments(res.comments || []);
    } finally {
      setCommentLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dream) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-lg text-muted-foreground mb-4">Dream not found.</p>
        <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
      </div>
    );
  }

  const canDelete = user && (dream.userId === user.id || user.isAdmin);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto mt-10"
    >
      <div className="flex flex-col gap-4">
        {/* Summarize and Prophecy Buttons */}
        <div className="mb-4 flex gap-4">
          <Button
            className="w-fit px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            onClick={async () => {
              setIsSummarizing(true);
              setSummaryError(null);
              try {
                const s = await client.summarizeDream(dream.id);
                setSummary(s);
              } catch (e) {
                setSummaryError('Failed to summarize dream.');
              } finally {
                setIsSummarizing(false);
              }
            }}
            disabled={isSummarizing}
          >
            {isSummarizing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Summarizing...
              </span>
            ) : (
              'Summarize'
            )}
          </Button>
          <Button
            className="w-fit px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
            onClick={async () => {
              setIsProphesizing(true);
              setProphecyError(null);
              try {
                const p = await client.generateProphecy(dream.id);
                setProphecy(p);
                setShowProphecy(true);
              } catch (e) {
                setProphecyError('Failed to generate prophecy.');
              } finally {
                setIsProphesizing(false);
              }
            }}
            disabled={isProphesizing}
          >
            {isProphesizing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Prophesizing...
              </span>
            ) : (
              'Prophecy'
            )}
          </Button>
        </div>
        {/* Prophecy Error */}
        {prophecyError && (
          <div className="text-red-500 mt-2">{prophecyError}</div>
        )}
        {/* Summary Card */}
        {summary && (
          <Card className="mt-2 bg-gray-50 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base whitespace-pre-line">{summary}</p>
            </CardContent>
          </Card>
        )}
        {summaryError && (
          <div className="text-red-500 mt-2">{summaryError}</div>
        )}
      </div>
      <Card className="shadow-xl border bg-background mt-4">
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2 relative">
          <CardTitle className="text-2xl font-bold">Dream</CardTitle>
          {dream.public && <Badge variant="secondary">Public</Badge>}
          {canDelete && (
            <button
              className="absolute top-0 right-0 p-2 text-red-500 hover:text-red-700"
              title="Delete Dream"
              disabled={isDeleting}
              onClick={async () => {
                if (!window.confirm('Are you sure you want to delete this dream? This cannot be undone.')) return;
                setIsDeleting(true);
                try {
                  await client.deleteDream(dream.id);
                  alert('Dream deleted successfully.');
                  navigate('/');
                } catch (e) {
                  alert('Failed to delete dream.');
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              {isDeleting ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              ) : (
                <Trash className="w-5 h-5" />
              )}
            </button>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            {dream.createdAt ? format(new Date(dream.createdAt), 'MMM d, yyyy h:mm a') : ''}
          </p>
          <div className="prose prose-base dark:prose-invert max-w-none whitespace-pre-line mb-2">
            {dream.text}
          </div>
          {/* Ratings display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div>
              <span className="font-medium">Nightmare → Great Dream:</span>
              <span className="ml-2">{dream.nightmare_rating ?? '—'} / 10</span>
            </div>
            <div>
              <span className="font-medium">Vividness:</span>
              <span className="ml-2">{dream.vividness_rating ?? '—'} / 10</span>
            </div>
            <div>
              <span className="font-medium">Clarity:</span>
              <span className="ml-2">{dream.clarity_rating ?? '—'} / 10</span>
            </div>
            <div>
              <span className="font-medium">Emotional Intensity:</span>
              <span className="ml-2">{dream.emotional_intensity_rating ?? '—'} / 10</span>
            </div>
          </div>
          {/* Tags row */}
          {dream.tags && dream.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {dream.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                  <TagIcon className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
        </CardFooter>
      </Card>
      {/* Prophecy Modal */}
      <>
        <AnimatePresence initial={false}>
          {showProphecy ? (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 max-w-lg w-full relative"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  onClick={() => setShowProphecy(false)}
                  aria-label="Close"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <h2 className="text-2xl font-bold mb-4 text-center">Prophecy</h2>
                <p className="text-lg whitespace-pre-line text-center">{prophecy}</p>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </>
      {/* Comments Section */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Comments</h2>
        {comments.length === 0 ? (
          <div className="text-muted-foreground mb-4">No comments yet.</div>
        ) : (
          <div className="space-y-4 mb-4">
            {comments.map((c) => {
              const isOwnComment = user && c.user && c.user.id === user.id;
              return (
                <div key={c.id} className="border rounded p-3 flex items-start gap-3 relative group">
                  <img src={c.user.profile_image_url || ''} alt={c.user.display_name || c.user.username} className="w-8 h-8 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="font-bold text-sm flex items-center gap-2">
                      {c.user.display_name || c.user.username}
                    </div>
                    <div className="text-xs text-muted-foreground mb-1">{new Date(c.createdAt).toLocaleString()}</div>
                    <div className="text-base">{c.text}</div>
                  </div>
                  {isOwnComment && (
                    <div className="absolute top-2 right-2">
                      <button
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                        onClick={e => {
                          e.preventDefault();
                          const menu = document.getElementById(`comment-menu-${c.id}`);
                          if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                        }}
                        aria-label="Comment options"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      <div
                        id={`comment-menu-${c.id}`}
                        className="z-10 absolute right-0 mt-2 w-24 bg-white dark:bg-gray-800 border rounded shadow-lg hidden"
                        onMouseLeave={e => (e.currentTarget.style.display = 'none')}
                      >
                        <button
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
                          onClick={async () => {
                            if (!window.confirm('Delete this comment?')) return;
                            try {
                              await client.deleteComment(c.id);
                              // Refresh comments
                              const res = await client.getComments(dream.id);
                              setComments(res.comments || []);
                            } catch {
                              alert('Failed to delete comment.');
                            }
                            const menu = document.getElementById(`comment-menu-${c.id}`);
                            if (menu) menu.style.display = 'none';
                          }}
                        >
                          Delete
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                          disabled
                        >
                          Edit (coming soon)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {user && (
          <form onSubmit={handleAddComment} className="flex gap-2 items-center">
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="Add a comment..."
              disabled={commentLoading}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/80 disabled:opacity-50"
              disabled={commentLoading || !commentText.trim()}
            >
              {commentLoading ? 'Posting...' : 'Post'}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
} 