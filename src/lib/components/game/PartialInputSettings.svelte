<script lang="ts">
	import type { PartialInputConfig, PartialInputPreset } from '$lib/types';

	interface Props {
		config: PartialInputConfig;
		previewText?: string;
		onChange: (config: PartialInputConfig) => void;
	}

	let { config, previewText = '', onChange }: Props = $props();

	// Reactive preview calculation
	let previewRange = $derived(calculatePreviewRange(previewText, config));

	function calculatePreviewRange(text: string, cfg: PartialInputConfig) {
		if (!cfg.enabled || !text) {
			return { target: text, nonTarget: '' };
		}

		const count = Math.min(cfg.characterCount, text.length);

		if (cfg.mode === 'random') {
			// For preview, just show from start with indicator
			return {
				target: text.substring(0, count),
				nonTarget: text.substring(count),
				isRandom: true
			};
		}

		return {
			target: text.substring(0, count),
			nonTarget: text.substring(count),
			isRandom: false
		};
	}

	function handleToggle() {
		onChange({
			...config,
			enabled: !config.enabled
		});
	}

	function handleCharacterCountChange(event: Event) {
		const target = event.target as HTMLInputElement;
		onChange({
			...config,
			characterCount: parseInt(target.value, 10)
		});
	}

	function handleModeChange(mode: 'start' | 'random') {
		onChange({
			...config,
			mode
		});
	}

	function applyPreset(preset: PartialInputPreset) {
		switch (preset) {
			case 'beginner':
				onChange({
					enabled: true,
					characterCount: 5,
					mode: 'start',
					highlightRange: true
				});
				break;

			case 'intermediate':
				onChange({
					enabled: true,
					characterCount: 10,
					mode: 'start',
					highlightRange: true
				});
				break;

			case 'advanced':
				onChange({
					enabled: false,
					characterCount: config.characterCount,
					mode: config.mode,
					highlightRange: true
				});
				break;
		}
	}
</script>

<div data-testid="settings-container" class="space-y-4 rounded-lg bg-white p-6 shadow-md">
	<!-- Toggle Switch -->
	<div class="flex items-center justify-between">
		<label for="partial-toggle" class="text-lg font-medium">部分入力モード</label>
		<button
			id="partial-toggle"
			role="switch"
			aria-checked={config.enabled}
			onclick={handleToggle}
			class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {config.enabled
				? 'bg-blue-600'
				: 'bg-gray-200'}"
		>
			<span
				class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {config.enabled
					? 'translate-x-6'
					: 'translate-x-1'}"
			></span>
		</button>
	</div>

	<!-- Settings (disabled when mode is off) -->
	<div class="{!config.enabled ? 'opacity-50' : ''} space-y-4">
		<!-- Character Count Slider -->
		<div>
			<label for="char-count" class="mb-2 block text-sm font-medium">
				文字数: <span class="font-bold">{config.characterCount}文字</span>
			</label>
			<input
				id="char-count"
				type="range"
				role="slider"
				min="1"
				max="20"
				value={config.characterCount}
				disabled={!config.enabled}
				oninput={handleCharacterCountChange}
				aria-label="入力文字数"
				aria-valuemin={1}
				aria-valuemax={20}
				aria-valuenow={config.characterCount}
				class="w-full"
			/>
			<div class="mt-1 flex justify-between text-xs text-gray-600">
				<span>1</span>
				<span>10</span>
				<span>20</span>
			</div>
		</div>

		<!-- Preset Buttons -->
		<div>
			<p class="mb-2 text-sm font-medium">プリセット:</p>
			<div class="flex gap-2">
				<button
					onclick={() => applyPreset('beginner')}
					disabled={!config.enabled}
					class="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-gray-300"
				>
					初心者
				</button>
				<button
					onclick={() => applyPreset('intermediate')}
					disabled={!config.enabled}
					class="rounded-lg bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600 disabled:cursor-not-allowed disabled:bg-gray-300"
				>
					中級
				</button>
				<button
					onclick={() => applyPreset('advanced')}
					class="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
				>
					上級
				</button>
			</div>
		</div>

		<!-- Mode Selection -->
		<div>
			<p class="mb-2 text-sm font-medium">範囲:</p>
			<div class="flex gap-4">
				<label class="flex items-center">
					<input
						type="radio"
						name="mode"
						value="start"
						checked={config.mode === 'start'}
						disabled={!config.enabled}
						onchange={() => handleModeChange('start')}
						aria-label="先頭から"
					/>
					<span class="ml-2">先頭から</span>
				</label>
				<label class="flex items-center">
					<input
						type="radio"
						name="mode"
						value="random"
						checked={config.mode === 'random'}
						disabled={!config.enabled}
						onchange={() => handleModeChange('random')}
						aria-label="ランダム"
					/>
					<span class="ml-2">ランダム</span>
				</label>
			</div>
		</div>

		<!-- Preview -->
		{#if previewText && config.enabled}
			<div class="rounded-lg bg-gray-50 p-4">
				<p class="mb-2 text-sm font-medium">プレビュー:</p>
				<div data-testid="partial-preview" class="font-mono text-lg">
					{#if previewRange.isRandom}
						<p class="mb-1 text-xs text-gray-600">
							※ ランダムな位置から{config.characterCount}文字
						</p>
					{/if}
					<span data-testid="preview-target" class="text-black">
						{previewRange.target}
					</span>
					<span data-testid="preview-non-target" class="text-gray-400">
						{previewRange.nonTarget}
					</span>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Mobile responsive adjustments */
	@media (max-width: 640px) {
		.space-y-4 {
			@apply flex-col;
		}

		button {
			min-height: 44px;
		}
	}
</style>
