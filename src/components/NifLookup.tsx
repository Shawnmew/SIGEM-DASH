import React, { useState } from 'react';
import { Search, Loader2, FileText, CheckCircle2, AlertCircle, Building2, User, ShieldCheck } from 'lucide-react';
import { nifService, NifData } from '@/services/nifService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/**
 * NifLookup Component
 * Provides a premium interface for BI / NIF (Tax Identification Number) consultation.
 */
export const NifLookup: React.FC = () => {
    const [nif, setNif] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<NifData | null>(null);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        const cleanNif = nif.trim();
        if (cleanNif.length < 9) {
            toast.error('O BI / NIF deve ter pelo menos 9 dígitos.');
            return;
        }

        setLoading(true);
        setData(null);
        
        try {
            const result = await nifService.consultaNif(cleanNif);
            if (result.success && result.data) {
                setData(result.data);
                toast.success('Documento localizado com sucesso.');
            } else {
                toast.error(result.message || 'Não foi possível localizar o documento.');
            }
        } catch (error) {
            toast.error('Erro inesperado ao consultar BI / NIF.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6 animate-slide-up">
            <Card className="glass-card overflow-hidden border-none shadow-xl">
                <div className="h-2 bg-primary w-full" />
                <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <FileText className="text-primary w-6 h-6" />
                        Consulta de BI / NIF Centralizada
                    </CardTitle>
                    <CardDescription>
                        Consulte dados de cidadãos e contribuintes em tempo real através da nossa API integrada do SME.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                placeholder="Digite o BI ou NIF (ex: 007023725KS041)"
                                value={nif}
                                onChange={(e) => setNif(e.target.value)}
                                className="pl-10 h-12 border-muted focus-visible:ring-primary"
                                maxLength={14}
                            />
                        </div>
                        <Button 
                            type="submit" 
                            disabled={loading || nif.trim().length < 9}
                            className="h-12 px-8 font-semibold transition-all duration-300 hover:scale-105 active:scale-95 bg-primary text-primary-foreground"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Consultando...
                                </>
                            ) : (
                                'Consultar'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {data && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <Card className="glass-card border-l-4 border-l-primary hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl">
                                    <User className="text-primary w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                                    <h3 className="text-lg font-bold leading-tight">{data.nome}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                    <CheckCircle2 className="text-green-600 w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Estado</p>
                                    <h3 className="text-lg font-bold">{data.estado}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                    <Building2 className="text-blue-600 w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Tipo</p>
                                    <h3 className="text-lg font-bold">{data.tipo}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="glass-card border-l-4 border-l-muted hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-muted rounded-xl">
                                    <AlertCircle className="text-muted-foreground w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Fonte de Dados</p>
                                    <h3 className="text-lg font-bold">{data.fonte}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {data.data_nasc && (
                        <Card className="glass-card border-l-4 border-l-purple-500 hover:shadow-md transition-shadow w-full md:col-span-2 animate-slide-up" style={{ animationDelay: '0.15s' }}>
                            <CardHeader className="pb-3 pt-6">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <ShieldCheck className="text-purple-500 w-5 h-5" />
                                    Dados Biométricos & Biográficos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm pt-0">
                                {data.data_nasc && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Data de Nascimento</p>
                                        <p className="font-semibold">{data.data_nasc}</p>
                                    </div>
                                )}
                                {data.genero && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Género</p>
                                        <p className="font-semibold">{data.genero === 'M' ? 'Masculino' : data.genero === 'F' ? 'Feminino' : data.genero}</p>
                                    </div>
                                )}
                                {data.estado_civil && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Estado Civil</p>
                                        <p className="font-semibold capitalize">{data.estado_civil.toLowerCase()}</p>
                                    </div>
                                )}
                                {data.naturalidade && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Naturalidade</p>
                                        <p className="font-semibold">{data.naturalidade}</p>
                                    </div>
                                )}
                                {data.nacionalidade_nome && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Nacionalidade</p>
                                        <p className="font-semibold">{data.nacionalidade_nome}</p>
                                    </div>
                                )}
                                {data.data_emissao && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-muted-foreground">Data de Emissão</p>
                                        <p className="font-semibold">{data.data_emissao}</p>
                                    </div>
                                )}
                                {(data.pai_nome_completo || data.mae_nome_completo) && (
                                    <div className="space-y-1 sm:col-span-2 md:col-span-3 border-t pt-3 mt-1">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Filiação</p>
                                        {data.pai_nome_completo && <p className="font-semibold"><span className="text-muted-foreground font-normal">Pai:</span> {data.pai_nome_completo}</p>}
                                        {data.mae_nome_completo && <p className="font-semibold mt-1"><span className="text-muted-foreground font-normal">Mãe:</span> {data.mae_nome_completo}</p>}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};
