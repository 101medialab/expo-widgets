"use strict";
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }
    : function (o, v) {
        o["default"] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== "default") __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, "__esModule", { value: true });
exports.withPodfile = void 0;
const generateCode_1 = require("@expo/config-plugins/build/utils/generateCode");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("../utils/logger");
const target_1 = require("./xcode/target");
const withPodfile = (config, options) => {
  const targetName = `${(0, target_1.getTargetName)(config, options)}`;
  const AppExtAPIOnly = options.xcode?.appExtAPI ?? false;
  const AppExtValue = AppExtAPIOnly ? "YES" : "No";
  const excludedPackages = options.excludedPackages;
  const podFilePath = path.join(
    config.modRequest.platformProjectRoot,
    "Podfile"
  );
  let podFileContent = fs.readFileSync(podFilePath).toString();
  const useExpoModules =
    excludedPackages && excludedPackages.length > 0
      ? `exclude = ["${excludedPackages.join(
          '", "'
        )}"]\n  use_expo_modules!(exclude: exclude)`
      : "use_expo_modules!";
  const podInstaller = `
target '${targetName}' do
  ${useExpoModules}
  config = use_native_modules!

  use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']
  use_frameworks! :linkage => ENV['USE_FRAMEWORKS'].to_sym if ENV['USE_FRAMEWORKS']

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => podfile_properties['expo.jsEngine'] == nil || podfile_properties['expo.jsEngine'] == 'hermes',
    # An absolute path to your application root.
    :app_path => "#{Pod::Config.instance.installation_root}/..",
    :privacy_file_aggregation_enabled => podfile_properties['apple.privacyManifestAggregationEnabled'] != 'false',
  )
end
`;
  const postInstallContent = `
    installer.target_installation_results.pod_target_installation_results
      .each do |pod_name, target_installation_result|
      target_installation_result.resource_bundle_targets.each do |resource_bundle_target|
        resource_bundle_target.build_configurations.each do |config|
          config.build_settings['APPLICATION_EXTENSION_API_ONLY'] = 'NO'
        end
      end
    end

    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
        config.build_settings['APPLICATION_EXTENSION_API_ONLY'] = 'NO'
      end
    end
`;
  const postInstallHook = `
  post_install do |installer|
${postInstallContent}
  end
`;
  const postInstallAnchor = /post_install do \|installer\|/;
  if (podFileContent.match(postInstallAnchor)) {
    const mergedPodfile = (0, generateCode_1.mergeContents)({
      tag: "expo-widgets-post-install",
      src: podFileContent,
      newSrc: postInstallContent,
      anchor: postInstallAnchor,
      offset: 1,
      comment: "#",
    });
    podFileContent = mergedPodfile.contents;
  } else {
    podFileContent += postInstallHook;
  }
  logger_1.Logging.logger.debug("Updating podfile");
  fs.writeFileSync(podFilePath, [podFileContent, podInstaller].join("\n"));
  return config;
};
exports.withPodfile = withPodfile;
