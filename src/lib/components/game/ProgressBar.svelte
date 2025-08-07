<script lang="ts">
	interface Props {
		current: number;
		total: number;
	}

	let { current, total }: Props = $props();

	const percentage = $derived(Math.round((current / total) * 100));
</script>

<div class="mb-4 h-6 w-full rounded-full bg-gray-200">
	<div
		class="flex h-6 items-center justify-center rounded-full bg-green-600 transition-all duration-500"
		style="width: {percentage}%"
	>
		{#if percentage > 10}
			<span class="text-sm font-bold text-white">{percentage}%</span>
		{/if}
	</div>
</div>
