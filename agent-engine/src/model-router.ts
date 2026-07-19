import { Injectable, Logger } from '@nestjs/common';
import { ModelTier, ModelRoutingRequest } from '@oracle69/shared';

@Injectable()
export class ModelRouter {
  private readonly logger = new Logger(ModelRouter.name);

  route(request: ModelRoutingRequest): ModelTier {
    this.logger.debug(`Routing task: ${request.taskDescription}`);
    
    // Simple routing logic based on complexity and department
    if (request.complexity > 8 || request.department === 'CEO' || request.department === 'Chief of Staff') {
      return 'gpt-5.6';
    } else if (request.complexity > 4) {
      return 'mini';
    }
    return 'nano';
  }
}
