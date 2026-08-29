<script>
	/**
	 * @fileoverview Category Card Component.
	 * Displays a variable budget's status using a horizontal progress bar.
	 */
	import { iconMap } from '$lib/icons.js';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	let { title, totalData, usedData, iconName, periodText, onclick } = $props();

	/** @type {boolean} Indicates if credits exceeded debits this period */
	let isExtra = $derived(usedData < 0);

	/** @type {number} Positive representation of used or extra amount */
	let displayUsed = $derived(Math.abs(usedData));

	/** @type {number} Exact monetary amount remaining for the category (clamped to limit when extra) */
	let amountLeft = $derived(isExtra ? totalData : Math.max(0, totalData - usedData));

	/** @type {number} Derived progress percentage. Prevents division by zero. */
	let progress = $derived(
		isExtra ? 100 : totalData > 0 ? Math.max(((totalData - usedData) / totalData) * 100, 0) : 0
	);

	let tweenedProgress = tweened(100, { duration: 1000, easing: cubicOut });
	$effect(() => {
		tweenedProgress.set(progress);
	});

	/** @type {string} Dynamic Tailwind color class based on budget consumption */
	let barColor = $derived(
		isExtra || progress > 75
			? 'bg-green-500'
			: progress > 50
				? 'bg-white'
				: progress > 25
					? 'bg-yellow-400'
					: 'bg-red-500'
	);
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

	<!-- Health Bar Container -->
	<div
		class="relative h-8 w-full bg-[#1a1a1a] rounded-xl overflow-hidden mb-6 box-3d flex items-center"
	>
		<div
			class="h-full {barColor} transition-colors duration-700"
			style="width: {$tweenedProgress}%"
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
			<span class="text-xs text-gray-500 uppercase tracking-wider mb-1">Left</span>
			<span class="text-gray-300 text-lg tracking-wide">₹{amountLeft.toLocaleString('en-IN')}</span>
		</div>
		{#if isExtra}
			<div class="flex flex-col text-right bg-green-500 text-black px-3 py-1 rounded-xl box-3d">
				<div class="flex items-center justify-end gap-1.5 mb-0.5">
					<span class="line-through text-black/70 text-xs font-semibold uppercase tracking-wider"
						>Used</span
					>
					<span class="text-black text-xs font-bold uppercase tracking-wider">Extra</span>
				</div>
				<span class="text-black text-lg font-bold tracking-wide"
					>₹{displayUsed.toLocaleString('en-IN')}</span
				>
			</div>
		{:else}
			<div class="flex flex-col text-right">
				<span class="text-xs text-gray-500 uppercase tracking-wider mb-1">Used</span>
				<span class="text-gray-300 text-lg tracking-wide"
					>₹{displayUsed.toLocaleString('en-IN')}</span
				>
			</div>
		{/if}
	</div>
</button>
