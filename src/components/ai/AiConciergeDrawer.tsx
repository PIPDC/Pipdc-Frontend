import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { AiChatPanel } from './AiChatPanel';

export function AiConciergeDrawer() {
    const location = useLocation();
  const [open, setOpen] = useState(false);

  const hiddenRoute =
    location.pathname === '/assistant' ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/register');

  if (hiddenRoute) return null;

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
        className="fixed right-4 bottom-20 z-40 flex h-14 items-center gap-2.5 rounded-full bg-gradient-to-r from-forest-500 to-forest-600 py-1 pr-5 pl-2 shadow-lg shadow-forest-900/25"
        aria-label="Open PIPDC Concierge"
      >
        <span className="relative flex h-9 w-9 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/40" />
          <span className="relative flex h-full w-full items-center justify-center rounded-full bg-white/90 text-forest-600">
            <Sparkles className="h-4 w-4" />
          </span>
        </span>
        <span className="font-display text-sm font-semibold text-white">Ask Concierge</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-ink-900/30 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            >
              <div className="overflow-hidden rounded-t-3xl border-t border-ink-100 bg-white shadow-2xl shadow-ink-900/20">
                <div className="flex h-[78vh] max-h-[640px] flex-col">
                  <AiChatPanel embedded onClose={() => setOpen(false)} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
