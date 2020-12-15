import nico, { InnerAppMiddleware } from "@blastz/nico";
import mount from "koa-mount";
import render from "koa-ejs";
import path from "path";

import db from "./api/model/mysql";
import { routes } from "./config";
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
  security: {
    cors: {
      allRoutes: true,
      allowOrigins: ["http://localhost:8080", "http://localhost:8081"],
      allowCredentials: true,
    },
  },
  custom: {
    datastores: {
      default: {
        url: "mysql://root:admin123@localhost:3318/op",
      },
    },
  },
  responses: {
    ok: function ok(data: any, message?: string, success = true) {
      this.status = 200;
      this.body = {
        data,
        success,
        message,
      };
    },
    onValidateError: function onValidateError(err) {
      this.status = 400;
      this.body = {
        success: false,
        message: err.message,
      };
    },
    onError: function onError(err) {
      this.status = 500;
      this.body = {
        success: false,
        message: err.message,
      };
    },
  },
  logger: {
    consoleLevel: "debug",
  },
});

db.connect(nico.config.custom.datastores?.default?.url);

nico.start(1818);
