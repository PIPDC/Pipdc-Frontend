import { useState } from 'react';
import { Mail, Phone, ShieldCheck } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { useSubmitContactPreference } from '../../hooks/mutations';
import { extractApiError } from '../../services/api';
import type { AiChatMessage, ConciergeContactPreference } from '../../types';

interface ContactPreferencePromptProps {
  /** Called with the assistant's confirmation message once the client answers. */
  onSubmitted?: (message: AiChatMessage) => void;
}

/**
 * The card shown when the concierge wants to hand a chat over but must first know
 * how the client wants to be contacted. Choosing a channel completes the handoff;
 * a fresh chat message cancels it.
 */
export function ContactPreferencePrompt({ onSubmitted }: ContactPreferencePromptProps) {
  const { notify } = useToast();
  const { user } = useAuth();
  const mutation = useSubmitContactPreference();
  const [showPhone, setShowPhone] = useState(false);
  const [phone, setPhone] = useState(user?.phoneNumber ?? '');

  const submit = (choice: ConciergeContactPreference) => {
    if (choice === 'EmailAndPhone' && phone.trim().length < 7) {
      notify({
        type: 'error',
        title: 'Phone number needed',
        description: 'Share a number the PIPDC team can reach you on.',
      });
      return;
    }

    mutation.mutate(
      { choice, phone: choice === 'EmailAndPhone' ? phone.trim() : undefined },
      {
        onError: (error) =>
          notify({ type: 'error', title: 'Could not hand you over', description: extractApiError(error) }),
        onSuccess: (data) => {
          if (data.assistantMessage) onSubmitted?.(data.assistantMessage);
        },
      },
    );
  };

  return (
    <div className="flex items-start gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-500 text-white">
        <ShieldCheck className="h-4 w-4" />
      </div>
      <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-ink-100 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-ink-800">A team member will follow up</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-500">
          I'll hand your request to the PIPDC team. How would you like them to contact you?
        </p>

        <div className="mt-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => submit('Email')}
            disabled={mutation.isPending}
            className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:border-forest-500 hover:text-forest-600 disabled:opacity-60"
          >
            <Mail className="h-4 w-4 text-forest-500" /> By email only
          </button>

          {showPhone ? (
            <div className="flex items-center gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +234 800 000 0000"
                autoComplete="tel"
                maxLength={32}
                className="h-11 min-w-0 flex-1 rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
              />
              <button
                type="button"
                onClick={() => submit('EmailAndPhone')}
                disabled={mutation.isPending}
                className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-forest-500 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-forest-600 disabled:opacity-60"
              >
                {mutation.isPending ? (
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  <Phone className="h-4 w-4" />
                )}
                Confirm
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowPhone(true)}
              className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:border-forest-500 hover:text-forest-600"
            >
              <Phone className="h-4 w-4 text-forest-500" /> By email and phone
            </button>
          )}
        </div>
      </div>
    </div>
  );
}