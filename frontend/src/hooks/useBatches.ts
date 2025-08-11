import { useState, useEffect } from 'react';
import { api } from '../api';

export function useBatches() {
  const [batches, setBatches] = useState<any[]>([]);
  useEffect(() => {
    api.get('/batches').then(res => setBatches(res.data));
  }, []);
  return { batches, setBatches };
}
