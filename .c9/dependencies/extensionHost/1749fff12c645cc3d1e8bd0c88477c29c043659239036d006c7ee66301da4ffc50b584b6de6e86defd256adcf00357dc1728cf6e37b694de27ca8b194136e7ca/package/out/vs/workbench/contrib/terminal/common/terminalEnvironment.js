/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define(["require", "exports", "vs/base/common/path", "vs/base/common/platform", "vs/base/common/processes"], function (require, exports, path, platform, processes_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * This module contains utility functions related to the environment, cwd and paths.
     */
    function mergeEnvironments(parent, other) {
        if (!other) {
            return;
        }
        // On Windows apply the new values ignoring case, while still retaining
        // the case of the original key.
        if (platform.isWindows) {
            for (const configKey in other) {
                let actualKey = configKey;
                for (const envKey in parent) {
                    if (configKey.toLowerCase() === envKey.toLowerCase()) {
                        actualKey = envKey;
                        break;
                    }
                }
                const value = other[configKey];
                _mergeEnvironmentValue(parent, actualKey, value);
            }
        }
        else {
            Object.keys(other).forEach((key) => {
                const value = other[key];
                _mergeEnvironmentValue(parent, key, value);
            });
        }
    }
    exports.mergeEnvironments = mergeEnvironments;
    function _mergeEnvironmentValue(env, key, value) {
        if (typeof value === 'string') {
            env[key] = value;
        }
        else {
            delete env[key];
        }
    }
    function addTerminalEnvironmentKeys(env, version, locale, setLocaleVariables) {
        env['TERM_PROGRAM'] = 'vscode';
        if (version) {
            env['TERM_PROGRAM_VERSION'] = version;
        }
        if (setLocaleVariables) {
            env['LANG'] = _getLangEnvVariable(locale);
        }
        env['COLORTERM'] = 'truecolor';
    }
    exports.addTerminalEnvironmentKeys = addTerminalEnvironmentKeys;
    function mergeNonNullKeys(env, other) {
        if (!other) {
            return;
        }
        for (const key of Object.keys(other)) {
            const value = other[key];
            if (value) {
                env[key] = value;
            }
        }
    }
    function resolveConfigurationVariables(configurationResolverService, env, lastActiveWorkspaceRoot) {
        Object.keys(env).forEach((key) => {
            const value = env[key];
            if (typeof value === 'string' && lastActiveWorkspaceRoot !== null) {
                try {
                    env[key] = configurationResolverService.resolve(lastActiveWorkspaceRoot, value);
                }
                catch (e) {
                    env[key] = value;
                }
            }
        });
        return env;
    }
    function _getLangEnvVariable(locale) {
        const parts = locale ? locale.split('-') : [];
        const n = parts.length;
        if (n === 0) {
            // Fallback to en_US to prevent possible encoding issues.
            return 'en_US.UTF-8';
        }
        if (n === 1) {
            // app.getLocale can return just a language without a variant, fill in the variant for
            // supported languages as many shells expect a 2-part locale.
            const languageVariants = {
                cs: 'CZ',
                de: 'DE',
                en: 'US',
                es: 'ES',
                fi: 'FI',
                fr: 'FR',
                hu: 'HU',
                it: 'IT',
                ja: 'JP',
                ko: 'KR',
                pl: 'PL',
                ru: 'RU',
                sk: 'SK',
                zh: 'CN'
            };
            if (parts[0] in languageVariants) {
                parts.push(languageVariants[parts[0]]);
            }
        }
        else {
            // Ensure the variant is uppercase
            parts[1] = parts[1].toUpperCase();
        }
        return parts.join('_') + '.UTF-8';
    }
    function getCwd(shell, userHome, lastActiveWorkspace, configurationResolverService, root, customCwd, logService) {
        if (shell.cwd) {
            return (typeof shell.cwd === 'object') ? shell.cwd.fsPath : shell.cwd;
        }
        let cwd;
        if (!shell.ignoreConfigurationCwd && customCwd) {
            if (configurationResolverService) {
                try {
                    customCwd = configurationResolverService.resolve(lastActiveWorkspace, customCwd);
                }
                catch (e) {
                    // There was an issue resolving a variable, log the error in the console and
                    // fallback to the default.
                    if (logService) {
                        logService.error('Could not resolve terminal.integrated.cwd', e);
                    }
                    customCwd = undefined;
                }
            }
            if (customCwd) {
                if (path.isAbsolute(customCwd)) {
                    cwd = customCwd;
                }
                else if (root) {
                    cwd = path.join(root.fsPath, customCwd);
                }
            }
        }
        // If there was no custom cwd or it was relative with no workspace
        if (!cwd) {
            cwd = root ? root.fsPath : userHome;
        }
        return _sanitizeCwd(cwd);
    }
    exports.getCwd = getCwd;
    function _sanitizeCwd(cwd) {
        // Make the drive letter uppercase on Windows (see #9448)
        if (platform.platform === 3 /* Windows */ && cwd && cwd[1] === ':') {
            return cwd[0].toUpperCase() + cwd.substr(1);
        }
        return cwd;
    }
    function escapeNonWindowsPath(path) {
        let newPath = path;
        if (newPath.indexOf('\\') !== 0) {
            newPath = newPath.replace(/\\/g, '\\\\');
        }
        if (!newPath && (newPath.indexOf('"') !== -1)) {
            newPath = '\'' + newPath + '\'';
        }
        else if (newPath.indexOf(' ') !== -1) {
            newPath = newPath.replace(/ /g, '\\ ');
        }
        return newPath;
    }
    exports.escapeNonWindowsPath = escapeNonWindowsPath;
    function getDefaultShell(fetchSetting, isWorkspaceShellAllowed, defaultShell, isWoW64, windir, lastActiveWorkspace, configurationResolverService, logService, useAutomationShell, platformOverride = platform.platform) {
        let maybeExecutable = null;
        if (useAutomationShell) {
            // If automationShell is specified, this should override the normal setting
            maybeExecutable = getShellSetting(fetchSetting, isWorkspaceShellAllowed, 'automationShell', platformOverride);
        }
        if (!maybeExecutable) {
            maybeExecutable = getShellSetting(fetchSetting, isWorkspaceShellAllowed, 'shell', platformOverride);
        }
        let executable = maybeExecutable || defaultShell;
        // Change Sysnative to System32 if the OS is Windows but NOT WoW64. It's
        // safe to assume that this was used by accident as Sysnative does not
        // exist and will break the terminal in non-WoW64 environments.
        if ((platformOverride === 3 /* Windows */) && !isWoW64 && windir) {
            const sysnativePath = path.join(windir, 'Sysnative').replace(/\//g, '\\').toLowerCase();
            if (executable && executable.toLowerCase().indexOf(sysnativePath) === 0) {
                executable = path.join(windir, 'System32', executable.substr(sysnativePath.length + 1));
            }
        }
        // Convert / to \ on Windows for convenience
        if (executable && platformOverride === 3 /* Windows */) {
            executable = executable.replace(/\//g, '\\');
        }
        if (configurationResolverService) {
            try {
                executable = configurationResolverService.resolve(lastActiveWorkspace, executable);
            }
            catch (e) {
                logService.error(`Could not resolve shell`, e);
                executable = executable;
            }
        }
        return executable;
    }
    exports.getDefaultShell = getDefaultShell;
    function getDefaultShellArgs(fetchSetting, isWorkspaceShellAllowed, useAutomationShell, lastActiveWorkspace, configurationResolverService, logService, platformOverride = platform.platform) {
        if (useAutomationShell) {
            if (!!getShellSetting(fetchSetting, isWorkspaceShellAllowed, 'automationShell', platformOverride)) {
                return [];
            }
        }
        const platformKey = platformOverride === 3 /* Windows */ ? 'windows' : platformOverride === 1 /* Mac */ ? 'osx' : 'linux';
        const shellArgsConfigValue = fetchSetting(`terminal.integrated.shellArgs.${platformKey}`);
        let args = ((isWorkspaceShellAllowed ? shellArgsConfigValue.value : shellArgsConfigValue.user) || shellArgsConfigValue.default);
        if (typeof args === 'string' && platformOverride === 3 /* Windows */) {
            return configurationResolverService ? configurationResolverService.resolve(lastActiveWorkspace, args) : args;
        }
        if (configurationResolverService) {
            const resolvedArgs = [];
            for (const arg of args) {
                try {
                    resolvedArgs.push(configurationResolverService.resolve(lastActiveWorkspace, arg));
                }
                catch (e) {
                    logService.error(`Could not resolve terminal.integrated.shellArgs.${platformKey}`, e);
                    resolvedArgs.push(arg);
                }
            }
            args = resolvedArgs;
        }
        return args;
    }
    exports.getDefaultShellArgs = getDefaultShellArgs;
    function getShellSetting(fetchSetting, isWorkspaceShellAllowed, type, platformOverride = platform.platform) {
        const platformKey = platformOverride === 3 /* Windows */ ? 'windows' : platformOverride === 1 /* Mac */ ? 'osx' : 'linux';
        const shellConfigValue = fetchSetting(`terminal.integrated.${type}.${platformKey}`);
        const executable = (isWorkspaceShellAllowed ? shellConfigValue.value : shellConfigValue.user) || shellConfigValue.default;
        return executable;
    }
    function createTerminalEnvironment(shellLaunchConfig, lastActiveWorkspace, envFromConfig, configurationResolverService, isWorkspaceShellAllowed, version, setLocaleVariables, baseEnv) {
        // Create a terminal environment based on settings, launch config and permissions
        let env = {};
        if (shellLaunchConfig.strictEnv) {
            // strictEnv is true, only use the requested env (ignoring null entries)
            mergeNonNullKeys(env, shellLaunchConfig.env);
        }
        else {
            // Merge process env with the env from config and from shellLaunchConfig
            mergeNonNullKeys(env, baseEnv);
            // const platformKey = platform.isWindows ? 'windows' : (platform.isMacintosh ? 'osx' : 'linux');
            // const envFromConfigValue = this._workspaceConfigurationService.inspect<ITerminalEnvironment | undefined>(`terminal.integrated.env.${platformKey}`);
            const allowedEnvFromConfig = Object.assign({}, (isWorkspaceShellAllowed ? envFromConfig.value : envFromConfig.user));
            // Resolve env vars from config and shell
            if (configurationResolverService) {
                if (allowedEnvFromConfig) {
                    resolveConfigurationVariables(configurationResolverService, allowedEnvFromConfig, lastActiveWorkspace);
                }
                if (shellLaunchConfig.env) {
                    resolveConfigurationVariables(configurationResolverService, shellLaunchConfig.env, lastActiveWorkspace);
                }
            }
            // Sanitize the environment, removing any undesirable VS Code and Electron environment
            // variables
            processes_1.sanitizeProcessEnvironment(env, 'VSCODE_IPC_HOOK_CLI');
            // Merge config (settings) and ShellLaunchConfig environments
            mergeEnvironments(env, allowedEnvFromConfig);
            mergeEnvironments(env, shellLaunchConfig.env);
            // Adding other env keys necessary to create the process
            addTerminalEnvironmentKeys(env, version, platform.locale, setLocaleVariables);
        }
        return env;
    }
    exports.createTerminalEnvironment = createTerminalEnvironment;
});
//# sourceMappingURL=terminalEnvironment.js.map