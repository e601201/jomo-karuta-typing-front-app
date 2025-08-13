<script lang="ts">
	interface Props {
		message?: string;
	}

	let { message = '読み込み中...' }: Props = $props();
</script>

<div class="flex min-h-[400px] flex-col items-center justify-center">
	<div
		data-testid="loading-spinner"
		class="h-12 w-12 animate-spin rounded-full border-b-2 border-green-600"
		role="status"
		aria-label="Loading"
	></div>
	<p class="mt-4 text-gray-600">{message}</p>
</div>
