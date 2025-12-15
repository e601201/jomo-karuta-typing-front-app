import { createSupabaseServerClient } from '$lib/supabase/server';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const supabase = createSupabaseServerClient(event);

	/**
	 * Unlike `supabase.auth.getSession()`, which is insecure as it doesn't validate the JWT,
	 * this function validates the JWT and returns a session object if valid
	 */
	const getSession = async () => {
		const {
			data: { session }
		} = await supabase.auth.getSession();

		if (!session) {
			return null;
		}

		// Verify the session is valid
		const {
			data: { user },
			error
		} = await supabase.auth.getUser();

		if (error || !user) {
			// Invalid session, clear it
			await supabase.auth.signOut();
			return null;
		}

		return session;
	};

	const session = await getSession();
	const user = session?.user ?? null;

	event.locals.supabase = supabase;
	event.locals.safeGetSession = getSession;
	event.locals.session = session;
	event.locals.user = user;

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
