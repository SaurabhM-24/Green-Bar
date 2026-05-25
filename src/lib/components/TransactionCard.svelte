<script>
	/**
	 * @fileoverview Transaction Card Component.
	 * Renders a single transaction row, formatting amount correctly based on debit/credit type.
	 */
	let { title, description, amount, type, iconName } = $props();

	/** @type {boolean} Flag indicating whether this is an outgoing debit transaction */
	let isDebit = $derived(type.toLowerCase() === 'debit');
</script>

<div
	class="relative bg-[#0f0f0f] py-6 px-8 flex justify-between items-center after:absolute after:bottom-0 after:left-8 after:right-8 after:h-px after:bg-gray-800/60 last:after:hidden"
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
			{#if iconName}
				<picture>
					<source srcset="/icons/{iconName}.avif" type="image/avif" />
					<img src="/icons/{iconName}.webp" alt="{type} icon" class="h-5 w-5 object-contain opacity-70" />
				</picture>
			{:else}
				<span class="text-sm uppercase tracking-wide text-[#555]">{type}</span>
			{/if}
		</div>
	</div>
</div>
