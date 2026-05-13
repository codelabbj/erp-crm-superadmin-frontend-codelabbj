import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Bot, Send, Sparkles, User, Loader2, 
  MessageSquare, RefreshCw, Zap,
  Database, ShieldCheck, Cpu,
  Terminal, Globe, Lightbulb, Clock
} from "lucide-react";
import { adminApi, type AIAssistantPayload, type AIModel } from "../../lib/adminApi";
import { getErrorMessage } from "../../lib/ui";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Bonjour ! Je suis votre assistant Codelab AI. Je peux analyser vos revenus, auditer vos organisations ou vous aider à configurer la plateforme. Comment puis-je vous assister ?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: models, isLoading: isLoadingModels } = useQuery({
    queryKey: ["ai-models"],
    queryFn: () => adminApi.aiModels(),
  });

  useEffect(() => {
    if (models && models.length > 0 && !selectedModel) {
      setSelectedModel(models[0].id);
    }
  }, [models, selectedModel]);

  const askMutation = useMutation({
    mutationFn: (payload: AIAssistantPayload) => adminApi.askAssistant(payload),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        },
      ]);
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Désolé, une erreur est survenue : ${getErrorMessage(error)}`,
          timestamp: new Date(),
        },
      ]);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || askMutation.isPending) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    askMutation.mutate({
      prompt: input,
      model_id: selectedModel,
      context: {
        current_view: "global_admin",
        timestamp: new Date().toISOString(),
      },
    });
  };

  const suggestions = [
    { text: "Analyse des revenus du mois", icon: Database },
    { text: "Organisations à risque", icon: ShieldCheck },
    { text: "Activité des 24h", icon: Clock },
    { text: "Aide configuration plans", icon: Lightbulb }
  ];

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100 uppercase italic flex items-center gap-3">
            Codelab <span className="text-brand-purple-600 underline decoration-brand-magenta-500 underline-offset-8">Intelligence</span>
            <Sparkles className="text-brand-magenta-500 animate-pulse" size={24} />
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">Assistant prédictif et analytique pour la gestion plateforme.</p>
        </div>
        
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <Cpu size={14} /> Moteur
          </div>
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="rounded-xl bg-slate-50 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-slate-700 outline-none transition focus:ring-2 focus:ring-brand-purple-500/20 dark:bg-slate-800 dark:text-slate-200"
          >
            {isLoadingModels ? (
              <option>...</option>
            ) : (
              models?.map((m: AIModel) => (
                <option key={m.id} value={m.id}>{m.id}</option>
              ))
            )}
          </select>
        </div>
      </header>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Main Interaction Hub */}
        <div className="flex flex-1 flex-col rounded-[2.5rem] border border-border-soft bg-white shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none overflow-hidden">
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth"
          >
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`flex gap-5 ${msg.role === "assistant" ? "items-start" : "items-start flex-row-reverse"}`}
              >
                <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl shadow-lg transition-transform hover:scale-105 ${
                  msg.role === "assistant" 
                    ? "bg-gradient-to-br from-brand-purple-600 to-brand-magenta-600 text-white" 
                    : "bg-slate-900 text-white dark:bg-slate-700"
                }`}>
                  {msg.role === "assistant" ? <Bot size={20} /> : <User size={20} />}
                </div>
                
                <div className={`group relative max-w-[75%] rounded-[2rem] p-6 ${
                  msg.role === "assistant"
                    ? "bg-slate-50 text-slate-800 border border-slate-100 dark:bg-slate-800/40 dark:text-slate-100 dark:border-slate-800"
                    : "bg-brand-purple-600 text-white shadow-xl shadow-brand-purple-500/20"
                }`}>
                  <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  <div className={`mt-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${
                    msg.role === "assistant" ? "text-slate-400" : "text-brand-purple-200"
                  }`}>
                    <Clock size={10} />
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {askMutation.isPending && (
              <div className="flex gap-5 items-start">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple-600 to-brand-magenta-600 text-white animate-pulse">
                  <Bot size={20} />
                </div>
                <div className="bg-slate-50 rounded-[2rem] p-6 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="flex gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-brand-purple-400 animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-brand-purple-400 animate-bounce [animation-delay:0.2s]" />
                    <div className="h-2 w-2 rounded-full bg-brand-purple-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <footer className="border-t border-slate-50 bg-slate-50/30 p-6 dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex items-center gap-4 rounded-[2rem] border border-slate-200 bg-white px-6 py-3 shadow-sm transition-all focus-within:border-brand-purple-400 focus-within:ring-4 focus-within:ring-brand-purple-500/10 dark:border-slate-700 dark:bg-slate-800">
              <Terminal className="text-slate-400" size={18} />
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ex: Analyse la croissance MRR par module ce trimestre..."
                className="flex-1 bg-transparent py-2 text-sm font-medium outline-none dark:text-slate-100"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || askMutation.isPending}
                className="btn-primary h-10 w-10 p-0 shadow-brand-purple-500/20"
              >
                {askMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </footer>
        </div>

        {/* Intelligence Sidepanel */}
        <aside className="w-80 space-y-6">
          <section className="rounded-3xl border border-border-soft bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              <MessageSquare size={14} className="text-brand-purple-600" /> Suggestions IA
            </h3>
            <div className="grid gap-3">
              {suggestions.map((s, i) => (
                <button 
                  key={i}
                  onClick={() => setInput(s.text)}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-50 bg-slate-50/50 p-4 text-left transition hover:border-brand-purple-300 hover:bg-white dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                >
                  <div className="rounded-xl bg-white p-2 text-slate-400 shadow-sm transition group-hover:text-brand-purple-600 dark:bg-slate-900">
                    <s.icon size={16} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">
                    {s.text}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border-soft bg-gradient-to-br from-brand-purple-600 via-brand-purple-700 to-brand-magenta-600 p-8 text-white shadow-xl shadow-brand-purple-500/20 relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-purple-100">
                <Globe size={14} /> Capacités Système
              </h3>
              <ul className="space-y-4">
                {[
                  { icon: Database, text: "Analyse prédictive de revenus" },
                  { icon: ShieldCheck, text: "Audit de conformité (GDPR)" },
                  { icon: RefreshCw, text: "Automatisation du support" }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-[11px] font-bold">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md">
                      <item.icon size={16} />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
            <Zap className="absolute -bottom-4 -right-4 h-32 w-32 text-white/5 rotate-12" />
          </section>
        </aside>
      </div>
    </div>
  );
}
