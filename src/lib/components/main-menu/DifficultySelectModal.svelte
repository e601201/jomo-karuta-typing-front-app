<script lang="ts">
	import type { RandomModeDifficulty } from '$lib/types';

	interface Props {
		show: boolean;
		onClose: () => void;
		onSelect: (difficulty: RandomModeDifficulty) => void;
	}

	let { show, onClose, onSelect }: Props = $props();

	function handleSelect(difficulty: RandomModeDifficulty) {
		onSelect(difficulty);
		onClose();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

{#if show}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="animate-fadeIn fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={handleBackdropClick}
	>
		<div class="animate-scaleIn w-full max-w-md rounded-lg bg-white p-6">
			<h2 class="mb-6 text-center text-2xl font-bold text-gray-900">難易度を選択</h2>

			<div class="space-y-4">
				<button
					onclick={() => handleSelect('beginner')}
					class="group w-full rounded-lg border-2 border-green-200 p-4 text-left transition-all hover:border-green-400 hover:bg-green-50"
				>
					<div class="flex items-start gap-3">
						<span class="text-2xl">🔰</span>
						<div class="flex-1">
							<h3 class="text-lg font-semibold text-gray-900 group-hover:text-green-600">
								初心者モード
							</h3>
							<p class="mt-1 text-sm text-gray-600">キーワードで練習</p>
							<p class="mt-1 text-xs text-gray-500">短い読み札（5-10文字程度）</p>
						</div>
					</div>
				</button>

				<button
					onclick={() => handleSelect('standard')}
					class="group w-full rounded-lg border-2 border-blue-200 p-4 text-left transition-all hover:border-blue-400 hover:bg-blue-50"
				>
					<div class="flex items-start gap-3">
						<span class="text-2xl">📖</span>
						<div class="flex-1">
							<h3 class="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
								標準モード
							</h3>
							<p class="mt-1 text-sm text-gray-600">すべての読み札</p>
							<p class="mt-1 text-xs text-gray-500">通常の読み札（13-19文字）</p>
						</div>
					</div>
				</button>

				<button
					onclick={() => handleSelect('advanced')}
					class="group w-full rounded-lg border-2 border-red-200 p-4 text-left transition-all hover:border-red-400 hover:bg-red-50"
				>
					<div class="flex items-start gap-3">
						<span class="text-2xl">⚡</span>
						<div class="flex-1">
							<h3 class="text-lg font-semibold text-gray-900 group-hover:text-red-600">
								上級者モード
							</h3>
							<p class="mt-1 text-sm text-gray-600">競技かるた式</p>
							<p class="mt-1 text-xs text-red-600">
								取り札のみ表示・読み札の暗記必須
							</p>
						</div>
					</div>
				</button>
			</div>

			<button
				onclick={onClose}
				class="mt-6 w-full py-2 text-sm text-gray-600 transition-colors hover:text-gray-800"
			>
				キャンセル
			</button>
		</div>
	</div>
{/if}

<style>
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
			transform: scale(0.9);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.animate-fadeIn {
		animation: fadeIn 0.2s ease-out;
	}

	.animate-scaleIn {
		animation: scaleIn 0.2s ease-out;
	}
</style>
