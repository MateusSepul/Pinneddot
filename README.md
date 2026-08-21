# Pinned Ideas

Crie um web app chamado "Pinned." com o seguinte comportamento:

**Conceito geral**

Uma tela (mural) cheia de post-its, cada um com um "alfinete" desenhado no topo, como se estivesse pregado na parede/quadro. Qualquer usuário pode criar um novo post-it, escrever uma mensagem curta ou desenhar algo nele, e fixá-lo no mural. Todos os usuários que acessarem o site devem ver os post-its que outras pessoas fixaram, em tempo real (ou pelo menos ao recarregar a página).

**Funcionalidades principais**

1. Botão flutuante "+ Novo Pin" que abre um modal/editor.

2. No editor, o usuário escolhe entre dois modos:

   - Modo texto: escreve uma mensagem curta (limite de ~200 caracteres).

   - Modo desenho: um canvas simples onde pode desenhar com o mouse/touch (cores básicas e um botão de "limpar").

3. O usuário escolhe a cor do post-it (branco, amarelo, rosa, azul, verde, laranja).

4. Ao salvar, o post-it aparece no mural em uma posição, com leve rotação aleatória (entre -8° e 8°) para parecer fixado à mão, e um ícone de alfinete no topo.

5. O post-it deve poder ser arrastado (drag and drop) pelo mural por quem o criou, mas isso é opcional na v1.

6. O mural deve ter um fundo tipo "quadro de cortiça" (textura), e deve permitir zoom/scroll caso tenha muitos post-its (mural infinito ou com scroll).

7. Todos os usuários (sem necessidade de login) devem ver os mesmos post-its — os dados são compartilhados publicamente.

8. Adicionar um contador simples de quantos post-its existem no mural.

9. Cada post-it deve guardar a data de criação e, opcionalmente, um nome/apelido que o usuário digite (opcional, pode ficar "Anônimo").

10. Adicionar um botão de "excluir" apenas visível para quem criou aquele post-it (usar um identificador salvo no localStorage do navegador para saber quais são "meus").

**Estilo visual**

Design lúdico e caloroso, cores vivas, sombra sutil embaixo de cada post-it para dar profundidade, fonte manuscrita para o texto dos post-its, mural com fundo neutro (madeira ou cortiça). Interface responsiva (funciona bem no celular também).

**Dados**

Use Supabase (já integrado ao Lovable) para armazenar os post-its em uma tabela pública, com campos: id, tipo (texto/desenho), conteúdo (texto ou imagem/base64 ou URL do desenho), cor, posição x/y, rotação, autor (opcional), criado_em. Ative Realtime do Supabase para que novos post-its apareçam automaticamente para todos os usuários conectados, sem precisar recarregar a página.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2aeeea8e-6e7e-43c7-a530-f0b62068ef52).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
