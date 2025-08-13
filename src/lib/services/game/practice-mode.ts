/**
 * 練習モードサービス
 * TASK-301: TDD Step 4 - 最小実装 (Green)
 */

import type { KarutaCard } from '$lib/types';
import { LocalStorageService, type SavedSession } from '$lib/services/storage/local-storage';
import { getKarutaCards } from '$lib/data/karuta-cards';
import { InputValidator } from '$lib/services/typing/input-validator';

export interface PracticeModeSession {
	mode: 'practice';
	currentCardIndex: number;
	completedCards: string[];
	startTime: string;
	totalElapsedTime: number;
	statistics: {
		totalKeystrokes: number;
		correctKeystrokes: number;
		mistakes: number;
		wpm: number;
		accuracy: number;
	};
}

export interface PracticeModeState {
	currentCardIndex: number;
	completedCards: string[];
	statistics: {
		totalKeystrokes: number;
		correctKeystrokes: number;
		mistakes: number;
		wpm: number;
		accuracy: number;
	};
}

export interface CardStatistics {
	cardId: string;
	attempts: number;
	time: number;
	mistakes: number;
	accuracy: number;
}

export interface CompletionSummary {
	totalCards: number;
	completedCards: number;
	skippedCards: number;
	totalTime: number;
	averageWpm: number;
	overallAccuracy: number;
	difficultCards: CardStatistics[];
}

export interface InputResult {
	isCorrect: boolean;
	isComplete: boolean;
}

export class PracticeModeService {
	private storage: LocalStorageService;
	private cards: KarutaCard[] = [];
	private state: PracticeModeState;
	private inputValidator: InputValidator;
	private startTime: Date | null = null;
	private pauseTime: Date | null = null;
	private totalPausedTime = 0;
	private autoSaveInterval: NodeJS.Timeout | null = null;
	private cardStartTime: Date | null = null;
	private cardStatistics: Map<string, CardStatistics> = new Map();
	public onCardComplete?: (stats: CardStatistics) => void;
	public saveResults?: () => Promise<void>;

	constructor(storage: LocalStorageService) {
		this.storage = storage;
		this.inputValidator = new InputValidator();
		this.state = this.getInitialState();
	}

	private getInitialState(): PracticeModeState {
		return {
			currentCardIndex: 0,
			completedCards: [],
			statistics: {
				totalKeystrokes: 0,
				correctKeystrokes: 0,
				mistakes: 0,
				wpm: 0,
				accuracy: 0
			}
		};
	}

	initialize(): void {
		try {
			this.cards = getKarutaCards();
		} catch (error) {
			console.error('Failed to load cards, using fallback data', error);
			this.cards = this.getFallbackCards();
		}
		this.state = this.getInitialState();
		this.startTime = new Date();
		this.cardStartTime = new Date();
	}

	getMode(): string {
		return 'practice';
	}

	getCards(): KarutaCard[] {
		return this.cards;
	}

	getState(): PracticeModeState {
		return { ...this.state };
	}

	getCurrentCard(): KarutaCard | null {
		if (this.state.currentCardIndex >= this.cards.length) {
			return null;
		}
		return this.cards[this.state.currentCardIndex];
	}

	getProgress(): string {
		return `${this.state.currentCardIndex + 1}/${this.cards.length}`;
	}

	isComplete(): boolean {
		return this.state.currentCardIndex >= this.cards.length;
	}

	moveToNextCard(): void {
		if (this.state.currentCardIndex < this.cards.length) {
			this.state.currentCardIndex++;
			this.cardStartTime = new Date();
		}
	}

	processInput(input: string): InputResult | null {
		if (this.pauseTime !== null) {
			return null;
		}

		const currentCard = this.getCurrentCard();
		if (!currentCard) {
			return null;
		}

		const targetText = currentCard.hiragana.replace(/\s/g, '');
		const result = this.inputValidator.validateInput(input, targetText);

		this.state.statistics.totalKeystrokes = input.length;

		if (result.isValid) {
			this.state.statistics.correctKeystrokes = input.length;

			if (result.isComplete) {
				this.completeCurrentCard(currentCard);
				this.moveToNextCard();
			}
		} else {
			this.state.statistics.mistakes++;
		}

		this.updateStatistics();

		return {
			isCorrect: result.isValid,
			isComplete: result.isComplete || false
		};
	}

	private completeCurrentCard(card: KarutaCard): void {
		this.state.completedCards.push(card.id);

		const cardTime = this.cardStartTime ? new Date().getTime() - this.cardStartTime.getTime() : 0;

		const stats: CardStatistics = {
			cardId: card.id,
			attempts: 1,
			time: cardTime,
			mistakes: 0,
			accuracy: 100
		};

		this.cardStatistics.set(card.id, stats);

		if (this.onCardComplete) {
			this.onCardComplete(stats);
		}
	}

	skipCard(): void {
		this.moveToNextCard();
	}

	private updateStatistics(): void {
		const total = this.state.statistics.totalKeystrokes;
		const correct = this.state.statistics.correctKeystrokes;

		if (total > 0) {
			this.state.statistics.accuracy = (correct / total) * 100;
		}

		const elapsedMinutes = this.getElapsedTime() / 60000;
		if (elapsedMinutes > 0) {
			const words = correct / 5; // 5文字を1単語と仮定
			this.state.statistics.wpm = words / elapsedMinutes;
		}
	}

	startAutoSave(): void {
		this.autoSaveInterval = setInterval(() => {
			this.saveSession();
		}, 5000);
	}

	stopAutoSave(): void {
		if (this.autoSaveInterval) {
			clearInterval(this.autoSaveInterval);
			this.autoSaveInterval = null;
		}
	}

	saveSession(): void {
		try {
			const session: PracticeModeSession = {
				mode: 'practice',
				currentCardIndex: this.state.currentCardIndex,
				completedCards: this.state.completedCards,
				startTime: this.startTime?.toISOString() || new Date().toISOString(),
				totalElapsedTime: this.getElapsedTime(),
				statistics: { ...this.state.statistics }
			};

			this.storage.saveSession(session);
		} catch (error) {
			console.warn('Failed to save session', error);
		}
	}

	resumeFromSession(): void {
		try {
			const session = this.storage.loadSession() as PracticeModeSession | null;

			if (session && session.mode === 'practice' && this.isValidSession(session)) {
				this.state = {
					currentCardIndex: session.currentCardIndex,
					completedCards: session.completedCards,
					statistics: { ...session.statistics }
				};
				this.startTime = new Date(session.startTime);
				this.totalPausedTime =
					new Date().getTime() - this.startTime.getTime() - session.totalElapsedTime;
			} else {
				this.initialize();
			}
		} catch (error) {
			console.error('Failed to resume session', error);
			this.initialize();
		}
	}

	private isValidSession(session: unknown): session is SavedSession {
		const s = session as Record<string, unknown>;
		return (
			typeof s?.currentCardIndex === 'number' &&
			Array.isArray(s?.completedCards) &&
			typeof s?.statistics === 'object'
		);
	}

	async completeGame(): Promise<void> {
		this.stopAutoSave();
		this.storage.clearSession();

		if (this.saveResults) {
			await this.saveResults();
		}
	}

	startTimer(): void {
		if (!this.startTime) {
			this.startTime = new Date();
		}
	}

	pause(): void {
		if (!this.pauseTime) {
			this.pauseTime = new Date();
			this.stopAutoSave();
		}
	}

	resume(): void {
		if (this.pauseTime) {
			this.totalPausedTime += new Date().getTime() - this.pauseTime.getTime();
			this.pauseTime = null;
			this.startAutoSave();
		}
	}

	getElapsedTime(): number {
		if (!this.startTime) {
			return 0;
		}

		const now = this.pauseTime || new Date();
		return now.getTime() - this.startTime.getTime() - this.totalPausedTime;
	}

	getCompletionSummary(): CompletionSummary {
		const totalCards = this.cards.length;
		const completedCards = this.state.completedCards.length;
		const skippedCards = totalCards - completedCards;

		const difficultCards = Array.from(this.cardStatistics.values())
			.sort((a, b) => b.mistakes - a.mistakes)
			.slice(0, 5);

		return {
			totalCards,
			completedCards,
			skippedCards,
			totalTime: this.getElapsedTime(),
			averageWpm: this.state.statistics.wpm,
			overallAccuracy: this.state.statistics.accuracy,
			difficultCards
		};
	}

	private getFallbackCards(): KarutaCard[] {
		// 44枚のフォールバックデータ
		const ids = [
			'a',
			'i',
			'u',
			'e',
			'o',
			'ka',
			'ki',
			'ku',
			'ke',
			'ko',
			'sa',
			'shi',
			'su',
			'se',
			'so',
			'ta',
			'chi',
			'tsu',
			'te',
			'to',
			'na',
			'ni',
			'nu',
			'ne',
			'no',
			'ha',
			'hi',
			'fu',
			'he',
			'ho',
			'ma',
			'mi',
			'mu',
			'me',
			'mo',
			'ya',
			'yu',
			'yo',
			'ra',
			'ri',
			'ru',
			're',
			'ro',
			'wa'
		];

		return ids.map(
			(id) =>
				({
					id,
					hiragana: `${id} の かるた`,
					romaji: `${id} no karuta`,
					meaning: `Card ${id}`,
					category: 'culture' as const,
					difficulty: 'medium' as const
				}) as KarutaCard
		);
	}
}
