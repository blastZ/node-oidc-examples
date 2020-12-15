import { ConfigResponses } from "@blastz/nico";

export const responses: ConfigResponses = {
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
};
