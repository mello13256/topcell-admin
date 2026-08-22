# Top Cell Admin

App Android nativo (via Capacitor) pra gerenciar o catálogo da loja:
adicionar/editar/excluir produtos, tirar foto na hora (sem precisar de link),
marcar estoque, tudo sincronizado em tempo real com o app do cliente.

Backend: **Supabase** (gratuito, sem necessidade de cartão de crédito).

## 1. Configurar o Supabase (uma vez só)

1. Acesse [supabase.com](https://supabase.com) → **Start your project** → entra com GitHub (sem pedir cartão)
2. **New project** → dá um nome (ex: "topcell") → escolhe uma senha de banco (guarda ela, mas não vamos precisar usar diretamente) → região mais próxima (ex: South America - São Paulo)
3. Espera uns 2 minutos o projeto terminar de provisionar
4. No menu lateral: **SQL Editor** → **New query** → cola o conteúdo do arquivo `supabase-setup.sql` deste repositório → clica em **Run**
   - **Antes de rodar a parte de Storage**: vai em **Storage** (menu lateral) → **New bucket** → nome exatamente `produtos` → marca **Public bucket** → cria. Só depois volta e roda o resto do SQL (a parte de baixo, sobre `storage.objects`).
5. No menu lateral: **Authentication → Providers** → confirma que **Anonymous Sign-ins** está habilitado (geralmente já vem ativado; se não, ativa).
6. **Configurações do projeto** (ícone de engrenagem) → **API** → copia:
   - **Project URL**
   - **anon public** key
7. Cola esses dois valores em `src/lib/supabase.js`, no lugar dos `"COLE_AQUI"`.

## 2. Trocar o PIN de acesso

Edite `src/lib/config.js`, campo `APP_PIN`. Depois é só dar commit/push — o GitHub Actions recompila o `.apk` sozinho.

## 3. Baixar o APK

Toda vez que houver um push na branch `main`, o GitHub Actions compila o app
automaticamente. O `.apk` fica disponível em:

- **Releases** do repositório (mais fácil — link direto pra baixar)
- ou na aba **Actions** → clique no build mais recente → **Artifacts**

## 4. Instalar no celular

1. Baixa o `.apk` direto do link do Release pelo navegador do celular
2. Se aparecer aviso "app de fonte desconhecida", permite a instalação (é normal, porque não veio da Play Store)
3. Abre o app, digita o PIN, pronto

## Estrutura

- `src/lib/supabase.js` — configuração e login anônimo
- `src/lib/config.js` — PIN e categorias
- `src/components/PinGate.jsx` — tela de bloqueio por PIN
- `src/components/ProductList.jsx` — lista/busca/estoque/exclusão (com realtime)
- `src/components/ProductForm.jsx` — cadastro/edição com câmera
- `supabase-setup.sql` — script de configuração do banco de dados
- `android/` — projeto nativo gerado pelo Capacitor
- `.github/workflows/build-apk.yml` — pipeline de build automático
