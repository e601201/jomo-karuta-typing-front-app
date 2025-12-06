import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { Pool } from 'pg';
import {
	POSTGRES_HOST,
	POSTGRES_PORT,
	POSTGRES_DB,
	POSTGRES_USER,
	POSTGRES_PASSWORD
} from '$env/static/private';

type Difficulty = 'beginner' | 'standard' | 'advanced';

let pool: Pool | null = null;

function getPool(): Pool {
	if (!pool) {
		pool = new Pool({
			host: POSTGRES_HOST || '127.0.0.1',
			port: POSTGRES_PORT ? Number(POSTGRES_PORT) : 5432,
			database: POSTGRES_DB || 'postgres',
			user: POSTGRES_USER || 'postgres',
			password: POSTGRES_PASSWORD || ''
		});
	}
	return pool;
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		const difficulty = url.searchParams.get('difficulty') as Difficulty | null;
		const limitParam = url.searchParams.get('limit');
		const limit = limitParam ? Math.min(Math.max(Number(limitParam), 1), 1000) : 100;

		if (!difficulty || !['beginner', 'standard', 'advanced'].includes(difficulty)) {
			return json({ error: 'invalid difficulty' }, { status: 400 });
		}

		const client = await getPool().connect();
		try {
			const { rows } = await client.query(
				'SELECT id, nick_name, score, difficulty, created_at FROM "Score" WHERE difficulty = $1 ORDER BY score DESC LIMIT $2',
				[difficulty, limit]
			);
			return json(rows, { status: 200 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('GET /api/scores error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const nickName = (body?.nickName ?? body?.nick_name ?? '').toString();
		const score = Number(body?.score);
		const difficulty = (body?.difficulty ?? '') as Difficulty;

		if (!nickName || !Number.isFinite(score) || score < 0) {
			return json({ error: 'invalid payload' }, { status: 400 });
		}
		if (!['beginner', 'standard', 'advanced'].includes(difficulty)) {
			return json({ error: 'invalid difficulty' }, { status: 400 });
		}

		const client = await getPool().connect();
		try {
			const { rows } = await client.query(
				'INSERT INTO "Score"(nick_name, score, difficulty) VALUES ($1, $2, $3) RETURNING id, nick_name, score, difficulty, created_at',
				[nickName, score, difficulty]
			);
			return json({ success: true, data: rows }, { status: 201 });
		} finally {
			client.release();
		}
	} catch (err) {
		console.error('POST /api/scores error:', err);
		return json({ error: 'internal error' }, { status: 500 });
	}
};
