<script>
	import { supabase } from '$lib/supabase';
	import { appState } from '$lib/state.svelte.js';
	import CorpusCard from '$lib/components/CorpusCard.svelte';
	import FixedItem from '$lib/components/FixedItem.svelte';
	import { dndzone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import { MoreVertical } from 'lucide-svelte';

	let loading = $state(true);
	/** @type {any[]} */
	let corpusBudgets = $state([]);
	/** @type {any[]} */
	let fixedBudgets = $state([]);
	let transactionCategories = $state(new Set());

	let globalLiquidBalance = $state(0);
	let currentMonthCorpusUsed = $state(0);

	let isEditingOrder = $state(false);
	let isMenuOpen = $state(false);
	let savingOrder = $state(false);
	const flipDurationMs = 200;

	$effect(() => {
		/**
		 * @param {number} m
		 * @param {number} y
		 */
		async function loadData(m, y) {
			loading = true;
			const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
			const lastDay = new Date(y, m, 0).getDate();
			const endDate = `${y}-${String(m).padStart(2, '0')}-${lastDay}T23:59:59`;

			// Previous month bounds for Salary
			const pmList = new Date(y, m - 2, 1);
			const prevM = pmList.getMonth() + 1;
			const prevY = pmList.getFullYear();
			const prevMonthStart = `${prevY}-${String(prevM).padStart(2, '0')}-01`;

			// 1. Fetch Budgets
			const { data: budgetData } = await supabase
				.from('budgets')
				.select('*')
				.order('sort_order', { ascending: true });

			let totalMonthlyLimits = 0;
			if (budgetData) {
				corpusBudgets = budgetData.filter((b) => b.budget_type === 'corpus');
				fixedBudgets = budgetData
					.filter((b) => b.budget_type === 'fixed')
					.map((b) => ({ ...b, id: b.id || b.category }));
				budgetData.forEach((b) => {
					totalMonthlyLimits += Number(b.monthly_limit || 0);
				});
			}

			// 2. Fetch Transactions for the checklist
			// We fetch from previousMonthStart to cover 'Salary'
			const { data: txData } = await supabase
				.from('transactions')
				.select('category, transaction_date')
				.gte('transaction_date', prevMonthStart)
				.lte('transaction_date', endDate);

			const cats = new Set();
			if (txData) {
				txData.forEach((tx) => {
					if (tx.category) {
						if (tx.category === 'Salary') {
							if (tx.transaction_date >= prevMonthStart && tx.transaction_date < startDate) {
								cats.add(tx.category);
							}
						} else {
							if (tx.transaction_date >= startDate) {
								cats.add(tx.category);
							}
						}
					}
				});
			}
			transactionCategories = cats;

			// 3. Global All Time Sum query for Personal Corpus
			const { data: allHistory } = await supabase
				.from('transactions')
				.select('amount, transaction_type, transaction_date, category');

			let liquidTillLastMonth = 0;
			let monthCorpusSum = 0;
			if (allHistory) {
				allHistory.forEach((tx) => {
					const val = Math.abs(Number(tx.amount));

					if (tx.transaction_date < startDate) {
						if (tx.transaction_type.toLowerCase() === 'credit') liquidTillLastMonth += val;
						else liquidTillLastMonth -= val;
					}

					if (
						tx.transaction_date >= startDate &&
						tx.transaction_date <= endDate &&
						tx.category &&
						tx.category.toLowerCase() === 'personal corpus'
					) {
						if (tx.transaction_type.toLowerCase() === 'credit') monthCorpusSum += val;
						else monthCorpusSum -= val;
					}
				});
			}
			globalLiquidBalance = liquidTillLastMonth - totalMonthlyLimits;
			// Pass raw negative state downstream. UI will invert it to represent 'used' spent tally.
			currentMonthCorpusUsed = monthCorpusSum;

			loading = false;
		}

		loadData(appState.month, appState.year);
	});

	/** @param {CustomEvent<any>} e */
	function handleDndConsider(e) {
		fixedBudgets = e.detail.items;
	}

	/** @param {CustomEvent<any>} e */
	function handleDndFinalize(e) {
		fixedBudgets = e.detail.items;
	}

	async function saveOrder() {
		savingOrder = true;
		try {
			const updates = fixedBudgets.map((b, index) => {
				return supabase.from('budgets').update({ sort_order: index }).eq('category', b.category);
			});
			await Promise.all(updates);
		} catch (error) {
			console.error('Failed to save order:', error);
		}
		savingOrder = false;
		isEditingOrder = false;
	}

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function startEditing() {
		isEditingOrder = true;
		isMenuOpen = false;
	}

	function cancelEditing() {
		isEditingOrder = false;
	}
</script>

<div
	class="px-4 pt-16 pb-16"
	role="presentation"
	onclick={() => {
		if (isMenuOpen) isMenuOpen = false;
	}}
	onkeydown={(e) => {
		if (e.key === 'Escape' && isMenuOpen) isMenuOpen = false;
	}}
>
	{#if loading}
		<div class="flex justify-center mt-12">
			<div
				class="h-6 w-6 rounded-full border-2 border-[#1a1a1a] border-t-gray-400 animate-spin"
			></div>
		</div>
	{:else}
		{#if corpusBudgets.length > 0}
			<h1 class="text-3xl tracking-wide text-white mb-8 px-4">Corpus Funds</h1>
			<div class="mb-8">
				{#each corpusBudgets as b}
					<CorpusCard
						title={b.category}
						lockedData={Number(b.monthly_limit || 0)}
						leftData={globalLiquidBalance + currentMonthCorpusUsed}
						usedData={-currentMonthCorpusUsed}
						iconName={b.icon_name}
					/>
				{/each}
			</div>
		{/if}

		<div class="flex items-center justify-between mb-6 px-4 mt-8">
			<h1 class="text-3xl tracking-wide text-white">Fixed Responsibilities</h1>

			{#if !isEditingOrder}
				<div class="relative">
					<button
						class="p-2 text-gray-400 hover:text-white"
						onclick={(e) => {
							e.stopPropagation();
							toggleMenu();
						}}
					>
						<MoreVertical class="w-5 h-5" />
					</button>
					{#if isMenuOpen}
						<div
							class="absolute right-0 mt-2 w-40 bg-[#1a1a1a] rounded-xl box-3d z-50 overflow-hidden"
						>
							<button
								class="w-full text-left px-4 py-3 text-base tracking-wide text-gray-200 hover:bg-[#2a2a2a] transition-colors"
								onclick={startEditing}
							>
								Edit Order
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<div class="flex items-center space-x-2">
					<button
						class="text-sm text-gray-400 tracking-wide px-3 py-1.5 rounded-lg border border-gray-800 hover:bg-[#1a1a1a]"
						onclick={cancelEditing}
						disabled={savingOrder}
					>
						Cancel
					</button>
					<button
						class="text-sm text-black tracking-wide px-4 py-1.5 rounded-lg bg-white box-3d hover:bg-gray-200 disabled:opacity-50"
						onclick={saveOrder}
						disabled={savingOrder}
					>
						{savingOrder ? 'Saving...' : 'Done'}
					</button>
				</div>
			{/if}
		</div>

		<div class="bg-[#0f0f0f] rounded-3xl p-6 box-3d">
			{#if fixedBudgets.length === 0}
				<div class="text-center py-4 text-gray-500 tracking-wide text-base">
					No fixed budgets found.
				</div>
			{/if}
			<div
				use:dndzone={{
					items: fixedBudgets,
					dragDisabled: !isEditingOrder,
					dropTargetStyle: {},
					dropTargetClasses: ['outline-none']
				}}
				onconsider={handleDndConsider}
				onfinalize={handleDndFinalize}
			>
				{#each fixedBudgets as b, index (b.id)}
					<div
						animate:flip={{ duration: flipDurationMs }}
						class={isEditingOrder
							? 'cursor-grab active:cursor-grabbing opacity-80 scale-[0.98] transition-transform'
							: 'transition-transform duration-300'}
					>
						<div class={isEditingOrder ? 'pointer-events-none' : ''}>
							<FixedItem
								title={b.category}
								isChecked={transactionCategories.has(b.category)}
								isLast={index === fixedBudgets.length - 1}
								iconName={b.icon_name}
							/>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
