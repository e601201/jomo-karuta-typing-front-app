<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { gameStore } from '$lib/stores/game';
	import { practiceModeStore } from '$lib/stores/practice-mode';
	import { InputValidator } from '$lib/services/typing/input-validator';
	import { LocalStorageService } from '$lib/services/storage/local-storage';
	import type { GameMode, KarutaCard } from '$lib/types';

	// +page.tsからのページデータ
	interface Props {
		data: {
			mode: GameMode;
			cards: KarutaCard[];
			resume: boolean;
			error: string | null;
			isFromSpecific?: boolean;
		};
	}

	let { data }: Props = $props();

	// コンポーネント
	import CardDisplay from '$lib/components/game/CardDisplay.svelte';
	import InputHighlight from '$lib/components/game/InputHighlight.svelte';
	import PauseOverlay from '$lib/components/game/PauseOverlay.svelte';
	import Countdown from '$lib/components/game/Countdown.svelte';

	// 状態
	let gameMode: GameMode | null = $state(null);
	let shouldContinue = $state(false);
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let showExitConfirm = $state(false);
	let isGameComplete = $state(false);
	let showCountdown = $state(false);
	let gameStarted = $state(false);

	// ストアからのゲーム状態
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
	let remainingTime = $state<number | null>(null);
	let hasTimeLimit = $state(false);

	// カード変更を検出するための前回のカードインデックスを追跡
	let previousCardIndex = -1;

	// 入力検証
	let validator: InputValidator | null = null;
	let romajiGuide = $state('');

	let inputProgress = $state(0);
	let inputStates = $state<Array<'pending' | 'correct' | 'incorrect' | 'current'>>([]);
	let romajiStates = $state<Array<'pending' | 'correct' | 'incorrect'>>([]);
	let currentInput = $state('');
	let showError = $state(false);

	// ストアのサブスクリプション
	let unsubscribe: (() => void) | null = null;

	onMount(async () => {
		try {
			// ページデータのエラーをチェック
			if (data.error) {
				error = data.error;
				isLoading = false;
				return;
			}

			// +page.tsからのデータを使用
			gameMode = data.mode;
			shouldContinue = data.resume;

			// 特定モード選択から来たかどうかをチェック
			const isFromSpecificMode = data.isFromSpecific || false;

			// 特定モードから来た場合はdata.cardsからtotalCardsを設定しない
			if (!isFromSpecificMode) {
				totalCards = data.cards?.length || 0;
			}

			// ゲームを初期化
			await initializeGame();

			// ストアにサブスクライブ - 練習モード以外のみ
			if (gameMode !== 'practice') {
				let previousCardId: string | null = null;

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
					remainingTime = state.timer.remainingTime;
					hasTimeLimit = state.timer.timeLimit !== null;

					// カードが変更された場合はバリデータを更新
					if (currentCard && currentCard.id !== previousCardId) {
						previousCardId = currentCard.id;
						validator = new InputValidator();
						// タイピング検証用にひらがなテキストからスペースを削除
						const targetText = currentCard.hiragana.replace(/\s/g, '');
						validator.setTarget(targetText);
						updateRomajiGuide();
						initializeInputStates();

						// 新しいカード用に入力追跡をリセット
						currentInput = '';
						completedHiraganaCount = 0;
						inputProgress = 0;
					}

					// ゲームが完了したかチェック
					if (state.cards.completed.length === totalCards && state.session?.isActive) {
						isGameComplete = true;
					}
					// 時間切れでゲームが終了したかチェック（セッションが非アクティブになった場合）
					if (state.session && !state.session.isActive && state.session.endTime) {
						isGameComplete = true;
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

		// 離れる前に進捗を保存
		if (!isGameComplete) {
			gameStore.endSession();
		}
	});

	async function initializeGame() {
		// 特定モード選択から来たかどうかをチェック
		const isFromSpecificMode = data.isFromSpecific || false;

		// ページデータからカードを使用
		const cards = data.cards;

		// モードに基づいて初期化
		if (gameMode === 'practice') {
			// 練習モードストアを使用
			const storage = new LocalStorageService();
			storage.initialize();

			// 練習モードストアにすでにカードがあるかチェック（特定モード選択から）
			const currentState = get(practiceModeStore);
			const hasExistingCards = currentState.cards && currentState.cards.length > 0;

			if (isFromSpecificMode && hasExistingCards) {
				// 再初期化しない、カードはすでに特定モードから設定されている
				totalCards = currentState.cards.length; // 総カード数を更新
			} else if (shouldContinue) {
				// 再開のためにカードが必要（全カードであるべき）
				if (!cards || cards.length === 0) {
					// 再開用に全カードをロード
					const { getKarutaCards } = await import('$lib/data/karuta-cards');
					const allCards = getKarutaCards();
					await practiceModeStore.resumeFromSession(allCards, storage);
					totalCards = allCards.length;
				} else {
					await practiceModeStore.resumeFromSession(cards, storage);
					totalCards = cards.length;
				}
			} else if (!isFromSpecificMode) {
				// 特定モードからでない場合のみ全カードで初期化
				if (!cards || cards.length === 0) {
					console.error('No cards available');
					error = 'カードデータの読み込みに失敗しました';
					isLoading = false;
					return;
				}
				practiceModeStore.initialize(cards, storage);
				totalCards = cards.length;
			} else {
				// 特定モードから来たが既存のカードがない - これはエラー
				console.error('From specific mode but no cards in store');
				error = '特定札が選択されていません';
				isLoading = false;
				return;
			}

			// 練習モードストアにサブスクライブ
			unsubscribe = practiceModeStore.subscribe((state) => {
				// ゲームが完了したかチェック（全カードが処理された）
				if (state.currentIndex >= state.cards.length && state.cards.length > 0) {
					isGameComplete = true;
					practiceModeStore.complete();
					return;
				}

				// 状態値を更新
				const newCard = state.cards?.[state.currentIndex] || null;

				// カードインデックスが変更されたかチェック（同じカード内容でも）
				const cardIndexChanged = state.currentIndex !== previousCardIndex;

				// 全状態値を更新 - 非同期操作なしで直接割り当て
				if (newCard) {
					currentCard = newCard;
				}
				cardIndex = state.currentIndex;
				previousCardIndex = state.currentIndex;

				// カードがある場合のみtotalCardsを更新
				if (state.cards && state.cards.length > 0) {
					totalCards = state.cards.length;
				}
				mistakes = state.statistics?.mistakes || 0;
				score = {
					total: state.statistics.totalKeystrokes,
					accuracy:
						state.statistics.totalKeystrokes > 0
							? Math.round(
									(state.statistics.correctKeystrokes / state.statistics.totalKeystrokes) *
										100 *
										100
								) / 100
							: 100,
					speed: practiceModeStore.calculateWPM(),
					combo: state.statistics.currentCombo,
					maxCombo: state.statistics.maxCombo
				};

				// カードが変更された場合はバリデータを更新（内容とインデックス両方をチェック）
				if (currentCard && cardIndexChanged) {
					const targetText = currentCard.hiragana.replace(/\s/g, '');

					// テキストが変更された場合はバリデータをリセット
					if (!validator || validator.getTarget() !== targetText) {
						validator = new InputValidator();
						validator.setTarget(targetText);
					}

					// カードインデックスが変更されたときは常にこれらをリセット
					updateRomajiGuide();
					initializeInputStates();

					// 入力追跡変数をリセット
					currentInput = '';
					completedHiraganaCount = 0;
					inputProgress = 0;
				}

				// 全値を更新後、ローディングをfalseにしてカウントダウンを表示
				if (state.cards && state.cards.length > 0) {
					isLoading = false;
					if (!gameStarted) {
						showCountdown = true;
					}
				}
			});
		} else {
			// 他のモードでは通常のゲームストアを使用
			gameStore.startSession(gameMode!, cards);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (isPaused || isGameComplete || !currentCard || showCountdown) return;

		// ゲームキーのデフォルト動作を防止
		if (event.key.length === 1 || event.key === 'Backspace') {
			event.preventDefault();
		}

		// 入力を処理
		if (event.key === 'Backspace') {
			handleBackspace();
		} else if (event.key.length === 1 && (/^[a-zA-Z]$/.test(event.key) || event.key === '-')) {
			handleCharacterInput(event.key.toLowerCase());
		} else if (event.key === 'Escape') {
			handlePause();
		}
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

			// 小さいや、ゆ、よ（拗音）をチェック
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
		const targetText = currentCard.hiragana.replace(/\s/g, '');

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

			// モードに基づいてストアを更新
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

			mistakes++;

			// モードに基づいてストアを更新
			if (gameMode === 'practice') {
				practiceModeStore.processKeystroke(false);
			} else {
				// 誤入力をシミュレートするために一時的に文字を追加してから元に戻す
				const tempInput = currentInput + char;
				gameStore.updateInput(tempInput);
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

			if (gameMode === 'practice') {
				// バックスペースのために練習モードストアを更新する必要はない
			} else {
				// バックスペース後の入力を更新
				gameStore.updateInput(currentInput);
			}
			updateInputProgress();
		}
	}

	function handleCardComplete() {
		// 次のカードに移る前に入力状態をリセット
		inputPosition = 0;
		currentInput = '';
		inputProgress = 0;
		completedHiraganaCount = 0;

		// 緑色のハイライトをクリアするため入力状態配列をリセット
		if (currentCard) {
			const targetText = currentCard.hiragana.replace(/\s/g, '');
			const hiraganaUnits = parseHiraganaUnits(targetText);
			inputStates = new Array(hiraganaUnits.length).fill('pending');
			romajiStates = new Array(romajiGuide.length).fill('pending');
		}

		if (gameMode === 'practice') {
			// 練習モードで次のカードに移動
			practiceModeStore.nextCard(true);
			// 注：バリデータはサブスクリプションコールバックで更新される
		} else {
			gameStore.completeCard();
			// 次のカードに移動
			if (cardIndex < totalCards - 1) {
				gameStore.nextCard();
			}
		}

		// ここでバリデータをリセットしない - サブスクリプションに任せる
	}

	function updateRomajiGuide() {
		if (!validator || !currentCard) return;
		const targetText = currentCard.hiragana.replace(/\s/g, '');
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

		const targetText = currentCard.hiragana.replace(/\s/g, '');
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
								const initials = new Set<string>();
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
		// 入力状態をリセット
		inputPosition = 0;
		currentInput = '';
		inputProgress = 0;
		completedHiraganaCount = 0;

		// ハイライトをクリアするため入力状態配列をリセット
		if (currentCard) {
			const targetText = currentCard.hiragana.replace(/\s/g, '');
			const hiraganaUnits = parseHiraganaUnits(targetText);
			inputStates = new Array(hiraganaUnits.length).fill('pending');
			romajiStates = new Array(romajiGuide.length).fill('pending');
		}

		if (gameMode === 'practice') {
			// 練習モードでカードをスキップ
			practiceModeStore.nextCard(false);
		} else if (cardIndex < totalCards - 1) {
			gameStore.nextCard();
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

	function handleCountdownComplete() {
		showCountdown = false;
		gameStarted = true;

		// カウントダウン後にゲームタイマーを開始
		if (gameMode === 'practice') {
			// 練習モードは独自のタイマー管理
			practiceModeStore.resume();
		} else {
			// その他のモードはカウントダウン後にタイマー開始
			gameStore.startGameAfterCountdown();
		}
	}
</script>

<svelte:head>
	<title>タイピングゲーム - 上毛カルタ</title>
</svelte:head>

<main class="min-h-screen bg-gradient-to-b from-blue-50 to-white">
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
				<a href="/" class="text-blue-600 hover:underline">メインメニューに戻る</a>
			</div>
		{:else if isGameComplete}
			<!-- ゲーム完了 -->
			<div class="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
				<h2 class="mb-4 text-3xl font-bold text-green-800">ゲーム終了！</h2>
				<div data-testid="final-score" class="mb-6">
					<p class="text-xl">スコア: {score.total}</p>
					<p>正確率: {score.accuracy.toFixed(2)}%</p>
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
			<!-- ゲームヘッダー -->
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
				<Countdown onComplete={handleCountdownComplete} />
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
			{#if isLoading}
				<div class="mb-6 rounded-lg bg-gray-100 p-8 text-center">
					<p class="text-gray-800">読み込み中...</p>
				</div>
			{:else if currentCard && currentCard.hiragana}
				<div class="mb-2 text-xs text-gray-500">
					デバッグ: カードID = {currentCard.id}, ひらがな = {currentCard.hiragana}
				</div>
				<CardDisplay card={currentCard} shake={showError} />
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
				<div class="mb-6">
					<InputHighlight
						text={parseHiraganaUnits(currentCard.hiragana.replace(/\s/g, '')).join('')}
						{inputStates}
						currentPosition={completedHiraganaCount}
						showRomaji={true}
						romaji={romajiGuide}
						{romajiStates}
						animateErrors={true}
						currentRomajiPosition={currentInput.length}
					/>
				</div>
			{/if}

			<!-- スコア表示 -->
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

			<!-- ゲームコントロール -->
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
