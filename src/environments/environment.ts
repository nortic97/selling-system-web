export const environment = {
  production: false,
  appName: 'Selling System',
  version: '1.0.0',
  services: {
    esUser: {
      basePath: 'http://localhost:8081/api/v1/es/user',
    },
    esStore: {
      basePath: 'http://localhost:8082/api/v1/es/store',
      getStoreById: '/:id',
      updateStore: '/:id',
      deleteStore: '/:id',
      getAllStores: '',
      createStore: '',
      changeStatus: '/:id/status',
      restoreStore: '/:id/restore',
      changePhone: '/:id/phone',
      changeEmail: '/:id/email',
      getStoreByTaxIdAndTaxType: '/tax-id/:taxType/:taxId',
    },
    esBranch: {
      basePath: 'http://localhost:8083/api/v1/es/branch',
    },
    esPermission: {
      basePath: 'http://localhost:8084/api/v1/es/permission',
    },
    esRole: {
      basePath: 'http://localhost:8085/api/v1/es/role',
    },
    esEmployee: {
      basePath: 'http://localhost:8086/api/v1/es/employee',
    },
    esEmployeeWorkspace: {
      basePath: 'http://localhost:8087/api/v1/es/employee-workspace',
      getById: '/:id',
      update: '/:id',
      delete: '/:id',
      getByEmployee: '/employee/:employeeId',
      create: '',
      restore: '/:id/restore',
      updateLastAccess: '/:id/last-access',
      getByStore: '/store/:storeId',
    },
    esFeature: {
      basePath: 'http://localhost:8088/api/v1/es/feature',
    },
    msAuth: {
      basePath: 'http://localhost:8089/api/v1/ms/auth',
      loginUser: '/login',
      loginEmployee: '/employee/login',
      tokenExchange: '/token/exchange',
      refreshToken: '/refresh-token',
      logout: '/logout',
    },
  },
};
