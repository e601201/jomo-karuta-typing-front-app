<script lang="ts">
	import type { RandomModeDifficulty } from '$lib/types';
	import BlindInputDisplay from './BlindInputDisplay.svelte';

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
		currentRomajiPosition?: number;
		difficulty?: RandomModeDifficulty;
		showHint?: boolean; // ヒント表示フラグ
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
		highContrast = false,
		currentRomajiPosition = 0,
		difficulty = 'standard',
		showHint = false
	}: Props = $props();

	// Parse hiragana text into proper units (considering multi-character units)
	function parseTextUnits(inputText: string): string[] {
		const units: string[] = [];
		let i = 0;

		while (i < inputText.length) {
			const current = inputText[i];
			const next = inputText[i + 1];

			// Check for small ya, yu, yo (拗音)
			if (
				next &&
				(next === 'ゃ' ||
					next === 'ゅ' ||
					next === 'ょ' ||
					next === 'ぁ' ||
					next === 'ぃ' ||
					next === 'ぅ' ||
					next === 'ぇ' ||
					next === 'ぉ')
			) {
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
			} else {
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
				return 'text-gray-200';
			case 'incorrect':
				return 'text-red-500';
			case 'current':
				return 'text-blue-500 font-bold';
			default:
				return 'text-gray-600';
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
		return 'text-xl md:text-2xl lg:text-4xl';
	}

	// Determine if the last input was correct for blind mode
	const isLastInputCorrect = $derived(currentPosition > 0 ? inputStates[currentPosition - 1] === 'correct' : true);
	
	// Get completed text for blind mode
	const completedText = $derived(() => {
		const units = parseTextUnits(text);
		let result = '';
		for (let i = 0; i < currentPosition && i < units.length; i++) {
			if (inputStates[i] === 'correct') {
				result += units[i];
			}
		}
		return result;
	});
	
	// Get current character being typed
	const currentCharacter = $derived(() => {
		const units = parseTextUnits(text);
		if (currentPosition < units.length && inputStates[currentPosition] === 'current') {
			return units[currentPosition];
		}
		return '';
	});
	
	// Get completed romaji for blind mode
	const completedRomaji = $derived(() => {
		let result = '';
		for (let i = 0; i < currentRomajiPosition && i < romajiCharacters.length; i++) {
			// romajiStatesの状態に関わらず、現在位置より前のローマ字を表示
			result += romajiCharacters[i];
		}
		return result;
	});
	
	// Get current romaji being typed
	const currentRomajiChar = $derived(() => {
		// 現在位置のローマ字文字を返す（入力中の場合のみ）
		// romajiStatesが'current'または入力中の場合のみ表示
		return '';  // 一旦空文字を返す（現在入力中の1文字を特別に表示する必要はない）
	});
</script>

{#if difficulty === 'advanced'}
	<!-- 上級者モード：ブラインド入力表示 -->
	<BlindInputDisplay
		totalChars={text.length}
		{currentPosition}
		isCorrect={isLastInputCorrect}
		completedText={completedText()}
		currentChar={currentCharacter()}
		completedRomaji={completedRomaji()}
		currentRomaji={currentRomajiChar()}
		{showHint}
		hintText={text}
	/>
{:else}
	<!-- 通常モード：テキストとハイライト表示 -->
	<div
		data-testid="highlight-container"
		class="font-mono {getTextSizeClass()} flex flex-wrap items-center justify-center gap-1"
	>
		{#if characters.length === 0}
			<!-- Empty state -->
		{:else}
			{#each characters as char, index (index)}
				<span
					data-testid="char-{index}"
					class="relative inline-block {getColorClass(inputStates[index])} {getAnimationClass(
						inputStates[index],
						index
					)} {highContrast ? 'border border-current' : ''}"
					aria-label={getAriaLabel(char, inputStates[index])}
				>
					{char}
				</span>
			{/each}
		{/if}
	</div>

	<!-- Romaji display -->
	{#if showRomaji && romaji}
	<div
		data-testid="romaji-container"
		class="mt-2 flex items-center justify-center gap-0.5 font-mono {getTextSizeClass()}"
	>
		{#each romajiCharacters as romajiChar, index (index)}
			<span
				data-testid="romaji-char-{index}"
				class="relative inline-block {getColorClass(
					romajiStates[index] || 'pending'
				)} transition-colors duration-200"
			>
				{romajiChar.toUpperCase()}

				<!-- Colorblind mode icons for romaji -->
				{#if colorblindMode}
					{#if romajiStates[index] === 'correct'}
						<span class="icon-check absolute -top-2 left-1/2 -translate-x-1/2 transform text-xs"
							>✓</span
						>
					{:else if romajiStates[index] === 'incorrect'}
						<span class="icon-cross absolute -top-2 left-1/2 -translate-x-1/2 transform text-xs"
							>✗</span
						>
					{/if}
				{/if}

				<!-- Cursor for romaji at current input position -->
				{#if index === currentRomajiPosition}
					<span
						data-testid="romaji-cursor-{index}"
						class="absolute -bottom-1 left-0 h-0.5 w-full animate-pulse bg-blue-500"
					></span>
				{/if}
			</span>
		{/each}
	</div>
	{/if}
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
