import type { Handle } from '@sveltejs/kit';
import { config, base_cookie_name } from 'virtual:sveltekit-client-hint';
import type { Plugin } from 'vite';
import { writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const basic_html = `
<script>
	const expires = new Date();
	expires.setSeconds(expires.getSeconds());
	const cookies = Object.fromEntries(document.cookie.split(";").map(cookie => cookie.split("=").map(part => part.trim())));
	let needs_reload = false;
	${Object.entries(config)
		.map(([name, fn]) => {
			return `
			const ${name}_value = (${fn})();
			if(${name}_value && cookies["${base_cookie_name}${name}"] !== ${name}_value){
				document.cookie = "${base_cookie_name}${name}="+${name}_value;
				needs_reload = true;
			}`;
		})
		.join('\n')}
		if(needs_reload){
			window.location.reload();
		}
</script>
`;

export const handle: Handle = ({ event, resolve }) => {
	for (const hint in config) {
		event.locals[hint] = event.cookies.get(`${base_cookie_name}${hint}`);
	}
	return resolve(event, {
		transformPageChunk({ html }) {
			if (!html.includes('%sveltekit.client_hints%')) {
				console.warn(
					"You are using sveltekit-client-hints but there's no '%sveltekit.client_hints%' in app.html, make sure to add it in the head."
				);
			}
			return html.replace('%sveltekit.client_hints%', basic_html);
		}
	});
};

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
