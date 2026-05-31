/**
 * メインメニュー（routes/+page.svelte）の統合テスト。
 *
 * 方針（docs/adr/0002-store-less-route-tests.md / 0001）:
 *  - メインメニューは gameStore を駆動しない。守る契約は「ナビゲーション配線 + data prop 描画」:
 *    ① data prop で描画できる、② 各モードカードが正しいモーダルを開く、
 *    ③ 各モーダル選択 / ナビリンクが正しい遷移先で goto を呼ぶ。
 *  - 実モーダル（純粋なコールバック発火器）を駆動し、装飾リーフ KarutaSlideshow
 *    （rAF + Math.random）は __testmocks__ のスタブで越える。
 *  - goto / resolve / $app/stores は src/test/setup.ts の共有モックに依存。旧来の
 *    gameStore / IndexedDB / カードデータのモックはメニュー経路で未使用のため持たない。
 *
 * スコープはナビ配線の退行検知に限定（6本）。a11y・レスポンシブ・ローディング/エラーは
 * 対象外（到達不能 or 別関心）。
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { goto } from '$app/navigation';
import Page from './+page.svelte';
import type { PageData } from './$types';

// 装飾リーフ: rAF アニメ + Math.random + 176 装飾ノードを no-op スタブで越える。
vi.mock(
	'$lib/components/main-menu/KarutaSlideshow.svelte',
	() => import('./__testmocks__/KarutaSlideshow.svelte')
);

// メニューは data.user しか参照しない。user の型だけ PageData に紐付けて保証し（PageData の
// user 型が変われば型エラーで検知される）、描画に不要な Supabase クライアント等は持たず、
// render 呼び出し側で PageData にキャストする。
const PAGE_DATA = { user: null } satisfies Pick<PageData, 'user'>;

function renderMenu() {
	return render(Page, { props: { data: PAGE_DATA as unknown as PageData } });
}

describe('Main Menu Page (routes/+page.svelte)', () => {
	beforeEach(() => {
		// メニューは singleton ストアを持たないため、goto スパイのリセットだけでよい。
		vi.clearAllMocks();
	});

	it('スモーク: data 付きで描画され、3モードカードとナビが表示される', async () => {
		renderMenu();

		// :else 分岐（ローディング解除後）でしか出ない要素 = 初期化完了の透過確認。
		expect(await screen.findByText('モード選択')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: '練習モード' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'ランダムモード' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'タイムアタック' })).toBeInTheDocument();

		expect(screen.getByRole('link', { name: /ランキング/ })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: /設定/ })).toBeInTheDocument();
	});

	it('練習 → モーダル →「全44札を順番に練習」で practice へ遷移する', async () => {
		const user = userEvent.setup();
		renderMenu();

		await user.click(await screen.findByRole('button', { name: '練習モード' }));
		await user.click(await screen.findByRole('button', { name: /全44札を順番に練習/ }));

		expect(goto).toHaveBeenCalledWith('/game?mode=practice');
	});

	it('練習 → モーダル →「特定札で練習」で /practice/specific へ遷移する', async () => {
		const user = userEvent.setup();
		renderMenu();

		await user.click(await screen.findByRole('button', { name: '練習モード' }));
		await user.click(await screen.findByRole('button', { name: /特定札で練習/ }));

		expect(goto).toHaveBeenCalledWith('/practice/specific');
	});

	it('ランダム → 難易度モーダル → 標準 で random へ遷移する', async () => {
		const user = userEvent.setup();
		renderMenu();

		await user.click(await screen.findByRole('button', { name: 'ランダムモード' }));
		await user.click(await screen.findByRole('button', { name: /標準モード/ }));

		expect(goto).toHaveBeenCalledWith('/game?mode=random&difficulty=standard');
	});

	it('タイムアタック → 難易度モーダル → 標準 で timeattack へ遷移する', async () => {
		const user = userEvent.setup();
		renderMenu();

		await user.click(await screen.findByRole('button', { name: 'タイムアタック' }));
		await user.click(await screen.findByRole('button', { name: /標準モード/ }));

		expect(goto).toHaveBeenCalledWith('/game?mode=timeattack&difficulty=standard');
	});

	it('ナビリンク: ランキング / 設定 が正しい遷移先で goto を呼ぶ', async () => {
		const user = userEvent.setup();
		renderMenu();

		await user.click(await screen.findByRole('link', { name: /ランキング/ }));
		expect(goto).toHaveBeenCalledWith('/ranking');

		await user.click(screen.getByRole('link', { name: /設定/ }));
		expect(goto).toHaveBeenCalledWith('/settings');
	});
});
