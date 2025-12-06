import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getPool } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const userId = url.searchParams.get('user_id');
		if (!userId) return json({ error: 'missing user_id' }, { status: 400 });
		const client = await getPool().connect();
		try {
			const { rows } = await client.query(
				'SELECT * FROM user_achievements WHERE user_id = $1',
				[userId]
			);
			return json(rows, { status: 200 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('GET /api/user_achievements error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { user_id, achievement_id, progress = 0, unlocked = false, unlocked_at = null } = body ?? {};
		if (!user_id || !achievement_id)
			return json({ error: 'missing user_id or achievement_id' }, { status: 400 });

		const client = await getPool().connect();
		try {
			const { rows } = await client.query(
				`INSERT INTO user_achievements (user_id, achievement_id, progress, unlocked, unlocked_at)
				 VALUES ($1,$2,$3,$4,$5)
				 ON CONFLICT (user_id, achievement_id)
				 DO UPDATE SET progress = EXCLUDED.progress,
				               unlocked = EXCLUDED.unlocked,
				               unlocked_at = EXCLUDED.unlocked_at,
				               updated_at = CURRENT_TIMESTAMP
				 RETURNING *`,
				[user_id, achievement_id, Number(progress), Boolean(unlocked), unlocked_at]
			);
			return json(rows[0], { status: 200 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('PUT /api/user_achievements error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};


