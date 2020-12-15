import { Context } from "@blastz/nico";
import assert from "assert";

import provider from "../../../provider";

export default async function interactionConfirm(ctx: Context) {
  const detail = await provider.interactionDetails(ctx.req, ctx.res);
  const { prompt } = detail;

  assert.strictEqual(prompt.name, "consent");

  const consent = {
    rejectedScopes: ["profile"],
    rejectedClaims: [],
    replace: false,
  };

  const result = { consent };

  return provider.interactionFinished(ctx.req, ctx.res, result, {
    mergeWithLastSubmission: true,
  });
}
