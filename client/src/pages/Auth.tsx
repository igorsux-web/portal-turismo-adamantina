import { FormEvent, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startLogin } from "@/const";

const api = async (path: string, body: Record<string, string>) => {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Não foi possível concluir a operação.");
  return data;
};

type Mode = "login" | "register" | "forgot" | "reset" | "verify";

export default function Auth() {
  const [location, navigate] = useLocation();
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const scope = params.get("scope") === "admin" ? "admin" : "user";
  const returnTo = params.get("returnTo") || (scope === "admin" ? "/admin" : "/");
  const token = params.get("token") || "";
  const [mode, setMode] = useState<Mode>(location === "/redefinir-senha" && token ? "reset" : token ? "verify" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      if (mode === "login") {
        await api("/api/auth/password/login", { email, password, scope });
        navigate(returnTo);
      } else if (mode === "register") {
        const result = await api("/api/auth/password/register", { name, email, password });
        setMessage(result.message);
        setMode("login");
      } else if (mode === "forgot") {
        const result = await api("/api/auth/password/forgot", { email });
        setMessage(result.message);
      } else if (mode === "reset") {
        const result = await api("/api/auth/password/reset", { token, password });
        setMessage(result.message);
        setMode("login");
      } else {
        const result = await api("/api/auth/password/verify-email", { token });
        setMessage(result.message);
        setMode("login");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir a operação.");
    } finally { setBusy(false); }
  };

  const title = mode === "register" ? "Criar conta" : mode === "forgot" ? "Recuperar senha" : mode === "reset" ? "Definir nova senha" : mode === "verify" ? "Confirmar e-mail" : scope === "admin" ? "Acesso da Secretaria" : "Entrar no portal";
  const submitLabel = mode === "register" ? "Criar minha conta" : mode === "forgot" ? "Enviar instruções" : mode === "reset" ? "Salvar nova senha" : mode === "verify" ? "Confirmar e-mail" : "Entrar";

  return <main className="min-h-screen bg-[#f5f8f5] px-4 py-10 text-[#123f36]">
    <Card className="mx-auto max-w-md rounded-[28px] border-[#d7e4d9] bg-white shadow-sm">
      <CardHeader className="space-y-3 text-center"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0d5c4d]">Viva Adamantina</p><CardTitle className="font-display text-3xl">{title}</CardTitle><p className="text-sm text-[#71827c]">{scope === "admin" ? "Acesso restrito a contas autorizadas pela Secretaria." : "Acesse seus favoritos, avaliações e roteiros."}</p></CardHeader>
      <CardContent className="space-y-4">
        {mode === "verify" ? <Button onClick={submit as unknown as () => void} disabled={busy} className="w-full rounded-full bg-[#0d5c4d] text-white">{busy ? "Confirmando..." : submitLabel}</Button> : <form onSubmit={submit} className="space-y-4">
          {mode === "register" && <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" required minLength={2} maxLength={160} />}
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu e-mail" required />
          {mode !== "forgot" && <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "reset" ? "Nova senha (mínimo 10 caracteres)" : "Senha (mínimo 10 caracteres)"} required minLength={10} maxLength={128} />}
          <Button type="submit" disabled={busy} className="w-full rounded-full bg-[#0d5c4d] text-white">{busy ? "Aguarde..." : submitLabel}</Button>
        </form>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {message && <p role="status" className="rounded-xl bg-[#e8f1ea] p-3 text-sm text-[#0d5c4d]">{message}</p>}
        {(mode === "login" || mode === "register") && <><div className="flex items-center gap-3 text-xs text-[#8b9b92]"><span className="h-px flex-1 bg-[#d7e4d9]" /> ou <span className="h-px flex-1 bg-[#d7e4d9]" /></div><Button type="button" variant="outline" onClick={() => startLogin()} className="w-full rounded-full border-[#cbdccc]">Continuar com Google</Button></>}
        <div className="flex flex-wrap justify-center gap-3 text-sm text-[#0d5c4d]">
          {mode === "login" && <><button type="button" onClick={() => setMode("register")} className="underline">Criar conta</button><button type="button" onClick={() => setMode("forgot")} className="underline">Esqueci minha senha</button></>}
          {mode !== "login" && <button type="button" onClick={() => setMode("login")} className="underline">Voltar para entrar</button>}
        </div>
      </CardContent>
    </Card>
  </main>;
}
