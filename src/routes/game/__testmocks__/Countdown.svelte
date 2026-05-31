<!--
	開始カウントダウンのテスト用スタブ（手動トリガ型）。

	実 Countdown.svelte は setInterval(3×1s) + setTimeout(800ms) の実タイマーで
	約3.8秒かけて onComplete を発火する。統合テストでこれを実時間で待つと遅くフレーキー
	なため、vi.mock で本コンポーネントに差し替える。実タイマーの描画（3→2→1→スタート!）は
	Countdown 単体テストの責務とする。詳細は docs/adr/0001-route-integration-tests.md。

	自動発火ではなく onComplete を呼ぶボタンを描画することで、
	「カウントダウン表示中（ゲームUI未出現）」→ 押下 →「完了でゲームUI出現」の
	両状態をテストから明示的に検証できる。
-->
<script lang="ts">
	// 実 Countdown は duration プロップも受けるが、スタブでは onComplete だけ使う。
	// 余分なプロップ（duration 等）は実行時に無視される。
	interface Props {
		onComplete: () => void;
	}

	let { onComplete }: Props = $props();
</script>

<div data-testid="countdown-mock">
	<button type="button" data-testid="countdown-complete" onclick={onComplete}> complete </button>
</div>
