import { Pool } from 'pg';
import {
	POSTGRES_HOST,
	POSTGRES_PORT,
	POSTGRES_DB,
	POSTGRES_USER,
	POSTGRES_PASSWORD
} from '$env/static/private';

let pool: Pool | null = null;

export function getPool(): Pool {
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


