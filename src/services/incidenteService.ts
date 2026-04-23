// src/services/incidenteService.ts
import api from '@/lib/api';

export interface Incidente {
    id: number;
    title: string;
    descricao: string;
    status: string;
    latitude: string;
    longitude: string;
    categoria_id: number;
    municipio_id: number;
    created_at: string;
    updated_at: string;
    user_id: number;
    affected_people: number;
    solucao_descricao?: string;
    resolvido_em?: string;
    categoria?: {
        id: number;
        nome: string;
        descricao: string;
    };
    municipio?: {
        id: number;
        nome: string;
        provincia?: {
            id: number;
            nome: string;
            sigla: string;
        };
    };
    user?: {
        id: number;
        nome: string;
        sobrenome: string;
        email: string;
        telefone?: string;
    };
    midias?: Array<{
        id: number;
        tipo_midia: string;
        url: string;
    }>;
}

export interface IncidentesResponse {
    success: boolean;
    data: Incidente[];
    total: number;
}

export const incidenteService = {
    /**
     * Buscar todos os incidentes sem limite de paginação
     */
    async getAllIncidentes(): Promise<Incidente[]> {
        try {
            // Buscar todos os incidentes de uma vez (sem paginação)
            const response = await api.get('/incidentes/all');
            if (response.data.success) {
                return response.data.data;
            }
            return [];
        } catch (error) {
            console.error('Erro ao buscar todos os incidentes:', error);
            return [];
        }
    },

    /**
     * Buscar incidentes com paginação (alternativa para muitos registros)
     */
    async getIncidentesPaginated(page: number = 1, perPage: number = 50): Promise<{ data: Incidente[]; total: number }> {
        const response = await api.get('/incidentes', { params: { page, per_page: perPage } });
        if (response.data.success) {
            return {
                data: response.data.data.data || response.data.data,
                total: response.data.data.total || response.data.data.length
            };
        }
        return { data: [], total: 0 };
    },

    /**
     * Buscar incidentes com filtros
     */
    async getIncidentesWithFilters(filters: {
        status?: string;
        municipio_id?: number;
        categoria_id?: number;
        search?: string;
        date_from?: string;
        date_to?: string;
    }): Promise<Incidente[]> {
        const response = await api.get('/incidentes/filter', { params: filters });
        if (response.data.success) {
            return response.data.data;
        }
        return [];
    },

    /**
     * Obter estatísticas dos incidentes
     */
    async getIncidentesStats(): Promise<{
        total: number;
        by_status: Record<string, number>;
        by_category: Record<string, number>;
        by_month: Array<{ month: string; total: number }>;
    }> {
        const response = await api.get('/incidentes/stats');
        if (response.data.success) {
            return response.data.data;
        }
        return { total: 0, by_status: {}, by_category: {}, by_month: [] };
    }
};