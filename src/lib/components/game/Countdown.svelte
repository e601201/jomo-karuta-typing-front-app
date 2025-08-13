<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		onComplete: () => void;
		duration?: number;
	}

	let { onComplete, duration = 3 }: Props = $props();

	let countdown = $state(duration);
	let isVisible = $state(true);

	onMount(() => {
		const timer = setInterval(() => {
			countdown--;

			if (countdown <= 0) {
				clearInterval(timer);
				setTimeout(() => {
					isVisible = false;
					onComplete();
				}, 800);
			}
		}, 1000);

		return () => clearInterval(timer);
	});
</script>

{#if isVisible}
	<div class="countdown-overlay">
		<div class="countdown-container">
			{#if countdown > 0}
				<div class="countdown-number" data-testid="countdown-number">
					{countdown}
				</div>
			{:else}
				<div class="countdown-start" data-testid="countdown-start">スタート！</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.countdown-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		animation: fadeIn 0.3s ease-out;
	}

	.countdown-container {
		text-align: center;
		animation: scaleIn 0.3s ease-out;
	}

	.countdown-number {
		font-size: 8rem;
		font-weight: bold;
		color: white;
		text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
		animation: pulse 1s ease-in-out;
		margin-bottom: 1rem;
		font-family: 'Helvetica Neue', Arial, sans-serif;
		line-height: 1;
	}

	.countdown-start {
		font-size: 4rem;
		font-weight: bold;
		color: #22c55e;
		text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
		animation: startPulse 0.5s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes scaleIn {
		from {
			transform: scale(0.5);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	@keyframes pulse {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
		100% {
			transform: scale(1);
		}
	}

	@keyframes startPulse {
		0% {
			transform: scale(0.8);
			opacity: 0;
		}
		50% {
			transform: scale(1.2);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	/* モバイル対応 */
	@media (max-width: 640px) {
		.countdown-number {
			font-size: 6rem;
		}

		.countdown-start {
			font-size: 3rem;
		}
	}
</style>
