export interface AuthRequestEmployee {
  storeId: string;
  username: string;
  password: string;
  accessType: 'SYSTEM' | string;
}
