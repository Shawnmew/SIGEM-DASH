// src/services/dashboardService.ts
import api from '@/lib/api';

export interface DashboardStats {
    total_incidentes: number;
    active_crises: number;
    resolved_crises: number;
    critical_count: number;
    total_affected: number;
    total_volunteers: number;
    total_entidades: number;
    response_rate: number;
    my_incident_count?: number;
    my_volunteer_count?: number;
    confirmed_validation?: number;
    pending_validation?: number;
    entity_validated?: number;
}

export interface ChartData {
    by_month: Array<{ month: string; total: number; affected: number }>;
    by_category: Array<{ name: string; value: number; color: string }>;
    by_status: Array<{ name: string; value: number; color: string }>;
    by_province: Array<{ name: string; value: number }>;
}

export interface RecentAlert {
    id: number;
    mensagem: string;
    tipo: 'critico' | 'urgente' | 'aviso' | 'informativo';
    created_at: string;
    lido: boolean;
    incidente?: {
        id: number;
        title: string;
    };
}

export interface RegionImpact {
    provincia_id: number;
    provincia_nome: string;
    total_incidentes: number;
    total_afetados: number;
}

export const dashboardService = {
    async getStats(provinciaId?: string, municipioId?: string): Promise<DashboardStats> {
        const response = await api.get('/dashboard/stats', {
            params: {
                provincia_id: provinciaId !== 'all' ? provinciaId : undefined,
                municipio_id: municipioId !== 'all' ? municipioId : undefined
            }
        });
        return response.data.data;
    },

    async getChartData(provinciaId?: string, municipioId?: string): Promise<ChartData> {
        const response = await api.get('/dashboard/charts', {
            params: {
                provincia_id: provinciaId !== 'all' ? provinciaId : undefined,
                municipio_id: municipioId !== 'all' ? municipioId : undefined
            }
        });
        return response.data.data;
    },

    async getRecentAlerts(limit: number = 5): Promise<RecentAlert[]> {
        const response = await api.get('/dashboard/recent-alerts', { params: { limit } });
        return response.data.data;
    },

    async getRegionImpact(): Promise<RegionImpact[]> {
        const response = await api.get('/dashboard/region-impact');
        return response.data.data;
    },

    async getVideoFeed(): Promise<any[]> {
        try {
            const response = await api.get('/dashboard/videos');
            return response.data.data || [];
        } catch (error) {
            console.error("Erro ao carregar vídeos:", error);
            return [];
        }
    },

    async reportUser(data: { user_id: number; incidente_id?: number; reason: string }): Promise<any> {
        const response = await api.post('/user-reports', data);
        return response.data;
    },

    async getUserReports(status?: string): Promise<any> {
        const response = await api.get('/user-reports', { params: { status } });
        return response.data;
    },

    async processUserReport(id: number, data: { decision: string; penalty_type?: string; days?: number; admin_comment?: string }): Promise<any> {
        const response = await api.post(`/user-reports/${id}/process`, data);
        return response.data;
    },

    async recoverUserAccount(userId: number): Promise<any> {
        const response = await api.post(`/users/${userId}/recover`);
        return response.data;
    }
};