<script>
	let { details, date, amount, type } = $props();

	let isDebit = $derived(type.toLowerCase() === 'debit');
</script>

<div
	class="bg-[#0f0f0f] border-b border-gray-900/60 p-5 px-6 flex justify-between items-center last:border-b-0"
>
	<div class="flex flex-col overflow-hidden mr-5">
		<span class="text-gray-200 text-lg font-medium tracking-wide truncate mb-1.5">{details}</span>
		<span class="text-sm text-gray-500 font-light">{date}</span>
	</div>
	<div class="flex flex-col text-right shrink-0">
		<span class="text-xl font-medium tracking-wide {isDebit ? 'text-[#ff6b6b]' : 'text-[#69db7c]'}">
			{isDebit ? '-' : '+'}₹{Math.abs(amount).toLocaleString('en-IN')}
		</span>
		<span class="text-xs uppercase tracking-widest text-[#555] font-medium mt-1.5">
			{type}
		</span>
	</div>
</div>
