<script>
	import { X, ChevronDown } from 'lucide-svelte';
	
	let { budget, amountUsed, amountLeft, onclose, ondelete, onsave } = $props();

	let isEditing = $state(false);
	let isDeleting = $state(false);
	let isIconDropdownOpen = $state(false);
	import { iconsList, iconMap } from '$lib/icons.js';
	import { slide, fade, scale, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	// svelte-ignore state_referenced_locally
	let editData = $state({ ...budget });

	function startEditing() {
		isEditing = true;
		editData = { ...budget };
	}

	function handleSave() {
		onsave({ ...editData });
	}
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
				<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold pl-1">Category Name</span>
				{#if isEditing}
					<textarea rows="2" style="field-sizing: content; min-width: 2ch;" bind:value={editData.category} class="bg-transparent font-display text-3xl text-white tracking-wide pr-14 leading-tight focus:outline-none placeholder-gray-600 border-b border-transparent hover:border-gray-700 focus:border-white transition-colors pb-1 resize-none" placeholder="Category Name"></textarea>
				{:else}
					<h2 class="text-3xl font-display text-white tracking-wide pr-14 leading-tight border-b border-transparent pb-1">{budget.category}</h2>
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
					<span class="text-gray-400 text-base leading-relaxed {budget.description ? '' : 'italic'} border-b border-transparent min-h-[48px] w-full inline-block">
						{budget.description || 'No description provided'}
					</span>
				{/if}
			</div>

			<hr class="border-gray-800/60" />

			<!-- Limit & Icon -->
			<div class="flex gap-4 items-end mt-1">
				<div class="flex-1 flex flex-col gap-1.5 border-r border-gray-800/60 pr-4">
					<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Monthly Limit</span>
					{#if isEditing}
						<div class="flex items-center text-4xl tracking-wide font-bold text-white border-b border-transparent hover:border-gray-700 focus-within:border-current transition-colors w-full pb-0.5">
							<span class="mr-1">₹</span>
							<input type="number" bind:value={editData.monthly_limit} class="bg-transparent w-full focus:outline-none [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none" />
						</div>
					{:else}
						<span class="text-4xl tracking-wide font-bold text-white border-b border-transparent w-full inline-block truncate pb-0.5">
							₹{Number(budget.monthly_limit || 0).toLocaleString('en-IN')}
						</span>
					{/if}
				</div>
				<div class="flex-1 flex flex-col gap-1.5 relative pl-2">
					<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Icon</span>
					{#if isEditing}
						<button 
							class="flex items-center justify-between gap-3 bg-transparent w-full focus:outline-none border-b border-transparent hover:border-gray-700 focus:border-white transition-shadow text-left pb-1"
							onclick={() => isIconDropdownOpen = !isIconDropdownOpen}
						>
							<div class="flex items-center gap-3 overflow-hidden">
								{#if editData.icon_name && iconMap[editData.icon_name]}
									<picture>
										{#if iconMap[editData.icon_name].avif}
											<source srcset={iconMap[editData.icon_name].avif} type="image/avif" />
										{/if}
										<img src={iconMap[editData.icon_name].webp} alt="" class="h-5 w-5 object-contain shrink-0" />
									</picture>
								{/if}
								<span class="text-gray-100 font-medium truncate text-base">{editData.icon_name || 'None'}</span>
							</div>
							<ChevronDown class="w-4 h-4 text-gray-500 shrink-0" />
						</button>
						
						{#if isIconDropdownOpen}
							<div class="fixed inset-0 z-30" onclick={() => isIconDropdownOpen = false} role="presentation"></div>
							<div class="absolute right-0 top-full mt-2 w-56 max-h-64 overflow-y-auto bg-[#1a1a1a] rounded-xl box-3d z-50 p-2 flex flex-col gap-1" transition:slide={{ duration: 250, easing: cubicOut }}>
								{#each iconsList as icon}
									<button 
										class="flex items-center gap-3 text-left px-4 py-3 text-base tracking-wide rounded-lg transition-colors {editData.icon_name === icon.name ? 'bg-white text-black box-3d' : 'text-gray-200 hover:bg-[#2a2a2a]'}"
										onclick={() => { editData.icon_name = icon.name; isIconDropdownOpen = false; }}
									>
										<picture>
											{#if icon.avif}
												<source srcset={icon.avif} type="image/avif" />
											{/if}
											<img src={icon.webp} alt="" class="h-5 w-5 object-contain" />
										</picture>
										<span>{icon.name}</span>
									</button>
								{/each}
							</div>
						{/if}
					{:else}
						<div class="flex items-center gap-3 bg-transparent w-full border-b border-transparent overflow-hidden pb-1">
							{#if budget.icon_name && iconMap[budget.icon_name]}
								<picture>
									{#if iconMap[budget.icon_name].avif}
										<source srcset={iconMap[budget.icon_name].avif} type="image/avif" />
									{/if}
									<img src={iconMap[budget.icon_name].webp} alt="" class="h-5 w-5 object-contain shrink-0" />
								</picture>
							{/if}
							<span class="text-gray-100 font-medium truncate text-base">{budget.icon_name || 'None'}</span>
						</div>
					{/if}
				</div>
			</div>

			{#if !isEditing}
				<hr class="border-gray-800/60" />

				<!-- Amounts -->
				<div class="flex gap-4">
					<div class="flex-1 flex flex-col gap-1.5 border-r border-gray-800/60 pr-4">
						<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Amount Used</span>
						<span class="text-gray-200 text-lg border-b border-transparent w-full inline-block pb-1">₹{amountUsed.toLocaleString('en-IN')}</span>
					</div>
					<div class="flex-1 flex flex-col gap-1.5 relative pl-2">
						<span class="text-xs text-gray-500 uppercase tracking-wider font-semibold">Amount Left</span>
						<span class="text-gray-200 text-lg border-b border-transparent w-full inline-block pb-1">₹{amountLeft.toLocaleString('en-IN')}</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- Actions -->
		<div class="mt-2 border-t border-gray-800/60 pt-6 grid">
			{#if isDeleting}
				<div class="flex flex-col gap-5 col-start-1 row-start-1" in:fly={{ y: 10, duration: 200, delay: 150, easing: cubicOut }} out:fade={{ duration: 150 }}>
					<p class="text-[#ff6b6b] text-center tracking-wide font-medium">Are you sure you want to delete this category?</p>
					<div class="flex gap-4">
						<button class="flex-1 py-3.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-white font-medium box-3d tracking-wide transition-all active:scale-[0.98]" onclick={() => isDeleting = false}>Cancel</button>
						<button class="flex-1 py-3.5 rounded-xl bg-[#ff6b6b] hover:bg-[#ff8787] text-black font-bold box-3d tracking-wide transition-all active:scale-[0.98]" onclick={() => ondelete(budget.id)}>Confirm Delete</button>
					</div>
				</div>
			{:else if isEditing}
				<div class="flex gap-4 col-start-1 row-start-1" in:fly={{ y: 10, duration: 200, delay: 150, easing: cubicOut }} out:fade={{ duration: 150 }}>
					<button class="flex-1 py-3.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-white font-medium box-3d tracking-wide transition-all active:scale-[0.98]" onclick={() => { isEditing = false; editData = {...budget}; }}>Cancel</button>
					<button class="flex-1 py-3.5 rounded-xl bg-white hover:bg-gray-200 text-black font-bold box-3d tracking-wide transition-all active:scale-[0.98]" onclick={handleSave}>Save</button>
				</div>
			{:else}
				<div class="flex flex-col gap-4 col-start-1 row-start-1" in:fly={{ y: 10, duration: 200, delay: 150, easing: cubicOut }} out:fade={{ duration: 150 }}>
					<a href="/list?category={budget.category}" class="block w-full text-center py-3.5 rounded-xl bg-white hover:bg-gray-200 text-black font-bold box-3d tracking-wide transition-all active:scale-[0.98]">View Transactions</a>
					<div class="flex gap-4">
						<button class="flex-1 py-3.5 rounded-xl bg-[#222] hover:bg-[#2a2a2a] text-white font-medium box-3d tracking-wide transition-all active:scale-[0.98]" onclick={startEditing}>Edit</button>
						<button class="flex-1 py-3.5 rounded-xl bg-[#ff6b6b] hover:bg-[#ff8787] text-black font-bold box-3d tracking-wide transition-all active:scale-[0.98]" onclick={() => isDeleting = true}>Delete</button>
					</div>
				</div>
			{/if}
		</div>
		</div>
	</div>
</div>
