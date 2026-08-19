# Top Cell Admin

App Android nativo (via Capacitor) pra gerenciar o catálogo da loja:
adicionar/editar/excluir produtos, tirar foto na hora (sem precisar de link),
marcar estoque, tudo sincronizado em tempo real com o app do cliente.

## 1. Configurar o Firebase (uma vez só)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) → **Criar projeto** → nome "topcell" (ou o que preferir).
2. No menu lateral: **Compilação → Firestore Database** → **Criar banco de dados** → modo de produção → qualquer região (ex: `southamerica-east1`).
3. Depois de criado, vá em **Regras** e cole o conteúdo do arquivo `firestore.rules` deste repo → Publicar.
4. No menu lateral: **Compilação → Storage** → **Começar** → modo de produção → mesma região.
5. Em **Regras** do Storage, cole o conteúdo de `storage.rules` deste repo → Publicar.
6. No menu lateral: **Compilação → Authentication** → **Começar** → aba **Sign-in method** → ativa **Anônimo**.
7. Vá em **Configurações do projeto** (ícone de engrenagem) → aba **Geral** → desça até "Seus apps" → clique no ícone **`</>`** (Web) → dá um nome (ex: "topcell-web") → **Registrar app**.
8. Copia o objeto `firebaseConfig` que aparece e cola em `src/lib/firebase.js` (substitui os `"COLE_AQUI"`).
9. Repete esse mesmo `firebaseConfig` no app do cliente (`topcell-app`), quando eu atualizar ele pra ler do Firebase.

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

- `src/lib/firebase.js` — configuração e login anônimo
- `src/lib/config.js` — PIN e categorias
- `src/components/PinGate.jsx` — tela de bloqueio por PIN
- `src/components/ProductList.jsx` — lista/busca/estoque/exclusão
- `src/components/ProductForm.jsx` — cadastro/edição com câmera
- `android/` — projeto nativo gerado pelo Capacitor
- `.github/workflows/build-apk.yml` — pipeline de build automático
