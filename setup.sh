#!/bin/bash

# --- Script de Setup para Deploy do ImoGuru ---

# Cores para o output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir seções
print_section() {
    echo -e "${BLUE}=======================================================================${NC}"
    echo -e "${BLUE} $1 ${NC}"
    echo -e "${BLUE}=======================================================================${NC}"
}

# Carregar variáveis do arquivo de configuração
if [ -f "deploy.env" ]; then
    source deploy.env
else
    echo -e "${YELLOW}AVISO: Arquivo 'deploy.env' não encontrado. Algumas informações precisarão ser digitadas manualmente.${NC}"
fi

# Função para preparação do deploy completo
run_full_deploy() {
    print_section "Fase 1: Preparando o Banco de Dados de Produção"
    
    echo "Vamos conectar o CLI do Supabase ao seu projeto de produção."
    echo -e "O ID do seu projeto é: ${YELLOW}${PROJECT_REF_ID}${NC}"
    read -p "O ID está correto? (s/n): " confirm_id
    if [[ "$confirm_id" != "s" ]]; then
        read -p "Por favor, insira o ID correto do projeto Supabase: " PROJECT_REF_ID
    fi

    # Remover .env corrompido se existir (Supabase CLI cria o seu próprio)
    if [ -f .env ]; then
        echo -e "${YELLOW}Removendo arquivo .env existente (pode estar corrompido)...${NC}"
        rm -f .env
    fi
    
    echo "Executando: supabase link --project-ref ${PROJECT_REF_ID}"
    supabase link --project-ref ${PROJECT_REF_ID} || {
        echo -e "${YELLOW}Erro ao fazer link. Tentando novamente sem arquivo .env...${NC}"
        rm -f .env 2>/dev/null
        supabase link --project-ref ${PROJECT_REF_ID}
    }
    echo -e "${GREEN}Supabase CLI conectado ao projeto de produção.${NC}\n"

    read -p "Deseja ENVIAR a estrutura do banco de dados local para a produção (supabase db push)? (s/n): " confirm_push
    if [[ "$confirm_push" == "s" ]]; then
        echo "Executando: supabase db push"
        supabase db push
        echo -e "${GREEN}Estrutura do banco de dados enviada para a produção.${NC}"
    else
        echo -e "${YELLOW}A estrutura do banco de dados não foi enviada. Lembre-se de fazer isso manualmente se for um deploy inicial.${NC}"
    fi

    print_section "Fase 2: Gerando Bloco de Variáveis de Ambiente para o EasyPanel"
    
    echo "O bloco de texto abaixo contém todas as variáveis de ambiente que você precisa."
    echo "Copie este bloco inteiro (das linhas ----- INÍCIO ----- até ----- FIM -----)"
    echo "e cole na seção 'Environment Variables' do seu projeto no EasyPanel."
    
    # Pergunta sobre o domínio
    if [ -n "${CORS_ORIGIN}" ] && [ "${CORS_ORIGIN}" != "EDITAR_DEPOIS_NO_EASYPANEL" ]; then
        echo -e "Domínio encontrado no deploy.env: ${YELLOW}${CORS_ORIGIN}${NC}"
        read -p "Usar este domínio? (s/n): " use_env_domain
        if [[ "$use_env_domain" == "s" ]]; then
            CORS_ORIGIN_VAL="${CORS_ORIGIN}"
        else
            read -p "Digite o domínio principal (ex: https://app.meusite.com): " domain_input
            CORS_ORIGIN_VAL="${domain_input:-EDITAR_DEPOIS_NO_EASYPANEL}"
        fi
    else
        read -p "Qual será o domínio principal da aplicação (ex: https://app.meusite.com)? Deixe em branco para usar temporário do EasyPanel: " domain_input
        CORS_ORIGIN_VAL="${domain_input:-EDITAR_DEPOIS_NO_EASYPANEL}"
    fi
    
    if [[ "$CORS_ORIGIN_VAL" == "EDITAR_DEPOIS_NO_EASYPANEL" ]]; then
        echo -e "${YELLOW}O domínio não foi definido. Lembre-se de atualizá-lo no EasyPanel depois.${NC}"
    fi

    echo -e "\n${YELLOW}----- INÍCIO - VARIÁVEIS PARA O FRONTEND -----${NC}"
    echo "VITE_SUPABASE_URL=\"${VITE_SUPABASE_URL}\""
    echo "VITE_SUPABASE_PUBLISHABLE_KEY=\"${VITE_SUPABASE_PUBLISHABLE_KEY}\""
    echo -e "${YELLOW}----- VARIÁVEIS PARA O BACKEND -----${NC}"
    echo "DB_HOST=\"${DB_HOST}\""
    echo "DB_PORT=\"${DB_PORT}\""
    echo "DB_NAME=\"${DB_NAME}\""
    echo "DB_USER=\"${DB_USER}\""
    echo "DB_PASSWORD=\"${DB_PASSWORD}\""
    echo "JWT_SECRET=\"${JWT_SECRET}\""
    echo "BOOTSTRAP_SECRET=\"${BOOTSTRAP_SECRET}\""
    if [ -n "${RESEND_API_KEY}" ]; then
        echo "RESEND_API_KEY=\"${RESEND_API_KEY}\""
    fi
    echo "CORS_ORIGIN=\"${CORS_ORIGIN_VAL}\""
    echo -e "${YELLOW}----- FIM - COPIE ATÉ AQUI -----${NC}\n"
    
    echo -e "${BLUE}NOTA:${NC} Se você estiver usando docker-compose ou apps separados no EasyPanel,"
    echo "coloque as variáveis VITE_* no app do FRONTEND e as DB_* e outras no app do BACKEND."
    echo ""
    
    echo -e "${GREEN}Processo de preparação concluído!${NC}\n"
    
    print_section "Próximos Passos Detalhados"
    
    echo -e "${BLUE}PASSO 1: Preparar o Arquivo ZIP${NC}"
    echo ""
    echo -e "${GREEN}Opção Automática:${NC} Execute um dos scripts abaixo para criar o ZIP automaticamente:"
    echo "  - Windows PowerShell: ${YELLOW}.\\create-deploy-zip.ps1${NC}"
    echo "  - Git Bash / Linux: ${YELLOW}./create-deploy-zip.sh${NC}"
    echo ""
    echo "Ou crie manualmente seguindo as instruções abaixo:"
    echo ""
    echo -e "${YELLOW}✅ INCLUIR no ZIP:${NC}"
    echo "  - Todas as pastas: src/, backend/, supabase/, public/, etc."
    echo "  - Todos os arquivos de configuração: package.json, vite.config.ts, Dockerfile, docker-compose.yml"
    echo "  - Arquivos de setup: setup.sh, deploy.env (sem senhas expostas se compartilhar)"
    echo "  - Documentação: README.md, INSTRUCOES_DEPLOY.md"
    echo "  - .gitignore (para o EasyPanel saber o que ignorar)"
    echo ""
    echo -e "${YELLOW}❌ NÃO INCLUIR no ZIP:${NC}"
    echo "  - node_modules/ (muito pesado, será instalado pelo Docker)"
    echo "  - dist/ (será gerado durante o build)"
    echo "  - .env ou .env.local (contém credenciais locais)"
    echo "  - Arquivos de IDE: .vscode/, .idea/"
    echo "  - Logs: *.log"
    echo "  - Arquivos temporários: .DS_Store, *.swp"
    echo ""
    echo -e "${GREEN}Dica:${NC} No Windows, selecione TODOS os arquivos e pastas, EXCETO node_modules e dist,"
    echo "      depois clique com botão direito > Enviar para > Pasta compactada (ZIP)"
    echo ""
    echo -e "${BLUE}PASSO 2: Criar Serviço no EasyPanel${NC}"
    echo ""
    echo -e "${GREEN}Opção Recomendada: Compose (Frontend + Backend juntos)${NC}"
    echo ""
    echo "1. No EasyPanel, dentro do seu projeto (ex: 'imoguru-lite'):"
    echo "   - Clique na aba 'Serviços' (se não estiver já)"
    echo "   - Clique no botão '+ Serviço'"
    echo ""
    echo "2. Escolha o modelo de serviço:"
    echo "   - Selecione 'Compose' (tem tag BETA verde)"
    echo "   - Isso permite usar seu docker-compose.yml"
    echo ""
    echo "3. Configure o serviço Compose:"
    echo "   - Nome: 'imoguru-fullstack' (ou o que preferir)"
    echo ""
    echo "4. Configure a Fonte (Source):"
    echo "   - Vá na aba 'Fonte' do serviço"
    echo "   - Opção A: Clique em 'Git' e configure:"
    echo "     * URL do Repositório: https://github.com/SEU-USUARIO/imoguru-lite.git"
    echo "     * Ramo: main"
    echo "     * Caminho de Build: /"
    echo "     * Arquivo Docker Compose: docker-compose.yml"
    echo "   - Opção B: Se tiver o código no VPS, aponte para o caminho local"
    echo ""
    echo -e "${YELLOW}IMPORTANTE:${NC} Para usar Git, você precisa:"
    echo "   1. Criar repositório no GitHub/GitLab"
    echo "   2. Fazer push do código (git push)"
    echo "   3. Depois configurar no EasyPanel"
    echo "   Veja CONFIGURAR_GIT_EASYPANEL.md para detalhes completos"
    echo ""
    echo -e "${BLUE}PASSO 3: Configurar Variáveis de Ambiente${NC}"
    echo "1. No projeto recém-criado no EasyPanel, encontre a seção 'Environment Variables'"
    echo "2. Cole TODO o bloco de variáveis que foi gerado acima (da linha INÍCIO até FIM)"
    echo "3. ${YELLOW}IMPORTANTE:${NC} Se você criar apps separados:"
    echo "   - App FRONTEND: cole apenas as variáveis VITE_*"
    echo "   - App BACKEND: cole as variáveis DB_*, JWT_SECRET, BOOTSTRAP_SECRET, etc."
    echo "4. Salve as variáveis"
    echo ""
    echo -e "${BLUE}PASSO 4: Fazer o Deploy${NC}"
    echo "1. No EasyPanel, procure pelo botão 'Deploy' ou 'Redeploy'"
    echo "2. Clique e acompanhe os logs na aba 'Logs'"
    echo "3. Aguarde o build e o start dos containers"
    echo "4. Verifique se ambos os serviços estão 'Running' (verde)"
    echo "5. Acesse a URL fornecida pelo EasyPanel ou seu domínio configurado"
    echo ""
    echo -e "${GREEN}Tudo pronto! Seu sistema estará rodando em produção.${NC}"
}

# Função para atualizar domínios
run_update_domain() {
    print_section "Atualização de Domínio de Empresa"
    echo "Esta ferramenta irá gerar o comando SQL para atualizar o domínio de uma empresa."
    
    read -p "Por favor, insira o ID da empresa que deseja atualizar: " company_id
    read -p "Agora, insira o novo domínio completo (ex: https://www.minhaimobiliaria.com): " new_domain

    if [[ -z "$company_id" ]] || [[ -z "$new_domain" ]]; then
        echo -e "${YELLOW}ID da empresa e novo domínio são obrigatórios.${NC}"
        exit 1
    fi

    SQL_COMMAND="UPDATE public.companies SET website_domain = '${new_domain}' WHERE id = '${company_id}';"

    echo -e "\n${GREEN}Comando SQL gerado com sucesso!${NC}"
    echo "Copie o comando abaixo e execute no Editor SQL do seu painel Supabase:"
    echo -e "${YELLOW}--------------------------------------------------${NC}"
    echo ${SQL_COMMAND}
    echo -e "${YELLOW}--------------------------------------------------${NC}\n"
}


# Menu principal do script
print_section "ImoGuru - Assistente de Deploy e Configuração"
echo "O que você deseja fazer?"
echo "1) Preparar para um novo DEPLOY (Instalação Completa)"
echo "2) Atualizar o DOMÍNIO de uma empresa existente"
read -p "Escolha uma opção (1 ou 2): " choice

case $choice in
    1)
        run_full_deploy
        ;;
    2)
        run_update_domain
        ;;
    *)
        echo -e "${YELLOW}Opção inválida. Saindo.${NC}"
        exit 1
        ;;
esac
