<script lang="ts">
	import { saveScore } from '$lib/services/supabaseService';
	import { X, Trophy, Send } from 'lucide-svelte';

	interface Props {
		isOpen: boolean;
		score: number;
		onClose: () => void;
		onSuccess?: (nickName: string) => void;
	}

	let { isOpen, score, onClose, onSuccess }: Props = $props();

	let nickName = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

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
			
			// スコアを保存
			const result = await saveScore(nameToSave, score);
			
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
		if (e.key === 'Enter' && !loading) {
			handleSubmit();
		}
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

{#if isOpen}
	<!-- オーバーレイ -->
	<div 
		class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
		onclick={(e) => {
			if (e.target === e.currentTarget) onClose();
		}}
		onkeydown={handleKeydown}
		tabindex="-1"
		role="dialog"
		aria-modal="true"
		aria-labelledby="ranking-modal-title"
	>
		<!-- モーダル本体 -->
		<div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
			<!-- ヘッダー -->
			<div class="flex items-center justify-between mb-4">
				<h2 id="ranking-modal-title" class="text-2xl font-bold text-gray-800 flex items-center gap-2">
					<Trophy class="h-6 w-6 text-yellow-500" />
					ランキング登録
				</h2>
				<button
					onclick={onClose}
					class="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
					aria-label="閉じる"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			{#if success}
				<!-- 成功メッセージ -->
				<div class="py-8 text-center">
					<div class="mb-4">
						<Trophy class="h-16 w-16 text-yellow-500 mx-auto animate-bounce" />
					</div>
					<p class="text-gray-800 text-xl font-bold mb-2">登録完了！</p>
					<p class="text-gray-600">ランキングに登録されました</p>
				</div>
			{:else}
				<!-- スコア表示 -->
				<div class="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4 mb-6">
					<p class="text-gray-600 text-sm mb-1">あなたのスコア</p>
					<p class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
						{score.toLocaleString()}
					</p>
				</div>

				<!-- 入力フォーム -->
				<div class="space-y-4">
					<div>
						<label for="nickname" class="block text-gray-700 text-sm font-medium mb-2">
							ニックネーム
						</label>
						<input
							id="nickname"
							type="text"
							bind:value={nickName}
							placeholder="名無しの挑戦者"
							maxlength="20"
							disabled={loading}
							class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors disabled:opacity-50 disabled:bg-gray-100"
						/>
						<p class="text-gray-500 text-xs mt-1">
							最大20文字・空欄の場合は「名無しの挑戦者」として登録されます
						</p>
					</div>

					{#if error}
						<div class="bg-red-50 border border-red-200 rounded-lg p-3">
							<p class="text-red-600 text-sm">{error}</p>
						</div>
					{/if}

					<!-- ボタン -->
					<div class="flex gap-3">
						<button
							onclick={onClose}
							disabled={loading}
							class="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							キャンセル
						</button>
						<button
							onclick={handleSubmit}
							disabled={loading}
							class="flex-1 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if loading}
								<span class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
								登録中...
							{:else}
								<Send class="h-4 w-4 mr-2" />
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
		animation: fade-in 0.2s ease-out, zoom-in 0.2s ease-out;
	}
</style>