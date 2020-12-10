/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define(["require", "exports", "vs/base/parts/storage/node/storage", "vs/base/parts/storage/common/storage", "vs/base/common/uuid", "vs/base/common/path", "os", "assert", "vs/base/node/pfs", "vs/base/common/async", "vs/base/common/event", "vs/base/common/platform"], function (require, exports, storage_1, storage_2, uuid_1, path_1, os_1, assert_1, pfs_1, async_1, event_1, platform_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    suite('Storage Library', () => {
        function uniqueStorageDir() {
            const id = uuid_1.generateUuid();
            return path_1.join(os_1.tmpdir(), 'vsctests', id, 'storage2', id);
        }
        test('basics', () => __awaiter(this, void 0, void 0, function* () {
            const storageDir = uniqueStorageDir();
            yield pfs_1.mkdirp(storageDir);
            const storage = new storage_2.Storage(new storage_1.SQLiteStorageDatabase(path_1.join(storageDir, 'storage.db')));
            yield storage.init();
            // Empty fallbacks
            assert_1.equal(storage.get('foo', 'bar'), 'bar');
            assert_1.equal(storage.getNumber('foo', 55), 55);
            assert_1.equal(storage.getBoolean('foo', true), true);
            let changes = new Set();
            storage.onDidChangeStorage(key => {
                changes.add(key);
            });
            // Simple updates
            const set1Promise = storage.set('bar', 'foo');
            const set2Promise = storage.set('barNumber', 55);
            const set3Promise = storage.set('barBoolean', true);
            assert_1.equal(storage.get('bar'), 'foo');
            assert_1.equal(storage.getNumber('barNumber'), 55);
            assert_1.equal(storage.getBoolean('barBoolean'), true);
            assert_1.equal(changes.size, 3);
            assert_1.ok(changes.has('bar'));
            assert_1.ok(changes.has('barNumber'));
            assert_1.ok(changes.has('barBoolean'));
            let setPromiseResolved = false;
            yield Promise.all([set1Promise, set2Promise, set3Promise]).then(() => setPromiseResolved = true);
            assert_1.equal(setPromiseResolved, true);
            changes = new Set();
            // Does not trigger events for same update values
            storage.set('bar', 'foo');
            storage.set('barNumber', 55);
            storage.set('barBoolean', true);
            assert_1.equal(changes.size, 0);
            // Simple deletes
            const delete1Promise = storage.delete('bar');
            const delete2Promise = storage.delete('barNumber');
            const delete3Promise = storage.delete('barBoolean');
            assert_1.ok(!storage.get('bar'));
            assert_1.ok(!storage.getNumber('barNumber'));
            assert_1.ok(!storage.getBoolean('barBoolean'));
            assert_1.equal(changes.size, 3);
            assert_1.ok(changes.has('bar'));
            assert_1.ok(changes.has('barNumber'));
            assert_1.ok(changes.has('barBoolean'));
            changes = new Set();
            // Does not trigger events for same delete values
            storage.delete('bar');
            storage.delete('barNumber');
            storage.delete('barBoolean');
            assert_1.equal(changes.size, 0);
            let deletePromiseResolved = false;
            yield Promise.all([delete1Promise, delete2Promise, delete3Promise]).then(() => deletePromiseResolved = true);
            assert_1.equal(deletePromiseResolved, true);
            yield storage.close();
            yield pfs_1.rimraf(storageDir, pfs_1.RimRafMode.MOVE);
        }));
        test('external changes', () => __awaiter(this, void 0, void 0, function* () {
            const storageDir = uniqueStorageDir();
            yield pfs_1.mkdirp(storageDir);
            class TestSQLiteStorageDatabase extends storage_1.SQLiteStorageDatabase {
                constructor() {
                    super(...arguments);
                    this._onDidChangeItemsExternal = new event_1.Emitter();
                }
                get onDidChangeItemsExternal() { return this._onDidChangeItemsExternal.event; }
                fireDidChangeItemsExternal(event) {
                    this._onDidChangeItemsExternal.fire(event);
                }
            }
            const database = new TestSQLiteStorageDatabase(path_1.join(storageDir, 'storage.db'));
            const storage = new storage_2.Storage(database);
            let changes = new Set();
            storage.onDidChangeStorage(key => {
                changes.add(key);
            });
            yield storage.init();
            yield storage.set('foo', 'bar');
            assert_1.ok(changes.has('foo'));
            changes.clear();
            // Nothing happens if changing to same value
            const change = new Map();
            change.set('foo', 'bar');
            database.fireDidChangeItemsExternal({ items: change });
            assert_1.equal(changes.size, 0);
            // Change is accepted if valid
            change.set('foo', 'bar1');
            database.fireDidChangeItemsExternal({ items: change });
            assert_1.ok(changes.has('foo'));
            assert_1.equal(storage.get('foo'), 'bar1');
            changes.clear();
            // Delete is accepted
            change.set('foo', undefined);
            database.fireDidChangeItemsExternal({ items: change });
            assert_1.ok(changes.has('foo'));
            assert_1.equal(storage.get('foo', null), null);
            changes.clear();
            // Nothing happens if changing to same value
            change.set('foo', undefined);
            database.fireDidChangeItemsExternal({ items: change });
            assert_1.equal(changes.size, 0);
            yield storage.close();
            yield pfs_1.rimraf(storageDir, pfs_1.RimRafMode.MOVE);
        }));
        test('close flushes data', () => __awaiter(this, void 0, void 0, function* () {
            const storageDir = uniqueStorageDir();
            yield pfs_1.mkdirp(storageDir);
            let storage = new storage_2.Storage(new storage_1.SQLiteStorageDatabase(path_1.join(storageDir, 'storage.db')));
            yield storage.init();
            const set1Promise = storage.set('foo', 'bar');
            const set2Promise = storage.set('bar', 'foo');
            assert_1.equal(storage.get('foo'), 'bar');
            assert_1.equal(storage.get('bar'), 'foo');
            let setPromiseResolved = false;
            Promise.all([set1Promise, set2Promise]).then(() => setPromiseResolved = true);
            yield storage.close();
            assert_1.equal(setPromiseResolved, true);
            storage = new storage_2.Storage(new storage_1.SQLiteStorageDatabase(path_1.join(storageDir, 'storage.db')));
            yield storage.init();
            assert_1.equal(storage.get('foo'), 'bar');
            assert_1.equal(storage.get('bar'), 'foo');
            yield storage.close();
            storage = new storage_2.Storage(new storage_1.SQLiteStorageDatabase(path_1.join(storageDir, 'storage.db')));
            yield storage.init();
            const delete1Promise = storage.delete('foo');
            const delete2Promise = storage.delete('bar');
            assert_1.ok(!storage.get('foo'));
            assert_1.ok(!storage.get('bar'));
            let deletePromiseResolved = false;
            Promise.all([delete1Promise, delete2Promise]).then(() => deletePromiseResolved = true);
            yield storage.close();
            assert_1.equal(deletePromiseResolved, true);
            storage = new storage_2.Storage(new storage_1.SQLiteStorageDatabase(path_1.join(storageDir, 'storage.db')));
            yield storage.init();
            assert_1.ok(!storage.get('foo'));
            assert_1.ok(!storage.get('bar'));
            yield storage.close();
            yield pfs_1.rimraf(storageDir, pfs_1.RimRafMode.MOVE);
        }));
        test('conflicting updates', () => __awaiter(this, void 0, void 0, function* () {
            const storageDir = uniqueStorageDir();
            yield pfs_1.mkdirp(storageDir);
            let storage = new storage_2.Storage(new storage_1.SQLiteStorageDatabase(path_1.join(storageDir, 'storage.db')));
            yield storage.init();
            let changes = new Set();
            storage.onDidChangeStorage(key => {
                changes.add(key);
            });
            const set1Promise = storage.set('foo', 'bar1');
            const set2Promise = storage.set('foo', 'bar2');
            const set3Promise = storage.set('foo', 'bar3');
            assert_1.equal(storage.get('foo'), 'bar3');
            assert_1.equal(changes.size, 1);
            assert_1.ok(changes.has('foo'));
            let setPromiseResolved = false;
            yield Promise.all([set1Promise, set2Promise, set3Promise]).then(() => setPromiseResolved = true);
            assert_1.ok(setPromiseResolved);
            changes = new Set();
            const set4Promise = storage.set('bar', 'foo');
            const delete1Promise = storage.delete('bar');
            assert_1.ok(!storage.get('bar'));
            assert_1.equal(changes.size, 1);
            assert_1.ok(changes.has('bar'));
            let setAndDeletePromiseResolved = false;
            yield Promise.all([set4Promise, delete1Promise]).then(() => setAndDeletePromiseResolved = true);
            assert_1.ok(setAndDeletePromiseResolved);
            yield storage.close();
            yield pfs_1.rimraf(storageDir, pfs_1.RimRafMode.MOVE);
        }));
        test('corrupt DB recovers', () => __awaiter(this, void 0, void 0, function* () {
            const storageDir = uniqueStorageDir();
            yield pfs_1.mkdirp(storageDir);
            const storageFile = path_1.join(storageDir, 'storage.db');
            let storage = new storage_2.Storage(new storage_1.SQLiteStorageDatabase(storageFile));
            yield storage.init();
            yield storage.set('bar', 'foo');
            yield pfs_1.writeFile(storageFile, 'This is a broken DB');
            yield storage.set('foo', 'bar');
            assert_1.equal(storage.get('bar'), 'foo');
            assert_1.equal(storage.get('foo'), 'bar');
            yield storage.close();
            storage = new storage_2.Storage(new storage_1.SQLiteStorageDatabase(storageFile));
            yield storage.init();
            assert_1.equal(storage.get('bar'), 'foo');
            assert_1.equal(storage.get('foo'), 'bar');
            yield storage.close();
            yield pfs_1.rimraf(storageDir, pfs_1.RimRafMode.MOVE);
        }));
    });
    suite('SQLite Storage Library', () => {
        function uniqueStorageDir() {
            const id = uuid_1.generateUuid();
            return path_1.join(os_1.tmpdir(), 'vsctests', id, 'storage', id);
        }
        function toSet(elements) {
            const set = new Set();
            elements.forEach(element => set.add(element));
            return set;
        }
        function testDBBasics(path, logError) {
            return __awaiter(this, void 0, void 0, function* () {
                let options;
                if (logError) {
                    options = {
                        logging: {
                            logError
                        }
                    };
                }
                const storage = new storage_1.SQLiteStorageDatabase(path, options);
                const items = new Map();
                items.set('foo', 'bar');
                items.set('some/foo/path', 'some/bar/path');
                items.set(JSON.stringify({ foo: 'bar' }), JSON.stringify({ bar: 'foo' }));
                let storedItems = yield storage.getItems();
                assert_1.equal(storedItems.size, 0);
                yield storage.updateItems({ insert: items });
                storedItems = yield storage.getItems();
                assert_1.equal(storedItems.size, items.size);
                assert_1.equal(storedItems.get('foo'), 'bar');
                assert_1.equal(storedItems.get('some/foo/path'), 'some/bar/path');
                assert_1.equal(storedItems.get(JSON.stringify({ foo: 'bar' })), JSON.stringify({ bar: 'foo' }));
                yield storage.updateItems({ delete: toSet(['foo']) });
                storedItems = yield storage.getItems();
                assert_1.equal(storedItems.size, items.size - 1);
                assert_1.ok(!storedItems.has('foo'));
                assert_1.equal(storedItems.get('some/foo/path'), 'some/bar/path');
                assert_1.equal(storedItems.get(JSON.stringify({ foo: 'bar' })), JSON.stringify({ bar: 'foo' }));
                yield storage.updateItems({ insert: items });
                storedItems = yield storage.getItems();
                assert_1.equal(storedItems.size, items.size);
                assert_1.equal(storedItems.get('foo'), 'bar');
                assert_1.equal(storedItems.get('some/foo/path'), 'some/bar/path');
                assert_1.equal(storedItems.get(JSON.stringify({ foo: 'bar' })), JSON.stringify({ bar: 'foo' }));
                const itemsChange = new Map();
                itemsChange.set('foo', 'otherbar');
                yield storage.updateItems({ insert: itemsChange });
                storedItems = yield storage.getItems();
                assert_1.equal(storedItems.get('foo'), 'otherbar');
                yield storage.updateItems({ delete: toSet(['foo', 'bar', 'some/foo/path', JSON.stringify({ foo: 'bar' })]) });
                storedItems = yield storage.getItems();
                assert_1.equal(storedItems.size, 0);
                yield storage.updateItems({ insert: items, delete: toSet(['foo', 'some/foo/path', 'other']) });
                storedItems = yield storage.getItems();
                assert_1.equal(storedItems.size, 1);
                assert_1.equal(storedItems.get(JSON.stringify({ foo: 'bar' })), JSON.stringify({ bar: 'foo' }));
                yield storage.updateItems({ delete: toSet([JSON.stringify({ foo: 'bar' })]) });
                storedItems = yield storage.getItems();
                assert_1.equal(storedItems.size, 0);
                let recoveryCalled = false;
                yield storage.close(() => {
                    recoveryCalled = true;
                    return new Map();
                });
                assert_1.equal(recoveryCalled, false);
            });
        }
        test('basics', () => __awaiter(this, void 0, void 0, function* () {
            const storageDir = uniqueStorageDir();
            yield pfs_1.mkdirp(storageDir);
            yield testDBBasics(path_1.join(storageDir, 'storage.db'));
            yield pfs_1.rimraf(storageDir, pfs_1.RimRafMode.MOVE);
        }));
        test('basics (open multiple times)', () => __awaiter(this, void 0, void 0, function* () {
            const storageDir = uniqueStorageDir();
            yield pfs_1.mkdirp(storageDir);
            yield testDBBasics(path_1.join(storageDir, 'storage.db'));
            yield testDBBasics(path_1.join(storageDir, 'storage.db'));
            yield pfs_1.rimraf(storageDir, pfs_1.RimRafMode.MOVE);
        }));
        test('basics (corrupt DB falls back to empty DB)', () => __awaiter(this, void 0, void 0, function* () {
            const storageDir = uniqueStorageDir();
            yield pfs_1.mkdirp(storageDir);
            const corruptDBPath = path_1.join(storageDir, 'broken.db');
            yield pfs_1.writeFile(corruptDBPath, 'This is a broken DB');
            let expectedError;
            yield testDBBasics(corruptDBPath, error => {
                expectedError = error;
            });
            assert_1.ok(expectedError);
            yield pfs_1.rimraf(storageDir, pfs_1.RimRafMode.MOVE);
        }));
        test('basics (corrupt DB restores from previous backup)', () => __awaiter(this, void 0, void 0, function* () {
            const storageDir = uniqueStorageDir();
            yield pfs_1.mkdirp(storageDir);
            const storagePath = path_1.join(storageDir, 'storage.db');
            let storage = new storage_1.SQLiteStorageDatabase(storagePath);
            const items = new Map();
            items.set('foo', 'bar');
            items.set('some/foo/path', 'some/bar/path');
            items.set(JSON.stringify({ foo: 'bar' }), JSON.stringify({ bar: 'foo' }));
            yield storage.updateItems({ insert: items });
            yield storage.close();
            yield pfs_1.writeFile(storagePath, 'This is now a broken DB');
            storage = new storage_1.SQLiteStorageDatabase(storagePath);
            const storedItems = yield storage.getItems();
            assert_1.equal(storedItems.size, items.size);
            assert_1.equal(storedItems.get('foo'), 'bar');
            assert_1.equal(storedItems.get('some/foo/path'), 'some/bar/path');
            assert_1.equal(storedItems.get(JSON.stringify({ foo: 'bar' })), JSON.stringify({ bar: 'foo' }));
            let recoveryCalled = false;
            yield storage.close(() => {
                recoveryCalled = true;
                return new Map();
            });
            assert_1.equal(recoveryCalled, false);
            yield pfs_1.rimraf(storageDir, pfs_1.RimRafMode.MOVE);
        }));
        test('basics (corrupt DB falls back to empty DB if backup is corrupt)', () => __awaiter(this, void 0, void 0, function* () {
            const storageDir = uniqueStorageDir();
            yield pfs_1.mkdirp(storageDir);
            const storagePath = path_1.join(storageDir, 'storage.db');
            let storage = new storage_1.SQLiteStorageDatabase(storagePath);
            const items = new Map();
            items.set('foo', 'bar');
            items.set('some/foo/path', 'some/bar/path');
            items.set(JSON.stringify({ foo: 'bar' }), JSON.stringify({ bar: 'foo' }));
            yield storage.updateItems({ insert: items });
            yield storage.close();
            yield pfs_1.writeFile(storagePath, 'This is now a broken DB');
            yield pfs_1.writeFile(`${storagePath}.backup`, 'This is now also a broken DB');
            storage = new storage_1.SQLiteStorageDatabase(storagePath);
            const storedItems = yield storage.getItems();
            assert_1.equal(storedItems.size, 0);
            yield testDBBasics(storagePath);
            yield pfs_1.rimraf(storageDir, pfs_1.RimRafMode.MOVE);
        }));
        test('basics (DB that becomes corrupt during runtime stores all state from cache on close)', () => __awaiter(this, void 0, void 0, function* () {
            if (platform_1.isWindows) {
                yield Promise.resolve(); // Windows will fail to write to open DB due to locking
                return;
            }
            const storageDir = uniqueStorageDir();
            yield pfs_1.mkdirp(storageDir);
            const storagePath = path_1.join(storageDir, 'storage.db');
            let storage = new storage_1.SQLiteStorageDatabase(storagePath);
            const items = new Map();
            items.set('foo', 'bar');
            items.set('some/foo/path', 'some/bar/path');
            items.set(JSON.stringify({ foo: 'bar' }), JSON.stringify({ bar: 'foo' }));
            yield storage.updateItems({ insert: items });
            yield storage.close();
            const backupPath = `${storagePath}.backup`;
            assert_1.equal(yield pfs_1.exists(backupPath), true);
            storage = new storage_1.SQLiteStorageDatabase(storagePath);
            yield storage.getItems();
            yield pfs_1.writeFile(storagePath, 'This is now a broken DB');
            // we still need to trigger a check to the DB so that we get to know that
            // the DB is corrupt. We have no extra code on shutdown that checks for the
            // health of the DB. This is an optimization to not perform too many tasks
            // on shutdown.
            yield storage.checkIntegrity(true).then(null, error => { } /* error is expected here but we do not want to fail */);
            yield pfs_1.unlink(backupPath); // also test that the recovery DB is backed up properly
            let recoveryCalled = false;
            yield storage.close(() => {
                recoveryCalled = true;
                return items;
            });
            assert_1.equal(recoveryCalled, true);
            assert_1.equal(yield pfs_1.exists(backupPath), true);
            storage = new storage_1.SQLiteStorageDatabase(storagePath);
            const storedItems = yield storage.getItems();
            assert_1.equal(storedItems.size, items.size);
            assert_1.equal(storedItems.get('foo'), 'bar');
            assert_1.equal(storedItems.get('some/foo/path'), 'some/bar/path');
            assert_1.equal(storedItems.get(JSON.stringify({ foo: 'bar' })), JSON.stringify({ bar: 'foo' }));
            recoveryCalled = false;
            yield storage.close(() => {
                recoveryCalled = true;
                return new Map();
            });
            assert_1.equal(recoveryCalled, false);
            yield pfs_1.rimraf(storageDir, pfs_1.RimRafMode.MOVE);
        }));
        test('real world example', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const storageDir = uniqueStorageDir();
                yield pfs_1.mkdirp(storageDir);
                let storage = new storage_1.SQLiteStorageDatabase(path_1.join(storageDir, 'storage.db'));
                const items1 = new Map();
                items1.set('colorthemedata', '{"id":"vs vscode-theme-defaults-themes-light_plus-json","label":"Light+ (default light)","settingsId":"Default Light+","selector":"vs.vscode-theme-defaults-themes-light_plus-json","themeTokenColors":[{"settings":{"foreground":"#000000ff","background":"#ffffffff"}},{"scope":["meta.embedded","source.groovy.embedded"],"settings":{"foreground":"#000000ff"}},{"scope":"emphasis","settings":{"fontStyle":"italic"}},{"scope":"strong","settings":{"fontStyle":"bold"}},{"scope":"meta.diff.header","settings":{"foreground":"#000080"}},{"scope":"comment","settings":{"foreground":"#008000"}},{"scope":"constant.language","settings":{"foreground":"#0000ff"}},{"scope":["constant.numeric"],"settings":{"foreground":"#09885a"}},{"scope":"constant.regexp","settings":{"foreground":"#811f3f"}},{"name":"css tags in selectors, xml tags","scope":"entity.name.tag","settings":{"foreground":"#800000"}},{"scope":"entity.name.selector","settings":{"foreground":"#800000"}},{"scope":"entity.other.attribute-name","settings":{"foreground":"#ff0000"}},{"scope":["entity.other.attribute-name.class.css","entity.other.attribute-name.class.mixin.css","entity.other.attribute-name.id.css","entity.other.attribute-name.parent-selector.css","entity.other.attribute-name.pseudo-class.css","entity.other.attribute-name.pseudo-element.css","source.css.less entity.other.attribute-name.id","entity.other.attribute-name.attribute.scss","entity.other.attribute-name.scss"],"settings":{"foreground":"#800000"}},{"scope":"invalid","settings":{"foreground":"#cd3131"}},{"scope":"markup.underline","settings":{"fontStyle":"underline"}},{"scope":"markup.bold","settings":{"fontStyle":"bold","foreground":"#000080"}},{"scope":"markup.heading","settings":{"fontStyle":"bold","foreground":"#800000"}},{"scope":"markup.italic","settings":{"fontStyle":"italic"}},{"scope":"markup.inserted","settings":{"foreground":"#09885a"}},{"scope":"markup.deleted","settings":{"foreground":"#a31515"}},{"scope":"markup.changed","settings":{"foreground":"#0451a5"}},{"scope":["punctuation.definition.quote.begin.markdown","punctuation.definition.list.begin.markdown"],"settings":{"foreground":"#0451a5"}},{"scope":"markup.inline.raw","settings":{"foreground":"#800000"}},{"name":"brackets of XML/HTML tags","scope":"punctuation.definition.tag","settings":{"foreground":"#800000"}},{"scope":"meta.preprocessor","settings":{"foreground":"#0000ff"}},{"scope":"meta.preprocessor.string","settings":{"foreground":"#a31515"}},{"scope":"meta.preprocessor.numeric","settings":{"foreground":"#09885a"}},{"scope":"meta.structure.dictionary.key.python","settings":{"foreground":"#0451a5"}},{"scope":"storage","settings":{"foreground":"#0000ff"}},{"scope":"storage.type","settings":{"foreground":"#0000ff"}},{"scope":"storage.modifier","settings":{"foreground":"#0000ff"}},{"scope":"string","settings":{"foreground":"#a31515"}},{"scope":["string.comment.buffered.block.pug","string.quoted.pug","string.interpolated.pug","string.unquoted.plain.in.yaml","string.unquoted.plain.out.yaml","string.unquoted.block.yaml","string.quoted.single.yaml","string.quoted.double.xml","string.quoted.single.xml","string.unquoted.cdata.xml","string.quoted.double.html","string.quoted.single.html","string.unquoted.html","string.quoted.single.handlebars","string.quoted.double.handlebars"],"settings":{"foreground":"#0000ff"}},{"scope":"string.regexp","settings":{"foreground":"#811f3f"}},{"name":"String interpolation","scope":["punctuation.definition.template-expression.begin","punctuation.definition.template-expression.end","punctuation.section.embedded"],"settings":{"foreground":"#0000ff"}},{"name":"Reset JavaScript string interpolation expression","scope":["meta.template.expression"],"settings":{"foreground":"#000000"}},{"scope":["support.constant.property-value","support.constant.font-name","support.constant.media-type","support.constant.media","constant.other.color.rgb-value","constant.other.rgb-value","support.constant.color"],"settings":{"foreground":"#0451a5"}},{"scope":["support.type.vendored.property-name","support.type.property-name","variable.css","variable.scss","variable.other.less","source.coffee.embedded"],"settings":{"foreground":"#ff0000"}},{"scope":["support.type.property-name.json"],"settings":{"foreground":"#0451a5"}},{"scope":"keyword","settings":{"foreground":"#0000ff"}},{"scope":"keyword.control","settings":{"foreground":"#0000ff"}},{"scope":"keyword.operator","settings":{"foreground":"#000000"}},{"scope":["keyword.operator.new","keyword.operator.expression","keyword.operator.cast","keyword.operator.sizeof","keyword.operator.instanceof","keyword.operator.logical.python"],"settings":{"foreground":"#0000ff"}},{"scope":"keyword.other.unit","settings":{"foreground":"#09885a"}},{"scope":["punctuation.section.embedded.begin.php","punctuation.section.embedded.end.php"],"settings":{"foreground":"#800000"}},{"scope":"support.function.git-rebase","settings":{"foreground":"#0451a5"}},{"scope":"constant.sha.git-rebase","settings":{"foreground":"#09885a"}},{"name":"coloring of the Java import and package identifiers","scope":["storage.modifier.import.java","variable.language.wildcard.java","storage.modifier.package.java"],"settings":{"foreground":"#000000"}},{"name":"this.self","scope":"variable.language","settings":{"foreground":"#0000ff"}},{"name":"Function declarations","scope":["entity.name.function","support.function","support.constant.handlebars"],"settings":{"foreground":"#795E26"}},{"name":"Types declaration and references","scope":["meta.return-type","support.class","support.type","entity.name.type","entity.name.class","storage.type.numeric.go","storage.type.byte.go","storage.type.boolean.go","storage.type.string.go","storage.type.uintptr.go","storage.type.error.go","storage.type.rune.go","storage.type.cs","storage.type.generic.cs","storage.type.modifier.cs","storage.type.variable.cs","storage.type.annotation.java","storage.type.generic.java","storage.type.java","storage.type.object.array.java","storage.type.primitive.array.java","storage.type.primitive.java","storage.type.token.java","storage.type.groovy","storage.type.annotation.groovy","storage.type.parameters.groovy","storage.type.generic.groovy","storage.type.object.array.groovy","storage.type.primitive.array.groovy","storage.type.primitive.groovy"],"settings":{"foreground":"#267f99"}},{"name":"Types declaration and references, TS grammar specific","scope":["meta.type.cast.expr","meta.type.new.expr","support.constant.math","support.constant.dom","support.constant.json","entity.other.inherited-class"],"settings":{"foreground":"#267f99"}},{"name":"Control flow keywords","scope":"keyword.control","settings":{"foreground":"#AF00DB"}},{"name":"Variable and parameter name","scope":["variable","meta.definition.variable.name","support.variable","entity.name.variable"],"settings":{"foreground":"#001080"}},{"name":"Object keys, TS grammar specific","scope":["meta.object-literal.key"],"settings":{"foreground":"#001080"}},{"name":"CSS property value","scope":["support.constant.property-value","support.constant.font-name","support.constant.media-type","support.constant.media","constant.other.color.rgb-value","constant.other.rgb-value","support.constant.color"],"settings":{"foreground":"#0451a5"}},{"name":"Regular expression groups","scope":["punctuation.definition.group.regexp","punctuation.definition.group.assertion.regexp","punctuation.definition.character-class.regexp","punctuation.character.set.begin.regexp","punctuation.character.set.end.regexp","keyword.operator.negation.regexp","support.other.parenthesis.regexp"],"settings":{"foreground":"#d16969"}},{"scope":["constant.character.character-class.regexp","constant.other.character-class.set.regexp","constant.other.character-class.regexp","constant.character.set.regexp"],"settings":{"foreground":"#811f3f"}},{"scope":"keyword.operator.quantifier.regexp","settings":{"foreground":"#000000"}},{"scope":["keyword.operator.or.regexp","keyword.control.anchor.regexp"],"settings":{"foreground":"#ff0000"}},{"scope":"constant.character","settings":{"foreground":"#0000ff"}},{"scope":"constant.character.escape","settings":{"foreground":"#ff0000"}},{"scope":"token.info-token","settings":{"foreground":"#316bcd"}},{"scope":"token.warn-token","settings":{"foreground":"#cd9731"}},{"scope":"token.error-token","settings":{"foreground":"#cd3131"}},{"scope":"token.debug-token","settings":{"foreground":"#800080"}}],"extensionData":{"extensionId":"vscode.theme-defaults","extensionPublisher":"vscode","extensionName":"theme-defaults","extensionIsBuiltin":true},"colorMap":{"editor.background":"#ffffff","editor.foreground":"#000000","editor.inactiveSelectionBackground":"#e5ebf1","editorIndentGuide.background":"#d3d3d3","editorIndentGuide.activeBackground":"#939393","editor.selectionHighlightBackground":"#add6ff4d","editorSuggestWidget.background":"#f3f3f3","activityBarBadge.background":"#007acc","sideBarTitle.foreground":"#6f6f6f","list.hoverBackground":"#e8e8e8","input.placeholderForeground":"#767676","settings.textInputBorder":"#cecece","settings.numberInputBorder":"#cecece"}}');
                items1.set('commandpalette.mru.cache', '{"usesLRU":true,"entries":[{"key":"revealFileInOS","value":3},{"key":"extension.openInGitHub","value":4},{"key":"workbench.extensions.action.openExtensionsFolder","value":11},{"key":"workbench.action.showRuntimeExtensions","value":14},{"key":"workbench.action.toggleTabsVisibility","value":15},{"key":"extension.liveServerPreview.open","value":16},{"key":"workbench.action.openIssueReporter","value":18},{"key":"workbench.action.openProcessExplorer","value":19},{"key":"workbench.action.toggleSharedProcess","value":20},{"key":"workbench.action.configureLocale","value":21},{"key":"workbench.action.appPerf","value":22},{"key":"workbench.action.reportPerformanceIssueUsingReporter","value":23},{"key":"workbench.action.openGlobalKeybindings","value":25},{"key":"workbench.action.output.toggleOutput","value":27},{"key":"extension.sayHello","value":29}]}');
                items1.set('cpp.1.lastsessiondate', 'Fri Oct 05 2018');
                items1.set('debug.actionswidgetposition', '0.6880952380952381');
                const items2 = new Map();
                items2.set('workbench.editors.files.textfileeditor', '{"textEditorViewState":[["file:///Users/dummy/Documents/ticino-playground/play.htm",{"0":{"cursorState":[{"inSelectionMode":false,"selectionStart":{"lineNumber":6,"column":16},"position":{"lineNumber":6,"column":16}}],"viewState":{"scrollLeft":0,"firstPosition":{"lineNumber":1,"column":1},"firstPositionDeltaTop":0},"contributionsState":{"editor.contrib.folding":{},"editor.contrib.wordHighlighter":false}}}],["file:///Users/dummy/Documents/ticino-playground/nakefile.js",{"0":{"cursorState":[{"inSelectionMode":false,"selectionStart":{"lineNumber":7,"column":81},"position":{"lineNumber":7,"column":81}}],"viewState":{"scrollLeft":0,"firstPosition":{"lineNumber":1,"column":1},"firstPositionDeltaTop":20},"contributionsState":{"editor.contrib.folding":{},"editor.contrib.wordHighlighter":false}}}],["file:///Users/dummy/Desktop/vscode2/.gitattributes",{"0":{"cursorState":[{"inSelectionMode":false,"selectionStart":{"lineNumber":9,"column":12},"position":{"lineNumber":9,"column":12}}],"viewState":{"scrollLeft":0,"firstPosition":{"lineNumber":1,"column":1},"firstPositionDeltaTop":20},"contributionsState":{"editor.contrib.folding":{},"editor.contrib.wordHighlighter":false}}}],["file:///Users/dummy/Desktop/vscode2/src/vs/workbench/contrib/search/browser/openAnythingHandler.ts",{"0":{"cursorState":[{"inSelectionMode":false,"selectionStart":{"lineNumber":1,"column":1},"position":{"lineNumber":1,"column":1}}],"viewState":{"scrollLeft":0,"firstPosition":{"lineNumber":1,"column":1},"firstPositionDeltaTop":0},"contributionsState":{"editor.contrib.folding":{},"editor.contrib.wordHighlighter":false}}}]]}');
                const items3 = new Map();
                items3.set('nps/iscandidate', 'false');
                items3.set('telemetry.instanceid', 'd52bfcd4-4be6-476b-a38f-d44c717c41d6');
                items3.set('workbench.activity.pinnedviewlets', '[{"id":"workbench.view.explorer","pinned":true,"order":0,"visible":true},{"id":"workbench.view.search","pinned":true,"order":1,"visible":true},{"id":"workbench.view.scm","pinned":true,"order":2,"visible":true},{"id":"workbench.view.debug","pinned":true,"order":3,"visible":true},{"id":"workbench.view.extensions","pinned":true,"order":4,"visible":true},{"id":"workbench.view.extension.gitlens","pinned":true,"order":7,"visible":true},{"id":"workbench.view.extension.test","pinned":false,"visible":false}]');
                items3.set('workbench.panel.height', '419');
                items3.set('very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.very.long.key.', 'is long');
                let storedItems = yield storage.getItems();
                assert_1.equal(storedItems.size, 0);
                yield Promise.all([
                    yield storage.updateItems({ insert: items1 }),
                    yield storage.updateItems({ insert: items2 }),
                    yield storage.updateItems({ insert: items3 })
                ]);
                assert_1.equal(yield storage.checkIntegrity(true), 'ok');
                assert_1.equal(yield storage.checkIntegrity(false), 'ok');
                storedItems = yield storage.getItems();
                assert_1.equal(storedItems.size, items1.size + items2.size + items3.size);
                const items1Keys = [];
                items1.forEach((value, key) => {
                    items1Keys.push(key);
                    assert_1.equal(storedItems.get(key), value);
                });
                const items2Keys = [];
                items2.forEach((value, key) => {
                    items2Keys.push(key);
                    assert_1.equal(storedItems.get(key), value);
                });
                const items3Keys = [];
                items3.forEach((value, key) => {
                    items3Keys.push(key);
                    assert_1.equal(storedItems.get(key), value);
                });
                yield Promise.all([
                    yield storage.updateItems({ delete: toSet(items1Keys) }),
                    yield storage.updateItems({ delete: toSet(items2Keys) }),
                    yield storage.updateItems({ delete: toSet(items3Keys) })
                ]);
                storedItems = yield storage.getItems();
                assert_1.equal(storedItems.size, 0);
                yield Promise.all([
                    yield storage.updateItems({ insert: items1 }),
                    yield storage.getItems(),
                    yield storage.updateItems({ insert: items2 }),
                    yield storage.getItems(),
                    yield storage.updateItems({ insert: items3 }),
                    yield storage.getItems(),
                ]);
                storedItems = yield storage.getItems();
                assert_1.equal(storedItems.size, items1.size + items2.size + items3.size);
                yield storage.close();
                storage = new storage_1.SQLiteStorageDatabase(path_1.join(storageDir, 'storage.db'));
                storedItems = yield storage.getItems();
                assert_1.equal(storedItems.size, items1.size + items2.size + items3.size);
                yield storage.close();
                yield pfs_1.rimraf(storageDir, pfs_1.RimRafMode.MOVE);
            });
        });
        test('very large item value', function () {
            return __awaiter(this, void 0, void 0, function* () {
                this.timeout(20000);
                const storageDir = uniqueStorageDir();
                yield pfs_1.mkdirp(storageDir);
                let storage = new storage_1.SQLiteStorageDatabase(path_1.join(storageDir, 'storage.db'));
                const items = new Map();
                items.set('colorthemedata', '{"id":"vs vscode-theme-defaults-themes-light_plus-json","label":"Light+ (default light)","settingsId":"Default Light+","selector":"vs.vscode-theme-defaults-themes-light_plus-json","themeTokenColors":[{"settings":{"foreground":"#000000ff","background":"#ffffffff"}},{"scope":["meta.embedded","source.groovy.embedded"],"settings":{"foreground":"#000000ff"}},{"scope":"emphasis","settings":{"fontStyle":"italic"}},{"scope":"strong","settings":{"fontStyle":"bold"}},{"scope":"meta.diff.header","settings":{"foreground":"#000080"}},{"scope":"comment","settings":{"foreground":"#008000"}},{"scope":"constant.language","settings":{"foreground":"#0000ff"}},{"scope":["constant.numeric"],"settings":{"foreground":"#09885a"}},{"scope":"constant.regexp","settings":{"foreground":"#811f3f"}},{"name":"css tags in selectors, xml tags","scope":"entity.name.tag","settings":{"foreground":"#800000"}},{"scope":"entity.name.selector","settings":{"foreground":"#800000"}},{"scope":"entity.other.attribute-name","settings":{"foreground":"#ff0000"}},{"scope":["entity.other.attribute-name.class.css","entity.other.attribute-name.class.mixin.css","entity.other.attribute-name.id.css","entity.other.attribute-name.parent-selector.css","entity.other.attribute-name.pseudo-class.css","entity.other.attribute-name.pseudo-element.css","source.css.less entity.other.attribute-name.id","entity.other.attribute-name.attribute.scss","entity.other.attribute-name.scss"],"settings":{"foreground":"#800000"}},{"scope":"invalid","settings":{"foreground":"#cd3131"}},{"scope":"markup.underline","settings":{"fontStyle":"underline"}},{"scope":"markup.bold","settings":{"fontStyle":"bold","foreground":"#000080"}},{"scope":"markup.heading","settings":{"fontStyle":"bold","foreground":"#800000"}},{"scope":"markup.italic","settings":{"fontStyle":"italic"}},{"scope":"markup.inserted","settings":{"foreground":"#09885a"}},{"scope":"markup.deleted","settings":{"foreground":"#a31515"}},{"scope":"markup.changed","settings":{"foreground":"#0451a5"}},{"scope":["punctuation.definition.quote.begin.markdown","punctuation.definition.list.begin.markdown"],"settings":{"foreground":"#0451a5"}},{"scope":"markup.inline.raw","settings":{"foreground":"#800000"}},{"name":"brackets of XML/HTML tags","scope":"punctuation.definition.tag","settings":{"foreground":"#800000"}},{"scope":"meta.preprocessor","settings":{"foreground":"#0000ff"}},{"scope":"meta.preprocessor.string","settings":{"foreground":"#a31515"}},{"scope":"meta.preprocessor.numeric","settings":{"foreground":"#09885a"}},{"scope":"meta.structure.dictionary.key.python","settings":{"foreground":"#0451a5"}},{"scope":"storage","settings":{"foreground":"#0000ff"}},{"scope":"storage.type","settings":{"foreground":"#0000ff"}},{"scope":"storage.modifier","settings":{"foreground":"#0000ff"}},{"scope":"string","settings":{"foreground":"#a31515"}},{"scope":["string.comment.buffered.block.pug","string.quoted.pug","string.interpolated.pug","string.unquoted.plain.in.yaml","string.unquoted.plain.out.yaml","string.unquoted.block.yaml","string.quoted.single.yaml","string.quoted.double.xml","string.quoted.single.xml","string.unquoted.cdata.xml","string.quoted.double.html","string.quoted.single.html","string.unquoted.html","string.quoted.single.handlebars","string.quoted.double.handlebars"],"settings":{"foreground":"#0000ff"}},{"scope":"string.regexp","settings":{"foreground":"#811f3f"}},{"name":"String interpolation","scope":["punctuation.definition.template-expression.begin","punctuation.definition.template-expression.end","punctuation.section.embedded"],"settings":{"foreground":"#0000ff"}},{"name":"Reset JavaScript string interpolation expression","scope":["meta.template.expression"],"settings":{"foreground":"#000000"}},{"scope":["support.constant.property-value","support.constant.font-name","support.constant.media-type","support.constant.media","constant.other.color.rgb-value","constant.other.rgb-value","support.constant.color"],"settings":{"foreground":"#0451a5"}},{"scope":["support.type.vendored.property-name","support.type.property-name","variable.css","variable.scss","variable.other.less","source.coffee.embedded"],"settings":{"foreground":"#ff0000"}},{"scope":["support.type.property-name.json"],"settings":{"foreground":"#0451a5"}},{"scope":"keyword","settings":{"foreground":"#0000ff"}},{"scope":"keyword.control","settings":{"foreground":"#0000ff"}},{"scope":"keyword.operator","settings":{"foreground":"#000000"}},{"scope":["keyword.operator.new","keyword.operator.expression","keyword.operator.cast","keyword.operator.sizeof","keyword.operator.instanceof","keyword.operator.logical.python"],"settings":{"foreground":"#0000ff"}},{"scope":"keyword.other.unit","settings":{"foreground":"#09885a"}},{"scope":["punctuation.section.embedded.begin.php","punctuation.section.embedded.end.php"],"settings":{"foreground":"#800000"}},{"scope":"support.function.git-rebase","settings":{"foreground":"#0451a5"}},{"scope":"constant.sha.git-rebase","settings":{"foreground":"#09885a"}},{"name":"coloring of the Java import and package identifiers","scope":["storage.modifier.import.java","variable.language.wildcard.java","storage.modifier.package.java"],"settings":{"foreground":"#000000"}},{"name":"this.self","scope":"variable.language","settings":{"foreground":"#0000ff"}},{"name":"Function declarations","scope":["entity.name.function","support.function","support.constant.handlebars"],"settings":{"foreground":"#795E26"}},{"name":"Types declaration and references","scope":["meta.return-type","support.class","support.type","entity.name.type","entity.name.class","storage.type.numeric.go","storage.type.byte.go","storage.type.boolean.go","storage.type.string.go","storage.type.uintptr.go","storage.type.error.go","storage.type.rune.go","storage.type.cs","storage.type.generic.cs","storage.type.modifier.cs","storage.type.variable.cs","storage.type.annotation.java","storage.type.generic.java","storage.type.java","storage.type.object.array.java","storage.type.primitive.array.java","storage.type.primitive.java","storage.type.token.java","storage.type.groovy","storage.type.annotation.groovy","storage.type.parameters.groovy","storage.type.generic.groovy","storage.type.object.array.groovy","storage.type.primitive.array.groovy","storage.type.primitive.groovy"],"settings":{"foreground":"#267f99"}},{"name":"Types declaration and references, TS grammar specific","scope":["meta.type.cast.expr","meta.type.new.expr","support.constant.math","support.constant.dom","support.constant.json","entity.other.inherited-class"],"settings":{"foreground":"#267f99"}},{"name":"Control flow keywords","scope":"keyword.control","settings":{"foreground":"#AF00DB"}},{"name":"Variable and parameter name","scope":["variable","meta.definition.variable.name","support.variable","entity.name.variable"],"settings":{"foreground":"#001080"}},{"name":"Object keys, TS grammar specific","scope":["meta.object-literal.key"],"settings":{"foreground":"#001080"}},{"name":"CSS property value","scope":["support.constant.property-value","support.constant.font-name","support.constant.media-type","support.constant.media","constant.other.color.rgb-value","constant.other.rgb-value","support.constant.color"],"settings":{"foreground":"#0451a5"}},{"name":"Regular expression groups","scope":["punctuation.definition.group.regexp","punctuation.definition.group.assertion.regexp","punctuation.definition.character-class.regexp","punctuation.character.set.begin.regexp","punctuation.character.set.end.regexp","keyword.operator.negation.regexp","support.other.parenthesis.regexp"],"settings":{"foreground":"#d16969"}},{"scope":["constant.character.character-class.regexp","constant.other.character-class.set.regexp","constant.other.character-class.regexp","constant.character.set.regexp"],"settings":{"foreground":"#811f3f"}},{"scope":"keyword.operator.quantifier.regexp","settings":{"foreground":"#000000"}},{"scope":["keyword.operator.or.regexp","keyword.control.anchor.regexp"],"settings":{"foreground":"#ff0000"}},{"scope":"constant.character","settings":{"foreground":"#0000ff"}},{"scope":"constant.character.escape","settings":{"foreground":"#ff0000"}},{"scope":"token.info-token","settings":{"foreground":"#316bcd"}},{"scope":"token.warn-token","settings":{"foreground":"#cd9731"}},{"scope":"token.error-token","settings":{"foreground":"#cd3131"}},{"scope":"token.debug-token","settings":{"foreground":"#800080"}}],"extensionData":{"extensionId":"vscode.theme-defaults","extensionPublisher":"vscode","extensionName":"theme-defaults","extensionIsBuiltin":true},"colorMap":{"editor.background":"#ffffff","editor.foreground":"#000000","editor.inactiveSelectionBackground":"#e5ebf1","editorIndentGuide.background":"#d3d3d3","editorIndentGuide.activeBackground":"#939393","editor.selectionHighlightBackground":"#add6ff4d","editorSuggestWidget.background":"#f3f3f3","activityBarBadge.background":"#007acc","sideBarTitle.foreground":"#6f6f6f","list.hoverBackground":"#e8e8e8","input.placeholderForeground":"#767676","settings.textInputBorder":"#cecece","settings.numberInputBorder":"#cecece"}}');
                items.set('commandpalette.mru.cache', '{"usesLRU":true,"entries":[{"key":"revealFileInOS","value":3},{"key":"extension.openInGitHub","value":4},{"key":"workbench.extensions.action.openExtensionsFolder","value":11},{"key":"workbench.action.showRuntimeExtensions","value":14},{"key":"workbench.action.toggleTabsVisibility","value":15},{"key":"extension.liveServerPreview.open","value":16},{"key":"workbench.action.openIssueReporter","value":18},{"key":"workbench.action.openProcessExplorer","value":19},{"key":"workbench.action.toggleSharedProcess","value":20},{"key":"workbench.action.configureLocale","value":21},{"key":"workbench.action.appPerf","value":22},{"key":"workbench.action.reportPerformanceIssueUsingReporter","value":23},{"key":"workbench.action.openGlobalKeybindings","value":25},{"key":"workbench.action.output.toggleOutput","value":27},{"key":"extension.sayHello","value":29}]}');
                let uuid = uuid_1.generateUuid();
                let value = [];
                for (let i = 0; i < 100000; i++) {
                    value.push(uuid);
                }
                items.set('super.large.string', value.join()); // 3.6MB
                yield storage.updateItems({ insert: items });
                let storedItems = yield storage.getItems();
                assert_1.equal(items.get('colorthemedata'), storedItems.get('colorthemedata'));
                assert_1.equal(items.get('commandpalette.mru.cache'), storedItems.get('commandpalette.mru.cache'));
                assert_1.equal(items.get('super.large.string'), storedItems.get('super.large.string'));
                uuid = uuid_1.generateUuid();
                value = [];
                for (let i = 0; i < 100000; i++) {
                    value.push(uuid);
                }
                items.set('super.large.string', value.join()); // 3.6MB
                yield storage.updateItems({ insert: items });
                storedItems = yield storage.getItems();
                assert_1.equal(items.get('colorthemedata'), storedItems.get('colorthemedata'));
                assert_1.equal(items.get('commandpalette.mru.cache'), storedItems.get('commandpalette.mru.cache'));
                assert_1.equal(items.get('super.large.string'), storedItems.get('super.large.string'));
                const toDelete = new Set();
                toDelete.add('super.large.string');
                yield storage.updateItems({ delete: toDelete });
                storedItems = yield storage.getItems();
                assert_1.equal(items.get('colorthemedata'), storedItems.get('colorthemedata'));
                assert_1.equal(items.get('commandpalette.mru.cache'), storedItems.get('commandpalette.mru.cache'));
                assert_1.ok(!storedItems.get('super.large.string'));
                yield storage.close();
                yield pfs_1.rimraf(storageDir, pfs_1.RimRafMode.MOVE);
            });
        });
        test('multiple concurrent writes execute in sequence', () => __awaiter(this, void 0, void 0, function* () {
            const storageDir = uniqueStorageDir();
            yield pfs_1.mkdirp(storageDir);
            class TestStorage extends storage_2.Storage {
                getStorage() {
                    return this.database;
                }
            }
            const storage = new TestStorage(new storage_1.SQLiteStorageDatabase(path_1.join(storageDir, 'storage.db')));
            yield storage.init();
            storage.set('foo', 'bar');
            storage.set('some/foo/path', 'some/bar/path');
            yield async_1.timeout(10);
            storage.set('foo1', 'bar');
            storage.set('some/foo1/path', 'some/bar/path');
            yield async_1.timeout(10);
            storage.set('foo2', 'bar');
            storage.set('some/foo2/path', 'some/bar/path');
            yield async_1.timeout(10);
            storage.delete('foo1');
            storage.delete('some/foo1/path');
            yield async_1.timeout(10);
            storage.delete('foo4');
            storage.delete('some/foo4/path');
            yield async_1.timeout(70);
            storage.set('foo3', 'bar');
            yield storage.set('some/foo3/path', 'some/bar/path');
            const items = yield storage.getStorage().getItems();
            assert_1.equal(items.get('foo'), 'bar');
            assert_1.equal(items.get('some/foo/path'), 'some/bar/path');
            assert_1.equal(items.has('foo1'), false);
            assert_1.equal(items.has('some/foo1/path'), false);
            assert_1.equal(items.get('foo2'), 'bar');
            assert_1.equal(items.get('some/foo2/path'), 'some/bar/path');
            assert_1.equal(items.get('foo3'), 'bar');
            assert_1.equal(items.get('some/foo3/path'), 'some/bar/path');
            yield storage.close();
            yield pfs_1.rimraf(storageDir, pfs_1.RimRafMode.MOVE);
        }));
        test('lots of INSERT & DELETE (below inline max)', () => __awaiter(this, void 0, void 0, function* () {
            const storageDir = uniqueStorageDir();
            yield pfs_1.mkdirp(storageDir);
            const storage = new storage_1.SQLiteStorageDatabase(path_1.join(storageDir, 'storage.db'));
            const items = new Map();
            const keys = new Set();
            for (let i = 0; i < 200; i++) {
                const uuid = uuid_1.generateUuid();
                const key = `key: ${uuid}`;
                items.set(key, `value: ${uuid}`);
                keys.add(key);
            }
            yield storage.updateItems({ insert: items });
            let storedItems = yield storage.getItems();
            assert_1.equal(storedItems.size, items.size);
            yield storage.updateItems({ delete: keys });
            storedItems = yield storage.getItems();
            assert_1.equal(storedItems.size, 0);
            yield storage.close();
            yield pfs_1.rimraf(storageDir, pfs_1.RimRafMode.MOVE);
        }));
        test('lots of INSERT & DELETE (above inline max)', () => __awaiter(this, void 0, void 0, function* () {
            const storageDir = uniqueStorageDir();
            yield pfs_1.mkdirp(storageDir);
            const storage = new storage_1.SQLiteStorageDatabase(path_1.join(storageDir, 'storage.db'));
            const items = new Map();
            const keys = new Set();
            for (let i = 0; i < 400; i++) {
                const uuid = uuid_1.generateUuid();
                const key = `key: ${uuid}`;
                items.set(key, `value: ${uuid}`);
                keys.add(key);
            }
            yield storage.updateItems({ insert: items });
            let storedItems = yield storage.getItems();
            assert_1.equal(storedItems.size, items.size);
            yield storage.updateItems({ delete: keys });
            storedItems = yield storage.getItems();
            assert_1.equal(storedItems.size, 0);
            yield storage.close();
            yield pfs_1.rimraf(storageDir, pfs_1.RimRafMode.MOVE);
        }));
    });
});
//# sourceMappingURL=storage.test.js.map