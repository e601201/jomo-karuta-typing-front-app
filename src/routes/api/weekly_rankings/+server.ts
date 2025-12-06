import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getPool } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const weekStart = url.searchParams.get('week_start'); // YYYY-MM-DD
		const limitParam = url.searchParams.get('limit');
		const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 1000) : 100;
		const client = await getPool().connect();
		try {
			if (weekStart) {
				const { rows } = await client.query(
					'SELECT * FROM weekly_rankings WHERE week_start = $1 ORDER BY score DESC LIMIT $2',
					[weekStart, limit]
				);
				return json(rows, { status: 200 });
			}
			const { rows } = await client.query(
				'SELECT * FROM weekly_rankings ORDER BY week_start DESC, score DESC LIMIT $1',
				[limit]
			);
			return json(rows, { status: 200 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('GET /api/weekly_rankings error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};


