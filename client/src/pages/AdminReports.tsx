import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import jsPDF from "jspdf";
import { BarChart3, CalendarDays, Download, FileDown, Loader2, Users } from "lucide-react";
import { useMemo, useState } from "react";

const pad = (value: number) => String(value).padStart(2, "0");
const dateInput = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const initialStart = new Date();
initialStart.setDate(initialStart.getDate() - 30);

export default function AdminReports() {
  const [start, setStart] = useState(dateInput(initialStart));
  const [end, setEnd] = useState(dateInput(new Date()));
  const startDate = useMemo(() => new Date(`${start}T00:00:00`), [start]);
  const endDate = useMemo(() => new Date(`${end}T23:59:59`), [end]);
  const { data, isLoading } = trpc.admin.report.useQuery({ slug: "adamantina", start: startDate, end: endDate });
  const { data: comparison } = trpc.admin.comparison.useQuery({ slug: "adamantina", start: startDate, end: endDate });
  const summary = data?.summary;
  const rows = summary?.origin ?? [];

  const exportCsv = () => {
    const lines = [
      ["Relatório de turismo — Adamantina"], [`Período;${start};${end}`], [], ["Indicador", "Valor"],
      ["Novos locais", summary?.places ?? 0], ["Eventos cadastrados", summary?.events ?? 0], ["Presenças", summary?.attendance ?? 0], ["Pendências de moderação", summary?.pending ?? 0],
      [], ["Origem", "Quantidade"], ...rows.map((row) => [row.label, row.value]),
      [], ["Sazonalidade mensal", "Presenças"], ...(comparison?.data.seasonality ?? []).map((row) => [String(row.month), row.attendance]),
    ];
    const blob = new Blob(["\ufeff" + lines.map((line) => line.join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
    download(blob, `relatorio-turismo-${start}-${end}.csv`);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor("#123f36"); doc.text("Relatório comparativo de turismo", 20, 22);
    doc.setFontSize(11); doc.setFont("helvetica", "normal"); doc.text("Adamantina · Secretaria de Cultura e Turismo", 20, 30); doc.text(`Período: ${start} a ${end}`, 20, 38); doc.line(20, 44, 190, 44);
    doc.setFont("helvetica", "bold"); doc.text("Resumo executivo", 20, 56); doc.setFont("helvetica", "normal");
    [["Novos locais", summary?.places ?? 0], ["Eventos cadastrados", summary?.events ?? 0], ["Presenças registradas", summary?.attendance ?? 0], ["Pendências", summary?.pending ?? 0]].forEach(([label, value], index) => doc.text(`${label}: ${value}`, 24, 67 + index * 8));
    doc.setFont("helvetica", "bold"); doc.text("Sazonalidade mensal", 20, 108); doc.setFont("helvetica", "normal"); (comparison?.data.seasonality ?? []).forEach((row, index) => doc.text(`Mês ${row.month}: ${row.attendance} presenças`, 24, 119 + index * 7));
    doc.setFontSize(9); doc.setTextColor("#71827c"); doc.text("Dados agregados para planejamento público; não contém histórico individual.", 20, 280); doc.save(`relatorio-turismo-${start}-${end}.pdf`);
  };

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Badge className="border-0 bg-[#e3eef5] text-[10px] font-bold uppercase tracking-[0.16em] text-[#33708b]">Prestação de dados</Badge><h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.05em] text-[#123f36]">Relatórios e analytics</h2><p className="mt-2 text-sm text-[#71827c]">Compare municípios, eventos e sazonalidade em períodos selecionáveis.</p></div><div className="flex gap-2"><Button onClick={exportCsv} variant="outline" disabled={!summary} className="rounded-xl border-[#c9d9cc] text-[#0d5c4d]"><Download className="mr-2 h-4 w-4" /> CSV</Button><Button onClick={exportPdf} disabled={!summary} className="rounded-xl bg-[#0d5c4d] font-bold text-white"><FileDown className="mr-2 h-4 w-4" /> PDF</Button></div></div>
    <Card className="rounded-[22px] border-[#e0e8e0] bg-white"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end"><label className="flex-1 space-y-1.5"><span className="text-xs font-bold uppercase tracking-wide text-[#71827c]">Data inicial</span><InputDate value={start} onChange={setStart} /></label><label className="flex-1 space-y-1.5"><span className="text-xs font-bold uppercase tracking-wide text-[#71827c]">Data final</span><InputDate value={end} onChange={setEnd} /></label><div className="flex items-center gap-2 rounded-xl bg-[#e8f1ea] px-3 py-2 text-xs font-semibold text-[#0d5c4d]"><CalendarDays className="h-4 w-4" /> Atualização automática</div></CardContent></Card>
    {isLoading ? <div className="flex items-center gap-2 text-sm text-[#71827c]"><Loader2 className="h-4 w-4 animate-spin" /> Consultando indicadores…</div> : <><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={BarChart3} label="Novos locais" value={summary?.places ?? 0} /><Metric icon={CalendarDays} label="Eventos cadastrados" value={summary?.events ?? 0} /><Metric icon={Users} label="Presenças" value={summary?.attendance ?? 0} /><Metric icon={BarChart3} label="Pendências" value={summary?.pending ?? 0} /></div><div className="grid gap-6 xl:grid-cols-2"><Card className="rounded-[22px] border-[#e0e8e0] bg-white"><CardHeader><CardTitle className="font-display text-xl text-[#123f36]">Origem dos visitantes</CardTitle></CardHeader><CardContent><div className="space-y-4">{rows.length ? rows.map((row) => <div key={row.label}><div className="flex justify-between text-sm"><span className="font-semibold text-[#55716a]">{row.label}</span><strong className="text-[#123f36]">{row.value}</strong></div><div className="mt-2 h-2 rounded-full bg-[#edf2ed]"><div className="h-2 rounded-full bg-[#0d5c4d]" style={{ width: `${Math.min(100, summary?.attendance ? (row.value / summary.attendance) * 100 : 0)}%` }} /></div></div>) : <p className="text-sm text-[#71827c]">Ainda não há registros no período.</p>}</div></CardContent></Card><Card className="rounded-[22px] border-[#e0e8e0] bg-[#123f36] text-white"><CardHeader><CardTitle className="font-display text-xl">Sazonalidade</CardTitle></CardHeader><CardContent><div className="space-y-3">{comparison?.data.seasonality.length ? comparison.data.seasonality.map((row) => <div key={row.month} className="flex items-center justify-between rounded-xl bg-white/10 p-3 text-sm"><span>Mês {row.month}</span><strong>{row.attendance} presenças</strong></div>) : <p className="text-sm text-white/65">Ainda não há presenças suficientes para comparar.</p>}</div></CardContent></Card></div><Comparison data={comparison?.data} /></>}</div>;
}

function Comparison({ data }: { data?: { municipalities: Array<{ id: number; name: string; attendance: number; events: number }>; events: Array<{ eventId: number; title: string; attendance: number }>; seasonality: Array<{ month: number; attendance: number }> } }) { return <div className="grid gap-6 xl:grid-cols-2"><Card className="rounded-[22px] border-[#e0e8e0] bg-white"><CardHeader><CardTitle className="font-display text-xl text-[#123f36]">Comparativo por município</CardTitle></CardHeader><CardContent>{data?.municipalities.length ? <div className="space-y-3">{data.municipalities.map((row) => <div key={row.id} className="flex items-center justify-between rounded-xl bg-[#f5f8f5] p-3 text-sm"><span className="font-semibold text-[#55716a]">{row.name}</span><span className="font-bold text-[#123f36]">{row.attendance} presenças · {row.events} eventos</span></div>)}</div> : <p className="text-sm text-[#71827c]">Disponível para o administrador da plataforma com mais de um município ativo.</p>}</CardContent></Card><Card className="rounded-[22px] border-[#e0e8e0] bg-white"><CardHeader><CardTitle className="font-display text-xl text-[#123f36]">Desempenho por evento</CardTitle></CardHeader><CardContent>{data?.events.length ? <div className="space-y-3">{data.events.slice(0, 8).map((row) => <div key={row.eventId} className="flex items-center justify-between rounded-xl bg-[#f5f8f5] p-3 text-sm"><span className="truncate pr-3 font-semibold text-[#55716a]">{row.title}</span><strong className="text-[#123f36]">{row.attendance}</strong></div>)}</div> : <p className="text-sm text-[#71827c]">Nenhum evento no período selecionado.</p>}</CardContent></Card></div>; }
function InputDate({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-[#dfe8e1] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#7fb4a0]" />; }
function Metric({ icon: Icon, label, value }: { icon: typeof BarChart3; label: string; value: number }) { return <Card className="rounded-[20px] border-[#e0e8e0] bg-white"><CardContent className="p-5"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f1ea] text-[#0d5c4d]"><Icon className="h-4 w-4" /></div><p className="mt-4 text-xs font-bold uppercase tracking-wide text-[#899990]">{label}</p><p className="mt-2 font-display text-3xl font-bold text-[#123f36]">{value}</p></CardContent></Card>; }
function download(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url); }
