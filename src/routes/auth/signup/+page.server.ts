// TODO: email passwordによる登録は一旦非表示

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.session) {
		redirect(303, '/profile');
	}
	return {};
};

export const actions: Actions = {
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
	},

	signup: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;
		const nickname = formData.get('nickname') as string;
		const agreeToTerms = formData.get('agreeToTerms') === 'on';

		if (!email || !password || !nickname) {
			return fail(400, { error: '必須項目を入力してください' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'パスワードは8文字以上で入力してください' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'パスワードが一致しません' });
		}

		if (!agreeToTerms) {
			return fail(400, { error: '利用規約に同意してください' });
		}

		const { error } = await locals.supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					nickname
				},
				emailRedirectTo: `${url.origin}/auth/callback`
			}
		});

		if (error) {
			if (error.message.includes('already registered')) {
				return fail(400, { error: 'このメールアドレスは既に登録されています' });
			}
			return fail(400, { error: error.message });
		}

		return {
			success: true,
			message: '確認メールを送信しました。メールをご確認ください。'
		};
	}
};
