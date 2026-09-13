import { Outlet, ScrollRestoration } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AiConciergeDrawer } from '../ai/AiConciergeDrawer';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AiConciergeDrawer />
      <ScrollRestoration />
    </div>
  );
}
