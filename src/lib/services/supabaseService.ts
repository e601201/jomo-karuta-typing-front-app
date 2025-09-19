import { supabase } from '$lib/supabaseClient';

export async function saveScore(
	nickName: string,
	score: number,
	difficulty: 'beginner' | 'standard' | 'advanced' = 'standard'
) {
	const { data, error } = await supabase
		.from('Score')
		.insert([{ nick_name: nickName, score: score, difficulty: difficulty }])
		.select();

	if (error) {
		console.error('Error saving score:', error);
		return { success: false, error: error.message };
	}

	return { success: true, data };
}

export async function getTopScoresByDifficulty(
	difficulty: 'beginner' | 'standard' | 'advanced',
	limit: number = 100
) {
	const { data, error } = await supabase
		.from('Score')
		.select('*')
		.eq('difficulty', difficulty)
		.order('score', { ascending: false })
		.limit(limit);

	if (error) {
		console.error('Error fetching scores by difficulty:', error);
		return [];
	}

	return data ?? [];
}
