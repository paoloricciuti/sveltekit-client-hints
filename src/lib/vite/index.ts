import type { Plugin } from 'vite';
import { writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

export type Config = {
	base_cookie_name?: string;
	generate_dts?: boolean;
	functions: Record<string, () => string>;
};

export function sveltekit_client_hints({
	functions,
	base_cookie_name = 'client-hints-',
	generate_dts = true
}: Config) {
	const virtual_name = 'virtual:sveltekit-client-hint';
	const resolved_virtual_name = `\0${virtual_name}`;
	if (generate_dts) {
		const types = `declare global {
	namespace App {
		interface Locals {
${Object.keys(functions)
	.map((hint) => `\t\t\t${hint}: string | undefined;`)
	.join('\n')}
		}
	}
}

export {};`;
		writeFile(resolve(join(process.cwd(), 'src', 'sveltekit-client-hints.d.ts')), types);
	}
	return {
		name: 'vite-sveltekit-early-hint-plugin',
		resolveId(source) {
			if (source === virtual_name) {
				return resolved_virtual_name;
			}
		},
		load(id) {
			if (id === resolved_virtual_name) {
				return `
				export const base_cookie_name = "${base_cookie_name}";
				export const config = ${JSON.stringify(functions, (key, value) => {
					if (typeof value === 'function') {
						const to_return = value.toString();
						if (to_return.startsWith(`${key}()`)) {
							return `function ${to_return}`;
						}
						return to_return;
					}
					return value;
				})};`;
			}
		}
	} satisfies Plugin;
}
