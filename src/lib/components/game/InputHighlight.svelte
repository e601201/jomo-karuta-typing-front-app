<script lang="ts">
	export type InputState = 'pending' | 'correct' | 'incorrect' | 'current';

	interface Props {
		text: string;
		inputStates: InputState[];
		currentPosition: number;
		showRomaji?: boolean;
		romaji?: string;
		romajiStates?: InputState[];
		animateErrors?: boolean;
		colorblindMode?: boolean;
		highContrast?: boolean;
	}

	let {
		text,
		inputStates,
		currentPosition,
		showRomaji = false,
		romaji = '',
		romajiStates = [],
		animateErrors = false,
		colorblindMode = false,
		highContrast = false
	}: Props = $props();

	// Parse hiragana text into proper units (considering multi-character units)
	function parseTextUnits(inputText: string): string[] {
		const units: string[] = [];
		let i = 0;
		
		while (i < inputText.length) {
			const current = inputText[i];
			const next = inputText[i + 1];
			
			// Check for small ya, yu, yo (拗音)
			if (next && (next === 'ゃ' || next === 'ゅ' || next === 'ょ' || next === 'ぁ' || next === 'ぃ' || next === 'ぅ' || next === 'ぇ' || next === 'ぉ')) {
				units.push(current + next);
				i += 2;
			}
			// Check for small tsu (促音)
			else if (current === 'っ') {
				if (next) {
					units.push(current + next);
					i += 2;
				} else {
					units.push(current);
					i++;
				}
			}
			else {
				units.push(current);
				i++;
			}
		}
		
		return units;
	}
	
	// Split text into characters
	const characters = $derived(parseTextUnits(text));
	const romajiCharacters = $derived(romaji.split(''));

	// Get color class for character state
	function getColorClass(state: InputState): string {
		switch (state) {
			case 'correct':
				return 'text-green-500';
			case 'incorrect':
				return 'text-red-500';
			case 'current':
				return 'text-blue-500 font-bold';
			default:
				return 'text-gray-400';
		}
	}

	// Get animation class
	function getAnimationClass(state: InputState, index: number): string {
		let classes = 'transition-colors duration-200';

		if (state === 'incorrect' && animateErrors && index === currentPosition) {
			classes += ' animate-shake';
		}

		return classes;
	}

	// Get ARIA label for accessibility
	function getAriaLabel(char: string, state: InputState): string {
		const stateLabels: Record<InputState, string> = {
			correct: '正解',
			incorrect: '不正解',
			pending: '未入力',
			current: '現在位置'
		};

		return `${char}: ${stateLabels[state]}`;
	}

	// Get text size class based on screen size
	function getTextSizeClass(): string {
		return 'text-2xl md:text-3xl lg:text-5xl';
	}
</script>

<div
	data-testid="highlight-container"
	class="font-mono {getTextSizeClass()} flex flex-wrap items-center justify-center gap-1"
>
	{#if characters.length === 0}
		<!-- Empty state -->
	{:else}
		{#each characters as char, index}
			<span
				data-testid="char-{index}"
				class="relative inline-block {getColorClass(inputStates[index])} {getAnimationClass(
					inputStates[index],
					index
				)} {highContrast ? 'border border-current' : ''}"
				aria-label={getAriaLabel(char, inputStates[index])}
			>
				{char}

				<!-- Colorblind mode icons -->
				{#if colorblindMode}
					{#if inputStates[index] === 'correct'}
						<span class="icon-check absolute -top-2 left-1/2 -translate-x-1/2 transform text-xs"
							>✓</span
						>
					{:else if inputStates[index] === 'incorrect'}
						<span class="icon-cross absolute -top-2 left-1/2 -translate-x-1/2 transform text-xs"
							>✗</span
						>
					{/if}
				{/if}

				<!-- Cursor -->
				{#if index === currentPosition}
					<span
						data-testid="cursor-{index}"
						class="absolute -bottom-1 left-0 h-0.5 w-full animate-pulse bg-blue-500"
					></span>
				{/if}
			</span>
		{/each}
	{/if}
</div>

<!-- Romaji display -->
{#if showRomaji && romaji}
	<div
		data-testid="romaji-container"
		class="mt-2 flex items-center justify-center gap-0.5 font-mono text-lg md:text-xl lg:text-2xl"
	>
		{#each romajiCharacters as romajiChar, index}
			<span
				data-testid="romaji-char-{index}"
				class="{getColorClass(romajiStates[index] || 'pending')} transition-colors duration-200"
			>
				{romajiChar}
			</span>
		{/each}
	</div>
{/if}

<style>
	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-4px);
		}
		75% {
			transform: translateX(4px);
		}
	}

	.animate-shake {
		animation: shake 0.5s ease-in-out;
	}
</style>
