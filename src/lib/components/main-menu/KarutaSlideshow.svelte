<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { karutaCards } from '$lib/data/karuta-cards';

	// 初期状態では順序を固定（SSRとクライアントで同じ順序を保証）
	let shuffledYomifuda = [...karutaCards];
	let shuffledTorifuda = [...karutaCards];
	let displayYomifuda = [...shuffledYomifuda, ...shuffledYomifuda];
	let displayTorifuda = [...shuffledTorifuda, ...shuffledTorifuda];

	let yomifudaRef: HTMLDivElement;
	let torifudaRef: HTMLDivElement;
	let animationId: number;
	let yomifudaScrollPosition = 0;
	let torifudaScrollPosition = 0;
	let isPaused = false;

	// アニメーション設定
	const SCROLL_SPEED = 0.5; // ピクセル/フレーム
	let YOMIFUDA_CARD_WIDTH = 130; // 読み札の幅 + 間隔
	let TORIFUDA_CARD_WIDTH = 120; // 取り札の幅 + 間隔
	let YOMIFUDA_TOTAL_WIDTH = shuffledYomifuda.length * YOMIFUDA_CARD_WIDTH;
	let TORIFUDA_TOTAL_WIDTH = shuffledTorifuda.length * TORIFUDA_CARD_WIDTH;

	onMount(() => {
		// クライアント側でのみランダム化を実行
		shuffledYomifuda = [...karutaCards].sort(() => Math.random() - 0.5);
		shuffledTorifuda = [...karutaCards].sort(() => Math.random() - 0.5);
		displayYomifuda = [...shuffledYomifuda, ...shuffledYomifuda];
		displayTorifuda = [...shuffledTorifuda, ...shuffledTorifuda];
		YOMIFUDA_TOTAL_WIDTH = shuffledYomifuda.length * YOMIFUDA_CARD_WIDTH;
		TORIFUDA_TOTAL_WIDTH = shuffledTorifuda.length * TORIFUDA_CARD_WIDTH;

		startAnimation();
	});

	onDestroy(() => {
		if (animationId) {
			cancelAnimationFrame(animationId);
		}
	});

	function startAnimation() {
		// 取り札の初期位置を右端に設定（負の値で右側から開始）
		torifudaScrollPosition = -TORIFUDA_TOTAL_WIDTH;

		function animate() {
			if (!isPaused) {
				// 読み札は右から左へ（既存のまま）
				yomifudaScrollPosition += SCROLL_SPEED;

				// 取り札は左から右へ（値を増やして右へ移動）
				torifudaScrollPosition += SCROLL_SPEED;

				// 読み札: 1セット分スクロールしたらリセット
				if (yomifudaScrollPosition >= YOMIFUDA_TOTAL_WIDTH) {
					yomifudaScrollPosition = 0;
				}

				// 取り札: 右端に達したらリセット（左端から再開）
				if (torifudaScrollPosition >= 0) {
					torifudaScrollPosition = -TORIFUDA_TOTAL_WIDTH;
				}

				if (yomifudaRef) {
					yomifudaRef.style.transform = `translateX(-${yomifudaScrollPosition}px)`;
				}

				if (torifudaRef) {
					torifudaRef.style.transform = `translateX(${torifudaScrollPosition}px)`;
				}
			}

			animationId = requestAnimationFrame(animate);
		}

		animate();
	}

	function handleMouseEnter() {
		isPaused = true;
	}

	function handleMouseLeave() {
		isPaused = false;
	}
</script>

<div class="karuta-slideshow-container">
	<!-- 取り札（上段、左から右へ） -->
	<div class="karuta-slideshow-wrapper torifuda-wrapper">
		<div
			class="karuta-slideshow"
			bind:this={torifudaRef}
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
			role="region"
			aria-label="取り札のスライドショー"
		>
			{#each displayTorifuda as card, index (card.id + '-torifuda-' + index)}
				<div class="karuta-card torifuda-card" data-nosnippet>
					<img
						src={card.images?.torifuda || `/images/karuta/torifuda/${card.id}.webp`}
						alt={`取り札: ${card.id}`}
						loading="lazy"
						class="karuta-image torifuda-image"
					/>
				</div>
			{/each}
		</div>
	</div>

	<!-- 読み札（下段、右から左へ） -->
	<div class="karuta-slideshow-wrapper yomifuda-wrapper">
		<div
			class="karuta-slideshow"
			bind:this={yomifudaRef}
			onmouseenter={handleMouseEnter}
			onmouseleave={handleMouseLeave}
			role="region"
			aria-label="読み札のスライドショー"
		>
			{#each displayYomifuda as card, index (card.id + '-yomifuda-' + index)}
				<div class="karuta-card yomifuda-card" data-nosnippet>
					<img
						src={card.images?.yomifuda || `/images/karuta/yomifuda/${card.id}.webp`}
						alt={card.hiragana}
						loading="lazy"
						class="karuta-image yomifuda-image"
					/>
				</div>
			{/each}
		</div>
	</div>

	<!-- グラデーションマスク（左右のフェード効果） -->
	<div class="gradient-mask gradient-mask-left"></div>
	<div class="gradient-mask gradient-mask-right"></div>
</div>

<style>
	.karuta-slideshow-container {
		position: relative;
		width: 100%;
		height: 280px; /* 2段分の高さ */
		overflow: hidden;
		margin: 1.5rem 0;
	}

	.karuta-slideshow-wrapper {
		position: absolute;
		width: 100%;
		height: 130px; /* 各段の高さ */
		display: flex;
		align-items: center;
		overflow: hidden;
	}

	.torifuda-wrapper {
		top: 0;
	}

	.yomifuda-wrapper {
		bottom: 0;
	}

	.karuta-slideshow {
		display: flex;
		gap: 1rem;
		transition: transform 0.1s linear;
		will-change: transform;
	}

	.karuta-card {
		flex-shrink: 0;
		width: 100px; /* カードの幅 */
		height: 120px; /* カードの高さ */
		position: relative;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
		cursor: pointer;
	}

	.karuta-card:hover {
		transform: translateY(-5px) scale(1.05);
		box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
		z-index: 10;
	}

	.karuta-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* 取り札のスタイル調整 */
	.torifuda-card {
		width: 90px; /* 幅 */
		height: 108px; /* 縦横比を維持 */
	}

	.torifuda-image {
		object-fit: contain; /* coverからcontainに戻して見切れを防ぐ */
	}

	/* グラデーションマスク */
	.gradient-mask {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 100px;
		pointer-events: none;
		z-index: 5;
	}

	.gradient-mask-left {
		left: 0;
		background: linear-gradient(
			to right,
			rgba(248, 254, 247, 1) 0%,
			rgba(248, 254, 247, 0.8) 30%,
			rgba(248, 254, 247, 0) 100%
		);
	}

	.gradient-mask-right {
		right: 0;
		background: linear-gradient(
			to left,
			rgba(248, 254, 247, 1) 0%,
			rgba(248, 254, 247, 0.8) 30%,
			rgba(248, 254, 247, 0) 100%
		);
	}

	/* レスポンシブ対応 */
	@media (max-width: 640px) {
		.karuta-slideshow-container {
			height: 220px; /* 2段分に調整 */
		}

		.karuta-slideshow-wrapper {
			height: 100px;
		}

		.karuta-card {
			width: 75px;
			height: 90px;
		}

		.torifuda-card {
			width: 70px;
			height: 84px;
		}

		.gradient-mask {
			width: 60px;
		}
	}

	/* アニメーションの滑らかさを向上 */
	@media (prefers-reduced-motion: reduce) {
		.karuta-slideshow {
			animation: none !important;
		}

		.karuta-card:hover {
			transform: none;
		}
	}
</style>
