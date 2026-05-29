/**
 * /game の load 関数テスト（+page.ts）
 *
 * 統一に伴い、特定札練習は mode=specific + URL の cards パラメータで
 * カードを受け渡すようになった。繰り返し回数・シャッフル順を壊さないよう、
 * 「順序」と「重複」を保持してカードを解決することを固定する。
 */

import { describe, it, expect } from 'vitest';
import { load } from './+page';
import { getKarutaCards } from '$lib/data/karuta-cards';
import type { GameMode, KarutaCard, RandomModeDifficulty } from '$lib/types';

type LoadResult = {
	mode: GameMode | null;
	cards: KarutaCard[];
	error: string | null;
	difficulty?: RandomModeDifficulty | null;
};

function makeUrl(query: string): URL {
	return new URL(`http://localhost/game?${query}`);
}

// load は { url } しか参照しないため最小限の引数で呼ぶ
const callLoad = async (query: string): Promise<LoadResult> => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (await load({ url: makeUrl(query) } as any)) as LoadResult;
};

describe('game +page.ts load: 特定札モード（mode=specific）', () => {
	it('cards パラメータの順序と重複をそのまま再現する', async () => {
		const ids = ['tsu', 'tsu', 'ne'];
		const result = await callLoad(`mode=specific&cards=${ids.join(',')}`);

		expect(result.mode).toBe('specific');
		expect(result.cards.map((c) => c.id)).toEqual(ids); // 重複・順序を保持
	});

	it('存在しないIDは除外する', async () => {
		const result = await callLoad('mode=specific&cards=tsu,__nope__,ne');
		expect(result.cards.map((c) => c.id)).toEqual(['tsu', 'ne']);
	});

	it('cards 指定が無い場合は全札にフォールバックする', async () => {
		const result = await callLoad('mode=specific');
		expect(result.cards.length).toBe(getKarutaCards().length);
	});
});

describe('game +page.ts load: その他のモード', () => {
	it('練習モードは全44札を順番どおり返す', async () => {
		const all = getKarutaCards();
		const result = await callLoad('mode=practice');

		expect(result.mode).toBe('practice');
		expect(result.cards.map((c) => c.id)).toEqual(all.map((c) => c.id));
	});

	it('ランダムモードは全札を返す（並び替えは store 側で実施）', async () => {
		const result = await callLoad('mode=random');
		expect(result.mode).toBe('random');
		expect(result.cards.length).toBe(getKarutaCards().length);
	});

	it('無効なモードはエラーを返す', async () => {
		const result = await callLoad('mode=__bogus__');
		expect(result.error).toBeTruthy();
		expect(result.mode).toBeNull();
	});
});
