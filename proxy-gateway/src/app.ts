import { Issuer, generators } from "openid-client";
import nico, { InnerAppMiddleware } from "@blastz/nico";
import { v4 as uuidv4 } from "uuid";
import Redis from "ioredis";
import proxy from "koa-better-http-proxy";

const redis = new Redis("redis://:@localhost:6379");

const config = {
  port: 7070,
  op: {
    url: "http://localhost:1818/api/op/v1",
    client: {
      client_id: "app3",
      client_secret: "app3",
      redirect_uris: ["http://localhost:8082/callback"],
      response_types: ["code"],
    },
  },
  sessionName: "_id_token",
};

const originKey = `_gateway_session_${config.port}`;

Issuer.discover(config.op.url).then(function (issuer) {
  // @ts-ignore
  const client = new issuer.Client(config.op.client);

  nico.useAppMiddleware(async function OPMiddleware(ctx, next) {
    ctx.logger.debug(ctx.request);
    if (ctx.request.url === "/api/app3/v1/users/self") {
      if (!ctx.cookies.get(config.sessionName)) {
        const code_verifier = generators.codeVerifier();
        const code_challenge = generators.codeChallenge(code_verifier);

        ctx.logger.debug(`code_verifier: ${code_verifier}`);
        ctx.logger.debug(`code_challenge: ${code_challenge}`);

        const url = client.authorizationUrl({
          redirect_uri: "http://localhost:8082/callback",
          scope: "openid profile email phone",
          state: "1234567",
          response_type: "code",
        });

        const sessionId = uuidv4();
        ctx.cookies.set(originKey, sessionId, {
          expires: new Date(Date.now() + 10 * 60 * 1000),
        });
        await redis.set(sessionId, ctx.get("referer"), "EX", 600);
        ctx.status = 401;
        return (ctx.body = {
          success: false,
          data: {
            authUrl: url,
          },
        });
      } else {
        const idToken = ctx.cookies.get(config.sessionName) as string;
        const accessToken = (await redis.get(idToken)) as string;

        const userInfo = await client.userinfo(accessToken);

        ctx.logger.debug({
          stage: "get-user",
          message: userInfo,
        });

        ctx.state.userInfo = userInfo;
      }
    }

    await next();
  }, InnerAppMiddleware.GLOBAL_CORS);

  nico.useAppMiddleware(
    proxy("http://localhost:2020", {
      filter: (ctx) => {
        return ["/api/app3/v1/users/self"].includes(ctx.request.url);
      },
      proxyReqOptDecorator: function (proxyReqOpts, ctx) {
        proxyReqOpts.headers["op-user-id"] = ctx.state.userInfo.sub;
        proxyReqOpts.headers["op-user-name"] = ctx.state.userInfo.name;
        proxyReqOpts.headers["op-user-email"] = ctx.state.userInfo.email;
        proxyReqOpts.headers["op-user-phone"] = ctx.state.userInfo.phone;

        return proxyReqOpts;
      },
    }),
    "OPMiddleware"
  );

  nico.init({
    routes: {
      "/api/proxy-gateway/v1": {
        "POST /token": {
          bodyParser: true,
          controller: async (ctx) => {
            const { code, state } = ctx.request.body;

            const result = await client.callback(
              "http://localhost:8082/callback",
              { code }
            );

            ctx.logger.debug({
              stage: "get-token",
              message: result,
            });

            const idToken = result.id_token as string;
            const accessToken = result.access_token as string;
            const expiresAt = result.expires_at as number;

            const origin = (await redis.get(
              ctx.cookies.get(originKey) as string
            )) as string;

            await redis.set(idToken, accessToken);

            ctx.cookies.set("_id_token", idToken, {
              expires: new Date(expiresAt * 1000),
            });
            ctx.cookies.set(originKey);

            return (ctx.body = {
              success: true,
              data: {
                originUrl: origin,
              },
            });
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
    logger: {
      consoleLevel: "debug",
    },
  });

  nico.start(config.port);
});
