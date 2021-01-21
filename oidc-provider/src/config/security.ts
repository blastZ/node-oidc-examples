export const security = {
  cors: {
    allRoutes: true,
    allowOrigins: [
      "http://localhost:8080",
      "http://localhost:8081",
      "http://localhost:8082",
      "http://app.net:8080",
    ],
    allowCredentials: true,
  },
};
