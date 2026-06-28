<script>
	import { fade } from 'svelte/transition';
	import { ChevronRight } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { onComplete } = $props();

	let step = $state(1);
	/** @type {DOMRect | null} */
	let targetRect = $state(null);

	const steps = [
		{ page: '/', selector: '#app-header', title: 'App Settings & Profile', desc: 'Manage your global app settings and profile here.' },
		{ page: '/', selector: 'a[href="/variable"]', title: 'Variable Expenses', desc: 'Track your day-to-day spending limits here.' },
		{ page: '/', selector: 'a[href="/fixed"]:not(.mt-2)', title: 'Fixed Expenses', desc: 'Manage your recurring full-payments.' },
		{ page: '/', selector: 'a[href="/fixed"].mt-2', title: 'Account Status', desc: 'See your unallocated Personal Corpus and total balance.' },
		{ page: '/', selector: 'nav', title: 'Navigation', desc: 'Use the bottom bar to switch views.' },
		{ page: '/', selector: 'a[href="/add"]', title: 'Add Transaction', desc: 'Floating button to quickly add a transaction.' },
		
		{ page: '/variable', selector: '#variable-menu-btn', title: 'Variable Options', desc: 'Edit order or add categories.' },
		{ page: '/variable', selector: '#variable-list > div:first-child', title: 'Modify Category', desc: 'Tap on any category to view details or modify it.' },
		
		{ page: '/fixed', selector: '#fixed-menu-btn', title: 'Fixed Options', desc: 'Manage your fixed responsibilities.' },
		{ page: '/fixed', selector: '#corpus-list > div:first-child', title: 'Corpus Funds', desc: 'Tap on a corpus fund to modify or view details.' },
		{ page: '/fixed', selector: '#fixed-list > div:first-child', title: 'Fixed Item', desc: 'Tap on any fixed expense to manage its payment status.' },
		
		{ page: '/list', selector: 'button:has(.lucide-sliders-horizontal), .relative.z-40 > button', title: 'Filters', desc: 'Filter history by date and category.' },
		{ page: '/list', selector: '#transaction-list > div:first-child', title: 'Modify Transaction', desc: 'Tap any transaction to view details or modify it.' },
		
		{ page: '/add', selector: '#add-card-container', title: 'Transaction Details', desc: 'Fill out the details of your transaction here before proceeding.' },
		{ page: '/add', selector: 'button.w-full.py-4', title: 'Save', desc: 'Click here to save the transaction to your history.' }
	];

	function getSelectorForStep(stepIndex) {
		return steps[stepIndex - 1]?.selector || null;
	}

	let lastScrolledStep = 0;

	$effect(() => {
		function updateRect() {
			if (step > steps.length) return;
			const currentStepDef = steps[step - 1];
			
			if ($page.url.pathname !== currentStepDef.page) {
				targetRect = null;
				return;
			}
			
			const selector = getSelectorForStep(step);
			if (selector) {
				const el = document.querySelector(selector);
				if (el) {
					if (step !== lastScrolledStep) {
						el.scrollIntoView({ behavior: 'smooth', block: 'center' });
						lastScrolledStep = step;
					}
					targetRect = el.getBoundingClientRect();
				} else {
					targetRect = null;
				}
			}
		}

		const interval = setInterval(updateRect, 100);

		window.addEventListener('resize', updateRect);
		window.addEventListener('scroll', updateRect, { passive: true });

		return () => {
			clearInterval(interval);
			window.removeEventListener('resize', updateRect);
			window.removeEventListener('scroll', updateRect);
		};
	});

	async function finishTutorial() {
		targetRect = null;
		if ($page.url.pathname !== '/') {
			await goto('/');
		}
		onComplete();
	}

	async function nextStep() {
		if (step < steps.length) {
			const nextStepDef = steps[step];
			step++;
			if ($page.url.pathname !== nextStepDef.page) {
				targetRect = null;
				await goto(nextStepDef.page);
				await new Promise((resolve) => setTimeout(resolve, 600));
			}
		} else {
			await finishTutorial();
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
						style="transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);"
					/>
				{/if}
			</mask>
		</defs>
		<rect width="100%" height="100%" fill="rgba(0,0,0,0.85)" mask="url(#tutorial-hole)" />
	</svg>

	{#if targetRect}
		<div
			class="absolute z-[110] max-w-[280px] w-[90vw] bg-white rounded-3xl p-6 box-3d shadow-[0_0_40px_rgba(0,0,0,0.5)] pointer-events-auto"
			style="
				top: {targetRect.bottom + 20 > window.innerHeight - 200
				? targetRect.top - 200
				: targetRect.bottom + 20}px;
				left: 0; right: 0; margin-left: auto; margin-right: auto;
				transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
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
						onclick={finishTutorial}>Skip</button
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
