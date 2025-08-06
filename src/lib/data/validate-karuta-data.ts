/**
 * カルタデータの検証スクリプト
 */

import { karutaCards } from './karuta-cards';

// 検証結果
interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

export function validateKarutaData(): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// 1. 札の総数チェック
	if (karutaCards.length !== 44) {
		errors.push(`札の総数が44枚ではありません: ${karutaCards.length}枚`);
	}

	// 2. IDの重複チェック
	const idSet = new Set<string>();
	const duplicateIds: string[] = [];
	karutaCards.forEach(card => {
		if (idSet.has(card.id)) {
			duplicateIds.push(card.id);
		}
		idSet.add(card.id);
	});
	if (duplicateIds.length > 0) {
		errors.push(`重複したIDがあります: ${duplicateIds.join(', ')}`);
	}

	// 3. 必須フィールドのチェック
	karutaCards.forEach((card, index) => {
		if (!card.id) {
			errors.push(`札[${index}]: IDが未設定`);
		}
		if (!card.hiragana) {
			errors.push(`札[${card.id}]: ひらがな読みが未設定`);
		}
		if (!card.romaji) {
			errors.push(`札[${card.id}]: ローマ字表記が未設定`);
		}
		if (!card.meaning) {
			errors.push(`札[${card.id}]: 意味・解説が未設定`);
		}
		if (!card.category) {
			errors.push(`札[${card.id}]: カテゴリーが未設定`);
		}
		if (!card.difficulty) {
			errors.push(`札[${card.id}]: 難易度が未設定`);
		}
	});

	// 4. カテゴリーの妥当性チェック
	const validCategories = ['history', 'geography', 'culture', 'nature', 'industry'];
	karutaCards.forEach(card => {
		if (!validCategories.includes(card.category)) {
			errors.push(`札[${card.id}]: 無効なカテゴリー: ${card.category}`);
		}
	});

	// 5. 難易度の妥当性チェック
	const validDifficulties = ['easy', 'medium', 'hard'];
	karutaCards.forEach(card => {
		if (!validDifficulties.includes(card.difficulty)) {
			errors.push(`札[${card.id}]: 無効な難易度: ${card.difficulty}`);
		}
	});

	// 6. カテゴリー分布のチェック（警告）
	const categoryCount: Record<string, number> = {};
	karutaCards.forEach(card => {
		categoryCount[card.category] = (categoryCount[card.category] || 0) + 1;
	});
	Object.entries(categoryCount).forEach(([category, count]) => {
		if (count < 5) {
			warnings.push(`カテゴリー[${category}]の札が少ないです: ${count}枚`);
		}
	});

	// 7. 難易度分布のチェック（警告）
	const difficultyCount: Record<string, number> = {};
	karutaCards.forEach(card => {
		difficultyCount[card.difficulty] = (difficultyCount[card.difficulty] || 0) + 1;
	});
	Object.entries(difficultyCount).forEach(([difficulty, count]) => {
		if (count < 10) {
			warnings.push(`難易度[${difficulty}]の札が少ないです: ${count}枚`);
		}
	});

	return {
		valid: errors.length === 0,
		errors,
		warnings
	};
}

// スタンドアロン実行用の関数
export function runValidation() {
	const result = validateKarutaData();
	
	console.log('=== 上毛カルタデータ検証結果 ===');
	console.log(`総札数: ${karutaCards.length}枚`);
	
	if (result.valid) {
		console.log('✅ データは正常です');
	} else {
		console.log('❌ エラーが見つかりました:');
		result.errors.forEach(error => console.log(`  - ${error}`));
	}
	
	if (result.warnings.length > 0) {
		console.log('⚠️  警告:');
		result.warnings.forEach(warning => console.log(`  - ${warning}`));
	}
	
	// カテゴリー別集計
	const categoryCount: Record<string, number> = {};
	karutaCards.forEach(card => {
		categoryCount[card.category] = (categoryCount[card.category] || 0) + 1;
	});
	console.log('\n📊 カテゴリー別集計:');
	Object.entries(categoryCount).forEach(([category, count]) => {
		console.log(`  - ${category}: ${count}枚`);
	});
	
	// 難易度別集計
	const difficultyCount: Record<string, number> = {};
	karutaCards.forEach(card => {
		difficultyCount[card.difficulty] = (difficultyCount[card.difficulty] || 0) + 1;
	});
	console.log('\n📊 難易度別集計:');
	Object.entries(difficultyCount).forEach(([difficulty, count]) => {
		console.log(`  - ${difficulty}: ${count}枚`);
	});
	
	return result.valid;
}