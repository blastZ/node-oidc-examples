import Provider from "oidc-provider";
import db from "./api/model/mysql";
import { RedisAdapter } from "./redis-adapter";

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
  interactions: {
    url: async function (ctx, interaction) {
      return `/api/op/v1/interaction/${ctx.oidc.uid}`;
    },
  },
  features: {
    devInteractions: {
      enabled: false,
    },
  },
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
  claims: {
    profile: ["name"],
    email: ["email"],
    phone: ["phone"],
  },
  adapter: RedisAdapter,
  findAccount: async function findAccount(ctx, sub, token) {
    const user = await db.userDao.getUserById(Number(sub));
    if (!user) return undefined;

    return {
      accountId: sub,
      async claims(use, scope, claims, rejected) {
        console.log({
          use,
          scope,
          claims,
          rejected,
        });
        console.log(user);
        return {
          sub,
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        };
      },
    };
  },
});

export default provider;
