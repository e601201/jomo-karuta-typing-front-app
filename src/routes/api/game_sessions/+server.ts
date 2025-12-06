import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getPool } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const id = url.searchParams.get('id');
		const userId = url.searchParams.get('user_id');
		const limitParam = url.searchParams.get('limit');
		const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 1000) : 50;

		const client = await getPool().connect();
		try {
			if (id) {
				const { rows } = await client.query('SELECT * FROM game_sessions WHERE id = $1', [id]);
				if (rows.length === 0) return json({ error: 'not found' }, { status: 404 });
				return json(rows[0], { status: 200 });
			}
			if (userId) {
				const { rows } = await client.query(
					'SELECT * FROM game_sessions WHERE user_id = $1 ORDER BY started_at DESC LIMIT $2',
					[userId, limit]
				);
				return json(rows, { status: 200 });
			}
			return json({ error: 'missing query param' }, { status: 400 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('GET /api/game_sessions error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const {
			user_id,
			mode,
			input_mode,
			partial_length,
			total_cards,
			cards,
			settings,
			status,
			started_at
		} = body ?? {};

		if (!mode || !input_mode || !Number.isFinite(Number(total_cards)) || !cards || !settings) {
			return json({ error: 'invalid payload' }, { status: 400 });
		}

		const client = await getPool().connect();
		try {
			const { rows } = await client.query(
				`INSERT INTO game_sessions (user_id, mode, input_mode, partial_length, total_cards, cards, settings, status, started_at)
				 VALUES ($1,$2,$3,$4,$5,$6,$7, COALESCE($8,'loading'), COALESCE($9, CURRENT_TIMESTAMP))
				 RETURNING *`,
				[
					user_id ?? null,
					String(mode),
					String(input_mode),
					partial_length ?? null,
					Number(total_cards),
					cards,
					settings,
					status ?? null,
					started_at ?? null
				]
			);
			return json(rows[0], { status: 201 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('POST /api/game_sessions error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { id, ...updates } = body ?? {};
		if (!id) return json({ error: 'missing id' }, { status: 400 });

		const allowed = [
			'user_id',
			'mode',
			'input_mode',
			'partial_length',
			'ended_at',
			'status',
			'total_cards',
			'completed_cards',
			'current_card_index',
			'cards',
			'settings'
		] as const;

		const entries = Object.entries(updates).filter(([k, v]) => allowed.includes(k as any));
		if (entries.length === 0) return json({ error: 'no updatable fields' }, { status: 400 });

		const setFragments: string[] = [];
		const values: any[] = [];
		entries.forEach(([k, v], i) => {
			setFragments.push(`${k} = $${i + 1}`);
			values.push(v);
		});
		values.push(id);

		const client = await getPool().connect();
		try {
			const { rows } = await client.query(
				`UPDATE game_sessions SET ${setFragments.join(', ')} WHERE id = $${values.length} RETURNING *`,
				values
			);
			if (rows.length === 0) return json({ error: 'not found' }, { status: 404 });
			return json(rows[0], { status: 200 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('PATCH /api/game_sessions error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};


