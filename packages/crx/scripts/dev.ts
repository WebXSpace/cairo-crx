import { resolve } from 'path';
import { exec } from 'child_process';

const println = (module: string, data: string) => {
	const lines = (data as string).split('\n');
	lines.forEach(line => {
		console.log(`[${module}]`, line);
	});
};

async function main() {
	const render = exec('yarn dev', { cwd: resolve(__dirname, '../../render') });

	render.stdout?.on('data', data => {
		println('render', data);
	});

	render.stderr?.on('data', data => {
		println('render', data);
	});

	const rollup = exec('rollup -c -w');

	rollup.stdout?.on('data', data => {
		println('rollup', data);
	});

	rollup.stderr?.on('data', data => {
		println('rollup', data);
	});
}

main()
	.then(() => {})
	.catch(e => console.log(e));
