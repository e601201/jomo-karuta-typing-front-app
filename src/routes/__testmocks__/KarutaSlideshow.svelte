<!--
	かるたスライドショーのテスト用スタブ（no-op）。

	実 KarutaSlideshow.svelte は onMount で requestAnimationFrame の無限アニメーション
	ループを回し、Math.random() で札順をシャッフルし、88×2 枚の装飾カード（実カード
	テキスト入り）を描画する。メインメニュー統合テストが守るのはナビゲーション配線契約で
	あり、この装飾リーフは無関係。実物のまま走らせると非決定・rAF ノイズ・getByText の
	取り違えを招くため、vi.mock で本スタブに差し替える。
	詳細は docs/adr/0002-store-less-route-tests.md。
-->
<div data-testid="karuta-slideshow-mock"></div>
