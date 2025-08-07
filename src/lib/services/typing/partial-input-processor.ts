import type {
	PartialInputConfig,
	PartialInputMode,
	PartialInputRange,
	PartialInputPreset
} from '$lib/types';

/**
 * 部分入力モードの処理を管理するクラス
 */
export class PartialInputProcessor {
	private currentRange: PartialInputRange | null = null;

	/**
	 * 部分入力範囲を計算
	 */
	calculateRange(text: string, config: PartialInputConfig): PartialInputRange {
		// 無効な場合は全文を返す
		if (!config.enabled || !text) {
			return {
				start: 0,
				end: text.length,
				text: text,
				fullText: text
			};
		}

		const textLength = text.length;
		const targetCount = Math.min(config.characterCount, textLength);

		let start = 0;
		let end = targetCount;

		// モードに応じて範囲を決定
		switch (config.mode) {
			case 'random':
				if (targetCount < textLength) {
					start = Math.floor(Math.random() * (textLength - targetCount + 1));
					end = start + targetCount;
				}
				break;

			case 'important':
				// 将来実装: 重要部分の自動検出
				// 現在は先頭モードと同じ
				break;

			case 'start':
			default:
				// 先頭から指定文字数
				break;
		}

		return {
			start,
			end,
			text: text.substring(start, end),
			fullText: text
		};
	}

	/**
	 * 現在の範囲を設定
	 */
	setRange(range: PartialInputRange): void {
		this.currentRange = range;
	}

	/**
	 * 指定位置が範囲内かチェック
	 */
	isWithinRange(position: number): boolean {
		if (!this.currentRange) return true;
		return position >= this.currentRange.start && position < this.currentRange.end;
	}

	/**
	 * 部分入力が完了したかチェック
	 */
	isComplete(position: number): boolean {
		if (!this.currentRange) return false;
		return position >= this.currentRange.end;
	}

	/**
	 * 進捗率を計算（0-100）
	 */
	calculateProgress(position: number): number {
		if (!this.currentRange) return 0;

		const rangeLength = this.currentRange.end - this.currentRange.start;
		if (rangeLength === 0) return 100;

		const relativePosition = Math.max(0, position - this.currentRange.start);
		const progress = (relativePosition / rangeLength) * 100;

		// 小数点第2位まで
		return Math.round(progress * 100) / 100;
	}

	/**
	 * デフォルト設定を取得
	 */
	getDefaultConfig(): PartialInputConfig {
		return {
			enabled: false,
			characterCount: 5,
			mode: 'start',
			highlightRange: true
		};
	}

	/**
	 * プリセットを適用
	 */
	applyPreset(preset: PartialInputPreset): PartialInputConfig {
		switch (preset) {
			case 'beginner':
				return {
					enabled: true,
					characterCount: 5,
					mode: 'start',
					highlightRange: true
				};

			case 'intermediate':
				return {
					enabled: true,
					characterCount: 10,
					mode: 'start',
					highlightRange: true
				};

			case 'advanced':
				return {
					enabled: false,
					characterCount: 10,
					mode: 'start',
					highlightRange: true
				};

			case 'custom':
			default:
				return this.getDefaultConfig();
		}
	}

	/**
	 * 範囲をリセット
	 */
	reset(): void {
		this.currentRange = null;
	}

	/**
	 * 現在の範囲を取得
	 */
	getCurrentRange(): PartialInputRange | null {
		return this.currentRange;
	}

	/**
	 * 相対位置から絶対位置に変換
	 */
	toAbsolutePosition(relativePosition: number): number {
		if (!this.currentRange) return relativePosition;
		return this.currentRange.start + relativePosition;
	}

	/**
	 * 絶対位置から相対位置に変換
	 */
	toRelativePosition(absolutePosition: number): number {
		if (!this.currentRange) return absolutePosition;
		return Math.max(0, absolutePosition - this.currentRange.start);
	}
}
