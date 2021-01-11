import nico, { InnerAppMiddleware } from "@blastz/nico";
import mount from "koa-mount";
import render from "koa-ejs";
import path from "path";

import db from "./api/model/mysql";
import { responses, routes, security } from "./config";
import provider from "./provider";

nico.useAppMiddleware(
  mount("/api/op/v1", provider.app),
  InnerAppMiddleware.ROUTES
);

render(nico, {
  cache: false,
  viewExt: "ejs",
  root: path.resolve(__dirname, "./view"),
});

nico.init({
  routes,
  security,
  custom: {
    datastores: {
      default: {
        url: "mysql://root:admin123@localhost:3318/oidc-examples",
      },
    },
  },
  responses,
  logger: {
    consoleLevel: "debug",
  },
});

db.connect(nico.config.custom.datastores?.default?.url);

nico.start(1818);
