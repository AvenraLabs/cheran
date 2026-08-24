module.exports = {
  apps: [
    {
      name: "cheran-backend",
      script: "src/server.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
