import React, { useEffect, useState } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';
import { FixedSizeList as List } from 'react-window';

function Items() {
  const { items, meta, loading, fetchItems } = useData();
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

  // Show a skeleton loader while fetching initial data
  if (loading && !items.length) {
    const skeletonCount = 8;
    return (
      <div aria-busy="true" aria-live="polite">
        <form onSubmit={handleSearch} style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Search..."
            value={q}
            onChange={e => setQ(e.target.value)}
            aria-label="Search items"
          />
          <button type="submit">Search</button>
        </form>
        <div style={{ border: '1px solid #eee', height: 400, width: '100%' }}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} style={{ height: 48, padding: '8px', boxSizing: 'border-box' }}>
              <div style={{ background: '#eee', height: 16, width: '40%', borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const handleSearch = e => {
    e.preventDefault();
    setPage(1);
    // fetch happens via effect
  };

  return (
    <div>
      <form onSubmit={handleSearch} style={{ marginBottom: 12 }}>
        <label htmlFor="items-search" style={{ display: 'none' }}>Search items</label>
        <input
          id="items-search"
          type="text"
          placeholder="Search..."
          value={q}
          onChange={e => setQ(e.target.value)}
          aria-label="Search items"
        />
        <button type="submit" aria-label="Search">Search</button>
      </form>

      {/* Virtualized list for large datasets. Each row is 48px high. */}
      <div style={{ border: '1px solid #eee', height: 400, width: '100%' }} role="list" aria-label="Items list">
        <List
          height={400}
          itemCount={items.length}
          itemSize={48}
          width="100%"
        >
          {({ index, style }) => {
            const item = items[index];
            return (
              <div
                role="listitem"
                style={{ ...style, display: 'flex', alignItems: 'center', padding: '0 8px', boxSizing: 'border-box' }}
                key={item.id}
              >
                <Link to={'/items/' + item.id}>{item.name}</Link>
              </div>
            );
          }}
        </List>
      </div>

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