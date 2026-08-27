<script>
	/**
	 * @fileoverview Refined Guided App Tutorial Overlay.
	 * Walks the user through every page in navbar order: Home -> Variables -> Fixed -> Balance -> History -> Add.
	 * Explains each page from top to bottom, including all modal & form fields.
	 * Uses unified high z-index layers (z-300+) and DOM readiness checks to guarantee no crashes or buried elements.
	 */
	import { fade, fly } from 'svelte/transition';
	import { ChevronRight, Check, ChevronLeft, X } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { onComplete, startStep = 1 } = $props();

	let step = $state(startStep);
	/** @type {number[]} */
	let stepHistory = $state([]);
	/** @type {DOMRect | null} */
	let targetRect = $state(null);
	let isPageTransitioning = $state(false);
	let modalHeight = $state(220);

	const steps = [
		// ==========================================
		// 1. HOMEPAGE (/)
		// ==========================================
		{
			page: '/',
			selector: '#app-header',
			title: 'Header & Settings',
			desc: 'Tap the header anytime to manage your profile, security PIN, view app info, or report bugs.',
			showNext: true
		},
		{
			page: '/',
			selector: '.px-2.pt-8.pb-8',
			title: 'Daily Insights',
			desc: 'Greets you and provides smart contextual spending feedback based on your active budget pace.',
			showNext: true
		},
		{
			page: '/',
			selector: 'a[href="/variable"]',
			title: 'Variable Expenses View',
			desc: 'A high-level health ring summary showing remaining funds across your flexible budgets.',
			showNext: true
		},
		{
			page: '/',
			selector: 'a[href="/fixed"]',
			title: 'Fixed Responsibilities View',
			desc: 'Summarizes your regular scheduled obligations with checkmarks indicating completed payments.',
			showNext: true
		},
		{
			page: '/',
			selector: 'a[href="/balance"]',
			title: 'Account Balance View',
			desc: 'Quickly check your available liquid Leftover cache alongside your total aggregate bank balance.',
			showNext: true
		},
		{
			page: '/',
			selector: 'nav a[href="/variable"]',
			title: 'Variables Navigation',
			desc: "Let's head over to the <b>Variables</b> page. Tap the Variables icon in the navigation bar.",
			waitForTargetClick: true,
			nextPage: '/variable'
		},

		// ==========================================
		// 2. VARIABLES (/variable)
		// ==========================================
		{
			page: '/variable',
			selector: '#variable-title',
			title: 'Variable Budgets',
			desc: 'Track flexible day-to-day spending like groceries, fuel, dining out, and shopping.',
			showNext: true
		},
		{
			page: '/variable',
			selector: '#variable-menu-btn',
			title: 'Category Menu',
			desc: 'Tap the three-dots icon (⋮) to open the menu for adding or reordering categories.',
			waitForTargetClick: true
		},
		{
			page: '/variable',
			selector: '#add-category-btn',
			title: 'Add Category Option',
			desc: 'Tap <b>Add Category</b> to open the new category creation form.',
			waitForTargetClick: true
		},
		// --- Add Category Modal Walkthrough ---
		{
			page: '/variable',
			selector: '#modal-category-name',
			title: 'Category Name',
			desc: 'Name this expense category (e.g. Groceries, Netflix, Fuel).',
			showNext: true,
			requiresModal: true
		},
		{
			page: '/variable',
			selector: '#modal-category-desc',
			title: 'Description',
			desc: 'Add optional notes or details describing what this budget covers.',
			showNext: true,
			requiresModal: true
		},
		{
			page: '/variable',
			selector: '#modal-category-limit',
			title: 'Limit Amount',
			desc: 'Set your allocated budget limit for this category in rupees.',
			showNext: true,
			requiresModal: true
		},
		{
			page: '/variable',
			selector: '#modal-category-period',
			title: 'Period Type',
			desc: 'Choose how often this budget refreshes: Monthly, Weekly, Daily, Yearly, or Manual.',
			showNext: true,
			requiresModal: true
		},
		{
			page: '/variable',
			selector: '#modal-category-reset',
			title: 'Reset Schedule',
			desc: 'Specify the reset day of the cycle (e.g. 1st of every month).',
			showNext: true,
			requiresModal: true
		},
		{
			page: '/variable',
			selector: '#modal-category-icon',
			title: 'Category Icon',
			desc: 'Select a custom icon for easy visual recognition on your dashboard.',
			showNext: true,
			requiresModal: true
		},
		{
			page: '/variable',
			selector: '#modal-category-save',
			title: 'Create Category',
			desc: "Tapping 'Create Category' encrypts and creates your budget. Let's close the form and check out the list.",
			showNext: true,
			closeModalAfter: true,
			requiresModal: true
		},
		{
			page: '/variable',
			selector: '#variable-list, #variable-empty-state',
			title: 'Budget Health Rings',
			desc: 'Your categories appear here with visual progress rings showing remaining balance and reset timers. Tap any card anytime to edit limits.',
			showNext: true
		},
		{
			page: '/variable',
			selector: 'nav a[href="/fixed"]',
			title: 'Fixed Navigation',
			desc: "Next, let's explore <b>Fixed Expenses</b>. Tap the Fixed icon in the navigation bar.",
			waitForTargetClick: true,
			nextPage: '/fixed'
		},

		// ==========================================
		// 3. FIXED (/fixed)
		// ==========================================
		{
			page: '/fixed',
			selector: '#fixed-title',
			title: 'Fixed Expenses',
			desc: 'Manage recurring obligations with exact schedules such as rent, EMIs, utilities, and subscriptions.',
			showNext: true
		},
		{
			page: '/fixed',
			selector: '#fixed-menu-btn',
			title: 'Fixed Menu',
			desc: 'Add new fixed obligations or drag to reorder priorities via the menu.',
			showNext: true
		},
		{
			page: '/fixed',
			selector: '#fixed-container-card, #fixed-list',
			title: 'Payment Checklist',
			desc: 'Fixed obligations automatically receive a green checkmark once paid for the cycle. Tap any item to edit amounts or reset schedules.',
			showNext: true
		},
		{
			page: '/fixed',
			selector: 'nav a[href="/balance"]',
			title: 'Balance Navigation',
			desc: "Let's check out your <b>Account Balance</b>. Tap the Balance icon in the navigation bar.",
			waitForTargetClick: true,
			nextPage: '/balance'
		},

		// ==========================================
		// 4. BALANCE (/balance)
		// ==========================================
		{
			page: '/balance',
			selector: '#corpus-list',
			title: 'Leftovers & Locked Funds',
			desc: 'Your liquid Leftover vault holds unallocated funds ready to be assigned, while locked funds act as your emergency reserve.',
			showNext: true
		},
		{
			page: '/balance',
			selector: '#bank-balance-card',
			title: 'Bank Balance Allocation',
			desc: 'A visual stacked bar chart displaying how every rupee of your total bank balance is distributed across budgets and leftovers.',
			showNext: true
		},
		{
			page: '/balance',
			selector: 'nav a[href="/list"]',
			title: 'History Navigation',
			desc: "Let's view your transaction <b>History</b>. Tap the History icon in the navigation bar.",
			waitForTargetClick: true,
			nextPage: '/list'
		},

		// ==========================================
		// 5. HISTORY (/list)
		// ==========================================
		{
			page: '/list',
			selector: '#history-filter-btn',
			title: 'Filters & Search',
			desc: 'Quickly filter your transaction history by specific month, year, or budget category.',
			showNext: true
		},
		{
			page: '/list',
			selector: '#transaction-list, #transaction-list-empty',
			title: 'Transaction Feed',
			desc: 'All recorded transactions appear grouped by date. Tap any transaction in the future to view details, update, or delete it.',
			showNext: true
		},
		{
			page: '/list',
			selector: 'a[href="/add"]',
			title: 'Add Transaction Button',
			desc: "The floating '+' button is accessible across all pages. Tap it to open the transaction form.",
			waitForTargetClick: true,
			nextPage: '/add'
		},

		// ==========================================
		// 6. ADD TRANSACTION (/add)
		// ==========================================
		{
			page: '/add',
			selector: 'input[placeholder="Title"]',
			title: 'Title & Merchant',
			desc: 'Enter the title or merchant name (e.g. Grocery Store, Coffee, Rent, Salary).',
			showNext: true
		},
		{
			page: '/add',
			selector: 'textarea[placeholder="Add a description (optional)..."]',
			title: 'Description',
			desc: 'Add optional notes or item breakdown for this transaction.',
			showNext: true
		},
		{
			page: '/add',
			selector: '#add-date-type-container',
			title: 'Date & Type',
			desc: 'Select the transaction date and choose between Debit (expense) or Credit (income).',
			showNext: true
		},
		{
			page: '/add',
			selector: '#add-amount-container',
			title: 'Amount (₹)',
			desc: 'Enter the transaction amount in rupees.',
			showNext: true
		},
		{
			page: '/add',
			selector: '#category-dropdown-btn',
			title: 'Category Assignment',
			desc: 'Assign the transaction directly to any of your active budget categories or leftovers.',
			showNext: true
		},
		{
			page: '/add',
			selector: '#add-txn-save-btn',
			title: 'Save Transaction',
			desc: "Tapping 'Add Transaction' securely encrypts and stores your entry in your private vault.",
			showNext: true
		},
		{
			page: '/add',
			selector: 'body',
			title: "You're All Set! 🎉",
			desc: 'You now know all the core parts of Green Bar. Take total control of your money and give every rupee a job!',
			showFinish: true
		}
	];

	let currentStepDef = $derived(steps[step - 1]);

	let modalTop = $derived.by(() => {
		let topVal;
		if (currentStepDef?.selector === 'body' || !targetRect) {
			topVal = window.innerHeight / 2;
		} else {
			const spaceBelow = window.innerHeight - targetRect.bottom;
			const spaceAbove = targetRect.top;

			if (currentStepDef?.preferTop && spaceAbove >= modalHeight + 20) {
				topVal = targetRect.top - modalHeight - 20;
			} else if (spaceBelow >= modalHeight + 20) {
				topVal = targetRect.bottom + 20;
			} else if (spaceAbove >= modalHeight + 20) {
				topVal = targetRect.top - modalHeight - 20;
			} else {
				topVal = window.innerHeight / 2;
			}
		}

		// Clamp to screen boundaries
		const minTop = 20;
		const maxTop = window.innerHeight - modalHeight - 20;
		const clamped = Math.max(minTop, Math.min(topVal, maxTop));
		return `${clamped}px`;
	});

	let modalTransform = $derived.by(() => {
		if (currentStepDef?.selector === 'body' || !targetRect) return 'translateY(-50%)';
		const spaceBelow = window.innerHeight - targetRect.bottom;
		const spaceAbove = targetRect.top;

		if (currentStepDef?.preferTop && spaceAbove >= modalHeight + 20) return 'none';
		if (spaceBelow >= modalHeight + 20 || spaceAbove >= modalHeight + 20) return 'none';
		return 'translateY(-50%)';
	});

	let mascotStyle = $derived.by(() => {
		if (currentStepDef?.selector === 'body' || !targetRect) {
			return `top: 50%; left: 50%; margin-left: -48px; transform: translateY(-130%);`;
		}

		let topPos = modalTop;
		const spaceBelow = window.innerHeight - targetRect.bottom;
		const spaceAbove = targetRect.top;

		let isModalBelow = false;
		if (currentStepDef?.preferTop && spaceAbove >= modalHeight + 20) {
			isModalBelow = false;
		} else if (spaceBelow >= modalHeight + 20) {
			isModalBelow = true;
		} else if (spaceAbove >= modalHeight + 20) {
			isModalBelow = false;
		}

		let transformY = isModalBelow ? `calc(${modalHeight}px - 10px)` : 'calc(-100% + 15px)';

		return `top: ${topPos}; left: 50%; margin-left: -90px; transform: translateY(${transformY});`;
	});

	let lastScrolledStep = 0;

	$effect(() => {
		function updateRect() {
			if (isPageTransitioning) return;
			if (step > steps.length) return;
			const currentDef = steps[step - 1];

			if ($page.url.pathname !== currentDef.page) {
				targetRect = null;
				return;
			}

			// Ensure modal is open if step requires it
			if (currentDef.requiresModal && !document.querySelector('#add-category-modal')) {
				const addBtn = document.querySelector('#add-category-btn');
				if (addBtn instanceof HTMLElement) {
					addBtn.click();
				}
			}

			if (currentDef.selector && currentDef.selector !== 'body') {
				const el = document.querySelector(currentDef.selector);
				if (el) {
					const rect = el.getBoundingClientRect();
					if (rect.width > 0 && rect.height > 0) {
						targetRect = rect;

						if (step !== lastScrolledStep && !currentDef.requiresModal) {
							lastScrolledStep = step;
							[50, 250, 500].forEach((delay) => {
								setTimeout(() => {
									const currentEl = document.querySelector(currentDef.selector);
									if (currentEl) {
										const r = currentEl.getBoundingClientRect();
										const isVisible = r.top >= 60 && r.bottom <= window.innerHeight - 60;
										if (!isVisible && r.height > 0) {
											currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
										}
									}
								}, delay);
							});
						}
					}
				} else {
					targetRect = null;
				}
			} else {
				targetRect = null;
			}
		}

		const interval = setInterval(updateRect, 80);

		if (step > 0) {
			updateRect();
		}

		window.addEventListener('resize', updateRect);
		window.addEventListener('scroll', updateRect, { passive: true });

		return () => {
			clearInterval(interval);
			window.removeEventListener('resize', updateRect);
			window.removeEventListener('scroll', updateRect);
		};
	});

	async function finishTutorial(isSkipped = false) {
		try {
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('greenbar_tutorial_status', 'completed');
			}
		} catch (err) {
			console.warn('Unable to persist tutorial status to localStorage:', err);
		}

		closeAnyOpenModals();

		targetRect = null;
		if ($page.url.pathname !== '/') {
			isPageTransitioning = true;
			await goto('/');
		}
		onComplete();
	}

	function closeAnyOpenModals() {
		try {
			const closeBtn = document.querySelector('#add-category-modal button:has(.lucide-x)') ||
			                 document.querySelector('#add-category-modal button');
			if (closeBtn instanceof HTMLElement) {
				closeBtn.click();
			}
		} catch (e) {}
	}

	async function nextStep() {
		if (step < steps.length) {
			const currentDef = steps[step - 1];

			if (currentDef.closeModalAfter) {
				closeAnyOpenModals();
				await new Promise((r) => setTimeout(r, 200));
			}

			stepHistory.push(step);
			const fallbackNav = steps[step - 1].nextPage;
			step++;
			await handleNav(steps[step - 1].page, fallbackNav);
		} else {
			await finishTutorial();
		}
	}

	async function prevStep() {
		if (stepHistory.length > 0) {
			const lastStep = stepHistory.pop();
			if (lastStep !== undefined) {
				step = lastStep;
				await handleNav(steps[step - 1].page);
			}
		}
	}

	/**
	 * @param {string} targetPage
	 * @param {string | null} [fallbackNav=null]
	 */
	async function handleNav(targetPage, fallbackNav = null) {
		const navTo = fallbackNav || targetPage;
		if ($page.url.pathname !== navTo) {
			targetRect = null;
			isPageTransitioning = true;
			await new Promise((r) => setTimeout(r, 150));
			await goto(navTo);
			await new Promise((resolve) => setTimeout(resolve, 800));
			isPageTransitioning = false;
		}
	}

	function handleTargetClick() {
		if (!currentStepDef?.selector) return;
		const el = /** @type {HTMLElement | null} */ (document.querySelector(currentStepDef.selector));
		if (el) {
			el.click();
		} else if (currentStepDef.nextPage) {
			handleNav(currentStepDef.nextPage);
		}

		// If clicking variable-menu-btn, wait for #add-category-btn to appear before advancing
		if (currentStepDef.selector === '#variable-menu-btn') {
			const checkMenu = setInterval(() => {
				if (document.querySelector('#add-category-btn')) {
					clearInterval(checkMenu);
					nextStep();
				}
			}, 50);
			setTimeout(() => {
				clearInterval(checkMenu);
				if (step === 8) nextStep();
			}, 1200);
			return;
		}

		// If clicking add-category-btn, wait for #modal-category-name to appear before advancing
		if (currentStepDef.selector === '#add-category-btn') {
			const checkModal = setInterval(() => {
				if (document.querySelector('#modal-category-name')) {
					clearInterval(checkModal);
					nextStep();
				}
			}, 50);
			setTimeout(() => {
				clearInterval(checkModal);
				if (step === 9) nextStep();
			}, 1200);
			return;
		}

		setTimeout(() => nextStep(), 150);
	}
</script>

{#if !isPageTransitioning}
	<!-- Mascot graphic (z-320) -->
	<div
		class="fixed z-[320] pointer-events-none drop-shadow-2xl"
		style="{mascotStyle} transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);"
	>
		<img
			src="/mascot.png"
			alt="Mascot"
			class="w-24 h-auto md:w-28 hover:scale-105 transition-transform"
		/>
	</div>

	<!-- Top Controls: Go Back & Always Visible Skip (z-330) -->
	<div class="fixed top-6 left-6 right-6 z-[330] flex items-center justify-between pointer-events-none">
		<!-- Global Go Back -->
		{#if stepHistory.length > 0}
			<button
				class="text-gray-300 hover:text-white transition-colors pointer-events-auto font-semibold text-xs tracking-widest bg-black/70 hover:bg-black/90 px-4 py-2.5 rounded-2xl backdrop-blur-md flex items-center gap-1.5 box-3d shadow-2xl border border-gray-700 cursor-pointer"
				onclick={prevStep}
				transition:fade={{ duration: 150 }}
			>
				<ChevronLeft class="w-4 h-4" /> BACK
			</button>
		{:else}
			<div></div>
		{/if}

		<!-- Persistent Top-Right Skip Button -->
		<button
			class="text-gray-300 hover:text-white transition-colors pointer-events-auto font-semibold text-xs tracking-widest bg-black/70 hover:bg-black/90 px-4 py-2.5 rounded-2xl backdrop-blur-md flex items-center gap-1.5 box-3d shadow-2xl border border-gray-700 cursor-pointer"
			onclick={() => finishTutorial(true)}
		>
			SKIP TOUR <X class="w-3.5 h-3.5" />
		</button>
	</div>

	<!-- Full-screen backdrop (z-300): Blocks all clicks outside cutout and modal -->
	<div
		class="fixed inset-0 z-[300] pointer-events-auto"
		transition:fade={{ duration: 250 }}
		role="presentation"
		onclick={(e) => {
			e.stopPropagation();
		}}
	>
		<svg
			class="absolute inset-0 w-full h-full pointer-events-none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<mask id="tutorial-hole">
					<rect width="100%" height="100%" fill="white" />
					{#if targetRect && currentStepDef.selector !== 'body'}
						<rect
							x={targetRect.left - 8}
							y={targetRect.top - 8}
							width={targetRect.width + 16}
							height={targetRect.height + 16}
							rx="20"
							fill="black"
							style="transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);"
						/>
					{/if}
				</mask>
			</defs>
			<rect width="100%" height="100%" fill="rgba(0,0,0,0.85)" mask="url(#tutorial-hole)" />
		</svg>

		<!-- Highlight Action Click Target Button (z-310: Always on top of the highlighted element) -->
		{#if targetRect && currentStepDef.waitForTargetClick}
			<button
				class="absolute z-[310] cursor-pointer bg-transparent pointer-events-auto rounded-2xl border-2 border-white shadow-[0_0_25px_rgba(255,255,255,0.4)] animate-pulse"
				style="left: {targetRect.left - 6}px; top: {targetRect.top - 6}px; width: {targetRect.width + 12}px; height: {targetRect.height + 12}px;"
				onclick={handleTargetClick}
				aria-label="Target Action"
			></button>
		{/if}

		<!-- Tutorial Modal Box Card (z-320) -->
		{#if targetRect || currentStepDef.selector === 'body'}
			<div
				bind:clientHeight={modalHeight}
				class="absolute z-[320] max-w-[310px] w-[90vw] bg-white rounded-3xl p-6 box-3d shadow-[0_0_60px_rgba(0,0,0,0.85)] pointer-events-auto"
				style="
					top: {modalTop};
					transform: {modalTransform};
					left: 0; right: 0; margin-left: auto; margin-right: auto;
					transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
				"
				role="dialog"
				aria-modal="true"
				onclick={(e) => e.stopPropagation()}
			>
				<div class="flex items-center justify-between mb-2">
					<span class="text-xs font-bold uppercase tracking-wider text-gray-400">
						Step {step} of {steps.length}
					</span>
				</div>

				<h3 class="text-2xl font-display text-black mb-2 tracking-wide leading-tight">
					{currentStepDef.title}
				</h3>
				<p class="text-gray-700 mb-5 leading-relaxed text-base">{@html currentStepDef.desc}</p>

				<!-- Action Buttons (Next ONLY shown on informational steps, NEVER on action/click steps) -->
				{#if currentStepDef.showFinish}
					<div class="mt-2">
						<button
							class="bg-black text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 box-3d w-full justify-center text-base hover:bg-gray-900 cursor-pointer active:scale-95 transition-transform"
							onclick={() => finishTutorial(false)}
						>
							Finish <Check class="w-5 h-5 text-green-400" />
						</button>
					</div>
				{:else if currentStepDef.showNext}
					<div class="mt-2">
						<button
							class="bg-black text-white px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 box-3d w-full justify-center text-base hover:bg-gray-900 cursor-pointer active:scale-95 transition-transform"
							onclick={nextStep}
						>
							Next <ChevronRight class="w-5 h-5" />
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
