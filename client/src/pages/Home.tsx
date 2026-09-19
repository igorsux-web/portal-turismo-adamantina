import { MapView } from "@/components/Map";
import ContributionForm from "@/components/ContributionForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Compass,
  Heart,
  Hotel,
  Landmark,
  MapPin,
  Menu,
  MessageCircle,
  Navigation,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Utensils,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

const categories = [
  { label: "Atrativos", icon: Landmark, color: "bg-emerald-50 text-emerald-700" },
  { label: "Eventos", icon: CalendarDays, color: "bg-amber-50 text-amber-700" },
  { label: "Hospedagem", icon: Hotel, color: "bg-sky-50 text-sky-700" },
  { label: "Gastronomia", icon: Utensils, color: "bg-rose-50 text-rose-700" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: catalogData } = trpc.catalog.list.useQuery({ slug: "adamantina" });
  const { data: eventData } = trpc.catalog.events.useQuery({ slug: "adamantina", limit: 6 });
  const { data: mapData } = trpc.catalog.map.useQuery({ slug: "adamantina" });
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [mapFilter, setMapFilter] = useState<"Todos" | "Locais" | "Eventos">("Todos");
  const [itinerary, setItinerary] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const sourcePlaces = useMemo(() => (catalogData?.places ?? []).map((place, index) => ({
    id: place.id,
    name: place.name,
    type: place.type ?? "Ponto de interesse",
    description: place.description ?? "Uma experiência para descobrir em Adamantina.",
    rating: "Novo",
    reviews: 0,
    tag: index % 2 === 0 ? "Descoberta" : "Local",
    color: index % 2 === 0 ? "from-emerald-900/90 via-emerald-700/30 to-transparent" : "from-stone-900/90 via-stone-700/30 to-transparent",
    accent: index % 2 === 0 ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-800",
    icon: index % 2 === 0 ? "🌿" : "🏛️",
  })), [catalogData]);

  const filteredPlaces = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return sourcePlaces.filter((place) => {
      const matchesQuery = !normalized || `${place.name} ${place.type} ${place.description}`.toLowerCase().includes(normalized);
      const matchesCategory = activeCategory === "Todos" || place.type.toLowerCase().includes(activeCategory.toLowerCase().replace("s", ""));
      return matchesQuery && matchesCategory;
    });
  }, [activeCategory, query, sourcePlaces]);

  const sourceEvents = useMemo(() => (eventData?.events ?? []).map((event) => ({
    id: event.id,
    date: new Date(event.startsAt).toLocaleDateString("pt-BR", { day: "2-digit" }),
    month: new Date(event.startsAt).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase(),
    title: event.title,
    meta: `${new Date(event.startsAt).toLocaleDateString("pt-BR", { weekday: "short" })} · ${new Date(event.startsAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · ${event.venueName ?? "Adamantina"}`,
    type: "Agenda",
  })), [eventData]);
  const placeCount = catalogData?.places?.length ?? 0;
  const eventCount = eventData?.events?.length ?? 0;
  const mapMarkers = useMemo(() => {
    const places = mapFilter === "Eventos" ? [] : (mapData?.places ?? []).map((place) => ({ id: `place-${place.id}`, position: { lat: Number(place.latitude), lng: Number(place.longitude) }, title: place.name }));
    const events = mapFilter === "Locais" ? [] : (mapData?.events ?? []).map((event) => ({ id: `event-${event.id}`, position: { lat: Number(event.latitude), lng: Number(event.longitude) }, title: event.title }));
    return [...places, ...events];
  }, [mapData, mapFilter]);

  const toggleItinerary = (name: string) => {
    setItinerary((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  };

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#20332f]">
      <header className="sticky top-0 z-40 border-b border-[#dfe8e1]/80 bg-[#fbfaf7]/90 backdrop-blur-xl">
        <div className="container flex h-[76px] items-center justify-between gap-5">
          <Link href="/" className="flex items-center gap-3" aria-label="Ir para o início">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0d5c4d] text-white shadow-[0_10px_22px_rgba(13,92,77,0.22)]">
              <Compass className="h-5 w-5" />
            </div>
            <div className="leading-none">
              <p className="font-display text-xl font-bold tracking-[-0.04em] text-[#123f36]">Viva Adamantina</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#7f918b]">Turismo & cultura</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#59716b] lg:flex">
            <a href="#explore" className="transition-colors hover:text-[#0d5c4d]">Explorar</a>
            <a href="#eventos" className="transition-colors hover:text-[#0d5c4d]">Eventos</a>
            <Link href="/roteiros" className="transition-colors hover:text-[#0d5c4d]">Roteiros</Link>
            <a href="#sobre" className="transition-colors hover:text-[#0d5c4d]">Sobre a cidade</a>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link href="/admin" className="text-sm font-semibold text-[#59716b] transition-colors hover:text-[#0d5c4d]">Área da secretaria</Link>
            {isAuthenticated ? <Link href="/minha-conta"><Button className="rounded-full bg-[#0d5c4d] px-5 font-bold text-white shadow-[0_8px_18px_rgba(13,92,77,0.18)] hover:bg-[#08483c]">Minha conta</Button></Link> : <Button onClick={() => startLogin()} className="rounded-full bg-[#0d5c4d] px-5 font-bold text-white shadow-[0_8px_18px_rgba(13,92,77,0.18)] hover:bg-[#08483c]">Entrar</Button>}
          </div>
          <button className="rounded-xl p-2 text-[#0d5c4d] sm:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label="Abrir menu">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && <div className="border-t border-[#dfe8e1] bg-[#fbfaf7] px-5 py-4 sm:hidden"><div className="container flex flex-col gap-4 text-sm font-semibold"><a href="#explore" onClick={() => setMenuOpen(false)}>Explorar</a><a href="#eventos" onClick={() => setMenuOpen(false)}>Eventos</a><Link href="/roteiros" onClick={() => setMenuOpen(false)}>Roteiros</Link><Link href="/admin">Área da secretaria</Link><Button onClick={() => startLogin()} className="rounded-full bg-[#0d5c4d] text-white">Entrar</Button></div></div>}
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-[#dfe8e1] bg-[#e8f1ea]">
          <div className="absolute -right-32 -top-36 h-[500px] w-[500px] rounded-full bg-[#c9dfcc]/70 blur-3xl" />
          <div className="absolute -bottom-40 left-[36%] h-[430px] w-[430px] rounded-full bg-[#f6d9a8]/40 blur-3xl" />
          <div className="container relative grid min-h-[560px] items-center gap-12 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-20">
            <div className="max-w-xl">
              <Badge className="mb-6 rounded-full border-0 bg-white/75 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0d5c4d] shadow-sm"><Sparkles className="mr-2 h-3.5 w-3.5" /> Descubra o melhor da cidade</Badge>
              <h1 className="font-display text-5xl font-bold leading-[0.98] tracking-[-0.06em] text-[#123f36] sm:text-6xl lg:text-[76px]">Viva a cidade.<br /><span className="text-[#c4703a]">Sinta Adamantina.</span></h1>
              <p className="mt-7 max-w-lg text-lg leading-8 text-[#59716b]">Um guia vivo para encontrar lugares, sabores, histórias e eventos que fazem da nossa cidade um destino para descobrir com calma.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="#explore"><Button className="h-12 rounded-full bg-[#0d5c4d] px-6 text-base font-bold text-white shadow-[0_12px_24px_rgba(13,92,77,0.2)] hover:bg-[#08483c]">Começar a explorar <ArrowRight className="ml-2 h-4 w-4" /></Button></a>
                <a href="#eventos"><Button variant="outline" className="h-12 rounded-full border-[#bdd1c1] bg-white/50 px-6 text-base font-bold text-[#0d5c4d] hover:bg-white">Ver agenda</Button></a>
              </div>
              <div className="mt-12 flex items-center gap-7 text-sm text-[#59716b]"><div><strong className="font-display text-2xl text-[#123f36]">{placeCount}</strong><span className="ml-2">lugares publicados</span></div><div className="h-8 w-px bg-[#bad0bf]" /><div><strong className="font-display text-2xl text-[#123f36]">{eventCount}</strong><span className="ml-2">eventos próximos</span></div></div>
            </div>
            <div className="relative mx-auto w-full max-w-[540px] lg:justify-self-end">
              <div className="absolute -left-7 top-12 z-10 hidden rounded-2xl border border-white/70 bg-white/90 p-3 shadow-xl backdrop-blur sm:block"><div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fce3cf] text-[#c4703a]"><MapPin className="h-4 w-4" /></div><div><p className="text-[10px] font-bold uppercase tracking-wider text-[#8b9c96]">Você está aqui</p><p className="text-sm font-bold text-[#20332f]">Adamantina, SP</p></div></div></div>
              <div className="relative overflow-hidden rounded-[34px] border-[10px] border-white/85 bg-[#2a5a4f] shadow-[0_24px_55px_rgba(33,76,62,0.22)]">
                <div className="hero-art relative aspect-[0.88] overflow-hidden bg-[linear-gradient(145deg,#6e9d77_0%,#265c4e_43%,#173c39_100%)]">
                  <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 35% 22%, #f8dfaa 0 3%, transparent 3.5%), radial-gradient(circle at 71% 36%, #d8efce 0 2%, transparent 2.5%), linear-gradient(118deg, transparent 0 42%, #ddbd76 42.5% 43.5%, transparent 44%), linear-gradient(35deg, transparent 0 57%, #8fc09b 57.5% 60%, transparent 60.5%)" }} />
                  <div className="absolute -bottom-12 -left-12 h-72 w-72 rounded-full border-[24px] border-[#a7d19e]/30" /><div className="absolute bottom-8 right-7 h-52 w-52 rounded-full border-[18px] border-[#e9d39b]/35" />
                  <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/25 bg-[#143d35]/70 p-5 text-white backdrop-blur-md"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d8efce]">Um convite para ir mais longe</p><p className="mt-2 font-display text-2xl font-bold leading-tight">Cada caminho guarda uma história.</p><div className="mt-4 flex items-center gap-2 text-xs text-white/75"><Navigation className="h-3.5 w-3.5" /> Roteiros para viver no seu ritmo</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="explore" className="container py-20">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c4703a]">Encontre seu próximo passeio</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.04em] text-[#123f36] sm:text-5xl">O que você quer viver hoje?</h2></div><p className="max-w-sm text-sm leading-6 text-[#71827c]">Explore experiências, apoie negócios locais e monte um dia que tenha a sua cara.</p></div>
          <div className="mt-9 flex max-w-3xl items-center gap-3 rounded-2xl border border-[#d8e4da] bg-white p-2 shadow-[0_8px_25px_rgba(37,75,59,0.05)]"><Search className="ml-3 h-5 w-5 text-[#8aa097]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busque por um lugar, sabor, evento..." className="h-11 border-0 bg-transparent text-base shadow-none focus-visible:ring-0" /><Button className="hidden rounded-xl bg-[#c4703a] px-5 font-bold text-white hover:bg-[#a95c2f] sm:flex">Buscar</Button></div>
          <div className="mt-6 flex flex-wrap gap-3"><button onClick={() => setActiveCategory("Todos")} className={`rounded-full px-4 py-2 text-sm font-bold transition ${activeCategory === "Todos" ? "bg-[#0d5c4d] text-white" : "bg-[#eef4ef] text-[#55716a] hover:bg-[#dfece2]"}`}>Todos</button>{categories.map(({ label, icon: Icon, color }) => <button key={label} onClick={() => setActiveCategory(label)} className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${activeCategory === label ? "bg-[#0d5c4d] text-white" : `${color} hover:opacity-80`}`}><Icon className="h-4 w-4" />{label}</button>)}</div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filteredPlaces.length ? filteredPlaces.map((place) => <Card key={place.name} className="group overflow-hidden rounded-[24px] border-[#e1e9e2] bg-white py-0 shadow-[0_12px_28px_rgba(39,73,57,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_34px_rgba(39,73,57,0.12)]"><div className={`relative flex h-44 items-end overflow-hidden bg-gradient-to-br ${place.color}`}><div className="absolute inset-0 flex items-center justify-center text-[76px] opacity-35 grayscale transition duration-500 group-hover:scale-110 group-hover:grayscale-0">{place.icon}</div><div className="absolute inset-x-4 bottom-4 flex items-center justify-between"><Badge className={`${place.accent} border-0 font-bold`}>{place.tag}</Badge><button onClick={() => toggleItinerary(place.name)} className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/30 backdrop-blur ${itinerary.includes(place.name) ? "bg-[#f4c56e] text-[#5f3e13]" : "bg-black/20 text-white hover:bg-white/20"}`} aria-label="Adicionar ao roteiro">{itinerary.includes(place.name) ? <Check className="h-4 w-4" /> : <Heart className="h-4 w-4" />}</button></div></div><CardHeader className="pb-2"><div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-[#879991]"><span>{place.type}</span><span className="flex items-center gap-1 text-[#c4703a]"><Star className="h-3.5 w-3.5 fill-current" /> {place.rating} <span className="font-normal text-[#9cacA6]">({place.reviews})</span></span></div><CardTitle className="font-display text-2xl tracking-[-0.04em] text-[#123f36]"><Link href={`/locais/${place.id}`} className="hover:text-[#0d5c4d]">{place.name}</Link></CardTitle></CardHeader><CardContent className="pb-6"><p className="text-sm leading-6 text-[#71827c]">{place.description}</p><button onClick={() => toggleItinerary(place.name)} className="mt-5 flex items-center text-sm font-bold text-[#0d5c4d]">{itinerary.includes(place.name) ? "Adicionado ao seu roteiro" : "Adicionar ao meu roteiro"}<ChevronRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" /></button></CardContent></Card>) : <div className="rounded-2xl border border-dashed border-[#cbdccc] bg-white p-10 text-center text-sm text-[#71827c] md:col-span-2 lg:col-span-3">Ainda não há locais publicados para este filtro.</div>}</div>
        </section>

        <section className="container py-10"><div className="mx-auto max-w-2xl"><ContributionForm /></div></section>

        <section className="border-y border-[#dfe8e1] bg-[#f1f6f1] py-20">
          <div className="container grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr]"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c4703a]">Veja de perto</p><h2 className="mt-3 font-display text-4xl font-bold leading-tight tracking-[-0.04em] text-[#123f36] sm:text-5xl">Tudo começa no mapa.</h2><p className="mt-5 max-w-md text-base leading-7 text-[#71827c]">Encontre experiências perto de você, descubra novos bairros e deixe o mapa inspirar o próximo destino.</p><div className="mt-8 flex flex-col gap-4"><div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0d5c4d] shadow-sm"><MapPin className="h-4 w-4" /></div><div><p className="font-bold text-[#20332f]">Pontos que contam histórias</p><p className="mt-1 text-sm text-[#71827c]">Atrativos, cultura, natureza e serviços em um só lugar.</p></div></div><div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0d5c4d] shadow-sm"><Navigation className="h-4 w-4" /></div><div><p className="font-bold text-[#20332f]">Roteiro do seu jeito</p><p className="mt-1 text-sm text-[#71827c]">Salve seus favoritos e organize um passeio personalizado.</p></div></div></div></div><div className="relative overflow-hidden rounded-[28px] border-8 border-white bg-[#dce9df] shadow-[0_18px_40px_rgba(37,75,59,0.12)]"><MapView className="h-[420px]" initialCenter={{ lat: -21.685, lng: -51.073 }} initialZoom={14} markers={mapMarkers} /><div className="pointer-events-none absolute left-5 top-5 flex gap-2"><Badge className="border border-white/80 bg-white/90 px-3 py-2 text-[#0d5c4d] shadow-lg"><MapPin className="mr-1.5 h-3.5 w-3.5 fill-[#c4703a] text-[#c4703a]" /> {mapMarkers.length} pontos no mapa</Badge></div><div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2"><button onClick={() => setMapFilter("Todos")} className={`rounded-full px-3 py-1.5 text-xs font-bold shadow ${mapFilter === "Todos" ? "bg-[#0d5c4d] text-white" : "bg-white/90 text-[#55716a]"}`}>Todos</button><button onClick={() => setMapFilter("Locais")} className={`rounded-full px-3 py-1.5 text-xs font-bold shadow ${mapFilter === "Locais" ? "bg-[#0d5c4d] text-white" : "bg-white/90 text-[#55716a]"}`}>Locais</button><button onClick={() => setMapFilter("Eventos")} className={`rounded-full px-3 py-1.5 text-xs font-bold shadow ${mapFilter === "Eventos" ? "bg-[#0d5c4d] text-white" : "bg-white/90 text-[#55716a]"}`}>Eventos</button></div></div></div>
        </section>

        <section id="eventos" className="container py-20"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c4703a]">A cidade em movimento</p><h2 className="mt-3 font-display text-4xl font-bold tracking-[-0.04em] text-[#123f36] sm:text-5xl">Acontece em Adamantina</h2></div><Link href="/eventos" className="inline-flex items-center justify-start font-bold text-[#0d5c4d] hover:text-[#c4703a]">Ver todos os eventos <ArrowRight className="ml-2 h-4 w-4" /></Link></div><div className="mt-10 grid gap-4 lg:grid-cols-3">{sourceEvents.length ? sourceEvents.map((event) => <Card key={event.title} className="group rounded-[22px] border-[#e1e9e2] bg-white p-5 shadow-[0_10px_25px_rgba(39,73,57,0.05)] transition hover:border-[#b8d0bd] hover:shadow-lg"><div className="flex gap-4"><div className="flex h-[68px] w-[62px] shrink-0 flex-col items-center justify-center rounded-2xl bg-[#eef5ee] text-[#0d5c4d]"><span className="font-display text-2xl font-bold leading-none">{event.date}</span><span className="mt-1 text-[10px] font-bold tracking-widest">{event.month}</span></div><div><Badge className="border-0 bg-[#fff0e2] text-[10px] font-bold uppercase tracking-wide text-[#b46231]">{event.type}</Badge><h3 className="mt-2 font-display text-xl font-bold leading-tight tracking-[-0.03em] text-[#20332f]">{event.title}</h3><p className="mt-2 flex items-center gap-1.5 text-xs text-[#82928b]"><Clock3 className="h-3.5 w-3.5" /> {event.meta}</p></div></div><Link href={`/eventos/${event.id}`} className="mt-5 flex w-full items-center justify-between border-t border-[#edf1ed] pt-4 text-sm font-bold text-[#0d5c4d]">Ver detalhes <ChevronRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link></Card>) : <div className="rounded-2xl border border-dashed border-[#cbdccc] bg-white p-10 text-center text-sm text-[#71827c] lg:col-span-3">Ainda não há eventos próximos publicados.</div>}</div></section>

        <section id="roteiros" className="container pb-20"><div className="relative overflow-hidden rounded-[30px] bg-[#0d5c4d] px-7 py-12 text-white shadow-[0_18px_40px_rgba(13,92,77,0.18)] sm:px-12"><div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[26px] border-white/10" /><div className="absolute bottom-[-80px] left-[44%] h-52 w-52 rounded-full border-[18px] border-[#f4c56e]/15" /><div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]"><div><Badge className="border-0 bg-white/15 text-[#d8efce]">Seu próximo dia começa aqui</Badge><h2 className="mt-4 max-w-xl font-display text-4xl font-bold leading-tight tracking-[-0.05em] sm:text-5xl">Monte um roteiro e viva mais da cidade.</h2><p className="mt-4 max-w-xl leading-7 text-white/70">Salve lugares, combine experiências e compartilhe um passeio feito sob medida para você.</p></div><div className="flex flex-col gap-3 sm:flex-row lg:flex-col"><Button onClick={() => startLogin()} className="rounded-full bg-[#f4c56e] px-6 font-bold text-[#5d421e] hover:bg-[#f7d88d]">Criar meu roteiro <ArrowRight className="ml-2 h-4 w-4" /></Button><div className="flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm text-white/75"><Heart className="h-4 w-4" /> {itinerary.length ? `${itinerary.length} lugares selecionados` : "Comece pelos favoritos"}</div></div></div></div></section>

        <section id="sobre" className="border-t border-[#dfe8e1] bg-white py-16"><div className="container grid gap-8 md:grid-cols-3"><div className="md:col-span-1"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c4703a]">Uma construção coletiva</p><h2 className="mt-3 font-display text-3xl font-bold tracking-[-0.04em] text-[#123f36]">Turismo feito por quem vive aqui.</h2></div><div className="grid gap-6 md:col-span-2 sm:grid-cols-3"><div><ShieldCheck className="h-5 w-5 text-[#0d5c4d]" /><p className="mt-3 font-bold text-[#20332f]">Informação confiável</p><p className="mt-2 text-sm leading-6 text-[#71827c]">Conteúdo revisado pela Secretaria de Cultura e Turismo.</p></div><div><MessageCircle className="h-5 w-5 text-[#0d5c4d]" /><p className="mt-3 font-bold text-[#20332f]">Voz da comunidade</p><p className="mt-2 text-sm leading-6 text-[#71827c]">Moradores e turistas ajudam a manter a cidade viva.</p></div><div><QrCode className="h-5 w-5 text-[#0d5c4d]" /><p className="mt-3 font-bold text-[#20332f]">Dados que ajudam</p><p className="mt-2 text-sm leading-6 text-[#71827c]">Presenças e tendências apoiam decisões públicas.</p></div></div></div></section>
      </main>

      <footer className="border-t border-[#dfe8e1] bg-[#f6f8f5] py-8"><div className="container flex flex-col justify-between gap-4 text-sm text-[#71827c] sm:flex-row sm:items-center"><div className="flex items-center gap-2 font-display font-bold text-[#123f36]"><Compass className="h-4 w-4" /> Viva Adamantina</div><p>Uma iniciativa de turismo, cultura e comunidade.</p><div className="flex gap-4"><Link href="/admin" className="font-semibold hover:text-[#0d5c4d]">Área da secretaria</Link><button onClick={() => startLogin()} className="font-semibold hover:text-[#0d5c4d]">Entrar</button></div></div></footer>
    </div>
  );
}
