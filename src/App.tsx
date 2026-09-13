import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider } from './contexts/AuthContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import { PublicLayout } from './components/layouts/PublicLayout';
import { AuthLayout } from './components/layouts/AuthLayout';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { RequireAuth } from './components/routing/RequireAuth';
import { RedirectIfAuthenticated } from './components/routing/RedirectIfAuthenticated';
import { AdminGuard } from './components/routing/AdminGuard';
import { StaffGuard } from './components/routing/StaffGuard';
import { HomePage } from './pages/home/HomePage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { PropertiesPage } from './pages/PropertiesPage';
import { PropertyDetailsPage } from './pages/PropertyDetailsPage';
import { AgentsPage } from './pages/AgentsPage';
import { AgentProfilePage } from './pages/AgentProfilePage';
import { BlogPage } from './pages/blog/BlogPage';
import { BlogDetailPage } from './pages/blog/BlogDetailPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { DevelopmentsPage } from './pages/DevelopmentsPage';
import { DevelopmentDetailsPage } from './pages/DevelopmentDetailsPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { DashboardSectionPage } from './pages/dashboard/DashboardSectionPage';
import { DevelopmentDetailPage } from './pages/dashboard/DevelopmentDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/properties', element: <PropertiesPage /> },
      { path: '/properties/:slug', element: <PropertyDetailsPage /> },
      { path: '/agents', element: <AgentsPage /> },
      { path: '/agents/:id', element: <AgentProfilePage /> },
      { path: '/blog', element: <BlogPage /> },
      { path: '/blog/:slug', element: <BlogDetailPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/developments', element: <DevelopmentsPage /> },
      { path: '/developments/:slug', element: <DevelopmentDetailsPage /> },
    ],
  },
  {
    element: (
      <RedirectIfAuthenticated>
        <AuthLayout />
      </RedirectIfAuthenticated>
    ),
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/verify-email', element: <VerifyEmailPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: (
      <RequireAuth>
        <PublicLayout />
      </RequireAuth>
    ),
    children: [{ path: '/assistant', element: <AiAssistantPage /> }],
  },
  {
    path: '/dashboard',
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      {
        path: 'properties',
        element: (
          <StaffGuard>
            <DashboardSectionPage section="properties" />
          </StaffGuard>
        ),
      },
      {
        path: 'agents',
        element: (
          <AdminGuard>
            <DashboardSectionPage section="agents" />
          </AdminGuard>
        ),
      },
      {
        path: 'locations',
        element: (
          <AdminGuard>
            <DashboardSectionPage section="locations" />
          </AdminGuard>
        ),
      },
      {
        path: 'enquiries',
        element: (
          <StaffGuard>
            <DashboardSectionPage section="enquiries" />
          </StaffGuard>
        ),
      },
      {
        path: 'my-enquiries',
        element: <DashboardSectionPage section="my-enquiries" />,
      },
      {
        path: 'messages',
        element: <DashboardSectionPage section="messages" />,
      },
      {
        path: 'blog',
        element: (
          <AdminGuard>
            <DashboardSectionPage section="blog" />
          </AdminGuard>
        ),
      },
      {
        path: 'users',
        element: (
          <AdminGuard>
            <DashboardSectionPage section="users" />
          </AdminGuard>
        ),
      },
      {
        path: 'settings',
        element: <DashboardSectionPage section="settings" />,
      },
      {
        path: 'saved',
        element: <DashboardSectionPage section="saved" />,
      },
      {
        path: 'developments',
        element: (
          <AdminGuard>
            <DashboardSectionPage section="developments" />
          </AdminGuard>
        ),
      },
      {
        path: 'developments/:projectId',
        element: (
          <AdminGuard>
            <DevelopmentDetailPage />
          </AdminGuard>
        ),
      },
      {
        path: 'tracked',
        element: <DashboardSectionPage section="tracked" />,
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

export default function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RealtimeProvider>
            <ToastProvider>
              <RouterProvider router={router} />
            </ToastProvider>
          </RealtimeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
