<script>
	let { title, lockedData, leftData, usedData } = $props();

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
	class="block bg-[#0f0f0f] border border-gray-900 rounded-[2rem] p-6 px-7 mb-5 shadow-xl active:scale-[0.98] transition-transform"
>
	<div class="flex justify-between items-center mb-5">
		<h3 class="text-xl font-medium text-gray-200 tracking-wide">{title}</h3>
	</div>

	<!-- Health Bar (Multi-Segment) -->
	<div class="h-3 w-full bg-[#1a1a1a] rounded-full overflow-hidden mb-4 flex">
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
			<span class="text-gray-500 uppercase mb-1 text-[10px]">Locked</span>
			<span class="text-gray-400 font-medium text-sm">₹{lockedData.toLocaleString('en-IN')}</span>
		</div>
		<div class="flex flex-col text-center">
			<span class="text-gray-500 uppercase mb-1 text-[10px]">Left</span>
			<span class="text-white font-medium text-sm">₹{leftData.toLocaleString('en-IN')}</span>
		</div>
		<div class="flex flex-col text-right">
			<span class="text-gray-500 uppercase mb-1 text-[10px]">Used</span>
			<span class="text-[#ff6b6b] font-medium text-sm">₹{usedData.toLocaleString('en-IN')}</span>
		</div>
	</div>
</a>
