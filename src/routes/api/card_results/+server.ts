import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getPool } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const sessionId = url.searchParams.get('session_id');
		if (!sessionId) return json({ error: 'missing session_id' }, { status: 400 });
		const client = await getPool().connect();
		try {
			const { rows } = await client.query(
				'SELECT * FROM card_results WHERE session_id = $1 ORDER BY created_at ASC',
				[sessionId]
			);
			return json(rows, { status: 200 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('GET /api/card_results error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const {
			session_id,
			card_id,
			time_spent,
			mistakes = 0,
			accuracy,
			completed = false,
			input_events = null
		} = body ?? {};

		if (!session_id || !card_id || accuracy === undefined || time_spent === undefined) {
			return json({ error: 'invalid payload' }, { status: 400 });
		}

		const client = await getPool().connect();
		try {
			const { rows } = await client.query(
				`INSERT INTO card_results (session_id, card_id, time_spent, mistakes, accuracy, completed, input_events)
				 VALUES ($1,$2,$3,$4,$5,$6,$7)
				 RETURNING *`,
				[
					session_id,
					card_id,
					Number(time_spent),
					Number(mistakes),
					Number(accuracy),
					Boolean(completed),
					input_events
				]
			);
			return json(rows[0], { status: 201 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('POST /api/card_results error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};


