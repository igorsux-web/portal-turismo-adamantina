import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Check, Loader2, MessageCircle, Star } from "lucide-react";
import { useState } from "react";

type Props = { entityType: "place" | "event"; entityId: number; allowReview?: boolean };
export default function FeedbackPanel({ entityType, entityId, allowReview = false }: Props) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.feedback.list.useQuery({ slug: "adamantina", entityType, entityId });
  const comment = trpc.feedback.comment.useMutation({ onSuccess: () => { setBody(""); setSent("Comentário enviado para moderação."); utils.feedback.list.invalidate(); } });
  const review = trpc.feedback.review.useMutation({ onSuccess: () => { setReviewBody(""); setRating(0); setSent("Avaliação enviada para moderação."); utils.feedback.list.invalidate(); } });
  const [body, setBody] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [rating, setRating] = useState(0);
  const [sent, setSent] = useState("");
  const submitComment = async () => { if (!isAuthenticated) return startLogin(); if (body.trim().length < 2) return; await comment.mutateAsync({ slug: "adamantina", entityType, entityId, body: body.trim() }); };
  const submitReview = async () => { if (!isAuthenticated) return startLogin(); if (!rating) return; await review.mutateAsync({ slug: "adamantina", placeId: entityId, rating, body: reviewBody.trim() || undefined }); };
  return <div className="mt-6 space-y-6"><Card className="rounded-[24px] border-[#d7e4d9] bg-white"><CardHeader><CardTitle className="flex items-center gap-2 font-display text-xl text-[#123f36]"><MessageCircle className="h-5 w-5 text-[#0d5c4d]" /> Avaliações e comentários</CardTitle><p className="text-sm text-[#71827c]">As contribuições passam por revisão antes de aparecerem publicamente.</p></CardHeader><CardContent>{isLoading ? <Loader2 className="h-5 w-5 animate-spin text-[#0d5c4d]" /> : <div className="space-y-4">{allowReview && <div className="rounded-2xl bg-[#f5f8f5] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#71827c]">Sua avaliação</p><div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map((value) => <button key={value} onClick={() => setRating(value)} aria-label={`${value} estrelas`}><Star className={`h-6 w-6 ${value <= rating ? "fill-[#f4c56e] text-[#c4703a]" : "text-[#b5c4ba]"}`} /></button>)}</div><Textarea value={reviewBody} onChange={(e) => setReviewBody(e.target.value)} className="mt-3 bg-white" placeholder="Conte como foi sua experiência (opcional)" /><Button onClick={submitReview} disabled={review.isPending || rating === 0} className="mt-3 rounded-full bg-[#0d5c4d] font-bold text-white">{review.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />} Enviar avaliação</Button></div>}{data?.reviews.map((item) => <div key={`review-${item.id}`} className="border-b border-[#edf1ed] pb-4"><div className="flex items-center gap-2">{[1, 2, 3, 4, 5].map((value) => <Star key={value} className={`h-4 w-4 ${value <= item.rating ? "fill-[#f4c56e] text-[#c4703a]" : "text-[#d5dfd6]"}`} />)}<span className="text-xs font-semibold text-[#899990]">{item.authorName ?? "Visitante"}</span></div>{item.body && <p className="mt-2 text-sm leading-6 text-[#71827c]">{item.body}</p>}</div>)}{data?.comments.map((item) => <div key={`comment-${item.id}`} className="border-b border-[#edf1ed] pb-4"><p className="text-sm leading-6 text-[#71827c]">{item.body}</p><p className="mt-1 text-xs font-semibold text-[#899990]">{item.authorName ?? "Visitante"}</p></div>)}{!data?.reviews.length && !data?.comments.length && <p className="text-sm text-[#71827c]">Ainda não há contribuições publicadas.</p>}<div className="rounded-2xl border border-[#dfe8e1] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#71827c]">Deixe um comentário</p><Textarea value={body} onChange={(e) => setBody(e.target.value)} className="mt-3" placeholder="Compartilhe uma informação útil para outros visitantes" /><Button onClick={submitComment} disabled={comment.isPending || body.trim().length < 2} variant="outline" className="mt-3 rounded-full border-[#c9d9cc] text-[#0d5c4d]">{comment.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageCircle className="mr-2 h-4 w-4" />} Enviar comentário</Button></div>{sent && <p className="flex items-center gap-2 text-sm font-semibold text-[#0d5c4d]"><Check className="h-4 w-4" /> {sent}</p>}</div>}</CardContent></Card></div>;
}
