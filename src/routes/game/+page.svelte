<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { gameStore } from '$lib/stores/game';
	import { practiceModeStore } from '$lib/stores/practice-mode';
	import { InputValidator } from '$lib/services/typing/input-validator';
	import { LocalStorageService } from '$lib/services/storage/local-storage';
	import type { GameMode, KarutaCard } from '$lib/types';
	
	// Page data from +page.ts
	interface Props {
		data: {
			mode: GameMode;
			cards: KarutaCard[];
			resume: boolean;
			error: string | null;
		};
	}
	
	let { data }: Props = $props();

	// Components
	import CardDisplay from '$lib/components/game/CardDisplay.svelte';
	import InputDisplay from '$lib/components/game/InputDisplay.svelte';
	import InputHighlight from '$lib/components/game/InputHighlight.svelte';
	import ProgressBar from '$lib/components/game/ProgressBar.svelte';
	import ScoreBoard from '$lib/components/game/ScoreBoard.svelte';
	import GameControls from '$lib/components/game/GameControls.svelte';
	import PauseOverlay from '$lib/components/game/PauseOverlay.svelte';

	// State
	let gameMode: GameMode | null = $state(null);
	let shouldContinue = $state(false);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let showExitConfirm = $state(false);
	let isGameComplete = $state(false);

	// Game state from store
	let currentCard = $state<KarutaCard | null>(null);
	let cardIndex = $state(0);
	let totalCards = $state(44);
	let inputPosition = $state(0);
	let mistakes = $state(0);
	let score = $state<any>({});
	let isPaused = $state(false);
	let elapsedTime = $state(0);
	let pauseCount = $state(0);
	let totalPauseTime = $state(0);

	// Input validation
	let validator: InputValidator | null = null;
	let romajiGuide = $state('');
	
	// Debug reactive value
	$effect(() => {
		if (currentCard) {
			console.log('$effect: currentCard is now:', currentCard.id, currentCard.hiragana);
		} else {
			console.log('$effect: currentCard is now null');
		}
	});
	let inputProgress = $state(0);
	let inputStates = $state<Array<'pending' | 'correct' | 'incorrect'>>([]);
	let romajiStates = $state<Array<'pending' | 'correct' | 'incorrect'>>([]);
	let currentInput = $state('');
	let showError = $state(false);

	// Store subscription
	let unsubscribe: (() => void) | null = null;

	onMount(async () => {
		console.log('onMount started, data:', data);
		try {
			// Check for error in page data
			if (data.error) {
				console.log("data.error", data.error);
				error = data.error;
				isLoading = false;
				return;
			}

			// Use data from +page.ts
			gameMode = data.mode;
			shouldContinue = data.resume;
			totalCards = data.cards?.length || 0;
			console.log('gameMode:', gameMode, 'shouldContinue:', shouldContinue, 'totalCards:', totalCards);

			// Initialize game
			await initializeGame();

			// Subscribe to store - ONLY for non-practice modes
			if (gameMode !== 'practice') {
				unsubscribe = gameStore.gameStore.subscribe((state) => {
					currentCard = state.cards.current;
					cardIndex = state.cards.currentIndex;
					inputPosition = state.input.position;
					mistakes = state.input.mistakes;
					score = state.score;
					isPaused = state.timer.isPaused;
					elapsedTime = state.timer.elapsedTime;
					pauseCount = state.timer.pauseCount || 0;
					totalPauseTime = state.timer.totalPauseTime || 0;
					currentInput = state.input.current;

					// Update validator if card changed
					if (currentCard && !validator) {
						validator = new InputValidator(currentCard.hiragana);
						updateRomajiGuide();
						initializeInputStates();
					}

					// Check if game is complete
					if (state.cards.completed.length === totalCards && state.session?.isActive) {
						isGameComplete = true;
					}
				});
			}

			// Setup keyboard handler
			if (typeof window !== 'undefined') {
				document.addEventListener('keydown', handleKeydown);
			}

			isLoading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'ゲームの初期化に失敗しました';
			isLoading = false;
		}
	});

	onDestroy(() => {
		if (unsubscribe) unsubscribe();
		if (typeof window !== 'undefined') {
			document.removeEventListener('keydown', handleKeydown);
		}

		// Save progress before leaving
		if (!isGameComplete) {
			gameStore.endSession();
		}
	});

	async function initializeGame() {
		console.log('initializeGame started');
		// Use cards from page data
		const cards = data.cards;
		console.log('cards from data:', cards?.length, 'first card:', cards?.[0]);
		
		if (!cards || cards.length === 0) {
			console.error('No cards available');
			error = 'カードデータの読み込みに失敗しました';
			isLoading = false;
			return;
		}

		// Initialize based on mode
		if (gameMode === 'practice') {
			console.log('Initializing practice mode');
			// Use practice mode store
			const storage = new LocalStorageService();
			storage.initialize();
			
			if (shouldContinue) {
				console.log('Resuming session');
				await practiceModeStore.resumeFromSession(cards, storage);
			} else {
				console.log('Starting new session');
				practiceModeStore.initialize(cards, storage);
			}
			
			// Subscribe to practice mode store
			unsubscribe = practiceModeStore.subscribe((state) => {
				console.log('Practice mode store update:', {
					currentIndex: state.currentIndex,
					cardsLength: state.cards?.length,
					currentCard: state.cards?.[state.currentIndex],
					firstCard: state.cards?.[0]
				});
				
				// Check if game is complete (all cards have been processed)
				if (state.currentIndex >= state.cards.length && state.cards.length > 0) {
					console.log('Practice mode complete! currentIndex:', state.currentIndex, 'total:', state.cards.length);
					isGameComplete = true;
					practiceModeStore.complete();
					return;
				}
				
				// Update state values
				const newCard = state.cards?.[state.currentIndex] || null;
				console.log('Setting currentCard to:', newCard);
				
				// Update all state values - directly assign without any async operations
				if (newCard) {
					currentCard = newCard;
					console.log('currentCard set to:', currentCard);
				}
				cardIndex = state.currentIndex;
				totalCards = state.cards?.length || 0;
				mistakes = state.statistics?.mistakes || 0;
				score = {
					total: state.statistics.totalKeystrokes,
					accuracy: state.statistics.totalKeystrokes > 0 
						? (state.statistics.correctKeystrokes / state.statistics.totalKeystrokes) * 100 
						: 100,
					speed: practiceModeStore.calculateWPM(),
					combo: state.statistics.currentCombo,
					maxCombo: state.statistics.maxCombo
				};
				
				// Update validator if card changed
				if (currentCard && (!validator || validator.getTarget() !== currentCard.hiragana.replace(/\s/g, ''))) {
					const targetText = currentCard.hiragana.replace(/\s/g, '');
					validator = new InputValidator();
					validator.setTarget(targetText);
					updateRomajiGuide();
					initializeInputStates();
				}
				
				// Set loading to false only after updating all values
				if (state.cards && state.cards.length > 0) {
					console.log('Setting isLoading to false');
					isLoading = false;
				}
			});
		} else {
			// Use regular game store for other modes
			gameStore.startSession(gameMode!, cards);
			
			// First card is already loaded by startSession
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (isPaused || isGameComplete || !currentCard) return;

		// Prevent default for game keys
		if (event.key.length === 1 || event.key === 'Backspace') {
			event.preventDefault();
		}

		// Handle input
		if (event.key === 'Backspace') {
			handleBackspace();
		} else if (event.key.length === 1 && /^[a-zA-Z]$/.test(event.key)) {
			handleCharacterInput(event.key.toLowerCase());
		} else if (event.key === 'Escape') {
			handlePause();
		}
	}

	// Track completed characters count 
	let completedHiraganaCount = $state(0);
	
	// Parse hiragana text into typing units (considering multi-character units like きゃ、しゅ)
	function parseHiraganaUnits(text: string): string[] {
		const units: string[] = [];
		let i = 0;
		
		while (i < text.length) {
			const current = text[i];
			const next = text[i + 1];
			
			// Check for small ya, yu, yo (拗音)
			if (next && (next === 'ゃ' || next === 'ゅ' || next === 'ょ' || next === 'ぁ' || next === 'ぃ' || next === 'ぅ' || next === 'ぇ' || next === 'ぉ')) {
				units.push(current + next);
				i += 2;
			}
			// Check for small tsu (促音)
			else if (current === 'っ') {
				// Small tsu is usually typed with the next consonant doubled
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
	
	function handleCharacterInput(char: string) {
		if (!validator || !currentCard) return;

		const newInput = currentInput + char;
		const targetText = currentCard.hiragana.replace(/\s/g, '');
		
		console.log(`Input: "${newInput}", Target: "${targetText}"`);
		
		// Validate the entire input string
		const result = validator.validateInput(targetText, newInput);

		if (result.isValid) {
			// Update the current input
			currentInput = newInput;
			
			// Parse hiragana more carefully for multi-character units
			const hiraganaUnits = parseHiraganaUnits(targetText);
			let completedCount = 0;
			let partiallyCompleteIndex = -1;
			let tempInput = newInput;
			
			for (let i = 0; i < hiraganaUnits.length; i++) {
				const unit = hiraganaUnits[i];
				const patterns = validator.getRomajiPatterns(unit);
				let matched = false;
				let partial = false;
				
				// Special handling for 'ん'
				if (unit === 'ん') {
					const isLastChar = i === hiraganaUnits.length - 1;
					
					if (tempInput === 'n') {
						// Just 'n' - always keep as partial
						partial = true;
						partiallyCompleteIndex = i;
					} else if (tempInput.startsWith('nn')) {
						// 'nn' always completes 'ん'
						completedCount++;
						tempInput = tempInput.slice(2);
						matched = true;
					} else if (tempInput.startsWith('n') && tempInput.length > 1) {
						const charAfterN = tempInput[1];
						
						if (isLastChar) {
							// Last character is 'ん' - must use 'nn', so this is invalid
							// Keep as partial, waiting for second 'n'
							partial = true;
							partiallyCompleteIndex = i;
						} else {
							// Not last character - check if 'n' can be accepted
							const nextUnit = hiraganaUnits[i + 1];
							const nextPatterns = validator.getRomajiPatterns(nextUnit);
							
							// Check if next hiragana can start with n + charAfterN
							const canStartWithN = nextPatterns.some(p => p.startsWith('n' + charAfterN));
							
							if (!canStartWithN && charAfterN !== 'n') {
								// This 'n' must be 'ん', complete it
								completedCount++;
								tempInput = tempInput.slice(1);
								matched = true;
							} else {
								// Ambiguous or waiting for 'nn'
								partial = true;
								partiallyCompleteIndex = i;
							}
						}
					}
				} else {
					// Normal character matching
					for (const pattern of patterns) {
						if (tempInput.startsWith(pattern)) {
							// This hiragana is complete
							completedCount++;
							tempInput = tempInput.slice(pattern.length);
							matched = true;
							break;
						}
					}
				}
				
				// Check for partial match if not completely matched
				if (!matched && !partial && tempInput.length > 0) {
					for (const pattern of patterns) {
						if (pattern.startsWith(tempInput)) {
							// We're in the middle of typing this character
							partial = true;
							partiallyCompleteIndex = i;
							break;
						}
					}
					
					if (!partial) {
						break; // No match at all
					}
				}
				
				if (!matched && !partial) {
					break;
				}
			}
			
			// Update highlight states
			for (let i = 0; i < hiraganaUnits.length; i++) {
				if (i < completedCount) {
					inputStates[i] = 'correct';
				} else if (i === partiallyCompleteIndex) {
					inputStates[i] = 'pending'; // Show as currently being typed
				} else {
					inputStates[i] = 'pending';
				}
			}
			
			completedHiraganaCount = completedCount;
			
			// Update store based on mode
			if (gameMode === 'practice') {
				practiceModeStore.processKeystroke(true);
			} else {
				gameStore.updateInput(newInput);
			}

			if (result.isComplete) {
				handleCardComplete();
			}

			showError = false;
		} else {
			// Show error
			showError = true;
			
			// Parse hiragana units for error highlighting
			const hiraganaUnits = parseHiraganaUnits(targetText);
			
			// Find which character is being typed incorrectly
			let errorIndex = completedHiraganaCount;
			for (let i = 0; i < hiraganaUnits.length; i++) {
				if (i < completedHiraganaCount) {
					inputStates[i] = 'correct';
				} else if (i === completedHiraganaCount) {
					inputStates[i] = 'incorrect';
					errorIndex = i;
				} else {
					inputStates[i] = 'pending';
				}
			}
			
			mistakes++;
			
			// Update store based on mode
			if (gameMode === 'practice') {
				practiceModeStore.processKeystroke(false);
			} else {
				gameStore.updateInput(currentInput); // Keep previous input
			}

			// Reset error indicator after 500ms
			setTimeout(() => {
				showError = false;
				if (errorIndex < inputStates.length) {
					inputStates[errorIndex] = 'pending';
				}
			}, 500);
		}
	}

	function handleBackspace() {
		if (currentInput.length > 0) {
			currentInput = currentInput.slice(0, -1);
			
			// Recalculate completed characters
			const targetText = currentCard?.hiragana.replace(/\s/g, '') || '';
			const hiraganaUnits = parseHiraganaUnits(targetText);
			let completedCount = 0;
			let partiallyCompleteIndex = -1;
			let tempInput = currentInput;
			
			for (let i = 0; i < hiraganaUnits.length; i++) {
				const unit = hiraganaUnits[i];
				const patterns = validator?.getRomajiPatterns(unit) || [];
				let matched = false;
				let partial = false;
				
				// Special handling for 'ん'
				if (unit === 'ん') {
					const isLastChar = i === hiraganaUnits.length - 1;
					
					if (tempInput === 'n') {
						// Just 'n' - keep as partial
						partial = true;
						partiallyCompleteIndex = i;
					} else if (tempInput.startsWith('nn')) {
						// 'nn' completes 'ん'
						completedCount++;
						tempInput = tempInput.slice(2);
						matched = true;
					} else if (tempInput.startsWith('n') && tempInput.length > 1) {
						const charAfterN = tempInput[1];
						
						if (isLastChar) {
							// Last character must be 'nn'
							partial = true;
							partiallyCompleteIndex = i;
						} else {
							// Check if next hiragana could start with this
							const nextUnit = hiraganaUnits[i + 1];
							const nextPatterns = validator?.getRomajiPatterns(nextUnit) || [];
							const canStartWithN = nextPatterns.some(p => p.startsWith('n' + charAfterN));
							
							if (!canStartWithN && charAfterN !== 'n') {
								// This 'n' is 'ん'
								completedCount++;
								tempInput = tempInput.slice(1);
								matched = true;
							} else {
								// Ambiguous
								partial = true;
								partiallyCompleteIndex = i;
							}
						}
					}
				} else {
					// Normal matching
					for (const pattern of patterns) {
						if (tempInput.startsWith(pattern)) {
							completedCount++;
							tempInput = tempInput.slice(pattern.length);
							matched = true;
							break;
						}
					}
				}
				
				if (!matched && !partial && tempInput.length > 0) {
					for (const pattern of patterns) {
						if (pattern.startsWith(tempInput)) {
							partial = true;
							partiallyCompleteIndex = i;
							break;
						}
					}
				}
				
				if (!matched && !partial) {
					break;
				}
			}
			
			completedHiraganaCount = completedCount;
			
			// Update input states
			for (let i = 0; i < hiraganaUnits.length; i++) {
				if (i < completedCount) {
					inputStates[i] = 'correct';
				} else if (i === partiallyCompleteIndex) {
					inputStates[i] = 'current';
				} else {
					inputStates[i] = 'pending';
				}
			}
			
			if (gameMode === 'practice') {
				// No need to update practice mode store for backspace
			} else {
				gameStore.updateInput(currentInput);
			}
			updateInputProgress();
		}
	}

	function handleCardComplete() {
		console.log('Card complete! Moving to next card...');
		
		// Reset input state BEFORE moving to next card
		inputPosition = 0;
		currentInput = '';
		inputProgress = 0;
		completedHiraganaCount = 0;
		
		if (gameMode === 'practice') {
			// Move to next card in practice mode
			console.log('Calling practiceModeStore.nextCard');
			practiceModeStore.nextCard(true);
			// Note: validator will be updated in the subscription callback
		} else {
			gameStore.completeCard();
			// Move to next card
			if (cardIndex < totalCards - 1) {
				gameStore.nextCard();
			}
		}
		
		// Don't reset validator here - let the subscription handle it
		console.log('Card complete handler finished');
	}

	function updateRomajiGuide() {
		if (!validator || !currentCard) return;
		const targetText = currentCard.hiragana.replace(/\s/g, '');
		const patterns = validator.getRomajiPatterns(targetText);
		romajiGuide = patterns[0] || '';
	}

	function updateInputProgress() {
		if (!currentCard || !romajiGuide) return;
		inputProgress = (inputPosition / romajiGuide.length) * 100;
	}

	function handlePause() {
		if (isPaused) {
			gameStore.resumeGame();
		} else {
			gameStore.pauseGame();
		}
	}

	function handleResumeFromOverlay(options?: { skipCountdown?: boolean }) {
		gameStore.resumeGame();
	}

	function handleSkip() {
		if (cardIndex < totalCards - 1) {
			gameStore.nextCard();

			// Reset input state
			validator = null;
			inputStates = [];
			romajiStates = [];
			inputPosition = 0;
			currentInput = '';
			romajiGuide = '';
			inputProgress = 0;
		}
	}

	function handleExit() {
		showExitConfirm = true;
	}

	function confirmExit() {
		gameStore.endSession();
		goto('/');
	}

	function cancelExit() {
		showExitConfirm = false;
	}

	function formatTime(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	function initializeInputStates() {
		if (!currentCard) return;
		const targetText = currentCard.hiragana.replace(/\s/g, '');
		const hiraganaUnits = parseHiraganaUnits(targetText);
		inputStates = new Array(hiraganaUnits.length).fill('pending');
		romajiStates = new Array(romajiGuide.length).fill('pending');
	}

	function updateRomajiStates(hiraganaPosition: number, isCorrect: boolean) {
		if (!romajiGuide) return;

		// Simple mapping - can be improved with actual romaji mapping
		const romajiPerChar = Math.ceil(romajiGuide.length / inputStates.length);
		const startIdx = hiraganaPosition * romajiPerChar;
		const endIdx = Math.min(startIdx + romajiPerChar, romajiGuide.length);

		for (let i = startIdx; i < endIdx; i++) {
			romajiStates[i] = isCorrect ? 'correct' : 'pending';
		}
	}
</script>

<svelte:head>
	<title>タイピングゲーム - 上毛カルタ</title>
</svelte:head>

<main class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
	<div data-testid="game-container" class="container mx-auto max-w-4xl flex-col px-4 py-8">
		{#if isLoading}
			<!-- Loading State -->
			<div class="flex min-h-[400px] items-center justify-center">
				<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
				<p class="ml-4">ゲームを準備中...</p>
			</div>
		{:else if error}
			<!-- Error State -->
			<div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
				<p class="mb-4 text-red-600">{error}</p>
				<a href="/" class="text-blue-600 hover:underline">メインメニューに戻る</a>
			</div>
		{:else if isGameComplete}
			<!-- Game Complete -->
			<div class="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
				<h2 class="mb-4 text-3xl font-bold text-green-800">ゲーム完了！</h2>
				<div data-testid="final-score" class="mb-6">
					<p class="text-xl">スコア: {score.total}</p>
					<p>正確率: {score.accuracy}%</p>
					<p>WPM: {score.speed}</p>
					<p>最大コンボ: {score.maxCombo}</p>
				</div>
				<button
					onclick={() => goto('/')}
					class="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
				>
					メインメニューに戻る
				</button>
			</div>
		{:else}
			<!-- Game Header -->
			<header class="mb-6 rounded-lg bg-white p-4 shadow-md">
				<div class="flex items-center justify-between">
					<div class="text-sm text-gray-600">
						進捗: <span class="font-bold">{cardIndex + 1} / {totalCards}</span>
					</div>
					<div class="text-sm text-gray-600">
						時間: <span class="font-bold">{formatTime(elapsedTime)}</span>
					</div>
					<div data-testid="wpm-display" class="text-sm text-gray-600">
						WPM: <span class="font-bold">{score.speed || 0}</span>
					</div>
				</div>
			</header>

			<!-- Enhanced Pause Overlay -->
			<PauseOverlay
				{isPaused}
				gameStats={{
					currentCard: cardIndex,
					totalCards,
					elapsedTime,
					pauseCount,
					totalPauseTime,
					score: score.total || 0,
					accuracy: score.accuracy || 100
				}}
				onResume={handleResumeFromOverlay}
				onExit={confirmExit}
			/>

			<!-- Exit Confirmation -->
			{#if showExitConfirm}
				<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
					<div class="rounded-lg bg-white p-8 text-center">
						<h2 class="mb-4 text-xl font-bold">本当に終了しますか？</h2>
						<p class="mb-6">進捗は保存されます</p>
						<div class="flex justify-center gap-4">
							<button
								onclick={confirmExit}
								class="rounded-lg bg-red-600 px-6 py-2 text-white hover:bg-red-700"
							>
								はい
							</button>
							<button
								onclick={cancelExit}
								class="rounded-lg bg-gray-600 px-6 py-2 text-white hover:bg-gray-700"
							>
								いいえ
							</button>
						</div>
					</div>
				</div>
			{/if}

			<!-- Card Display -->
			{#if isLoading}
				<div class="mb-6 rounded-lg bg-gray-100 p-8 text-center">
					<p class="text-gray-800">読み込み中...</p>
				</div>
			{:else if currentCard && currentCard.hiragana}
				<div class="mb-2 text-xs text-gray-500">
					デバッグ: カードID = {currentCard.id}, ひらがな = {currentCard.hiragana}
				</div>
				<CardDisplay card={currentCard} showFurigana={true} />
			{:else}
				<div class="mb-6 rounded-lg bg-yellow-100 p-8 text-center">
					<p class="text-gray-800">カードを読み込み中...</p>
					<p class="text-sm text-gray-600 mt-2">
						モード: {gameMode || 'なし'}, 
						カード数: {totalCards}, 
						インデックス: {cardIndex},
						currentCard: {JSON.stringify(currentCard)},
						isLoading: {isLoading}
					</p>
				</div>
			{/if}

			<!-- Input Highlight Display -->
			{#if currentCard}
				<div class="mb-6">
					<InputHighlight
						text={parseHiraganaUnits(currentCard.hiragana.replace(/\s/g, '')).join('')}
						{inputStates}
						currentPosition={completedHiraganaCount}
						showRomaji={true}
						romaji={romajiGuide}
						{romajiStates}
						animateErrors={true}
					/>
				</div>
			{/if}

			<!-- Input Progress -->
			<div class="mb-6 h-4 w-full rounded-full bg-gray-200">
				<div
					data-testid="input-progress"
					class="h-4 rounded-full bg-blue-600 transition-all duration-300"
					style="width: {inputProgress}%"
				></div>
			</div>

			<!-- Error Indicator -->
			{#if showError}
				<div data-testid="error-indicator" class="mb-4 text-center">
					<span class="font-bold text-red-600">✗ ミス！</span>
				</div>
			{/if}

			<!-- Score Display -->
			<div class="mb-6 rounded-lg bg-white p-4 shadow-md">
				<div class="grid grid-cols-3 gap-4 text-center">
					<div>
						<p class="text-sm text-gray-600">正確率</p>
						<p data-testid="accuracy-display" class="text-xl font-bold">
							{score.accuracy || 100}%
						</p>
					</div>
					<div>
						<p class="text-sm text-gray-600">コンボ</p>
						<p data-testid="combo-display" class="text-xl font-bold">
							{score.combo || 0}
						</p>
					</div>
					<div>
						<p class="text-sm text-gray-600">スコア</p>
						<p class="text-xl font-bold">{score.total || 0}</p>
					</div>
				</div>
			</div>

			<!-- Game Controls -->
			<div class="flex justify-center gap-4">
				<button
					onclick={handlePause}
					class="rounded-lg bg-yellow-600 px-6 py-2 text-white hover:bg-yellow-700"
				>
					{isPaused ? '再開' : '一時停止'}
				</button>
				<button
					onclick={handleSkip}
					class="rounded-lg bg-gray-600 px-6 py-2 text-white hover:bg-gray-700"
				>
					スキップ
				</button>
				<button
					onclick={handleExit}
					class="rounded-lg bg-red-600 px-6 py-2 text-white hover:bg-red-700"
				>
					終了
				</button>
			</div>

			<!-- Hidden input for mobile -->
			<input
				type="text"
				class="sr-only"
				autocomplete="off"
				autocorrect="off"
				autocapitalize="off"
				spellcheck="false"
			/>
		{/if}
	</div>
</main>
