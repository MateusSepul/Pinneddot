# 📌 Pinned.

Mural coletivo de post-its em tempo real. Escreva uma mensagem ou desenhe algo e fixe no quadro — todo mundo vê na hora.

## ✨ Funcionalidades

- Post-its de **texto** ou **desenho** (canvas)
- Escolha de **cor** do post-it (amarelo, rosa, azul, verde, laranja, branco)
- Posição e rotação aleatórias ao fixar
- **Arrastar** post-its pelo mural (somente o seu)
- **Excluir** os seus próprios pins
- **Tempo real** via Supabase Realtime
- Zoom e scroll no mural
- Sem necessidade de login

## 🛠️ Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [TanStack Router](https://tanstack.com/router) + [TanStack Start](https://tanstack.com/start)
- [Vite](https://vite.dev/) + [Tailwind CSS v4](https://tailwindcss.com/)
- [Supabase](https://supabase.com/) (banco de dados + Realtime)

## 🚀 Rodando localmente

**Pré-requisitos:** Node.js 18+

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## ⚙️ Variáveis de ambiente

O arquivo `.env` já vem configurado com as credenciais do Supabase:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

## 📁 Estrutura

```
src/
├── components/
│   ├── PinNote.tsx      # Post-it individual
│   └── PinEditor.tsx    # Modal de criação
├── routes/
│   └── index.tsx        # Página principal (mural)
├── lib/
│   └── pins.ts          # Tipos e cliente Supabase
└── styles.css           # Design system
supabase/
└── migrations/          # Schema do banco
```

## 📜 Licença

MIT
