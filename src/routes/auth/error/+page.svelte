<script lang="ts">
	import { onMount } from 'svelte';

	let countdown = $state(5);

	onMount(() => {
		const timer = setInterval(() => {
			countdown--;
			if (countdown === 0) {
				window.location.href = '/auth/login';
			}
		}, 1000);

		return () => clearInterval(timer);
	});
</script>

<div
	class="min-h-screen bg-linear-to-br from-green-50 to-blue-50 flex items-center justify-center px-4"
>
	<div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
		<svg
			class="w-16 h-16 mx-auto mb-4 text-red-500"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>

		<h1 class="text-2xl font-bold text-gray-800 mb-4">認証エラー</h1>

		<p class="text-gray-600 mb-6">
			認証処理中にエラーが発生しました。<br />
			お手数ですが、もう一度ログインしてください。
		</p>

		<p class="text-sm text-gray-500 mb-6">
			{countdown}秒後にログイン画面にリダイレクトします...
		</p>

		<a
			href="/auth/login"
			class="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
		>
			ログイン画面に戻る
		</a>
	</div>
</div>
