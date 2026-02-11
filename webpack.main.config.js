const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: process.env.NODE_ENV || "production",
  target: "electron-main",
  entry: {
    main: path.join(__dirname, "electron", "main.ts"),
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
    extensions: [".ts", ".js", ".json"],
  },
  externals: {
    "electron-store": "commonjs electron-store",
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
    }),
  ],
  node: {
    __dirname: false,
    __filename: false,
  },
};
