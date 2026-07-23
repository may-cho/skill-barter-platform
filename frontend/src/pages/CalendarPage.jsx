import { useState, useEffect, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {api} from '../lib/api'
export default function CalendarPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [popover, setPopover] = useState(null); // { type, data, anchorRect }
  const token = localStorage.getItem('access_token');
  const scheduleBtnRef = useRef(null);
  const calendarRef = useRef(null);

  const fetchEvents = useCallback(() => {
    setLoading(true);

    api.getCalendarEvents().then(data => {
      console.log('Fetched events:', data); // Debugging log
    })
    // fetch('/api/proposals/calendar-events/', {
    //   headers: { Authorization: `Bearer ${token}` }
    // })
    //   .then(res => res.json())
    //   .then(data => {

    //     console.log('Fetched events:', data); // Debugging log
    //     // Ensure each event has extendedProps.proposal_id for drag‑and‑drop
    //     const mapped = data.map(event => ({
    //       ...event,
    //       extendedProps: {
    //         ...event.extendedProps,
    //         proposal_id: event.proposal_id || event.extendedProps?.proposal_id,
    //       },
    //     }));
    //     setEvents(mapped);
    //   })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleDateClick = (info) => {
    const rect = info.dayEl.getBoundingClientRect();
    setPopover({
      type: 'schedule',
      data: { prefillDate: info.dateStr },
      anchorRect: rect
    });
  };

  const handleEventClick = (info) => {
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
      anchorRect: rect
    });
  };

  const handleScheduleButtonClick = () => {
    const rect = scheduleBtnRef.current?.getBoundingClientRect();
    setPopover({
      type: 'schedule',
      data: { prefillDate: null },
      anchorRect: rect || { top: 100, left: 100, right: 200, bottom: 150 }
    });
  };

  const closePopover = () => setPopover(null);

  // Drag‑and‑drop: update event on the server
  const handleEventDrop = async (info) => {
    const { event } = info;
    const proposalId = event.extendedProps.proposal_id;
    if (!proposalId) {
      alert('Cannot reschedule: missing proposal ID');
      info.revert();
      return;
    }

    try {
      const res = await fetch(`/api/proposals/${proposalId}/schedule/`, {
        method: 'PATCH', // or PUT, adjust to your API
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scheduled_start: event.start.toISOString(),
          scheduled_end: event.end ? event.end.toISOString() : null,
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to update event');
      }
    } catch (error) {
      console.error(error);
      alert('Could not move the session. Reverting.');
      info.revert();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50 p-6">
      {/* Custom calendar styles */}
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
        .fc .fc-button-primary:not(:disabled).fc-button-active:focus {
          box-shadow: 0 0 0 0.2rem rgba(79,57,246,0.25);
        }
        .fc .fc-button-primary:focus {
          box-shadow: 0 0 0 0.2rem rgba(79,57,246,0.25);
        }
        .fc-timegrid-event {
          border-radius: 0.5rem !important;
          border: none !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }
        .fc-event {
          border-radius: 0.5rem;
          border: none;
          padding: 2px 6px;
          font-size: 0.8rem;
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
        /* Fade animations */
        .popover-fade-enter {
          opacity: 0;
        }
        .popover-fade-enter-active {
          opacity: 1;
          transition: opacity 0.2s ease-out;
        }
        .popover-fade-exit {
          opacity: 1;
        }
        .popover-fade-exit-active {
          opacity: 0;
          transition: opacity 0.2s ease-in;
        }
      `}</style>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-800 tracking-tight">Session Calendar</h1>
          <p className="text-slate-500 text-sm mt-1">Drag & drop to reschedule learning sessions</p>
        </div>
        <button
          ref={scheduleBtnRef}
          onClick={handleScheduleButtonClick}
          className="bg-[#4f39f6] hover:bg-[#3f2fd6] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm shadow-[#4f39f6]/20 hover:shadow-md"
        >
          + Schedule Session
        </button>
      </div>

      <div className="calendar-container bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-[#4f39f6] border-t-transparent" />
              <p className="mt-4 text-slate-400">Loading your calendar…</p>
            </div>
          </div>
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
            eventDurationEditable={false} // only move, no resize (set to true if you want resize)
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            height="100%"
            eventColor="#4f39f6"
            allDaySlot={false}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
          />
        )}
      </div>

      {/* Smart popover – top aligned, fade in/out */}
      {popover && (
        <Popover
          anchorRect={popover.anchorRect}
          onClose={closePopover}
        >
          {popover.type === 'event' ? (
            <EventDetailCard event={popover.data} onClose={closePopover} />
          ) : (
            <ScheduleForm
              prefillDate={popover.data.prefillDate}
              onClose={closePopover}
              onScheduled={() => {
                closePopover();
                fetchEvents();
              }}
              token={token}
            />
          )}
        </Popover>
      )}
    </div>
  );
}

/* ---------- Popover with top alignment + smooth fade ---------- */
function Popover({ anchorRect, onClose, children }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);
  const cardRef = useRef(null);
  const gap = 12;
  const viewportPadding = 16;

  useEffect(() => {
    if (!anchorRect || !cardRef.current) return;
    const card = cardRef.current.getBoundingClientRect();
    const cardWidth = card.width;
    const cardHeight = card.height;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let top = anchorRect.top;
    if (top + cardHeight > windowHeight - viewportPadding) {
      top = windowHeight - cardHeight - viewportPadding;
    }
    if (top < viewportPadding) {
      top = viewportPadding;
    }

    let left = anchorRect.right + gap;
    if (left + cardWidth > windowWidth - viewportPadding) {
      left = anchorRect.left - cardWidth - gap;
    }
    if (left < viewportPadding) {
      left = viewportPadding;
    }
    if (left + cardWidth > windowWidth - viewportPadding) {
      left = windowWidth - cardWidth - viewportPadding;
    }

    setPos({ top, left });
  }, [anchorRect, gap, viewportPadding]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onClose(), 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div
        ref={cardRef}
        style={{
          position: 'absolute',
          top: pos.top,
          left: pos.left,
          maxWidth: 'calc(100vw - 32px)',
        }}
        className="bg-white rounded-2xl shadow-2xl border border-gray-100"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- Event detail card ---------- */
function EventDetailCard({ event, onClose }) {
  return (
    <div className="p-5 min-w-[320px] max-w-sm">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-slate-800 text-lg leading-tight mr-3">{event.title}</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 -m-1 rounded-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414L10 8.586z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <div className="space-y-2 text-sm text-slate-600">
        <div className="flex gap-2">
          <span className="text-slate-400 min-w-[60px]">Starts</span>
          <span className="font-medium text-slate-700">{event.start?.toLocaleString()}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-slate-400 min-w-[60px]">Ends</span>
          <span className="font-medium text-slate-700">{event.end?.toLocaleString()}</span>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-slate-400 min-w-[60px]">Status</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#4f39f6]/10 text-[#4f39f6]">
            {event.status}
          </span>
        </div>
      </div>
      {event.meetingLink && (
        <a
          href={event.meetingLink}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#4f39f6] hover:text-[#3f2fd6] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Join meeting
        </a>
      )}
      <button
        onClick={onClose}
        className="mt-5 w-full py-2 rounded-xl border border-gray-200 text-sm text-slate-600 hover:bg-gray-50 transition-colors"
      >
        Close
      </button>
    </div>
  );
}

/* ---------- Schedule form ---------- */
function ScheduleForm({ prefillDate, onClose, onScheduled, token }) {
  const [proposals, setProposals] = useState([]);
  const [form, setForm] = useState({
    proposal_id: '',
    datetime: prefillDate || '',
    duration: 60,
    meeting_link: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/proposals/mine/', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setProposals(data.filter(p => p.status === 'accepted')));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const start = new Date(form.datetime);
    const end = new Date(start.getTime() + form.duration * 60000);

    await fetch(`/api/proposals/${form.proposal_id}/schedule/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
        meeting_link: form.meeting_link,
      }),
    });

    setSubmitting(false);
    onScheduled();
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 min-w-[320px] max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-slate-800">Schedule a session</h3>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 -m-1 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414L10 8.586z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Proposal</label>
          <select
            required
            value={form.proposal_id}
            onChange={e => setForm({ ...form, proposal_id: e.target.value })}
            className="w-full rounded-xl border-gray-200 bg-slate-50 p-2.5 text-sm focus:border-[#4f39f6] focus:ring-[#4f39f6]"
          >
            <option value="">Select a proposal</option>
            {proposals.map(p => (
              <option key={p.id} value={p.id}>
                #{p.id}: {p.skill_offered} ↔ {p.skill_wanted}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Date & Time</label>
          <input
            type="datetime-local"
            required
            value={form.datetime}
            onChange={e => setForm({ ...form, datetime: e.target.value })}
            className="w-full rounded-xl border-gray-200 bg-slate-50 p-2.5 text-sm focus:border-[#4f39f6] focus:ring-[#4f39f6]"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Duration (minutes)</label>
          <input
            type="number"
            value={form.duration}
            onChange={e => setForm({ ...form, duration: Number(e.target.value) })}
            className="w-full rounded-xl border-gray-200 bg-slate-50 p-2.5 text-sm focus:border-[#4f39f6] focus:ring-[#4f39f6]"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-1 block">Meeting Link (optional)</label>
          <input
            type="url"
            placeholder="https://meet.google.com/..."
            value={form.meeting_link}
            onChange={e => setForm({ ...form, meeting_link: e.target.value })}
            className="w-full rounded-xl border-gray-200 bg-slate-50 p-2.5 text-sm focus:border-[#4f39f6] focus:ring-[#4f39f6]"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-slate-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2.5 rounded-xl bg-[#4f39f6] hover:bg-[#3f2fd6] text-white text-sm font-medium transition-all disabled:opacity-60"
        >
          {submitting ? 'Scheduling…' : 'Schedule'}
        </button>
      </div>
    </form>
  );
}