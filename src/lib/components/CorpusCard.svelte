<script>
	/**
	 * @fileoverview Corpus Card Component.
	 * Displays corpus/savings status with a multi-segment progress bar (locked vs expendable).
	 */
	import { iconMap } from '$lib/icons.js';
	let { title, lockedData, leftData, usedData, iconName, periodText, onclick } = $props();

	/**
	 * @description The initial expendable capacity for the month.
	 * (Current exact balance left + what was spent this month).
	 * @type {number}
	 */
	let maxExpendableThisMonth = $derived(leftData + usedData);

	/** @type {number} Total scale representing locked base plus the starting expendable cash */
	let visualTotal = $derived(lockedData + maxExpendableThisMonth);

	/** @type {number} Percentage width for the locked segment of the bar */
	let lockedProgress = $derived(visualTotal > 0 ? (lockedData / visualTotal) * 100 : 0);

	/** @type {number} Percentage width for the remaining expendable segment */
	let leftProgress = $derived(visualTotal > 0 ? (leftData / visualTotal) * 100 : 0);
</script>

<button
	{onclick}
	class="block w-full text-left bg-[#0f0f0f] rounded-[2.5rem] p-8 px-9 mb-7 box-3d active:scale-[0.98] transition-transform"
>
	<div class="flex justify-between items-center mb-7">
		<div class="flex items-baseline gap-3">
			<h3 class="text-2xl text-gray-200 tracking-wide font-display">{title}</h3>
			{#if periodText}
				<span class="text-xs text-gray-500 tracking-wide">{periodText}</span>
			{/if}
		</div>
		{#if iconName && iconMap[iconName]}
			<picture>
				{#if iconMap[iconName].avif}
					<source srcset={iconMap[iconName].avif} type="image/avif" />
				{/if}
				<img src={iconMap[iconName].webp} alt="{title} icon" class="h-10 w-10 object-contain" />
			</picture>
		{/if}
	</div>

	<!-- Health Bar (Multi-Segment) -->
	<div class="h-8 w-full bg-[#1a1a1a] rounded-xl overflow-hidden mb-6 flex box-3d">
		<div
			class="h-full bg-white opacity-40 transition-all duration-700 ease-out"
			style="width: {lockedProgress}%"
		></div>
		<div
			class="h-full bg-white transition-all duration-700 ease-out"
			style="width: {leftProgress}%"
		></div>
	</div>

	<div class="flex justify-between text-sm tracking-wider">
		<div class="flex flex-col">
			<span class="text-gray-500 tracking-wider uppercase mb-1 text-xs">Locked</span>
			<span class="text-gray-400 text-base tracking-wide"
				>₹{lockedData.toLocaleString('en-IN')}</span
			>
		</div>
		<div class="flex flex-col text-center">
			<span class="text-gray-500 tracking-wider uppercase mb-1 text-xs">Left</span>
			<span class="text-white text-base tracking-wide">₹{leftData.toLocaleString('en-IN')}</span>
		</div>
		<div class="flex flex-col text-right">
			<span class="text-gray-500 tracking-wider uppercase mb-1 text-xs">Used</span>
			<span class="text-[#ff6b6b] text-base tracking-wide">₹{usedData.toLocaleString('en-IN')}</span
			>
		</div>
	</div>
</button>
