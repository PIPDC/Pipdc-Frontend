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
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-ink-900/90 py-2 pl-4 pr-44 text-left text-[11px] font-medium leading-snug text-white backdrop-blur sm:px-4 sm:text-center sm:text-xs"
      >
        Portfolio demo by Simon Agboji · Not affiliated with the Plateau State Government or the real PIPDC · All
        data is sample data.
      </div>
      <AiConciergeDrawer />
      <ScrollRestoration />
    </div>
  );
}
