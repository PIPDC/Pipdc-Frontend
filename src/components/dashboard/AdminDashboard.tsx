import { Link } from 'react-router-dom';
import { Building2, Users, MessageSquare, UserCircle, Layers, FileText, Plus, Flag, ShieldAlert, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { StatCard } from './StatCard';
import { PropertyList } from './PropertyList';
import { EnquiryList } from './EnquiryList';
import { useAgentReports } from '../../hooks/useAgentReports';
import { AGENT_REPORT_REASON_LABELS, type AgentReportReason } from '../../services/agentReportService';
import type { AdminDashboard as AdminDashboardData } from '../../types';

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  // The moderation queue is a dashboard concern, so its depth is surfaced here
  // rather than only on the reports page. The request is admin-only, same as
  // the page it links to.
  // Every status, which is what omitting the filter means: the card counts all
  // submitted reports, not only the ones still awaiting triage.
  const openReportsQuery = useAgentReports({ pageSize: 5 });
  const reports = openReportsQuery.data?.items ?? [];
  const totalReports = openReportsQuery.data?.totalCount ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="heading-3">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-500">Welcome back. Here&rsquo;s what&rsquo;s happening at PIPDC today.</p>
        </div>
        <Link to="/dashboard/properties?new=1">
          <Button variant="primary" size="md" leftIcon={<Plus className="h-4 w-4" />}>
            Add Property
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Total Properties" value={data.totalProperties} icon={<Building2 className="h-5 w-5" />} index={0} />
        <StatCard label="Total Agents" value={data.totalAgents} icon={<Users className="h-5 w-5" />} index={1} tone="gold" />
        <StatCard label="Total Enquiries" value={data.totalEnquiries} icon={<MessageSquare className="h-5 w-5" />} index={2} tone="dark" />
        <StatCard label="Total Users" value={data.totalUsers} icon={<UserCircle className="h-5 w-5" />} index={3} tone="info" />
        <StatCard label="Development Projects" value={data.totalDevelopmentProjects} icon={<Layers className="h-5 w-5" />} index={4} tone="forest" />
        <StatCard label="Blog Posts" value={data.totalBlogPosts} icon={<FileText className="h-5 w-5" />} index={5} tone="gold" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <PropertyList
          title="Recent Properties"
          items={data.recentProperties}
          emptyMessage="No properties yet. Listings will appear here once added."
          viewAll={{ to: '/dashboard/properties', label: 'View all' }}
        />
        <EnquiryList
          title="Recent Enquiries"
          items={data.recentEnquiries}
          emptyMessage="No enquiries yet."
          showUnread
          viewAll={{ to: '/dashboard/enquiries', label: 'View all' }}
        />
      </div>

      {/* Agent trust and safety: reports awaiting moderation, plus agent
          ratings. Both are Batch 4 surfaces and were previously reachable only
          from the sidebar. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-900">
                <ShieldAlert className="h-5 w-5 text-gold-600" />
                Agent Reports
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                {totalReports === 0
                  ? 'No agent reports have been submitted.'
                  : `${totalReports} ${totalReports === 1 ? 'report' : 'reports'} submitted by clients.`}
              </p>
            </div>
            <Link to="/dashboard/reports">
              <Button variant="outline" size="sm" leftIcon={<Flag className="h-4 w-4" />}>
                Open moderation queue
              </Button>
            </Link>
          </div>

          {openReportsQuery.isLoading ? (
            <div className="mt-5 space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-ink-100" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <p className="mt-5 text-sm text-ink-500">
              Nothing to moderate. Client reports on agents will land here for triage.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-ink-50">
              {reports.map((r) => (
                <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink-900">{r.agentName}</span>
                    <span className="text-xs text-ink-400">
                      {AGENT_REPORT_REASON_LABELS[r.reason as AgentReportReason] ?? r.reason}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-600">{r.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-900">
                <Star className="h-5 w-5 text-gold-500" />
                Agent Reviews
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Client ratings on agent profiles. Open an agent to read or moderate reviews.
              </p>
            </div>
            <Link to="/dashboard/agents">
              <Button variant="outline" size="sm" leftIcon={<Users className="h-4 w-4" />}>
                Manage agents
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-sm text-ink-500">
            Reviews are shown on each agent&apos;s public profile. To suspend or reinstate an agent, use the
            Agents page.
          </p>
        </div>
      </div>
    </div>
  );
}
