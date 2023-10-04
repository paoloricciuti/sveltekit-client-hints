import type { Handle } from '@sveltejs/kit';
import { config, base_cookie_name } from 'virtual:sveltekit-client-hint';

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
