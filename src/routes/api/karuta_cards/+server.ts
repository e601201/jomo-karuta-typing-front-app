import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { getPool } from '$lib/server/db';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const id = url.searchParams.get('id');
		const client = await getPool().connect();
		try {
			if (id) {
				const { rows } = await client.query(
					'SELECT id, hiragana, romaji, meaning, category, difficulty, image_url, audio_url, display_order, created_at FROM karuta_cards WHERE id = $1',
					[id]
				);
				if (rows.length === 0) return json({ error: 'not found' }, { status: 404 });
				return json(rows[0], { status: 200 });
			}
			const { rows } = await client.query(
				'SELECT id, hiragana, romaji, meaning, category, difficulty, image_url, audio_url, display_order, created_at FROM karuta_cards ORDER BY display_order ASC'
			);
			return json(rows, { status: 200 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('GET /api/karuta_cards error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};


