// src/services/nifService.ts
import api from '@/lib/api';

export interface NifData {
    nif: string;
    nome: string;
    estado: string;
    tipo: string;
    fonte: string;
}

export interface NifResponse {
    success: boolean;
    data?: NifData;
    message?: string;
}

export const nifService = {
    /**
     * Consulta dados de um NIF no backend.
     * @param nif Número de Identificação Fiscal
     */
    async consultaNif(nif: string): Promise<NifResponse> {
        try {
            const response = await api.get('/nif', { params: { nif } });
            return response.data;
        } catch (error: any) {
            console.error('Erro ao consultar NIF:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Erro ao realizar consulta de NIF.'
            };
        }
    }
};
