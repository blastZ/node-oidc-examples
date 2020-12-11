module.exports = {
  apps: [
    {
      name: "oidc-provider",
      script: "./dist/app.js",
      exec_mode: "fork",
      watch: ["./dist"],
      watch_delay: 1000,
      watch_options: {
        followSymlinks: false,
      },
      max_restarts: 10,
      args: ["--color"],
      env: {
        NODE_ENV: "development",
        APP_ENV: "development",
      },
    },
  ],
};
