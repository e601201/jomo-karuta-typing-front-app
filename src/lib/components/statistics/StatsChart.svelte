<script lang="ts">
	import type { ChartData } from '$lib/types/game';
	import { onMount } from 'svelte';

	interface ChartOptions {
		height?: number;
		showGrid?: boolean;
		showLegend?: boolean;
	}

	interface Props {
		data: ChartData;
		type: 'line' | 'bar' | 'pie' | 'heatmap';
		title?: string;
		options?: ChartOptions;
		showTooltip?: boolean;
		animate?: boolean;
		animationDelay?: number;
		emptyMessage?: string;
		showLegend?: boolean;
	}

	let {
		data,
		type,
		title,
		options = {},
		showTooltip = true,
		animate = true,
		animationDelay = 0,
		emptyMessage = 'データがありません',
		showLegend = false
	}: Props = $props();

	let containerElement: HTMLDivElement;
	let tooltipVisible = $state(false);
	let tooltipContent = $state('');
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	let isEmpty = $derived(
		!data.datasets || data.datasets.length === 0 || data.datasets[0].data.length === 0
	);
	let chartHeight = $derived(options.height || 300);

	// Handle data point hover
	function handleDataPointHover(event: MouseEvent, value: number, label: string) {
		if (!showTooltip) return;

		const rect = containerElement.getBoundingClientRect();
		tooltipX = event.clientX - rect.left;
		tooltipY = event.clientY - rect.top;
		tooltipContent = `${value} ${data.datasets[0].label || ''}`;
		tooltipVisible = true;
	}

	function handleMouseLeave() {
		tooltipVisible = false;
	}

	// Calculate pie chart segments
	function calculatePieSegments() {
		if (type !== 'pie' || isEmpty) return [];

		const total = data.datasets[0].data.reduce((sum, val) => sum + val, 0);
		let currentAngle = -90; // Start from top

		return data.datasets[0].data.map((value, index) => {
			const percentage = (value / total) * 100;
			const angle = (percentage / 100) * 360;
			const startAngle = currentAngle;
			currentAngle += angle;

			const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
			const color = data.datasets[0].color || colors[index % colors.length];

			return {
				value,
				percentage,
				label: data.labels[index],
				color,
				startAngle,
				endAngle: currentAngle,
				largeArc: angle > 180 ? 1 : 0
			};
		});
	}

	// Create SVG path for pie segment
	function createPieSegmentPath(segment: any, radius: number, centerX: number, centerY: number) {
		const startAngleRad = (segment.startAngle * Math.PI) / 180;
		const endAngleRad = (segment.endAngle * Math.PI) / 180;

		const x1 = centerX + radius * Math.cos(startAngleRad);
		const y1 = centerY + radius * Math.sin(startAngleRad);
		const x2 = centerX + radius * Math.cos(endAngleRad);
		const y2 = centerY + radius * Math.sin(endAngleRad);

		return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${segment.largeArc} 1 ${x2} ${y2} Z`;
	}

	// Get max value for scaling
	let maxValue = $derived(isEmpty ? 0 : Math.max(...data.datasets[0].data));

	// Generate description for screen readers
	let screenReaderDescription = $derived(
		isEmpty
			? emptyMessage
			: data.labels.map((label, i) => `${label}: ${data.datasets[0].data[i]}`).join(', ')
	);
</script>

<div
	bind:this={containerElement}
	data-testid="chart-container"
	class="relative w-full"
	style="height: {chartHeight}px"
	role="img"
	aria-label={title || 'Chart'}
>
	{#if title}
		<h3 class="mb-4 text-lg font-semibold">{title}</h3>
	{/if}

	<div data-testid="chart-description" class="sr-only">
		{screenReaderDescription}
	</div>

	{#if isEmpty}
		<div class="flex h-full items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800">
			<p class="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
		</div>
	{:else if type === 'line'}
		<div data-testid="line-chart" data-points={data.labels.length} class="relative h-full">
			<svg class="h-full w-full">
				<!-- Grid lines -->
				{#if options.showGrid !== false}
					{#each Array(5) as _, i}
						<line
							x1="0"
							y1={`${i * 25}%`}
							x2="100%"
							y2={`${i * 25}%`}
							stroke="#e5e7eb"
							stroke-dasharray="2,2"
						/>
					{/each}
				{/if}

				<!-- Line -->
				<polyline
					data-testid="chart-line"
					class={animate ? 'animate-draw-line' : ''}
					fill="none"
					stroke={data.datasets[0].color || '#3B82F6'}
					stroke-width="2"
					points={data.labels
						.map((_, i) => {
							const x = (i / (data.labels.length - 1)) * 100;
							const y = 100 - (data.datasets[0].data[i] / maxValue) * 90;
							return `${x}%,${y}%`;
						})
						.join(' ')}
				/>

				<!-- Data points -->
				{#each data.labels as label, i}
					<circle
						data-testid={`data-point-${i}`}
						cx={`${(i / (data.labels.length - 1)) * 100}%`}
						cy={`${100 - (data.datasets[0].data[i] / maxValue) * 90}%`}
						r="4"
						fill={data.datasets[0].color || '#3B82F6'}
						role="img"
						aria-label={`${label}: ${data.datasets[0].data[i]}`}
						onmouseenter={(e) => handleDataPointHover(e, data.datasets[0].data[i], label)}
						onmouseleave={handleMouseLeave}
					/>
				{/each}
			</svg>

			<!-- X-axis labels -->
			<div class="mt-2 flex justify-between text-xs text-gray-600 dark:text-gray-400">
				{#each data.labels as label}
					<span>{label}</span>
				{/each}
			</div>
		</div>
	{:else if type === 'bar'}
		<div data-testid="bar-chart" class="relative h-full overflow-x-auto">
			<div
				data-testid="chart-scroll-container"
				class="flex h-full min-w-full items-end gap-2 overflow-x-auto"
			>
				{#each data.labels as label, i}
					<div class="flex flex-1 flex-col items-center">
						<div
							data-testid={`bar-${i}`}
							class="w-full rounded-t bg-blue-500 {animate ? 'animate-grow-height' : ''}"
							style="height: {(data.datasets[0].data[i] / maxValue) * 90}%; animation-delay: {i *
								animationDelay}ms; background-color: {data.datasets[0].color || '#10B981'}"
							role="img"
							aria-label={`${label}: ${data.datasets[0].data[i]}`}
							onmouseenter={(e) => handleDataPointHover(e, data.datasets[0].data[i], label)}
							onmouseleave={handleMouseLeave}
						></div>
						<span class="mt-1 text-xs text-gray-600 dark:text-gray-400">{label}</span>
					</div>
				{/each}
			</div>
		</div>
	{:else if type === 'pie'}
		<div data-testid="pie-chart" class="relative flex h-full items-center justify-center">
			<svg viewBox="0 0 200 200" class="h-full w-full max-w-xs">
				{#each calculatePieSegments() as segment, i}
					<path
						data-testid={`pie-segment-${i}`}
						d={createPieSegmentPath(segment, 80, 100, 100)}
						fill={segment.color}
						stroke="white"
						stroke-width="2"
						class={animate ? 'animate-scale-in' : ''}
						style="animation-delay: {i * 100}ms"
					/>
				{/each}
			</svg>

			<!-- Legend -->
			{#if showLegend}
				<div data-testid="chart-legend" class="absolute top-0 right-0">
					{#each calculatePieSegments() as segment}
						<div class="flex items-center gap-2 text-sm">
							<div class="h-3 w-3 rounded" style="background-color: {segment.color}"></div>
							<span>{segment.label} ({segment.percentage.toFixed(0)}%)</span>
						</div>
					{/each}
				</div>
			{:else}
				<!-- Inline labels -->
				<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
					{#each calculatePieSegments() as segment}
						<p class="text-xs">{segment.label} ({segment.percentage.toFixed(0)}%)</p>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Tooltip -->
	{#if showTooltip && tooltipVisible}
		<div
			data-testid="chart-tooltip"
			class="pointer-events-none absolute z-10 rounded bg-gray-800 px-2 py-1 text-xs text-white"
			style="left: {tooltipX}px; top: {tooltipY - 30}px"
		>
			{tooltipContent}
		</div>
	{/if}
</div>

<style>
	@keyframes drawLine {
		from {
			stroke-dasharray: 1000;
			stroke-dashoffset: 1000;
		}
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes growHeight {
		from {
			height: 0;
		}
	}

	@keyframes scaleIn {
		from {
			transform: scale(0);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}

	.animate-draw-line {
		animation: drawLine 1s ease-out forwards;
	}

	.animate-grow-height {
		animation: growHeight 0.5s ease-out forwards;
	}

	.animate-scale-in {
		animation: scaleIn 0.5s ease-out forwards;
		transform-origin: center;
	}
</style>
