<script>
	let { title, totalData, usedData } = $props();

	// Avoid division by zero, reverse logic so bar shrinks as it is used
	let progress = $derived(totalData > 0 ? Math.max(((totalData - usedData) / totalData) * 100, 0) : 0);
	let amountLeft = $derived(totalData - usedData);
</script>

<a
	href="/list?category={title}"
	class="block bg-[#0f0f0f] border border-gray-900 rounded-[2rem] p-6 px-7 mb-5 shadow-xl active:scale-[0.98] transition-transform"
>
	<div class="flex justify-between items-center mb-5">
		<h3 class="text-xl font-medium text-gray-200 tracking-wide">{title}</h3>
	</div>

	<div class="h-3 w-full bg-[#1a1a1a] rounded-full overflow-hidden mb-4">
		<div
			class="h-full bg-white rounded-full transition-all duration-700 ease-out"
			style="width: {progress}%"
		></div>
	</div>

	<div class="flex justify-between text-sm tracking-wider">
		<div class="flex flex-col">
			<span class="text-gray-500 uppercase mb-1">Left</span>
			<span class="text-gray-300 font-medium text-base">₹{amountLeft.toLocaleString('en-IN')}</span>
		</div>
		<div class="flex flex-col text-right">
			<span class="text-gray-500 uppercase mb-1">Used</span>
			<span class="text-gray-300 font-medium text-base">₹{usedData.toLocaleString('en-IN')}</span>
		</div>
	</div>
</a>
