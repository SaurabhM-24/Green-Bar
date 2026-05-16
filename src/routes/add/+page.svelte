<script>
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import {
		Calendar as CalendarIcon,
		IndianRupee,
		FileText,
		Tags,
		SortDesc,
		CheckCircle2,
		ChevronRight,
		ChevronDown
	} from 'lucide-svelte';

	// Form bindings
	let date = $state(new Date().toISOString().split('T')[0]);
	let amount = $state('');
	let details = $state('');
	let category = $state('');
	let type = $state('debit');

	let slideValue = $state(0);
	let loading = $state(false);
	let successMsg = $state(false);

	// Dynamic categories fetched from DB
	/** @type {any[]} */
	let categories = $state([]);
	let showError = $state(false);
	let errorMessage = $state('');

	$effect(() => {
		async function fetchCategories() {
			const { data } = await supabase.from('budgets').select('category, icon_name, budget_type, sort_order');
			if (data) {
				/** @type {Record<string, number>} */
				const typeOrder = { variable: 1, corpus: 2, fixed: 3 };
				data.sort((a, b) => {
					const orderA = typeOrder[a.budget_type] || 99;
					const orderB = typeOrder[b.budget_type] || 99;
					if (orderA !== orderB) return orderA - orderB;
					return (a.sort_order || 0) - (b.sort_order || 0);
				});
				categories = data;
			}
		}
		fetchCategories();
	});

	async function handleSubmit() {
		if (slideValue < 100 || loading) return;

		loading = true;
		const parsedAmount = Math.abs(Number(amount));
		const finalAmount = type === 'debit' ? -parsedAmount : parsedAmount;

		const { error } = await supabase.from('transactions').insert([
			{
				transaction_date: date,
				amount: finalAmount,
				details: details,
				category: category,
				transaction_type: type
			}
		]);

		if (!error) {
			successMsg = true;
			// Reset fields
			amount = '';
			details = '';
			category = '';
			slideValue = 0;

			setTimeout(() => {
				successMsg = false;
				goto('/');
			}, 2000);
		} else {
			alert('Failed to save transaction: ' + error.message);
			slideValue = 0;
		}
		loading = false;
	}

	function handleSlideInput() {
		if (slideValue == 100) {
			if (!amount || !details || !category) {
				slideValue = 0;
				errorMessage = 'Please fill Amount, Details, and Category fields';
				showError = true;
				setTimeout(() => {
					showError = false;
				}, 3000);
			} else if (!loading) {
				handleSubmit();
			}
		}
	}

	function handleSlideEnd() {
		if (slideValue < 100) slideValue = 0;
	}

	let isCategoryDropdownOpen = $state(false);
	function toggleCategoryDropdown() {
		isCategoryDropdownOpen = !isCategoryDropdownOpen;
	}
	/** @param {any} cat */
	function selectCategory(cat) {
		category = cat.category;
		isCategoryDropdownOpen = false;
	}

	let selectedCategoryIcon = $derived(
		categories.find((c) => c.category === category)?.icon_name
	);

	let isTypeDropdownOpen = $state(false);
	function toggleTypeDropdown() {
		isTypeDropdownOpen = !isTypeDropdownOpen;
	}
	/** @param {string} t */
	function selectType(t) {
		type = t;
		isTypeDropdownOpen = false;
	}
</script>

<div class="px-6 pt-16 pb-32 relative min-h-full">
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
			class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md rounded-3xl animate-in fade-in zoom-in duration-300"
		>
			<CheckCircle2 class="w-16 h-16 text-white mb-4" />
			<h2 class="text-2xl font-light text-white tracking-widest uppercase">Success</h2>
			<p class="text-gray-400 text-sm mt-2">Transaction Added</p>
		</div>
	{/if}

	<h1 class="text-3xl tracking-wide text-white mb-10 px-2">New Transaction</h1>

	<div class="space-y-7">
		<!-- Date -->
		<div>
			<label for="date" class="block text-xs uppercase tracking-wider text-gray-500 mb-1.5 pl-1"
				>Date</label
			>
			<div class="relative">
				<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
					<CalendarIcon class="h-4 w-4 text-gray-600" />
				</div>
				<input
					id="date"
					type="date"
					bind:value={date}
					class="w-full bg-[#111111] rounded-3xl pl-11 pr-4 py-5 text-base tracking-wide text-gray-200 focus:outline-none focus:border-gray-600 box-3d"
				/>
			</div>
		</div>

		<!-- Amount -->
		<div>
			<label for="amount" class="block text-xs uppercase tracking-wider text-gray-500 mb-1.5 pl-1"
				>Amount</label
			>
			<div class="relative">
				<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
					<IndianRupee class="h-4 w-4 text-gray-600" />
				</div>
				<input
					id="amount"
					type="number"
					bind:value={amount}
					placeholder="0.00"
					step="0.01"
					class="w-full bg-[#111111] rounded-3xl pl-11 pr-4 py-5 text-lg tracking-wide text-white placeholder-gray-700 focus:outline-none box-3d"
				/>
			</div>
		</div>

		<!-- Details -->
		<div>
			<label for="details" class="block text-xs uppercase tracking-wider text-gray-500 mb-1.5 pl-1"
				>Details</label
			>
			<div class="relative">
				<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
					<FileText class="h-4 w-4 text-gray-600" />
				</div>
				<input
					id="details"
					type="text"
					bind:value={details}
					placeholder="What was this for?"
					class="w-full bg-[#111111] rounded-3xl pl-11 pr-4 py-5 text-base tracking-wide text-gray-200 placeholder-gray-700 focus:outline-none box-3d"
				/>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<!-- Category -->
			<div class="relative z-50">
				<label
					for="category"
					class="block text-xs uppercase tracking-wider text-gray-500 mb-1.5 pl-1">Category</label
				>
				<div class="relative">
					<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
						<Tags class="h-4 w-4 text-gray-600" />
					</div>
					<button
						id="category"
						class="w-full bg-[#111111] rounded-3xl pl-11 pr-4 py-5 text-sm tracking-wide {category
							? 'text-gray-200'
							: 'text-gray-500'} focus:outline-none box-3d flex items-center justify-between"
						onclick={toggleCategoryDropdown}
					>
						<div class="flex items-center gap-3 truncate">
							{#if selectedCategoryIcon}
								<picture>
									<source srcset="/icons/{selectedCategoryIcon}.avif" type="image/avif" />
									<img src="/icons/{selectedCategoryIcon}.webp" alt="" class="h-5 w-5 object-contain" />
								</picture>
							{/if}
							<span class="truncate">{category || 'Select...'}</span>
						</div>
						<ChevronDown class="w-4 h-4 text-gray-500 shrink-0 ml-1" />
					</button>
				</div>

				{#if isCategoryDropdownOpen}
					<div
						class="fixed inset-0 z-40"
						onclick={() => (isCategoryDropdownOpen = false)}
						role="presentation"
					></div>
					<div
						class="absolute left-0 right-0 mt-2 max-h-64 overflow-y-auto bg-[#1a1a1a] rounded-xl box-3d z-50 p-2 flex flex-col gap-1"
					>
						{#each categories as cat}
							<button
								class="flex items-center gap-3 text-left px-4 py-3 text-base tracking-wide rounded-lg transition-colors {category ===
								cat.category
									? 'bg-white text-black box-3d'
									: 'text-gray-200 hover:bg-[#2a2a2a]'}"
								onclick={() => selectCategory(cat)}
							>
								{#if cat.icon_name}
									<picture>
										<source srcset="/icons/{cat.icon_name}.avif" type="image/avif" />
										<img src="/icons/{cat.icon_name}.webp" alt="" class="h-6 w-6 object-contain" />
									</picture>
								{/if}
								<span>{cat.category}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Type -->
			<div class="relative z-40">
				<label for="type" class="block text-xs uppercase tracking-wider text-gray-500 mb-1.5 pl-1"
					>Type</label
				>
				<div class="relative">
					<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
						<SortDesc class="h-4 w-4 text-gray-600" />
					</div>
					<button
						id="type"
						class="w-full bg-[#111111] rounded-3xl pl-11 pr-4 py-5 text-sm tracking-wide focus:outline-none box-3d flex items-center justify-between {type ===
						'debit'
							? 'text-[#ff6b6b]'
							: 'text-[#69db7c]'}"
						onclick={toggleTypeDropdown}
					>
						<span>{type === 'debit' ? 'Debit' : 'Credit'}</span>
						<ChevronDown class="w-4 h-4 text-gray-500 shrink-0 ml-1" />
					</button>
				</div>

				{#if isTypeDropdownOpen}
					<div
						class="fixed inset-0 z-40"
						onclick={() => (isTypeDropdownOpen = false)}
						role="presentation"
					></div>
					<div
						class="absolute left-0 right-0 mt-2 bg-[#1a1a1a] rounded-xl box-3d z-50 p-2 flex flex-col gap-1"
					>
						{#each ['debit', 'credit'] as t}
							<button
								class="text-left px-4 py-3 text-base tracking-wide rounded-lg transition-colors {type ===
								t
									? 'bg-white text-black box-3d'
									: 'text-gray-200 hover:bg-[#2a2a2a]'}"
								onclick={() => selectType(t)}
							>
								{t === 'debit' ? 'Debit' : 'Credit'}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Slider Friction -->
	<div class="mt-14 flex flex-col items-center">
		<p class="text-xs uppercase tracking-wider text-gray-600 mb-3">Slide to Confirm</p>
		<div class="relative w-full h-16 flex items-center justify-center">
			<div
				class="absolute inset-x-0 h-14 bg-[#0a0a0a] rounded-full overflow-hidden flex items-center justify-center box-3d"
			>
				<!-- Background text -->
				<span
					class="absolute text-gray-600 font-medium tracking-widest uppercase text-sm pointer-events-none flex items-center gap-2 z-0"
				>
					{#if loading}
						Processing...
					{:else}
						Slide >>>
					{/if}
				</span>

				<!-- Fill progress -->
				<div
					class="absolute top-0 left-0 h-full bg-white/20 backdrop-blur-md pointer-events-none z-0"
					style="width: calc(2rem + (100% - 4rem) * ({slideValue} / 100));"
				></div>
			</div>

			<!-- The invisible slider -->
			<input
				type="range"
				min="0"
				max="100"
				bind:value={slideValue}
				oninput={handleSlideInput}
				ontouchend={handleSlideEnd}
				onmouseup={handleSlideEnd}
				class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 custom-slider touch-none"
				disabled={loading}
			/>

			<!-- Visual thumb that moves with the slider -->
			<div
				class="absolute w-16 h-16 bg-white rounded-full shadow-lg pointer-events-none transition-none flex items-center justify-center transform -translate-x-1/2 z-10"
				style="left: calc(2rem + (100% - 4rem) * ({slideValue} / 100));"
			>
				<ChevronRight class="w-6 h-6 text-gray-800" />
			</div>
		</div>
	</div>
</div>

<style>
	/* Make the native thumb same size as visual thumb so their centers align perfectly */
	.custom-slider {
		-webkit-appearance: none;
		appearance: none;
		background: transparent;
	}
	.custom-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		background: transparent;
		cursor: pointer;
	}
	.custom-slider::-moz-range-thumb {
		width: 4rem;
		height: 4rem;
		border-radius: 50%;
		background: transparent;
		cursor: pointer;
		border: none;
	}
</style>
