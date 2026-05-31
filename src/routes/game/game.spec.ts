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

// #29 配線契約テスト用の短い決定論的 fixture（ん・拗音を避け、完了/進捗を素早く起こす）。
const SHORT_CARDS: KarutaCard[] = [
	{
		id: 'kiku',
		hiragana: 'きく',
		romaji: 'kiku',
		meaning: 'テスト用A',
		category: 'culture',
		difficulty: 'easy'
	},
	{
		id: 'sake',
		hiragana: 'さけ',
		romaji: 'sake',
		meaning: 'テスト用B',
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

// 開始カウントダウン（スタブ）を越えてゲーム開始状態にする共通ヘルパ。
async function startGame(data: GameData = makeData()) {
	const user = userEvent.setup();
	render(Page, { props: { data } });
	await user.click(await screen.findByTestId('countdown-complete'));
	// ゲートが外れ、ライブスコア（accuracy-display）が現れる＝開始済み。
	await screen.findByTestId('accuracy-display');
	return user;
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

	// #29 / ADR 0003: route が守るのは「ルート↔ストアの配線」だけ。
	// 文字色・オーバーレイ内容などの描画は InputHighlight.spec.ts / PauseOverlay.spec.ts が担保し、
	// ここでは再アサートしない。観測は既存の子 testid＋ストア由来のライブスコアで行い、
	// 500ms の赤フラッシュなど時間依存 DOM はアサートしない（ADR 0001 のフレーク回避）。
	describe('ゲームプレイ配線契約 (#29 / ADR 0003)', () => {
		it('正入力: 正しいキーで store のコンボが増え、ライブスコアに伝播する', async () => {
			const user = await startGame(makeData({ cards: SHORT_CARDS }));
			expect(screen.getByTestId('combo-display')).toHaveTextContent('0');

			await user.keyboard('k'); // 「きく」への部分一致（未完了）

			await waitFor(() => expect(screen.getByTestId('combo-display')).toHaveTextContent('1'));
		});

		it('誤入力: コンボが 0 に戻る（ライブスコアの即時シグナル）', async () => {
			const user = await startGame(makeData({ cards: SHORT_CARDS }));

			await user.keyboard('k');
			await waitFor(() => expect(screen.getByTestId('combo-display')).toHaveTextContent('1'));

			await user.keyboard('z'); // 「きく」に対し 'kz' は不正

			// 誤入力の即時・確実な配線シグナルはコンボ 0 リセット。
			// 正確率は store が誤入力時に updateScore へ到達せず（updateInput が早期 return）、
			// 次の正打まで再計算されない遅延仕様のため、ここではアサートしない。
			await waitFor(() => expect(screen.getByTestId('combo-display')).toHaveTextContent('0'));
		});

		it('完全一致: 札を打ち切ると completeCard→次札へ進み、進捗が前進する', async () => {
			const user = await startGame(makeData({ cards: SHORT_CARDS }));
			expect(screen.getByText('1 / 2')).toBeInTheDocument();

			await user.keyboard('kiku'); // 「きく」を完成

			await waitFor(() => expect(screen.getByText('2 / 2')).toBeInTheDocument());
		});

		it('ローマ字ガイド: standard では romaji-container が描画され、ガイドが伝播する', async () => {
			await startGame(makeData({ cards: SHORT_CARDS }));

			expect(await screen.findByTestId('romaji-container')).toBeInTheDocument();
			// 「きく」→ kiku。先頭ローマ字は K。
			expect(screen.getByTestId('romaji-char-0')).toHaveTextContent('K');
		});

		it('入力ハイライト: 正打で char-0 の状態プロップが correct に伝播する', async () => {
			const user = await startGame(makeData({ cards: SHORT_CARDS }));
			expect(screen.getByTestId('char-0')).toHaveAttribute('aria-label', 'き: 未入力');

			await user.keyboard('ki'); // 1ユニット目「き」を確定（札は未完了）

			await waitFor(() =>
				expect(screen.getByTestId('char-0')).toHaveAttribute('aria-label', 'き: 正解')
			);
		});

		it('一時停止/再開: ボタンで pauseGame→オーバーレイ表示、store resume で消滅する', async () => {
			const user = await startGame(makeData({ cards: SHORT_CARDS }));

			await user.click(screen.getByRole('button', { name: '一時停止' }));

			expect(await screen.findByTestId('pause-overlay')).toBeInTheDocument();
			expect(screen.getByText('一時停止中')).toBeInTheDocument();

			// 再開の配線（store→UI）。再開カウントダウン内部は PauseOverlay 単体テストへ委譲。
			gameStore.resumeGame();

			await waitFor(() => expect(screen.queryByTestId('pause-overlay')).not.toBeInTheDocument());
		});

		it('スキップ: ボタンで skipCard→currentIndex が前進し、進捗が進む', async () => {
			const user = await startGame(makeData({ cards: SHORT_CARDS }));
			expect(screen.getByText('1 / 2')).toBeInTheDocument();

			await user.click(screen.getByRole('button', { name: 'スキップ' }));

			await waitFor(() => expect(screen.getByText('2 / 2')).toBeInTheDocument());
		});
	});
});
