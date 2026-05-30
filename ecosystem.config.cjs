/** PM2 process config — run from repo root on the VPS. */
module.exports = {
  apps: [
    {
      name: "ryanbudget",
      cwd: "/var/www/ryanbudget.me",
      script: "node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3002",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
