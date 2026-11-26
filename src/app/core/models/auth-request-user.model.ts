export interface AuthRequestUser {
  username: string;
  password: string;
  accessType: 'SYSTEM' | string;
}
