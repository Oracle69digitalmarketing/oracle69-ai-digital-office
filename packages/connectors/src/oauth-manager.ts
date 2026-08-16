import { Injectable, Logger } from "@nestjs/common";
import { CredentialManager } from "./credential-manager.js";

@Injectable()
export class OAuthManager {
  private readonly logger = new Logger(OAuthManager.name);

  constructor(private credentialManager: CredentialManager) {}

  async refreshToken(organizationId: string, provider: string): Promise<string> {
    const creds = await this.credentialManager.getCredentials(organizationId, provider);
    if (!creds || !creds.refreshToken) {
      throw new Error(`No refresh token found for ${provider} in organization ${organizationId}`);
    }

    this.logger.log(`Refreshing token for ${provider} in org ${organizationId}`);

    // In a real implementation, this would call the provider's OAuth endpoint
    // For now, we simulate success if we have a refresh token
    const newAccessToken = `refreshed-${Math.random().toString(36).substring(7)}`;
    const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 hour

    await this.credentialManager.saveCredentials(organizationId, provider, {
      accessToken: newAccessToken,
      expiresAt,
    });

    return newAccessToken;
  }

  async isTokenExpired(organizationId: string, provider: string): Promise<boolean> {
    const creds = await this.credentialManager.getCredentials(organizationId, provider);
    if (!creds || !creds.expiresAt) return true;
    return new Date() > creds.expiresAt;
  }
}
