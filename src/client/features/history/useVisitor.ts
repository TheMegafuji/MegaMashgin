import { useEffect, useState } from 'react';
import type { Visitor } from '../../../shared/discovery.js';
import { ensureVisitor, forgetVisitor } from '../../lib/api.js';
export function useVisitor() {
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  async function refresh() {
    setLoading(true);
    setError(false);
    try {
      setVisitor(await ensureVisitor());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  async function forget() {
    await forgetVisitor();
    setVisitor(null);
    await refresh();
  }
  return { visitor, error, loading, refresh, forget };
}
