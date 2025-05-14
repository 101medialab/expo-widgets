"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withModule = void 0;
const fs_1 = __importDefault(require("fs"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const module_template_1 = require("./module-template");
const logger_1 = require("../utils/logger");
const withModule = (props, options) => {
    try {
        const { projectRoot, } = props.modRequest;
        const widgetFolderPath = path_1.default.join(projectRoot, options.src);
        logger_1.Logging.logger.debug(`Current directory::: ${__dirname}`);
        const expoModulePath = path_1.default.join(__dirname, '../../../ios/ExpoWidgetsModule.swift');
        logger_1.Logging.logger.debug(`Expo module path: ${expoModulePath}`);
        const moduleFile = path_1.default.join(widgetFolderPath, 'Module.swift');
        if (!fs_1.default.existsSync(moduleFile)) {
            // the module file is optional. if they don't provide then it's a simple widget with no
            // need for comms between app and the widget
            // to avoid writes from previous runs, extract contents from the template and overwrite any previous changes
            const templatePath = path_1.default.join(__dirname, 'module.template.swift');
            logger_1.Logging.logger.debug(`No Module.swift provided. Using template ${templatePath}`);
            const contents = (0, module_template_1.getTemplate)();
            fs_extra_1.default.outputFileSync(expoModulePath, contents);
        }
        else {
            const contents = fs_1.default.readFileSync(moduleFile);
            if (!fs_1.default.existsSync(expoModulePath)) {
                throw new Error(`No iOS expo module found within expo-widgets! Contact us.`);
            }
            fs_extra_1.default.outputFileSync(expoModulePath, contents);
        }
        const writtenContent = fs_extra_1.default.readFileSync(moduleFile, 'utf-8');
        logger_1.Logging.logger.debug(`Module.swift contents::`);
        logger_1.Logging.logger.debug(writtenContent);
        return props;
    }
    catch (e) {
        console.error(e);
        throw e;
    }
};
exports.withModule = withModule;
