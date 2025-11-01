export type ModelProvider = 'ollama-local';

export interface ModelConfig {
  provider: ModelProvider;
  textModel: string;
  visionModel: string;
  apiUrl?: string;
  description: string;
}

const config: ModelConfig = {
    provider: 'ollama-local',
    textModel: 'gemma3:4b',
    visionModel: 'llava:7b',
    description: 'Local Ollama instance'
}

export function getModelConfig(){
  return config;
}

export function isProviderConfigured(config: ModelConfig): boolean {
  if (config.provider === 'ollama-local') {
    return true;
  }
  
  return false;
}
