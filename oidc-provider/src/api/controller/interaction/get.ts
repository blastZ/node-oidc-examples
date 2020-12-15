import { Context } from "@blastz/nico";
import provider from "../../../provider";

export default async function interactionGet(ctx: Context) {
  const detail = await provider.interactionDetails(ctx.req, ctx.res);

  ctx.logger.debug(detail);

  const { params, prompt, uid } = detail;

  const client = await provider.Client.find(params.client_id);

  if (prompt.name === "login") {
    return ctx.render("login", {
      client,
      uid,
      details: prompt.details,
      params,
      title: "Sign-in",
      flash: undefined,
    });
  }

  if (prompt.name === "consent") {
    const client = await provider.Client.find(params.client_id);
    ctx.logger.debug(client);

    // skip consent
    const consent = {
      rejectedScopes: [],
      rejectedClaims: [],
      replace: false,
    };

    const result = { consent };

    return provider.interactionFinished(ctx.req, ctx.res, result, {
      mergeWithLastSubmission: true,
    });

    // with consent
    return ctx.render("interaction", {
      client,
      uid,
      details: prompt.details,
      params,
      title: "Authorize",
    });
  }
}
