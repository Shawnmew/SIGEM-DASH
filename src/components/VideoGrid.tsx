import { Video, Clock } from "lucide-react";

const placeholderVideos = [
  { id: 1, title: "Inundação — Luanda Sul", time: "Há 3 min", status: "live" },
  { id: 2, title: "Ponto de evacuação — Viana", time: "Há 8 min", status: "live" },
  { id: 3, title: "Distribuição de ajuda — Benguela", time: "Há 15 min", status: "recent" },
  { id: 4, title: "Estrada danificada — Uíge", time: "Há 22 min", status: "recent" },
  { id: 5, title: "Campo de deslocados — Cunene", time: "Há 30 min", status: "recent" },
  { id: 6, title: "Resgate aéreo — Huíla", time: "Há 45 min", status: "recent" },
];

export function VideoGrid() {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Vídeos em Tempo Real</h3>
        <span className="text-[11px] text-muted-foreground">{placeholderVideos.length} vídeos</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {placeholderVideos.map((video) => (
          <div
            key={video.id}
            className="group relative aspect-video rounded-xl bg-muted border border-border overflow-hidden flex items-center justify-center cursor-pointer hover:border-primary/40 transition-colors"
          >
            <Video className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            {video.status === "live" && (
              <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-crisis-critical text-white animate-pulse-alert">
                AO VIVO
              </span>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/70 to-transparent p-2">
              <p className="text-[10px] font-medium text-white leading-tight truncate">{video.title}</p>
              <p className="text-[9px] text-white/70 flex items-center gap-0.5 mt-0.5">
                <Clock className="h-2.5 w-2.5" /> {video.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
