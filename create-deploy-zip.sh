#!/bin/bash

# Script para criar o arquivo ZIP de deploy automaticamente
# Exclui node_modules, dist, arquivos .env e outros arquivos desnecessários

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=======================================================================${NC}"
echo -e "${BLUE} Criando arquivo ZIP para deploy no EasyPanel ${NC}"
echo -e "${BLUE}=======================================================================${NC}\n"

ZIP_NAME="imoguru-deploy.zip"

# Remove ZIP anterior se existir
if [ -f "$ZIP_NAME" ]; then
    echo -e "${YELLOW}Removendo ZIP anterior...${NC}"
    rm -f "$ZIP_NAME"
fi

echo -e "${GREEN}Criando ZIP excluindo arquivos desnecessários...${NC}\n"

# Criar ZIP excluindo arquivos/pastas específicas
# Para Windows (Git Bash), use zip com exclusions
if command -v zip &> /dev/null; then
    zip -r "$ZIP_NAME" . \
        -x "node_modules/*" \
        -x "dist/*" \
        -x ".env" \
        -x ".env.local" \
        -x "backend/.env" \
        -x ".vscode/*" \
        -x ".idea/*" \
        -x "*.log" \
        -x ".DS_Store" \
        -x "*.swp" \
        -x "*.swo" \
        -x ".git/*" \
        -x ".gitignore" \
        -x "*.zip"
    
    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}✅ ZIP criado com sucesso: ${ZIP_NAME}${NC}"
        echo -e "${BLUE}Tamanho do arquivo:${NC}"
        ls -lh "$ZIP_NAME" | awk '{print $5}'
        echo ""
        echo -e "${YELLOW}Próximo passo:${NC} Faça upload deste arquivo no EasyPanel"
    else
        echo -e "\n${YELLOW}Erro ao criar ZIP. Tentando método alternativo...${NC}"
        
        # Método alternativo: criar lista de exclusões e usar find
        find . -type f \
            ! -path "*/node_modules/*" \
            ! -path "*/dist/*" \
            ! -path "*/.env*" \
            ! -path "*/.vscode/*" \
            ! -path "*/.idea/*" \
            ! -path "*/.git/*" \
            ! -name "*.log" \
            ! -name ".DS_Store" \
            ! -name "*.swp" \
            ! -name "*.swo" \
            ! -name "*.zip" \
            -print0 | zip -@ -0 "$ZIP_NAME"
    fi
else
    echo -e "${YELLOW}Comando 'zip' não encontrado.${NC}"
    echo -e "${BLUE}Instruções manuais:${NC}"
    echo "1. No Windows Explorer, selecione todos os arquivos EXCETO:"
    echo "   - node_modules/"
    echo "   - dist/"
    echo "   - .env e .env.local"
    echo "   - .vscode/ e .idea/"
    echo "2. Clique com botão direito > Enviar para > Pasta compactada (ZIP)"
    echo "3. Nomeie como: imoguru-deploy.zip"
fi

