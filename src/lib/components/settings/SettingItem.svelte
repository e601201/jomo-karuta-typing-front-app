<script lang="ts">
	interface SelectOption {
		value: string | number;
		label: string;
	}

	interface Props {
		label: string;
		description?: string;
		type: 'toggle' | 'slider' | 'select' | 'radio';
		value: any;
		onChange: (value: any) => void;
		options?: SelectOption[];
		min?: number;
		max?: number;
		step?: number;
		unit?: string;
		disabled?: boolean;
		error?: string;
		ariaLabel?: string;
	}

	let {
		label,
		description,
		type,
		value,
		onChange,
		options = [],
		min = 0,
		max = 100,
		step = 1,
		unit = '',
		disabled = false,
		error,
		ariaLabel
	}: Props = $props();

	// Generate unique ID for accessibility
	const inputId = `setting-${Math.random().toString(36).substr(2, 9)}`;

	function handleToggle() {
		if (!disabled) {
			onChange(!value);
		}
	}

	function handleSliderChange(event: Event) {
		if (!disabled) {
			const target = event.target as HTMLInputElement;
			const numValue = parseFloat(target.value);
			onChange(numValue);
		}
	}

	function handleSelectChange(event: Event) {
		if (!disabled) {
			const target = event.target as HTMLSelectElement;
			onChange(target.value);
		}
	}

	function handleRadioChange(optionValue: string | number) {
		if (!disabled) {
			onChange(optionValue);
		}
	}
</script>

<div class="setting-item {disabled ? 'opacity-50' : ''}">
	<div class="setting-header">
		<label for={inputId} class="setting-label">
			{label}
		</label>
		{#if description}
			<p class="setting-description text-sm text-gray-600 dark:text-gray-400">
				{description}
			</p>
		{/if}
	</div>

	<div class="setting-control">
		{#if type === 'toggle'}
			<button
				id={inputId}
				role="switch"
				aria-checked={value}
				aria-label={ariaLabel || label}
				{disabled}
				onclick={handleToggle}
				class="toggle-switch {value ? 'toggle-on' : 'toggle-off'}"
			>
				<span class="toggle-slider"></span>
			</button>
		{:else if type === 'slider'}
			<div class="slider-container">
				<input
					id={inputId}
					type="range"
					role="slider"
					aria-label={ariaLabel || label}
					aria-valuemin={min}
					aria-valuemax={max}
					aria-valuenow={value}
					{min}
					{max}
					{step}
					{value}
					{disabled}
					oninput={handleSliderChange}
					class="slider"
				/>
				<span class="slider-value">
					{value}{unit}
				</span>
			</div>
		{:else if type === 'select'}
			<select
				id={inputId}
				{value}
				{disabled}
				aria-label={ariaLabel || label}
				onchange={handleSelectChange}
				class="select-input"
			>
				{#each options as option}
					<option value={option.value}>
						{option.label}
					</option>
				{/each}
			</select>
		{:else if type === 'radio'}
			<div class="radio-group" role="radiogroup" aria-label={ariaLabel || label}>
				{#each options as option, index}
					<label class="radio-label">
						<input
							type="radio"
							name={inputId}
							value={option.value}
							checked={value === option.value}
							{disabled}
							onchange={() => handleRadioChange(option.value)}
						/>
						<span>{option.label}</span>
					</label>
				{/each}
			</div>
		{/if}
	</div>

	{#if error}
		<p class="error-message mt-1 text-sm text-red-500">
			{error}
		</p>
	{/if}
</div>

<style>
	.setting-item {
		margin-bottom: 1.5rem;
	}

	.setting-header {
		margin-bottom: 0.5rem;
	}

	.setting-label {
		display: block;
		font-weight: 500;
		margin-bottom: 0.25rem;
	}

	.setting-control {
		display: flex;
		align-items: center;
	}

	/* Toggle Switch Styles */
	.toggle-switch {
		position: relative;
		width: 48px;
		height: 24px;
		background-color: #ccc;
		border-radius: 24px;
		border: none;
		cursor: pointer;
		transition: background-color 0.3s;
	}

	.toggle-switch:disabled {
		cursor: not-allowed;
	}

	.toggle-switch.toggle-on {
		background-color: #10b981;
	}

	.toggle-slider {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 20px;
		height: 20px;
		background-color: white;
		border-radius: 50%;
		transition: transform 0.3s;
	}

	.toggle-on .toggle-slider {
		transform: translateX(24px);
	}

	/* Slider Styles */
	.slider-container {
		display: flex;
		align-items: center;
		gap: 1rem;
		flex: 1;
	}

	.slider {
		flex: 1;
		height: 6px;
		border-radius: 3px;
		background: #e5e7eb;
		outline: none;
		-webkit-appearance: none;
	}

	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
	}

	.slider::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #3b82f6;
		cursor: pointer;
		border: none;
	}

	.slider:disabled {
		cursor: not-allowed;
	}

	.slider-value {
		min-width: 60px;
		text-align: right;
		font-weight: 500;
	}

	/* Select Styles */
	.select-input {
		padding: 0.5rem;
		border: 1px solid #d1d5db;
		border-radius: 0.375rem;
		background-color: white;
		min-width: 150px;
		cursor: pointer;
	}

	.select-input:disabled {
		cursor: not-allowed;
		background-color: #f3f4f6;
	}

	/* Radio Styles */
	.radio-group {
		display: flex;
		gap: 1rem;
	}

	.radio-label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.radio-label input[type='radio'] {
		cursor: pointer;
	}

	.radio-label input[type='radio']:disabled {
		cursor: not-allowed;
	}

	/* Dark mode styles */
	:global(.dark) .toggle-switch {
		background-color: #4b5563;
	}

	:global(.dark) .toggle-switch.toggle-on {
		background-color: #10b981;
	}

	:global(.dark) .slider {
		background: #4b5563;
	}

	:global(.dark) .select-input {
		background-color: #1f2937;
		border-color: #4b5563;
		color: white;
	}

	:global(.dark) .select-input:disabled {
		background-color: #374151;
	}
</style>
