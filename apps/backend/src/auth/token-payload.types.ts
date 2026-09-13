export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  organizationId: string;
  tokenType: "access";
  type: "access";
}

export interface RefreshTokenPayload {
  sub: string;
  email: string;
  role: string;
  organizationId: string;
  jti: string;
  tokenType: "refresh";
  type: "refresh";
}
