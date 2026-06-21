<script>
	/**
	 * @fileoverview Transaction Card Component.
	 * Renders a single transaction row, formatting amount correctly based on debit/credit type.
	 */
	import { ArrowUpRight, ArrowDownLeft } from 'lucide-svelte';
	import { iconMap } from '$lib/icons.js';
	let { title, description, amount, type, iconName, isOutOfCycle = false, onclick } = $props();

	/** @type {boolean} Flag indicating whether this is an outgoing debit transaction */
	let isDebit = $derived(type.toLowerCase() === 'debit');
</script>

<button
	class="w-full text-left relative py-6 px-8 flex justify-between items-center after:absolute after:bottom-0 after:left-8 after:right-8 after:h-px after:bg-gray-800/60 last:after:hidden transition-all active:scale-[0.98] focus:outline-none {isOutOfCycle ? 'bg-[#0f0f0f]' : 'bg-[#0f0f0f] hover:bg-[#151515]'}"
	style={isOutOfCycle ? "background: repeating-linear-gradient(-45deg, transparent, transparent 10px, #151515 10px, #151515 20px) #0f0f0f;" : ""}
	onclick={onclick}
>
	<div class="flex flex-col overflow-hidden mr-6">
		<span class="text-gray-200 text-xl tracking-wide truncate {description ? 'mb-1.5' : ''}">{title}</span>
		{#if description}
			<span class="text-base tracking-wide text-gray-500 truncate">{description}</span>
		{/if}
	</div>
	<div class="flex flex-col text-right shrink-0 items-end">
		<span class="text-2xl tracking-wide {isDebit ? 'text-[#ff6b6b]' : 'text-[#69db7c]'}">
			{isDebit ? '-' : '+'}₹{Math.abs(amount).toLocaleString('en-IN')}
		</span>
		<div class="mt-1.5 flex justify-end">
			{#if iconName && iconMap[iconName]}
				<picture>
					{#if iconMap[iconName].avif}
						<source srcset={iconMap[iconName].avif} type="image/avif" />
					{/if}
					<img src={iconMap[iconName].webp} alt="{type} icon" class="h-5 w-5 object-contain opacity-70" />
				</picture>
			{:else}
				<span class="text-sm uppercase tracking-wide text-[#555]">{type}</span>
			{/if}
		</div>
	</div>
</button>
