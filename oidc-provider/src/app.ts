import nico, { InnerAppMiddleware } from "@blastz/nico";
import mount from "koa-mount";
import render from "koa-ejs";
import Provider from "oidc-provider";

const provider = new Provider("http://localhost:1818", {
  clients: [
    {
      client_id: "app1",
      client_secret: "app1",
      grant_types: ["authorization_code", "refresh_token"],
      redirect_uris: ["http://localhost:8080/callback"],
    },
    {
      client_id: "app2",
      client_secret: "app2",
      grant_types: ["authorization_code", "refresh_token"],
      redirect_uris: ["http://localhost:8081/callback"],
    },
  ],
  cookies: {
    long: {
      signed: true,
      maxAge: 1 * 24 * 60 * 60 * 1000,
    },
    short: {
      signed: true,
    },
    keys: ["some secret key", "old one"],
  },
});

nico.useAppMiddleware(mount(provider.app), InnerAppMiddleware.GLOBAL_CORS);

nico.init({
  security: {
    cors: {
      allRoutes: true,
      allowOrigins: ["http://localhost:8080", "http://localhost:8081"],
      allowCredentials: true,
    },
  },
});

nico.start(1818);
