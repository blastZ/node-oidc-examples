import { Issuer, generators } from "openid-client";
import nico, { Context, InnerAppMiddleware } from "@blastz/nico";
import { v4 as uuidv4 } from "uuid";
import Redis from "ioredis";
import proxy from "koa-better-http-proxy";
import Router from "@koa/router";

const redis = new Redis("redis://:@localhost:6379");

const config = {
  port: 7070,
  op: {
    url: "http://localhost:1818/api/op/v1",
    client: {
      client_id: "app3",
      client_secret: "app3",
      redirect_uris: ["http://localhost:7070/callback"],
      response_types: ["code"],
    },
  },
  proxies: [
    {
      paths: [/^\/api\/.*/],
      pathRewrite: {},
      target: "http://localhost:2020",
      headers: [["op-user-id", "$userId"]],
    },
    {
      paths: [/^(?!\/api)\/.*/],
      target: "http://localhost:8082",
      options: {
        changeOrigin: true,
      },
    },
  ],
  fromAjax: {
    header: "X-Client-Ajax",
    status: 418,
  },
  session: {
    token: {
      name: "_pgs_x2jfdas8afdas8uh", // proxy-gateway-session
    },
    redirectUrl: {
      name: "_grs_jgasyd23jfdas82k", // gateway-redirect-session
    },
  },
};

const tokenSession = config.session.token.name;
const redirectUrlSession = config.session.redirectUrl.name;

async function saveRedirectUrl(ctx: Context) {
  const url = ctx.request.url;

  const uid = uuidv4();
  ctx.cookies.set(redirectUrlSession, uid, {
    expires: new Date(Date.now() + 10 * 60 * 1000),
  });

  await redis.set(uid, url, "EX", 600);
}

async function getRedirectUrl(ctx: Context) {
  const url = (await redis.get(
    ctx.cookies.get(redirectUrlSession) as string
  )) as string;

  ctx.cookies.set(redirectUrlSession);

  return url;
}

Issuer.discover(config.op.url).then(function (issuer) {
  // @ts-ignore
  const client = new issuer.Client(config.op.client);

  const router = new Router();

  config.proxies.map((o) => {
    router.all(
      o.paths,
      async function OPMiddleware(ctx: Context, next) {
        ctx.logger.debug(ctx.request);
        if (ctx.request.method.toLowerCase() === "options") return;

        if (!ctx.cookies.get(tokenSession)) {
          const url = client.authorizationUrl({
            redirect_uri: "http://localhost:7070/callback",
            scope: "openid profile email phone",
            state: "1234567",
            response_type: "code",
          });

          const fromAjax = ctx.get(config.fromAjax.header.toLowerCase());
          if (fromAjax) {
            ctx.status = 418;
            return;
          }

          await saveRedirectUrl(ctx);

          return ctx.redirect(url);
        } else {
          const accessToken = (await redis.get(tokenSession)) as string;

          const introspectResult = await client.introspect(accessToken);
          ctx.logger.debug({ introspectResult });
          if (!introspectResult.active) {
            ctx.logger.debug("access token invalid");

            ctx.cookies.set(tokenSession);

            const fromAjax = ctx.get(config.fromAjax.header.toLowerCase());
            if (fromAjax) {
              ctx.status = 418;
              return;
            }

            await saveRedirectUrl(ctx);

            return ctx.redirect(ctx.request.url);
          }

          const userInfo = await client.userinfo(accessToken);

          ctx.logger.debug({
            userInfo,
          });

          ctx.state.userInfo = userInfo;
        }
        await next();
      },
      async function proxyLogger(ctx: Context, next) {
        ctx.logger.debug({
          stage: "proxy",
          originUrl: ctx.request.url,
          target: o.target,
        });

        await next();
      },
      proxy(o.target, {
        proxyReqPathResolver: function (ctx: Context) {
          if (o.pathRewrite) {
            const matched = Object.entries(o.pathRewrite).find(([oldPath]) =>
              ctx.path.startsWith(oldPath)
            );

            if (!matched) return ctx.path;

            const path = matched[1] + ctx.path.slice(matched[0].length);

            ctx.logger.debug({
              stage: "proxy-pathResolver",
              message: {
                matched,
                path,
              },
            });

            return ctx.querystring ? path + "?" + ctx.querystring : path;
          }

          return ctx.path;
        },
        proxyReqOptDecorator: function (proxyReqOpts, ctx) {
          if (o.headers) {
            o.headers.map(([headerKey, valueOrKey]) => {
              if (valueOrKey.startsWith("$")) {
                const [pre, key] = valueOrKey.split("$");
                // @ts-ignore
                const value = ctx.state.userInfo[key];
                if (value) {
                  proxyReqOpts.headers[headerKey] = encodeURI(value);
                }
              } else {
                proxyReqOpts.headers[headerKey] = encodeURI(valueOrKey);
              }
            });
          }

          ctx.logger.debug({
            stage: "proxy-decorator",
            message: {
              proxyReqOpts,
            },
          });

          return proxyReqOpts;
        },
      })
    );
  });

  // @ts-ignore
  nico.useAppMiddleware(router.routes(), InnerAppMiddleware.ROUTES);

  nico.init({
    routes: {
      "GET /callback": {
        controller: async (ctx) => {
          const { code } = ctx.query;

          ctx.logger.debug({
            code,
          });

          const result = await client.callback(
            "http://localhost:7070/callback",
            { code }
          );

          ctx.logger.debug({
            callbackResult: result,
          });

          const idToken = result.id_token as string;
          const accessToken = result.access_token as string;
          const expiresAt = result.expires_at as number;

          await redis.set(tokenSession, accessToken);
          ctx.cookies.set(tokenSession, idToken, {
            expires: new Date(expiresAt * 1000),
          });

          const redirectUrl = await getRedirectUrl(ctx);

          ctx.logger.debug({
            redirectUrl,
          });

          return ctx.redirect(redirectUrl);
        },
      },
    },
    security: {
      cors: {
        allRoutes: true,
        allowOrigins: ["http://localhost:8082"],
        allowHeaders: [config.fromAjax.header],
        allowCredentials: true,
      },
    },
    logger: {
      consoleLevel: "debug",
    },
  });

  nico.start(config.port);
});
