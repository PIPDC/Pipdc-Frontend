import { Building2, Users, MessageSquare, Newspaper, UserCircle, Settings, Heart, MessagesSquare, HardHat, Radar, MapPin, FileCheck2, Flag, Scale } from 'lucide-react';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { useAuth } from '../../contexts/AuthContext';
import { primaryRole } from '../../utils/roles';
import { PropertiesSection } from '../../components/dashboard/sections/PropertiesSection';
import { AgentsSection } from '../../components/dashboard/sections/AgentsSection';
import { EnquiriesSection } from '../../components/dashboard/sections/EnquiriesSection';
import { MyEnquiriesSection } from '../../components/dashboard/sections/MyEnquiriesSection';
import { MessagingSection } from '../../components/messaging/MessagingSection';
import { BlogSection } from '../../components/dashboard/sections/BlogSection';
import { UsersSection } from '../../components/dashboard/sections/UsersSection';
import { SettingsSection } from '../../components/dashboard/sections/SettingsSection';
import { SavedSection } from '../../components/dashboard/sections/SavedSection';
import { DevelopmentsSection } from '../../components/dashboard/sections/DevelopmentsSection';
import { TrackedDevelopmentsSection } from '../../components/dashboard/sections/TrackedDevelopmentsSection';
import { LocationsSection } from '../../components/dashboard/sections/LocationsSection';
import { ApplicationsSection } from '../../components/dashboard/sections/ApplicationsSection';
import { AppealsSection } from '../../components/dashboard/sections/AppealsSection';
import { MyAgentApplicationSection } from '../../components/dashboard/sections/MyAgentApplicationSection';
import { ReportsSection } from '../../components/dashboard/sections/ReportsSection';
import { MyReportsSection } from '../../components/dashboard/sections/MyReportsSection';

export type DashboardSection =
  | 'properties'
  | 'agents'
  | 'reports'
  | 'applications'
  | 'appeals'
  | 'my-agent-application'
  | 'enquiries'
  | 'my-enquiries'
  | 'my-reports'
  | 'messages'
  | 'blog'
  | 'users'
  | 'settings'
  | 'saved'
  | 'developments'
  | 'tracked'
  | 'locations';

const config: Record<DashboardSection, { title: string; description: string }> = {
  properties: { title: 'Properties', description: 'Manage all listings on the PIPDC portal.' },
  agents: { title: 'Agents', description: 'Manage verified PIPDC agents.' },
  reports: { title: 'Agent Reports', description: 'Triage reports raised by clients about agents.' },
  applications: { title: 'Agent Applications', description: 'Review applications to become a PIPDC agent.' },
  appeals: {
    title: 'Appeals & Bars',
    description: 'Decide registration appeals and manage accounts barred from applying.',
  },
  'my-agent-application': {
    title: 'My Agent Application',
    description: 'Track the status of your application to become a PIPDC agent.',
  },
  enquiries: { title: 'Enquiries', description: 'Review and respond to client enquiries.' },
  'my-enquiries': { title: 'My Enquiries', description: 'Enquiries you have submitted to agents.' },
  'my-reports': { title: 'My Reports', description: 'Reports you have raised about agents, and their outcomes.' },
  messages: { title: 'Messages', description: 'Conversations between clients and property agents.' },
  blog: { title: 'Blog', description: 'Publish insights and market updates.' },
  users: { title: 'Users', description: 'Manage user accounts and roles.' },
  settings: { title: 'Settings', description: 'Manage your profile and account.' },
  saved: { title: 'Saved Properties', description: 'Properties you have saved for later.' },
  developments: { title: 'Developments', description: 'Manage development projects and track construction progress.' },
  tracked: { title: 'Tracked Projects', description: 'Development projects you are tracking.' },
  locations: { title: 'Locations', description: 'Manage the location hierarchy used across properties and developments.' },
};

const agentDescriptions: Partial<Record<DashboardSection, string>> = {
  properties: 'Manage your listings on the PIPDC portal.',
  enquiries: 'Review and respond to enquiries on your properties.',
};

const sectionIcons: Record<DashboardSection, React.ReactNode> = {
  properties: <Building2 className="h-5 w-5" />,
  agents: <Users className="h-5 w-5" />,
  reports: <Flag className="h-5 w-5" />,
  applications: <FileCheck2 className="h-5 w-5" />,
  appeals: <Scale className="h-5 w-5" />,
  'my-agent-application': <FileCheck2 className="h-5 w-5" />,
  enquiries: <MessageSquare className="h-5 w-5" />,
  'my-enquiries': <MessageSquare className="h-5 w-5" />,
  'my-reports': <Flag className="h-5 w-5" />,
  messages: <MessagesSquare className="h-5 w-5" />,
  blog: <Newspaper className="h-5 w-5" />,
  users: <UserCircle className="h-5 w-5" />,
  settings: <Settings className="h-5 w-5" />,
  saved: <Heart className="h-5 w-5" />,
  developments: <HardHat className="h-5 w-5" />,
  tracked: <Radar className="h-5 w-5" />,
  locations: <MapPin className="h-5 w-5" />,
};

export function DashboardSectionPage({ section }: { section: DashboardSection }) {
  const c = config[section];
  const { user } = useAuth();
  const role = primaryRole(user?.roles);

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', to: '/dashboard' }, { label: c.title }]} />
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50 text-forest-600">{sectionIcons[section]}</span>
        <div>
          <h1 className="heading-3">{c.title}</h1>
          <p className="mt-1 text-sm text-ink-500">{role === 'Agent' ? (agentDescriptions[section] ?? c.description) : c.description}</p>
        </div>
      </div>

      {section === 'properties' && <PropertiesSection />}
      {section === 'agents' && <AgentsSection />}
      {section === 'reports' && <ReportsSection />}
      {section === 'applications' && <ApplicationsSection />}
      {section === 'appeals' && <AppealsSection />}
      {section === 'my-agent-application' && <MyAgentApplicationSection />}
      {section === 'enquiries' && <EnquiriesSection title={role === 'Agent' ? 'My Enquiries' : 'Enquiries by Agent'} />}
      {section === 'my-enquiries' && <MyEnquiriesSection />}
      {section === 'my-reports' && <MyReportsSection />}
      {section === 'messages' && <MessagingSection />}
      {section === 'blog' && <BlogSection />}
      {section === 'users' && <UsersSection />}
      {section === 'settings' && <SettingsSection />}
      {section === 'saved' && <SavedSection />}
      {section === 'developments' && <DevelopmentsSection />}
      {section === 'tracked' && <TrackedDevelopmentsSection />}
      {section === 'locations' && <LocationsSection />}
    </div>
  );
}
