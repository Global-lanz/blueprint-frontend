#!/bin/sh

# URL da API 
# Padrão: /api (para dev local ou produção com Traefik no mesmo domínio)
# Produção com domínios separados: definir API_URL=https://blueprint-backend.seudominio.com/api
API_URL=${API_URL:-/api}

# Gera arquivo de configuração para o Angular
cat > /usr/share/nginx/html/assets/config.json <<EOF
{
  "apiUrl": "${API_URL}"
}
EOF

echo "Frontend configurado com API_URL=${API_URL}"

# Inicia o Nginx
exec nginx -g "daemon off;"
