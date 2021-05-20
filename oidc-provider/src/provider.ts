import { Provider } from "oidc-provider";
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
      redirect_uris: [
        "http://localhost:8082/callback",
        "http://localhost:7070/callback",
      ],
      post_logout_redirect_uris: ["http://localhost:8082"],
    },
  ],
  interactions: {
    url: async function (ctx, interaction) {
      return `/api/op/v1/interaction/${interaction.uid}`;
    },
  },
  features: {
    introspection: {
      enabled: true,
    },
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
  pkce: {
    required: (ctx, client) => {
      if (client.clientId === "app1") {
        return false;
      }

      return true;
    },
    methods: ["S256"],
  },
  loadExistingGrant: async (ctx) => {
    const grantId =
      ctx.oidc?.result?.consent?.grantId ||
      (ctx.oidc.client
        ? ctx.oidc?.session?.grantIdFor(ctx.oidc.client.clientId)
        : undefined);

    if (grantId) {
      return ctx.oidc.provider.Grant.find(grantId);
    }

    const client = ctx.oidc.client;
    const session = ctx.oidc.session;
    ctx.logger.debug({
      stage: "provider.loadExistingGrant",
      client,
      session,
    });

    if (!client || !session || !session.accountId) {
      return undefined;
    }

    const firstPartyList = ["app1"];

    if (firstPartyList.includes(client.clientId)) {
      // @ts-ignore
      const grant = new ctx.oidc.provider.Grant({
        clientId: client.clientId,
        accountId: session.accountId,
      });

      grant.addOIDCScope("openid profile email phone");
      grant.addOIDCClaims([]);
      // grant.addResourceScope(
      //   "urn:example:resource-indicator",
      //   "api:read api:write"
      // );

      await grant.save();

      return grant;
    }

    return undefined;
  },
});

export default provider;
