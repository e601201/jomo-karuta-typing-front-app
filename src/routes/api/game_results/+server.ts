import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getPool } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const sessionId = url.searchParams.get('session_id');
		const userId = url.searchParams.get('user_id');
		const limitParam = url.searchParams.get('limit');
		const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 1000) : 50;

		const client = await getPool().connect();
		try {
			if (sessionId) {
				const { rows } = await client.query('SELECT * FROM game_results WHERE session_id = $1', [
					sessionId
				]);
				if (rows.length === 0) return json({ error: 'not found' }, { status: 404 });
				return json(rows[0], { status: 200 });
			}
			if (userId) {
				const { rows } = await client.query(
					'SELECT * FROM game_results WHERE user_id = $1 ORDER BY score DESC LIMIT $2',
					[userId, limit]
				);
				return json(rows, { status: 200 });
			}
			return json({ error: 'missing query param' }, { status: 400 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('GET /api/game_results error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const {
			session_id,
			user_id,
			total_time,
			total_cards,
			completed_cards,
			total_chars,
			correct_chars,
			mistakes,
			accuracy,
			wpm,
			cpm,
			score
		} = body ?? {};

		if (!session_id) return json({ error: 'missing session_id' }, { status: 400 });
		if (![total_time, total_cards, completed_cards, total_chars, correct_chars, mistakes, accuracy, wpm, cpm, score].every((v) => v !== undefined)) {
			return json({ error: 'invalid payload' }, { status: 400 });
		}

		const client = await getPool().connect();
		try {
			const { rows } = await client.query(
				`INSERT INTO game_results (session_id, user_id, total_time, total_cards, completed_cards, total_chars, correct_chars, mistakes, accuracy, wpm, cpm, score)
				 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
				 RETURNING *`,
				[
					session_id,
					user_id ?? null,
					Number(total_time),
					Number(total_cards),
					Number(completed_cards),
					Number(total_chars),
					Number(correct_chars),
					Number(mistakes),
					Number(accuracy),
					Number(wpm),
					Number(cpm),
					Number(score)
				]
			);
			return json(rows[0], { status: 201 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('POST /api/game_results error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};


