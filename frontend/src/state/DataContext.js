import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1, q: '' });
  const [loading, setLoading] = useState(false);

  // fetchItems accepts either an options object { page, limit, q, signal }
  // or an AbortSignal directly (for backward compatibility).
  const fetchItems = useCallback(async (opts) => {
    let page = 1;
    let limit = 10;
    let q = '';
    let signal;

    // Backwards-compatible: caller may pass an AbortSignal directly
    if (opts && typeof opts === 'object' && typeof opts.then !== 'function' && !(opts instanceof Array)) {
      // If it's an AbortSignal (native), it will have 'aborted' property and 'reason' in some envs
      if (opts && typeof opts.aborted === 'boolean' && typeof opts.constructor === 'function' && opts.constructor.name === 'AbortSignal') {
        signal = opts;
      } else {
        ({ page = 1, limit = 10, q = '', signal } = opts);
      }
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('limit', limit);
      params.set('page', page);
      if (q) params.set('q', q);

      const url = `http://localhost:3001/api/items?${params.toString()}`;
      const res = await fetch(url, signal ? { signal } : undefined);
      const json = await res.json();

      // Server responds with either the new paginated shape or older array shape.
      if (Array.isArray(json)) {
        setItems(json);
        setMeta({ total: json.length, page: 1, limit: json.length, totalPages: 1, q });
      } else {
        setItems(json.items || []);
        setMeta({
          total: json.total || 0,
          page: json.page || page,
          limit: json.limit || limit,
          totalPages: json.totalPages || 1,
          q: q || ''
        });
      }

      return json;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      throw err;
    }
    finally {
      setLoading(false);
    }
  }, []);

  return (
    <DataContext.Provider value={{ items, meta, fetchItems }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);