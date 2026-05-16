<script>
	let { title, totalData, usedData } = $props();

	// Avoid division by zero, reverse logic so bar shrinks as it is used
	let progress = $derived(
		totalData > 0 ? Math.max(((totalData - usedData) / totalData) * 100, 0) : 0
	);
	let amountLeft = $derived(totalData - usedData);
</script>

<a
	href="/list?category={title}"
	class="block bg-[#0f0f0f] rounded-[2.5rem] p-8 px-9 mb-7 box-3d active:scale-[0.98] transition-transform"
>
	<div class="flex justify-between items-center mb-7">
		<h3 class="text-2xl text-gray-200 tracking-wide">{title}</h3>
	</div>

	<div class="h-8 w-full bg-[#1a1a1a] rounded-xl overflow-hidden mb-6 box-3d">
		<div
			class="h-full bg-white transition-all duration-700 ease-out"
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
