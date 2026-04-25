'use client';

import React from 'react';
import { Target, ShieldCheck, ChevronRight, Zap, BookOpen, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

interface AruneekaIntelligenceProps {
  selectedWorkspaceId?: string;
}

const AruneekaIntelligence = ({ selectedWorkspaceId }: AruneekaIntelligenceProps) => {
  const workflow = [
    { step: '01', title: 'Deep Context & Hook Ideation', desc: 'Synthesizing viral trends with brand-specific intellectual property.' },
    { step: '02', title: 'High-Retention Scripting', desc: 'Crafting narratives designed for 90%+ mid-roll retention.' },
    { step: '03', title: 'Strategic Cinematography', desc: 'Visual capture optimized for cross-platform algorithm performance.' },
    { step: '04', title: 'Kinetic Post-Production', desc: 'Advanced effects, typography, and sonic branding integration.' },
    { step: '05', title: 'Final Intelligence Validation', desc: 'Multi-point verification against brand growth benchmarks.' }
  ];

  return (
    <div className="grid grid-cols-12 gap-12">
       {/* Left Column: Workflow */}
       <div className="col-span-12 lg:col-span-7 space-y-12">
          <div className="space-y-3">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center shadow-premium">
                   <Fingerprint size={24}/>
                </div>
                <div>
                   <h3 className="text-3xl title-aggressive">Aruneeka SOP</h3>
                   <p className="text-purple-100 text-sm italic font-medium">Standard Operating Procedures for high-density output.</p>
                </div>
             </div>
          </div>

          <div className="space-y-6">
             {workflow.map((s, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="bg-white p-8 rounded-[40px] border border-purple-50 shadow-premium group hover:bg-purple-600 transition-all flex items-center gap-8 cursor-pointer overflow-hidden relative"
                >
                   <div className="text-6xl font-black italic text-purple-50 group-hover:text-white/10 transition-colors select-none leading-none w-20">{s.step}</div>
                   <div className="flex-1 space-y-2">
                      <h4 className="text-lg font-black text-purple-950 group-hover:text-white transition-colors">{s.title}</h4>
                      <p className="text-sm text-purple-100 group-hover:text-white/70 transition-colors font-medium italic">{s.desc}</p>
                   </div>
                   <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:bg-white/10 group-hover:text-white transition-all">
                      <ChevronRight size={20}/>
                   </div>
                </motion.div>
             ))}
          </div>
       </div>

       {/* Right Column: Strategic HUD */}
       <div className="col-span-12 lg:col-span-5 space-y-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-purple-950 rounded-[60px] p-12 text-white flex flex-col justify-between relative overflow-hidden shadow-premium min-h-[700px]"
          >
             <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 opacity-30"/>
             
             <div className="relative z-10 space-y-10">
                <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-md">
                   <ShieldCheck size={40} className="text-purple-600"/>
                </div>
                <div className="space-y-4">
                   <h3 className="text-4xl title-aggressive text-purple-600">Strategic<br/>Assurance</h3>
                   <p className="text-purple-100 text-lg font-medium italic leading-relaxed">Our protocol for maintaining world-class strategic content integrity.</p>
                </div>

                <div className="space-y-8">
                   {[
                     "99.8% Viral Accuracy Forecast",
                     "Real-time Intelligence Syncing",
                     "Automated Brand Voice Shield",
                     "Multi-Channel Kinetic Guard"
                   ].map((text, i) => (
                     <div key={i} className="flex items-center gap-6 group">
                       <div className="w-3 h-3 rounded-full bg-purple-600 shadow-[0_0_15px_rgba(139,92,246,0.5)] group-hover:scale-150 transition-transform"/>
                       <p className="text-lg font-black italic tracking-tight text-white/90 group-hover:text-white transition-colors">{text}</p>
                     </div>
                   ))}
                </div>
             </div>

             <div className="relative z-10 pt-12">
                <button className="w-full flex items-center justify-between p-6 bg-white/10 hover:bg-white/20 rounded-3xl border border-white/5 transition-all group">
                   <span className="text-sm font-black uppercase tracking-widest">Access Full Library</span>
                   <BookOpen size={20} className="text-purple-600 group-hover:scale-110 transition-transform"/>
                </button>
             </div>
          </motion.div>
       </div>
    </div>
  );
};

export default AruneekaIntelligence;
