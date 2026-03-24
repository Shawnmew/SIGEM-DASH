# SIGEM-DASH


# 🚀 Nome do Projeto

Breve descrição do projeto (ex: "Dashboard de Alertas SIGEM com React e Tailwind CSS").

## 🛠️ Tecnologias

- React (Vite ou CRA) · JavaScript / TypeScript · npm / yarn

---

## ⚡ Início Rápido

```bash
# 1. Clonar o repositório
git clone https://github.com/seu-usuario/nome-do-repositorio.git

# 2. Entrar na pasta
cd nome-do-repositorio

# 3. Instalar dependências
npm install

# 4. Rodar o projeto
npm run dev
```

Acesse em: `http://localhost:5173` ou `http://localhost:3000`

---

## 🔄 Atualizando o Projeto

```bash
git pull origin main   # puxa alterações remotas
npm install            # atualiza pacotes se package.json mudou
```

---

## 📁 Estrutura

```
src/
├── components/   # Componentes reutilizáveis
├── pages/        # Páginas da aplicação
└── assets/       # Imagens e estilos globais
```

---

> **Variáveis de ambiente:** copie `.env.example` para `.env` e preencha as chaves necessárias, incluindo `VITE_API_URL` apontando para a instância da **SIGEM-API** (ex.: `http://localhost:8001/api/v1`).
> 
> A aplicação usa o token Bearer retornado pela API para autenticação e o guarda em `localStorage`.
