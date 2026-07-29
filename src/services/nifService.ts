// src/services/nifService.ts
import api from '@/lib/api';

export interface NifData {
    nif: string;
    nome: string;
    estado: string;
    tipo: string;
    fonte: string;
    apelido?: string | null;
    data_nasc?: string | null;
    genero?: string | null;
    naturalidade?: string | null;
    nacionalidade_nome?: string | null;
    pai_nome_completo?: string | null;
    mae_nome_completo?: string | null;
    estado_civil?: string | null;
    data_emissao?: string | null;
    emissao_local?: string | null;
}

export interface NifResponse {
    success: boolean;
    data?: NifData;
    message?: string;
}

export const nifService = {
    /**
     * Consulta dados de um BI/NIF no backend.
     * @param nif Número de Identificação Fiscal ou Bilhete de Identidade
     */
    async consultaNif(nif: string): Promise<NifResponse> {
        try {
            const response = await api.post('/bi', { bi: nif });
            return response.data;
        } catch (error: any) {
            console.error('Erro ao consultar BI/NIF:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Erro ao realizar consulta de BI/NIF.'
            };
        }
    }
};
