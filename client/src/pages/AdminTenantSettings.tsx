import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2, Save, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function AdminTenantSettings() {
  const { user } = useAuth();
  const enabled = user?.role === "platform_admin";
  const { data, isLoading } = trpc.admin.tenantSettings.useQuery({ slug: "adamantina" }, { enabled });
  const update = trpc.admin.updateTenantSettings.useMutation();
  const [form, setForm] = useState({ publicBrandName: "", responsibleSecretariat: "", logoUrl: "", primaryColor: "#0d5c4d", secondaryColor: "#c4703a", officialDomain: "", contactEmail: "", contactPhone: "", ombudsmanUrl: "", socialLinks: "" });
  const [saved, setSaved] = useState("");

  useEffect(() => {
    if (!data) return;
    setForm({ publicBrandName: data.publicBrandName, responsibleSecretariat: data.responsibleSecretariat, logoUrl: data.logoUrl ?? "", primaryColor: data.primaryColor, secondaryColor: data.secondaryColor, officialDomain: data.officialDomain ?? "", contactEmail: data.contactEmail ?? "", contactPhone: data.contactPhone ?? "", ombudsmanUrl: data.ombudsmanUrl ?? "", socialLinks: data.socialLinks ?? "" });
  }, [data]);

  if (!enabled) return null;
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const save = async () => { setSaved(""); await update.mutateAsync({ slug: "adamantina", ...form }); setSaved("Configurações municipais salvas."); };
  return <Card className="rounded-[22px] border-[#d7e4d9] bg-white shadow-[0_10px_25px_rgba(39,73,57,0.04)]"><CardHeader><Badge className="w-fit border-0 bg-[#fff0d6] text-[10px] font-bold uppercase tracking-[0.16em] text-[#9a681d]"><Settings2 className="mr-1 h-3 w-3" /> Somente plataforma</Badge><CardTitle className="mt-2 font-display text-xl text-[#123f36]">Configurações de Adamantina</CardTitle><p className="text-sm text-[#71827c]">Branding, domínio, canais de atendimento e redes sociais oficiais.</p></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Input value={form.publicBrandName} onChange={(e) => set("publicBrandName", e.target.value)} placeholder="Nome público" /><Input value={form.responsibleSecretariat} onChange={(e) => set("responsibleSecretariat", e.target.value)} placeholder="Secretaria responsável" /><Input value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="URL do logo (opcional)" /><Input value={form.officialDomain} onChange={(e) => set("officialDomain", e.target.value)} placeholder="Domínio oficial (opcional)" /><Input value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} placeholder="Cor primária (#000000)" /><Input value={form.secondaryColor} onChange={(e) => set("secondaryColor", e.target.value)} placeholder="Cor secundária (#000000)" /><Input value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="E-mail público" /><Input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="Telefone público" /><Input value={form.ombudsmanUrl} onChange={(e) => set("ombudsmanUrl", e.target.value)} placeholder="URL da Ouvidoria" /><Input value={form.socialLinks} onChange={(e) => set("socialLinks", e.target.value)} placeholder="Redes sociais (JSON ou URLs)" /><div className="sm:col-span-2"><Button onClick={save} disabled={isLoading || update.isPending} className="rounded-xl bg-[#0d5c4d] font-bold text-white">{update.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar configurações</Button>{saved && <span className="ml-3 text-sm font-semibold text-[#0d5c4d]">{saved}</span>}</div></CardContent></Card>;
}
