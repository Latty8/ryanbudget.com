const path = require("path");

/** PM2 config — start with: pm2 start ecosystem.config.cjs */
module.exports = {
  apps: [
    {
      name: "ryanbudget",
      cwd: __dirname,
      script: path.join(__dirname, "scripts/start-prod.sh"),
      interpreter: "bash",
      exec_mode: "fork",
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
    },
  ],
};
