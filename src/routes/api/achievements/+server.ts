import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getPool } from '$lib/server/db';

export const GET: RequestHandler = async () => {
	try {
		const client = await getPool().connect();
		try {
			const { rows } = await client.query(
				'SELECT id, name, description, icon, category, target_value, points, display_order, active, created_at FROM achievements ORDER BY display_order ASC'
			);
			return json(rows, { status: 200 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('GET /api/achievements error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};


