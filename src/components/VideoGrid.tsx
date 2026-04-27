import { useEffect, useState } from "react";
import { Video, Clock, Play, AlertTriangle } from "lucide-react";
import { dashboardService, VideoItem } from "@/services/dashboardService";
import { SERVER_URL } from "@/lib/api";
import { useNavigate } from "react-router-dom";

export function VideoGrid() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadVideos = async () => {
      try {
        const data = await dashboardService.getVideoFeed();
        setVideos(data);
      } catch (error) {
        console.error("Erro ao carregar vídeos:", error);
      } finally {
        setLoading(false);
      }
    };
    loadVideos();
  }, []);

  const getMediaUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${SERVER_URL}${cleanUrl}`;
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
        <h3 className="font-semibold text-sm">Vídeos em Tempo Real</h3>
        <span className="text-[11px] text-muted-foreground">{videos.length} vídeos recentes</span>
      </div>
      
      {videos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {videos.map((video) => (
            <div
              key={video.id}
              onClick={() => navigate(`/crises/${video.incidente_id}`)}
              className="group relative aspect-video rounded-xl bg-muted border border-border overflow-hidden flex items-center justify-center cursor-pointer hover:border-primary/40 transition-all"
            >
              <video 
                src={getMediaUrl(video.url)} 
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all"
                muted
                onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                onMouseOut={(e) => {
                    const v = e.target as HTMLVideoElement;
                    v.pause();
                    v.currentTime = 0;
                }}
              />
              
              <div className="absolute inset-0 flex items-center justify-center opacity-100 group-hover:opacity-0 transition-opacity">
                <div className="bg-black/20 backdrop-blur-sm p-2 rounded-full">
                    <Play className="h-6 w-6 text-white fill-white" />
                </div>
              </div>

              {video.status === "live" && (
                <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-600 text-white animate-pulse">
                  AO VIVO
                </span>
              )}

              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2">
                <p className="text-[10px] font-medium text-white leading-tight truncate">{video.title}</p>
                <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[9px] text-white/70 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> {video.time}
                    </p>
                    <p className="text-[9px] text-white/70 font-medium">
                        {video.location}
                    </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-40 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
            <AlertTriangle className="h-8 w-8 mb-2 opacity-20" />
            <p className="text-xs">Nenhum vídeo disponível no momento</p>
        </div>
      )}
    </div>
  );
}
