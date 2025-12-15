import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.session) {
		redirect(303, '/profile');
	}
	return {};
};

export const actions: Actions = {
	// TODO: email passwordによるログインは一旦非表示
	// login: async ({ request, locals }) => {
	// 	const formData = await request.formData();
	// 	const email = formData.get('email') as string;
	// 	const password = formData.get('password') as string;

	// 	if (!email || !password) {
	// 		return fail(400, { error: 'メールアドレスとパスワードを入力してください' });
	// 	}

	// 	const { error } = await locals.supabase.auth.signInWithPassword({
	// 		email,
	// 		password
	// 	});

	// 	if (error) {
	// 		if (error.message.includes('Invalid login credentials')) {
	// 			return fail(400, { error: 'メールアドレスまたはパスワードが正しくありません' });
	// 		}
	// 		return fail(400, { error: error.message });
	// 	}

	// 	redirect(303, '/profile');
	// },

	oauth: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const provider = formData.get('provider') as 'google' | 'github';

		if (!provider) {
			return fail(400, { error: 'プロバイダーが指定されていません' });
		}

		const { data, error } = await locals.supabase.auth.signInWithOAuth({
			provider,
			options: {
				redirectTo: `${url.origin}/auth/callback`
			}
		});

		if (error) {
			return fail(400, { error: error.message });
		}

		if (data.url) {
			redirect(303, data.url);
		}
	}
};
