import { NicoContext } from "@blastz/nico";
import provider from "../../../provider";
import db from "../../model/mysql";

export default async function interactionLogin(ctx: NicoContext) {
  const detail = await provider.interactionDetails(ctx.req, ctx.res);
  ctx.logger.debug(detail);

  const { uid, prompt, params } = detail;
  const client = await provider.Client.find(<string>params.client_id);
  ctx.logger.debug(client);

  const user = await db.userDao.getUserByEmail(ctx.state.body.email);

  if (!user) {
    return ctx.render("login", {
      client,
      uid,
      details: prompt.details,
      params: {
        ...params,
        login_hint: ctx.state.body.email,
      },
      title: "Sign-in",
      flash: "Invalid email or password.",
    });
  }

  const result = {
    login: {
      accountId: String(user.id),
    },
  };

  await provider.interactionFinished(ctx.req, ctx.res, result, {
    mergeWithLastSubmission: false,
  });
}
