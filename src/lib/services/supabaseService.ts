import { supabase } from '$lib/supabaseClient';

export async function saveScore(
	nickName: string,
	score: number,
	difficulty: 'beginner' | 'standard' | 'advanced' = 'standard',
	gameMode?: 'random' | 'timeattack',
	time?: number
) {
	const insertData: any = {
		nick_name: nickName,
		difficulty: difficulty
	};

	if (gameMode === 'timeattack') {
		insertData.time = time;
		insertData.game_mode = 'timeattack';
	} else {
		insertData.score = score;
		insertData.game_mode = gameMode || 'random';
	}

	const { data, error } = await supabase.from('Score').insert([insertData]).select();

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
	// game_modeカラムが存在しない場合も考慮して、scoreがnullでないものだけを取得
	const { data, error } = await supabase
		.from('Score')
		.select('*')
		.eq('difficulty', difficulty)
		.not('score', 'is', null)
		.order('score', { ascending: false })
		.limit(limit);

	if (error) {
		console.error('Error fetching scores by difficulty:', error);
		return [];
	}

	// game_modeがrandomまたはnullのものだけをフィルタリング
	const filteredData =
		data?.filter((entry) => !entry.game_mode || entry.game_mode === 'random') ?? [];

	return filteredData;
}

export async function getTopTimesByDifficulty(
	difficulty: 'beginner' | 'standard' | 'advanced',
	limit: number = 100
) {
	const { data, error } = await supabase
		.from('Score')
		.select('*')
		.eq('difficulty', difficulty)
		.eq('game_mode', 'timeattack')
		.not('time', 'is', null)
		.order('time', { ascending: true }) // タイムは短い方が上位
		.limit(limit);

	if (error) {
		console.error('Error fetching times by difficulty:', error);
		return [];
	}

	return data ?? [];
}
