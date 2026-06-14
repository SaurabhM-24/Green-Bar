<script>
	import { X, ChevronDown } from 'lucide-svelte';
	import { iconMap } from '$lib/icons.js';
	import { slide, fade, scale, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	
	/**
	 * @typedef {Object} Props
	 * @property {any} transaction The transaction object to display/edit.
	 * @property {any[]} categories List of available categories for the dropdown.
	 * @property {() => void} onclose Callback to close the modal.
	 * @property {(id: string) => void} ondelete Callback to delete the transaction.
	 * @property {(data: any) => void} onsave Callback to save updated transaction data.
	 */
	
	/** @type {Props} */
	let { transaction, categories, onclose, ondelete, onsave } = $props();

	let isEditing = $state(false);
	let isDeleting = $state(false);

	// svelte-ignore state_referenced_locally
	let editData = $state({ ...transaction });

	let isTypeDropdownOpen = $state(false);
	let isCategoryDropdownOpen = $state(false);

	function startEditing() {
		isEditing = true;
		editData = { ...transaction, amount: Math.abs(transaction.amount) };
	}

	function handleSave() {
		let finalAmount = Math.abs(editData.amount);
		if (editData.transaction_type?.toLowerCase() === 'debit') {
			finalAmount = -finalAmount;
		}
		onsave({ ...editData, amount: finalAmount });
	}
	
	let isDebit = $derived(transaction.transaction_type?.toLowerCase() === 'debit');
	let isEditDebit = $derived(editData.transaction_type?.toLowerCase() === 'debit');
</script>

<div transition:fade={{ duration: 200 }} class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] overflow-y-auto" onclick={() => { if (!isEditing && !isDeleting) onclose(); }} role="presentation">
	<div class="min-h-full flex items-center justify-center p-4">
		<!-- Modal Content -->
		<div 
			transition:scale={{ start: 0.95, duration: 250, easing: cubicOut }}
			class="bg-[#151515] w-full max-w-md rounded-3xl p-6 md:p-8 box-3d flex flex-col gap-6 relative"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<!-- Top Bar -->
		<div class="flex justify-between items-start gap-4">
			<div class="flex flex-col gap-1 w-full">
				<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold pl-1">Title</span>
				{#if isEditing}
					<textarea rows="2" style="field-sizing: content; min-width: 2ch;" bind:value={editData.title} class="bg-transparent font-display text-3xl text-white tracking-wide pr-14 leading-tight focus:outline-none placeholder-gray-600 border-b border-transparent hover:border-gray-700 focus:border-white transition-colors pb-1 resize-none" placeholder="Title"></textarea>
				{:else}
					<h2 class="text-3xl font-display text-white tracking-wide pr-14 leading-tight border-b border-transparent pb-1">{transaction.title}</h2>
				{/if}
			</div>
			{#if !isEditing && !isDeleting}
				<button class="absolute top-6 right-6 p-2 text-gray-400 hover:text-white transition-colors bg-[#222] rounded-xl box-3d shrink-0 z-50" onclick={onclose}>
					<X class="w-5 h-5" />
				</button>
			{/if}
		</div>

		<!-- Details -->
		<div class="flex flex-col gap-5 mt-2">
			<!-- Description -->
			<div class="flex flex-col gap-1.5 mt-1">
				<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Description</span>
				{#if isEditing}
					<textarea bind:value={editData.description} class="bg-transparent text-gray-400 text-base leading-relaxed focus:outline-none w-full resize-none min-h-[48px] p-0 border-b border-transparent hover:border-gray-700 focus:border-white transition-colors" placeholder="Add a description..."></textarea>
				{:else}
					<span class="text-gray-400 text-base leading-relaxed {transaction.description ? '' : 'italic'} border-b border-transparent min-h-[48px] w-full inline-block">
						{transaction.description || 'No description provided'}
					</span>
				{/if}
			</div>

			<hr class="border-gray-800/60" />

			<!-- Date & Type -->
			<div class="flex gap-4">
				<div class="flex-1 flex flex-col gap-1.5 border-r border-gray-800/60 pr-4">
					<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Date</span>
					{#if isEditing}
						<input type="date" bind:value={editData.transaction_date} class="bg-transparent text-gray-200 text-base focus:outline-none border-b border-transparent hover:border-gray-700 focus:border-white transition-colors cursor-pointer w-full pb-1" />
					{:else}
						<span class="text-gray-200 text-base border-b border-transparent w-full inline-block pb-1">{transaction.transaction_date}</span>
					{/if}
				</div>
				<div class="flex-1 flex flex-col gap-1.5 relative pl-2">
					<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Type</span>
					{#if isEditing}
						<button 
							class="text-left bg-transparent text-gray-200 text-base focus:outline-none border-b border-transparent hover:border-gray-700 focus:border-white transition-colors w-full flex justify-between items-center pb-1"
							onclick={() => isTypeDropdownOpen = !isTypeDropdownOpen}
						>
							<span class="capitalize">{editData.transaction_type}</span>
							<ChevronDown class="w-4 h-4 opacity-50 shrink-0" />
						</button>
						{#if isTypeDropdownOpen}
							<div class="fixed inset-0 z-30" onclick={() => isTypeDropdownOpen = false} role="presentation"></div>
							<div class="absolute left-0 top-full mt-2 w-full bg-[#1a1a1a] rounded-xl box-3d z-40 p-2 flex flex-col gap-1" transition:slide={{ duration: 250, easing: cubicOut }}>
								{#each ['Debit', 'Credit'] as tOpt}
									<button 
										class="text-left px-4 py-2 text-base tracking-wide rounded-lg transition-colors {editData.transaction_type?.toLowerCase() === tOpt.toLowerCase() ? 'bg-white text-black box-3d' : 'text-gray-200 hover:bg-[#2a2a2a]'} capitalize"
										onclick={() => { editData.transaction_type = tOpt; isTypeDropdownOpen = false; }}
									>
										{tOpt}
									</button>
								{/each}
							</div>
						{/if}
					{:else}
						<span class="text-gray-200 text-base border-b border-transparent w-full inline-block capitalize pb-1">{transaction.transaction_type}</span>
					{/if}
				</div>
			</div>

			<hr class="border-gray-800/60" />

			<!-- Amount and Category Side-by-Side -->
			<div class="flex gap-4 items-end mt-1">
				<!-- Amount -->
				<div class="flex-1 flex flex-col gap-1.5 min-w-0 border-r border-gray-800/60 pr-4">
					<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Amount (₹)</span>
					{#if isEditing}
						<div class="flex flex-row flex-nowrap items-center text-4xl tracking-wide font-bold {isEditDebit ? 'text-[#ff6b6b]' : 'text-[#69db7c]'} border-b border-transparent hover:border-gray-700 focus-within:border-current transition-colors w-full pb-0.5">
							<span class="mr-1 shrink-0">{isEditDebit ? '-' : '+'}₹</span>
							<input type="number" bind:value={editData.amount} class="bg-transparent focus:outline-none flex-1 min-w-0 p-0 m-0 [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none" />
						</div>
					{:else}
						<span class="text-4xl tracking-wide font-bold {isDebit ? 'text-[#ff6b6b]' : 'text-[#69db7c]'} border-b border-transparent w-full inline-block truncate pb-0.5">
							{isDebit ? '-' : '+'}₹{Math.abs(transaction.amount).toLocaleString('en-IN')}
						</span>
					{/if}
				</div>

				<!-- Category -->
				<div class="flex-1 flex flex-col gap-1.5 relative min-w-0 pl-2">
					<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Category</span>
					{#if isEditing}
						<button 
							class="flex items-center justify-between gap-3 bg-transparent w-full focus:outline-none border-b border-transparent hover:border-gray-700 focus:border-white transition-shadow text-left pb-1"
							onclick={() => isCategoryDropdownOpen = !isCategoryDropdownOpen}
						>
							<div class="flex items-center gap-3 overflow-hidden">
								{#if categories.find(c => c.category === editData.category)?.icon_name && iconMap[categories.find(c => c.category === editData.category)?.icon_name]}
									<picture>
										{#if iconMap[categories.find(c => c.category === editData.category)?.icon_name].avif}
											<source srcset={iconMap[categories.find(c => c.category === editData.category)?.icon_name].avif} type="image/avif" />
										{/if}
										<img src={iconMap[categories.find(c => c.category === editData.category)?.icon_name].webp} alt="" class="h-5 w-5 object-contain shrink-0" />
									</picture>
								{/if}
								<span class="text-gray-100 font-medium truncate text-base">{editData.category}</span>
							</div>
							<ChevronDown class="w-4 h-4 text-gray-500 shrink-0" />
						</button>
						
						{#if isCategoryDropdownOpen}
							<div class="fixed inset-0 z-30" onclick={() => isCategoryDropdownOpen = false} role="presentation"></div>
							<div class="absolute right-0 top-full mt-2 w-56 max-h-64 overflow-y-auto bg-[#1a1a1a] rounded-xl box-3d z-50 p-2 flex flex-col gap-1" transition:slide={{ duration: 250, easing: cubicOut }}>
								{#each categories.filter(c => c.category !== 'All') as cat}
									<button 
										class="flex items-center gap-3 text-left px-4 py-3 text-base tracking-wide rounded-lg transition-colors {editData.category === cat.category ? 'bg-white text-black box-3d' : 'text-gray-200 hover:bg-[#2a2a2a]'}"
										onclick={() => { editData.category = cat.category; isCategoryDropdownOpen = false; }}
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
					{:else}
						<div class="flex items-center gap-3 bg-transparent w-full border-b border-transparent overflow-hidden pb-1">
							{#if categories.find(c => c.category === transaction.category)?.icon_name && iconMap[categories.find(c => c.category === transaction.category)?.icon_name]}
								<picture>
									{#if iconMap[categories.find(c => c.category === transaction.category)?.icon_name].avif}
										<source srcset={iconMap[categories.find(c => c.category === transaction.category)?.icon_name].avif} type="image/avif" />
									{/if}
									<img src={iconMap[categories.find(c => c.category === transaction.category)?.icon_name].webp} alt="" class="h-5 w-5 object-contain shrink-0" />
								</picture>
							{/if}
							<span class="text-gray-100 font-medium truncate text-base">{transaction.category}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Actions -->
		<div class="mt-2 border-t border-gray-800/60 pt-6 grid">
			{#if isDeleting}
				<div class="flex flex-col gap-5 col-start-1 row-start-1" in:fly={{ y: 10, duration: 200, delay: 150, easing: cubicOut }} out:fade={{ duration: 150 }}>
					<p class="text-[#ff6b6b] text-center tracking-wide font-medium">Are you sure you want to delete this transaction?</p>
					<div class="flex gap-4">
						<button class="flex-1 py-3.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-white font-medium box-3d tracking-wide transition-all active:scale-[0.98]" onclick={() => isDeleting = false}>Cancel</button>
						<button class="flex-1 py-3.5 rounded-xl bg-[#ff6b6b] hover:bg-[#ff8787] text-black font-bold box-3d tracking-wide transition-all active:scale-[0.98]" onclick={() => ondelete(transaction.id)}>Confirm Delete</button>
					</div>
				</div>
			{:else if isEditing}
				<div class="flex gap-4 col-start-1 row-start-1" in:fly={{ y: 10, duration: 200, delay: 150, easing: cubicOut }} out:fade={{ duration: 150 }}>
					<button class="flex-1 py-3.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-white font-medium box-3d tracking-wide transition-all active:scale-[0.98]" onclick={() => { isEditing = false; editData = {...transaction}; }}>Cancel</button>
					<button class="flex-1 py-3.5 rounded-xl bg-white hover:bg-gray-200 text-black font-bold box-3d tracking-wide transition-all active:scale-[0.98]" onclick={handleSave}>Save</button>
				</div>
			{:else}
				<div class="flex gap-4 col-start-1 row-start-1" in:fly={{ y: 10, duration: 200, delay: 150, easing: cubicOut }} out:fade={{ duration: 150 }}>
					<button class="flex-1 py-3.5 rounded-xl bg-white hover:bg-gray-200 text-black font-bold box-3d tracking-wide transition-all active:scale-[0.98]" onclick={startEditing}>Edit</button>
					<button class="flex-1 py-3.5 rounded-xl bg-[#ff6b6b] hover:bg-[#ff8787] text-black font-bold box-3d tracking-wide transition-all active:scale-[0.98]" onclick={() => isDeleting = true}>Delete</button>
				</div>
			{/if}
		</div>
		</div>
	</div>
</div>
