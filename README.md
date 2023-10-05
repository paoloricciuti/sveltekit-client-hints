# sveltekit-client-hints

Avoid content layout shift with home made client hints!

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
![GitHub last commit](https://img.shields.io/github/last-commit/paoloricciuti/sveltekit-client-hints)
![npm](https://img.shields.io/npm/v/sveltekit-client-hints)
![npm](https://img.shields.io/npm/dt/sveltekit-client-hints)

## The problem

You want to provide your user with the best user experience possible. This includes, for example dark/light mode based on his system settings. However you don't know what your client system settings is on the server. This means that you'd have to serve a light version and eventually swap to the dark version once the page loads. This causes a flickr which, let's be honest, it's not pretty. There are [some work](https://web.dev/user-preference-media-features-headers/) in the making from browsers to allow for the server to **ask** for more information to the client before finishing his rendering but unfortunately is probably gonna take a while before we can really use it.

## The solution

A solution to this is add a tiny bit of inline javascript as the first thing in the head that will perform the checks that we need (for example using `document.matchMedia`), set a cookie with that value and trigger a page reload. Being the first thing in the head means that this will actually be mostly transparent to the user and from it's perspective the page will just take an infinitesimal amount of time more to load. You can implement this by yourself pretty easily but what if...

## The library

In the Javascript ecosystem we love delegate our work to someone else...so why caring to reimplement this every time you need it if there's a library ready for this? But i guess if you are here you already know this right? This library aim to provide a mostly frictionless way of handling this project. This library is heavily inspired by this implementation by Kent C.Dodds in his [Epic Web Stack](https://www.epicweb.dev/tips/use-client-hints-to-eliminate-content-layout-shift).

> **Warning**
> Having information from the client can be considered profiling and obviously the code that actually set the client hint needs to run before the page can fully load so try to keep it short and quick.

## Installation

```bash
npm i -D sveltekit-client-hints@latest  # or pnpm/yarn
```

after installing the library you should update you `./src/app.html` to include `%sveltekit.client_hints%` as the first string after the head like this

```html
<!doctype html>
<html lang="en">
	<head>
		%sveltekit.client_hints%
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width" />
		%sveltekit.head%
	</head>

	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
```

you will get a warning if you are using the provided handle function and this string is not found in the html.

## Usage

### vite plugin

To make everything works you need import `sveltekit_client_hints` as a vite plugin and add it to the list of plugins in you `vite.config.ts`.

<sub>vite.config.ts</sub>

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { sveltekit_client_hints } from 'sveltekit-client-hints/vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		sveltekit_client_hints({
			functions: {
				prefersDark() {
					return window.matchMedia('(prefers-color-scheme: dark)').matches.toString();
				}
			}
		})
	]
});
```

the only required field is `functions`. This is the list of functions that will be run on the client to retrieve the information that the server need. As you can see you can act just like if that function is running on the client and access `window` and all it's properties. The function needs to return a string (remember it will be saved in a cookie so every limitation that applies to cookie will apply to the return value too).

### handle function

The next step to setup everything correctly is add the handle function exported from `sveltekit-client-hints` in you `hooks.server.ts`. If you don't have other handle functions you can pretty much just do this

<sub>./src/hooks.server.ts</sub>

```ts
export { handle } from 'sveltekit-client-hints';
```

if you need to also run your own handle function you can use the `sequence` helper from SvelteKit

<sub>./src/hooks.server.ts</sub>

```ts
import { sequence } from '@sveltejs/kit/hooks';
import { handle as svh } from 'sveltekit-client-hints';

export const handle = sequence(svh, ({ event, resolve }) => {
	// your handle function
});
```

### where to find the values

After doing those steps you will find the variables in your cookies but to ease you experience you will also find all the values inside `event.locals`

<sub>./src/routes/+page.server.ts</sub>

```ts
export function load({ locals }) {
	locals.prefersDark; // <-- this is the client hint
}
```

you will get a field inside locals for each function you have specified inside the vite plugin. For typescript users you can set `generate_dts` to true in the vite plugin to let the plugin generate the correct typings for you. This will create a new file in `./src/sveltekit-client-hints.d.ts` that will enhance the types from sveltekit.

<sub>vite.config.ts</sub>

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { sveltekit_client_hints } from 'sveltekit-client-hints/vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		sveltekit_client_hints({
			generate_dts: true,
			functions: {
				prefersDark() {
					return window.matchMedia('(prefers-color-scheme: dark)').matches.toString();
				}
			}
		})
	]
});
```

### cookie prefix

By default every cookie will be stored with the prefix `client-hints-` followed by the name of the function (so in our example `client-hints-prefersDark`) but you can customize this prefix with the `base_cookie_name` option of the vite plugin.

<sub>vite.config.ts</sub>

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { sveltekit_client_hints } from 'sveltekit-client-hints/vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		sveltekit_client_hints({
			generate_dts: true,
			base_cookie_name: 'my-prefix-',
			functions: {
				prefersDark() {
					return window.matchMedia('(prefers-color-scheme: dark)').matches.toString();
				}
			}
		})
	]
});
```

this will result in the name of the cookie being `my-prefix-prefersDark`.

## Contributing

Contributions are always welcome!

For the moment there's no code of conduct or contributing guideline, but if you've found a problem or have an idea, feel free to [open an issue](https://github.com/paoloricciuti/sveltekit-client-hints/issues/new)

For the fastest way to open a PR, try out Codeflow:

[![Open in Codeflow](https://developer.stackblitz.com/img/open_in_codeflow.svg)](https://pr.new/paoloricciuti/sveltekit-client-hints/)

## Authors

- [@paoloricciuti](https://www.github.com/paoloricciuti)
