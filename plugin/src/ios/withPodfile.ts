import { mergeContents } from "@expo/config-plugins/build/utils/generateCode";
import { ExportedConfigWithProps, XcodeProject } from "expo/config-plugins";
import * as fs from "fs";
import * as path from "path";
import { Logging } from "../utils/logger";
import { WithExpoIOSWidgetsProps } from "..";
import { getTargetName } from "./xcode/target";

export const withPodfile = (
  config: ExportedConfigWithProps<XcodeProject>,
  options: WithExpoIOSWidgetsProps
) => {
  const targetName = `${getTargetName(config, options)}`;
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

  const postInstall = `
  post_install do |installer|
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
  end
`;

  const mergedPodfile = mergeContents({
    tag: "expo-widgets-post-install",
    src: podFileContent,
    newSrc: postInstall,
    anchor: /post_install do \|installer\|/,
    offset: 0,
    comment: "#",
  });

  if (!mergedPodfile.didMerge) {
    podFileContent += `\n\n${postInstall}`;
  } else {
    podFileContent = mergedPodfile.contents;
  }

  Logging.logger.debug("Updating podfile");

  fs.writeFileSync(podFilePath, [podFileContent, podInstaller].join("\n"));

  return config;
};
