import * as React from 'react';
import { addDays, addWeeks, format, isSameDay } from 'date-fns';
import { Download, Loader2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Plan, PlanColor } from '../types';
import { getSharedSchedule, SharedScheduleSnapshot } from '../lib/firebase';

const COLORS: Record<PlanColor, string> = {
  default: '#f8fafc', green: '#92D050', yellow: '#FFFF00', gray: '#7F7F7F',
  red: '#FF0000', blue: '#0070C0', pink: '#FF69B4',
};

const weekStartFromQuery = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

function SharedWeekPage({ weekStart, plans, startHour, endHour }: { weekStart: Date; plans: Plan[]; startHour: number; endHour: number }) {
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const hours = Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index);

  return (
    <section className="shared-week-page">
      <header className="shared-week-title">
        <h2>Tuần {format(weekStart, 'w')}</h2>
        <p>{format(weekStart, 'd/M/yyyy')} - {format(addDays(weekStart, 6), 'd/M/yyyy')}</p>
      </header>
      <table>
        <thead>
          <tr>
            <th className="shared-time-column">Giờ</th>
            {days.map((day) => <th key={day.toISOString()}>{format(day, 'EEEE')}<small>{format(day, 'd/M')}</small></th>)}
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
                  {plan && <><strong>{plan.title || 'Nhiệm vụ'}</strong>{plan.duration > 1 && <small>{plan.duration} giờ</small>}</>}
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

  React.useEffect(() => {
    getSharedSchedule(shareId)
      .then((value) => {
        if (!value) setError('Link chia sẻ không tồn tại hoặc đã bị xóa.');
        setSnapshot(value);
      })
      .catch(() => setError('Không thể tải lịch được chia sẻ.'))
      .finally(() => setLoading(false));
  }, [shareId]);

  const downloadPdf = async () => {
    if (!pagesRef.current || !snapshot) return;
    const pages = Array.from(pagesRef.current.querySelectorAll<HTMLElement>('.shared-week-page'));
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    for (const [index, page] of pages.entries()) {
      const dataUrl = await toPng(page, { pixelRatio: 2, cacheBust: true, backgroundColor: '#fff' });
      if (index > 0) pdf.addPage('a4', 'landscape');
      pdf.addImage(dataUrl, 'PNG', 8, 8, 281, 194);
    }
    pdf.save(`task2goal-weeks-${snapshot.startWeek}-${snapshot.endWeek}.pdf`);
  };

  if (loading) return <div className="shared-state"><Loader2 className="animate-spin" /> Đang tải lịch...</div>;
  if (error || !snapshot) return <div className="shared-state"><p>{error || 'Không tìm thấy lịch.'}</p></div>;

  const start = weekStartFromQuery(snapshot.startWeek);
  const end = weekStartFromQuery(snapshot.endWeek);
  if (!start || !end) return <div className="shared-state">Dữ liệu lịch không hợp lệ.</div>;
  const weekCount = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (7 * 86400000)) + 1);

  return <main className="shared-schedule-shell">
    <div className="shared-toolbar"><div><h1>Task2Goal</h1><p>Lịch được chia sẻ ở chế độ chỉ xem</p></div><button type="button" onClick={() => void downloadPdf()}><Download size={16} /> Tải PDF</button></div>
    <div ref={pagesRef} className="shared-pages">
      {Array.from({ length: weekCount }, (_, index) => {
        const weekStart = addWeeks(start, index);
        return <React.Fragment key={weekStart.toISOString()}><SharedWeekPage weekStart={weekStart} plans={snapshot.plans} startHour={snapshot.startHour} endHour={snapshot.endHour} /></React.Fragment>;
      })}
    </div>
  </main>;
}