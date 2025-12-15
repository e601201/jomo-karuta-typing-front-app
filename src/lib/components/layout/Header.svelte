<script lang="ts">
	import type { User } from '@supabase/supabase-js';

	let { user }: { user: User | null } = $props();
</script>

<nav aria-label="Global" class="bg-green-100/30 backdrop-blur-md sticky top-0 z-40">
	<div class="mx-auto max-w-7xl px-8">
		<div class="flex h-16 items-center justify-between">
			<div class="flex">
				<a href="/" class="-m-1.5 p-1.5 flex items-center">
					<span class="sr-only">上毛かるたタイピング</span>
					<span class="ml-2 text-xl text-gray-600">上毛かるたタイピング</span>
				</a>
			</div>
			<div class="flex justify-end">
				{#if user}
					<a
						href="/profile"
						class="text-xl font-semibold leading-6 text-gray-900 hover:text-gray-600"
					>
						プロフィール
						<span aria-hidden="true">&rarr;</span>
					</a>
				{:else}
					<a
						href="/auth/login"
						class="text-xl font-semibold leading-6 text-gray-900 hover:text-gray-600"
					>
						ログイン
						<span aria-hidden="true">&rarr;</span>
					</a>
				{/if}
			</div>
		</div>
	</div>
</nav>
