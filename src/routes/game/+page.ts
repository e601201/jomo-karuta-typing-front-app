import type { PageLoad } from './$types';
import type { GameMode, KarutaCard, RandomModeDifficulty } from '$lib/types';
import { getKarutaCards } from '$lib/data/karuta-cards';

export const load: PageLoad = async ({ url }) => {
	const mode = url.searchParams.get('mode') || 'practice';
	const resume = url.searchParams.get('resume') === 'true';
	const isFromSpecific = url.searchParams.get('specific') === 'true';
	const difficulty = url.searchParams.get('difficulty') as RandomModeDifficulty | null;

	// Validate mode
	if (!['practice', 'specific', 'random', 'timeattack'].includes(mode)) {
		return {
			error: '無効なゲームモードです',
			mode: null,
			cards: [],
			resume: false,
			isFromSpecific: false,
			difficulty: null
		};
	}

	let cards: KarutaCard[] = [];

	// モードに応じて札を準備
	switch (mode) {
		case 'practice':
			// 練習モード
			if (isFromSpecific) {
				// 特定札練習モードから来た場合は、カードを空配列にする
				// (practiceModeStoreに既に設定済みのため)
				cards = [];
			} else {
				// 通常の練習モード: 全札を順番に
				cards = getKarutaCards();
			}
			break;

		case 'specific':
			// 特定札モード: 選択された札のみ
			const selectedIds = url.searchParams.get('cards')?.split(',') || [];
			cards = getKarutaCards().filter((card) => selectedIds.includes(card.id));
			if (cards.length === 0) {
				cards = getKarutaCards(); // フォールバック
			}
			break;

		default:
			cards = getKarutaCards();
			break;
	}

	return {
		mode: mode as GameMode,
		cards,
		resume,
		error: null,
		isFromSpecific,
		difficulty: difficulty || 'standard'
	};
};
