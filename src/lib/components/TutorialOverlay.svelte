<script>
	import { fade, slide as svelteSlide, fly, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { ChevronRight, Check, ChevronLeft } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase';
	import { appData } from '$lib/data.svelte.js';
	import { encryptData } from '$lib/crypto';
	import { cryptoStore } from '$lib/cryptoStore.svelte';

	let { onComplete, startStep = 1 } = $props();

	let step = $state(startStep);
	/** @type {number[]} */
	let stepHistory = $state([]);
	/** @type {DOMRect | null} */
	let targetRect = $state(null);
	let isPageTransitioning = $state(false);
	let modalHeight = $state(200);

	// Slide states
	let initialBalance = $state('');
	let loading = $state(false);

	const steps = [
		// 0. Welcome Slide 1 (Intro)
		{ type: 'slide', id: 'welcome-1', page: '/' },
		// 1. Welcome Slide 2 (Balance Entry)
		{ type: 'slide', id: 'welcome-2', page: '/' },
		// 2. Welcome Slide 3 (Setup Complete)
		{ type: 'slide', id: 'welcome-3', page: '/' },

		// 3. Dashboard: Highlight Leftover Card. Wait for user to click it.
		{
			type: 'highlight',
			page: '/',
			selector: 'a[href="/fixed"].mt-2',
			title: 'Account Status',
			desc: 'This is where you can check your balance. <b>Click it to go to corpus page.</b>',
			waitForTargetClick: true
		},
		// 4. Fixed Page: Highlight Leftover Card. Show "Got it" button.
		{
			type: 'highlight',
			page: '/fixed',
			selector: '#corpus-list > div:first-child',
			title: 'Leftover',
			desc: 'This card can be edited by clicking upon it.',
			showGotIt: true
		},
		// 5. Fixed Page: Ask for fixed expenses
		{
			type: 'highlight',
			page: '/fixed',
			selector: '#fixed-title',
			title: 'Fixed Expenses',
			desc: 'Do you have any expenses which need to be paid on fixed intervals? Like EMIs, subscriptions, rent, etc.',
			isQuestion: true,
			questionType: 'fixed'
		},
		// 6. Highlight Menu
		{
			type: 'highlight',
			page: '/fixed',
			selector: '#fixed-menu-btn',
			title: 'Menu',
			desc: 'Click on the three dots to add a new category.',
			waitForTargetClick: true
		},
		// 7. Highlight Add Category
		{
			type: 'highlight',
			page: '/fixed',
			selector: '#add-category-btn',
			title: 'Add Category',
			desc: 'Click on <b>Add Category</b> button to open the Add Category form.',
			waitForTargetClick: true
		},
		// 8. Wait for modal to open and highlight name
		{
			type: 'highlight',
			page: '/fixed',
			selector: '#modal-category-name',
			title: 'Category Name',
			desc: 'Name this expense, e.g. Netflix or Rent.',
			allowPointerEvents: true,
			showNext: true
		},
		// 9. Highlight desc
		{
			type: 'highlight',
			page: '/fixed',
			selector: '#modal-category-desc',
			title: 'Description',
			desc: 'Describe this expense.',
			allowPointerEvents: true,
			showNext: true
		},
		// 10. Highlight amount
		{
			type: 'highlight',
			page: '/fixed',
			selector: '#modal-category-limit',
			title: 'Amount',
			desc: 'What amount do you need to pay?',
			allowPointerEvents: true,
			showNext: true
		},
		// 11. Highlight Period
		{
			type: 'highlight',
			page: '/fixed',
			selector: '#modal-category-period',
			title: 'Period',
			desc: 'How often do you pay this?',
			allowPointerEvents: true,
			showNext: true
		},
		// 12. Highlight Reset Date
		{
			type: 'highlight',
			page: '/fixed',
			selector: '#modal-category-reset',
			title: 'Reset Date',
			desc: 'On what date should this budget reset?',
			allowPointerEvents: true,
			showNext: true
		},
		// 13. Highlight Icon
		{
			type: 'highlight',
			page: '/fixed',
			selector: '#modal-category-icon',
			title: 'Icon',
			desc: 'Choose an icon for this category.',
			allowPointerEvents: true,
			showNext: true,
			preferTop: true
		},
		// 14. Highlight Save
		{
			type: 'highlight',
			page: '/fixed',
			selector: '#modal-category-save',
			title: 'Create Category',
			desc: 'Save your new category.',
			waitForTargetClick: true
		},
		// 15. Highlight newly created category (Success)
		{
			type: 'highlight',
			page: '/fixed',
			selector: '#fixed-list > div:last-child',
			title: 'Category Created!',
			desc: 'Your new fixed expense category has been successfully added.<br/>Tap on it in future to edit it.',
			showGotIt: true
		},
		// 16. Variable Page Intro
		{
			type: 'highlight',
			page: '/fixed',
			selector: 'nav a[href="/variable"]',
			title: 'Variable Expenses',
			desc: "Let's head over to the Variable Expenses page. Tap the icon in the bottom navigation bar.",
			waitForTargetClick: true
		},
		// 17. Variable Page: Ask for variable expenses
		{
			type: 'highlight',
			page: '/variable',
			selector: '#variable-title',
			title: 'Variable Expenses',
			desc: 'Do you have any expenses that are spent variably? Like groceries, fuel, weekend movies, etc.',
			isQuestion: true,
			questionType: 'variable'
		},
		// 18. Highlight Menu
		{
			type: 'highlight',
			page: '/variable',
			selector: '#variable-menu-btn',
			title: 'Menu',
			desc: 'Click on the three dots to add a new category.',
			waitForTargetClick: true
		},
		// 19. Highlight Add Category
		{
			type: 'highlight',
			page: '/variable',
			selector: '#add-category-btn',
			title: 'Add Category',
			desc: 'Click on <b>Add Category</b> button to open the Add Category form.',
			waitForTargetClick: true
		},
		// 20. Wait for modal to open and highlight name
		{
			type: 'highlight',
			page: '/variable',
			selector: '#modal-category-name',
			title: 'Category Name',
			desc: 'Name this variable expense, e.g. Groceries.',
			allowPointerEvents: true,
			showNext: true
		},
		// 21. Highlight desc
		{
			type: 'highlight',
			page: '/variable',
			selector: '#modal-category-desc',
			title: 'Description',
			desc: 'Describe this expense.',
			allowPointerEvents: true,
			showNext: true
		},
		// 22. Highlight amount
		{
			type: 'highlight',
			page: '/variable',
			selector: '#modal-category-limit',
			title: 'Amount',
			desc: 'What is your budget limit for this?',
			allowPointerEvents: true,
			showNext: true
		},
		// 23. Highlight Period
		{
			type: 'highlight',
			page: '/variable',
			selector: '#modal-category-period',
			title: 'Period',
			desc: 'How often does this budget reset?',
			allowPointerEvents: true,
			showNext: true
		},
		// 24. Highlight Reset Date
		{
			type: 'highlight',
			page: '/variable',
			selector: '#modal-category-reset',
			title: 'Reset Date',
			desc: 'When should this budget reset?',
			allowPointerEvents: true,
			showNext: true
		},
		// 25. Highlight Icon
		{
			type: 'highlight',
			page: '/variable',
			selector: '#modal-category-icon',
			title: 'Icon',
			desc: 'Choose an icon for this category.',
			allowPointerEvents: true,
			showNext: true,
			preferTop: true
		},
		// 26. Highlight Save
		{
			type: 'highlight',
			page: '/variable',
			selector: '#modal-category-save',
			title: 'Create Category',
			desc: 'Save your new category.',
			waitForTargetClick: true
		},
		// 27. Highlight newly created category (Success)
		{
			type: 'highlight',
			page: '/variable',
			selector: '#variable-list > div:last-child',
			title: 'Category Created!',
			desc: 'Your new variable expense category has been successfully added.<br/>Tap on it in future to edit it.',
			showGotIt: true
		},
		// 28. Back to Home
		{
			type: 'highlight',
			page: '/variable',
			selector: 'nav a[href="/"]',
			title: 'Back to Home',
			desc: "Let's head back to the Home dashboard. Tap the Home icon in the navigation bar.",
			waitForTargetClick: true
		},
		// 29. Dashboard: Highlight Variable Expenses card -> "Got it".
		{
			type: 'highlight',
			page: '/',
			selector: 'a[href="/variable"]',
			title: 'Variable Expenses View',
			desc: 'You can get a high level view of your variable expenses from this card.',
			showGotIt: true
		},
		// 30. Dashboard: Highlight Fixed Expenses card -> "Got it".
		{
			type: 'highlight',
			page: '/',
			selector: 'a[href="/fixed"]:not(.mt-2)',
			title: 'Fixed Expenses View',
			desc: 'Similarly, your fixed expenses are summarized here.',
			showGotIt: true
		},
		// 31. Dashboard: Highlight "Add Transaction" (FAB) button. Prompt user to click it.
		{
			type: 'highlight',
			page: '/',
			selector: 'a[href="/add"]',
			title: 'One Final Step!',
			desc: 'Congratulations on finishing the setup! <b>Complete one final step - adding a dummy transaction.</b> Click the + button.',
			waitForTargetClick: true
		},
		// 32. Add Page: Walkthrough Name
		{
			type: 'highlight',
			page: '/add',
			selector: 'input[placeholder="Title"]',
			title: 'Transaction Name',
			desc: 'Name this transaction "Dummy transaction".',
			allowPointerEvents: true,
			showNext: true
		},
		// 33. Add Page: Walkthrough Desc
		{
			type: 'highlight',
			page: '/add',
			selector: 'textarea[placeholder="Add a description (optional)..."]',
			title: 'Description',
			desc: 'Add a description like "bought bread, butter and milk".',
			allowPointerEvents: true,
			showNext: true
		},
		// 34. Add Page: Walkthrough Date
		{
			type: 'highlight',
			page: '/add',
			selector: 'input[type="date"]',
			title: 'Date',
			desc: "Add yesterday's date.",
			allowPointerEvents: true,
			showNext: true
		},
		// 35. Add Page: Walkthrough Type
		{
			type: 'highlight',
			page: '/add',
			selector: 'button:has(span.capitalize)',
			title: 'Type',
			desc: 'Select type debit.',
			showGotIt: true
		},
		// 36. Add Page: Walkthrough Amount
		{
			type: 'highlight',
			page: '/add',
			selector: 'input[type="number"]',
			title: 'Amount',
			desc: 'Enter the amount.',
			allowPointerEvents: true,
			showNext: true
		},
		// 37. Add Page: Walkthrough Category
		{
			type: 'highlight',
			page: '/add',
			selector: '#category-dropdown-btn',
			title: 'Category',
			desc: 'Choose any category.',
			allowPointerEvents: true,
			showNext: true,
			preferTop: true
		},
		// 38. Add Page: Walkthrough Save
		{
			type: 'highlight',
			page: '/add',
			selector: '#add-txn-save-btn', // Save button
			title: 'Save',
			desc: 'Save the transaction.',
			waitForTargetClick: true,
			waitToDisappear: true
		},
		// 39. List Page: Highlight the newly added transaction. Wait for user to tap.
		{
			type: 'highlight',
			page: '/list',
			selector: '#transaction-list > div:first-child button',
			title: 'Transaction Added!',
			desc: 'Here is your newly added transaction. Tap on it to view or modify details.',
			waitForTargetClick: true
		},
		// 40. List Page (Modal Open): Wait for user to tap the "Delete" button.
		{
			type: 'highlight',
			page: '/list',
			selector: '#modal-delete-btn',
			title: 'Delete Transaction',
			desc: "Since this is a dummy transaction, let's delete it.",
			waitForTargetClick: true
		},
		// 41. List Page: Confirm Delete
		{
			type: 'highlight',
			page: '/list',
			selector: '#modal-confirm-delete-btn',
			title: 'Confirm Delete',
			desc: 'Confirm the deletion.',
			waitForTargetClick: true,
			waitToDisappear: true // wait for modal to close
		},
		// 41. List Page: Highlight Filter button. Show "Got it" button -> Redirects to Dashboard.
		{
			type: 'highlight',
			page: '/list',
			selector: 'button:has(.lucide-sliders-horizontal)',
			title: 'Filters',
			desc: 'You can filter transaction history using the filter button.',
			showGotIt: true
		},
		// 42. Back to Home
		{
			type: 'highlight',
			page: '/list',
			selector: 'nav a[href="/"]',
			title: 'Back to Home',
			desc: "Let's head back to the Dashboard.",
			waitForTargetClick: true
		},
		// 43. Dashboard: Final Congratulation
		{
			type: 'highlight',
			page: '/',
			selector: 'body',
			title: 'Ready to Go!',
			desc: 'Congratulations! You are now ready to use the app.',
			showGotIt: true
		},
		// 44. Dashboard: Highlight Top Header.
		{
			type: 'highlight',
			page: '/',
			selector: '#app-header',
			title: 'Settings',
			desc: 'You can change the app setting by tapping the top bar.',
			showGotIt: true
		},
		// 45. Dashboard: Highlight Bottom Navbar.
		{
			type: 'highlight',
			page: '/',
			selector: 'nav',
			title: 'Navigation',
			desc: 'Navigate the app using the bottom navbar.',
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

		// Clamp to screen
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
		if (currentStepDef?.type === 'slide') {
			return `top: 50%; left: 50%; margin-left: -48px; margin-top: -${modalHeight / 2 - 20}px; transform: translateY(-280px);`;
		}

		if (currentStepDef?.selector === 'body' || !targetRect) {
			return `top: 50%; left: 50%; margin-left: -48px; transform: translateY(-100%);`;
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

		let transformY = isModalBelow ? `calc(${modalHeight}px - 20px)` : 'calc(-100% + 20px)';

		return `top: ${topPos}; left: 50%; margin-left: -100px; transform: translateY(${transformY});`;
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

			if (currentDef.selector && currentDef.selector !== 'body') {
				const el = document.querySelector(currentDef.selector);
				if (el) {
					const rect = el.getBoundingClientRect();
					if (step !== lastScrolledStep) {
						lastScrolledStep = step;
						[50, 300, 600].forEach((delay) => {
							setTimeout(() => {
								const currentEl = document.querySelector(currentDef.selector);
								if (currentEl) {
									const rect = currentEl.getBoundingClientRect();
									const isVisible = rect.top >= 60 && rect.bottom <= window.innerHeight - 60;
									if (!isVisible && rect.height > 0) {
										currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
									}
								}
							}, delay);
						});
					}

					let finalRect = rect;
					if (
						currentDef.selector === '#modal-category-icon' ||
						currentDef.selector === '#category-dropdown-btn'
					) {
						const dropdownEl = el.parentElement?.querySelector('.absolute.overflow-y-auto');
						if (dropdownEl) {
							const dropdownRect = dropdownEl.getBoundingClientRect();
							const top = Math.min(rect.top, dropdownRect.top);
							const left = Math.min(rect.left, dropdownRect.left);
							const bottom = Math.max(rect.bottom, dropdownRect.bottom);
							const right = Math.max(rect.right, dropdownRect.right);
							finalRect = new DOMRect(left, top, right - left, bottom - top);
						}
					}
					targetRect = finalRect;
				} else {
					targetRect = null;
				}
			} else {
				targetRect = null;
			}
		}

		const interval = setInterval(updateRect, 100);

		if (step > 0) {
			updateRect(); // Instantly update on step change, avoiding 100ms delay
		}

		window.addEventListener('resize', updateRect);
		window.addEventListener('scroll', updateRect, { passive: true });

		return () => {
			clearInterval(interval);
			window.removeEventListener('resize', updateRect);
			window.removeEventListener('scroll', updateRect);
		};
	});

	async function finishTutorial() {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		if (session) {
			await supabase
				.from('profiles')
				.update({ onboarding_completed: true })
				.eq('id', session.user.id);
		}
		targetRect = null;
		if ($page.url.pathname !== '/') {
			isPageTransitioning = true;
			await goto('/');
		}
		onComplete();
	}

	/** @param {boolean | null} answer */
	async function nextStep(answer = null) {
		if (step < steps.length) {
			stepHistory.push(step); // Save history for go back

			const nextStepDef = steps[step - 1];

			// Dynamic skips for questions
			if (nextStepDef.isQuestion && nextStepDef.questionType === 'fixed' && answer === false) {
				step += 11; // Skip to Variable Page Intro
				await handleNav(steps[step - 1].page);
				return;
			}
			if (nextStepDef.isQuestion && nextStepDef.questionType === 'variable' && answer === false) {
				step += 11; // Skip to Back to Home
				await handleNav(steps[step - 1].page);
				return;
			}

			const fallbackNav = /** @type {any} */ (currentStepDef).nextPage;
			const forceTransition = step === 3;
			step++;
			await handleNav(steps[step - 1].page, fallbackNav, forceTransition);
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
	 * @param {string | null} fallbackNav
	 * @param {boolean} forceTransition
	 */
	async function handleNav(targetPage, fallbackNav = null, forceTransition = false) {
		const navTo = fallbackNav || targetPage;
		if ($page.url.pathname !== navTo || forceTransition) {
			targetRect = null;
			isPageTransitioning = true;
			await new Promise((r) => setTimeout(r, 200));
			if ($page.url.pathname !== navTo) {
				await goto(navTo);
			}
			await new Promise((resolve) => setTimeout(resolve, 1000));
			isPageTransitioning = false;
		}
	}

	async function handleSaveInitialBalance() {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		if (!session) return;

		if (!initialBalance) {
			nextStep();
			return;
		}

		loading = true;
		let category_id = appData.corpusBudgets.find(
			(b) => b.category.toLowerCase() === 'Leftover'
		)?.category_id;

		if (!category_id) {
			const { data } = await supabase
				.from('budgets')
				.select('*')
				.eq('user_id', session.user.id)
				.eq('budget_type', 'corpus')
				.ilike('category', 'Leftover')
				.single();
			category_id = data?.category_id;
		}

		if (category_id && cryptoStore.dmk) {
			const payload = {
				amount: Number(initialBalance),
				transaction_type: 'credit',
				title: 'Initial account status',
				category_id: category_id,
				transaction_date: '2000-01-01'
			};
			const encryptedData = await encryptData(payload, cryptoStore.dmk);
			const { error } = await supabase.from('transactions_encrypted').insert([
				{
					id: crypto.randomUUID(),
					user_id: session.user.id,
					encrypted_data: encryptedData
				}
			]);
			if (error) alert('Error saving balance: ' + error.message);
		}

		loading = false;
		nextStep();
	}
</script>

<svelte:window
	onclick={(e) => {
		if (currentStepDef?.waitForTargetClick && !isPageTransitioning) {
			if (!e.isTrusted) return; // Prevent double firing from programmatic clicks
			const el = document.querySelector(currentStepDef.selector);
			if (el && e.target instanceof Element && (e.target === el || el.contains(e.target))) {
				if (e.target.tagName !== 'BUTTON' || e.target.getAttribute('aria-label') !== 'Target') {
					if (currentStepDef.waitToDisappear) {
						const checkInterval = setInterval(() => {
							if (!document.querySelector(currentStepDef.selector)) {
								clearInterval(checkInterval);
								setTimeout(() => nextStep(), 500);
							}
						}, 200);
					} else {
						setTimeout(() => nextStep(), 100);
					}
				}
			}
		}
	}}
/>

{#if !isPageTransitioning}
	<!-- Dynamic Mascot -->
	<div
		class="absolute z-[220] pointer-events-none drop-shadow-2xl"
		style="{mascotStyle} transition: all 0.6s cubic-bezier(0.25, 1, 0.5, 1);"
	>
		<img
			src="/mascot.png"
			alt="Mascot"
			class="w-32 h-auto md:w-32 hover:scale-105 transition-transform"
		/>
	</div>

	<!-- Global Go Back -->
	{#if stepHistory.length > 0}
		<button
			class="fixed top-6 left-6 text-gray-300 hover:text-white transition-colors z-[210] pointer-events-auto font-semibold text-sm tracking-widest bg-black/50 hover:bg-black/70 px-5 py-3 rounded-2xl backdrop-blur-md flex items-center gap-2 box-3d shadow-xl"
			onclick={prevStep}
			transition:fade={{ duration: 200 }}
		>
			<ChevronLeft class="w-5 h-5" /> GO BACK
		</button>
	{/if}

	{#if currentStepDef.type === 'slide'}
		<div
			class="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm text-gray-300 font-sans p-6 flex flex-col items-center justify-center w-full"
			transition:fade={{ duration: 300 }}
		>
			<div
				class="w-full max-w-lg bg-[#151515] p-8 md:p-10 rounded-[2.5rem] box-3d shadow-2xl relative flex flex-col gap-6"
				in:fly={{ y: 30, duration: 500, easing: cubicOut }}
			>
				<div class="mt-4">
					{#if currentStepDef.id === 'welcome-1'}
						<h1 class="text-4xl font-display text-white mb-4 tracking-wide leading-tight">
							Welcome to Green Bar
						</h1>
						<p class="text-gray-400 text-lg leading-relaxed mb-6">
							A gamified expense tracker where every rupee gets a job. <br /> By dividing your money into
							specific categories upfront, you take total control of your finances.
						</p>
						<div class="bg-[#1a1a1a] border border-gray-800 p-4 rounded-2xl mb-8">
							<strong class="text-white block mb-1">💡 Pro Tip: <br /> Download the webapp</strong>
							<span class="text-sm text-gray-400">
								Tap the Share button in your browser and select <strong>"Add to Home Screen"</strong
								> for the best app experience.
							</span>
						</div>
						<button
							class="w-full bg-white text-black font-bold py-4 text-xl rounded-2xl box-3d flex justify-center items-center gap-2 transition-transform active:scale-95"
							onclick={() => nextStep()}
						>
							Get Started <ChevronRight class="w-6 h-6" />
						</button>
					{:else if currentStepDef.id === 'welcome-2'}
						<h1 class="text-4xl font-display text-white mb-4 tracking-wide leading-tight">
							Fill Your Vault
						</h1>
						<p class="text-gray-400 text-base leading-relaxed mb-6">
							To begin using the app, enter your current bank balance. This will become your <strong
								>Leftover</strong
							> in the app.
						</p>
						<div
							class="flex items-center text-5xl tracking-wide font-bold text-white border-b-2 border-gray-800 focus-within:border-white transition-colors w-full pb-2 mb-8"
						>
							<span class="mr-2 text-gray-500">₹</span>
							<input
								type="number"
								bind:value={initialBalance}
								placeholder="0"
								class="bg-transparent w-full focus:outline-none [-moz-appearance:_textfield]"
							/>
						</div>
						<div class="flex gap-4 flex-col">
							<button
								class="w-full bg-white text-black font-bold py-4 text-xl rounded-2xl box-3d flex justify-center items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
								onclick={handleSaveInitialBalance}
								disabled={loading}
							>
								{loading ? 'Saving...' : 'Save Balance'}
								<ChevronRight class="w-6 h-6" />
							</button>
							<button
								class="text-gray-500 font-medium hover:text-white transition-colors"
								onclick={() => nextStep()}>Skip for now</button
							>
						</div>
					{:else if currentStepDef.id === 'welcome-3'}
						<div class="text-center flex flex-col items-center">
							<div
								class="w-20 h-20 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6 box-3d"
							>
								<Check class="w-10 h-10 text-white" />
							</div>
							<h1 class="text-4xl font-display text-white mb-4 tracking-wide leading-tight">
								Initial Setup Complete
							</h1>
							<p class="text-gray-400 text-base leading-relaxed mb-8">
								Your Leftover is ready. Now let's step inside the app to allocate this money
								into categories.
							</p>
							<button
								class="w-full bg-white text-black font-bold py-4 text-xl rounded-2xl box-3d flex justify-center items-center gap-2 transition-transform active:scale-95"
								onclick={() => nextStep()}
							>
								Enter Dashboard <ChevronRight class="w-6 h-6" />
							</button>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div
			class="fixed inset-0 z-[200] {currentStepDef.allowPointerEvents
				? 'pointer-events-none'
				: 'pointer-events-auto'}"
			transition:fade={{ duration: 300 }}
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
								x={targetRect.left - 10}
								y={targetRect.top - 10}
								width={targetRect.width + 20}
								height={targetRect.height + 20}
								rx="24"
								fill="black"
								style="transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);"
							/>
						{/if}
					</mask>
				</defs>
				<rect width="100%" height="100%" fill="rgba(0,0,0,0.85)" mask="url(#tutorial-hole)" />
			</svg>

			{#if targetRect && currentStepDef.waitForTargetClick}
				<button
					class="absolute z-[210] cursor-pointer bg-transparent pointer-events-auto"
					style="left: {targetRect.left}px; top: {targetRect.top}px; width: {targetRect.width}px; height: {targetRect.height}px;"
					onclick={() => {
						const el = /** @type {HTMLElement} */ (document.querySelector(currentStepDef.selector));
						if (el) el.click();
						else if (/** @type {any} */ (currentStepDef).nextPage)
							handleNav(/** @type {any} */ (currentStepDef).nextPage);

						if (currentStepDef.waitToDisappear) {
							const checkInterval = setInterval(() => {
								if (!document.querySelector(currentStepDef.selector)) {
									clearInterval(checkInterval);
									setTimeout(() => nextStep(), 500);
								}
							}, 200);
						} else {
							setTimeout(() => nextStep(), 100);
						}
					}}
					aria-label="Target"
				></button>
			{/if}

			{#if targetRect || currentStepDef.selector === 'body'}
				<div
					bind:clientHeight={modalHeight}
					class="absolute z-[110] max-w-[280px] w-[90vw] bg-white rounded-3xl p-6 box-3d shadow-[0_0_40px_rgba(0,0,0,0.5)] pointer-events-auto"
					style="
						top: {modalTop};
						transform: {modalTransform};
						left: 0; right: 0; margin-left: auto; margin-right: auto;
						transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
					"
				>
					<h3 class="text-2xl font-display text-black mb-3 tracking-wide">
						{currentStepDef.title}
					</h3>
					<p class="text-gray-700 mb-6 leading-relaxed text-lg">{@html currentStepDef.desc}</p>

					<div class="flex items-center justify-between mt-2">
						{#if currentStepDef.isQuestion}
							<div class="flex flex-col gap-3 w-full">
								<button
									class="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 box-3d w-full"
									onclick={() => nextStep(true)}>Yes, I do</button
								>
								<button
									class="bg-gray-200 text-black px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 box-3d w-full"
									onclick={() => nextStep(false)}>No, I don't</button
								>
							</div>
						{:else if currentStepDef.showGotIt}
							<button
								class="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 box-3d w-full justify-center"
								onclick={() => nextStep()}>Got it</button
							>
						{:else if currentStepDef.showNext}
							<button
								class="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 box-3d w-full justify-center"
								onclick={() => nextStep()}>Next <ChevronRight class="w-5 h-5" /></button
							>
						{:else if currentStepDef.showFinish}
							<button
								class="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 box-3d w-full justify-center"
								onclick={finishTutorial}>Finish <Check class="w-5 h-5" /></button
							>
						{:else if !currentStepDef.waitForTargetClick}
							<button
								class="text-gray-500 font-medium hover:text-black transition-colors"
								onclick={() => nextStep()}>Skip</button
							>
							<button
								class="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 box-3d"
								onclick={() => nextStep()}>Next <ChevronRight class="w-5 h-5" /></button
							>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
{/if}
