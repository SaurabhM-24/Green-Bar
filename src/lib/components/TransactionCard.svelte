<script>
	let { details, date, amount, type } = $props();

	let isDebit = $derived(type.toLowerCase() === 'debit');
</script>

<div
	class="relative bg-[#0f0f0f] py-6 px-8 flex justify-between items-center after:absolute after:bottom-0 after:left-8 after:right-8 after:h-px after:bg-gray-800/60 last:after:hidden"
>
	<div class="flex flex-col overflow-hidden mr-6">
		<span class="text-gray-200 text-xl tracking-wide truncate mb-1.5">{details}</span>
		<span class="text-base tracking-wide text-gray-500">{date}</span>
	</div>
	<div class="flex flex-col text-right shrink-0">
		<span class="text-2xl tracking-wide {isDebit ? 'text-[#ff6b6b]' : 'text-[#69db7c]'}">
			{isDebit ? '-' : '+'}₹{Math.abs(amount).toLocaleString('en-IN')}
		</span>
		<span class="text-sm uppercase tracking-wide text-[#555] mt-1.5">
			{type}
		</span>
	</div>
</div>
