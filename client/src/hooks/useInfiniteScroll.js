import { useEffect, useRef, useState } from 'react';

export function useInfiniteScroll(loadMore, options = {}) {
  const { disabled = false, rootMargin = '200px' } = options;

  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    if (disabled) return;
    if (!ref.current) return;

    const el = ref.current;

    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting) return;
        if (loading) return;
        if (!hasMore) return;

        setLoading(true);
        try {
          const more = await loadMore();
          setHasMore(Boolean(more));
        } finally {
          setLoading(false);
        }
      },
      { root: null, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [disabled, hasMore, loadMore, loading, rootMargin]);

  return { sentinelRef: ref, loading, hasMore, setHasMore, setLoading };
}
