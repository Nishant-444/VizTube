module.exports = {
  apps: [{
    name: "viztube",
    script: "./dist/index.js",
    instances: 1,
    exec_mode: "fork",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
}
