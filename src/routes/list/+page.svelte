<script>
	/**
	 * @fileoverview Transaction list and history view.
	 * Displays all transactions for a given month, grouped by date, and allows filtering by category.
	 */
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import { untrack } from 'svelte';
	import { appData } from '$lib/data.svelte.js';
	import TransactionCard from '$lib/components/TransactionCard.svelte';
	import TransactionDetailsModal from '$lib/components/editCards/TransactionDetailsModal.svelte';
	import { ChevronDown, Calendar, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { iconMap } from '$lib/icons.js';
	import { fade, slide, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';

	let loading = $state(true);
	let loadingMore = $state(false);
	
	let pageSize = 20;
	let pageIndex = $state(0);
	let hasMore = $state(true);

	// Local state for history filter
	let listMonth = $state(new Date().getMonth() + 1);
	let listYear = $state(new Date().getFullYear());
	let isDateDropdownOpen = $state(false);

	/**
	 * @param {HTMLElement} node
	 */
	function intersect(node) {
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting) {
				node.dispatchEvent(new CustomEvent('intersect'));
			}
		});
		observer.observe(node);
		return {
			destroy() {
				observer.disconnect();
			}
		};
	}
	
	/** @type {any[]} List of transactions for the selected month and filter */
	let transactions = $state([]);
	
	let selectedTransaction = $state(null);
	let isModalOpen = $state(false);
	
	/** @type {any[]} Filter options for dropdown derived from global app data */
	let categories = $state([]);

	/** @type {string} Currently selected category for filtering */
	let selectedCategory = $state($page.url.searchParams.get('category') || 'All');

	/**
	 * @description Derived array grouping transactions by their transaction_date.
	 */
	let groupedTransactions = $derived.by(() => {
		/** @type {{ date: string, items: any[] }[]} */
		let groups = [];
		/** @type {{ date: string, items: any[] } | null} */
		let currentGroup = null;
		for (const tx of transactions) {
			const txDate = tx.transaction_date.split('T')[0];
			if (!currentGroup || currentGroup.date !== txDate) {
				currentGroup = { date: txDate, items: [] };
				groups.push(currentGroup);
			}
			currentGroup.items.push(tx);
		}
		return groups;
	});

	$effect(() => {
		if (!appData.loading) {
			categories = [
				{ category: 'All' },
				...appData.budgets,
				...appData.corpusBudgets,
				...appData.fixedBudgets
			];
		}
	});

	/**
	 * @param {boolean} [isAppend=false]
	 */
	async function loadData(isAppend = false) {
		if (!isAppend) {
			loading = true;
			pageIndex = 0;
			hasMore = true;
			transactions = [];
		} else {
			loadingMore = true;
		}

		const startDate = `${listYear}-${String(listMonth).padStart(2, '0')}-01`;
		const lastDay = new Date(listYear, listMonth, 0).getDate();
		const endDate = `${listYear}-${String(listMonth).padStart(2, '0')}-${lastDay}T23:59:59`;

		let query = supabase
			.from('transactions')
			.select('*')
			.gte('transaction_date', startDate)
			.lte('transaction_date', endDate)
			.order('transaction_date', { ascending: false })
			.order('created_at', { ascending: false })
			.range(pageIndex * pageSize, (pageIndex + 1) * pageSize - 1);

		if (selectedCategory && selectedCategory !== 'All') {
			// Find category ID
			const catObj = categories.find(c => c.category === selectedCategory);
			if (catObj && catObj.category_id) {
				query = query.eq('category_id', catObj.category_id);
			}
		}

		const { data, error } = await query;
		const newTxs = data || [];

		if (newTxs.length < pageSize) {
			hasMore = false;
		}

		// Ensure categories are mapped
		newTxs.forEach(tx => {
			if (!tx.category) {
				const c = categories.find(c => c.category_id === tx.category_id);
				if (c) tx.category = c.category;
			}
		});

		if (isAppend) {
			transactions = [...transactions, ...newTxs];
		} else {
			transactions = newTxs;
		}

		if (!isAppend) loading = false;
		else loadingMore = false;
	}

	function loadMore() {
		if (loading || loadingMore || !hasMore) return;
		pageIndex++;
		loadData(true);
	}

	$effect(() => {
		const m = listMonth;
		const y = listYear;
		const cat = selectedCategory;
		
		untrack(() => {
			loadData();
		});
	});

	/** @param {any} id */
	async function handleDelete(id) {
		const { error } = await supabase.from('transactions').delete().eq('id', id);
		if (!error) {
			isModalOpen = false;
			selectedTransaction = null;
			loadData();
			appData.loadData();
		}
	}

	/** @param {any} data */
	async function handleSave(data) {
		const targetCat = appData.budgets.find(b => b.category === data.category) ||
						  appData.corpusBudgets.find(b => b.category === data.category) ||
						  appData.fixedBudgets.find(b => b.category === data.category);

		const updatePayload = {
			title: data.title,
			description: data.description,
			amount: data.amount,
			transaction_date: data.transaction_date,
			category_id: targetCat ? targetCat.category_id : null,
			transaction_type: data.transaction_type
		};
		const { error } = await supabase.from('transactions').update(updatePayload).eq('id', data.id);
		if (!error) {
			isModalOpen = false;
			selectedTransaction = null;
			loadData();
			appData.loadData();
		}
	}

	let isCategoryDropdownOpen = $state(false);
	
	function toggleCategoryDropdown() {
		isCategoryDropdownOpen = !isCategoryDropdownOpen;
	}
	
	/** @param {string} cat */
	function selectCategory(cat) {
		selectedCategory = cat;
		isCategoryDropdownOpen = false;
	}

	let selectedCategoryIcon = $derived(
		categories.find((c) => c.category === selectedCategory)?.icon_name
	);
</script>

<div in:fly={{ y: 15, duration: 300, delay: 200, easing: cubicOut }} out:fade={{ duration: 200 }} class="col-start-1 row-start-1 min-w-0 w-full px-4 pt-16 pb-36">
	<!-- Filter Header -->
	<div class="mb-8 flex items-center justify-between px-4">
		<h1 class="text-3xl tracking-wide text-white font-display">History</h1>

		<div class="flex items-center gap-2">
			<!-- Date Picker -->
			<div class="relative z-40">
				<button
					class="bg-[#111111] text-gray-300 text-sm tracking-wide py-3 px-4 rounded-xl focus:outline-none box-3d flex items-center gap-2"
					onclick={() => isDateDropdownOpen = !isDateDropdownOpen}
				>
					<Calendar class="w-4 h-4 text-gray-500" />
					{new Date(listYear, listMonth - 1).toLocaleString('default', { month: 'short' })} {listYear}
				</button>
				
				{#if isDateDropdownOpen}
					<div class="fixed inset-0 z-30" onclick={() => isDateDropdownOpen = false} role="presentation" transition:fade={{ duration: 150 }}></div>
					<div class="absolute right-0 mt-2 w-56 bg-[#1a1a1a] rounded-xl box-3d z-40 p-3" transition:slide={{ duration: 250, easing: cubicOut }}>
						<div class="flex items-center justify-between mb-3">
							<button onclick={() => listYear--} class="p-1 hover:bg-[#2a2a2a] rounded-lg"><ChevronLeft class="w-5 h-5 text-gray-400" /></button>
							<span class="text-white tracking-wide">{listYear}</span>
							<button onclick={() => listYear++} class="p-1 hover:bg-[#2a2a2a] rounded-lg"><ChevronRight class="w-5 h-5 text-gray-400" /></button>
						</div>
						<div class="grid grid-cols-3 gap-1">
							{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as m}
								<button 
									class="py-1.5 text-sm rounded-lg {listMonth === m ? 'bg-white text-black' : 'text-gray-400 hover:bg-[#2a2a2a]'}"
									onclick={() => { listMonth = m; isDateDropdownOpen = false; }}
								>
									{new Date(2000, m - 1).toLocaleString('default', { month: 'short' })}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Category Filter -->
			<div class="relative z-40">
				<button
					class="bg-[#111111] text-gray-300 text-sm tracking-wide py-3 pl-4 pr-4 rounded-xl focus:outline-none box-3d flex items-center gap-3"
					onclick={toggleCategoryDropdown}
				>
				<div class="flex items-center gap-2">
					{#if selectedCategoryIcon && iconMap[selectedCategoryIcon]}
						<picture>
							{#if iconMap[selectedCategoryIcon].avif}
								<source srcset={iconMap[selectedCategoryIcon].avif} type="image/avif" />
							{/if}
							<img src={iconMap[selectedCategoryIcon].webp} alt="" class="h-4 w-4 object-contain" />
						</picture>
					{/if}
					{selectedCategory}
				</div>
				<ChevronDown class="w-4 h-4 text-gray-500" />
			</button>
			
			{#if isCategoryDropdownOpen}
				<div class="fixed inset-0 z-30" onclick={() => isCategoryDropdownOpen = false} role="presentation" transition:fade={{ duration: 150 }}></div>
				
				<div class="absolute right-0 mt-2 w-48 max-h-64 overflow-y-auto bg-[#1a1a1a] rounded-xl box-3d z-40 p-2 flex flex-col gap-1" transition:slide={{ duration: 250, easing: cubicOut }}>
					{#each categories as cat}
						<button 
							class="flex items-center gap-3 text-left px-4 py-3 text-base tracking-wide rounded-lg transition-colors {selectedCategory === cat.category ? 'bg-white text-black box-3d' : 'text-gray-200 hover:bg-[#2a2a2a]'}"
							onclick={() => selectCategory(cat.category)}
						>
							{#if cat.icon_name && iconMap[cat.icon_name]}
								<picture>
									{#if iconMap[cat.icon_name].avif}
										<source srcset={iconMap[cat.icon_name].avif} type="image/avif" />
									{/if}
									<img src={iconMap[cat.icon_name].webp} alt="" class="h-5 w-5 object-contain" />
								</picture>
							{/if}
							<span>{cat.category}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
		</div>
	</div>

	<!-- List -->
	{#if loading}
		<div class="flex justify-center mt-12">
			<div
				class="h-6 w-6 rounded-full border-2 border-[#1a1a1a] border-t-gray-400 animate-spin"
			></div>
		</div>
	{:else if transactions.length === 0}
		<div class="text-center mt-12 bg-[#0a0a0a] rounded-3xl p-8 flex flex-col items-center box-3d">
			<span class="text-gray-500 tracking-wide text-base mb-4">No transactions found.</span>
			<button
				onclick={() => goto('/add')}
				class="px-5 py-3.5 bg-white text-black text-sm tracking-wide rounded-xl box-3d hover:bg-gray-200"
			>
				Add Transaction
			</button>
		</div>
	{:else}
		{#each groupedTransactions as group}
			<div class="mb-8">
				<h2 class="text-xl text-gray-400 tracking-wide px-2 mb-4 font-display">{group.date}</h2>
				<div class="bg-[#0a0a0a] rounded-[1.5rem] overflow-hidden box-3d">
					{#each group.items as tx, i (tx.id)}
						<div animate:flip={{ duration: 300 }} in:fly={{ y: 20, duration: 400, delay: i * 50, easing: cubicOut }} out:slide={{ duration: 250 }}>
							<TransactionCard
								title={tx.title}
								description={tx.description}
								amount={Number(tx.amount)}
								type={tx.transaction_type}
								iconName={categories.find(c => c.category === tx.category)?.icon_name}
								onclick={() => {
									selectedTransaction = tx;
									isModalOpen = true;
								}}
							/>
						</div>
					{/each}
				</div>
			</div>
		{/each}
		{#if hasMore && !loading}
			<div use:intersect onintersect={loadMore} class="h-10 flex items-center justify-center">
				{#if loadingMore}
					<div class="h-6 w-6 rounded-full border-2 border-transparent border-t-gray-500 animate-spin"></div>
				{/if}
			</div>
		{/if}
	{/if}

	<!-- Transaction Details Modal -->
	{#if isModalOpen && selectedTransaction}
		<TransactionDetailsModal
			transaction={selectedTransaction}
			categories={categories}
			onclose={() => isModalOpen = false}
			ondelete={handleDelete}
			onsave={handleSave}
		/>
	{/if}

	<div class="h-32 shrink-0"></div>
</div>
