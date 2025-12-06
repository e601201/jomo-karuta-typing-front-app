import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getPool } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const userId = url.searchParams.get('user_id');
		const cardId = url.searchParams.get('card_id');
		if (!userId || !cardId) return json({ error: 'missing user_id or card_id' }, { status: 400 });
		const client = await getPool().connect();
		try {
			const { rows } = await client.query(
				'SELECT * FROM card_progress WHERE user_id = $1 AND card_id = $2',
				[userId, cardId]
			);
			if (rows.length === 0) return json({ error: 'not found' }, { status: 404 });
			return json(rows[0], { status: 200 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('GET /api/card_progress error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const {
			user_id,
			card_id,
			attempts,
			best_time,
			total_time,
			total_mistakes,
			last_attempt_at,
			mastered,
			mastered_at
		} = body ?? {};
		if (!user_id || !card_id) return json({ error: 'missing user_id or card_id' }, { status: 400 });

		const client = await getPool().connect();
		try {
			const { rows } = await client.query(
				`INSERT INTO card_progress (user_id, card_id, attempts, best_time, total_time, total_mistakes, last_attempt_at, mastered, mastered_at)
				 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
				 ON CONFLICT (user_id, card_id)
				 DO UPDATE SET attempts = EXCLUDED.attempts,
				               best_time = EXCLUDED.best_time,
				               total_time = EXCLUDED.total_time,
				               total_mistakes = EXCLUDED.total_mistakes,
				               last_attempt_at = EXCLUDED.last_attempt_at,
				               mastered = EXCLUDED.mastered,
				               mastered_at = EXCLUDED.mastered_at,
				               updated_at = CURRENT_TIMESTAMP
				 RETURNING *`,
				[
					user_id,
					card_id,
					attempts ?? 0,
					best_time ?? null,
					total_time ?? 0,
					total_mistakes ?? 0,
					last_attempt_at ?? null,
					mastered ?? false,
					mastered_at ?? null
				]
			);
			return json(rows[0], { status: 200 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('PUT /api/card_progress error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};


