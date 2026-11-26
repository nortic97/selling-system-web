export interface AuthTokenPayload {
  iss: string;
  sub: string;
  type: string;
  permissions: string[];
  iat: number;
  exp: number;
}
