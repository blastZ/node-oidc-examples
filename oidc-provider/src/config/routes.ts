import { ConfigRoutes } from "@blastz/nico";
import Joi from "joi";
import interactionConfirm from "../api/controller/interaction/confirm";
import interactionGet from "../api/controller/interaction/get";
import interactionLogin from "../api/controller/interaction/login";

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
};
