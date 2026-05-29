import type { PageLoad } from './$types';
import type { GameMode, KarutaCard, RandomModeDifficulty } from '$lib/types';
import { getKarutaCards } from '$lib/data/karuta-cards';

export const load: PageLoad = async ({ url }) => {
	const mode = url.searchParams.get('mode') || 'practice';
	const difficulty = url.searchParams.get('difficulty') as RandomModeDifficulty | null;

	// Validate mode
	if (!['practice', 'specific', 'random', 'timeattack'].includes(mode)) {
		return {
			error: '無効なゲームモードです',
			mode: null,
			cards: [],
			difficulty: null
		};
	}

	let cards: KarutaCard[];

	// モードに応じて札を準備
	switch (mode) {
		case 'specific': {
			// 特定札モード: 選択された札のID配列（繰り返し・シャッフル順を保持）
			const selectedIds = url.searchParams.get('cards')?.split(',').filter(Boolean) || [];
			const byId = new Map(getKarutaCards().map((card) => [card.id, card]));
			// URLの並び順・重複をそのまま再現する
			cards = selectedIds.map((id) => byId.get(id)).filter((card): card is KarutaCard => !!card);
			if (cards.length === 0) {
				cards = getKarutaCards(); // フォールバック
			}
			break;
		}

		default:
			// 練習 / ランダム / タイムアタック: 全44札を順番に
			cards = getKarutaCards();
			break;
	}

	return {
		mode: mode as GameMode,
		cards,
		error: null,
		difficulty: difficulty || 'standard'
	};
};
