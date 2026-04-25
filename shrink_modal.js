
const fs = require('fs');
const path = './src/components/AruneekaAnalytics.tsx';
let content = fs.readFileSync(path, 'utf8');

// Shrink header
content = content.replace(
  /<div className="flex items-center gap-4 mb-8">[\s\S]*?<span className="px-4 py-1\.5 bg-amethyst-light\/10 text-amethyst-primary text-\[10px\] font-black uppercase tracking-widest rounded-full">\{selectedContent\.status\}<\/span>[\s\S]*?<span className="text-slate-300 text-sm font-medium">\{new Date\(selectedContent\.due_date\)\.toLocaleDateString\('id-ID', \{ day: 'numeric', month: 'long', year: 'numeric' \}\)<\/span>[\s\S]*?<\/div>/,
  `<div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-amethyst-light/10 text-amethyst-primary text-[9px] font-black uppercase tracking-widest rounded-full">{selectedContent.status}</span>
                        <span className="text-slate-300 text-xs font-medium">{new Date(selectedContent.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                     </div>`
);

// Shrink title section
content = content.replace(
  /<div className="space-y-4 mb-16">[\s\S]*?<h2 className="text-2xl font-black text-amethyst-dark leading-tight max-w-xl">\{selectedContent\.title\}<\/h2>[\s\S]*?<div className="flex items-center gap-3">[\s\S]*?<Sparkles size=\{12\}\/> \{selectedContent\.content_pillar \|\| 'Educational'\}[\s\S]*?<\/div>[\s\S]*?<\/div>/,
  `<div className="space-y-2 mb-6">
                        <h2 className="text-2xl font-black text-amethyst-dark leading-tight max-w-xl">{selectedContent.title}</h2>
                        <div className="flex items-center gap-2">
                           <span className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100/50 rounded-lg text-[9px] font-bold text-amethyst-primary uppercase tracking-widest">
                              <Sparkles size={10}/> {selectedContent.content_pillar || 'Educational'}
                           </span>
                        </div>
                     </div>`
);

// Shrink Production Progress
content = content.replace(
  /<div className="space-y-10 flex-1">[\s\S]*?<div className="space-y-6">[\s\S]*?<p className="text-\[10px\] font-black text-slate-300 uppercase tracking-\[2px\]">Production Progress<\/p>/,
  `<div className="space-y-6 flex-1">
                        <div className="space-y-3">
                           <p className="text-[9px] font-black text-slate-300 uppercase tracking-[2px]">Production Progress</p>`
);

content = content.replace(
  /<div className={`w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-md transition-all \${idx < 5 \? 'bg-amethyst-primary text-white' : 'bg-slate-200 text-white'}`}>[\s\S]*?\{idx < 4 \? '✓' : '✓'\}[\s\S]*?<\/div>[\s\S]*?<span className="mt-3 text-\[8px\] font-black text-slate-400 uppercase tracking-widest text-center max-w-\[60px\] leading-tight">\{step\}<\/span>/,
  `<div className={\`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-md transition-all text-[10px] \${idx < 5 ? 'bg-amethyst-primary text-white' : 'bg-slate-200 text-white'}\`}>
                                      ✓
                                   </div>
                                   <span className="mt-2 text-[7px] font-black text-slate-400 uppercase tracking-widest text-center max-w-[50px] leading-tight">{step}</span>`
);

// Shrink Assets
content = content.replace(
  /<div className="space-y-6">[\s\S]*?<p className="text-\[10px\] font-black text-slate-300 uppercase tracking-\[2px\]">Assets & Links<\/p>[\s\S]*?<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">/,
  `<div className="space-y-4">
                           <p className="text-[9px] font-black text-slate-300 uppercase tracking-[2px]">Assets & Links</p>
                           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">`
);

content = content.replace(
  /className={`p-8 rounded-\[32px\] border-2 transition-all flex flex-col items-center gap-4 group \${[\s\S]*?link\.url \? 'bg-white border-slate-50 hover:border-amethyst-primary shadow-premium hover:shadow-2xl' : 'bg-slate-50 border-transparent opacity-40 cursor-not-allowed'[\s\S]*?}`}/,
  `className={\`p-4 rounded-[24px] border transition-all flex flex-col items-center gap-2 group \${link.url ? 'bg-white border-slate-50 hover:border-amethyst-primary shadow-sm hover:shadow-lg' : 'bg-slate-50 border-transparent opacity-40 cursor-not-allowed'}\`}`
);

content = content.replace(
  /<div className={`p-4 rounded-2xl \${link\.url \? \(link\.active \? 'bg-emerald-50 text-emerald-500' : 'bg-amethyst-light\/10 text-amethyst-primary'\) : 'bg-slate-100 text-slate-300'}`}>[\s\S]*?\{link\.icon\}[\s\S]*?<\/div>[\s\S]*?<span className="text-\[11px\] font-black uppercase tracking-widest text-amethyst-dark group-hover:text-amethyst-primary">\{link\.label\}<\/span>/,
  `<div className={\`p-3 rounded-xl \${link.url ? (link.active ? 'bg-emerald-50 text-emerald-500' : 'bg-amethyst-light/10 text-amethyst-primary') : 'bg-slate-100 text-slate-300'}\`}>
                                      {link.icon}
                                   </div>
                                   <span className="text-[9px] font-black uppercase tracking-widest text-amethyst-dark group-hover:text-amethyst-primary">{link.label}</span>`
);

// Shrink AI Insight
content = content.replace(
  /<div className="mt-auto space-y-6">[\s\S]*?<div className="p-8 bg-amethyst-primary\/5 rounded-\[32px\] border border-amethyst-light\/10 relative overflow-hidden group">/,
  `<div className="mt-6 space-y-4">
                        <div className="p-5 bg-amethyst-primary/5 rounded-[24px] border border-amethyst-light/10 relative overflow-hidden group">`
);

content = content.replace(
  /<p className="text-\[13px\] font-bold text-amethyst-dark\/80 italic">Berhasil menambahkan <span className="text-amethyst-primary font-black">\+\{selectedContent\.metrics\?.new_followers \|\| 0\}<\/span> followers baru dari konten ini\.<\/p>/,
  `<p className="text-[12px] font-bold text-amethyst-dark/80 italic">Berhasil menambahkan <span className="text-amethyst-primary font-black">+{selectedContent.metrics?.new_followers || 0}</span> followers baru.</p>`
);

// Shrink Buttons
content = content.replace(
  /<button onClick=\{\(\) =\> setSelectedContent\(null\)\} className="px-10 py-5 bg-slate-50 text-slate-400 rounded-2xl text-\[10px\] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Close<\/button>/,
  `<button onClick={() => setSelectedContent(null)} className="px-6 py-4 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Close</button>`
);

content = content.replace(
  /className="px-10 py-5 bg-amethyst-primary text-white rounded-2xl text-\[10px\] font-black uppercase tracking-widest shadow-xl shadow-amethyst-primary\/30 hover:-translate-y-1 transition-all flex items-center gap-3"/,
  `className="px-6 py-4 bg-amethyst-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amethyst-primary/20 hover:-translate-y-0.5 transition-all flex items-center gap-2"`
);

fs.writeFileSync(path, content);
console.log('Successfully shrunk modal elements');
