<script>
	import { Check } from 'lucide-svelte';
	let { title, isChecked, isLast = false, iconName } = $props();
</script>

<div
	class="flex items-center gap-5 py-6 px-4 relative {isLast
		? ''
		: 'after:absolute after:bottom-0 after:left-2 after:right-2 after:h-px after:bg-gray-800/60'}"
>
	<div
		class="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-colors duration-300 {isChecked
			? 'bg-white border-white'
			: 'bg-[#151515] border-gray-800'}"
	>
		{#if isChecked}
			<Check class="w-6 h-6 text-black" strokeWidth={3} />
		{/if}
	</div>

	<a
		href="/list?category={title}"
		class="text-gray-300 text-lg font-medium tracking-wide flex-1 hover:text-white transition-colors flex justify-between items-center"
	>
		<span>{title}</span>
		{#if iconName}
			<picture>
				<source srcset="/icons/{iconName}.avif" type="image/avif" />
				<img src="/icons/{iconName}.webp" alt="{title} icon" class="h-12 w-12 object-contain" />
			</picture>
		{/if}
	</a>
</div>
