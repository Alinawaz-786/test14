import React, { useEffect, useState } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';

function Items() {
  const { items, meta, fetchItems } = useData();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const controller = new AbortController();

    fetchItems({ page, limit, q, signal: controller.signal }).catch(err => {
      if (err && err.name !== 'AbortError') console.error(err);
    });

    return () => controller.abort();
  }, [fetchItems, page, q]);

  if (!items.length) return <p>Loading...</p>;

  const handleSearch = e => {
    e.preventDefault();
    setPage(1);
    // fetch happens via effect
  };

  return (
    <div>
      <form onSubmit={handleSearch} style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Search..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      <ul>
        {items.map(item => (
          <li key={item.id}>
            <Link to={'/items/' + item.id}>{item.name}</Link>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 12 }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.page <= 1}>
          Previous
        </button>
        <span style={{ margin: '0 8px' }}>
          Page {meta.page} of {meta.totalPages}
        </span>
        <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={meta.page >= meta.totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}

export default Items;