import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { api } from '../lib/api';

/* ===================================================================
   CUSTOM HOOKS
   ====
   =============================================================== */

function useCalendarEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCalendarEvents();
      const mapped = data.map(event => ({
        ...event,
        extendedProps: {
          ...event.extendedProps,
          proposal_id: event.proposal_id || event.extendedProps?.proposal_id,
        },
      }));
      setEvents(mapped);
    } catch (err) {
      setError(err.message || 'Failed to load calendar events');
      console.error('Calendar fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEventTimes = useCallback((eventId, start, end) => {
    setEvents(prev => prev.map(ev =>
      ev.id === eventId ? { ...ev, start, end } : ev
    ));
  }, []);

  return { events, loading, error, fetchEvents, updateEventTimes };
}

function useProposals(token) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch('/api/proposals/mine/', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to load proposals');
        return res.json();
      })
      .then(data => setProposals(data.filter(p => p.status === 'accepted')))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return { proposals, loading, error };
}

function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const show = useCallback((message, type = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    timerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const close = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  return { toast, show, close };
}

/* ===================================================================
   MAIN PAGE COMPONENT
   =================================================================== */

export default function CalendarPage() {
  const token = localStorage.getItem('access_token');
  const { events, loading, error, fetchEvents, updateEventTimes } = useCalendarEvents();
  const { toast, show: showToast, close: closeToast } = useToast();

  const [popover, setPopover] = useState(null);
  const scheduleBtnRef = useRef(null);
  const calendarRef = useRef(null);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  /* ---- Event interactions ---- */
  const handleDateClick = useCallback((info) => {
    const rect = info.dayEl.getBoundingClientRect();
    setPopover({
      type: 'schedule',
      data: { prefillDate: info.dateStr },
      anchorRect: rect,
      returnFocus: () => info.dayEl?.focus?.()
    });
  }, []);

  const handleEventClick = useCallback((info) => {
    const rect = info.el.getBoundingClientRect();
    setPopover({
      type: 'event',
      data: {
        id: info.event.id,
        title: info.event.title,
        start: info.event.start,
        end: info.event.end,
        status: info.event.extendedProps.status,
        meetingLink: info.event.extendedProps.meeting_link,
        proposalId: info.event.extendedProps.proposal_id,
      },
      anchorRect: rect,
      returnFocus: () => info.el?.focus?.()
    });
  }, []);

  const handleScheduleButtonClick = useCallback(() => {
    const rect = scheduleBtnRef.current?.getBoundingClientRect();
    const fallback = { top: 100, left: 100, right: 260, bottom: 150, width: 160, height: 50 };
    setPopover({
      type: 'schedule',
      data: { prefillDate: null },
      anchorRect: rect || fallback,
      returnFocus: () => scheduleBtnRef.current?.focus?.()
    });
  }, []);

  const closePopover = useCallback(() => {
    const returnFocus = popover?.returnFocus;
    setPopover(null);
    // Return focus after popover unmounts
    setTimeout(() => returnFocus?.(), 0);
  }, [popover]);

  /* ---- Drag & Drop with optimistic update ---- */
  const handleEventDrop = useCallback(async (info) => {
    const { event } = info;
    const proposalId = event.extendedProps.proposal_id;
    if (!proposalId) {
      showToast('Cannot reschedule: missing proposal ID', 'error');
      info.revert();
      return;
    }

    const originalStart = event.start;
    const originalEnd = event.end;

    // Optimistic UI update
    updateEventTimes(event.id, event.start, event.end);

    try {
      const res = await fetch(`/api/proposals/${proposalId}/schedule/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scheduled_start: event.start.toISOString(),
          scheduled_end: event.end ? event.end.toISOString() : null,
        }),
      });

      if (!res.ok) throw new Error('Failed to update event');
      showToast('Session rescheduled successfully');
    } catch (err) {
      console.error(err);
      showToast('Could not move the session. Reverting.', 'error');
      updateEventTimes(event.id, originalStart, originalEnd);
      info.revert();
    }
  }, [token, showToast, updateEventTimes]);

  /* ---- Helpers ---- */
  const getEventColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#4f39f6';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 p-4 md:p-6">
      <CalendarStyles />

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            Session Calendar
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#4f39f6]/10 text-[#4f39f6]">
              <HandIcon className="w-3 h-3" />
            </span>
            Drag & drop sessions to reschedule
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-slate-600 hover:bg-gray-50 hover:text-slate-800 transition-all disabled:opacity-50"
            title="Refresh calendar"
          >
            <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            ref={scheduleBtnRef}
            onClick={handleScheduleButtonClick}
            className="bg-[#4f39f6] hover:bg-[#3f2fd6] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm shadow-[#4f39f6]/20 hover:shadow-md active:scale-95 flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Schedule Session
          </button>
        </div>
      </header>

      {/* Calendar Container */}
      <div className="calendar-container bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex-1 min-h-[600px] relative">
        {error ? (
          <ErrorState message={error} onRetry={fetchEvents} />
        ) : loading && events.length === 0 ? (
          <CalendarSkeleton />
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay'
            }}
            events={events}
            editable={true}
            eventStartEditable={true}
            eventDurationEditable={false}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            height="100%"
            allDaySlot={false}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            nowIndicator={true}
            scrollTime="08:00:00"
            slotEventOverlap={false}
            eventDisplay="block"
            eventColor="#4f39f6"
            eventClassNames={(arg) => {
              const status = arg.event.extendedProps.status;
              return [`status-${status?.toLowerCase() || 'default'}`];
            }}
            eventContent={(arg) => (
              <div className="fc-custom-event">
                <div className="fc-custom-title">{arg.event.title}</div>
                <div className="fc-custom-time">{arg.timeText}</div>
              </div>
            )}
          />
        )}
      </div>

      {/* Popover Layer */}
      {popover && (
        <Popover anchorRect={popover.anchorRect} onClose={closePopover}>
          {popover.type === 'event' ? (
            <EventDetailCard
              event={popover.data}
              onClose={closePopover}
              eventColor={getEventColor(popover.data.status)}
            />
          ) : (
            <ScheduleForm
              prefillDate={popover.data.prefillDate}
              onClose={closePopover}
              onScheduled={() => {
                closePopover();
                fetchEvents();
                showToast('Session scheduled successfully');
              }}
              token={token}
            />
          )}
        </Popover>
      )}

      {/* Toast Layer */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </div>
  );
}

/* ===================================================================
   SUB-COMPONENTS
   =================================================================== */

function Popover({ anchorRect, onClose, children }) {
  const [pos, setPos] = useState({ top: 0, left: 0, placed: false });
  const [visible, setVisible] = useState(false);
  const cardRef = useRef(null);
  const contentRef = useRef(null);

  /* Positioning engine */
  useEffect(() => {
    if (!anchorRect || !cardRef.current) return;
    const card = cardRef.current.getBoundingClientRect();
    const gap = 12;
    const pad = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = anchorRect.top;
    let left = anchorRect.right + gap;

    // Horizontal: prefer right, fallback to left, then center
    if (left + card.width > vw - pad) {
      left = anchorRect.left - card.width - gap;
    }
    if (left < pad) {
      left = pad;
    }

    // Vertical: keep within viewport
    if (top + card.height > vh - pad) {
      top = vh - card.height - pad;
    }
    if (top < pad) top = pad;

    setPos({ top, left, placed: true });
  }, [anchorRect]);

  /* Entrance animation */
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  /* Focus trap + Escape key */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (pos.placed && contentRef.current) {
      const firstFocusable = contentRef.current.querySelector('button, [href], input, select, textarea');
      firstFocusable?.focus();
    }
  }, [pos.placed]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        ref={cardRef}
        style={{
          position: 'absolute',
          top: pos.top,
          left: pos.left,
          maxWidth: 'calc(100vw - 32px)',
          opacity: pos.placed ? 1 : 0,
        }}
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div ref={contentRef} className="outline-none">
          {children}
        </div>
      </div>
    </div>
  );
}

function EventDetailCard({ event, onClose, eventColor }) {
  const statusColors = {
    completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    scheduled: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  };
  const statusClass = statusColors[event.status?.toLowerCase()] || statusColors.scheduled;

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-5 min-w-[340px] max-w-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 mr-3">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: eventColor }} />
          <h3 className="font-semibold text-slate-800 text-lg leading-tight">{event.title}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 -m-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#4f39f6]/30"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex gap-3">
          <span className="text-slate-400 min-w-[60px] font-medium">Starts</span>
          <span className="text-slate-700 font-medium">{formatDate(event.start)}</span>
        </div>
        <div className="flex gap-3">
          <span className="text-slate-400 min-w-[60px] font-medium">Ends</span>
          <span className="text-slate-700 font-medium">{formatDate(event.end)}</span>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-slate-400 min-w-[60px] font-medium">Status</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ${statusClass}`}>
            {event.status || 'Scheduled'}
          </span>
        </div>
      </div>

      {event.meetingLink && (
        <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100">
          <a
            href={event.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#4f39f6] hover:text-[#3f2fd6] transition-colors"
          >
            <VideoIcon className="w-4 h-4" />
            Join meeting
            <ExternalLinkIcon className="w-3 h-3 opacity-60" />
          </a>
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <button
          onClick={onClose}
          className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function ScheduleForm({ prefillDate, onClose, onScheduled, token }) {
  const { proposals, loading: proposalsLoading, error: proposalsError } = useProposals(token);
  const [form, setForm] = useState({
    proposal_id: '',
    datetime: prefillDate ? `${prefillDate}T09:00` : '',
    duration: 60,
    meeting_link: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const durationPresets = [30, 60, 90, 120];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.proposal_id || !form.datetime) return;

    setSubmitting(true);
    const start = new Date(form.datetime);
    const end = new Date(start.getTime() + form.duration * 60000);

    try {
      const res = await fetch(`/api/proposals/${form.proposal_id}/schedule/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scheduled_start: start.toISOString(),
          scheduled_end: end.toISOString(),
          meeting_link: form.meeting_link || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to schedule session');
      onScheduled();
    } catch (err) {
      console.error(err);
      alert('Failed to schedule session. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 min-w-[360px] max-w-md">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-lg text-slate-800">Schedule a session</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 -m-1 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#4f39f6]/30"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Proposal Select */}
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Proposal</label>
          {proposalsLoading ? (
            <div className="h-10 rounded-xl bg-slate-50 border border-gray-200 animate-pulse" />
          ) : proposalsError ? (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{proposalsError}</div>
          ) : (
            <select
              required
              value={form.proposal_id}
              onChange={e => setForm(f => ({ ...f, proposal_id: e.target.value }))}
              className="w-full rounded-xl border-gray-200 bg-slate-50 p-2.5 text-sm focus:border-[#4f39f6] focus:ring-[#4f39f6] transition-shadow"
            >
              <option value="">Select a proposal</option>
              {proposals.map(p => (
                <option key={p.id} value={p.id}>
                  #{p.id}: {p.skill_offered} ↔ {p.skill_wanted}
                </option>
              ))}
            </select>
          )}
          {proposals.length === 0 && !proposalsLoading && (
            <p className="text-xs text-amber-600 mt-1.5">No accepted proposals available.</p>
          )}
        </div>

        {/* DateTime */}
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Date & Time</label>
          <input
            type="datetime-local"
            required
            value={form.datetime}
            onChange={e => setForm(f => ({ ...f, datetime: e.target.value }))}
            className="w-full rounded-xl border-gray-200 bg-slate-50 p-2.5 text-sm focus:border-[#4f39f6] focus:ring-[#4f39f6] transition-shadow"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Duration</label>
          <div className="flex gap-2 mb-2">
            {durationPresets.map(min => (
              <button
                key={min}
                type="button"
                onClick={() => setForm(f => ({ ...f, duration: min }))}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  form.duration === min
                    ? 'bg-[#4f39f6] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {min}m
              </button>
            ))}
          </div>
          <input
            type="number"
            min={15}
            step={5}
            value={form.duration}
            onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
            className="w-full rounded-xl border-gray-200 bg-slate-50 p-2.5 text-sm focus:border-[#4f39f6] focus:ring-[#4f39f6] transition-shadow"
          />
        </div>

        {/* Meeting Link */}
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
            Meeting Link <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="url"
            placeholder="https://meet.google.com/..."
            value={form.meeting_link}
            onChange={e => setForm(f => ({ ...f, meeting_link: e.target.value }))}
            className="w-full rounded-xl border-gray-200 bg-slate-50 p-2.5 text-sm focus:border-[#4f39f6] focus:ring-[#4f39f6] transition-shadow"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-slate-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !form.proposal_id || !form.datetime}
          className="flex-1 py-2.5 rounded-xl bg-[#4f39f6] hover:bg-[#3f2fd6] text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-[#4f39f6]/20"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Spinner className="w-4 h-4" />
              Scheduling…
            </span>
          ) : (
            'Schedule'
          )}
        </button>
      </div>
    </form>
  );
}

/* ===================================================================
   UI STATES & FEEDBACK
   =================================================================== */

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-sm px-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
          <AlertIcon className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-slate-800 font-semibold mb-1">Failed to load calendar</h3>
        <p className="text-slate-500 text-sm mb-4">{message}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-[#4f39f6] text-white text-sm font-medium hover:bg-[#3f2fd6] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#4f39f6] border-t-transparent" />
        <p className="mt-4 text-slate-400 text-sm font-medium animate-pulse">Loading your calendar…</p>
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }) {
  const isError = type === 'error';
  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-slide-up">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
        isError ? 'bg-red-50 border-red-200 text-red-800' : 'bg-slate-800 border-slate-700 text-white'
      }`}>
        {isError ? <AlertIcon className="w-4 h-4 shrink-0" /> : <CheckIcon className="w-4 h-4 shrink-0" />}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ===================================================================
  STYLES
   =================================================================== */

function CalendarStyles() {
  return (
    <style>{`
      :root {
        --fc-primary: #4f39f6;
        --fc-primary-hover: #3f2fd6;
      }
      .fc {
        font-family: inherit;
        --fc-border-color: #e8ecf1;
        --fc-today-bg-color: #f5f3ff;
        --fc-neutral-bg-color: #f8fafc;
        --fc-page-bg-color: #ffffff;
        --fc-button-bg-color: var(--fc-primary);
        --fc-button-border-color: var(--fc-primary);
        --fc-button-hover-bg-color: var(--fc-primary-hover);
        --fc-button-hover-border-color: var(--fc-primary-hover);
        --fc-button-active-bg-color: var(--fc-primary-hover);
        --fc-button-active-border-color: var(--fc-primary-hover);
      }
      .fc .fc-button-primary {
        border-radius: 0.625rem;
        padding: 0.5rem 0.875rem;
        font-size: 0.875rem;
        font-weight: 500;
        text-transform: capitalize;
      }
      .fc .fc-button-primary:not(:disabled).fc-button-active:focus,
      .fc .fc-button-primary:focus {
        box-shadow: 0 0 0 0.2rem rgba(79,57,246,0.25);
      }
      .fc-timegrid-event {
        border-radius: 0.5rem !important;
        border: none !important;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
        transition: transform 0.1s ease, box-shadow 0.1s ease;
      }
      .fc-timegrid-event:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(0,0,0,0.08);
        z-index: 10 !important;
      }
      .fc-event {
        border-radius: 0.5rem;
        border: none;
        padding: 2px 6px;
        font-size: 0.8rem;
      }
      .fc-custom-event {
        display: flex;
        flex-direction: column;
        gap: 1px;
        overflow: hidden;
      }
      .fc-custom-title {
        font-weight: 600;
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .fc-custom-time {
        font-size: 0.75rem;
        opacity: 0.85;
        font-weight: 500;
      }
      .calendar-container {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      .calendar-container .fc {
        flex: 1;
        min-height: 600px;
      }
      .fc .fc-timegrid-slot {
        height: 48px !important;
      }
      .fc .fc-col-header-cell {
        padding: 0.75rem 0;
        font-weight: 600;
        color: #475569;
      }
      .fc .fc-col-header-cell-cushion {
        text-decoration: none;
        color: inherit;
      }
      .fc .fc-timegrid-axis-frame {
        color: #94a3b8;
        font-size: 0.75rem;
        font-weight: 500;
      }
      /* Status-based event colors */
      .fc-event.status-completed { background-color: #10b981 !important; }
      .fc-event.status-cancelled { background-color: #ef4444 !important; }
      .fc-event.status-pending   { background-color: #f59e0b !important; }

      @keyframes slide-up {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .animate-slide-up {
        animation: slide-up 0.3s ease-out forwards;
      }
    `}</style>
  );
}

/* ===================================================================
ICONS
=================================================================== */

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function CloseIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function RefreshIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function HandIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
    </svg>
  );
}

function VideoIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function ExternalLinkIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function AlertIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function Spinner({ className }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}