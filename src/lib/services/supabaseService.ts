import { supabase } from '$lib/supabaseClient';
import { PUBLIC_BACKEND_MODE } from '$env/static/public';

const useLocalApi = (PUBLIC_BACKEND_MODE || '').toLowerCase() === 'local';

export async function saveScore(
	nickName: string,
	score: number,
	difficulty: 'beginner' | 'standard' | 'advanced' = 'standard'
) {
	if (useLocalApi) {
		try {
			const res = await fetch('/api/scores', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ nickName, score, difficulty })
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				console.error('Error saving score (local):', err);
				return { success: false, error: err?.error || res.statusText };
			}
			const json = await res.json();
			return { success: true, data: json?.data ?? [] };
		} catch (e) {
			console.error('Error saving score (local):', e);
			return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
		}
	}

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
	if (useLocalApi) {
		try {
			const params = new URLSearchParams({ difficulty, limit: String(limit) });
			const res = await fetch(`/api/scores?${params.toString()}`, { method: 'GET' });
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				console.error('Error fetching scores (local):', err);
				return [];
			}
			const rows = await res.json();
			return Array.isArray(rows) ? rows : [];
		} catch (e) {
			console.error('Error fetching scores (local):', e);
			return [];
		}
	}

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
