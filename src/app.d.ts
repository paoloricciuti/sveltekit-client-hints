// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals extends Record<string, string | undefined> {}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
