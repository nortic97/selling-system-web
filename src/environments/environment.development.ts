export const environment = {
  production: false,
  appName: 'Selling System (Dev)',
  version: '1.0.0',
  services: {
    esUser: {
      basePath: 'http://localhost:8081/api/v1/es/user',
    },
    esStore: {
      basePath: 'http://localhost:8082/api/v1/es/store',
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
    },
    esFeature: {
      basePath: 'http://localhost:8088/api/v1/es/feature',
    },
  },
};
