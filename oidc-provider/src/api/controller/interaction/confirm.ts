import { Context } from "@blastz/nico";
import assert from "assert";

import provider from "../../../provider";

export default async function interactionConfirm(ctx: Context) {
  const detail = await provider.interactionDetails(ctx.req, ctx.res);
  const { prompt } = detail;
  const details: any = prompt.details;

  assert.strictEqual(prompt.name, "consent");

  let grantId = detail.grantId;
  let grant;

  if (grantId) {
    grant = await provider.Grant.find(grantId);
  } else {
    // @ts-ignore
    grant = new provider.Grant({
      accountId: detail.session?.accountId,
      clientId: <string>detail.params.client_id,
    });
  }

  if (!grant) {
    return ctx.redirect("/login");
  }

  if (details.missingOIDCScope) {
    grant.addOIDCScope(details.missingOIDCScope.join(" "));
  }
  if (details.missingOIDCClaims) {
    grant.addOIDCClaims(details.missingOIDCClaims);
  }
  if (details.missingResourceScopes) {
    // eslint-disable-next-line no-restricted-syntax
    for (const [indicator, scope] of Object.entries(
      details.missingResourceScopes
    )) {
      grant.addResourceScope(indicator, (<Array<string>>scope).join(" "));
    }
  }

  grantId = await grant.save();

  const consent: any = {};
  if (!detail.grantId) {
    // we don't have to pass grantId to consent, we're just modifying existing one
    consent.grantId = grantId;
  }

  const result = { consent };

  return provider.interactionFinished(ctx.req, ctx.res, result, {
    mergeWithLastSubmission: true,
  });
}
