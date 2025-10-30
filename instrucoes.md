## Configuração e Desenvolvimento Local (Supabase e Frontend)

Para iniciar o ambiente de desenvolvimento local completo (Supabase e Frontend), siga os passos abaixo:

### 1. Pré-requisitos

*   **Docker Desktop:** Certifique-se de que o Docker Desktop esteja instalado e **em execução** no seu sistema. O Supabase CLI usa o Docker para rodar os serviços locais.
*   **Scoop (para Windows):** Para instalar o Supabase CLI, o Scoop é o gerenciador de pacotes recomendado no Windows. Se ainda não estiver instalado:
    1.  Abra o PowerShell *normalmente* (não como administrador).
    2.  Execute: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` (Responda `A` para `Sim para Todos`).
    3.  Execute: `Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression`

### 2. Instalação do Supabase CLI (se ainda não o fez)

No seu terminal PowerShell:

```bash
# Adicionar o bucket do Supabase ao Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git

# Instalar o Supabase CLI
scoop install supabase

# Verificar a instalação (deve mostrar a versão)
supabase --version
```

### 3. Processo de Inicialização do Sistema Local

Para cada sessão de desenvolvimento, siga estes passos na ordem:

1.  **Abra o Docker Desktop** e certifique-se de que ele esteja em execução.
2.  **Abra o Cursor IDE.**
3.  No terminal integrado do Cursor, navegue até o diretório raiz do projeto.
4.  **Inicie os serviços do Supabase localmente:**
    ```bash
    supabase start
    ```
    Este comando vai carregar o banco de dados, autenticação, armazenamento e outros serviços. Ele imprimirá URLs e chaves importantes no terminal.

    **URLs e Chaves dos Serviços Supabase Locais:**
    *   **Studio URL:** `http://127.0.0.1:54323` (Use esta URL no seu navegador para acessar a interface gráfica do seu banco de dados Supabase local).
    *   **API URL:** `http://127.0.0.1:54321`
    *   **GraphQL URL:** `http://127.0.0.1:54321/graphql/v1`
    *   **S3 Storage URL:** `http://127.0.0.1:54321/storage/v1/s3`
    *   **MCP URL:** `http://127.0.0.1:54321/mcp`
    *   **Database URL:** `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
    *   **Mailpit URL:** `http://127.0.0.1:54324`
    *   **Publishable key:** `sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH` (Esta é uma chave de exemplo, use a que aparecer no seu terminal ao executar `supabase start`).
    *   **Secret key:** `sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz` (Esta é uma chave de exemplo, use a que aparecer no seu terminal ao executar `supabase start`).
    *   **S3 Access Key:** `625729a08b95bf1b7ff351a663f3a23c` (Esta é uma chave de exemplo, use a que aparecer no seu terminal ao executar `supabase start`).
    *   **S3 Secret Key:** `850181e4652dd023b7a98c58ae0d2d34bd487ee0cc3254aed6eda37307425907` (Esta é uma chave de exemplo, use a que aparecer no seu terminal ao executar `supabase start`).
    *   **S3 Region:** `local`

5.  **Abra um *segundo* terminal** no Cursor (mantenha o terminal `supabase start` aberto).
6.  Navegue até o diretório raiz do projeto no segundo terminal.
7.  **Inicie o servidor de desenvolvimento do Frontend:**
    ```bash
    npm run dev
    ```
    Este comando iniciará sua aplicação React/Vite. O terminal exibirá uma URL (geralmente `http://localhost:5173/` ou similar) que você pode abrir no seu navegador.

### 4. Parar os Serviços Locais

Quando terminar de desenvolver, você pode parar os serviços do Supabase com:

```bash
supabase stop
```

Isso encerrará todos os contêineres Docker relacionados ao Supabase.

## Gerenciando Dados de Produção (Limpeza de Dados de Teste)

Ao testar no ambiente de produção e antes do lançamento oficial, pode ser necessário "zerar" os dados de teste. 

**⚠️ ATENÇÃO: Faça um BACKUP COMPLETO do seu banco de dados antes de executar qualquer um destes comandos. Eles são destrutivos e apagarão permanentemente os dados.**

### 1. Limpeza de Tabelas com Dados de Teste (e Reinício de IDs)

Para remover todos os dados de uma tabela e reiniciar o contador de IDs automáticos (sequências), use o comando `TRUNCATE TABLE` com a opção `RESTART IDENTITY`. Se houver tabelas com chaves estrangeiras que referenciam a tabela que você está truncando, adicione `CASCADE`.

**Sintaxe:**
```sql
TRUNCATE TABLE nome_da_sua_tabela RESTART IDENTITY CASCADE;
```

**Exemplo de Script SQL para Limpeza:**

```sql
-- Desativar RLS temporariamente para a sessão atual (opcional, mas pode ser necessário para TRUNCATE CASCADE)
-- SET session_replication_role = 'replica'; 

-- Limpar tabelas de dados de teste e reiniciar IDs
TRUNCATE TABLE public.public_contact_requests RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.company_public_pages RESTART IDENTITY CASCADE;

-- Considere estas tabelas com EXTREMO CUIDADO:
-- Se você criou empresas, propriedades ou perfis de usuário APENAS para teste, pode truncá-las.
-- Se já existirem dados REAIS que você quer manter, NÃO TRUNCAR. Em vez disso, use DELETE FROM ... WHERE ...
-- TRUNCATE TABLE public.properties RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE public.companies RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE public.profiles RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE public.user_roles RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE public.system_settings RESTART IDENTITY CASCADE; 

-- Reativar RLS
-- SET session_replication_role = 'origin'; 
```

### 2. Limpeza de Usuários de Autenticação (`auth.users`)

A tabela `auth.users` é uma tabela de sistema. Você **NÃO** deve usar `TRUNCATE` nela.

*   **Pelo Painel do Supabase:** Vá em `Authentication` -> `Users` e delete os usuários de teste manualmente.
*   **Via API/Edge Function (para múltiplos usuários):** Se tiver muitos, você pode escrever um script (usando a `service_role` key) para deletar usuários programaticamente com `supabase.auth.admin.deleteUser(userId)`.

### 3. Como Executar os Comandos SQL

Você pode executar este script SQL no seu projeto Supabase de produção:

*   **SQL Editor no Painel do Supabase (Recomendado):**
    1.  Vá para o painel do seu projeto Supabase no navegador.
    2.  No menu lateral esquerdo, clique em `SQL Editor`.
    3.  Cole os comandos SQL no editor e clique em `Run`.
