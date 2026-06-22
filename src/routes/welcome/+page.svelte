<script>
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { fade, slide, scale, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { ChevronRight, Plus, Check } from 'lucide-svelte';
	import AddCategoryModal from '$lib/components/editCards/AddCategoryModal.svelte';
	import CorpusModal from '$lib/components/editCards/CorpusModal.svelte';

	let currentStep = $state(1);
	let loading = $state(false);
	
	let initialBalance = $state('');
	
	let corpusBudget = $state(null);
	let user = $state(null);

	let isAddVariableModalOpen = $state(false);
	let isAddFixedModalOpen = $state(false);
	let isCorpusModalOpen = $state(false);

	let variableBudgets = $state([]);
	let fixedBudgets = $state([]);

	$effect(() => {
		async function init() {
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) {
				goto('/login');
				return;
			}
			user = session.user;
			await fetchBudgets();
		}
		init();
	});

	async function fetchBudgets() {
		if (!user) return;
		const { data, error } = await supabase
			.from('budgets')
			.select('*')
			.eq('user_id', user.id);
		
		if (!error && data) {
			corpusBudget = data.find(b => b.budget_type === 'corpus' && b.category === 'personal corpus');
			variableBudgets = data.filter(b => b.budget_type === 'variable');
			fixedBudgets = data.filter(b => b.budget_type === 'fixed');
		}
	}

	async function handleSaveInitialBalance() {
		if (!initialBalance || !corpusBudget) {
			currentStep++;
			return;
		}
		
		loading = true;
		const { error } = await supabase.from('transactions').insert([{
			id: crypto.randomUUID(),
			amount: Number(initialBalance),
			transaction_type: 'credited',
			title: 'Initial account status',
			category_id: corpusBudget.category_id,
			user_id: user.id,
			date: new Date().toISOString()
		}]);
		
		loading = false;
		if (!error) currentStep++;
		else alert('Error saving balance: ' + error.message);
	}

	async function saveCategory(data, type) {
		const targetBudgets = type === 'variable' ? variableBudgets : fixedBudgets;
		const maxSortOrder = targetBudgets.length > 0 ? Math.max(...targetBudgets.map(b => Number(b.sort_order || 0))) : -1;

		const { error } = await supabase.from('budgets').insert([{
			category_id: crypto.randomUUID(),
			category: data.category,
			description: data.description || null,
			limit_amount: data.limit_amount ? Number(data.limit_amount) : 0,
			icon_name: data.icon_name || null,
			budget_type: type,
			period_type: data.period_type || 'monthly',
			reset_date: data.reset_date ? Number(data.reset_date) : 1,
			user_id: user.id,
			sort_order: maxSortOrder + 1
		}]);

		if (!error) {
			if (type === 'variable') isAddVariableModalOpen = false;
			if (type === 'fixed') isAddFixedModalOpen = false;
			await fetchBudgets();
		} else {
			alert('Failed to create category: ' + error.message);
		}
	}

	async function updateCorpus(data) {
		const { error } = await supabase
			.from('budgets')
			.update({
				category: data.category,
				limit_amount: data.limit_amount,
				description: data.description,
				icon_name: data.icon_name,
				period_type: data.period_type,
				reset_date: data.reset_date
			})
			.eq('category_id', data.category_id);
			
		if (!error) {
			isCorpusModalOpen = false;
			await fetchBudgets();
		} else {
			alert('Failed to update corpus: ' + error.message);
		}
	}

	async function finishOnboarding() {
		loading = true;
		const { error } = await supabase
			.from('profiles')
			.update({ onboarding_completed: true })
			.eq('id', user.id);
			
		loading = false;
		if (!error) {
			goto('/');
		} else {
			alert('Failed to complete onboarding: ' + error.message);
		}
	}
</script>

<div class="min-h-screen bg-black text-gray-300 font-sans p-6 flex flex-col max-w-lg mx-auto pb-12">
	
	<!-- Progress Bar -->
	<div class="w-full bg-gray-900 h-2 rounded-full mt-6 mb-8 overflow-hidden shrink-0">
		<div 
			class="bg-white h-full transition-all duration-500 ease-out" 
			style="width: {(currentStep / 6) * 100}%"
		></div>
	</div>

	<div class="flex-1 relative flex flex-col">
		{#if currentStep === 1}
			<div in:fly={{y: 20, duration: 400, delay: 100}} class="flex flex-col flex-1">
				<div class="flex-1">
					<h1 class="text-4xl font-display text-white mb-6 tracking-wide leading-tight">Welcome to Green Bar</h1>
					<p class="text-gray-400 text-lg leading-relaxed mb-8">
						Green Bar is a highly opinionated, mobile-first expense tracker. It uses a zero-based budgeting approach to give you complete control over your money.
						<br><br>
						<strong>Pro Tip:</strong> For the best experience, add this app to your Home Screen to use it like a native app.
					</p>
				</div>
				<button 
					class="w-full bg-white text-black font-bold py-5 text-xl rounded-3xl box-3d transition-all active:scale-[0.98] shrink-0 flex items-center justify-center gap-2"
					onclick={() => currentStep++}
				>
					Get Started <ChevronRight class="w-6 h-6" />
				</button>
			</div>
		{/if}

		{#if currentStep === 2}
			<div in:fly={{y: 20, duration: 400, delay: 100}} class="flex flex-col flex-1">
				<div class="flex-1">
					<h1 class="text-4xl font-display text-white mb-6 tracking-wide leading-tight">Initial Balance</h1>
					<p class="text-gray-400 text-lg leading-relaxed mb-8">
						To get started, what is your current total bank balance? We will add this as your initial account status.
					</p>
					
					<div class="flex items-center text-5xl tracking-wide font-bold text-white border-b-2 border-gray-800 focus-within:border-white transition-colors w-full pb-2 mb-8">
						<span class="mr-2 text-gray-500">₹</span>
						<input 
							type="number" 
							bind:value={initialBalance} 
							placeholder="0" 
							class="bg-transparent w-full focus:outline-none [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none" 
						/>
					</div>
				</div>
				<div class="flex flex-col gap-4 shrink-0">
					<button 
						class="w-full bg-white text-black font-bold py-5 text-xl rounded-3xl box-3d transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
						onclick={handleSaveInitialBalance}
						disabled={loading}
					>
						{loading ? 'Saving...' : 'Save Balance'} <ChevronRight class="w-6 h-6" />
					</button>
					<button 
						class="w-full bg-transparent text-gray-500 font-medium py-3 text-lg transition-colors hover:text-white"
						onclick={() => currentStep++}
					>
						Skip for now
					</button>
				</div>
			</div>
		{/if}

		{#if currentStep === 3}
			<div in:fly={{y: 20, duration: 400, delay: 100}} class="flex flex-col flex-1">
				<div class="flex-1">
					<h1 class="text-4xl font-display text-white mb-6 tracking-wide leading-tight">Variable Expenses</h1>
					<p class="text-gray-400 text-lg leading-relaxed mb-6">
						These are day-to-day spending categories (e.g., Groceries, Dining, Fuel) where you set an <strong>upper limit</strong> for a period.
					</p>
					
					<div class="bg-[#111] border border-gray-800 rounded-3xl p-4 mb-6">
						{#if variableBudgets.length === 0}
							<p class="text-center text-gray-500 py-4">No categories added yet.</p>
						{:else}
							<ul class="space-y-3">
								{#each variableBudgets as b}
									<li class="flex items-center justify-between text-white bg-[#1a1a1a] px-4 py-3 rounded-2xl">
										<span>{b.category}</span>
										<span class="text-gray-400">₹{b.limit_amount}</span>
									</li>
								{/each}
							</ul>
						{/if}
					</div>

					<button 
						class="w-full bg-[#1a1a1a] hover:bg-[#222] border border-gray-800 text-white font-medium py-4 text-lg rounded-2xl box-3d transition-all active:scale-[0.98] flex items-center justify-center gap-2"
						onclick={() => isAddVariableModalOpen = true}
					>
						<Plus class="w-5 h-5" /> Add Category
					</button>
				</div>

				<div class="flex flex-col gap-4 shrink-0 mt-8">
					<button 
						class="w-full bg-white text-black font-bold py-5 text-xl rounded-3xl box-3d transition-all active:scale-[0.98] flex items-center justify-center gap-2"
						onclick={() => currentStep++}
					>
						Next <ChevronRight class="w-6 h-6" />
					</button>
					<button 
						class="w-full bg-transparent text-gray-500 font-medium py-3 text-lg transition-colors hover:text-white"
						onclick={() => currentStep++}
					>
						Skip for now
					</button>
				</div>
			</div>
		{/if}

		{#if currentStep === 4}
			<div in:fly={{y: 20, duration: 400, delay: 100}} class="flex flex-col flex-1">
				<div class="flex-1">
					<h1 class="text-4xl font-display text-white mb-6 tracking-wide leading-tight">Fixed Expenses</h1>
					<p class="text-gray-400 text-lg leading-relaxed mb-6">
						These are recurring full-payments (e.g., EMIs, Subscriptions, Rent) that you must pay exactly in full every period.
					</p>
					
					<div class="bg-[#111] border border-gray-800 rounded-3xl p-4 mb-6">
						{#if fixedBudgets.length === 0}
							<p class="text-center text-gray-500 py-4">No categories added yet.</p>
						{:else}
							<ul class="space-y-3">
								{#each fixedBudgets as b}
									<li class="flex items-center justify-between text-white bg-[#1a1a1a] px-4 py-3 rounded-2xl">
										<span>{b.category}</span>
										<span class="text-gray-400">₹{b.limit_amount}</span>
									</li>
								{/each}
							</ul>
						{/if}
					</div>

					<button 
						class="w-full bg-[#1a1a1a] hover:bg-[#222] border border-gray-800 text-white font-medium py-4 text-lg rounded-2xl box-3d transition-all active:scale-[0.98] flex items-center justify-center gap-2"
						onclick={() => isAddFixedModalOpen = true}
					>
						<Plus class="w-5 h-5" /> Add Category
					</button>
				</div>

				<div class="flex flex-col gap-4 shrink-0 mt-8">
					<button 
						class="w-full bg-white text-black font-bold py-5 text-xl rounded-3xl box-3d transition-all active:scale-[0.98] flex items-center justify-center gap-2"
						onclick={() => currentStep++}
					>
						Next <ChevronRight class="w-6 h-6" />
					</button>
					<button 
						class="w-full bg-transparent text-gray-500 font-medium py-3 text-lg transition-colors hover:text-white"
						onclick={() => currentStep++}
					>
						Skip for now
					</button>
				</div>
			</div>
		{/if}

		{#if currentStep === 5}
			<div in:fly={{y: 20, duration: 400, delay: 100}} class="flex flex-col flex-1">
				<div class="flex-1">
					<h1 class="text-4xl font-display text-white mb-6 tracking-wide leading-tight">Personal Corpus</h1>
					<p class="text-gray-400 text-lg leading-relaxed mb-6">
						Your Personal Corpus is all the money in your account not allocated to any specific category. You can lock a portion of this if you like.
					</p>

					{#if corpusBudget}
						<div class="bg-[#1a1a1a] border border-gray-800 rounded-3xl p-6 mb-6 flex justify-between items-center box-3d">
							<div>
								<h3 class="text-white text-xl font-medium tracking-wide">{corpusBudget.category}</h3>
								<p class="text-gray-400 text-sm mt-1">Locked: ₹{corpusBudget.limit_amount}</p>
							</div>
							<button 
								class="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium"
								onclick={() => isCorpusModalOpen = true}
							>
								Edit
							</button>
						</div>
					{:else}
						<p class="text-red-400 mb-6">Failed to load corpus budget.</p>
					{/if}
				</div>

				<div class="flex flex-col gap-4 shrink-0 mt-8">
					<button 
						class="w-full bg-white text-black font-bold py-5 text-xl rounded-3xl box-3d transition-all active:scale-[0.98] flex items-center justify-center gap-2"
						onclick={() => currentStep++}
					>
						Next <ChevronRight class="w-6 h-6" />
					</button>
				</div>
			</div>
		{/if}

		{#if currentStep === 6}
			<div in:fly={{y: 20, duration: 400, delay: 100}} class="flex flex-col flex-1 justify-center items-center text-center">
				<div class="w-24 h-24 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-8 box-3d">
					<Check class="w-12 h-12 text-white" />
				</div>
				<h1 class="text-4xl font-display text-white mb-4 tracking-wide leading-tight">You're All Set!</h1>
				<p class="text-gray-400 text-lg leading-relaxed mb-12">
					Your profile has been setup. You can always add or edit these categories later.
				</p>
				
				<button 
					class="w-full bg-white text-black font-bold py-5 text-xl rounded-3xl box-3d transition-all active:scale-[0.98] mt-auto flex items-center justify-center gap-2 disabled:opacity-50"
					onclick={finishOnboarding}
					disabled={loading}
				>
					{loading ? 'Finishing...' : "Let's Go!"}
				</button>
			</div>
		{/if}
	</div>
</div>

{#if isAddVariableModalOpen}
	<AddCategoryModal 
		onclose={() => isAddVariableModalOpen = false} 
		onsave={(data) => saveCategory(data, 'variable')} 
	/>
{/if}

{#if isAddFixedModalOpen}
	<AddCategoryModal 
		onclose={() => isAddFixedModalOpen = false} 
		onsave={(data) => saveCategory(data, 'fixed')} 
	/>
{/if}

{#if isCorpusModalOpen && corpusBudget}
	<CorpusModal 
		budget={corpusBudget} 
		amountUsed={0}
		amountLeft={0}
		onclose={() => isCorpusModalOpen = false} 
		onsave={updateCorpus}
		ondelete={() => { alert('Cannot delete personal corpus.') }}
	/>
{/if}
