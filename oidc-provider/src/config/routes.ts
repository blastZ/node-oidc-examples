import { ConfigRoutes } from "@blastz/nico";
import Joi from "joi";
import interactionConfirm from "../api/controller/interaction/confirm";
import interactionGet from "../api/controller/interaction/get";
import interactionLogin from "../api/controller/interaction/login";
import provider from "../provider";

export const routes: ConfigRoutes = {
  "/api/op/v1": {
    "GET /interaction/:uid": {
      controller: interactionGet,
    },

    "POST /interaction/:uid/login": {
      controller: interactionLogin,
      bodyParser: true,
      validate: {
        body: Joi.object({
          email: Joi.string().required().min(6),
          password: Joi.string().required().min(6),
        }),
      },
    },

    "POST /interaction/:uid/confirm": {
      controller: interactionConfirm,
      bodyParser: true,
    },
  },
  "GET /login": {
    controller: async function loginView(ctx) {
      try {
        const detail = await provider.interactionDetails(ctx.req, ctx.res);

        ctx.logger.debug(detail);

        const { params, prompt, uid } = detail;

        const client = await provider.Client.find(<string>params.client_id);

        return ctx.render("login", {
          client,
          uid,
          details: prompt.details,
          params,
          title: "Sign-in",
          flash: undefined,
        });
      } catch (err) {
        ctx.logger.error(err);
        return ctx.redirect("/");
      }
    },
  },
};
