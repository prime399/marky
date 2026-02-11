const path = require("path");

module.exports = {
  mode: process.env.NODE_ENV || "production",
  target: "electron-preload",
  entry: {
    preload: path.join(__dirname, "electron", "preload.ts"),
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist", "main"),
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        exclude: /node_modules/,
        options: {
          configFile: path.resolve(__dirname, "tsconfig.electron.json"),
        },
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};
