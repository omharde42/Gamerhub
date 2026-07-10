import OpenAI from 'openai';
import { config } from './index';
let openai: OpenAI | null = null;
try {
  if (config.openai?.apiKey && config.openai.apiKey !== 'your-key-here') {
    openai = new OpenAI({ apiKey: config.openai.apiKey });
  }
} catch {
  console.warn('OpenAI not configured, using local AI analysis fallback');
}
export { openai };
export default openai;
