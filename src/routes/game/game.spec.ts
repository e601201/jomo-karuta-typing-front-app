/**
 * ゲーム画面（routes/game/+page.svelte）の統合テスト。
 *
 * 方針（docs/adr/0001-route-integration-tests.md）:
 *  - 実 gameStore を駆動し、末端の副作用だけをモックする（旧来の「ストア丸ごとモック」=
 *    ビューテストは廃止）。狙いはルート↔ストアの契約ズレの捕捉。
 *  - 実タイマー(~3.8s)を持つ開始カウントダウンは __testmocks__/Countdown.svelte の
 *    手動トリガ型スタブで越える（フェイクタイマーは happy-dom/userEvent と噛み合わず不安定）。
 *
 * スコープは最小4本（スモーク / 開始カウントダウン / エラー / ゲーム終了）。入力ハイライト・
 * ローマ字ガイド・進捗バー・ライブスコア・一時停止/再開/スキップ等のゲームプレイ詳細は
 * 検証フックの再導入が必要なため別 issue (#29) に切り出した。再開カウントダウン（用語集:
 * ポーズ解除時の演出。PauseOverlay 内部）は PauseOverlay 単体テストで担保する。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Page from './+page.svelte';
import { gameStore } from '$lib/stores/game';
import type { GameMode, KarutaCard, RandomModeDifficulty } from '$lib/types';

// 画像プリローダ: happy-dom では new Image() の load が発火せず、未モックだと
// startSession（onMount で await）が解決せずハングする。
vi.mock('$lib/utils/image-preloader', () => ({
	ImagePreloader: {
		preloadWithPriority: vi.fn().mockResolvedValue(undefined),
		preloadCardImages: vi.fn().mockResolvedValue(undefined),
		preloadMultipleCards: vi.fn().mockResolvedValue(undefined),
		getLoadedImage: vi.fn()
	}
}));

// 音声: new Audio()/play() 由来の未処理 reject を避けるため no-op 化。
// アロー関数実装は new できない（Reflect.construct がコンストラクタを要求する）ため、
// 構築可能なクラスとしてモックする。
vi.mock('$lib/services/audio/typing-sounds', () => ({
	TypingSoundManager: class {
		playCorrect = vi.fn();
		playIncorrect = vi.fn();
		playComplete = vi.fn();
		playCardReading = vi.fn();
		stopCardReading = vi.fn();
		playFlickCard = vi.fn();
		playGameEnd = vi.fn();
		startBGM = vi.fn();
		stopBGM = vi.fn();
		pauseBGM = vi.fn();
		resumeBGM = vi.fn();
		destroy = vi.fn();
	}
}));

// 開始カウントダウン: 実タイマーを手動トリガ型スタブで越える。
vi.mock('$lib/components/game/Countdown.svelte', () => import('./__testmocks__/Countdown.svelte'));

type GameData = {
	mode: GameMode;
	cards: KarutaCard[];
	error: string | null;
	difficulty?: RandomModeDifficulty;
};

const SAMPLE_CARDS: KarutaCard[] = [
	{
		id: 'tsu',
		hiragana: 'つるまうかたちのぐんまけん',
		romaji: 'tsurumaukatachinogunmaken',
		meaning: 'つる舞う形の群馬県',
		category: 'geography',
		difficulty: 'easy'
	},
	{
		id: 'ne',
		hiragana: 'ねぎとこんにゃくしものめいぶつ',
		romaji: 'negitokonnyakushimonomeibutsu',
		meaning: 'ねぎとこんにゃく下仁田名物',
		category: 'culture',
		difficulty: 'easy'
	}
];

function makeData(overrides: Partial<GameData> = {}): GameData {
	return {
		mode: 'practice',
		cards: SAMPLE_CARDS,
		error: null,
		difficulty: 'standard',
		...overrides
	};
}

describe('Game Page (routes/game/+page.svelte)', () => {
	beforeEach(() => {
		// 実 gameStore は singleton のためテスト間で状態が漏れる。初期状態へ戻す。
		gameStore.resetSession();
		vi.clearAllMocks();
	});

	afterEach(() => {
		// startGameAfterCountdown が張る実タイマーを止め、spy を復元する。
		gameStore.resetSession();
		vi.restoreAllMocks();
	});

	it('スモーク: 描画され、ローディング後に開始カウントダウンが表示される', async () => {
		render(Page, { props: { data: makeData() } });

		// game-container は常に描画される。
		expect(screen.getByTestId('game-container')).toBeInTheDocument();

		// onMount(async) 沈静化後、開始カウントダウン（スタブ）が出る。
		expect(await screen.findByTestId('countdown-mock')).toBeInTheDocument();

		// カウントダウン中はゲームUI（スコア表示）がゲートされている。
		expect(screen.queryByTestId('accuracy-display')).not.toBeInTheDocument();
	});

	it('開始カウントダウン: 完了でカウントダウンが消えゲームが開始される', async () => {
		const startSpy = vi.spyOn(gameStore, 'startGameAfterCountdown');
		const user = userEvent.setup();

		render(Page, { props: { data: makeData() } });

		const completeButton = await screen.findByTestId('countdown-complete');
		await user.click(completeButton);

		// ページの handleCountdownComplete 経由でゲーム開始が呼ばれる。
		await waitFor(() => expect(startSpy).toHaveBeenCalled());

		// カウントダウンが消え、ゲートされていたゲームUIが現れる。
		expect(screen.queryByTestId('countdown-mock')).not.toBeInTheDocument();
		expect(await screen.findByTestId('accuracy-display')).toBeInTheDocument();
	});

	it('エラー: data.error でエラー文言とメインメニューリンクを表示する', async () => {
		render(Page, { props: { data: makeData({ error: '無効なゲームモードです' }) } });

		expect(await screen.findByText('無効なゲームモードです')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'メインメニューに戻る' })).toBeInTheDocument();

		// エラー時はカウントダウンへ進まない。
		expect(screen.queryByTestId('countdown-mock')).not.toBeInTheDocument();
	});

	it('ゲーム終了: セッション終了で終了画面と最終スコアを表示する', async () => {
		render(Page, { props: { data: makeData() } });

		// onMount 沈静化（startSession でセッション生成）を待つ。
		await screen.findByTestId('countdown-mock');

		// 実ストアでセッションを終了 → ページの sessionEnded 判定で完了画面へ。
		gameStore.endSession();

		expect(await screen.findByText('ゲーム終了！')).toBeInTheDocument();
		expect(screen.getByTestId('final-score')).toBeInTheDocument();
	});
});
