import type { PageLoad } from './$types';
import type { GameMode, KarutaCard } from '$lib/types';
import { getKarutaCards } from '$lib/data/karuta-cards';

export const load: PageLoad = async ({ url }) => {
	const mode = url.searchParams.get('mode') || 'practice';
	const resume = url.searchParams.get('resume') === 'true';
	const isFromSpecific = url.searchParams.get('specific') === 'true';

	// Validate mode
	if (!['practice', 'specific', 'random'].includes(mode)) {
		return {
			error: '無効なゲームモードです',
			mode: null,
			cards: [],
			resume: false,
			isFromSpecific: false
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
				console.log('+page.ts: practice mode from specific, skipping card load');
			} else {
				// 通常の練習モード: 全札を順番に
				cards = getKarutaCards();
				console.log('+page.ts: practice mode, loaded', cards.length, 'cards');
				console.log('+page.ts: first card:', cards[0]);
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

		case 'random':
			// ランダムモード: 全札をシャッフル
			cards = getKarutaCards().sort(() => Math.random() - 0.5);
			break;
	}

	return {
		mode: mode as GameMode,
		cards,
		resume,
		error: null,
		isFromSpecific
	};
};
