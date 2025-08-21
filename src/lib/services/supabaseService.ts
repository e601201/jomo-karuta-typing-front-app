import { supabase } from '$lib/supabaseClient';

export async function saveScore(nickName: string, score: number) {
	const { data, error } = await supabase
		.from('Score')
		.insert([{ nick_name: nickName, score: score }])
		.select();

	if (error) {
		console.error('Error saving score:', error);
		return { success: false, error: error.message };
	}

	return { success: true, data };
}

export async function getTopScores(limit: number = 100) {
	const { data, error } = await supabase
		.from('Score')
		.select('*')
		.order('score', { ascending: false })
		.limit(limit);

	if (error) {
		console.error('Error fetching scores:', error);
		return [];
	}

	return data ?? [];
}
