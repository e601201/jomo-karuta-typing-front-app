<script lang="ts">
	interface Props {
		input: string;
		position: number;
		highlights: string[];
	}

	let { input, position, highlights }: Props = $props();
</script>

<div class="mb-4 text-center">
	<div class="font-mono text-2xl">
		{#each input.split('') as char, index}
			<span class={highlights[index] || 'text-gray-400'}>
				{char}
			</span>
		{/each}
		<span class="animate-pulse">|</span>
	</div>
</div>
