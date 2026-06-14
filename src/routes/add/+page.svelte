<script>
	/**
	 * @fileoverview Add Transaction form page.
	 * Handles creating new transactions using a layout consistent with the transaction details modal.
	 */
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { appData } from '$lib/data.svelte.js';
	import { appState } from '$lib/state.svelte.js';
	import { CheckCircle2, ChevronDown } from 'lucide-svelte';
	import { iconMap } from '$lib/icons.js';
	import { slide, fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	// Form bindings
	let date = $state(new Date().toISOString().split('T')[0]);
	let amount = $state('');
	let title = $state('');
	let description = $state('');
	let category = $state('');
	let type = $state('debit');

	let loading = $state(false);
	let successMsg = $state(false);

	/** @type {any[]} Dynamic categories sourced from global app data */
	let categories = $state([]);
	let showError = $state(false);
	let errorMessage = $state('');

	/**
	 * @description Effect: Derives category dropdown list globally from appData.
	 */
	$effect(() => {
		if (!appData.loading) {
			categories = [
				...appData.budgets,
				...appData.corpusBudgets,
				...appData.fixedBudgets
			];
		}
	});

	/**
	 * @description Handles the transaction submission process to Supabase.
	 */
	async function handleSubmit() {
		if (!amount || !title || !category) {
			errorMessage = 'Please fill Amount, Title, and Category fields';
			showError = true;
			setTimeout(() => {
				showError = false;
			}, 3000);
			return;
		}

		if (loading) return;

		loading = true;
		const parsedAmount = Math.abs(Number(amount));
		const finalAmount = type === 'debit' ? -parsedAmount : parsedAmount;

		const targetCat = categories.find(c => c.category === category) ||
						  appData.budgets.find(b => b.category === category) ||
						  appData.corpusBudgets.find(b => b.category === category) ||
						  appData.fixedBudgets.find(b => b.category === category);

		const { error } = await supabase.from('transactions').insert([
			{
				transaction_date: date,
				amount: finalAmount,
				title: title,
				description: description || null,
				category_id: targetCat ? targetCat.category_id : null,
				transaction_type: type
			}
		]);

		if (!error) {
			successMsg = true;
			// Reset fields
			amount = '';
			title = '';
			description = '';
			category = '';

			// Reload global data across the app to reflect new transaction
			appData.loadData(appState.month, appState.year);

			setTimeout(() => {
				successMsg = false;
				goto('/list');
			}, 2000);
		} else {
			alert('Failed to save transaction: ' + error.message);
		}
		loading = false;
	}

	let isCategoryDropdownOpen = $state(false);
	let isTypeDropdownOpen = $state(false);

	let isDebit = $derived(type.toLowerCase() === 'debit');
</script>

<div in:fly={{ y: 15, duration: 300, delay: 200, easing: cubicOut }} out:fade={{ duration: 200 }} class="col-start-1 row-start-1 min-w-0 w-full px-4 pt-16 pb-32 relative min-h-full flex items-start justify-center">
	{#if showError}
		<div
			class="fixed top-6 left-6 right-6 z-[100] flex items-center justify-center animate-in slide-in-from-top-4 fade-in duration-300"
		>
			<div class="bg-[#1a1a1a] border-l-4 border-[#ff6b6b] text-[#ff6b6b] px-6 py-4 rounded-xl box-3d shadow-xl tracking-wide text-sm flex-1 text-center font-medium">
				{errorMessage}
			</div>
		</div>
	{/if}

	{#if successMsg}
		<div
			class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in zoom-in duration-300"
		>
			<CheckCircle2 class="w-16 h-16 text-white mb-4" />
			<h2 class="text-2xl font-light text-white tracking-widest uppercase">Success</h2>
			<p class="text-gray-400 text-sm mt-2">Transaction Added</p>
		</div>
	{/if}

	<!-- Card Container -->
	<div class="bg-[#151515] w-full max-w-md rounded-3xl p-6 md:p-8 box-3d flex flex-col gap-6 relative mt-4">
		<!-- Top Bar -->
		<div class="flex flex-col gap-1">
			<h1 class="text-xs font-semibold text-gray-500 uppercase tracking-wider pl-1">New Transaction</h1>
			<input type="text" bind:value={title} class="bg-transparent font-display text-3xl text-white tracking-wide leading-tight w-full focus:outline-none placeholder-gray-600 border-b border-transparent hover:border-gray-700 focus:border-white transition-colors pb-1" placeholder="Title" />
		</div>

		<hr class="border-gray-800/60" />

		<!-- Details -->
		<div class="flex flex-col gap-5 mt-2">
			<!-- Description -->
			<div class="flex flex-col gap-1.5 mt-1">
				<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Description</span>
				<textarea bind:value={description} class="bg-transparent text-gray-400 text-base leading-relaxed focus:outline-none w-full resize-none min-h-[48px] p-0 border-b border-transparent hover:border-gray-700 focus:border-white transition-colors" placeholder="Add a description (optional)..."></textarea>
			</div>

			<hr class="border-gray-800/60" />

			<!-- Date & Type -->
			<div class="flex gap-4">
				<div class="flex-1 flex flex-col gap-1.5 border-r border-gray-800/60 pr-4">
					<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Date</span>
					<input type="date" bind:value={date} class="bg-transparent text-gray-200 text-base focus:outline-none border-b border-transparent hover:border-gray-700 focus:border-white transition-colors cursor-pointer w-full pb-1" />
				</div>
				<div class="flex-1 flex flex-col gap-1.5 relative pl-2">
					<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Type</span>
					<button 
						class="text-left bg-transparent text-gray-200 text-base focus:outline-none border-b border-transparent hover:border-gray-700 focus:border-white transition-colors w-full flex justify-between items-center pb-1"
						onclick={() => isTypeDropdownOpen = !isTypeDropdownOpen}
					>
						<span class="capitalize">{type}</span>
						<ChevronDown class="w-4 h-4 opacity-50 shrink-0" />
					</button>
					{#if isTypeDropdownOpen}
						<div class="fixed inset-0 z-30" onclick={() => isTypeDropdownOpen = false} role="presentation"></div>
						<div class="absolute left-0 top-full mt-2 w-full bg-[#1a1a1a] rounded-xl box-3d z-40 p-2 flex flex-col gap-1" transition:slide={{ duration: 250 }}>
							{#each ['debit', 'credit'] as tOpt}
								<button 
									class="text-left px-4 py-2 text-base tracking-wide rounded-lg transition-colors {type === tOpt ? 'bg-white text-black box-3d' : 'text-gray-200 hover:bg-[#2a2a2a]'} capitalize"
									onclick={() => { type = tOpt; isTypeDropdownOpen = false; }}
								>
									{tOpt}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<hr class="border-gray-800/60" />

			<!-- Amount and Category Side-by-Side -->
			<div class="flex gap-4 items-end mt-1">
				<!-- Amount -->
				<div class="flex-1 flex flex-col gap-1.5 min-w-0 border-r border-gray-800/60 pr-4">
					<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Amount (₹)</span>
					<div class="flex flex-row flex-nowrap items-baseline text-4xl tracking-wide font-bold {isDebit ? 'text-[#ff6b6b]' : 'text-[#69db7c]'} border-b border-transparent hover:border-gray-700 focus-within:border-current transition-colors w-full pb-0.5">
						<span class="mr-1 shrink-0">{isDebit ? '-' : '+'}₹</span>
						<input type="number" bind:value={amount} class="bg-transparent focus:outline-none flex-1 min-w-0 p-0 m-0 [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none placeholder-gray-600" placeholder="0" />
					</div>
				</div>

				<!-- Category -->
				<div class="flex-1 flex flex-col gap-1.5 relative min-w-0 pl-2">
					<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Category</span>
					<button 
						class="flex items-center justify-between gap-3 bg-transparent w-full focus:outline-none border-b border-transparent hover:border-gray-700 focus:border-white transition-shadow text-left pb-1"
						onclick={() => isCategoryDropdownOpen = !isCategoryDropdownOpen}
					>
						<div class="flex items-center gap-3 overflow-hidden">
							{#if category && categories.find(c => c.category === category)?.icon_name && iconMap[categories.find(c => c.category === category)?.icon_name]}
								<picture>
									{#if iconMap[categories.find(c => c.category === category)?.icon_name].avif}
										<source srcset={iconMap[categories.find(c => c.category === category)?.icon_name].avif} type="image/avif" />
									{/if}
									<img src={iconMap[categories.find(c => c.category === category)?.icon_name].webp} alt="" class="h-5 w-5 object-contain shrink-0" />
								</picture>
							{/if}
							<span class="text-gray-100 font-medium truncate">{category || 'Select...'}</span>
						</div>
						<ChevronDown class="w-4 h-4 text-gray-500 shrink-0" />
					</button>
					
					{#if isCategoryDropdownOpen}
						<div class="fixed inset-0 z-30" onclick={() => isCategoryDropdownOpen = false} role="presentation"></div>
						<div class="absolute right-0 top-full mt-2 w-56 max-h-64 overflow-y-auto bg-[#1a1a1a] rounded-xl box-3d z-50 p-2 flex flex-col gap-1" transition:slide={{ duration: 250 }}>
							{#each categories as cat}
								<button 
									class="flex items-center gap-3 text-left px-4 py-3 text-base tracking-wide rounded-lg transition-colors {category === cat.category ? 'bg-white text-black box-3d' : 'text-gray-200 hover:bg-[#2a2a2a]'}"
									onclick={() => { category = cat.category; isCategoryDropdownOpen = false; }}
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

		<!-- Actions -->
		<div class="mt-2 border-t border-gray-800/60 pt-6">
			<button class="w-full py-4 rounded-xl bg-white hover:bg-gray-200 text-black font-bold text-lg box-3d tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100" onclick={handleSubmit} disabled={loading}>
				{#if loading}
					<div class="h-5 w-5 rounded-full border-2 border-black border-t-transparent animate-spin"></div>
					<span>Saving...</span>
				{:else}
					<span>Add Transaction</span>
				{/if}
			</button>
		</div>
	</div>

	<div class="h-32 shrink-0"></div>
</div>
