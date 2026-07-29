import { useEffect, useState } from "react";
import { Video, Clock, Play, AlertTriangle, Image as ImageIcon } from "lucide-react";
import { dashboardService, VideoItem } from "@/services/dashboardService";
import { SERVER_URL } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface VideoGridProps {
  provinciaId?: string;
  municipioId?: string;
}

export function VideoGrid({ provinciaId = "all", municipioId = "all" }: VideoGridProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadVideos = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const data = await dashboardService.getVideoFeed(provinciaId, municipioId);
      setVideos(data);
    } catch (error) {
      console.error("Erro ao carregar mídias:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos(true);

    // Polling em tempo real a cada 8 segundos para atualizar mídias reportadas
    const interval = setInterval(() => {
      loadVideos(false);
    }, 8000);

    return () => clearInterval(interval);
  }, [provinciaId, municipioId]);

  const getMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${SERVER_URL}${cleanUrl}`;
  };

  const isVideoFile = (item: VideoItem) => {
    if (item.tipo_midia) {
      return item.tipo_midia === 'video';
    }
    const url = item.url.toLowerCase();
    return url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || url.endsWith('.avi');
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-card border border-border p-5 h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-5 animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Mídias em Tempo Real</h3>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">{videos.length} mídias recentes</span>
      </div>
      
      {videos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {videos.map((item) => {
            const isVid = isVideoFile(item);
            const mediaUrl = getMediaUrl(item.url);

            return (
              <div
                key={item.id}
                onClick={() => navigate(`/crises/${item.incidente_id}`)}
                className="group relative aspect-video rounded-xl bg-muted border border-border overflow-hidden flex items-center justify-center cursor-pointer hover:border-primary/40 transition-all shadow-sm"
              >
                {isVid ? (
                  <>
                    <video 
                      src={mediaUrl} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all"
                      muted
                      onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                      onMouseOut={(e) => {
                          const v = e.target as HTMLVideoElement;
                          v.pause();
                          v.currentTime = 0;
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity pointer-events-none">
                      <div className="bg-black/40 backdrop-blur-sm p-2 rounded-full">
                          <Play className="h-5 w-5 text-white fill-white" />
                      </div>
                    </div>
                  </>
                ) : (
                  <img
                    src={mediaUrl}
                    alt={item.title}
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1590496793929-36417d3117de?w=500&auto=format&fit=crop&q=60";
                    }}
                  />
                )}

                {item.status === "live" && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-600 text-white animate-pulse shadow-sm">
                    {isVid ? "VÍDEO AO VIVO" : "FOTO RECENTE"}
                  </span>
                )}

                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2">
                  <p className="text-[10px] font-medium text-white leading-tight truncate">{item.title}</p>
                  <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[9px] text-white/80 flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" /> {item.time}
                      </p>
                      <p className="text-[9px] text-white/80 font-medium">
                          {item.location}
                      </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-40 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
            <AlertTriangle className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-xs">Nenhuma mídia reportada disponível no momento</p>
        </div>
      )}
    </div>
  );
}

