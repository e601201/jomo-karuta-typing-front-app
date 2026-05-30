<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { SvelteSet } from 'svelte/reactivity';
	import { get } from 'svelte/store';
	import { gameStore, type GameScore } from '$lib/stores/game';
	import { InputValidator } from '$lib/services/typing/input-validator';
	import { TypingSoundManager } from '$lib/services/audio/typing-sounds';
	import type { GameMode, KarutaCard, RandomModeDifficulty } from '$lib/types';

	// +page.tsからのページデータ
	interface Props {
		data: {
			mode: GameMode;
			cards: KarutaCard[];
			error: string | null;
			difficulty?: RandomModeDifficulty;
		};
	}

	let { data }: Props = $props();

	// コンポーネント
	import CardDisplay from '$lib/components/game/CardDisplay.svelte';
	import InputHighlight from '$lib/components/game/InputHighlight.svelte';
	import PauseOverlay from '$lib/components/game/PauseOverlay.svelte';
	import Countdown from '$lib/components/game/Countdown.svelte';
	import RankingRegistrationModal from '$lib/components/ranking/RankingRegistrationModal.svelte';
	import TimeAttackTimer from '$lib/components/game/TimeAttackTimer.svelte';
	import TimeAttackProgress from '$lib/components/game/TimeAttackProgress.svelte';

	// 状態
	let gameMode: GameMode | null = $state(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let showExitConfirm = $state(false);
	let isGameComplete = $state(false);
	let showCountdown = $state(false);
	let gameStarted = $state(false);
	let showRankingModal = $state(false);
	let isRankingRegistered = $state(false);
	let currentDifficulty: RandomModeDifficulty = $state('standard');

	// ヒント表示用の状態
	let showHint = $state(false);
	let hintTimer: number | null = null;

	// タイムアタックモード用の状態
	let timeAttackElapsedTime = $state(0);
	let timeAttackPenalty = $state(0);
	let timeAttackProgress = $state({ current: 0, total: 10 });
	let timeAttackMistakes = $state(0);
	let timeAttackSkips = $state(0);
	let timeAttackIsCompleted = $state(false);
	let timeAttackFinalTime = $derived(timeAttackElapsedTime + timeAttackPenalty);

	// ストアからのゲーム状態
	let currentCard = $state<KarutaCard | null>(null);
	let cardIndex = $state(0);
	let totalCards = $state(44);
	let completedCardsCount = $state(0);
	let score = $state<GameScore>({
		total: 0,
		accuracy: 100,
		speed: 0,
		combo: 0,
		maxCombo: 0
	});
	let isPaused = $state(false);
	let elapsedTime = $state(0);
	let pauseCount = $state(0);
	let remainingTime = $state<number | null>(null);
	let hasTimeLimit = $state(false);
	let wasSkipped = $state(false);

	// 入力検証
	let validator: InputValidator | null = null;
	let romajiGuide = $state('');
	let displayHiragana = $state(''); // 表示用のひらがなテキスト（難易度に応じて変わる）

	let inputStates = $state<Array<'pending' | 'correct' | 'incorrect' | 'current'>>([]);
	let romajiStates = $state<Array<'pending' | 'correct' | 'incorrect'>>([]);
	let currentInput = $state('');
	let showError = $state(false);

	// ストアのサブスクリプション
	let unsubscribe: (() => void) | null = null;

	// 音声マネージャー
	let soundManager: TypingSoundManager | null = null;

	onMount(async () => {
		try {
			// 音声マネージャーを初期化
			soundManager = new TypingSoundManager();
			// ページデータのエラーをチェック
			if (data.error) {
				error = data.error;
				isLoading = false;
				return;
			}

			// +page.tsからのデータを使用
			gameMode = data.mode;
			currentDifficulty = data.difficulty || 'standard';

			// タイムアタックは10枚固定、それ以外は配布された札数
			totalCards = gameMode === 'timeattack' ? 10 : data.cards?.length || 0;

			// ゲームを初期化
			await initializeGame();

			// 全モード共通でゲームストアにサブスクライブ
			{
				let previousCardId: string | null = null;

				unsubscribe = gameStore.gameStore.subscribe((state) => {
					currentCard = state.cards.current;
					cardIndex = state.cards.currentIndex;
					completedCardsCount = state.cards.completed.length;
					score = state.score;
					isPaused = state.timer.isPaused;
					elapsedTime = state.timer.elapsedTime;
					pauseCount = state.timer.pauseCount || 0;
					currentInput = state.input.current;
					remainingTime = state.timer.remainingTime;
					hasTimeLimit = state.timer.timeLimit !== null;
					wasSkipped = state.cards.wasSkipped || false;

					// タイムアタックモード用の変数を更新
					if (gameMode === 'timeattack') {
						timeAttackElapsedTime = state.timer.elapsedTime;
						timeAttackPenalty = state.timer.penalty || 0;
						timeAttackMistakes = state.statistics.mistakes;
						timeAttackSkips = state.statistics.skips || 0;
						timeAttackProgress = {
							current: state.cards.currentIndex + 1,
							total: state.session?.totalCards || 10
						};
						timeAttackIsCompleted = state.cards.currentIndex >= (state.session?.totalCards || 10);
					}

					// displayHiraganaが未設定の場合（最初のカード）、難易度に応じて設定
					if (currentCard && !displayHiragana) {
						const hiraganaText =
							state.session?.difficulty === 'beginner' &&
							'hiraganaShort' in currentCard &&
							currentCard.hiraganaShort
								? (currentCard.hiraganaShort as string)
								: currentCard.hiragana;
						displayHiragana = hiraganaText;
					}

					// カードが変更された場合はバリデータを更新
					if (currentCard && currentCard.id !== previousCardId) {
						// 前のカードがあった場合（初回以外）、かつスキップでない場合のみ正解音を再生
						// 上級者モードは常に音を鳴らす
						if (previousCardId && soundManager && !wasSkipped) {
							soundManager.playComplete();
						}
						// wasSkippedフラグをリセット（次のカード用）
						if (wasSkipped) {
							gameStore.update((s) => ({
								...s,
								cards: {
									...s.cards,
									wasSkipped: false
								}
							}));
						}

						previousCardId = currentCard.id;

						// 新しいカードの読み上げを再生
						if (soundManager && gameStarted) {
							soundManager.playCardReading(currentCard.id);
						}

						validator = new InputValidator();
						// タイピング検証用にひらがなテキストからスペースのみを削除（読点は残す）
						// 初心者モードの場合はhiraganaShortを使用
						const hiraganaText =
							state.session?.difficulty === 'beginner' &&
							'hiraganaShort' in currentCard &&
							currentCard.hiraganaShort
								? currentCard.hiraganaShort
								: currentCard.hiragana;
						displayHiragana = hiraganaText; // 表示用に保存
						const targetText = hiraganaText.replace(/\s/g, '');
						validator.setTarget(targetText);
						updateRomajiGuide();
						initializeInputStates();

						// 新しいカード用に入力追跡をリセット
						currentInput = '';
						completedHiraganaCount = 0;
					}

					// ゲーム完了の判定（冪等: 既に完了済みなら終了音を再生しない）
					if (!isGameComplete) {
						const allCardsCompleted =
							state.cards.completed.length === totalCards && state.session?.isActive;
						const sessionEnded = !!(
							state.session &&
							!state.session.isActive &&
							state.session.endTime
						);

						if (allCardsCompleted || sessionEnded) {
							isGameComplete = true;
							soundManager?.stopCardReading();
							// 手動終了の場合は終了音を再生しない
							if (!state.session?.isManualExit) {
								soundManager?.playGameEnd();
							}
							soundManager?.stopBGM();
						}
					}
				});
			}

			// キーボードハンドラの設定
			if (typeof window !== 'undefined') {
				document.addEventListener('keydown', handleKeydown);
			}

			isLoading = false;
			if (!gameStarted) {
				showCountdown = true;
			}
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

		// 音声マネージャーのクリーンアップ
		if (soundManager) {
			soundManager.destroy();
			soundManager = null;
		}

		// 離れる前に進捗を保存
		if (!isGameComplete) {
			gameStore.endSession();
		}
	});

	async function initializeGame() {
		// ページデータからカードを使用
		const cards = data.cards;

		if (!cards || cards.length === 0) {
			console.error('No cards available');
			error =
				gameMode === 'specific'
					? '特定札が選択されていません'
					: 'カードデータの読み込みに失敗しました';
			isLoading = false;
			return;
		}

		// ランダムモードのみ難易度を反映（練習・特定・タイムアタックは標準扱い）
		const difficulty = gameMode === 'random' ? data.difficulty : undefined;
		if (difficulty) {
			currentDifficulty = difficulty;
		}

		// タイムアタックモードの場合はカウントダウンを表示
		if (gameMode === 'timeattack') {
			showCountdown = true;
			gameStarted = false;
		}

		// 全モード共通のゲームエンジン（gameStore）でセッションを開始
		await gameStore.startSession(gameMode!, cards, difficulty);
	}

	function handleKeydown(event: KeyboardEvent) {
		// 通常モードの処理
		if (isPaused || isGameComplete || !currentCard || showCountdown) return;

		// Enterキーでヒント表示（上級者モードのみ）
		if (event.key === 'Enter') {
			if (currentDifficulty === 'advanced') {
				event.preventDefault();
				showHintText();
				return;
			}
		}

		// ゲームキーのデフォルト動作を防止
		if (event.key.length === 1 || event.key === 'Backspace') {
			event.preventDefault();
		}

		// 入力を処理
		if (event.key === 'Backspace') {
			handleBackspace();
		} else if (
			event.key.length === 1 &&
			(/^[a-zA-Z]$/.test(event.key) || event.key === '-' || event.key === ',' || event.key === '、')
		) {
			// カンマと読点を処理
			const inputChar = event.key === ',' || event.key === '、' ? '、' : event.key.toLowerCase();
			handleCharacterInput(inputChar);
		} else if (event.key === 'Escape') {
			handlePause();
		}
	}

	// ヒント表示機能
	function showHintText() {
		if (hintTimer) return; // 既にヒント表示中なら無視

		showHint = true;

		// ヒントは2秒後に自動で非表示になる
		hintTimer = window.setTimeout(() => {
			showHint = false;
			hintTimer = null;
		}, 2000);
	}

	// 完了文字数を追跡
	let completedHiraganaCount = $state(0);

	// ひらがなテキストをタイピング単位にパース（きゃ、しゅなどの複数文字単位を考慮）
	function parseHiraganaUnits(text: string): string[] {
		const units: string[] = [];
		let i = 0;

		while (i < text.length) {
			const current = text[i];
			const next = text[i + 1];

			// 読点をそのまま単位として扱う
			if (current === '、') {
				units.push(current);
				i++;
			}
			// 小さいや、ゆ、よ（拗音）をチェック
			else if (
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
			// 小さいつ（促音）をチェック
			else if (current === 'っ') {
				// 小さいつは通常、次の子音を二重にして入力
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

	function handleCharacterInput(char: string) {
		if (!validator || !currentCard) return;

		const newInput = currentInput + char;
		// スペースのみを削除し、読点は残す
		const targetText = displayHiragana.replace(/\s/g, '');

		// 入力文字列全体を検証
		const result = validator.validateInput(targetText, newInput);

		if (result.isValid) {
			// 現在の入力を更新
			currentInput = newInput;

			// 複数文字単位に対してひらがなをより慎重にパース
			const hiraganaUnits = parseHiraganaUnits(targetText);
			let completedCount = 0;
			let partiallyCompleteIndex = -1;
			let tempInput = newInput;

			for (let i = 0; i < hiraganaUnits.length; i++) {
				const unit = hiraganaUnits[i];
				const patterns = validator.getRomajiPatterns(unit);
				let matched = false;
				let partial = false;

				// 'ん'の特別処理
				if (unit === 'ん') {
					const isLastChar = i === hiraganaUnits.length - 1;

					if (tempInput === 'n') {
						// 'n'のみ - 常に部分的として保持
						partial = true;
						partiallyCompleteIndex = i;
					} else if (tempInput.startsWith('nn')) {
						// 'nn'は常に'ん'を完成
						completedCount++;
						tempInput = tempInput.slice(2);
						matched = true;
					} else if (tempInput.startsWith('n') && tempInput.length > 1) {
						const charAfterN = tempInput[1];

						if (isLastChar) {
							// 最後の文字が'ん' - 'nn'を使う必要があるので、これは無効
							// 2番目の'n'を待って部分的として保持
							partial = true;
							partiallyCompleteIndex = i;
						} else {
							// 最後の文字ではない - 'n'を受け入れられるかチェック
							const nextUnit = hiraganaUnits[i + 1];
							const nextPatterns = validator.getRomajiPatterns(nextUnit);

							// 次のひらがながn + charAfterNで始まるかチェック
							const canStartWithN = nextPatterns.some((p) => p.startsWith('n' + charAfterN));

							if (!canStartWithN && charAfterN !== 'n') {
								// この'n'は'ん'である必要があり、完成する
								completedCount++;
								tempInput = tempInput.slice(1);
								matched = true;
							} else {
								// 曖昧または'nn'を待っている
								partial = true;
								partiallyCompleteIndex = i;
							}
						}
					}
				} else {
					// 通常の文字マッチング
					for (const pattern of patterns) {
						if (tempInput.startsWith(pattern)) {
							// このひらがなは完成
							completedCount++;
							tempInput = tempInput.slice(pattern.length);
							matched = true;
							break;
						}
					}
				}

				// 完全に一致しない場合は部分一致をチェック
				if (!matched && !partial && tempInput.length > 0) {
					for (const pattern of patterns) {
						if (pattern.startsWith(tempInput)) {
							// この文字を入力中
							partial = true;
							partiallyCompleteIndex = i;
							break;
						}
					}

					if (!partial) {
						break; // 全く一致しない
					}
				}

				if (!matched && !partial) {
					break;
				}
			}

			// ハイライト状態を更新
			for (let i = 0; i < hiraganaUnits.length; i++) {
				if (i < completedCount) {
					inputStates[i] = 'correct';
				} else if (i === partiallyCompleteIndex) {
					inputStates[i] = 'pending'; // 現在入力中として表示
				} else {
					inputStates[i] = 'pending';
				}
			}

			completedHiraganaCount = completedCount;

			// 入力に基づいて動的ローマ字ガイドを更新
			updateDynamicRomajiGuide();

			// 完了文字を表示するためローマ字状態を更新
			for (let i = 0; i < newInput.length; i++) {
				romajiStates[i] = 'correct';
			}
			for (let i = newInput.length; i < romajiGuide.length; i++) {
				romajiStates[i] = 'pending';
			}

			// ゲームストアを更新（完全一致時はストア側で自動的に次の札へ進む）
			gameStore.updateInput(newInput);

			// 正しい入力の音を再生
			soundManager?.playCorrect();

			showError = false;
		} else {
			// エラーを表示
			showError = true;

			// エラーハイライト用にひらがな単位をパース
			const hiraganaUnits = parseHiraganaUnits(targetText);

			// どの文字が間違って入力されているかを特定
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

			// 現在の位置にエラーを表示するためローマ字状態を更新
			for (let i = 0; i < currentInput.length; i++) {
				romajiStates[i] = 'correct';
			}
			// エラーが発生した位置を不正としてマーク
			if (currentInput.length < romajiGuide.length) {
				romajiStates[currentInput.length] = 'incorrect';
			}
			for (let i = currentInput.length + 1; i < romajiGuide.length; i++) {
				romajiStates[i] = 'pending';
			}

			// 間違った入力の音を再生
			soundManager?.playIncorrect();

			// 誤入力をストアに反映（ミスとしてカウント、現在入力は更新しない）
			const tempInput = currentInput + char;
			gameStore.updateInput(tempInput);

			// タイムアタックモードの場合はミスごとにペナルティを追加
			if (gameMode === 'timeattack') {
				gameStore.update((s) => ({
					...s,
					timer: {
						...s.timer,
						penalty: s.timer.penalty + 2000 // 2秒のペナルティ
					}
				}));
			}

			// 500ms後にエラーインジケータをリセット
			setTimeout(() => {
				showError = false;
				if (errorIndex < inputStates.length) {
					inputStates[errorIndex] = 'pending';
				}
				// ローマ字エラー状態をリセット
				if (currentInput.length < romajiGuide.length) {
					romajiStates[currentInput.length] = 'pending';
				}
			}, 500);
		}
	}

	function handleBackspace() {
		if (currentInput.length > 0) {
			currentInput = currentInput.slice(0, -1);

			// 完了文字を再計算
			const targetText = displayHiragana.replace(/\s/g, '') || '';
			const hiraganaUnits = parseHiraganaUnits(targetText);
			let completedCount = 0;
			let partiallyCompleteIndex = -1;
			let tempInput = currentInput;

			for (let i = 0; i < hiraganaUnits.length; i++) {
				const unit = hiraganaUnits[i];
				const patterns = validator?.getRomajiPatterns(unit) || [];
				let matched = false;
				let partial = false;

				// 'ん'の特別処理
				if (unit === 'ん') {
					const isLastChar = i === hiraganaUnits.length - 1;

					if (tempInput === 'n') {
						// 'n'のみ - 部分的として保持
						partial = true;
						partiallyCompleteIndex = i;
					} else if (tempInput.startsWith('nn')) {
						// 'nn'は'ん'を完成
						completedCount++;
						tempInput = tempInput.slice(2);
						matched = true;
					} else if (tempInput.startsWith('n') && tempInput.length > 1) {
						const charAfterN = tempInput[1];

						if (isLastChar) {
							// 最後の文字は'nn'である必要がある
							partial = true;
							partiallyCompleteIndex = i;
						} else {
							// 次のひらがながこれで始まるかチェック
							const nextUnit = hiraganaUnits[i + 1];
							const nextPatterns = validator?.getRomajiPatterns(nextUnit) || [];
							const canStartWithN = nextPatterns.some((p) => p.startsWith('n' + charAfterN));

							if (!canStartWithN && charAfterN !== 'n') {
								// この'n'は'ん'
								completedCount++;
								tempInput = tempInput.slice(1);
								matched = true;
							} else {
								// 曖昧
								partial = true;
								partiallyCompleteIndex = i;
							}
						}
					}
				} else {
					// 通常のマッチング
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

			// 入力状態を更新
			for (let i = 0; i < hiraganaUnits.length; i++) {
				if (i < completedCount) {
					inputStates[i] = 'correct';
				} else if (i === partiallyCompleteIndex) {
					inputStates[i] = 'current';
				} else {
					inputStates[i] = 'pending';
				}
			}

			// バックスペース後に動的ローマ字ガイドを更新
			updateDynamicRomajiGuide();

			// バックスペース後にローマ字状態を更新
			for (let i = 0; i < currentInput.length; i++) {
				romajiStates[i] = 'correct';
			}
			for (let i = currentInput.length; i < romajiGuide.length; i++) {
				romajiStates[i] = 'pending';
			}

			// バックスペース後の入力をストアへ反映（バックスペースはコンボを崩さない）
			gameStore.updateInput(currentInput);
			updateInputProgress();
		}
	}

	function updateRomajiGuide() {
		if (!validator || !currentCard) return;
		// displayHiraganaが空の場合は初期化
		if (!displayHiragana) {
			const state = get(gameStore.gameStore);
			const hiraganaText =
				state.session?.difficulty === 'beginner' &&
				'hiraganaShort' in currentCard &&
				currentCard.hiraganaShort
					? (currentCard.hiraganaShort as string)
					: currentCard.hiragana;
			displayHiragana = hiraganaText;
		}
		const targetText = displayHiragana.replace(/\s/g, '');
		const patterns = validator.getRomajiPatterns(targetText);
		romajiGuide = patterns[0] || '';
	}

	// ユーザー入力に基づいてローマ字ガイドを動的に更新
	function updateDynamicRomajiGuide() {
		if (!validator || !currentCard) {
			updateRomajiGuide();
			return;
		}

		if (!currentInput) {
			updateRomajiGuide();
			return;
		}

		const targetText = displayHiragana.replace(/\s/g, '');
		const hiraganaUnits = parseHiraganaUnits(targetText);
		let newRomajiGuide = '';
		let tempInput = currentInput;

		for (let i = 0; i < hiraganaUnits.length; i++) {
			const unit = hiraganaUnits[i];
			const patterns = validator.getRomajiPatterns(unit);
			let usedPattern = '';
			let consumed = 0;

			// この文字に入力があるかチェック
			if (tempInput.length > 0 && i <= completedHiraganaCount) {
				// 'ん'の特別処理
				if (unit === 'ん') {
					const isLastChar = i === hiraganaUnits.length - 1;

					if (tempInput.startsWith('nn')) {
						// ユーザーが'nn'を入力 - 'nn'パターンを表示
						usedPattern = 'nn';
						consumed = 2;
					} else if (tempInput.startsWith('n')) {
						// ユーザーが単一の'n'を入力
						const charAfterN = tempInput[1];
						const nextUnit = hiraganaUnits[i + 1];

						if (charAfterN === 'n') {
							// ユーザーが'nn'を入力 - 'nn'パターンを表示
							usedPattern = 'nn';
							consumed = 2;
						} else if (!nextUnit || isLastChar) {
							// 最後の文字 - 常に'nn'パターンを表示
							if (charAfterN === 'n') {
								// ユーザーが'nn'を入力
								usedPattern = 'nn';
								consumed = 2;
							} else if (!charAfterN && i === completedHiraganaCount) {
								// 現在入力中、期待どおり'nn'を表示
								usedPattern = 'nn';
								consumed = 0;
							} else {
								// 'nn'パターンを表示
								usedPattern = 'nn';
								consumed = 1;
							}
						} else {
							// 次の単位に基づいて必要なパターンを決定
							let requiredPattern = 'n';

							// 'nn'が必要な特別なケース
							if (nextUnit === 'にゃ' || nextUnit === 'にゅ' || nextUnit === 'にょ') {
								requiredPattern = 'nn';
							} else if (
								nextUnit === 'な' ||
								nextUnit === 'に' ||
								nextUnit === 'ぬ' ||
								nextUnit === 'ね' ||
								nextUnit === 'の'
							) {
								requiredPattern = 'nn';
							} else if (/^[あいうえおやゆよ]/.test(nextUnit)) {
								requiredPattern = 'nn';
							}

							if (requiredPattern === 'nn') {
								if (charAfterN === 'n') {
									// ユーザーが'nn'を入力
									usedPattern = 'nn';
									consumed = 2;
								} else if (!charAfterN && i === completedHiraganaCount) {
									// 現在入力中、期待されるパターンを表示
									usedPattern = 'nn';
									consumed = 0;
								} else {
									// 'nn'パターンを表示
									usedPattern = 'nn';
									consumed = 1;
								}
							} else {
								// 単一の'n'が有効
								if (
									charAfterN &&
									validator.getRomajiPatterns(nextUnit).some((p) => p.startsWith(charAfterN))
								) {
									// 'n'の後の文字が次の単位のパターンの開始と一致
									usedPattern = 'n';
									consumed = 1;
								} else if (!charAfterN && i === completedHiraganaCount) {
									// 現在'n'だけでこの'ん'を入力中
									usedPattern = 'n';
									consumed = 0;
								} else {
									usedPattern = 'n';
									consumed = 1;
								}
							}
						}
					} else {
						// まだ'n'の入力がない、コンテキストに基づいてデフォルトを選択
						const nextUnit = hiraganaUnits[i + 1];
						if (nextUnit) {
							// 特別なケース：にゃ、にゅ、にょは独立した音 - 単一の'n'を使用
							if (nextUnit === 'にゃ' || nextUnit === 'にゅ' || nextUnit === 'にょ') {
								usedPattern = 'n';
							} else {
								const nextPatterns = validator.getRomajiPatterns(nextUnit);
								const initials = new SvelteSet<string>();
								nextPatterns.forEach((p) => {
									if (p && p.length > 0) initials.add(p[0]);
								});
								const requiresDoubleN = Array.from(initials).some((c) => /[aiueoyn]/.test(c));
								usedPattern = requiresDoubleN ? 'nn' : 'n';
							}
						} else {
							usedPattern = patterns[0] || 'n';
						}
					}
				}
				// 代替入力がある他の文字の特別処理
				else if (unit === 'し' && (tempInput.startsWith('si') || tempInput === 's')) {
					usedPattern = 'si';
					consumed = tempInput.startsWith('si') ? 2 : tempInput.length;
				} else if (unit === 'ち' && (tempInput.startsWith('ti') || tempInput === 't')) {
					usedPattern = 'ti';
					consumed = tempInput.startsWith('ti') ? 2 : tempInput.length;
				} else if (unit === 'つ' && (tempInput.startsWith('tu') || tempInput === 't')) {
					usedPattern = 'tu';
					consumed = tempInput.startsWith('tu') ? 2 : tempInput.length;
				} else if (unit === 'ふ' && (tempInput.startsWith('hu') || tempInput === 'h')) {
					usedPattern = 'hu';
					consumed = tempInput.startsWith('hu') ? 2 : tempInput.length;
				} else {
					// 標準パターンをチェック
					for (const pattern of patterns) {
						if (tempInput.startsWith(pattern)) {
							usedPattern = pattern;
							consumed = pattern.length;
							break;
						} else if (pattern.startsWith(tempInput) && i === completedHiraganaCount) {
							// 現在このパターンを入力中
							usedPattern = pattern;
							consumed = tempInput.length;
							break;
						}
					}

					// 一致が見つからない場合はデフォルトパターンを使用
					if (!usedPattern) {
						usedPattern = patterns[0] || '';
					}
				}

				// 一時入力を更新
				if (consumed > 0) {
					tempInput = tempInput.slice(consumed);
				}
			} else {
				// この文字にはまだ入力がない、デフォルトパターンを選択
				if (unit === 'ん') {
					const nextUnit = hiraganaUnits[i + 1];
					if (nextUnit) {
						// 特別なケース：にゃ、にゅ、にょの前には'nn'が必要
						if (nextUnit === 'にゃ' || nextUnit === 'にゅ' || nextUnit === 'にょ') {
							usedPattern = 'nn';
						}
						// な行（な、に、ぬ、ね、の）の前は 'nn' が必須
						else if (
							nextUnit === 'な' ||
							nextUnit === 'に' ||
							nextUnit === 'ぬ' ||
							nextUnit === 'ね' ||
							nextUnit === 'の'
						) {
							usedPattern = 'nn';
						}
						// 母音・や行の前も 'nn' が必須
						else if (/^[あいうえおやゆよ]/.test(nextUnit)) {
							usedPattern = 'nn';
						}
						// それ以外は 'n' を表示
						else {
							usedPattern = 'n';
						}
					} else {
						// 末尾の「ん」も 'nn' を表示（一貫性のため）
						usedPattern = 'nn';
					}
				} else {
					usedPattern = patterns[0] || '';
				}
			}

			newRomajiGuide += usedPattern;
		}

		romajiGuide = newRomajiGuide;
	}

	function updateInputProgress() {
		if (!currentCard || !romajiGuide) return;
	}

	function handlePause() {
		if (isPaused) {
			gameStore.resumeGame();
			// BGMを再開
			if (soundManager) {
				soundManager.resumeBGM();
			}
		} else {
			gameStore.pauseGame();
			// BGMと読み上げを一時停止
			if (soundManager) {
				soundManager.pauseBGM();
				soundManager.stopCardReading();
			}
		}
	}

	function handleResumeFromOverlay(_options?: { skipCountdown?: boolean }) {
		gameStore.resumeGame();
		// BGMを再開
		if (soundManager) {
			soundManager.resumeBGM();
		}
	}

	function handleSkip() {
		// 入力状態をリセット
		currentInput = '';
		completedHiraganaCount = 0;

		// ハイライトをクリアするため入力状態配列をリセット
		if (currentCard) {
			const targetText = displayHiragana.replace(/\s/g, '');
			const hiraganaUnits = parseHiraganaUnits(targetText);
			inputStates = new Array(hiraganaUnits.length).fill('pending');
			romajiStates = new Array(romajiGuide.length).fill('pending');
		}

		// スキップ時に読み上げを停止して札を弾く音を再生
		if (soundManager) {
			soundManager.stopCardReading();
			soundManager.playFlickCard();
		}

		// 全モード共通でカードをスキップ（完了扱いにしない）。
		// 最後の札のスキップやデッキ終端、タイムアタックのペナルティはstore側で処理される。
		gameStore.skipCard();
	}

	function handleExit() {
		showExitConfirm = true;
	}

	function confirmExit() {
		gameStore.endSession(true);
		soundManager?.stopCardReading();
		soundManager?.stopBGM();
		goto(resolve('/'));
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
		// displayHiraganaが空の場合は初期化（最初のカード用）
		if (!displayHiragana) {
			const state = get(gameStore.gameStore);
			const hiraganaText =
				state.session?.difficulty === 'beginner' &&
				'hiraganaShort' in currentCard &&
				currentCard.hiraganaShort
					? (currentCard.hiraganaShort as string)
					: currentCard.hiragana;
			displayHiragana = hiraganaText;
		}
		const targetText = displayHiragana.replace(/\s/g, '');
		const hiraganaUnits = parseHiraganaUnits(targetText);
		inputStates = new Array(hiraganaUnits.length).fill('pending');
		romajiStates = new Array(romajiGuide.length).fill('pending');
	}

	function handleCountdownComplete() {
		showCountdown = false;
		gameStarted = true;

		// BGMを開始
		if (soundManager) {
			soundManager.startBGM();
			// 最初のカードの読み上げを再生
			if (currentCard) {
				soundManager.playCardReading(currentCard.id);
			}
		}

		// カウントダウン後にゲームタイマーを開始（全モード共通）
		gameStore.startGameAfterCountdown();
	}
</script>

<svelte:head>
	<title>タイピングゲーム - 上毛かるた</title>
</svelte:head>

<main class="min-h-screen bg--to-b from-blue-50 to-white">
	<div data-testid="game-container" class="container mx-auto max-w-4xl flex-col px-4 py-8">
		{#if isLoading}
			<!-- ローディング状態 -->
			<div class="flex min-h-[400px] items-center justify-center">
				<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
				<p class="ml-4">ゲームを準備中...</p>
			</div>
		{:else if error}
			<!-- エラー状態 -->
			<div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
				<p class="mb-4 text-red-600">{error}</p>
				<a href={resolve('/')} class="text-blue-600 hover:underline">メインメニューに戻る</a>
			</div>
		{:else if isGameComplete}
			<!-- 
		 -->
			<div class="rounded-lg bg-white p-8 shadow-lg">
				<h2 class="mb-6 text-center text-3xl font-bold text-gray-800">ゲーム終了！</h2>

				<!-- モード表示 -->
				<div class="mb-4 text-center">
					<span
						class="inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800"
					>
						{#if gameMode === 'specific'}
							特定札練習
						{:else if gameMode === 'practice'}
							練習
						{:else if gameMode === 'random'}
							ランダム
						{:else if gameMode === 'timeattack'}
							タイムアタック
						{:else}
							{gameMode}
						{/if}
					</span>
					<span
						class="inline-block rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-green-800"
					>
						{#if gameMode === 'random' || gameMode === 'timeattack'}
							{#if currentDifficulty === 'beginner'}
								初心者モード
							{:else if currentDifficulty === 'standard'}
								標準モード
							{:else if currentDifficulty === 'advanced'}
								上級モード
							{/if}
						{/if}
					</span>
				</div>

				<!-- スコア（中段・目立つように） / タイムアタックはタイム表示 -->
				{#if gameMode === 'timeattack'}
					<div class="mb-8 border border-gray-300 p-6 text-center text-gray-600">
						<p class="mb-2 text-lg font-medium">最終タイム</p>
						<p class="text-5xl font-bold">
							{((timeAttackElapsedTime + timeAttackPenalty) / 1000).toFixed(2)}秒
						</p>
						{#if timeAttackPenalty > 0}
							<p class="mt-2 text-sm text-red-500">
								ペナルティ: +{(timeAttackPenalty / 1000).toFixed(2)}秒
							</p>
							<p class="text-xs text-gray-500">
								（ミス: {timeAttackMistakes}回 / スキップ: {timeAttackSkips}回）
							</p>
						{/if}
					</div>
				{:else}
					<div class="mb-8 border border-gray-300 p-6 text-center text-gray-600">
						<p class="mb-2 text-lg font-medium">スコア</p>
						<p class="text-5xl font-bold">{score.total.toLocaleString()}</p>
					</div>
				{/if}

				<!-- 詳細統計 -->
				<div data-testid="final-score" class="mb-8 grid grid-cols-2 gap-4 text-center">
					<div class="rounded-lg p-4">
						<p class="text-sm text-gray-600">正解した札</p>
						<p class="text-2xl font-bold text-gray-800">{completedCardsCount} 枚</p>
					</div>
					<div class="rounded-lg p-4">
						<p class="text-sm text-gray-600">正確率</p>
						<p class="text-2xl font-bold text-gray-800">{score.accuracy.toFixed(2)}%</p>
					</div>
					<div class="rounded-lg p-4">
						<p class="text-sm text-gray-600">WPM(単語数/分)</p>
						<p class="text-2xl font-bold text-gray-800">{score.speed}</p>
					</div>
					<div class="rounded-lg p-4">
						<p class="text-sm text-gray-600">最大コンボ</p>
						<p class="text-2xl font-bold text-gray-800">{score.maxCombo}</p>
					</div>
				</div>

				<!-- ボタン群 -->
				<div class="flex flex-col gap-3">
					{#if (gameMode === 'random' || gameMode === 'timeattack') && !isRankingRegistered}
						<button
							onclick={() => {
								showRankingModal = true;
							}}
							class="transform rounded-lg bg-linear-to-r from-yellow-500 to-orange-500 px-6 py-4 text-lg font-bold text-white transition-all hover:scale-105 hover:from-yellow-600 hover:to-orange-600"
						>
							🏆 ランキングに登録する
						</button>
					{/if}
					<div class="grid grid-cols-2 gap-3">
						<button
							onclick={() => goto(resolve('/ranking'))}
							class="rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50"
						>
							🏆 ランキングを見る
						</button>
						<button
							onclick={() => {
								const shareText = `【上毛かるたタイピング】
${gameMode === 'specific' ? '特定札練習' : gameMode === 'practice' ? '練習' : 'ランダム'} ${gameMode === 'random' ? (currentDifficulty === 'beginner' ? '初心者モード' : currentDifficulty === 'standard' ? '標準モード' : '上級モード') : ''}で${score.total.toLocaleString()}点獲得！

📊 ゲーム結果
・正解した札: ${completedCardsCount}枚
・正確率: ${score.accuracy.toFixed(2)}%
・WPM: ${score.speed}
・最大コンボ: ${score.maxCombo}

#上毛かるた #タイピングゲーム`;

								const shareUrl = window.location.origin;
								const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
								window.open(twitterUrl, '_blank', 'width=550,height=420');
							}}
							class="rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50"
						>
							📢 結果をX(Twitter)でシェア
						</button>
					</div>
					<button
						onclick={() => {
							// BGMを確実に停止
							if (soundManager) {
								soundManager.stopBGM();
							}

							// 特定札練習モードの場合は特定札選択画面に戻る
							if (gameMode === 'specific') {
								goto(resolve('/practice/specific'));
							} else {
								// その他のモードは同じモードで再プレイ
								const url = new URL(window.location.href);
								url.searchParams.delete('continue'); // continueパラメータを削除
								// modeパラメータを確実に設定
								if (gameMode) {
									url.searchParams.set('mode', gameMode);
								}
								window.location.href = url.toString();
							}
						}}
						class="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
					>
						{gameMode === 'specific' ? '札を選び直す' : 'もう一度遊ぶ'}
					</button>
					<button
						onclick={() => goto(resolve('/'))}
						class="rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-colors hover:bg-gray-50"
					>
						メインメニューに戻る
					</button>
				</div>
			</div>
		{:else}
			<!-- ゲームヘッダー -->
			{#if gameMode === 'timeattack'}
				<!-- タイムアタック用ヘッダー -->
				<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
					<TimeAttackTimer
						elapsedTime={timeAttackElapsedTime}
						penalty={timeAttackPenalty}
						isCompleted={timeAttackIsCompleted}
					/>
					<TimeAttackProgress
						current={timeAttackProgress.current}
						total={timeAttackProgress.total}
						mistakes={timeAttackMistakes}
						skips={timeAttackSkips}
					/>
				</div>
			{:else}
				<header class="mb-6 rounded-lg bg-white p-4 shadow-md">
					<div class="flex items-center justify-between">
						<div class="text-sm text-gray-600">
							進捗: <span class="font-bold">{cardIndex + 1} / {totalCards}</span>
						</div>
						{#if hasTimeLimit && remainingTime !== null}
							<div
								class="text-sm {remainingTime < 10000 ? 'font-bold text-red-600' : 'text-gray-600'}"
							>
								残り時間: <span class="font-bold">{formatTime(remainingTime)}</span>
							</div>
						{/if}
					</div>
				</header>
			{/if}

			<!-- 拡張一時停止オーバーレイ -->
			<PauseOverlay
				{isPaused}
				gameStats={{
					currentCard: cardIndex,
					totalCards,
					elapsedTime,
					pauseCount,
					score: score.total || 0,
					accuracy: score.accuracy || 100
				}}
				onResume={handleResumeFromOverlay}
				onExit={confirmExit}
			/>

			<!-- カウントダウンオーバーレイ -->
			{#if showCountdown}
				<Countdown onComplete={handleCountdownComplete} duration={3} />
			{/if}

			<!-- 終了確認 -->
			{#if showExitConfirm}
				<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
					<div class="rounded-lg bg-white p-8 text-center">
						<h2 class="mb-4 text-xl font-bold">本当に終了しますか？</h2>
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

			<!-- カード表示 -->
			{#if !showCountdown}
				{#if isLoading}
					<div class="mb-6 rounded-lg bg-gray-100 p-8 text-center">
						<p class="text-gray-800">読み込み中...</p>
					</div>
				{:else if currentCard && displayHiragana}
					<CardDisplay card={currentCard} shake={showError} difficulty={currentDifficulty} />
				{:else}
					<div class="mb-6 rounded-lg bg-yellow-100 p-8 text-center">
						<p class="text-gray-800">カードを読み込み中...</p>
						<p class="mt-2 text-sm text-gray-600">
							モード: {gameMode || 'なし'}, カード数: {totalCards}, インデックス: {cardIndex},
							currentCard: {JSON.stringify(currentCard)}, isLoading: {isLoading}
						</p>
					</div>
				{/if}

				<!-- 入力ハイライト表示 -->
				{#if currentCard}
					<div class="mb-1">
						<InputHighlight
							text={parseHiraganaUnits(displayHiragana.replace(/\s/g, '')).join('')}
							{inputStates}
							currentPosition={completedHiraganaCount}
							showRomaji={currentDifficulty !== 'advanced'}
							romaji={romajiGuide}
							{romajiStates}
							animateErrors={true}
							currentRomajiPosition={currentInput.length}
							difficulty={currentDifficulty}
							{showHint}
						/>
					</div>
				{/if}
			{/if}

			<!-- スコア表示 -->
			{#if !showCountdown}
				<div class="mb-6 rounded-lg bg-white p-4 shadow-md">
					<div class="grid grid-cols-3 gap-4 text-center">
						<div>
							<p class="text-sm text-gray-600">正確率</p>
							<p data-testid="accuracy-display" class="text-xl font-bold">
								{(score.accuracy || 100).toFixed(2)}%
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
			{/if}

			<!-- ゲームコントロール -->
			{#if !showCountdown}
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
			{/if}

			<!-- モバイル用の非表示入力 -->
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

<!-- ランキング登録モーダル -->
<RankingRegistrationModal
	isOpen={showRankingModal}
	score={score.total || 0}
	difficulty={gameMode === 'random' || gameMode === 'timeattack' ? currentDifficulty : undefined}
	gameMode={gameMode || undefined}
	time={gameMode === 'timeattack' ? timeAttackFinalTime : undefined}
	onClose={() => {
		showRankingModal = false;
	}}
	onSuccess={() => {
		isRankingRegistered = true;
		showRankingModal = false;
	}}
/>
