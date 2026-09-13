import * as React from 'react';
import { addDays, addWeeks, format, isSameDay } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Language, Plan, PlanColor } from '../types';
import { subscribeSharedSchedule, SharedScheduleSnapshot } from '../lib/firebase';

const COLORS: Record<PlanColor, string> = {
  default: '#f8fafc', green: '#92D050', yellow: '#FFFF00', gray: '#7F7F7F',
  red: '#FF0000', blue: '#0070C0', pink: '#FF69B4',
};

const weekStartFromQuery = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const sharedLabels: Record<Language, { week: string; time: string; task: string; hours: string; loading: string; missing: string; loadError: string; invalid: string; readOnly: string; backToApp: string; downloadPdf: string; pdfFile: string; creator: string; createdAt: string; expiresAt: string }> = {
  en: { week: 'Week', time: 'Time', task: 'Task', hours: 'h', loading: 'Loading shared schedule...', missing: 'This share link does not exist or has been deleted.', loadError: 'Unable to load the shared schedule.', invalid: 'The shared schedule data is invalid.', readOnly: 'Read-only shared schedule', backToApp: 'Back to app', downloadPdf: 'Download PDF', pdfFile: 'task2goal-weeks', creator: 'Created by', createdAt: 'created at', expiresAt: 'link expires at' },
  vi: { week: 'Tuần', time: 'Giờ', task: 'Nhiệm vụ', hours: 'giờ', loading: 'Đang tải lịch được chia sẻ...', missing: 'Link chia sẻ không tồn tại hoặc đã bị xóa.', loadError: 'Không thể tải lịch được chia sẻ.', invalid: 'Dữ liệu lịch không hợp lệ.', readOnly: 'Lịch được chia sẻ ở chế độ chỉ xem', backToApp: 'Quay lại ứng dụng', downloadPdf: 'Tải PDF', pdfFile: 'task2goal-tuan', creator: 'Người tạo', createdAt: 'tạo lúc', expiresAt: 'liên kết sẽ hết hạn vào' },
};

function SharedWeekPage({ weekStart, plans, startHour, endHour, language }: { weekStart: Date; plans: Plan[]; startHour: number; endHour: number; language: Language }) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index);
  const labels = sharedLabels[language];
  const locale = language === 'vi' ? vi : enUS;
  const dateFormat = language === 'vi' ? 'd/M/yyyy' : 'MMM d, yyyy';
  const shortDateFormat = language === 'vi' ? 'd/M' : 'MMM d';

  return (
    <section className="shared-week-page">
      <header className="shared-week-title">
        <h2>{labels.week} {format(weekStart, 'w', { locale })}</h2>
        <p>{format(weekStart, dateFormat, { locale })} - {format(addDays(weekStart, 6), dateFormat, { locale })}</p>
      </header>
      <table>
        <thead>
          <tr>
            <th className="shared-time-column">{labels.time}</th>
            {days.map((day) => <th key={day.toISOString()}>{format(day, 'EEEE', { locale })}<small>{format(day, shortDateFormat, { locale })}</small></th>)}
          </tr>
        </thead>
        <tbody>
          {hours.map((hour) => (
            <tr key={hour}>
              <td className="shared-time-column">{hour}:00</td>
              {days.map((day) => {
                const plan = plans.find((item) => isSameDay(new Date(item.date), day) && item.startHour === hour);
                const occupied = plans.some((item) => isSameDay(new Date(item.date), day) && item.startHour < hour && item.startHour + item.duration > hour);
                if (occupied) return null;
                return <td key={`${day.toISOString()}-${hour}`} rowSpan={plan?.duration || 1} style={plan ? { backgroundColor: COLORS[plan.color] } : undefined}>
                  {plan && <><strong>{plan.title || labels.task}</strong>{plan.duration > 1 && <small>{plan.duration}{labels.hours}</small>}</>}
                </td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function SharedScheduleView({ shareId }: { shareId: string }) {
  const [snapshot, setSnapshot] = React.useState<SharedScheduleSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const pagesRef = React.useRef<HTMLDivElement>(null);
  const pdfCreatorRef = React.useRef<HTMLSpanElement>(null);
  const fallbackLanguage: Language = typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('vi') ? 'vi' : 'en';
  const fallbackLabels = sharedLabels[fallbackLanguage];

  React.useEffect(() => {
    const unsubscribe = subscribeSharedSchedule(shareId, (value) => {
      if (!value) setError('missing');
      setSnapshot(value);
      setLoading(false);
    }, () => {
      setError('loadError');
      setLoading(false);
    });
    return unsubscribe;
  }, [shareId]);

  const downloadPdf = async () => {
    if (!pagesRef.current || !snapshot) return;
    const pages = Array.from(pagesRef.current.querySelectorAll<HTMLElement>('.shared-week-page'));
    let creatorDataUrl: string | null = null;
    if (pdfCreatorRef.current) {
      try {
        creatorDataUrl = await toPng(pdfCreatorRef.current, { pixelRatio: 2, cacheBust: true, backgroundColor: '#fff' });
      } catch (error) {
        console.warn('Unable to render creator line in PDF:', error);
      }
    }
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    for (const [index, page] of pages.entries()) {
      const dataUrl = await toPng(page, { pixelRatio: 2, cacheBust: true, backgroundColor: '#fff' });
      if (index > 0) pdf.addPage('a4', 'landscape');
      pdf.addImage(dataUrl, 'PNG', 8, 8, 281, 194);
      if (creatorDataUrl) {
        pdf.addImage(creatorDataUrl, 'PNG', 210, 203, 79, 5);
      }
    }
    pdf.save(`${sharedLabels[snapshot.language].pdfFile}-${snapshot.startWeek}-${snapshot.endWeek}.pdf`);
  };

  if (loading) return <div className="shared-state"><Loader2 className="animate-spin" /> {fallbackLabels.loading}</div>;
  if (error || !snapshot) return <div className="shared-state"><p>{error === 'loadError' ? fallbackLabels.loadError : error === 'missing' ? fallbackLabels.missing : error || fallbackLabels.missing}</p></div>;

  const labels = sharedLabels[snapshot.language];
  const locale = snapshot.language === 'vi' ? vi : enUS;
  const dateTimeFormat = snapshot.language === 'vi' ? 'd/M/yyyy HH:mm' : 'MMM d, yyyy HH:mm';
  const ownerLabel = snapshot.ownerLabel || 'Google account';

  const start = weekStartFromQuery(snapshot.startWeek);
  const end = weekStartFromQuery(snapshot.endWeek);
  if (!start || !end) return <div className="shared-state">{labels.invalid}</div>;
  const weekCount = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (7 * 86400000)) + 1);

  return <main className="shared-schedule-shell">
    <div className="shared-toolbar"><button type="button" className="shared-back-button" aria-label={labels.backToApp} title={labels.backToApp} onClick={() => { window.location.href = window.location.href.split('?')[0]; }}><ArrowLeft size={18} /></button><div><h1>Task2Goal</h1><p>{labels.readOnly}</p></div><button type="button" onClick={() => void downloadPdf()}><Download size={16} /> {labels.downloadPdf}</button></div>
    <div ref={pagesRef} className="shared-pages">
      {Array.from({ length: weekCount }, (_, index) => {
        const weekStart = addWeeks(start, index);
        return <React.Fragment key={weekStart.toISOString()}><SharedWeekPage weekStart={weekStart} plans={snapshot.plans} startHour={snapshot.startHour} endHour={snapshot.endHour} language={snapshot.language} /></React.Fragment>;
      })}
    </div>
    <p className="shared-attribution"><span ref={pdfCreatorRef}>{labels.creator} {ownerLabel}</span>, {labels.createdAt} {format(new Date(snapshot.createdAt), dateTimeFormat, { locale })}, {labels.expiresAt} {format(snapshot.expiresAt.toDate(), dateTimeFormat, { locale })}</p>
  </main>;
}