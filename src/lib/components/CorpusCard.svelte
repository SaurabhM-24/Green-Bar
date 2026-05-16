<script>
	let { title, lockedData, leftData, usedData, iconName } = $props();

	// Calculate the starting expendable capacity for the month.
	// leftData is the current exact balance left. usedData is what we spent this month.
	// Therefore, at the start of the month, we had (leftData + usedData) expendable cash.
	let maxExpendableThisMonth = $derived(leftData + usedData);

	// Visual total scale = locked base + what we started the month with.
	let visualTotal = $derived(lockedData + maxExpendableThisMonth);

	let lockedProgress = $derived(visualTotal > 0 ? (lockedData / visualTotal) * 100 : 0);

	// The leftProgress will shrink mathematically as usedData increases (which inherently drops leftData)
	let leftProgress = $derived(visualTotal > 0 ? (leftData / visualTotal) * 100 : 0);
</script>

<a
	href="/list?category={title}"
	class="block bg-[#0f0f0f] rounded-[2.5rem] p-8 px-9 mb-7 box-3d active:scale-[0.98] transition-transform"
>
	<div class="flex justify-between items-center mb-7">
		<h3 class="text-2xl text-gray-200 tracking-wide">{title}</h3>
		{#if iconName}
			<picture>
				<source srcset="/icons/{iconName}.avif" type="image/avif" />
				<img src="/icons/{iconName}.webp" alt="{title} icon" class="h-12 w-12 object-contain" />
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
</a>
