<script>
	import { slide } from 'svelte/transition';
	import { Heart } from 'lucide-svelte';
	import Github from '$lib/components/Github.svelte';

	let { onclose } = $props();
</script>

<div
	class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
>
	<div
		class="bg-[#151515] w-full max-w-md rounded-3xl p-6 md:p-8 box-3d flex flex-col gap-6 relative overflow-hidden"
		transition:slide={{ duration: 200 }}
	>
		<div
			class="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none"
		></div>

		<div class="flex items-center gap-4 relative z-10">
			<img
				src="/icon-192x192.png"
				alt="Green Bar Logo"
				class="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(74,222,128,0.2)]"
			/>
			<div>
				<h2 class="text-2xl font-display text-white tracking-wide leading-none">Green Bar</h2>
				<span class="text-green-400 text-xs font-bold uppercase tracking-widest mt-1 block"
					>Zero-Based Budgeting</span
				>
			</div>
		</div>

		<div class="space-y-4 relative z-10">
			<p class="text-gray-400 text-base leading-relaxed">
				Green Bar is a gamified budget tracker that helps you take total control of your finances by
				giving every single rupee a job.
			</p>

			<div class="bg-[#111] border border-gray-800 rounded-2xl p-4 flex flex-col gap-2">
				<p class="text-gray-300 text-sm flex items-center gap-2">
					<Heart class="w-4 h-4 text-green-500" /> Designed and built by
				</p>
				<p class="text-white font-display text-xl tracking-wide">Saurabh Mishra</p>
			</div>
		</div>

		<div class="flex flex-col gap-3 relative z-10 mt-2">
			<a
				href="https://github.com/SaurabhM-24/Green-Bar"
				target="_blank"
				rel="noopener noreferrer"
				class="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white hover:bg-gray-200 text-black font-bold box-3d tracking-wide transition-all active:scale-[0.98] shadow-[0_0_15px_rgba(255,255,255,0.1)]"
			>
				<Github class="w-5 h-5" />
				View on GitHub
			</a>
			<button
				class="w-full py-3.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-white font-medium box-3d tracking-wide transition-all active:scale-[0.98]"
				onclick={onclose}
			>
				Close
			</button>
		</div>
	</div>
</div>
