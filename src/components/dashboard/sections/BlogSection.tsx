import { useState } from 'react';
import { Plus, Globe, EyeOff, Search } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { BlogForm } from '../../forms/BlogForm';
import { useDeleteBlogPost, usePublishBlogPost, useUnpublishBlogPost } from '../../../hooks/mutations';
import { useAllBlogPosts } from '../../../hooks/queries';
import { formatDate } from '../../../utils/format';
import { extractApiError } from '../../../services/api';
import { useToast } from '../../ui/Toast';
import { CardTable, RowActions, LoadingRows, TableEmpty, thClass, tdClass, SectionFooter } from './shared';
import type { BlogPost } from '../../../types';

const PAGE_SIZE = 10;

export function BlogSection() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const blogQuery = useAllBlogPosts({ pageNumber: page, pageSize: PAGE_SIZE, keyword: keyword || undefined });
  const { notify } = useToast();
  const deletePost = useDeleteBlogPost();
  const publishPost = usePublishBlogPost();
  const unpublishPost = useUnpublishBlogPost();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState<BlogPost | null>(null);

  const posts = blogQuery.data?.items ?? [];
  const totalCount = blogQuery.data?.totalCount ?? 0;

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deletePost.mutateAsync(deleting.id);
      notify({ type: 'success', title: 'Post deleted', description: `"${deleting.title}" was removed.` });
      setDeleting(null);
    } catch (err) {
      notify({ type: 'error', title: 'Could not delete post', description: extractApiError(err) });
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      if (post.status === 'Published') {
        await unpublishPost.mutateAsync(post.id);
        notify({ type: 'success', title: 'Post unpublished', description: `"${post.title}" is now a draft.` });
      } else {
        await publishPost.mutateAsync(post.id);
        notify({ type: 'success', title: 'Post published', description: `"${post.title}" is now live.` });
      }
    } catch (err) {
      notify({ type: 'error', title: 'Could not update status', description: extractApiError(err) });
    }
  };

  return (
    <>
      <CardTable
        title="Blog Posts"
        actions={
          <Button variant="primary" size="sm" onClick={() => { setEditing(null); setFormOpen(true); }} leftIcon={<Plus className="h-4 w-4" />}>
            New Post
          </Button>
        }
      >
        <div className="flex items-center gap-3 border-b border-ink-100 px-4 py-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setKeyword(searchInput); } }}
              className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm text-ink-700 placeholder:text-ink-400 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/40"
            />
          </div>
        </div>
        {blogQuery.isLoading ? (
          <LoadingRows rows={5} />
        ) : posts.length === 0 ? (
          <TableEmpty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/60">
                  <th className={thClass}>Title</th>
                  <th className={thClass}>Category</th>
                  <th className={thClass}>Tags</th>
                  <th className={thClass}>Status</th>
                  <th className={thClass}>Published</th>
                  <th className={thClass}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-50">
                {posts.map((post) => (
                  <tr key={post.id} className="transition-colors hover:bg-ink-50/60">
                    <td className={tdClass}>
                      <span className="font-medium text-ink-900">{post.title}</span>
                      <span className="block text-xs text-ink-400">/{post.slug}</span>
                    </td>
                    <td className={tdClass}>
                      {post.categoryName ? <Badge tone="forest">{post.categoryName}</Badge> : <span className="text-xs text-ink-300">â€”</span>}
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.length > 0 ? post.tags.map((tag) => (
                          <Badge key={tag.id} tone="neutral">{tag.name}</Badge>
                        )) : <span className="text-xs text-ink-300">â€”</span>}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <Badge tone={post.status === 'Published' ? 'forest' : post.status === 'Draft' ? 'gold' : 'neutral'}>{post.status}</Badge>
                    </td>
                    <td className={tdClass}>{post.publishedAt ? formatDate(post.publishedAt) : 'â€”'}</td>
                    <td className={tdClass}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={publishPost.isPending || unpublishPost.isPending}
                          onClick={() => togglePublish(post)}
                          leftIcon={post.status === 'Published' ? <EyeOff className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                        >
                          {post.status === 'Published' ? 'Unpublish' : 'Publish'}
                        </Button>
                        <RowActions
                          viewUrl={`/blog/${post.slug}`}
                          onEdit={() => { setEditing(post); setFormOpen(true); }}
                          onDelete={() => setDeleting(post)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <SectionFooter pageNumber={page} pageSize={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
      </CardTable>

      <BlogForm open={formOpen} post={editing} onClose={() => { setFormOpen(false); setEditing(null); }} />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete post"
        description={`Are you sure you want to delete "${deleting?.title}"? This cannot be undone.`}
        confirmLabel="Delete post"
        loading={deletePost.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
