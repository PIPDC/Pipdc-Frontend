import { useMemo, useState } from 'react';
import { Search, AlertTriangle } from 'lucide-react';
import { useAgents } from '../hooks/queries';
import { AgentCard } from '../components/agent/AgentCard';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { SectionHeading } from '../components/ui/SectionHeading';
import { Input } from '../components/ui/Input';

export function AgentsPage() {
  const agentsQuery = useAgents();
  const [query, setQuery] = useState('');

  const agents = useMemo(() => {
    const all = agentsQuery.data?.items ?? [];
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        (a.title ?? '').toLowerCase().includes(q) ||
        a.agency.toLowerCase().includes(q),
    );
  }, [agentsQuery.data, query]);

  return (
    <div className="bg-ink-50 pb-20 pt-28 lg:pt-36">
      <div className="container-x">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Agents' }]} />
        <SectionHeading
          align="left"
          eyebrow="Agents"
          title="Agent profiles in the demo"
          description="Browse sample profiles with listings, contact options and client reviews."
        />

        <div className="mt-8 max-w-md">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <Input
              placeholder="Search agents by name, title or agency"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="mt-10">
          {agentsQuery.isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-96 animate-pulse rounded-2xl bg-ink-100" />
              ))}
            </div>
          ) : agentsQuery.isError ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
              <AlertTriangle className="h-6 w-6 text-gold-500" />
              <p className="text-sm text-ink-500">Could not load agents. Is the backend running?</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center text-sm text-ink-500">
              No agents match your search.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {agents.map((agent, idx) => (
                <AgentCard key={agent.id} agent={agent} index={idx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
