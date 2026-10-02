import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Flag, Send, ShieldAlert } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { useToast } from '../ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { useAgentReviews, useMyAgentReview, useSubmitAgentReport, useSubmitAgentReview } from '../../hooks/useAgentReports';
import {
  AGENT_REPORT_REASON_LABELS,
  type AgentReportReason,
} from '../../services/agentReportService';
import { extractApiError } from '../../services/api';
import type { Agent } from '../../types';

const REPORT_REASONS = Object.keys(AGENT_REPORT_REASON_LABELS) as AgentReportReason[];

const MIN_REPORT_LENGTH = 20;

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating out of 5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          onClick={() => onChange(n)}
          className="rounded p-1 transition-transform hover:scale-110"
        >
          <Star
            className={`h-6 w-6 ${n <= value ? 'fill-gold-400 text-gold-500' : 'text-ink-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

/**
 * Client trust signals for a public agent profile: the rating aggregate, the
 * review list, and the two write actions (review and report).
 *
 * Both write actions require authentication, and the API derives the reviewer and
 * reporter from the access token, so nothing here can act for another account.
 */
export function AgentFeedbackPanel({ agent }: { agent: Agent }) {
  const { isAuthenticated } = useAuth();
  const { notify } = useToast();

  const reviewsQuery = useAgentReviews(agent.id);
  const myReviewQuery = useMyAgentReview(isAuthenticated ? agent.id : null);
  const submitReview = useSubmitAgentReview();
  const submitReport = useSubmitAgentReport();

  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<AgentReportReason>('FraudOrScam');
  const [description, setDescription] = useState('');

  const reviews = reviewsQuery.data?.reviews ?? [];
  const existingReview = myReviewQuery.data;
  // The authoritative average comes from the agent projection; the summary
  // endpoint's average covers only the returned page, so it is not used here.
  const average = agent.averageRating;
  const reportTooShort = description.trim().length < MIN_REPORT_LENGTH;

  const openReview = () => {
    // Prefill from the caller's existing review so the form edits rather than
    // starts blank, matching the upsert semantics of the endpoint.
    setRating(existingReview?.rating ?? 0);
    setComment(existingReview?.comment ?? '');
    setReviewOpen(true);
  };

  const saveReview = async () => {
    try {
      await submitReview.mutateAsync({ agentId: agent.id, rating, comment: comment.trim() || null });
      notify({
        type: 'success',
        title: existingReview ? 'Review updated' : 'Review submitted',
        description: existingReview
          ? 'Your rating and comment were updated.'
          : 'Thanks — your rating now contributes to this agent’s average.',
      });
      setReviewOpen(false);
    } catch (err) {
      notify({ type: 'error', title: 'Could not submit review', description: extractApiError(err) });
    }
  };

  const sendReport = async () => {
    try {
      await submitReport.mutateAsync({ agentId: agent.id, reason, description: description.trim() });
      notify({
        type: 'success',
        title: 'Report received',
        description: 'Our team will review this report. You can track its status from your dashboard.',
      });
      setReportOpen(false);
      setDescription('');
    } catch (err) {
      notify({ type: 'error', title: 'Could not submit report', description: extractApiError(err) });
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-ink-900">Client reviews</h2>
          {average != null ? (
            <div className="mt-1.5 flex items-center gap-2">
              <span className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-4 w-4 ${
                      n <= Math.round(average) ? 'fill-gold-400 text-gold-500' : 'text-ink-300'
                    }`}
                  />
                ))}
              </span>
              <span className="text-sm font-semibold text-ink-900">{average.toFixed(1)}</span>
              <span className="text-sm text-ink-400">
                ({agent.reviewCount} {agent.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          ) : (
            <p className="mt-1.5 text-sm text-ink-400">No reviews yet.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAuthenticated ? (
            <Button variant="outline" size="sm" onClick={openReview}>
              {existingReview ? 'Edit your review' : 'Write a review'}
            </Button>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">Sign in to review</Button>
            </Link>
          )}
          {isAuthenticated && (
            <Button variant="ghost" size="sm" onClick={() => setReportOpen(true)}>
              <Flag className="h-4 w-4" /> Report this agent
            </Button>
          )}
        </div>
      </div>

      {reviewsQuery.isLoading ? (
        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-ink-100" />
          ))}
        </div>
      ) : reviewsQuery.isError ? (
        // Checked before the empty case on purpose. A failed request also leaves
        // reviews empty, and "No client has reviewed this agent yet. Be the first
        // to share your experience" would then be a lie told as a reassurance.
        <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-medium text-red-800">Reviews could not be loaded</p>
            <p className="mt-0.5 text-sm text-red-700">
              {extractApiError(reviewsQuery.error) || 'Please try again in a moment.'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto shrink-0"
            onClick={() => void reviewsQuery.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : reviews.length === 0 ? (
        <p className="mt-5 text-sm text-ink-500">
          No client has reviewed this agent yet. Be the first to share your experience.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-ink-50">
          {reviews.map((r) => (
            <li key={r.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-ink-900">{r.reviewerName}</span>
                <span className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`h-3.5 w-3.5 ${n <= r.rating ? 'fill-gold-400 text-gold-500' : 'text-ink-200'}`}
                    />
                  ))}
                </span>
                <span className="text-xs text-ink-400">
                  {new Date(r.updatedAt ?? r.createdAt).toLocaleDateString()}
                </span>
                {myReviewQuery.data?.id === r.id && (
                  <Badge tone="forest" className="ml-auto">Your review</Badge>
                )}
              </div>
              {r.comment && <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      {/* Review modal */}
      <Modal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title={existingReview ? 'Edit your review' : 'Review this agent'}
        size="md"
      >
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-ink-700">Your rating</label>
            <div className="mt-2">
              <StarPicker value={rating} onChange={setRating} />
            </div>
            {rating === 0 && <p className="mt-1.5 text-xs text-ink-400">Choose a rating from 1 to 5 stars.</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700" htmlFor="review-comment">
              Comment <span className="font-normal text-ink-400">(optional)</span>
            </label>
            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your experience with this agent?"
              className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-700 placeholder:text-ink-400 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/40"
            />
            <p className="mt-1.5 text-xs text-ink-400">
              Reviews are public and appear on this agent&apos;s profile.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-ink-100 pt-4">
            <Button variant="ghost" size="sm" onClick={() => setReviewOpen(false)} disabled={submitReview.isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={saveReview}
              disabled={submitReview.isPending || rating === 0}
            >
              {submitReview.isPending ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
              {existingReview ? 'Update review' : 'Submit review'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Report modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report this agent" size="md">
        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-lg border border-ink-100 bg-ink-50/60 p-4">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />
            <p className="text-sm text-ink-600">
              Reports go straight to the PIPDC moderation team. We will review the account and may suspend the
              agent. You can follow the outcome from your dashboard.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700" htmlFor="report-reason">
              What happened?
            </label>
            <select
              id="report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as AgentReportReason)}
              className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-700 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/40"
            >
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {AGENT_REPORT_REASON_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-ink-700" htmlFor="report-description">
              Details <span className="text-red-600">*</span>
            </label>
            <textarea
              id="report-description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, including dates and any messages exchanged."
              className="mt-1.5 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-700 placeholder:text-ink-400 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500/40"
            />
            <p className="mt-1.5 text-xs text-ink-400">
              {description.trim().length} characters. At least {MIN_REPORT_LENGTH} required.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-ink-100 pt-4">
            <Button variant="ghost" size="sm" onClick={() => setReportOpen(false)} disabled={submitReport.isPending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={sendReport}
              disabled={submitReport.isPending || reportTooShort}
            >
              {submitReport.isPending ? <Spinner size="sm" /> : <Flag className="h-4 w-4" />}
              Submit report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
