import { useState, useCallback } from 'react';
import { getSchemes } from '../api/schemesApi';

/**
 * Custom hook for fetching and filtering schemes
 */
export function useSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  const fetchSchemes = useCallback(async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const res = await getSchemes(params);
      setSchemes(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch {
      setError('Could not load schemes.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { schemes, loading, error, total, fetchSchemes };
}
