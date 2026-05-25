<script>
	/**
	 * @fileoverview Category Card Component.
	 * Displays a variable budget's status using a horizontal progress bar.
	 */
	let { title, totalData, usedData, iconName } = $props();

	/** @type {number} Derived progress percentage. Prevents division by zero. */
	let progress = $derived(
		totalData > 0 ? Math.max(((totalData - usedData) / totalData) * 100, 0) : 0
	);
	
	/** @type {number} Exact monetary amount remaining for the category */
	let amountLeft = $derived(totalData - usedData);

	/** @type {string} Dynamic Tailwind color class based on budget consumption */
	let barColor = $derived(
		progress > 75 ? 'bg-green-500' :
		progress > 50 ? 'bg-white' :
		progress > 25 ? 'bg-yellow-400' : 'bg-red-500'
	);
</script>

<a
	href="/list?category={title}"
	class="block bg-[#0f0f0f] rounded-[2.5rem] p-8 px-9 mb-7 box-3d active:scale-[0.98] transition-transform"
>
	<div class="flex justify-between items-center mb-7">
		<h3 class="text-2xl text-gray-200 tracking-wide font-display">{title}</h3>
		{#if iconName}
			<picture>
				<source srcset="/icons/{iconName}.avif" type="image/avif" />
				<img src="/icons/{iconName}.webp" alt="{title} icon" class="h-12 w-12 object-contain" />
			</picture>
		{/if}
	</div>

	<div class="h-8 w-full bg-[#1a1a1a] rounded-xl overflow-hidden mb-6 box-3d">
		<div
			class="h-full {barColor} transition-all duration-700 ease-out"
			style="width: {progress}%"
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
</a>
