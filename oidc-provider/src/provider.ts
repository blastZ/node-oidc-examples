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
      post_logout_redirect_uris: ["http://localhost:8080"],
    },
    {
      client_id: "app2",
      client_secret: "app2",
      grant_types: ["authorization_code", "refresh_token"],
      redirect_uris: ["http://localhost:8081/callback"],
      post_logout_redirect_uris: ["http://localhost:8081"],
    },
    {
      client_id: "app3",
      client_secret: "app3",
      grant_types: ["authorization_code", "refresh_token"],
      redirect_uris: ["http://localhost:8082/callback"],
      post_logout_redirect_uris: ["http://localhost:8082"],
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
    rpInitiatedLogout: {
      logoutSource: async function logoutSource(ctx, form) {
        console.log(form);
        ctx.body = `<!DOCTYPE html>
        <head>
          <title>Logout</title>
        </head>
        <body>
          <div>
            ${form}
            <button id="logout" type="submit" form="op.logoutForm" value="yes" name="logout"></button>
            <button id="cancel" type="submit" form="op.logoutForm"></button>
          </div>
          <script>
            document.getElementById('logout').click();
          </script>
        </body>
        </html>`;
      },
    },
  },
  cookies: {
    long: {
      signed: true,
    },
    short: {
      signed: true,
      path: "/",
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
