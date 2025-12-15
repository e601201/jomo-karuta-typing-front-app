<!-- TODO: email passwordによる登録は一旦非表示 -->

<script lang="ts">
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
	let showPassword = $state(false);
</script>

<div
	class="min-h-screen bg-linear-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 py-8"
>
	<div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
		<h1 class="text-3xl font-bold text-center text-gray-800 mb-8">新規登録</h1>

		{#if form?.error}
			<div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
				{form.error}
			</div>
		{/if}

		{#if form?.success}
			<div class="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md mb-6">
				{form.message}
			</div>
		{:else}
			<div class="space-y-3 mb-4">
				<form method="POST" action="?/oauth" onsubmit={() => (loading = true)}>
					<input type="hidden" name="provider" value="google" />
					<button
						type="submit"
						disabled={loading}
						class="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 transition-colors font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
							<path
								fill="#4285F4"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="#34A853"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="#FBBC05"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="#EA4335"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						Googleで登録
					</button>
				</form>
			</div>

			<div class="relative my-4">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-300"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="bg-white px-2 text-gray-500">または</span>
				</div>
			</div>
			<form method="POST" action="?/signup" onsubmit={() => (loading = true)}>
				<div class="mb-4">
					<label for="nickname" class="block text-sm font-medium text-gray-700 mb-2">
						ニックネーム <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						id="nickname"
						name="nickname"
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="表示名"
					/>
				</div>

				<div class="mb-4">
					<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
						メールアドレス <span class="text-red-500">*</span>
					</label>
					<input
						type="email"
						id="email"
						name="email"
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="example@email.com"
					/>
				</div>

				<div class="mb-4">
					<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
						パスワード <span class="text-red-500">*</span>
						<span class="text-xs text-gray-500">（8文字以上）</span>
					</label>
					<div class="relative">
						<input
							type={showPassword ? 'text' : 'password'}
							id="password"
							name="password"
							required
							minlength="8"
							class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
							placeholder="••••••••"
						/>
						<button
							type="button"
							onclick={() => (showPassword = !showPassword)}
							class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
						>
							{#if showPassword}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
									<path
										fill-rule="evenodd"
										d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
										clip-rule="evenodd"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fill-rule="evenodd"
										d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
										clip-rule="evenodd"
									/>
									<path
										d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"
									/>
								</svg>
							{/if}
						</button>
					</div>
				</div>

				<div class="mb-6">
					<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
						パスワード（確認） <span class="text-red-500">*</span>
					</label>
					<input
						type="password"
						id="confirmPassword"
						name="confirmPassword"
						required
						minlength="8"
						class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder="••••••••"
					/>
				</div>

				<div class="mb-6">
					<label class="flex items-start">
						<input
							type="checkbox"
							name="agreeToTerms"
							required
							class="mt-1 mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
						/>
						<span class="text-sm text-gray-600">
							<a href="/terms" class="text-blue-600 hover:text-blue-700" target="_blank">利用規約</a
							>
							および
							<a href="/privacy" class="text-blue-600 hover:text-blue-700" target="_blank"
								>プライバシーポリシー</a
							>
							に同意します
						</span>
					</label>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
				>
					{loading ? '登録中...' : 'アカウントを作成'}
				</button>
			</form>
		{/if}

		<div class="mt-6 text-center">
			<a href="/auth/login" class="text-blue-600 hover:text-blue-700 text-sm">
				既にアカウントをお持ちの方はこちら
			</a>
		</div>
	</div>
</div>
