import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";

/**
 * Minimal request shape this guard relies on. The authenticated principal is
 * always attached by a preceding authentication guard (e.g. JwtAuthGuard) and
 * exposes the tenant (organization) the caller belongs to.
 */
interface OrgClaimRequest {
  user?: { organizationId?: string };
  params?: { organizationId?: string; crmOrganizationId?: string };
}

/**
 * Tenant assertion guard that compares the authenticated principal's
 * `organizationId` claim against the `:organizationId` path parameter of the
 * requested tenant-scoped resource.
 *
 * Fails closed: any request that lacks an authenticated tenant claim, targets
 * a route without an `:organizationId` param, or whose claim does not match
 * the requested organization is rejected with 403 Forbidden. Malicious
 * multi-tenant callers cannot reach the guarded controller handler because this
 * guard runs before it.
 *
 * Unauthenticated requests never reach this guard: the global JwtAuthGuard
 * (or equivalent) rejects them with 401 before per-controller guards execute.
 */
@Injectable()
export class OrgClaimGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<OrgClaimRequest>();

    const claimedOrgId = request.user?.organizationId;
    const requestedOrgId =
      request.params?.organizationId ?? request.params?.crmOrganizationId;

    if (!claimedOrgId || !requestedOrgId || claimedOrgId !== requestedOrgId) {
      throw new ForbiddenException(
        "Access to this organization's resources is forbidden",
      );
    }

    return true;
  }
}