/**
 * ランダムモードサービス
 * カードをランダムな順序で出題する機能を提供
 */

import type { KarutaCard, RandomModeDifficulty } from '$lib/types';

/**
 * セッション状態の型定義
 */
export interface RandomSessionState {
	cards: KarutaCard[];
	currentIndex: number;
	sessionStarted: boolean;
	difficulty?: RandomModeDifficulty;
}

export class RandomModeService {
	private cards: KarutaCard[] = [];
	private currentIndex = 0;
	private sessionStarted = false;
	private difficulty: RandomModeDifficulty = 'standard';

	/**
	 * カードデックをシャッフル
	 * Fisher-Yatesアルゴリズムを使用して均等な分布を保証
	 *
	 * @param cards - シャッフルするカードの配列
	 * @returns シャッフルされたカードの新しい配列
	 */
	shuffleCards(cards: KarutaCard[]): KarutaCard[] {
		// 元の配列を変更しないように新しい配列を作成
		const shuffled = [...cards];

		// Fisher-Yatesアルゴリズム
		// 配列の最後から順に、ランダムに選んだ要素と交換していく
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}

		return shuffled;
	}

	/**
	 * セッションを開始
	 * カードをシャッフルして新しいセッションを開始する
	 *
	 * @param cards - 使用するカードの配列
	 * @param difficulty - 難易度設定（オプション）
	 */
	async startSession(cards: KarutaCard[], difficulty?: RandomModeDifficulty): Promise<void> {
		// 難易度を設定
		if (difficulty) {
			this.difficulty = difficulty;
		}
		
		// カードをシャッフルしてセッションを開始
		this.cards = this.shuffleCards(cards);
		this.currentIndex = 0;
		this.sessionStarted = true;
	}

	/**
	 * 次のカードを取得
	 * 現在のインデックスのカードを返し、インデックスを進める
	 *
	 * @returns 次のカード、またはセッション終了時はnull
	 */
	getNextCard(): KarutaCard | null {
		// セッションが開始されていない、または全カード出題済みの場合
		if (!this.sessionStarted || this.currentIndex >= this.cards.length) {
			return null;
		}

		const card = this.cards[this.currentIndex];
		this.currentIndex++;
		return card;
	}

	/**
	 * セッションが完了したかどうか
	 *
	 * @returns 全カードが出題済みの場合true
	 */
	isSessionComplete(): boolean {
		return this.sessionStarted && this.currentIndex >= this.cards.length;
	}

	/**
	 * セッション状態を取得
	 * 途中終了時の状態保存用
	 *
	 * @returns 現在のセッション状態
	 */
	getSessionState(): RandomSessionState {
		return {
			cards: this.cards,
			currentIndex: this.currentIndex,
			sessionStarted: this.sessionStarted,
			difficulty: this.difficulty
		};
	}

	/**
	 * セッション状態を復元
	 * 保存された状態から再開用
	 *
	 * @param state - 復元するセッション状態
	 */
	restoreSession(state: RandomSessionState): void {
		this.cards = state.cards || [];
		this.currentIndex = state.currentIndex || 0;
		this.sessionStarted = state.sessionStarted !== undefined ? state.sessionStarted : true;
		this.difficulty = state.difficulty || 'standard';
	}

	/**
	 * 現在の進捗を取得
	 *
	 * @returns 現在のカードインデックスと総カード数
	 */
	getProgress(): { current: number; total: number } {
		return {
			current: this.currentIndex,
			total: this.cards.length
		};
	}

	/**
	 * セッションをリセット
	 */
	reset(): void {
		this.cards = [];
		this.currentIndex = 0;
		this.sessionStarted = false;
		this.difficulty = 'standard';
	}
	
	/**
	 * 現在の難易度を取得
	 * 
	 * @returns 現在の難易度設定
	 */
	getDifficulty(): RandomModeDifficulty {
		return this.difficulty;
	}
	
	/**
	 * 難易度を設定
	 * 
	 * @param difficulty - 設定する難易度
	 */
	setDifficulty(difficulty: RandomModeDifficulty): void {
		this.difficulty = difficulty;
	}
}
