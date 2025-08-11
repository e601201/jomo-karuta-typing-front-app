<script lang="ts">
	interface Props {
		input: string;
		highlights: string[];
	}

	let { input, highlights }: Props = $props();
</script>

<div class="mb-4 text-center">
	<div class="font-mono text-2xl">
		{#each input.split('') as char, index (index)}
			<span class={highlights[index] || 'text-gray-400'}>
				{char}
			</span>
		{/each}
		<span class="animate-pulse">|</span>
	</div>
</div>
