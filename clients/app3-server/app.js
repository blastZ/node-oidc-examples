const nico = require("@blastz/nico").default;

nico.init({
  routes: {
    "/api/app3/v1": {
      "GET /users/self": {
        controller: (ctx) => {
          ctx.body = {
            success: true,
            data: {
              id: Number(ctx.get("op-user-id")),
              name: ctx.get("op-user-name"),
            },
          };
        },
      },
    },
  },
  security: {
    cors: {
      allRoutes: true,
      allowOrigins: ["http://localhost:8082"],
      allowCredentials: true,
    },
  },
});

nico.start(2020);
