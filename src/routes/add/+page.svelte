<script>
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import {
		Calendar as CalendarIcon,
		IndianRupee,
		FileText,
		Tags,
		SortDesc,
		CheckCircle2
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

	$effect(() => {
		async function fetchCategories() {
			const { data } = await supabase.from('budgets').select('category');
			if (data) categories = data.map((b) => b.category);
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

	$effect(() => {
		if (slideValue == 100 && !loading && amount && details && category) {
			handleSubmit();
		} else if (slideValue == 100) {
			// Form incomplete
			slideValue = 0;
			alert('Please fill Amount, Details, and Category fields');
		}
	});

	function handleSlideEnd() {
		if (slideValue < 100) slideValue = 0;
	}
</script>

<div class="px-4 pt-4 pb-20 relative min-h-full">
	{#if successMsg}
		<div
			class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md rounded-3xl animate-in fade-in zoom-in duration-300"
		>
			<CheckCircle2 class="w-16 h-16 text-white mb-4" />
			<h2 class="text-2xl font-light text-white tracking-widest uppercase">Success</h2>
			<p class="text-gray-400 text-sm mt-2">Transaction Added</p>
		</div>
	{/if}

	<h1 class="text-2xl font-light tracking-wide text-white mb-8 pl-1">New Transaction</h1>

	<div class="space-y-5">
		<!-- Date -->
		<div>
			<label
				for="date"
				class="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 pl-1">Date</label
			>
			<div class="relative">
				<div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
					<CalendarIcon class="h-4 w-4 text-gray-600" />
				</div>
				<input
					id="date"
					type="date"
					bind:value={date}
					class="w-full bg-[#111111] border border-gray-900 rounded-3xl pl-11 pr-4 py-4 text-base text-gray-200 focus:outline-none focus:border-gray-600 font-light"
				/>
			</div>
		</div>

		<!-- Amount -->
		<div>
			<label
				for="amount"
				class="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 pl-1">Amount</label
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
					class="w-full bg-[#111111] border border-gray-900 rounded-3xl pl-11 pr-4 py-4 text-base text-white placeholder-gray-700 focus:outline-none focus:border-gray-600 font-medium text-lg"
				/>
			</div>
		</div>

		<!-- Details -->
		<div>
			<label
				for="details"
				class="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 pl-1">Details</label
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
					class="w-full bg-[#111111] border border-gray-900 rounded-3xl pl-11 pr-4 py-4 text-base text-gray-200 placeholder-gray-700 focus:outline-none focus:border-gray-600 font-light"
				/>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<!-- Category -->
			<div>
				<label
					for="category"
					class="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 pl-1"
					>Category</label
				>
				<div class="relative">
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<Tags class="h-4 w-4 text-gray-600" />
					</div>
					<select
						id="category"
						bind:value={category}
						class="w-full bg-[#111111] border border-gray-900 rounded-3xl pl-10 pr-2 py-4 text-base text-gray-200 focus:outline-none focus:border-gray-600 font-light appearance-none text-sm"
					>
						<option value="" disabled selected>Select...</option>
						{#each categories as cat}
							<option value={cat}>{cat}</option>
						{/each}
					</select>
				</div>
			</div>

			<!-- Type -->
			<div>
				<label
					for="type"
					class="block text-[10px] uppercase tracking-widest text-gray-500 mb-1.5 pl-1">Type</label
				>
				<div class="relative">
					<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<SortDesc class="h-4 w-4 text-gray-600" />
					</div>
					<select
						id="type"
						bind:value={type}
						class="w-full bg-[#111111] border border-gray-900 rounded-3xl pl-10 pr-2 py-4 text-base text-gray-200 focus:outline-none focus:border-gray-600 font-light appearance-none text-sm {type ===
						'debit'
							? 'text-[#ff6b6b]'
							: 'text-[#69db7c]'}"
					>
						<option value="debit">Debit</option>
						<option value="credit">Credit</option>
					</select>
				</div>
			</div>
		</div>
	</div>

	<!-- Slider Friction -->
	<div class="mt-14 flex flex-col items-center">
		<p class="text-[10px] uppercase tracking-widest text-gray-600 mb-3">Slide to Confirm</p>
		<div
			class="relative w-full h-14 bg-[#0a0a0a] border border-gray-900 rounded-full overflow-hidden shadow-inner flex items-center justify-center"
		>
			<!-- Background text -->
			<span
				class="absolute text-gray-600 font-medium tracking-widest uppercase text-sm pointer-events-none flex items-center gap-2"
			>
				{#if loading}
					Processing...
				{:else}
					Slide >>>
				{/if}
			</span>

			<!-- Fill progress -->
			<div
				class="absolute top-0 left-0 h-full bg-white/20 backdrop-blur-md pointer-events-none"
				style="width: {slideValue}%"
			></div>

			<!-- The invisible slider -->
			<input
				type="range"
				min="0"
				max="100"
				bind:value={slideValue}
				ontouchend={handleSlideEnd}
				onmouseup={handleSlideEnd}
				class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
				disabled={loading}
			/>

			<!-- Visual thumb that moves with the slider -->
			<div
				class="absolute top-1 bottom-1 w-12 bg-white rounded-full shadow-lg pointer-events-none transition-none flex items-center justify-center transform -translate-x-1/2"
				style="left: calc({slideValue}% * 0.82 + 8%)"
			></div>
		</div>
	</div>
</div>
