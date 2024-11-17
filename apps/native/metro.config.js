// Learn more https://docs.expo.io/guides/customizing-metro
// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const { FileStore } = require("metro-cache");
const { withNativeWind } = require("nativewind/metro");
const withStorybook = require("@storybook/react-native/metro/withStorybook");

const path = require("path");

module.exports = withTurborepoManagedCache(
  withMonorepoPaths(
    withStorybookConfig(
      withNativeWind(getDefaultConfig(__dirname), {
        input: "./global.css",
      }),
    ),
  ),
);

/**
 * Add the monorepo paths to the Metro config.
 * This allows Metro to resolve modules from the monorepo.
 *
 * @see https://docs.expo.dev/guides/monorepos/#modify-the-metro-config
 * @param {import('expo/metro-config').MetroConfig} config
 * @returns {import('expo/metro-config').MetroConfig}
 */
function withMonorepoPaths(config) {
  const projectRoot = __dirname;
  const workspaceRoot = path.resolve(projectRoot, "../..");

  // #1 - Watch all files in the monorepo
  config.watchFolders = [workspaceRoot];

  // #2 - Resolve modules within the project's `node_modules` first, then all monorepo modules
  config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(workspaceRoot, "node_modules"),
  ];

  return config;
}

/**
 * Move the Metro cache to the `node_modules/.cache/metro` folder.
 * This repository configured Turborepo to use this cache location as well.
 * If you have any environment variables, you can configure Turborepo to invalidate it when needed.
 *
 * @see https://turbo.build/repo/docs/reference/configuration#env
 * @param {import('expo/metro-config').MetroConfig} config
 * @returns {import('expo/metro-config').MetroConfig}
 */
function withTurborepoManagedCache(config) {
  config.cacheStores = [
    new FileStore({ root: path.join(__dirname, "node_modules/.cache/metro") }),
  ];
  return config;
}

/**
 * Storybook on react native is a normal React Native component that can be used or hidden
 * anywhere in RN application. withStorybook is a wrapper function to extend Metro config for Storybook
 *
 * @param {import('expo/metro-config').MetroConfig} config
 * @returns {import('expo/metro-config').MetroConfig}
 */
function withStorybookConfig(config) {
  return withStorybook(config, {
    enabled: process.env.STORYBOOK_ENABLED,
    configPath: path.resolve(__dirname, "./.storybook"),
    /**
     * If onDisabledRemoveStorybook true and enabled is false, the storybook package will be removed from the build.
     * Useful for production build.
     */
    onDisabledRemoveStorybook: true,
  });
}
