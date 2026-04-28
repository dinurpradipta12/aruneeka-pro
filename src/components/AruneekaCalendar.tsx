'use client';

import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ContentPlan {
  id: string;
  title: string;
  due_date: string;
  status: string;
}

const AruneekaCalendar = ({ contentPlans = [], onSelectContent }: { contentPlans?: ContentPlan[], onSelectContent?: (p: ContentPlan) => void }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const days = [];
  const totalDays = daysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const offset = firstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());

  for (let i = 0; i < offset; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const nextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  const prevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));

  return (
    <div className="bg-white rounded-[44px] shadow-premium border border-emerald-100 overflow-hidden">
       <div className="p-10 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/20">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-emerald-900 text-white rounded-2xl flex items-center justify-center shadow-premium">
                <CalendarIcon size={24}/>
             </div>
             <div>
                <h3 className="text-2xl title-aggressive">{monthName} {currentDate.getFullYear()}</h3>
                <p className="text-[10px] font-black text-emerald-600 tracking-widest uppercase">Content Scheduling System</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={prevMonth} className="p-3 hover:bg-white rounded-xl transition-all shadow-sm border border-emerald-100 active:scale-90"><ChevronLeft size={20}/></button>
             <button onClick={nextMonth} className="p-3 hover:bg-white rounded-xl transition-all shadow-sm border border-emerald-100 active:scale-90"><ChevronRight size={20}/></button>
          </div>
       </div>

       <div className="grid grid-cols-7 border-b border-emerald-50 bg-slate-50/30">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d: string) => (
            <div key={d} className="py-4 text-center text-[10px] font-black text-emerald-300 tracking-widest uppercase">{d}</div>
          ))}
       </div>

       <div className="grid grid-cols-7 auto-rows-[160px]">
          {days.map((day: any, i: number) => (
            <div key={i} className={`p-4 border-r border-b border-emerald-50 relative group hover:bg-emerald-50 transition-all ${!day ? 'bg-slate-50/10' : ''}`}>
               {day && (
                 <div className="space-y-3">
                    <span className="text-sm font-black text-slate-300 group-hover:text-emerald-600 transition-colors">{day}</span>
                    <div className="space-y-2">
                       {contentPlans
                         .filter((p: ContentPlan) => p.due_date && new Date(p.due_date).getDate() === day && new Date(p.due_date).getMonth() === currentDate.getMonth())
                         .slice(0, 3)
                         .map((p: ContentPlan, idx: number) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={idx} 
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectContent?.(p);
                            }}
                            className="px-3 py-1.5 bg-emerald-900 text-white rounded-xl text-[10px] font-bold truncate shadow-sm group-hover:shadow-premium cursor-pointer hover:scale-105 active:scale-95 transition-all"
                          >
                             {p.title}
                          </motion.div>
                       ))}
                    </div>
                 </div>
               )}
               {day && (
                 <button className="absolute bottom-4 right-4 w-8 h-8 bg-white text-emerald-600 rounded-xl shadow-premium border border-emerald-100 flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all hover:bg-emerald-900 hover:text-white">
                    <Plus size={16}/>
                 </button>
               )}
            </div>
          ))}
       </div>
    </div>
  );
};

export default AruneekaCalendar;
