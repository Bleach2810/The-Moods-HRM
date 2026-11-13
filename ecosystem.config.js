const path = require("path");

module.exports = {
  apps: [
    {
      name: "themoods-be",
      cwd: path.resolve(__dirname, "backend/publish"),
      script: "dotnet",
      args: "TheMoods.Api.dll --urls http://127.0.0.1:5078 --environment Development",
      interpreter: "none",
      env: {
        ASPNETCORE_ENVIRONMENT: "Development",
        DOTNET_ENVIRONMENT: "Development"
      }
    },
    {
      name: "themoods-fe",
      cwd: __dirname,
      script: path.resolve(__dirname, "node_modules/next/dist/bin/next"),
      args: "start -p 8899",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        PORT: "8899"
      }
    }
  ]
};
