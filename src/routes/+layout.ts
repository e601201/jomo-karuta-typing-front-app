import { createSupabaseBrowserClient } from '$lib/supabase/browser';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
	depends('supabase:auth');

	const supabase = createSupabaseBrowserClient();

	const {
		data: { session }
	} = await supabase.auth.getSession();

	const {
		data: { user }
	} = await supabase.auth.getUser();

	return {
		...data,
		supabase,
		session,
		user
	};
};
