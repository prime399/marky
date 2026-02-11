const webpack = require("webpack");
const path = require("path");
const fileSystem = require("fs-extra");
const env = require("./utils/env");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

require("dotenv").config();

// Adapter shim must load before any app code that references chrome.* APIs
const adapterShim = path.join(__dirname, "src", "adapters", "index.ts");

// Renderer entry points — excludes background, contentScript, and removed pages
const entryPoints = {
  recorder: [adapterShim, path.join(__dirname, "src", "pages", "Recorder", "index.jsx")],
  cloudrecorder: [adapterShim, path.join(__dirname, "src", "pages", "CloudRecorder", "index.jsx")],
  camera: [adapterShim, path.join(__dirname, "src", "pages", "Camera", "index.jsx")],
  waveform: [adapterShim, path.join(__dirname, "src", "pages", "Waveform", "index.jsx")],
  sandbox: [adapterShim, path.join(__dirname, "src", "pages", "Sandbox", "index.jsx")],
  setup: [adapterShim, path.join(__dirname, "src", "pages", "Setup", "index.jsx")],
  playground: [adapterShim, path.join(__dirname, "src", "pages", "Playground", "index.jsx")],
  editor: [adapterShim, path.join(__dirname, "src", "pages", "Editor", "index.jsx")],
  editorwebcodecs: [adapterShim, path.join(__dirname, "src", "pages", "EditorWebCodecs", "index.jsx")],
  editorviewer: [adapterShim, path.join(__dirname, "src", "pages", "EditorViewer", "index.jsx")],
};

const htmlPlugins = Object.keys(entryPoints)
  .map((entryName) => {
    const folderNameMap = {
      cloudrecorder: "CloudRecorder",
      editorwebcodecs: "EditorWebCodecs",
      editorviewer: "EditorViewer",
    };

    const folderName =
      folderNameMap[entryName] ||
      entryName.charAt(0).toUpperCase() + entryName.slice(1);

    const templatePath = path.join(
      __dirname, "src", "pages", folderName, "index.html"
    );

    // Read template and replace chrome-extension:// URLs with relative paths
    const rawHtml = fileSystem.readFileSync(templatePath, "utf-8");
    const patchedHtml = rawHtml.replace(
      /chrome-extension:\/\/__MSG_@@extension_id__\//g,
      "./"
    );

    return new HtmlWebpackPlugin({
      templateContent: patchedHtml,
      filename: `${entryName}.html`,
      chunks: [entryName],
      cache: false,
      favicon: path.join(__dirname, "src", "assets", "favicon.png"),
    });
  });

const fileExtensions = [
  "jpg", "jpeg", "png", "gif", "eot", "otf", "svg", "ttf", "woff", "woff2",
];

const secretsPath = path.join(__dirname, `secrets.${env.NODE_ENV}.js`);

const resolveAlias = {
  react: path.resolve("./node_modules/react"),
  "react-dom": path.resolve("./node_modules/react-dom"),
  "react/jsx-runtime": path.resolve("./node_modules/react/jsx-runtime"),
};

if (fileSystem.existsSync(secretsPath)) {
  resolveAlias["secrets"] = secretsPath;
}

const config = {
  mode: process.env.NODE_ENV || "production",
  target: "web",
  performance: { hints: false },
  entry: entryPoints,

  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist", "renderer"),
    clean: true,
    publicPath: "./",
  },
  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: [
          { loader: "style-loader" },
          { loader: "css-loader" },
          {
            loader: "sass-loader",
            options: { sourceMap: true, api: "modern" },
          },
        ],
      },
      {
        test: new RegExp(`.(${fileExtensions.join("|")})$`),
        type: "asset/resource",
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(ts|tsx)$/,
        loader: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(js|jsx)$/,
        use: [{ loader: "source-map-loader" }, { loader: "babel-loader" }],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: resolveAlias,
    extensions: fileExtensions
      .map((ext) => `.${ext}`)
      .concat([".js", ".jsx", ".ts", ".tsx", ".css"]),
  },
  plugins: [
    new CleanWebpackPlugin({ verbose: false }),
    new webpack.ProgressPlugin(),
    new webpack.DefinePlugin({
      "process.env.SCREENITY_APP_BASE": JSON.stringify(
        process.env.SCREENITY_APP_BASE
      ),
      "process.env.SCREENITY_WEBSITE_BASE": JSON.stringify(
        process.env.SCREENITY_WEBSITE_BASE
      ),
      "process.env.SCREENITY_API_BASE_URL": JSON.stringify(
        process.env.SCREENITY_API_BASE_URL
      ),
      "process.env.SCREENITY_ENABLE_CLOUD_FEATURES": JSON.stringify(
        process.env.SCREENITY_ENABLE_CLOUD_FEATURES
      ),
      "process.env.MAX_RECORDING_DURATION": JSON.stringify(
        process.env.MAX_RECORDING_DURATION || 3600
      ),
      "process.env.RECORDING_WARNING_THRESHOLD": JSON.stringify(
        process.env.RECORDING_WARNING_THRESHOLD || 60
      ),
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "src/assets/",
          to: path.join(__dirname, "dist", "renderer", "assets"),
          force: true,
          transform: {
            transformer(content, absoluteFrom) {
              // Rewrite chrome-extension:// URLs in CSS files to relative paths
              // Use ../../ because CSS files are inside assets/fonts/ subdirectory
              if (absoluteFrom.endsWith(".css")) {
                return content
                  .toString()
                  .replace(/chrome-extension:\/\/__MSG_@@extension_id__\//g, "../../");
              }
              return content;
            },
          },
        },
        {
          from: "src/_locales/",
          to: path.join(__dirname, "dist", "renderer", "_locales"),
          force: true,
        },
      ],
    }),
    ...htmlPlugins,
  ],
};

if (env.NODE_ENV === "development") {
  config.devtool = "cheap-module-source-map";
  config.devServer = {
    static: path.join(__dirname, "dist", "renderer"),
    port: 3000,
    hot: true,
    headers: { "Access-Control-Allow-Origin": "*" },
  };
} else {
  config.optimization = {
    minimize: true,
    minimizer: [new TerserPlugin({ extractComments: false })],
  };
}

module.exports = config;
