<script>
	/**
	 * @fileoverview Fixed Item Component.
	 * Represents a fixed budget item and its completion status in the checklist.
	 */
	import { iconMap } from '$lib/icons.js';
	import { Check } from 'lucide-svelte';

	let { title, isChecked, isLast = false, iconName, periodText, onclick } = $props();
</script>

<div
	class="flex items-center gap-5 py-6 px-4 relative {isLast
		? ''
		: 'after:absolute after:bottom-0 after:left-2 after:right-2 after:h-px after:bg-gray-800/60'}"
>
	<div
		class="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-colors duration-300 {isChecked
			? 'bg-white border-white'
			: 'bg-[#151515] border-gray-800'}"
	>
		{#if isChecked}
			<Check class="w-6 h-6 text-black" strokeWidth={3} />
		{/if}
	</div>

	<button
		{onclick}
		class="text-gray-300 text-lg font-medium tracking-wide flex-1 hover:text-white transition-colors flex justify-between items-center bg-transparent border-none p-0 w-full text-left focus:outline-none"
	>
		<div class="flex flex-col gap-1">
			<span>{title}</span>
			{#if periodText}
				<span class="text-xs text-gray-500 font-normal tracking-wide">{periodText}</span>
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
	</button>
</div>
