import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getPool } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const monthStart = url.searchParams.get('month_start'); // YYYY-MM-DD
		const limitParam = url.searchParams.get('limit');
		const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 1000) : 100;
		const client = await getPool().connect();
		try {
			if (monthStart) {
				const { rows } = await client.query(
					'SELECT * FROM monthly_rankings WHERE month_start = $1 ORDER BY score DESC LIMIT $2',
					[monthStart, limit]
				);
				return json(rows, { status: 200 });
			}
			const { rows } = await client.query(
				'SELECT * FROM monthly_rankings ORDER BY month_start DESC, score DESC LIMIT $1',
				[limit]
			);
			return json(rows, { status: 200 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('GET /api/monthly_rankings error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};


