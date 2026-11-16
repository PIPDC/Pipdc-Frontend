import { Outlet, ScrollRestoration } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AiConciergeDrawer } from '../ai/AiConciergeDrawer';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white pb-12 sm:pb-9">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <div
        role="note"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-ink-900/90 px-4 py-2 text-center text-xs font-medium text-white backdrop-blur"
      >
        Portfolio demo project by Simon Agboji · Not affiliated with the Plateau State Government or the Plateau State
        Property Investment &amp; Development Company · All listings, agents and figures are sample data.
      </div>
      <AiConciergeDrawer />
      <ScrollRestoration />
    </div>
  );
}
