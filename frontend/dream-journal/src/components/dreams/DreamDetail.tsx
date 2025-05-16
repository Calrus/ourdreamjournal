import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import client, { Dream } from '../../api/client';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { Tag as TagIcon, Trash } from 'lucide-react';
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

  const canDelete = user && dream.userId === user.id;

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
    </motion.div>
  );
} 