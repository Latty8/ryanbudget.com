/** PM2 process config — run from repo root on the VPS. */
module.exports = {
  apps: [
    {
      name: "ryanbudget",
      cwd: "/var/www/ryanbudget.me",
      script: "npm",
      args: "run start:prod",
      interpreter: "none",
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3002",
        HOSTNAME: "127.0.0.1",
      },
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      listen_timeout: 15000,
    },
  ],
};
