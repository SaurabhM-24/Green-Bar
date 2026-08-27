<script>
	/**
	 * @fileoverview Tutorial Prompt Modal.
	 * Asks the user if they would like to take a guided tour of Green Bar after onboarding.
	 */
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { Sparkles, Compass, X } from 'lucide-svelte';

	let { onStart, onSkip } = $props();
</script>

<div
	class="fixed inset-0 z-[190] bg-black/60 backdrop-blur-md flex items-center justify-center p-6 text-gray-300 font-sans"
	transition:fade={{ duration: 250 }}
>
	<div
		class="w-full max-w-md bg-[#151515] p-8 rounded-[2.5rem] box-3d shadow-2xl relative flex flex-col gap-6 border border-gray-800/80"
		in:fly={{ y: 25, duration: 400, easing: cubicOut }}
	>
		<!-- Close Button Top Right -->
		<button
			class="absolute top-6 right-6 p-2 rounded-full text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
			onclick={onSkip}
			aria-label="Skip Tutorial"
		>
			<X class="w-5 h-5" />
		</button>

		<!-- Mascot / Icon Graphic -->
		<div class="flex items-center gap-4">
			<div class="w-16 h-16 bg-[#1f1f1f] rounded-2xl flex items-center justify-center box-3d border border-gray-700/50 shrink-0">
				<Compass class="w-8 h-8 text-green-400" />
			</div>
			<div>
				<h2 class="text-2xl font-display text-white tracking-wide leading-tight">
					Take a Quick Tour?
				</h2>
				<span class="text-xs text-green-400 font-medium tracking-wider uppercase flex items-center gap-1 mt-0.5">
					<Sparkles class="w-3.5 h-3.5" /> 1-Minute Walkthrough
				</span>
			</div>
		</div>

		<p class="text-gray-400 text-base leading-relaxed">
			Discover how Green Bar helps you manage every rupee across your variables, fixed commitments, and balance.
		</p>

		<div class="flex flex-col gap-3 mt-2">
			<button
				class="w-full bg-white text-black font-bold py-4 text-lg rounded-2xl box-3d flex justify-center items-center gap-2 transition-transform active:scale-95 cursor-pointer hover:bg-gray-200"
				onclick={onStart}
			>
				Start Tour
			</button>
			<button
				class="w-full py-3.5 rounded-2xl bg-[#1c1c1c] hover:bg-[#252525] text-gray-400 hover:text-white font-medium text-base box-3d transition-colors cursor-pointer text-center"
				onclick={onSkip}
			>
				No, explore on my own
			</button>
		</div>
	</div>
</div>
