import { ConfigRoutes } from "@blastz/nico";
import Joi from "joi";
import interactionGet from "../api/controller/interaction/get";
import interactionLogin from "../api/controller/interaction/login";

export const routes: ConfigRoutes = {
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
};
