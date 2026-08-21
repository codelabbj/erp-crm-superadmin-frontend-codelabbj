import { Rocket, Clock, Construction } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-8">
      <div className="mb-6 relative">
        <div className="absolute -inset-4 rounded-full bg-brand-purple-500/10 animate-pulse blur-xl" />
        <div className="relative rounded-3xl bg-white p-6 shadow-2xl shadow-brand-purple-500/10 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
          <Rocket size={48} className="text-brand-purple-600 dark:text-brand-purple-400 animate-bounce" />
        </div>
      </div>
      
      <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 mb-3 tracking-tight">
        {title}
      </h2>
      
      <p className="max-w-md text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
        {description || "Cette fonctionnalité est actuellement en cours de développement par notre équipe technique. Elle sera disponible très prochainement."}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          <Clock size={14} /> En cours
        </div>
        <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
          <Construction size={14} /> Backend Requis
        </div>
      </div>
      
      <div className="mt-12 grid grid-cols-3 gap-8 opacity-20 grayscale">
        <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
