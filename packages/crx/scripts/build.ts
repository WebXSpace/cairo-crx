import { exec } from 'child_process';

const println = (module: string, data: string) => {
	const lines = (data as string).split('\n');
	lines.forEach(line => {
		console.log(`[${module}]`, line);
	});
};

async function main() {
	const pem = process.env.CAIRO_CRX_PEM;

	if (!pem) {
		throw new Error('env CAIRO_CRX_PEM not found');
	}

	const rollup = exec(
		`cross-env NODE_ENV=production rollup -c && crx3 -p ${pem} -z dist-crx/cairo.zip -x dist-crx/update.xml -o dist-crx/cairo.crx dist`,
	);

	rollup.stdout?.on('data', data => {
		println('build', data);
	});

	rollup.stderr?.on('data', data => {
		println('build', data);
	});
}

main()
	.then(() => {})
	.catch(e => console.log(e));
