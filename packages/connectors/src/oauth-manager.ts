import { Injectable, Logger, BadRequestException, Optional } from "@nestjs/common";
import * as crypto from "crypto";
import { CredentialManager } from "./credential-manager.js";
import { TenantContextService } from "@oracle69/runtime";

@Injectable()
export class OAuthManager {
  private readonly logger = new Logger(OAuthManager.name);

  constructor(
    private credentialManager: CredentialManager,
    @Optional() private tenantContext?: TenantContextService,
  ) {}

  /**
   * Enforces tenant authority for OAuth token refresh/lookup. Mirrors
   * {@link CredentialManager}: the active tenant is authoritative and any
   * caller-supplied `organizationId` must match it exactly, otherwise the
   * operation fails closed.
   */
  private assertTenantAuthority(organizationId: string): void {
    if (!this.tenantContext) return;
    if (!this.tenantContext.isTenantScopeActive()) {
      throw new BadRequestException(
        "A tenant context is required for OAuth operations",
      );
    }
    const activeTenant = this.tenantContext.getTenantId();
    if (!activeTenant || activeTenant !== organizationId) {
      this.logger.warn(
        `OAuth operation for org ${organizationId} rejected outside active tenant context`,
      );
      throw new BadRequestException(
        "OAuth operation is not permitted in the current tenant context",
      );
    }
  }

  async refreshToken(organizationId: string, provider: string): Promise<string> {
    this.assertTenantAuthority(organizationId);
    const creds = await this.credentialManager.getCredentials(organizationId, provider);
    if (!creds || !creds.refreshToken) {
      throw new Error(`No refresh token found for ${provider} in organization ${organizationId}`);
    }

    this.logger.log(`Refreshing token for ${provider} in org ${organizationId}`);

    // In a real implementation, this would call the provider's OAuth endpoint
    // For now, we simulate success if we have a refresh token
    const newAccessToken = `refreshed-${crypto.randomBytes(24).toString("hex")}`;
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    await this.credentialManager.saveCredentials(organizationId, provider, {
      accessToken: newAccessToken,
      expiresAt,
    });

    return newAccessToken;
  }

  async isTokenExpired(organizationId: string, provider: string): Promise<boolean> {
    this.assertTenantAuthority(organizationId);
    const creds = await this.credentialManager.getCredentials(organizationId, provider);
    if (!creds || !creds.expiresAt) return true;
    return new Date() > creds.expiresAt;
  }
}
