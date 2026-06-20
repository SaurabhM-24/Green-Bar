<script>
	/**
	 * @fileoverview Category Card Component.
	 * Displays a variable budget's status using a horizontal progress bar.
	 */
	import { iconMap } from '$lib/icons.js';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	let { title, totalData, usedData, iconName, periodText, onclick } = $props();

	/** @type {number} Derived progress percentage. Prevents division by zero. */
	let progress = $derived(
		totalData > 0 ? Math.max(((totalData - usedData) / totalData) * 100, 0) : 0
	);

	let tweenedProgress = tweened(100, { duration: 1000, easing: cubicOut });
	$effect(() => {
		tweenedProgress.set(progress);
	});

	/** @type {number} Exact monetary amount remaining for the category */
	let amountLeft = $derived(totalData - usedData);

	/** @type {string} Dynamic Tailwind color class based on budget consumption */
	let barColor = $derived(
		progress > 75
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

	<div class="h-8 w-full bg-[#1a1a1a] rounded-xl overflow-hidden mb-6 box-3d">
		<div
			class="h-full {barColor} transition-colors duration-700"
			style="width: {$tweenedProgress}%"
		></div>
	</div>

	<div class="flex justify-between text-sm tracking-wider">
		<div class="flex flex-col">
			<span class="text-xs text-gray-500 uppercase tracking-wider mb-1">Left</span>
			<span class="text-gray-300 text-lg tracking-wide">₹{amountLeft.toLocaleString('en-IN')}</span>
		</div>
		<div class="flex flex-col text-right">
			<span class="text-xs text-gray-500 uppercase tracking-wider mb-1">Used</span>
			<span class="text-gray-300 text-lg tracking-wide">₹{usedData.toLocaleString('en-IN')}</span>
		</div>
	</div>
</button>
