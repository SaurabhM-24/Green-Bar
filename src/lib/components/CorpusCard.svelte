<script>
	/**
	 * @fileoverview Corpus Card Component.
	 * Displays corpus/savings status with a multi-segment progress bar (locked vs expendable).
	 */
	import { iconMap } from '$lib/icons.js';
	let { title, lockedData, leftData, usedData, iconName, periodText, onclick } = $props();

	/** @type {boolean} Indicates if corpus credits exceeded debits this period */
	let isExtra = $derived(usedData < 0);

	/** @type {number} Positive representation of used or extra amount */
	let displayUsed = $derived(Math.abs(usedData));

	/**
	 * @description The initial expendable capacity for the month.
	 * @type {number}
	 */
	let maxExpendableThisMonth = $derived(isExtra ? leftData : leftData + usedData);

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
		<div class="flex flex-col gap-1">
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
	<div
		class="relative h-8 w-full bg-[#1a1a1a] rounded-xl overflow-hidden mb-6 flex box-3d items-center"
	>
		<div
			class="h-full bg-white opacity-40 transition-all duration-700 ease-out"
			style="width: {lockedProgress}%"
		></div>
		<div
			class="h-full bg-white transition-all duration-700 ease-out"
			style="width: {leftProgress}%"
		></div>
		{#if isExtra}
			<div
				class="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-black font-extrabold text-2xl select-none pointer-events-none drop-shadow"
			>
				<span>+</span><span>+</span>
			</div>
		{/if}
	</div>

	<div class="flex justify-between items-end text-sm tracking-wider">
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
		{#if isExtra}
			<div class="flex flex-col text-right bg-green-500 text-black px-3 py-1 rounded-xl box-3d">
				<div class="flex items-center justify-end gap-1.5 mb-0.5">
					<span class="line-through text-black/70 text-xs font-semibold uppercase tracking-wider"
						>Used</span
					>
					<span class="text-black text-xs font-bold uppercase tracking-wider">Extra</span>
				</div>
				<span class="text-black text-base font-bold tracking-wide"
					>₹{displayUsed.toLocaleString('en-IN')}</span
				>
			</div>
		{:else}
			<div class="flex flex-col text-right">
				<span class="text-gray-500 tracking-wider uppercase mb-1 text-xs">Used</span>
				<span class="text-[#ff6b6b] text-base tracking-wide"
					>₹{displayUsed.toLocaleString('en-IN')}</span
				>
			</div>
		{/if}
	</div>
</button>
