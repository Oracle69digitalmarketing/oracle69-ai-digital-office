import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { TenantContextService } from "@oracle69/runtime";
import { Request } from "express";

interface TenantAwareRequest extends Request {
  user?: { organizationId?: string };
  tenantContext?: { organizationId?: string };
}

/**
 * Seeds the tenant (organization) execution context for every inbound HTTP
 * request that carries an authenticated tenant identity.
 *
 * Lifecycle note: this runs as a global interceptor, i.e. *after* all guards
 * (global JwtAuthGuard and per-controller guards) have resolved the request
 * principal. It therefore reads the tenant authority exclusively from the
 * authenticated principal:
 *   - JWT-authenticated requests expose `organizationId` on `req.user`.
 *   - Platform API-key requests expose `organizationId` on `req.tenantContext`
 *     (set by PlatformAuthGuard from the persisted PlatformApiKey record).
 *
 * It never treats `organizationId` supplied in the body, query, or path as the
 * tenant authority, so a tenant cannot spoof another tenant's scope through
 * the request payload.
 *
 * Requests with no authenticated tenant identity (public or anonymous) pass
 * through without seeding a context; any downstream tenant-dependent code then
 * fails closed via `TenantContextService.resolveTenantId()`.
 *
 * The guarded downstream execution is subscribed to while the AsyncLocalStorage
 * store is active, so asynchronous service calls made during handler execution
 * inherit the tenant context.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly tenantContext: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<TenantAwareRequest>();

    const organizationId =
      request.user?.organizationId ?? request.tenantContext?.organizationId;

    if (!organizationId) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      this.tenantContext.run({ tenantId: organizationId }, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (error) => subscriber.error(error),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
