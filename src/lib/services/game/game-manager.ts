/**
 * ゲーム管理サービス
 * ゲームロジックを管理
 */

import { gameStore } from '$lib/stores/game';
import { InputValidator } from '$lib/services/typing/input-validator';
import karutaCards from '$lib/data/karuta-cards.json';
import type { GameMode } from '$lib/types';

export interface GameConfig {
	mode: GameMode;
	continueGame: boolean;
	cards?: KarutaCard[];
}

export interface InputResult {
	isValid: boolean;
	isComplete: boolean;
	showError: boolean;
	newPosition: number;
	newInput: string;
	highlights: string[];
}

export class GameManager {
	private validator: InputValidator | null = null;
	private currentInput = '';
	private inputPosition = 0;
	private highlights: string[] = [];
	private cards: KarutaCard[] = [];

	/**
	 * ゲームを初期化
	 */
	async initialize(config: GameConfig): Promise<void> {
		// カードを準備
		this.cards = config.cards || [...karutaCards];

		// ランダムモードの場合はシャッフル（gameStore側でもシャッフルするが、一貫性のためここでも行う）
		if (config.mode === 'random') {
			this.shuffleCards();
		}

		// セッションを開始（正しい引数形式で呼び出し）
		gameStore.startSession(config.mode, this.cards);

		// startSessionが最初のカードを設定するため、nextCardは不要
		// await gameStore.nextCard();
	}

	/**
	 * カードをシャッフル
	 */
	private shuffleCards(): void {
		for (let i = this.cards.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
		}
	}

	/**
	 * カードが変更されたときの処理
	 */
	onCardChange(card: KarutaCard): void {
		if (!card) return;

		// バリデーターを更新（スペースを除去）
		this.validator = new InputValidator();
		const targetText = card.hiragana.replace(/\s/g, '');
		this.validator.setTarget(targetText);

		// 入力状態をリセット
		this.currentInput = '';
		this.inputPosition = 0;
		this.highlights = [];
	}

	/**
	 * 文字入力を処理
	 */
	processInput(char: string): InputResult {
		if (!this.validator) {
			return {
				isValid: false,
				isComplete: false,
				showError: false,
				newPosition: this.inputPosition,
				newInput: this.currentInput,
				highlights: this.highlights
			};
		}

		const newInput = this.currentInput + char;
		// Get target text from validator
		const targetText = this.validator.getTarget();
		const result = this.validator.validateInput(targetText, newInput);

		if (result.isValid) {
			// 正解の処理
			this.currentInput = newInput;
			this.highlights[this.inputPosition] = 'correct';

			if (!result.isComplete) {
				this.inputPosition++;
			}

			gameStore.updateInput(newInput);

			return {
				isValid: true,
				isComplete: result.isComplete || false,
				showError: false,
				newPosition: this.inputPosition,
				newInput: this.currentInput,
				highlights: [...this.highlights]
			};
		} else {
			// 不正解の処理
			return {
				isValid: false,
				isComplete: false,
				showError: true,
				newPosition: this.inputPosition,
				newInput: this.currentInput,
				highlights: [...this.highlights]
			};
		}
	}

	/**
	 * バックスペース処理
	 */
	processBackspace(): InputResult {
		if (this.inputPosition > 0) {
			this.inputPosition--;
			this.currentInput = this.currentInput.slice(0, -1);
			this.highlights[this.inputPosition] = '';

			gameStore.updateInput(this.currentInput);
		}

		return {
			isValid: true,
			isComplete: false,
			showError: false,
			newPosition: this.inputPosition,
			newInput: this.currentInput,
			highlights: [...this.highlights]
		};
	}

	/**
	 * カード完了処理
	 */
	completeCard(): void {
		gameStore.completeCard();

		// 状態をリセット
		this.validator = null;
		this.currentInput = '';
		this.inputPosition = 0;
		this.highlights = [];
	}

	/**
	 * 次のカードへ
	 */
	async nextCard(): Promise<void> {
		await gameStore.nextCard();
	}

	/**
	 * ローマ字パターンを取得
	 */
	getRomajiPatterns(): string[] {
		if (!this.validator) return [''];
		const targetText = this.validator.getTarget();
		return this.validator.getRomajiPatterns(targetText);
	}

	/**
	 * 入力進捗を計算
	 */
	getInputProgress(): number {
		const patterns = this.getRomajiPatterns();
		if (!patterns[0]) return 0;
		return (this.inputPosition / patterns[0].length) * 100;
	}

	/**
	 * ゲームを一時停止/再開
	 */
	togglePause(isPaused: boolean): void {
		if (isPaused) {
			gameStore.resumeGame();
		} else {
			gameStore.pauseGame();
		}
	}

	/**
	 * カードをスキップ
	 */
	skipCard(): void {
		this.nextCard();
	}

	/**
	 * ゲームを終了
	 */
	endGame(): void {
		gameStore.endSession();
	}

	/**
	 * クリーンアップ
	 */
	destroy(): void {
		gameStore.destroy();
	}
}
