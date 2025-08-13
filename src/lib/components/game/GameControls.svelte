<script lang="ts">
	interface Props {
		isPaused: boolean;
		onpause: () => void;
		onskip: () => void;
		onexit: () => void;
	}

	let { isPaused, onpause, onskip, onexit }: Props = $props();
</script>

<div class="flex justify-center gap-4">
	<button
		onclick={onpause}
		class="rounded-lg bg-yellow-600 px-6 py-2 text-white transition-colors hover:bg-yellow-700"
	>
		{isPaused ? '再開' : '一時停止'}
	</button>
	<button
		onclick={onskip}
		class="rounded-lg bg-gray-600 px-6 py-2 text-white transition-colors hover:bg-gray-700"
	>
		スキップ
	</button>
	<button
		onclick={onexit}
		class="rounded-lg bg-red-600 px-6 py-2 text-white transition-colors hover:bg-red-700"
	>
		終了
	</button>
</div>
