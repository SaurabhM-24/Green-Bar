<script>
	import { Check } from 'lucide-svelte';
	let { title, isChecked } = $props();
</script>

<div class="flex items-center gap-5 bg-[#0f0f0f] p-5 px-6 rounded-2xl border border-gray-900 mb-3">
	<div
		class="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-colors duration-300 {isChecked
			? 'bg-white border-white'
			: 'bg-[#151515] border-gray-800'}"
	>
		{#if isChecked}
			<Check class="w-5 h-5 text-black" strokeWidth={3} />
		{/if}
	</div>

	<a
		href="/list?category={title}"
		class="text-gray-300 text-lg font-medium tracking-wide flex-1 hover:text-white transition-colors"
	>
		{title}
	</a>
</div>
