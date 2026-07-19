import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PromptLoader {
  private readonly logger = new Logger(PromptLoader.name);
  private readonly promptsDir = path.join(process.cwd(), 'prompts', 'agents');

  async loadPrompt(agentRole: string): Promise<string> {
    const filePath = path.join(this.promptsDir, `${agentRole.toLowerCase().replace(' ', '-')}.md`);
    this.logger.debug(`Loading prompt from: ${filePath}`);
    
    try {
      return await fs.promises.readFile(filePath, 'utf-8');
    } catch (error) {
      this.logger.error(`Failed to load prompt for ${agentRole}`, error);
      throw new Error(`Prompt not found for ${agentRole}`);
    }
  }
}
