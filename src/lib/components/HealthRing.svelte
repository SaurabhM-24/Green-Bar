<script>
	/**
	 * @fileoverview Health Ring Component.
	 * Displays an SVG circular progress indicator based on category budget usage.
	 */
	import { iconMap } from '$lib/icons.js';
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	let { category, usedData, totalData, iconName } = $props();

	/** @type {number} Derived progress percentage. Prevents division by zero. */
	let progress = $derived(
		totalData > 0 ? Math.max(((totalData - usedData) / totalData) * 100, 0) : 0
	);

	let radius = 28;
	let circumference = $derived(2 * Math.PI * radius);
	
	let tweenedProgress = tweened(100, { duration: 1000, easing: cubicOut });
	$effect(() => {
		tweenedProgress.set(progress);
	});

	/** @type {number} SVG stroke-dashoffset for rendering the partial circle */
	let strokeDashoffset = $derived(circumference - ($tweenedProgress / 100) * circumference);

	/** @type {string} Dynamic Tailwind text color for the SVG stroke */
	let ringColor = $derived(
		progress > 75 ? 'text-green-500' :
		progress > 50 ? 'text-white' :
		progress > 25 ? 'text-yellow-400' : 'text-red-500'
	);
</script>

<div class="flex flex-col items-center w-[4.5rem]">
	<div class="relative w-16 h-16 flex items-center justify-center mb-2">
		<svg class="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none">
			<!-- Background Track -->
			<circle
				cx="32"
				cy="32"
				r={radius}
				stroke="currentColor"
				stroke-width="6"
				fill="transparent"
				class="text-[#1a1a1a]"
			/>
			<!-- Progress Ring -->
			<circle
				cx="32"
				cy="32"
				r={radius}
				stroke="currentColor"
				stroke-width="6"
				fill="transparent"
				stroke-dasharray={circumference}
				stroke-dashoffset={strokeDashoffset}
				class="transition-colors duration-500 {ringColor}"
				stroke-linecap="round"
			/>
		</svg>
		{#if iconName && iconMap[iconName]}
			<picture class="z-10 bg-[#0f0f0f] rounded-full p-2 flex items-center justify-center w-11 h-11">
				{#if iconMap[iconName].avif}
					<source srcset={iconMap[iconName].avif} type="image/avif" />
				{/if}
				<img src={iconMap[iconName].webp} alt="{category} icon" class="h-6 w-6 object-contain" />
			</picture>
		{:else}
			<div class="z-10 bg-[#0f0f0f] rounded-full p-2 w-11 h-11"></div>
		{/if}
	</div>
	<span class="text-xs text-gray-400 tracking-wide truncate max-w-full text-center px-1">
		{category}
	</span>
</div>
