import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Compass, Loader2, MapPin, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useParams } from "wouter";

export default function Attendance() {
  const { code = "" } = useParams<{ code: string }>();
  const { user, isAuthenticated, loading } = useAuth();
  const { data: qr, isLoading: loadingQr, error } = trpc.attendance.byQr.useQuery({ code }, { enabled: Boolean(code) });
  const record = trpc.attendance.record.useMutation();
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("Brasil");
  const [done, setDone] = useState(false);
  const [duplicate, setDuplicate] = useState(false);

  const submit = async (event: FormEvent) => { event.preventDefault(); if (!user || !qr) return; const result = await record.mutateAsync({ slug: "adamantina", eventId: qr.eventId, residenceCity: city || undefined, residenceState: state || undefined, residenceCountry: country || undefined, source: "qr_code" }); setDuplicate(result.duplicate); setDone(result.accepted || result.duplicate); };

  if (loading || loadingQr) return <Shell><Loader2 className="h-7 w-7 animate-spin text-[#0d5c4d]" /></Shell>;
  if (error || !qr) return <Shell><div className="text-center"><MapPin className="mx-auto h-8 w-8 text-[#b4533a]" /><h1 className="mt-4 font-display text-2xl font-bold text-[#123f36]">QR Code indisponível</h1><p className="mt-2 text-sm text-[#71827c]">Este código pode ter expirado ou não está mais ativo.</p><Link href="/" className="mt-6 inline-flex font-bold text-[#0d5c4d]">Voltar ao portal</Link></div></Shell>;
  if (!isAuthenticated) return <Shell><div className="text-center"><ShieldCheck className="mx-auto h-8 w-8 text-[#0d5c4d]" /><h1 className="mt-4 font-display text-2xl font-bold text-[#123f36]">Confirme sua presença</h1><p className="mt-2 text-sm leading-6 text-[#71827c]">Entre com sua conta para registrar a presença. A prefeitura verá apenas dados estatísticos e agregados.</p><Button onClick={() => startLogin()} className="mt-6 rounded-full bg-[#0d5c4d] font-bold text-white">Entrar para continuar</Button></div></Shell>;
  if (done) return <Shell><div className="text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-[#0d5c4d]" /><h1 className="mt-5 font-display text-3xl font-bold text-[#123f36]">{duplicate ? "Presença já registrada" : "Presença registrada"}</h1><p className="mt-3 text-sm leading-6 text-[#71827c]">{duplicate ? "Identificamos um registro recente para esta conta neste evento. Não criamos uma duplicidade." : "Obrigado por participar. Sua resposta ajudará a Secretaria a entender o alcance dos eventos em Adamantina."}</p><Link href="/" className="mt-7 inline-flex rounded-full bg-[#0d5c4d] px-5 py-3 text-sm font-bold text-white">Continuar explorando</Link></div></Shell>;
  return <Shell><Card className="w-full max-w-lg rounded-[28px] border-[#d7e4d9] bg-white shadow-[0_20px_50px_rgba(39,73,57,0.12)]"><CardHeader><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f1ea] text-[#0d5c4d]"><MapPin className="h-6 w-6" /></div><CardTitle className="mt-4 font-display text-3xl tracking-[-0.05em] text-[#123f36]">Você está em um evento</CardTitle><p className="mt-2 rounded-xl bg-[#f5f8f5] p-3 text-sm font-semibold text-[#0d5c4d]">{qr.eventTitle}{qr.eventStartsAt ? ` · ${new Date(qr.eventStartsAt).toLocaleDateString("pt-BR")}` : ""}</p><p className="text-sm leading-6 text-[#71827c]">Conte de onde você veio. A informação é opcional e será usada somente em relatórios agregados.</p></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><label className="block space-y-1.5"><span className="text-xs font-bold uppercase tracking-wide text-[#71827c]">Cidade de residência (opcional)</span><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex.: Presidente Prudente" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block space-y-1.5"><span className="text-xs font-bold uppercase tracking-wide text-[#71827c]">Estado</span><Input value={state} onChange={(e) => setState(e.target.value)} placeholder="SP" maxLength={2} /></label><label className="block space-y-1.5"><span className="text-xs font-bold uppercase tracking-wide text-[#71827c]">País</span><Input value={country} onChange={(e) => setCountry(e.target.value)} /></label></div><Button disabled={record.isPending} type="submit" className="mt-3 h-12 w-full rounded-full bg-[#0d5c4d] font-bold text-white hover:bg-[#08483c]">{record.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Confirmar presença</Button><p className="flex items-center justify-center gap-1.5 pt-2 text-center text-xs text-[#8a9a92]"><ShieldCheck className="h-3.5 w-3.5" /> Dados protegidos e apresentados de forma agregada</p></form></CardContent></Card></Shell>;
}
function Shell({ children }: { children: React.ReactNode }) { return <div className="flex min-h-screen items-center justify-center bg-[#e8f1ea] px-5 py-10"><div className="w-full max-w-lg"><Link href="/" className="mb-8 flex items-center justify-center gap-2 font-display font-bold text-[#123f36]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0d5c4d] text-white"><Compass className="h-4 w-4" /></span> Viva Adamantina</Link>{children}</div></div>; }
