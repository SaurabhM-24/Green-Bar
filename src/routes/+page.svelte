<script>
	/**
	 * @fileoverview Main Dashboard page.
	 * Displays high-level insights, variable expenses overview, fixed responsibilities, and overall balance.
	 */
	import { appData } from '$lib/data.svelte.js';
	import { Check, Plus, EyeOff } from 'lucide-svelte';
	import HealthRing from '$lib/components/HealthRing.svelte';
	import { iconMap } from '$lib/icons.js';
	import { fly, fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { supabase } from '$lib/supabase';
	import AddCategoryModal from '$lib/components/editCards/AddCategoryModal.svelte';
	import TutorialOverlay from '$lib/components/TutorialOverlay.svelte';
	import { appState } from '$lib/state.svelte.js';
	import Footer from '$lib/components/Footer.svelte';

	/** @type {boolean} Application loading state */
	let loading = $derived(appData.loading);

	/** @type {any[]} List of active variable budgets */
	let budgets = $derived(appData.budgets);

	/** @type {any[]} List of fixed budgets */
	let fixedBudgets = $derived(appData.fixedBudgets);

	/** @type {Record<string, number>} Aggregated spending totals per category */
	let categoryTotals = $derived(appData.categoryTotals);

	/** @type {Set<string>} Set of categories containing transactions this month */
	let transactionCategories = $derived(appData.transactionCategories);

	/** @type {number} Global liquid balance calculated from all-time history */
	let globalLiquidBalance = $derived(appData.globalLiquidBalance);

	/** @type {number} Corpus used in the current period */
	let currentPeriodCorpusUsed = $derived(appData.currentPeriodCorpusUsed);

	/** @type {number} Total aggregate account balance */
	let totalAccountBalance = $derived(appData.totalAccountBalance);

	/** @type {number} Reserved monthly corpus limit */
	let corpusLimit = $derived(appData.corpusLimit);

	/** @type {number} The available operational balance (Total Balance - Corpus Limit) */
	let accountBalance = $derived(totalAccountBalance - corpusLimit);

	/** @type {number} The remaining personal corpus cache */
	let personalCorpus = $derived(globalLiquidBalance + currentPeriodCorpusUsed);

	/** @type {string} Formatted user name for the greeting */
	let userName = $derived(appData.userName);

	/** @type {string} Contextual dynamic insight string */
	let insightLine = $derived(appData.insightLine);

	let isAddVariableModalOpen = $state(false);
	let isAddFixedModalOpen = $state(false);
	let showHideVariableModal = $state(false);
	let showHideFixedModal = $state(false);
	let hideVariableCard = $state(false);
	let hideFixedCard = $state(false);
	let showTutorial = $state(false);

	$effect(() => {
		async function checkTutorial() {
			if (typeof localStorage !== 'undefined') {
				if (localStorage.getItem('tutorial_shown') === 'true') return;
			}
			const {
				data: { session }
			} = await supabase.auth.getSession();
			if (!session) return;

			const { data, error } = await supabase
				.from('profiles')
				.select('onboarding_completed')
				.eq('id', session.user.id)
				.single();

			if (!error && data?.onboarding_completed) {
				showTutorial = true;
			}
		}
		checkTutorial();
	});

	$effect(() => {
		if (typeof localStorage !== 'undefined') {
			hideVariableCard = localStorage.getItem('hideVariableCard') === 'true';
			hideFixedCard = localStorage.getItem('hideFixedCard') === 'true';
		}
	});

	$effect(() => {
		// Automatically unhide if N > 0
		if (budgets.length > 0 && hideVariableCard) {
			hideVariableCard = false;
			if (typeof localStorage !== 'undefined') localStorage.setItem('hideVariableCard', 'false');
		}
		if (fixedBudgets.length > 0 && hideFixedCard) {
			hideFixedCard = false;
			if (typeof localStorage !== 'undefined') localStorage.setItem('hideFixedCard', 'false');
		}
	});

	function confirmHideVariable() {
		hideVariableCard = true;
		if (typeof localStorage !== 'undefined') localStorage.setItem('hideVariableCard', 'true');
		showHideVariableModal = false;
	}

	function confirmHideFixed() {
		hideFixedCard = true;
		if (typeof localStorage !== 'undefined') localStorage.setItem('hideFixedCard', 'true');
		showHideFixedModal = false;
	}

	/** @param {any} data */
	async function handleAddVariableSave(data) {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		const user_id = session?.user?.id;
		const maxSortOrder =
			budgets.length > 0 ? Math.max(...budgets.map((b) => Number(b.sort_order || 0))) : -1;
		const { error } = await supabase.from('budgets').insert([
			{
				category_id: crypto.randomUUID(),
				category: data.category,
				description: data.description || null,
				limit_amount: data.limit_amount ? Number(data.limit_amount) : 0,
				icon_name: data.icon_name || null,
				budget_type: 'variable',
				period_type: data.period_type || 'monthly',
				reset_date: data.reset_date ? Number(data.reset_date) : 1,
				user_id: user_id,
				sort_order: maxSortOrder + 1
			}
		]);
		if (!error) {
			isAddVariableModalOpen = false;
			appData.loadData();
		} else alert('Failed to create category: ' + error.message);
	}

	/** @param {any} data */
	async function handleAddFixedSave(data) {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		const user_id = session?.user?.id;
		const maxSortOrder =
			fixedBudgets.length > 0
				? Math.max(...fixedBudgets.map((b) => Number(b.sort_order || 0)))
				: -1;
		const { error } = await supabase.from('budgets').insert([
			{
				category_id: crypto.randomUUID(),
				category: data.category,
				description: data.description || null,
				limit_amount: data.limit_amount ? Number(data.limit_amount) : 0,
				icon_name: data.icon_name || null,
				budget_type: 'fixed',
				period_type: data.period_type || 'monthly',
				reset_date: data.reset_date ? Number(data.reset_date) : 1,
				user_id: user_id,
				sort_order: maxSortOrder + 1
			}
		]);
		if (!error) {
			isAddFixedModalOpen = false;
			appData.loadData();
		} else alert('Failed to create category: ' + error.message);
	}

	/**
	 * @param {number} totalData
	 * @param {number} usedData
	 */
	function getProgressColor(totalData, usedData) {
		const progress = totalData > 0 ? Math.max(((totalData - usedData) / totalData) * 100, 0) : 0;
		if (progress > 75) return 'bg-green-500';
		if (progress > 50) return 'bg-white';
		if (progress > 25) return 'bg-yellow-400';
		return 'bg-red-500';
	}

	/**
	 * @param {number} totalData
	 * @param {number} usedData
	 */
	function getProgressWidth(totalData, usedData) {
		const progress = totalData > 0 ? Math.max(((totalData - usedData) / totalData) * 100, 0) : 0;
		return progress + '%';
	}

	/**
	 * Calculates the optimal grid columns based on item count.
	 * @param {number} n - The total number of items
	 * @returns {3 | 4 | null} - The number of columns, or null if grid should not be applied
	 */
	function calculateGridCols(n) {
		if (n < 3) return null;
		if (n % 12 === 0) return 4;
		if (n % 3 === 0) return 3;
		if (n % 4 === 0) return 4;

		const r3 = n % 3;
		const r4 = n % 4;

		return r3 > r4 ? 3 : 4;
	}

	/**
	 * Maps the column count to explicit Tailwind grid classes to prevent purging.
	 * @param {3 | 4 | null} cols
	 * @returns {string}
	 */
	function getGridContainerClass(cols) {
		if (cols === 3) return 'grid grid-cols-3 place-items-center w-full';
		if (cols === 4) return 'grid grid-cols-4 place-items-center w-full';
		// Fallback for base case (N < 3) - retains original flex layout
		return 'flex flex-wrap justify-start';
	}

	/** @type {string} Dynamically calculated class string for Variable Expenses */
	let variableGridClass = $derived(getGridContainerClass(calculateGridCols(budgets.length)));

	/** @type {string} Dynamically calculated class string for Fixed Expenses */
	let fixedGridClass = $derived(getGridContainerClass(calculateGridCols(fixedBudgets.length)));
</script>

<div
	in:fly={{ y: 15, duration: 300, delay: 200, easing: cubicOut }}
	out:fade={{ duration: 200 }}
	class="col-start-1 row-start-1 min-w-0 w-full px-4 pt-16 relative min-h-full flex flex-col gap-6"
>
	<!-- Greeting -->
	<div class="px-2 pt-8 pb-8 mb-2">
		<h1 class="text-4xl text-white tracking-wide mb-2 font-display">Hello<br />{userName}</h1>
		<p class="text-gray-400 text-xl tracking-wide">{insightLine}</p>
	</div>

	{#if loading}
		<div class="flex justify-center mt-12 flex-1">
			<div
				class="h-6 w-6 rounded-full border-2 border-[#1a1a1a] border-t-gray-400 animate-spin"
			></div>
		</div>
	{:else}
		<!-- Variable Expenses Card -->
		{#if !hideVariableCard}
			<a
				href="/variable"
				class="block bg-[#0f0f0f] rounded-3xl p-6 box-3d active:scale-[0.98] transition-transform"
				in:fly={{ y: 20, duration: 400, delay: 0 }}
			>
				<h2 class="text-xl text-white tracking-wide mb-6 font-display">Variable Expenses</h2>

				{#if budgets.length === 0}
					<div class="flex gap-4">
						<button
							class="flex-1 py-3 bg-[#1a1a1a] rounded-xl flex items-center justify-center gap-2 hover:bg-[#2a2a2a] transition-colors"
							onclick={(e) => {
								e.preventDefault();
								isAddVariableModalOpen = true;
							}}
						>
							<Plus class="w-5 h-5 text-gray-400" />
							<span class="text-sm text-gray-300">Add</span>
						</button>
						<button
							class="flex-1 py-3 bg-[#1a1a1a] rounded-xl flex items-center justify-center gap-2 hover:bg-[#2a2a2a] transition-colors"
							onclick={(e) => {
								e.preventDefault();
								showHideVariableModal = true;
							}}
						>
							<EyeOff class="w-5 h-5 text-gray-400" />
							<span class="text-sm text-gray-300">Hide Card</span>
						</button>
					</div>
				{:else if budgets.length < 3}
					<div class="flex flex-col gap-6">
						{#each budgets as b, index}
							<div
								class="flex items-center gap-4"
								in:fly={{ y: 20, duration: 400, delay: index * 100 + 100 }}
							>
								<div
									class="shrink-0 w-12 h-12 bg-[#1a1a1a] rounded-2xl flex items-center justify-center"
								>
									{#if b.icon_name && iconMap[b.icon_name]}
										<picture class="flex items-center justify-center w-full h-full p-2.5">
											{#if iconMap[b.icon_name].avif}
												<source srcset={iconMap[b.icon_name].avif} type="image/avif" />
											{/if}
											<img
												src={iconMap[b.icon_name].webp}
												alt="{b.category} icon"
												class="w-full h-full object-contain"
											/>
										</picture>
									{:else}
										<div class="w-full h-full p-2.5 bg-[#0f0f0f] rounded-xl"></div>
									{/if}
								</div>
								<div class="flex-1 flex flex-col gap-2 min-w-0">
									<span class="text-sm text-white tracking-wide truncate">{b.category}</span>
									<div class="h-[6px] w-full bg-[#1a1a1a] rounded-full overflow-hidden">
										<div
											class="h-full rounded-full transition-all duration-1000 {getProgressColor(
												Number(b.limit_amount || 0),
												categoryTotals[b.category] || 0
											)}"
											style="width: {getProgressWidth(
												Number(b.limit_amount || 0),
												categoryTotals[b.category] || 0
											)}"
										></div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div class="gap-x-2 gap-y-6 {variableGridClass}">
						{#each budgets as b, index}
							<div
								class="w-full min-w-0 flex justify-center"
								in:fly={{ y: 20, duration: 400, delay: index * 100 + 100 }}
							>
								<HealthRing
									category={b.category}
									totalData={Number(b.limit_amount || 0)}
									usedData={categoryTotals[b.category] || 0}
									iconName={b.icon_name}
								/>
							</div>
						{/each}
					</div>
				{/if}
			</a>
		{/if}

		<!-- Fixed Expenses Card -->
		{#if !hideFixedCard}
			<a
				href="/fixed"
				class="block bg-[#0f0f0f] rounded-3xl p-6 box-3d active:scale-[0.98] transition-transform"
				in:fly={{ y: 20, duration: 400, delay: 100 }}
			>
				<h2 class="text-xl text-white tracking-wide mb-6 font-display">Fixed Expenses</h2>

				{#if fixedBudgets.length === 0}
					<div class="flex gap-4">
						<button
							class="flex-1 py-3 bg-[#1a1a1a] rounded-xl flex items-center justify-center gap-2 hover:bg-[#2a2a2a] transition-colors"
							onclick={(e) => {
								e.preventDefault();
								isAddFixedModalOpen = true;
							}}
						>
							<Plus class="w-5 h-5 text-gray-400" />
							<span class="text-sm text-gray-300">Add</span>
						</button>
						<button
							class="flex-1 py-3 bg-[#1a1a1a] rounded-xl flex items-center justify-center gap-2 hover:bg-[#2a2a2a] transition-colors"
							onclick={(e) => {
								e.preventDefault();
								showHideFixedModal = true;
							}}
						>
							<EyeOff class="w-5 h-5 text-gray-400" />
							<span class="text-sm text-gray-300">Hide Card</span>
						</button>
					</div>
				{:else if fixedBudgets.length < 3}
					<div class="flex flex-col gap-4">
						{#each fixedBudgets as b, index}
							<div
								class="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-2xl"
								in:fly={{ y: 20, duration: 400, delay: index * 100 + 100 }}
							>
								<div class="flex items-center gap-3 min-w-0">
									<div class="shrink-0 w-8 h-8 flex items-center justify-center">
										{#if b.icon_name && iconMap[b.icon_name]}
											<picture class="w-full h-full flex items-center justify-center">
												{#if iconMap[b.icon_name].avif}
													<source srcset={iconMap[b.icon_name].avif} type="image/avif" />
												{/if}
												<img
													src={iconMap[b.icon_name].webp}
													alt="{b.category} icon"
													class="w-[80%] h-[80%] object-contain"
												/>
											</picture>
										{/if}
									</div>
									<span class="text-sm text-gray-300 tracking-wide truncate">{b.category}</span>
								</div>
								{#if transactionCategories.has(b.category)}
									<div class="shrink-0 bg-green-500 rounded-full p-1 border border-[#0f0f0f] ml-2">
										<Check class="w-3 h-3 text-black" strokeWidth={4} />
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<div class="gap-x-2 gap-y-6 {fixedGridClass}">
						{#each fixedBudgets as b, index}
							<div
								class="flex flex-col items-center w-full max-w-[4.5rem] min-w-0"
								in:fly={{ y: 20, duration: 400, delay: index * 100 + 200 }}
							>
								<div
									class="relative w-full max-w-14 aspect-square bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-2"
								>
									{#if b.icon_name && iconMap[b.icon_name]}
										<picture class="flex items-center justify-center w-full h-full">
											{#if iconMap[b.icon_name].avif}
												<source srcset={iconMap[b.icon_name].avif} type="image/avif" />
											{/if}
											<img
												src={iconMap[b.icon_name].webp}
												alt="{b.category} icon"
												class="h-[50%] w-[50%] object-contain"
											/>
										</picture>
									{/if}

									{#if transactionCategories.has(b.category)}
										<div
											class="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-[#0f0f0f] z-10"
										>
											<Check class="w-3 h-3 text-black" strokeWidth={4} />
										</div>
									{/if}
								</div>
								<span
									class="text-xs text-gray-400 tracking-wide truncate w-full block text-center px-1"
									>{b.category}</span
								>
							</div>
						{/each}
					</div>
				{/if}
			</a>
		{/if}

		<!-- Balance Card -->
		<a
			href="/fixed"
			class="block bg-[#0f0f0f] rounded-3xl p-6 box-3d active:scale-[0.98] transition-transform mt-2"
			in:fly={{ y: 20, duration: 400, delay: 200 }}
		>
			<h2 class="text-xl text-white tracking-wide mb-6 font-display">Account Status</h2>
			<div>
				<div class="flex justify-between items-center">
					<h3 class="text-lg text-gray-400 tracking-wide">Personal Corpus:</h3>
					<span class="text-xl text-white tracking-wide">
						₹{personalCorpus.toLocaleString('en-IN')}
					</span>
				</div>

				<div class="flex justify-between items-center">
					<h3 class="text-lg text-gray-400 tracking-wide">Total Account Balance:</h3>
					<span class="text-xl text-white tracking-wide">
						₹{accountBalance.toLocaleString('en-IN')}
					</span>
				</div>
			</div>
		</a>
	{/if}

	{#if isAddVariableModalOpen}
		<AddCategoryModal
			onclose={() => (isAddVariableModalOpen = false)}
			onsave={handleAddVariableSave}
		/>
	{/if}
	{#if isAddFixedModalOpen}
		<AddCategoryModal onclose={() => (isAddFixedModalOpen = false)} onsave={handleAddFixedSave} />
	{/if}

	{#if showHideVariableModal}
		<div
			transition:fade={{ duration: 200 }}
			class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] overflow-y-auto"
		>
			<div class="min-h-full flex items-center justify-center p-4">
				<div
					transition:scale={{ start: 0.95, duration: 250, easing: cubicOut }}
					class="bg-[#151515] w-full max-w-md rounded-3xl p-6 md:p-8 box-3d flex flex-col gap-6 relative"
				>
					<h2 class="text-2xl font-display text-white tracking-wide">Hide Variable Expenses</h2>
					<p class="text-gray-400 text-base leading-relaxed">
						This card will be hidden and can be brought back by adding a category from the
						respective page.
					</p>
					<div class="flex gap-4 mt-2">
						<button
							class="flex-1 py-3.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-white font-medium box-3d tracking-wide transition-all active:translate-y-1"
							onclick={() => (showHideVariableModal = false)}>Cancel</button
						>
						<button
							class="flex-1 py-3.5 rounded-xl bg-[#ff6b6b] hover:bg-[#ff8787] text-black font-bold box-3d tracking-wide transition-all active:translate-y-1"
							onclick={confirmHideVariable}>Hide</button
						>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if showHideFixedModal}
		<div
			transition:fade={{ duration: 200 }}
			class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] overflow-y-auto"
		>
			<div class="min-h-full flex items-center justify-center p-4">
				<div
					transition:scale={{ start: 0.95, duration: 250, easing: cubicOut }}
					class="bg-[#151515] w-full max-w-md rounded-3xl p-6 md:p-8 box-3d flex flex-col gap-6 relative"
				>
					<h2 class="text-2xl font-display text-white tracking-wide">Hide Fixed Expenses</h2>
					<p class="text-gray-400 text-base leading-relaxed">
						This card will be hidden and can be brought back by adding a category from the
						respective page.
					</p>
					<div class="flex gap-4 mt-2">
						<button
							class="flex-1 py-3.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-white font-medium box-3d tracking-wide transition-all active:translate-y-1"
							onclick={() => (showHideFixedModal = false)}>Cancel</button
						>
						<button
							class="flex-1 py-3.5 rounded-xl bg-[#ff6b6b] hover:bg-[#ff8787] text-black font-bold box-3d tracking-wide transition-all active:translate-y-1"
							onclick={confirmHideFixed}>Hide</button
						>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if showTutorial}
		<TutorialOverlay
			onComplete={() => {
				showTutorial = false;
				if (typeof localStorage !== 'undefined') {
					localStorage.setItem('tutorial_shown', 'true');
				}
			}}
		/>
	{/if}

	<Footer />
</div>
