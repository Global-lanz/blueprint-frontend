// Configuração dinâmica - será carregada de /assets/config.json
let runtimeConfig: any = null;

// Função para obter a URL da API
export function getApiUrl(): string {
  if (runtimeConfig) {
    return runtimeConfig.apiUrl;
  }
  // Fallback para produção
  return '/api';
}

export const environment = {
  production: true,
  get apiUrl() {
    return getApiUrl();
  }
};

// Carrega configuração assíncrona (chamada no APP_INITIALIZER)
export function setRuntimeConfig(config: any) {
  runtimeConfig = config;
}
