import { useState, useCallback } from 'react';
import client from '../api/client';

// Placeholder for a global toast (replace with your toast system if available)
function showToast(message: string) {
  window.alert(message);
}

export function useAI() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const summarizeDream = useCallback(async (id: string) => {
    setLoading('summarize');
    setError(null);
    try {
      return await client.summarizeDream(id);
    } catch (e: any) {
      setError('Failed to summarize dream.');
      showToast('Failed to summarize dream.');
      throw e;
    } finally {
      setLoading(null);
    }
  }, []);

  const generateProphecy = useCallback(async (id: string) => {
    setLoading('prophecy');
    setError(null);
    try {
      return await client.generateProphecy(id);
    } catch (e: any) {
      setError('Failed to generate prophecy.');
      showToast('Failed to generate prophecy.');
      throw e;
    } finally {
      setLoading(null);
    }
  }, []);

  const tagDream = useCallback(async (id: string) => {
    setLoading('tags');
    setError(null);
    try {
      return await client.getDreamTags(id);
    } catch (e: any) {
      setError('Failed to extract tags.');
      showToast('Failed to extract tags.');
      throw e;
    } finally {
      setLoading(null);
    }
  }, []);

  return {
    summarizeDream: { run: summarizeDream, loading: loading === 'summarize', error },
    generateProphecy: { run: generateProphecy, loading: loading === 'prophecy', error },
    tagDream: { run: tagDream, loading: loading === 'tags', error },
  };
} 