@echo off
title Compactando backend IMOGURU...
echo ===============================
echo Criando arquivo ZIP do backend...
echo ===============================

REM Caminhos base
set BASE_DIR=%~dp0
set ZIP_PATH=%BASE_DIR%..\imoguru-backend.zip

REM Remove o zip anterior (se existir)
if exist "%ZIP_PATH%" del "%ZIP_PATH%"

REM Cria o novo zip, ignorando node_modules e pastas ocultas
zip -r "%ZIP_PATH%" . -x "node_modules/*" -x "*.git*" -x "*.DS_Store"

echo ===============================
echo ✅ Compactação concluída!
echo Arquivo gerado em: %ZIP_PATH%
echo ===============================

pause
