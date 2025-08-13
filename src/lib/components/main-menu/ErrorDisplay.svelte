<script lang="ts">
	interface Props {
		error: string;
		onretry: () => void;
	}

	let { error, onretry }: Props = $props();
</script>

<div class="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center">
	<p class="mb-4 text-red-600">{error}</p>
	<button
		onclick={onretry}
		class="rounded-lg bg-red-600 px-6 py-2 text-white transition-colors hover:bg-red-700"
	>
		再試行
	</button>
</div>
