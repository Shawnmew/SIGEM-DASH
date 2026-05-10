import React, { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import api from "@/lib/api";
import { useTranslation } from "react-i18next";
import { Camera, User, Mail, Phone, Shield, Save, Key } from "lucide-react";

const Perfil = () => {
    const { user, isAdmin, isEntidade } = useAuth();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [fotoFile, setFotoFile] = useState<File | null>(null);
    const [fotoPreview, setFotoPreview] = useState<string | null>(user?.foto_perfil_url || null);

    const [formData, setFormData] = useState({
        nome: user?.nome || "",
        sobrenome: user?.sobrenome || "",
        telefone: user?.telefone || "",
    });

    const [isDetecting, setIsDetecting] = useState(false);
    const [faceDetected, setFaceDetected] = useState<boolean | null>(null);

    const detectFace = async (file: File): Promise<boolean> => {
        setIsDetecting(true);
        setFaceDetected(null);
        
        // Simulação de detecção para feedback imediato enquanto a API faz a validação real
        // Em um cenário real com mais tempo, carregaríamos o face-api.js aqui
        // Por agora, vamos deixar a API fazer o trabalho pesado, mas preparar a UI
        
        return new Promise((resolve) => {
            setTimeout(() => {
                setIsDetecting(false);
                resolve(true); // Permitimos prosseguir para o upload onde a API validará rigidamente
            }, 1000);
        });
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tamanho e tipo básico
            if (!file.type.startsWith('image/')) {
                toast.error("Por favor, selecione uma imagem válida.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            
            setFotoFile(file);
            await detectFace(file);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append("nome", formData.nome);
            data.append("sobrenome", formData.sobrenome);
            data.append("telefone", formData.telefone);
            if (fotoFile) {
                data.append("foto_perfil", fotoFile);
            }

            const response = await api.post("/auth/update-profile", data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success) {
                toast.success(t("profile_updated") || "Perfil atualizado com sucesso!");
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (error: any) {
            console.error("Erro ao atualizar perfil:", error);
            const message = error.response?.data?.message || "Erro ao atualizar perfil";
            toast.error(message);
            
            // Se o erro for de detecção de face (422 da API)
            if (error.response?.status === 422 && message.includes('rosto')) {
                setFaceDetected(false);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">{t("my_profile") || "Meu Perfil"}</h1>
                    <p className="text-muted-foreground">{t("manage_profile_desc") || "Gerencie suas informações pessoais e foto de perfil."}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Lado Esquerdo: Foto e Status */}
                    <Card className="md:col-span-1 border-none shadow-md bg-gradient-to-b from-card to-secondary/20">
                        <CardHeader className="text-center">
                            <div className="relative mx-auto w-32 h-32 mb-4 group">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Avatar className={`w-full h-full border-4 shadow-xl transition-all cursor-zoom-in hover:scale-105 active:scale-95 ${faceDetected === false ? 'border-red-500 scale-95' : 'border-background'}`}>
                                            <AvatarImage src={fotoPreview || ""} className="object-cover" />
                                            <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                                                {user?.nome?.[0]}{user?.sobrenome?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-none">
                                        <div className="relative w-full h-full flex items-center justify-center">
                                            <img 
                                                src={fotoPreview || ""} 
                                                alt={user?.nome} 
                                                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                                            />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                
                                {isDetecting && (
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}

                                <label 
                                    htmlFor="foto-upload" 
                                    className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform"
                                >
                                    <Camera size={18} />
                                    <input 
                                        id="foto-upload" 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                            
                            {faceDetected === false && (
                                <p className="text-[10px] text-red-500 font-bold mb-2 animate-pulse uppercase">
                                    {t("face_not_detected") || "ROSTO NÃO DETECTADO"}
                                </p>
                            )}

                            <CardTitle>{user?.nome} {user?.sobrenome}</CardTitle>
                            <CardDescription className="flex items-center justify-center gap-2 mt-1">
                                <Shield size={14} className="text-primary" />
                                {isAdmin ? t("role_admin") : isEntidade ? t("role_entity") : t("role_user")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail size={16} className="text-muted-foreground" />
                                <span className="truncate">{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Phone size={16} className="text-muted-foreground" />
                                <span>{user?.telefone || t("no_phone") || "Sem telefone"}</span>
                            </div>
                            <div className="pt-4 border-t border-border">
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">{t("status")}:</span>
                                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium uppercase">
                                        {user?.status || "Activo"}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Lado Direito: Formulário de Edição */}
                    <Card className="md:col-span-2 border-none shadow-md">
                        <form onSubmit={handleUpdateProfile}>
                            <CardHeader>
                                <CardTitle>{t("edit_info") || "Editar Informações"}</CardTitle>
                                <CardDescription>{t("update_personal_data") || "Mantenha seus dados de contacto atualizados."}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nome">{t("name") || "Nome"}</Label>
                                        <Input 
                                            id="nome" 
                                            value={formData.nome} 
                                            onChange={(e) => setFormData({...formData, nome: e.target.value})} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sobrenome">{t("last_name") || "Sobrenome"}</Label>
                                        <Input 
                                            id="sobrenome" 
                                            value={formData.sobrenome} 
                                            onChange={(e) => setFormData({...formData, sobrenome: e.target.value})} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="telefone">{t("phone") || "Telefone"}</Label>
                                    <Input 
                                        id="telefone" 
                                        value={formData.telefone} 
                                        onChange={(e) => setFormData({...formData, telefone: e.target.value})} 
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t p-6 mt-4">
                                <Button type="button" variant="outline" className="gap-2">
                                    <Key size={16} />
                                    {t("change_password") || "Mudar Senha"}
                                </Button>
                                <Button type="submit" disabled={loading} className="gap-2 bg-primary">
                                    {loading ? <Save className="animate-spin" size={16} /> : <Save size={16} />}
                                    {t("save_changes") || "Salvar Alterações"}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
};

export default Perfil;
