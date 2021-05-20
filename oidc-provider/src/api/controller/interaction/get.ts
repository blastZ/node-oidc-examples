import { NicoContext } from "@blastz/nico";
import provider from "../../../provider";

export default async function interactionGet(ctx: NicoContext) {
  const detail = await provider.interactionDetails(ctx.req, ctx.res);
  ctx.logger.debug(detail);

  const { params, prompt, uid } = detail;

  const client = await provider.Client.find(<string>params.client_id);
  ctx.logger.debug(client);

  if (prompt.name === "login") {
    // redirect to login page
    return ctx.redirect("/login");

    // render login page
    return ctx.render("login", {
      client,
      uid,
      details: prompt.details,
      params,
      title: "Sign-in",
      flash: undefined,
    });
  }
}
