<script lang="ts">
	import type { GameMode } from '$lib/types';

	interface Props {
		mode: GameMode;
		title: string;
		description: string;
		icon: string;
		disabled?: boolean;
		onclick: (mode: GameMode) => void;
	}

	let { mode, title, description, icon, disabled = false, onclick }: Props = $props();
</script>

<button
	onclick={() => onclick(mode)}
	{disabled}
	class="group min-h-[44px] w-full transform rounded-xl bg-white p-6 text-left shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
	aria-label={title}
	aria-describedby={`${mode}-description`}
>
	<div class="mb-4 text-4xl">{icon}</div>
	<h2 class="mb-2 text-xl font-bold text-gray-800">
		{title}
	</h2>
	<p id={`${mode}-description`} class="text-gray-600">
		{description}
	</p>
</button>
