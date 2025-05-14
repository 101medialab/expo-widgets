"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidWidgets = void 0;
const withSourceFiles_1 = require("./withSourceFiles");
const withModule_1 = require("./withModule");
const withAppBuildGradle_1 = require("./withAppBuildGradle");
const withProjectBuildGradle_1 = require("./withProjectBuildGradle");
const withWidgetManifest_1 = require("./withWidgetManifest");
const DEFAULT_OPTIONS = {
    src: 'widgets/android',
    widgets: [],
    distPlaceholder: ''
};
function getDefaultedOptions(options) {
    return {
        ...DEFAULT_OPTIONS,
        ...options,
    };
}
const withAndroidWidgets = (config, userOptions) => {
    const options = getDefaultedOptions(userOptions);
    config = (0, withWidgetManifest_1.withWidgetManifest)(config, options);
    config = (0, withProjectBuildGradle_1.withWidgetProjectBuildGradle)(config);
    config = (0, withAppBuildGradle_1.withWidgetAppBuildGradle)(config);
    config = (0, withAppBuildGradle_1.withGsonGradle)(config);
    config = (0, withSourceFiles_1.withSourceFiles)(config, options);
    config = (0, withModule_1.withModule)(config, options);
    return config;
};
exports.withAndroidWidgets = withAndroidWidgets;
