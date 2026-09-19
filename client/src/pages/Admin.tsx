import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import AdminCatalog from "@/pages/AdminCatalog";
import AdminEvents from "@/pages/AdminEvents";
import AdminModeration from "@/pages/AdminModeration";
import AdminItineraries from "@/pages/AdminItineraries";
import AdminReports from "@/pages/AdminReports";
import AdminUsers from "@/pages/AdminUsers";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  Compass,
  FileText,
  Filter,
  Grid2X2,
  Landmark,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MessageSquare,
  MoreHorizontal,
  QrCode,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const menu = [
  { label: "Visão geral", icon: LayoutDashboard },
  { label: "Catálogo turístico", icon: Landmark },
  { label: "Eventos", icon: CalendarDays },
  { label: "Roteiros", icon: Map },
  { label: "Moderação", icon: ClipboardCheck, count: 8 },
  { label: "Presença & QR Codes", icon: QrCode },
  { label: "Relatórios", icon: BarChart3 },
];

const moderation = [
  { initials: "MC", title: "Festival de Inverno 2026", type: "Novo evento", submitted: "há 18 min", color: "bg-amber-100 text-amber-800" },
  { initials: "RS", title: "Restaurante Sabor da Praça", type: "Novo estabelecimento", submitted: "há 42 min", color: "bg-rose-100 text-rose-800" },
  { initials: "JA", title: "Comentário em Parque dos Pioneiros", type: "Avaliação", submitted: "há 1h", color: "bg-sky-100 text-sky-800" },
];

const administrativeRoles = ["platform_admin", "municipal_admin", "moderator", "analyst"];

export default function Admin() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: dashboardData } = trpc.dashboard.stats.useQuery({ slug: "adamantina" }, { enabled: Boolean(user && administrativeRoles.includes(user.role)) });
  const [active, setActive] = useState("Visão geral");
  const [mobileMenu, setMobileMenu] = useState(false);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f5f7f5] text-sm font-semibold text-[#59716b]">Carregando acesso seguro…</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#e8f1ea] px-5 text-[#20332f]">
        <div className="w-full max-w-md rounded-[28px] border border-[#d4e3d7] bg-white p-8 text-center shadow-[0_20px_50px_rgba(39,73,57,0.12)] sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0d5c4d] text-white"><ShieldCheck className="h-7 w-7" /></div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#c4703a]">Acesso restrito</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.05em] text-[#123f36]">Área da Secretaria</h1>
          <p className="mt-4 text-sm leading-6 text-[#71827c]">Entre com uma conta autorizada para administrar o catálogo, os eventos, as contribuições e os indicadores de Adamantina.</p>
          <Button onClick={() => startLogin()} className="mt-7 h-12 w-full rounded-full bg-[#0d5c4d] font-bold text-white hover:bg-[#08483c]">Entrar com minha conta</Button>
          <Link href="/" className="mt-5 inline-flex text-sm font-bold text-[#0d5c4d] hover:text-[#c4703a]">Voltar ao portal</Link>
        </div>
      </div>
    );
  }

  if (!administrativeRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#e8f1ea] px-5 text-[#20332f]">
        <div className="w-full max-w-md rounded-[28px] border border-[#d4e3d7] bg-white p-8 text-center shadow-[0_20px_50px_rgba(39,73,57,0.12)] sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fbe9e3] text-[#a95d3a]"><ShieldCheck className="h-7 w-7" /></div>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-[-0.05em] text-[#123f36]">Permissão necessária</h1>
          <p className="mt-4 text-sm leading-6 text-[#71827c]">Sua conta está autenticada, mas ainda não possui uma permissão administrativa para acessar esta área.</p>
          <Link href="/" className="mt-7 inline-flex text-sm font-bold text-[#0d5c4d] hover:text-[#c4703a]">Voltar ao portal</Link>
        </div>
      </div>
    );
  }

  if (active !== "Visão geral") {
    return <AdminModuleScreen active={active} onBack={() => setActive("Visão geral")} />;
  }

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#20332f]">
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[265px] flex-col border-r border-[#dfe7df] bg-[#123f36] text-white transition-transform lg:translate-x-0 ${mobileMenu ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-6"><Link href="/" className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4c56e] text-[#5e4018]"><Compass className="h-5 w-5" /></div><div><p className="font-display text-lg font-bold tracking-[-0.04em]">Viva Adamantina</p><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/50">Painel municipal</p></div></Link><button className="lg:hidden" onClick={() => setMobileMenu(false)}><X className="h-5 w-5" /></button></div>
        <div className="px-4 py-5"><div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d5e7d2] font-bold text-[#123f36]">AT</div><div className="min-w-0"><p className="truncate text-sm font-bold">Ana Turismo</p><p className="truncate text-xs text-white/55">Admin. municipal</p></div><ChevronDown className="ml-auto h-4 w-4 text-white/50" /></div></div>
        <nav className="flex-1 space-y-1 px-3">{menu.map(({ label, icon: Icon, count }) => <button key={label} onClick={() => { setActive(label); setMobileMenu(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${active === label ? "bg-white text-[#123f36] shadow-sm" : "text-white/65 hover:bg-white/10 hover:text-white"}`}><Icon className="h-[18px] w-[18px]" /><span>{label}</span>{count && <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${active === label ? "bg-[#f4c56e] text-[#634518]" : "bg-[#c4703a] text-white"}`}>{count}</span>}</button>)}</nav>
        <div className="space-y-1 border-t border-white/10 p-4"><button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white"><Settings className="h-[18px] w-[18px]" /> Configurações</button><Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-white/60 hover:bg-white/10 hover:text-white"><LogOut className="h-[18px] w-[18px]" /> Voltar ao portal</Link></div>
      </aside>

      <div className="lg:pl-[265px]"><header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#dfe7df] bg-[#f5f7f5]/90 px-5 backdrop-blur-xl sm:px-8"><div className="flex items-center gap-3"><button onClick={() => setMobileMenu(true)} className="rounded-xl p-2 hover:bg-white lg:hidden"><Menu className="h-5 w-5" /></button><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a9b92]">Adamantina / Secretaria de Cultura e Turismo</p><h1 className="font-display text-xl font-bold tracking-[-0.03em] text-[#123f36]">{active}</h1></div></div><div className="flex items-center gap-2 sm:gap-4"><button className="relative rounded-xl p-2 text-[#698078] hover:bg-white"><Bell className="h-5 w-5" /><span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#c4703a] ring-2 ring-[#f5f7f5]" /></button><div className="hidden h-7 w-px bg-[#dfe7df] sm:block" /><div className="hidden items-center gap-2 text-right sm:flex"><p className="text-sm font-bold text-[#20332f]">Ana Turismo</p><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#d5e7d2] text-xs font-bold text-[#123f36]">AT</div></div></div></header>
        <main className="mx-auto max-w-[1440px] p-5 sm:p-8"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge className="border-0 bg-[#e2f0e3] text-[10px] font-bold uppercase tracking-[0.16em] text-[#0d5c4d]">Visão municipal</Badge><h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.05em] text-[#123f36] sm:text-4xl">Bom dia, Ana.</h2><p className="mt-2 text-sm text-[#71827c]">Aqui está o que está acontecendo no turismo de Adamantina.</p></div><div className="flex gap-2"><Button variant="outline" className="rounded-xl border-[#d4e1d6] bg-white text-[#55716a]"><CircleHelp className="mr-2 h-4 w-4" /> Ajuda</Button><Button onClick={() => startLogin()} className="rounded-xl bg-[#0d5c4d] font-bold text-white hover:bg-[#08483c]"><FileText className="mr-2 h-4 w-4" /> Novo cadastro</Button></div></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Landmark} label="Itens publicados" value={dashboardData ? String(dashboardData.stats.places) : "126"} detail={dashboardData ? "Dados do catálogo" : "+12% este mês"} tone="green" /><Metric icon={CalendarDays} label="Eventos ativos" value={dashboardData ? String(dashboardData.stats.events) : "18"} detail={dashboardData ? "Eventos aprovados" : "5 nesta semana"} tone="amber" /><Metric icon={Users} label="Presenças no mês" value={dashboardData ? String(dashboardData.stats.attendance) : "2.840"} detail={dashboardData ? "Registros agregados" : "+18% vs. anterior"} tone="blue" /><Metric icon={ClipboardCheck} label="Aguardando revisão" value={dashboardData ? String(dashboardData.stats.pending).padStart(2, "0") : "08"} detail={dashboardData ? "Fila de moderação" : "3 novas hoje"} tone="rose" /></div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.9fr]"><Card className="rounded-[22px] border-[#e0e8e0] bg-white shadow-[0_10px_25px_rgba(39,73,57,0.04)]"><CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2"><div><CardTitle className="font-display text-xl tracking-[-0.03em] text-[#123f36]">Fluxo de visitantes</CardTitle><p className="mt-1 text-xs text-[#899990]">Presenças registradas nos últimos 6 meses</p></div><Button variant="outline" className="h-9 rounded-lg border-[#dce7de] text-xs text-[#698078]"><span className="hidden sm:inline">Últimos 6 meses</span><Filter className="h-3.5 w-3.5 sm:ml-2" /></Button></CardHeader><CardContent><div className="mt-5 flex h-[220px] items-end gap-3 border-b border-l border-[#e8eee8] px-3 pb-0 pt-5 sm:gap-5"><ChartBar label="DEZ" height="38%" /><ChartBar label="JAN" height="48%" /><ChartBar label="FEV" height="52%" /><ChartBar label="MAR" height="61%" /><ChartBar label="ABR" height="70%" /><ChartBar label="MAI" height="88%" active /></div><div className="mt-5 flex items-center gap-5 text-xs text-[#7c8e85]"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#0d5c4d]" /> Presenças confirmadas</span><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#f4c56e]" /> Eventos realizados</span></div></CardContent></Card><Card className="rounded-[22px] border-[#e0e8e0] bg-white shadow-[0_10px_25px_rgba(39,73,57,0.04)]"><CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2"><div><CardTitle className="font-display text-xl tracking-[-0.03em] text-[#123f36]">Origem dos visitantes</CardTitle><p className="mt-1 text-xs text-[#899990]">Dados agregados · maio 2026</p></div><button className="rounded-lg p-1 text-[#91a199] hover:bg-[#f3f7f3]"><MoreHorizontal className="h-5 w-5" /></button></CardHeader><CardContent><div className="mt-4 flex items-center gap-7"><div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full" style={{ background: "conic-gradient(#0d5c4d 0 46%, #7fb4a0 46% 72%, #f4c56e 72% 90%, #d9e3da 90% 100%)" }}><div className="flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full bg-white"><span className="font-display text-2xl font-bold text-[#123f36]">2.840</span><span className="text-[10px] font-bold uppercase tracking-wide text-[#92a099]">pessoas</span></div></div><div className="space-y-3 text-xs text-[#698078]"><Legend color="bg-[#0d5c4d]" label="Adamantina" value="46%" /><Legend color="bg-[#7fb4a0]" label="Região" value="26%" /><Legend color="bg-[#f4c56e]" label="Outros estados" value="18%" /><Legend color="bg-[#d9e3da]" label="Não informado" value="10%" /></div></div><div className="mt-6 rounded-xl bg-[#f5f8f5] p-3 text-xs leading-5 text-[#71827c]"><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-[#0d5c4d]" /> Relatório com dados agregados, sem histórico individual de presença.</div></CardContent></Card></div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.9fr]"><Card className="rounded-[22px] border-[#e0e8e0] bg-white shadow-[0_10px_25px_rgba(39,73,57,0.04)]"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><div><CardTitle className="font-display text-xl tracking-[-0.03em] text-[#123f36]">Fila de moderação</CardTitle><p className="mt-1 text-xs text-[#899990]">Conteúdos aguardando revisão</p></div><Button variant="ghost" className="text-xs font-bold text-[#0d5c4d] hover:bg-[#f1f6f1]">Ver fila completa <ChevronDown className="ml-1 h-3.5 w-3.5 -rotate-90" /></Button></CardHeader><CardContent className="space-y-2">{moderation.map((item) => <div key={item.title} className="flex items-center gap-3 rounded-xl p-3 transition hover:bg-[#f6f9f6]"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${item.color}`}>{item.initials}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#20332f]">{item.title}</p><p className="mt-1 text-xs text-[#8a9a92]">{item.type} · {item.submitted}</p></div><div className="flex gap-1"><button className="flex h-8 w-8 items-center justify-center rounded-lg text-[#0d5c4d] hover:bg-[#e4f1e5]" aria-label="Aprovar"><Check className="h-4 w-4" /></button><button className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8a9a92] hover:bg-[#f1f4f1]" aria-label="Mais opções"><MoreHorizontal className="h-4 w-4" /></button></div></div>)}</CardContent></Card><Card className="rounded-[22px] border-[#e0e8e0] bg-[#123f36] text-white shadow-[0_10px_25px_rgba(39,73,57,0.08)]"><CardHeader><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"><Star className="h-5 w-5 text-[#f4c56e]" /></div><Badge className="border-0 bg-[#f4c56e] text-[10px] font-bold uppercase tracking-wide text-[#624419]">Destaque</Badge></div><CardTitle className="mt-4 font-display text-2xl leading-tight tracking-[-0.04em]">A cidade está sendo descoberta.</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-white/65">O catálogo cresceu <strong className="text-white">24%</strong> desde o início do ano. Continue convidando negócios e iniciativas locais para participar.</p><Button className="mt-5 w-full rounded-xl bg-white/10 font-bold text-white hover:bg-white/20">Ver relatório completo <BarChart3 className="ml-2 h-4 w-4" /></Button></CardContent></Card></div>
        </main>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail, tone }: { icon: typeof Landmark; label: string; value: string; detail: string; tone: "green" | "amber" | "blue" | "rose" }) {
  const tones = { green: "bg-[#e3f1e3] text-[#0d5c4d]", amber: "bg-[#fff0d6] text-[#9a681d]", blue: "bg-[#e3eef5] text-[#33708b]", rose: "bg-[#fbe9e3] text-[#a95d3a]" };
  return <Card className="rounded-[20px] border-[#e0e8e0] bg-white shadow-[0_8px_22px_rgba(39,73,57,0.04)]"><CardContent className="p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wide text-[#899990]">{label}</p><p className="mt-3 font-display text-3xl font-bold tracking-[-0.05em] text-[#123f36]">{value}</p><p className="mt-2 text-xs font-semibold text-[#6d8c78]">{detail}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-5 w-5" /></div></div></CardContent></Card>;
}

function ChartBar({ label, height, active }: { label: string; height: string; active?: boolean }) { return <div className="flex h-full flex-1 flex-col items-center justify-end gap-3"><div className={`w-full max-w-[42px] rounded-t-xl transition hover:opacity-80 ${active ? "bg-[#0d5c4d]" : "bg-[#b9d2bd]"}`} style={{ height }} /><span className={`pb-2 text-[10px] font-bold tracking-wide ${active ? "text-[#0d5c4d]" : "text-[#9aa9a0]"}`}>{label}</span></div>; }
function Legend({ color, label, value }: { color: string; label: string; value: string }) { return <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${color}`} /><span className="w-24">{label}</span><strong className="text-[#20332f]">{value}</strong></div>; }

function AdminModuleScreen({ active, onBack }: { active: string; onBack: () => void }) {
  return <div className="min-h-screen bg-[#f5f7f5] p-5 text-[#20332f] sm:p-8"><div className="mx-auto max-w-[1440px]"><div className="mb-7 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a9b92]">Adamantina / Secretaria de Cultura e Turismo</p><h1 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] text-[#123f36]">{active}</h1></div><Button variant="outline" onClick={onBack} className="rounded-xl border-[#d4e1d6] bg-white text-[#0d5c4d]">Voltar ao painel</Button></div>{active === "Catálogo turístico" ? <AdminCatalog /> : active === "Eventos" ? <AdminEvents /> : active === "Roteiros" ? <AdminItineraries /> : active === "Moderação" ? <AdminModeration /> : active === "Relatórios" ? <AdminReports /> : active === "Configurações" ? <AdminUsers /> : <div className="rounded-[22px] bg-white p-10 text-center text-sm text-[#71827c]">Este módulo está sendo preparado para a próxima entrega.</div>}</div></div>;
}
