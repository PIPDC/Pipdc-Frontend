import { Link } from 'react-router-dom';
import { Newspaper, ArrowRight } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Badge } from '../../components/ui/Badge';
import { useBlogPosts } from '../../hooks/queries';
import { formatDate } from '../../utils/format';
import { PageLoader } from '../../components/ui/Spinner';

export function BlogPage() {
  const { data, isLoading, isError } = useBlogPosts();
  const posts = data?.items ?? [];

  return (
    <div className="section-pad bg-white">
      <Helmet>
        <title>Insights &amp; Resources — PIPDC Real Estate Demo</title>
        <meta name="description" content="Sample insights on real estate investment, legal guidance and market trends from this portfolio demo." />
      </Helmet>
      <div className="container-x">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-700">
            <Newspaper className="h-3.5 w-3.5" /> Insights
          </span>
          <h1 className="heading-2 mt-4">Guidance for buyers, sellers and investors</h1>
          <p className="mt-3 text-ink-500">Practical, plain-language guidance for buyers, sellers and investors.</p>
        </div>

        {isLoading ? (
          <PageLoader label="Loading insights" />
        ) : isError ? (
          <p className="mt-12 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            Could not load insights. Make sure the backend is running.
          </p>
        ) : posts.length === 0 ? (
          <p className="mt-12 text-sm text-ink-400">No insights have been published yet.</p>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                to={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  {post.coverImageUrl ? (
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-ink-50 text-ink-300">
                      <Newspaper className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2">
                    {post.categoryName ? <Badge tone="forest">{post.categoryName}</Badge> : <Badge tone="neutral">General</Badge>}
                    <span className="text-xs text-ink-400">{post.readMinutes} min read</span>
                  </div>
                  <h2 className="mt-3 font-display text-lg font-semibold leading-snug text-ink-900 line-clamp-2">{post.title}</h2>
                  <p className="mt-2 text-sm text-ink-500 line-clamp-2">{post.excerpt}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4 text-xs text-ink-400">
                    <span>PIPDC Demo</span>
                    <span>{post.publishedAt ? formatDate(post.publishedAt) : formatDate(post.createdAt)}</span>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-forest-600">
                    Read more <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
