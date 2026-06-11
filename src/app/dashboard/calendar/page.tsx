import { fetchUnifiedEvents } from "@/features/calendar/actions";
import CalendarView from "@/components/calendar/CalendarView";
import { startOfMonth, endOfMonth, subMonths, addMonths } from "date-fns";

export const metadata = {
  title: "יומן מסונכרן | Dashboard",
};

export default async function CalendarPage() {
  // We'll fetch events for a broader range (e.g. previous month to next month)
  // so the user has data when navigating locally without frequent refetches.
  const now = new Date();
  const timeMin = startOfMonth(subMonths(now, 1)).toISOString();
  const timeMax = endOfMonth(addMonths(now, 2)).toISOString();
  
  const events = await fetchUnifiedEvents(timeMin, timeMax);

  return (
    <div className="p-6 h-[calc(100vh-80px)] flex flex-col gap-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">יומן ופעילות</h1>
        <p className="text-gray-400">
          כל המשימות, הפגישות, תזכורות ואינטראקציות עם משתמשים – הכל מסונכרן עם Google Calendar.
        </p>
      </div>
      
      <div className="flex-1 min-h-[600px] bg-[#111] p-4 rounded-3xl border border-white/5 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none rounded-3xl" />
        <CalendarView events={events} />
      </div>
    </div>
  );
}
