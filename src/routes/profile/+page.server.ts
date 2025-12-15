import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Profile } from '$lib/types/database';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.safeGetSession();

	if (!session) {
		redirect(303, '/auth/login');
	}

	// Get user profile using raw SQL for now since profiles table is not in database.types
	const { data: profileData } = (await locals.supabase
		.rpc('get_profile', { user_id: session.user.id })
		.single()) as { data: Profile | null };

	// TODO: スコア情報は一旦非表示
	// const { data: scores } = await locals.supabase
	// 	.from('Score')
	// 	.select('*')
	// 	.order('created_at', { ascending: false })
	// 	.limit(10);

	// TODO: スコア情報は一旦非表示
	// const stats = {
	// 	totalGames: scores?.length || 0,
	// 	highScore: scores?.reduce((max, score) => Math.max(max, score.score || 0), 0) || 0,
	// 	averageScore: scores?.length
	// 		? Math.round(scores.reduce((sum, score) => sum + (score.score || 0), 0) / scores.length)
	// 		: 0
	// };

	return {
		session,
		user: session.user,
		profile: profileData
		// recentScores: scores || [],
		// stats
	};
};
