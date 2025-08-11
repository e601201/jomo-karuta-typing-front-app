<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { karutaCards } from '$lib/data/karuta-cards';

	// カルタカードをランダムに並べ替えて重複させる（スムーズなループのため）
	const shuffledYomifuda = [...karutaCards].sort(() => Math.random() - 0.5);
	const shuffledTorifuda = [...karutaCards].sort(() => Math.random() - 0.5);
	// 2セット用意してシームレスなループを実現
	const displayYomifuda = [...shuffledYomifuda, ...shuffledYomifuda];
	const displayTorifuda = [...shuffledTorifuda, ...shuffledTorifuda];

	let yomifudaRef: HTMLDivElement;
	let torifudaRef: HTMLDivElement;
	let animationId: number;
	let yomifudaScrollPosition = 0;
	let torifudaScrollPosition = 0;
	let isPaused = false;

	// アニメーション設定
	const SCROLL_SPEED = 0.5; // ピクセル/フレーム
	const YOMIFUDA_CARD_WIDTH = 170; // 読み札の幅 + 間隔（120→170に拡大）
	const TORIFUDA_CARD_WIDTH = 160; // 取り札の幅 + 間隔（120→160に拡大）
	const YOMIFUDA_TOTAL_WIDTH = shuffledYomifuda.length * YOMIFUDA_CARD_WIDTH;
	const TORIFUDA_TOTAL_WIDTH = shuffledTorifuda.length * TORIFUDA_CARD_WIDTH;

	onMount(() => {
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
				<div class="karuta-card torifuda-card">
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
				<div class="karuta-card yomifuda-card">
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
		height: 400px; /* 2段分の高さを拡大 300px → 400px */
		overflow: hidden;
		margin: 1.5rem 0;
	}

	.karuta-slideshow-wrapper {
		position: absolute;
		width: 100%;
		height: 190px; /* 各段の高さを拡大 140px → 190px */
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
		width: 150px; /* 100px → 150px に拡大 */
		height: 180px; /* 130px → 180px に拡大 */
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
		width: 140px; /* 幅は140pxのまま */
		height: 168px; /* 読み札と同じ縦横比（140 * 1.2 = 168）に修正 */
	}

	.torifuda-image {
		object-fit: contain; /* coverからcontainに戻して見切れを防ぐ */
	}

	.karuta-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
		padding: 0.5rem;
		display: flex;
		justify-content: center;
		align-items: flex-end;
	}

	.karuta-id {
		color: white;
		font-weight: bold;
		font-size: 0.875rem;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
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
			height: 320px; /* 2段分に調整 240px → 320px */
		}

		.karuta-slideshow-wrapper {
			height: 150px; /* 110px → 150px */
		}

		.karuta-card {
			width: 110px; /* 80px → 110px */
			height: 140px; /* 104px → 140px */
		}

		.torifuda-card {
			width: 110px; /* 幅は110px */
			height: 132px; /* 読み札と同じ縦横比（110 * 1.2 = 132）に修正 */
		}

		.karuta-id {
			font-size: 0.875rem; /* 少し大きく */
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
