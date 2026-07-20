import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PromptLoader implements OnModuleInit {
  private readonly logger = new Logger(PromptLoader.name);
  private promptsDir: string;
  private promptCache: Map<string, { content: string; version: string }> = new Map();

  constructor() {
    this.promptsDir = this.resolvePromptsDir();
  }

  private resolvePromptsDir(): string {
    const cwd = process.cwd();
    const commonPaths = [
      path.join(cwd, 'prompts', 'agents'),
      path.join(cwd, '..', '..', 'prompts', 'agents'),
      path.join(cwd, '..', 'prompts', 'agents'),
      '/home/davidsaint1969/oracle69-ai-digital-office/prompts/agents'
    ];

    this.logger.debug(`Resolving prompts dir. CWD: ${cwd}`);
    for (const p of commonPaths) {
      if (fs.existsSync(p)) {
        this.logger.log(`Found prompts directory at: ${p}`);
        return p;
      }
      this.logger.debug(`Tried path: ${p} - NOT FOUND`);
    }

    this.logger.warn('Prompts directory not found in common locations. Defaulting to process.cwd()/prompts/agents');
    return path.join(cwd, 'prompts', 'agents');
  }

  async onModuleInit() {
    await this.loadAllPrompts();
    
    if (process.env.NODE_ENV === 'development') {
      this.setupHotReload();
    }
  }

  private async loadAllPrompts() {
    try {
      const files = await fs.promises.readdir(this.promptsDir);
      for (const file of files) {
        if (file.endsWith('.md')) {
          const role = file.replace('.md', '').replace(/-/g, ' ');
          await this.loadPromptIntoCache(role, path.join(this.promptsDir, file));
        }
      }
    } catch (error) {
      this.logger.error('Failed to load prompts directory', error);
    }
  }

  private async loadPromptIntoCache(role: string, filePath: string) {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const version = this.extractVersion(content);
      
      // Simple validation
      if (!content.includes('#')) {
        this.logger.warn(`Prompt for ${role} might be invalid (missing headers)`);
      }

      this.promptCache.set(role.toLowerCase(), { content, version });
      this.logger.debug(`Cached prompt: ${role} (v${version})`);
    } catch (error) {
      this.logger.error(`Failed to load prompt: ${filePath}`, error);
    }
  }

  private extractVersion(content: string): string {
    const versionMatch = content.match(/Version:\s*([\d.]+)/i);
    return versionMatch ? versionMatch[1] : '1.0.0';
  }

  private setupHotReload() {
    this.logger.log('Setting up hot reload for prompts...');
    fs.watch(this.promptsDir, (eventType, filename) => {
      if (filename && filename.endsWith('.md')) {
        const role = filename.replace('.md', '').replace(/-/g, ' ');
        this.logger.log(`Prompt changed: ${filename}. Reloading...`);
        this.loadPromptIntoCache(role, path.join(this.promptsDir, filename));
      }
    });
  }

  async getPrompt(agentRole: string): Promise<string> {
    const cached = this.promptCache.get(agentRole.toLowerCase());
    if (cached) return cached.content;

    this.logger.warn(`Prompt not found in cache for: ${agentRole}. Attempting file read.`);
    const filePath = path.join(this.promptsDir, `${agentRole.toLowerCase().replace(/\s+/g, '-')}.md`);
    
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return content;
  }

  async getVersion(agentRole: string): Promise<string> {
    const cached = this.promptCache.get(agentRole.toLowerCase());
    return cached ? cached.version : 'unknown';
  }
}
