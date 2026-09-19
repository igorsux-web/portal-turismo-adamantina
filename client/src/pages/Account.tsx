import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BookOpen, Check, Compass, Download, Loader2, LogOut, MapPin, Pencil, Save, ShieldAlert, Trash2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function Account() {
  const { user, loading, logout } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.account.me.useQuery(undefined, { enabled: Boolean(user) });
  const { data: itineraries, isLoading: itinerariesLoading } = trpc.itineraries.mine.useQuery({ slug: "adamantina" }, { enabled: Boolean(user) });
  const updateProfile = trpc.account.updateProfile.useMutation({ onSuccess: () => { utils.account.me.invalidate(); setSaved("Perfil atualizado."); } });
  const updateItinerary = trpc.itineraries.updateMine.useMutation({ onSuccess: () => { utils.itineraries.mine.invalidate(); setEditingId(null); setSaved("Roteiro atualizado."); } });
  const deleteItinerary = trpc.itineraries.deleteMine.useMutation({ onSuccess: () => { utils.itineraries.mine.invalidate(); setSaved("Roteiro removido."); } });
  const exportData = trpc.account.exportData.useQuery(undefined, { enabled: false });
  const requestDeletion = trpc.account.requestDeletion.useMutation({ onSuccess: () => setSaved("Solicitação de exclusão enviada à Ouvidoria.") });
  const withdrawConsent = trpc.account.withdrawConsent.useMutation({ onSuccess: () => setSaved("Retirada de consentimento registrada.") });
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("Brasil");
  const [interests, setInterests] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [saved, setSaved] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");

  useEffect(() => {
    const profile = data?.profile;
    if (!profile) return;
    setDisplayName(profile.displayName ?? "");
    setBio(profile.bio ?? "");
    setCity(profile.city ?? "");
    setState(profile.state ?? "");
    setCountry(profile.country ?? "Brasil");
    setInterests(profile.interests ?? "");
    setVisibility(profile.profileVisibility);
  }, [data?.profile]);

  const saveProfile = async () => {
    setSaved("");
    await updateProfile.mutateAsync({ displayName, bio, city, state, country, interests, profileVisibility: visibility });
  };
  const beginEdit = (route: NonNullable<typeof itineraries>[number]) => { setEditingId(route.id); setEditingTitle(route.title); setEditingDescription(route.description ?? ""); setSaved(""); };
  const saveItinerary = async () => { if (!editingId) return; await updateItinerary.mutateAsync({ slug: "adamantina", id: editingId, title: editingTitle, description: editingDescription }); };
  const removeItinerary = async (id: number) => { if (window.confirm("Excluir este roteiro pessoal? Esta ação não pode ser desfeita.")) await deleteItinerary.mutateAsync({ slug: "adamantina", id }); };
  const downloadData = async () => { const result = await exportData.refetch(); if (!result.data) return; const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "meus-dados-viva-adamantina.json"; anchor.click(); URL.revokeObjectURL(url); setSaved("Exportação gerada."); };
  const askDeletion = async () => { if (window.confirm("Solicitar a exclusão da conta? A Ouvidoria analisará eventuais obrigações legais de retenção antes de concluir.")) await requestDeletion.mutateAsync(); };
  const askConsentWithdrawal = async () => { if (window.confirm("Retirar os consentimentos opcionais de perfil, comunicações e analytics?")) await withdrawConsent.mutateAsync({ consentType: "optional_profile" }); };

  if (loading || isLoading) return <Shell><div className="flex items-center gap-2 text-sm text-[#71827c]"><Loader2 className="h-5 w-5 animate-spin" /> Carregando sua conta…</div></Shell>;
  if (!user) return null;

  return <Shell><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><Link href="/" className="mb-5 inline-flex items-center text-sm font-bold text-[#0d5c4d]"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao portal</Link><Badge className="border-0 bg-[#e2f0e3] text-[10px] font-bold uppercase tracking-[0.18em] text-[#0d5c4d]">Área do visitante</Badge><h1 className="mt-4 font-display text-4xl font-bold tracking-[-0.06em] text-[#123f36]">Minha conta</h1><p className="mt-2 text-sm leading-6 text-[#71827c]">Gerencie seu perfil, suas preferências e os roteiros que você criou.</p></div><Button variant="outline" onClick={logout} className="rounded-full border-[#cbdccc] text-[#0d5c4d]"><LogOut className="mr-2 h-4 w-4" /> Sair</Button></div><div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]"><Card className="rounded-[26px] border-[#d7e4d9] bg-white"><CardHeader><CardTitle className="flex items-center gap-2 font-display text-xl text-[#123f36]"><UserRound className="h-5 w-5 text-[#0d5c4d]" /> Perfil do visitante</CardTitle><p className="text-sm text-[#71827c]">Seu e-mail e sua identidade de login são controlados pelo provedor de autenticação.</p></CardHeader><CardContent className="space-y-4"><div className="rounded-2xl bg-[#f5f8f5] p-4"><p className="text-sm font-bold text-[#123f36]">{user.name ?? "Visitante"}</p><p className="mt-1 text-xs text-[#71827c]">{user.email ?? "E-mail não informado"}</p></div><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Como você quer ser chamado" /><Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Uma breve apresentação (opcional)" /><div className="grid gap-3 sm:grid-cols-2"><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade de origem" /><Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Estado" /></div><Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="País" /><Input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Interesses separados por vírgula" /><label className="block text-sm font-semibold text-[#55716a]">Visibilidade do perfil<select value={visibility} onChange={(e) => setVisibility(e.target.value as "private" | "public")} className="mt-2 h-10 w-full rounded-md border border-[#d7e4d9] bg-white px-3 text-sm font-normal text-[#20332f] outline-none focus:ring-2 focus:ring-[#9bc4a9]"><option value="private">Privado — recomendado</option><option value="public">Público</option></select></label><Button onClick={saveProfile} disabled={updateProfile.isPending} className="w-full rounded-full bg-[#0d5c4d] font-bold text-white hover:bg-[#08483c]">{updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar perfil</Button>{saved && <p className="flex items-center gap-2 text-sm font-semibold text-[#0d5c4d]"><Check className="h-4 w-4" /> {saved}</p>}</CardContent></Card><div className="space-y-6"><Card className="rounded-[26px] border-[#d7e4d9] bg-white"><CardHeader><CardTitle className="flex items-center gap-2 font-display text-xl text-[#123f36]"><BookOpen className="h-5 w-5 text-[#0d5c4d]" /> Meus roteiros</CardTitle><p className="text-sm text-[#71827c]">Roteiros pessoais ficam privados e só podem ser acessados por você.</p></CardHeader><CardContent>{itinerariesLoading ? <Loader2 className="h-5 w-5 animate-spin text-[#0d5c4d]" /> : itineraries?.length ? <div className="space-y-3">{itineraries.map((route) => editingId === route.id ? <div key={route.id} className="rounded-2xl border border-[#9bc4a9] bg-[#f5f8f5] p-4"><Input value={editingTitle} onChange={(e) => setEditingTitle(e.target.value)} /><Textarea value={editingDescription} onChange={(e) => setEditingDescription(e.target.value)} className="mt-3" placeholder="Descrição do roteiro" /><div className="mt-3 flex gap-2"><Button onClick={saveItinerary} disabled={updateItinerary.isPending} className="rounded-full bg-[#0d5c4d] text-white">{updateItinerary.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar</Button><Button variant="outline" onClick={() => setEditingId(null)} className="rounded-full">Cancelar</Button></div></div> : <div key={route.id} className="flex flex-col gap-4 rounded-2xl border border-[#edf1ed] p-4 sm:flex-row sm:items-center"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f1ea] text-[#0d5c4d]"><Compass className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="font-display text-lg font-bold text-[#123f36]">{route.title}</p><p className="mt-1 line-clamp-2 text-sm text-[#71827c]">{route.description ?? "Roteiro personalizado"}</p><p className="mt-2 flex items-center gap-1 text-xs text-[#8b9b92]"><MapPin className="h-3.5 w-3.5" /> Atualizado em {new Date(route.updatedAt).toLocaleDateString("pt-BR")}</p></div><div className="flex shrink-0 gap-2"><Link href={`/minha-conta/roteiros/${route.id}`} ><Button variant="outline" className="rounded-full border-[#cbdccc] text-[#0d5c4d]">Abrir</Button></Link><Button variant="outline" size="icon" onClick={() => beginEdit(route)} aria-label="Editar roteiro" className="rounded-full border-[#cbdccc] text-[#0d5c4d]"><Pencil className="h-4 w-4" /></Button><Button variant="outline" size="icon" onClick={() => removeItinerary(route.id)} aria-label="Excluir roteiro" className="rounded-full border-[#ecc9c0] text-[#b4533d]"><Trash2 className="h-4 w-4" /></Button></div></div>)}</div> : <div className="rounded-2xl bg-[#f5f8f5] p-8 text-center"><Compass className="mx-auto h-7 w-7 text-[#9bc4a9]" /><p className="mt-3 text-sm text-[#71827c]">Você ainda não salvou nenhum roteiro.</p><Link href="/roteiros"><Button className="mt-4 rounded-full bg-[#0d5c4d] text-white">Montar meu primeiro roteiro</Button></Link></div>}</CardContent></Card><Card className="rounded-[26px] border-[#d7e4d9] bg-white"><CardHeader><CardTitle className="flex items-center gap-2 font-display text-xl text-[#123f36]"><ShieldAlert className="h-5 w-5 text-[#c4703a]" /> Privacidade e dados pessoais</CardTitle><p className="text-sm text-[#71827c]">Você pode exercer seus direitos LGPD diretamente por aqui. Solicitações que exigirem retenção legal serão analisadas pela Ouvidoria.</p></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3"><Button variant="outline" onClick={downloadData} disabled={exportData.isFetching} className="rounded-full border-[#cbdccc] text-[#0d5c4d]"><Download className="mr-2 h-4 w-4" /> Exportar meus dados</Button><Button variant="outline" onClick={askConsentWithdrawal} disabled={withdrawConsent.isPending} className="rounded-full border-[#cbdccc] text-[#0d5c4d]">Retirar consentimentos</Button><Button variant="outline" onClick={askDeletion} disabled={requestDeletion.isPending} className="rounded-full border-[#ecc9c0] text-[#b4533d]">Solicitar exclusão</Button></CardContent></Card><Card className="rounded-[26px] border-[#d7e4d9] bg-[#123f36] text-white"><CardContent className="flex items-start gap-4 p-6"><MapPin className="mt-1 h-5 w-5 shrink-0 text-[#f4c56e]" /><div><p className="font-display text-lg font-bold">Privacidade primeiro</p><p className="mt-1 text-sm leading-6 text-white/65">Não coletamos CPF ou data de nascimento para a conta pública. A cidade de origem só é usada quando você decide preenchê-la e pode permanecer privada.</p></div></CardContent></Card></div></div></Shell>;
}

function Shell({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-[#e8f1ea] px-5 py-10"><div className="mx-auto max-w-6xl"><Link href="/" className="mb-8 flex items-center gap-2 font-display font-bold text-[#123f36]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0d5c4d] text-white"><Compass className="h-4 w-4" /></span> Viva Adamantina</Link>{children}</div></div>; }
