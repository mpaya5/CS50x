/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//
// C9 changes:
// Define only "compile" and "watch-client" tasks
// "compile" task is technically a compile-client, it's redefined so we don't need to override package.json
// Do not load any c9-build/gulpfile.* files
//

'use strict';

// Increase max listeners for event emitters
require('events').EventEmitter.defaultMaxListeners = 100;

const gulp = require('gulp');
const util = require('./c9-build/lib/util');
const task = require('./c9-build/lib/task');
// const path = require('path');
const compilation = require('./c9-build/lib/compilation');
// const { monacoTypecheckTask/* , monacoTypecheckWatchTask */ } = require('./c9-build/gulpfile.editor');
const { compileExtensionsTask/*, watchExtensionsTask*/ } = require('./c9-build/gulpfile.extensions');

// Fast compile for development time
const compileClientTask = task.define('compile', task.series(util.rimraf('out'), compilation.compileTask('src', 'out', false)));
gulp.task(compileClientTask);

const watchClientTask = task.define('watch-client', task.series(util.rimraf('out'), compilation.watchTask('out', false)));
gulp.task(watchClientTask);

gulp.task(compileExtensionsTask);

// All
// const compileTask = task.define('compile', task.parallel(monacoTypecheckTask, compileClientTask, compileExtensionsTask));
// gulp.task(compileTask);

// gulp.task(task.define('watch', task.parallel(/* monacoTypecheckWatchTask, */ watchClientTask, watchExtensionsTask)));

// Default
// gulp.task('default', compileTask);

process.on('unhandledRejection', (reason, p) => {
	console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
	process.exit(1);
});

// Load all the gulpfiles only if running tasks other than the editor tasks
// const build = path.join(__dirname, 'c9-build');
// require('glob').sync('gulpfile.*.js', { cwd: build })
// 	.forEach(f => require(`./c9-build/${f}`));
