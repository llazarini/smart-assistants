import { configure, processCLIArgs, run } from '@japa/runner';
import { assert } from '@japa/assert';
import { fileSystem } from '@japa/file-system';
import { expectTypeOf } from '@japa/expect-type';

processCLIArgs(process.argv.splice(2));
configure({
	files: ['tests/**/*.spec.ts'],
	plugins: [assert(), fileSystem(), expectTypeOf()],
	timeout: 3 * 60 * 1000
});

run();
