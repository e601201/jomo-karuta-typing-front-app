import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getPool } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const userId = url.searchParams.get('user_id');
		if (!userId) return json({ error: 'missing user_id' }, { status: 400 });
		const client = await getPool().connect();
		try {
			const { rows } = await client.query('SELECT * FROM user_stats WHERE user_id = $1', [userId]);
			if (rows.length === 0) return json({ error: 'not found' }, { status: 404 });
			return json(rows[0], { status: 200 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('GET /api/user_stats error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const {
			user_id,
			total_sessions = 0,
			total_time = 0,
			total_cards = 0,
			total_chars = 0,
			total_mistakes = 0,
			best_wpm = 0,
			best_accuracy = 0,
			best_score = 0,
			current_streak = 0,
			longest_streak = 0,
			last_played_at = null
		} = body ?? {};
		if (!user_id) return json({ error: 'missing user_id' }, { status: 400 });

		const client = await getPool().connect();
		try {
			const { rows } = await client.query(
				`INSERT INTO user_stats (user_id, total_sessions, total_time, total_cards, total_chars, total_mistakes, best_wpm, best_accuracy, best_score, current_streak, longest_streak, last_played_at)
				 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
				 ON CONFLICT (user_id)
				 DO UPDATE SET total_sessions = EXCLUDED.total_sessions,
				               total_time = EXCLUDED.total_time,
				               total_cards = EXCLUDED.total_cards,
				               total_chars = EXCLUDED.total_chars,
				               total_mistakes = EXCLUDED.total_mistakes,
				               best_wpm = EXCLUDED.best_wpm,
				               best_accuracy = EXCLUDED.best_accuracy,
				               best_score = EXCLUDED.best_score,
				               current_streak = EXCLUDED.current_streak,
				               longest_streak = EXCLUDED.longest_streak,
				               last_played_at = EXCLUDED.last_played_at,
				               updated_at = CURRENT_TIMESTAMP
				 RETURNING *`,
				[
					user_id,
					Number(total_sessions),
					Number(total_time),
					Number(total_cards),
					Number(total_chars),
					Number(total_mistakes),
					Number(best_wpm),
					Number(best_accuracy),
					Number(best_score),
					Number(current_streak),
					Number(longest_streak),
					last_played_at
				]
			);
			return json(rows[0], { status: 200 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('PUT /api/user_stats error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};


