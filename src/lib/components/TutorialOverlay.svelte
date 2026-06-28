<script>
	import { fade } from 'svelte/transition';
	import { ChevronRight } from 'lucide-svelte';

	let { onComplete } = $props();

	let step = $state(1);
	/** @type {DOMRect | null} */
	let targetRect = $state(null);

	const steps = [
		{
			id: 'variable-card',
			title: 'Variable Expenses',
			desc: 'Track your day-to-day spending limits here. Add categories to start tracking.'
		},
		{
			id: 'fixed-card',
			title: 'Fixed Expenses',
			desc: 'Manage your recurring full-payments like EMIs or subscriptions.'
		},
		{
			id: 'balance-card',
			title: 'Account Status',
			desc: 'See your unallocated Personal Corpus and total global balance.'
		},
		{
			id: 'nav-bar',
			title: 'Navigation & Adding',
			desc: 'Use the bottom bar to switch views, and the floating Plus button to add transactions.'
		}
	];

	/** @param {number} stepIndex */
	function getSelectorForStep(stepIndex) {
		if (stepIndex === 1) return 'a[href="/variable"]';
		if (stepIndex === 2) return 'a[href="/fixed"]:not(.mt-2)';
		if (stepIndex === 3) return 'a[href="/fixed"].mt-2';
		if (stepIndex === 4) return 'nav';
		return null;
	}

	$effect(() => {
		function updateRect() {
			if (step > steps.length) return;
			const selector = getSelectorForStep(step);
			if (selector) {
				const el = document.querySelector(selector);
				if (el) {
					targetRect = el.getBoundingClientRect();
				}
			}
		}

		// Initial wait to let DOM settle
		setTimeout(updateRect, 100);

		window.addEventListener('resize', updateRect);
		window.addEventListener('scroll', updateRect, { passive: true });

		return () => {
			window.removeEventListener('resize', updateRect);
			window.removeEventListener('scroll', updateRect);
		};
	});

	function nextStep() {
		if (step < steps.length) {
			step++;
		} else {
			onComplete();
		}
	}
</script>

<div class="fixed inset-0 z-[200] pointer-events-auto" transition:fade={{ duration: 200 }}>
	<svg
		class="absolute inset-0 w-full h-full pointer-events-none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<defs>
			<mask id="tutorial-hole">
				<rect width="100%" height="100%" fill="white" />
				{#if targetRect}
					<rect
						x={targetRect.left - 8}
						y={targetRect.top - 8}
						width={targetRect.width + 16}
						height={targetRect.height + 16}
						rx="32"
						fill="black"
					/>
				{/if}
			</mask>
		</defs>
		<rect width="100%" height="100%" fill="rgba(0,0,0,0.85)" mask="url(#tutorial-hole)" />
	</svg>

	{#if targetRect}
		<div
			class="absolute z-[110] max-w-[280px] w-[90vw] bg-white rounded-3xl p-6 box-3d shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all duration-300 pointer-events-auto"
			style="
				top: {targetRect.bottom + 20 > window.innerHeight - 200
				? targetRect.top - 200
				: targetRect.bottom + 20}px;
				left: 0; right: 0; margin-left: auto; margin-right: auto;
			"
		>
			<h3 class="text-2xl font-display text-black mb-3 tracking-wide">{steps[step - 1].title}</h3>
			<p class="text-gray-700 mb-6 leading-relaxed text-lg">{steps[step - 1].desc}</p>

			<div class="flex items-center justify-between">
				<span class="text-gray-400 text-sm font-medium uppercase tracking-wider"
					>{step} OF {steps.length}</span
				>
				<div class="flex gap-4 items-center">
					<button
						class="text-gray-500 font-medium hover:text-black transition-colors"
						onclick={onComplete}>Skip</button
					>
					<button
						class="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-transform box-3d"
						onclick={nextStep}
					>
						{step === steps.length ? 'Done' : 'Next'}
						<ChevronRight class="w-5 h-5" />
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
