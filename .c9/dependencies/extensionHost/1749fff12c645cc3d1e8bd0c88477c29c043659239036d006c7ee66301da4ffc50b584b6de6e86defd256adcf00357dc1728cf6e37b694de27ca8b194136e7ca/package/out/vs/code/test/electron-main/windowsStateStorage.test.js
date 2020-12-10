define(["require", "exports", "assert", "os", "vs/base/common/path", "vs/code/electron-main/windowsStateStorage", "vs/base/common/uri"], function (require, exports, assert, os, path, windowsStateStorage_1, uri_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getUIState() {
        return {
            x: 0,
            y: 10,
            width: 100,
            height: 200,
            mode: 0
        };
    }
    function toWorkspace(uri) {
        return {
            id: '1234',
            configPath: uri
        };
    }
    function assertEqualURI(u1, u2, message) {
        assert.equal(u1 && u1.toString(), u2 && u2.toString(), message);
    }
    function assertEqualWorkspace(w1, w2, message) {
        if (!w1 || !w2) {
            assert.equal(w1, w2, message);
            return;
        }
        assert.equal(w1.id, w2.id, message);
        assertEqualURI(w1.configPath, w2.configPath, message);
    }
    function assertEqualWindowState(expected, actual, message) {
        if (!expected || !actual) {
            assert.deepEqual(expected, actual, message);
            return;
        }
        assert.equal(expected.backupPath, actual.backupPath, message);
        assertEqualURI(expected.folderUri, actual.folderUri, message);
        assert.equal(expected.remoteAuthority, actual.remoteAuthority, message);
        assertEqualWorkspace(expected.workspace, actual.workspace, message);
        assert.deepEqual(expected.uiState, actual.uiState, message);
    }
    function assertEqualWindowsState(expected, actual, message) {
        assertEqualWindowState(expected.lastPluginDevelopmentHostWindow, actual.lastPluginDevelopmentHostWindow, message);
        assertEqualWindowState(expected.lastActiveWindow, actual.lastActiveWindow, message);
        assert.equal(expected.openedWindows.length, actual.openedWindows.length, message);
        for (let i = 0; i < expected.openedWindows.length; i++) {
            assertEqualWindowState(expected.openedWindows[i], actual.openedWindows[i], message);
        }
    }
    function assertRestoring(state, message) {
        const stored = windowsStateStorage_1.getWindowsStateStoreData(state);
        const restored = windowsStateStorage_1.restoreWindowsState(stored);
        assertEqualWindowsState(state, restored, message);
    }
    const testBackupPath1 = path.join(os.tmpdir(), 'windowStateTest', 'backupFolder1');
    const testBackupPath2 = path.join(os.tmpdir(), 'windowStateTest', 'backupFolder2');
    const testWSPath = uri_1.URI.file(path.join(os.tmpdir(), 'windowStateTest', 'test.code-workspace'));
    const testFolderURI = uri_1.URI.file(path.join(os.tmpdir(), 'windowStateTest', 'testFolder'));
    const testRemoteFolderURI = uri_1.URI.parse('foo://bar/c/d');
    suite('Windows State Storing', () => {
        test('storing and restoring', () => {
            let windowState;
            windowState = {
                openedWindows: []
            };
            assertRestoring(windowState, 'no windows');
            windowState = {
                openedWindows: [{ backupPath: testBackupPath1, uiState: getUIState() }]
            };
            assertRestoring(windowState, 'empty workspace');
            windowState = {
                openedWindows: [{ backupPath: testBackupPath1, uiState: getUIState(), workspace: toWorkspace(testWSPath) }]
            };
            assertRestoring(windowState, 'workspace');
            windowState = {
                openedWindows: [{ backupPath: testBackupPath2, uiState: getUIState(), folderUri: testFolderURI }]
            };
            assertRestoring(windowState, 'folder');
            windowState = {
                openedWindows: [{ backupPath: testBackupPath1, uiState: getUIState(), folderUri: testFolderURI }, { backupPath: testBackupPath1, uiState: getUIState(), folderUri: testRemoteFolderURI, remoteAuthority: 'bar' }]
            };
            assertRestoring(windowState, 'multiple windows');
            windowState = {
                lastActiveWindow: { backupPath: testBackupPath2, uiState: getUIState(), folderUri: testFolderURI },
                openedWindows: []
            };
            assertRestoring(windowState, 'lastActiveWindow');
            windowState = {
                lastPluginDevelopmentHostWindow: { backupPath: testBackupPath2, uiState: getUIState(), folderUri: testFolderURI },
                openedWindows: []
            };
            assertRestoring(windowState, 'lastPluginDevelopmentHostWindow');
        });
        test('open 1_31', () => {
            const v1_31_workspace = `{
			"openedWindows": [],
			"lastActiveWindow": {
				"workspace": {
					"id": "a41787288b5e9cc1a61ba2dd84cd0d80",
					"configPath": "/home/user/workspaces/code-and-docs.code-workspace"
				},
				"backupPath": "/home/user/.config/Code - Insiders/Backups/a41787288b5e9cc1a61ba2dd84cd0d80",
				"uiState": {
					"mode": 0,
					"x": 0,
					"y": 27,
					"width": 2560,
					"height": 1364
				}
			}
		}`;
            let windowsState = windowsStateStorage_1.restoreWindowsState(JSON.parse(v1_31_workspace));
            let expected = {
                openedWindows: [],
                lastActiveWindow: {
                    backupPath: '/home/user/.config/Code - Insiders/Backups/a41787288b5e9cc1a61ba2dd84cd0d80',
                    uiState: { mode: 0 /* Maximized */, x: 0, y: 27, width: 2560, height: 1364 },
                    workspace: { id: 'a41787288b5e9cc1a61ba2dd84cd0d80', configPath: uri_1.URI.file('/home/user/workspaces/code-and-docs.code-workspace') }
                }
            };
            assertEqualWindowsState(expected, windowsState, 'v1_31_workspace');
            const v1_31_folder = `{
			"openedWindows": [],
			"lastPluginDevelopmentHostWindow": {
				"folderUri": {
					"$mid": 1,
					"fsPath": "/home/user/workspaces/testing/customdata",
					"external": "file:///home/user/workspaces/testing/customdata",
					"path": "/home/user/workspaces/testing/customdata",
					"scheme": "file"
				},
				"uiState": {
					"mode": 1,
					"x": 593,
					"y": 617,
					"width": 1625,
					"height": 595
				}
			}
		}`;
            windowsState = windowsStateStorage_1.restoreWindowsState(JSON.parse(v1_31_folder));
            expected = {
                openedWindows: [],
                lastPluginDevelopmentHostWindow: {
                    uiState: { mode: 1 /* Normal */, x: 593, y: 617, width: 1625, height: 595 },
                    folderUri: uri_1.URI.parse('file:///home/user/workspaces/testing/customdata')
                }
            };
            assertEqualWindowsState(expected, windowsState, 'v1_31_folder');
            const v1_31_empty_window = ` {
			"openedWindows": [
			],
			"lastActiveWindow": {
				"backupPath": "C:\\\\Users\\\\Mike\\\\AppData\\\\Roaming\\\\Code\\\\Backups\\\\1549538599815",
				"uiState": {
					"mode": 0,
					"x": -8,
					"y": -8,
					"width": 2576,
					"height": 1344
				}
			}
		}`;
            windowsState = windowsStateStorage_1.restoreWindowsState(JSON.parse(v1_31_empty_window));
            expected = {
                openedWindows: [],
                lastActiveWindow: {
                    backupPath: 'C:\\Users\\Mike\\AppData\\Roaming\\Code\\Backups\\1549538599815',
                    uiState: { mode: 0 /* Maximized */, x: -8, y: -8, width: 2576, height: 1344 }
                }
            };
            assertEqualWindowsState(expected, windowsState, 'v1_31_empty_window');
        });
        test('open 1_32', () => {
            const v1_32_workspace = `{
			"openedWindows": [],
			"lastActiveWindow": {
				"workspaceIdentifier": {
					"id": "53b714b46ef1a2d4346568b4f591028c",
					"configURIPath": "file:///home/user/workspaces/testing/custom.code-workspace"
				},
				"backupPath": "/home/user/.config/code-oss-dev/Backups/53b714b46ef1a2d4346568b4f591028c",
				"uiState": {
					"mode": 0,
					"x": 0,
					"y": 27,
					"width": 2560,
					"height": 1364
				}
			}
		}`;
            let windowsState = windowsStateStorage_1.restoreWindowsState(JSON.parse(v1_32_workspace));
            let expected = {
                openedWindows: [],
                lastActiveWindow: {
                    backupPath: '/home/user/.config/code-oss-dev/Backups/53b714b46ef1a2d4346568b4f591028c',
                    uiState: { mode: 0 /* Maximized */, x: 0, y: 27, width: 2560, height: 1364 },
                    workspace: { id: '53b714b46ef1a2d4346568b4f591028c', configPath: uri_1.URI.parse('file:///home/user/workspaces/testing/custom.code-workspace') }
                }
            };
            assertEqualWindowsState(expected, windowsState, 'v1_32_workspace');
            const v1_32_folder = `{
			"openedWindows": [],
			"lastActiveWindow": {
				"folder": "file:///home/user/workspaces/testing/folding",
				"backupPath": "/home/user/.config/code-oss-dev/Backups/1daac1621c6c06f9e916ac8062e5a1b5",
				"uiState": {
					"mode": 1,
					"x": 625,
					"y": 263,
					"width": 1718,
					"height": 953
				}
			}
		}`;
            windowsState = windowsStateStorage_1.restoreWindowsState(JSON.parse(v1_32_folder));
            expected = {
                openedWindows: [],
                lastActiveWindow: {
                    backupPath: '/home/user/.config/code-oss-dev/Backups/1daac1621c6c06f9e916ac8062e5a1b5',
                    uiState: { mode: 1 /* Normal */, x: 625, y: 263, width: 1718, height: 953 },
                    folderUri: uri_1.URI.parse('file:///home/user/workspaces/testing/folding')
                }
            };
            assertEqualWindowsState(expected, windowsState, 'v1_32_folder');
            const v1_32_empty_window = ` {
			"openedWindows": [
			],
			"lastActiveWindow": {
				"backupPath": "/home/user/.config/code-oss-dev/Backups/1549539668998",
				"uiState": {
					"mode": 1,
					"x": 768,
					"y": 336,
					"width": 1024,
					"height": 768
				}
			}
		}`;
            windowsState = windowsStateStorage_1.restoreWindowsState(JSON.parse(v1_32_empty_window));
            expected = {
                openedWindows: [],
                lastActiveWindow: {
                    backupPath: '/home/user/.config/code-oss-dev/Backups/1549539668998',
                    uiState: { mode: 1 /* Normal */, x: 768, y: 336, width: 1024, height: 768 }
                }
            };
            assertEqualWindowsState(expected, windowsState, 'v1_32_empty_window');
        });
    });
});
//# sourceMappingURL=windowsStateStorage.test.js.map