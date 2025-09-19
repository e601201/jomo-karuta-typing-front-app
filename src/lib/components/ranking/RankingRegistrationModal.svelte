<script lang="ts">
	import { saveScore } from '$lib/services/supabaseService';
	import { X, Trophy, Send } from 'lucide-svelte';
	import type { RandomModeDifficulty } from '$lib/types';

	interface Props {
		isOpen: boolean;
		score: number;
		difficulty?: RandomModeDifficulty;
		onClose: () => void;
		onSuccess?: (nickName: string) => void;
	}

	let { isOpen, score, difficulty = 'standard', onClose, onSuccess }: Props = $props();

	let nickName = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);
	let isComposing = $state(false);

	// LocalStorageから前回の名前を取得
	$effect(() => {
		if (isOpen && typeof window !== 'undefined') {
			const savedName = localStorage.getItem('lastNickName');
			if (savedName) {
				nickName = savedName;
			}
		}
	});

	async function handleSubmit() {
		if (loading) return;

		loading = true;
		error = null;

		try {
			const nameToSave = nickName.trim() || '名無しの挑戦者';

			// スコアを保存（難易度付き）
			const result = await saveScore(nameToSave, score, difficulty);

			if (result.success) {
				// 名前をLocalStorageに保存
				if (nickName.trim()) {
					localStorage.setItem('lastNickName', nickName.trim());
				}

				success = true;
				onSuccess?.(nameToSave);

				// 少し待ってから閉じる
				setTimeout(() => {
					onClose();
					// リセット
					success = false;
					error = null;
				}, 2000);
			} else {
				error = result.error || 'スコアの登録に失敗しました';
			}
		} catch (err) {
			error = 'エラーが発生しました';
			console.error('Failed to save score:', err);
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		// IMEで変換中の場合はEnterキーで送信しない
		if (e.key === 'Enter' && !loading && !isComposing) {
			handleSubmit();
		}
		if (e.key === 'Escape') {
			onClose();
		}
	}

	function handleCompositionStart() {
		isComposing = true;
	}

	function handleCompositionEnd() {
		isComposing = false;
	}
</script>

{#if isOpen}
	<!-- オーバーレイ -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') onClose();
		}}
		tabindex="-1"
		role="dialog"
		aria-modal="true"
		aria-labelledby="ranking-modal-title"
	>
		<!-- モーダル本体 -->
		<div
			class="animate-in fade-in zoom-in w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl duration-200"
		>
			<!-- ヘッダー -->
			<div class="mb-4 flex items-center justify-between">
				<h2
					id="ranking-modal-title"
					class="flex items-center gap-2 text-2xl font-bold text-gray-800"
				>
					<Trophy class="h-6 w-6 text-yellow-500" />
					ランキング登録
				</h2>
				<button
					onclick={onClose}
					class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
					aria-label="閉じる"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			{#if success}
				<!-- 成功メッセージ -->
				<div class="py-8 text-center">
					<div class="mb-4">
						<Trophy class="mx-auto h-16 w-16 animate-bounce text-yellow-500" />
					</div>
					<p class="mb-2 text-xl font-bold text-gray-800">登録完了！</p>
					<p class="text-gray-600">ランキングに登録されました</p>
				</div>
			{:else}
				<!-- スコア表示 -->
				<div
					class="mb-6 rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-4"
				>
					<div class="flex items-center justify-between">
						<div>
							<p class="mb-1 text-sm text-gray-600">あなたのスコア</p>
							<p
								class="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-4xl font-bold text-transparent"
							>
								{score.toLocaleString()}
							</p>
						</div>
						<div class="text-right">
							<p class="mb-1 text-sm text-gray-600">難易度</p>
							<p class="text-lg font-bold">
								{#if difficulty === 'beginner'}
									<span class="text-green-500">🔰 初心者</span>
								{:else if difficulty === 'advanced'}
									<span class="text-purple-500">🏆 上級者</span>
								{:else}
									<span class="text-blue-500">📖 標準</span>
								{/if}
							</p>
						</div>
					</div>
				</div>

				<!-- 入力フォーム -->
				<div class="space-y-4">
					<div>
						<label for="nickname" class="mb-2 block text-sm font-medium text-gray-700">
							ニックネーム
						</label>
						<input
							id="nickname"
							type="text"
							bind:value={nickName}
							placeholder="名無しの挑戦者"
							maxlength="20"
							disabled={loading}
							oncompositionstart={handleCompositionStart}
							oncompositionend={handleCompositionEnd}
							onkeydown={handleKeydown}
							class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 placeholder-gray-400 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:bg-gray-100 disabled:opacity-50"
						/>
						<p class="mt-1 text-xs text-gray-500">
							最大20文字・空欄の場合は「名無しの挑戦者」として登録されます
						</p>
					</div>

					{#if error}
						<div class="rounded-lg border border-red-200 bg-red-50 p-3">
							<p class="text-sm text-red-600">{error}</p>
						</div>
					{/if}

					<!-- ボタン -->
					<div class="flex gap-3">
						<button
							onclick={onClose}
							disabled={loading}
							class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							キャンセル
						</button>
						<button
							onclick={handleSubmit}
							disabled={loading}
							class="flex flex-1 items-center justify-center rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 font-bold text-white transition-all hover:from-yellow-600 hover:to-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if loading}
								<span
									class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-b-2 border-white"
								></span>
								登録中...
							{:else}
								<Send class="mr-2 h-4 w-4" />
								登録する
							{/if}
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes zoom-in {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}

	.animate-in {
		animation:
			fade-in 0.2s ease-out,
			zoom-in 0.2s ease-out;
	}
</style>
