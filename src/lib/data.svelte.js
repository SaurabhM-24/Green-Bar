import { supabase } from '$lib/supabase';

/**
 * @class DataStore
 * @description Centralized state management for the Expense Tracker. Uses Svelte 5 runes for reactivity.
 * Responsible for fetching budgets, transactions, and calculating aggregate values for the dashboard.
 */
class DataStore {
	loading = $state(true);

	/** @type {any[]} List of variable budgets */
	budgets = $state([]);

	/** @type {Record<string, number>} Total spent per category in the current period */
	categoryTotals = $state({});

	/** @type {any[]} List of corpus (savings) budgets */
	corpusBudgets = $state([]);

	/** @type {any[]} List of fixed budgets */
	fixedBudgets = $state([]);

	/** @type {Set<string>} Unique categories used in transactions this period */
	transactionCategories = $state(new Set());

	/** @type {any[]} List of all transactions for the current period */
	currentPeriodTransactions = $state([]);

	/** @type {number} Total liquid balance (all time credits minus debits prior to this month) */
	globalLiquidBalance = $state(0);

	/** @type {number} Amount added/removed from personal corpus this period */
	currentPeriodCorpusUsed = $state(0);

	/** @type {number} Net total account balance all time */
	totalAccountBalance = $state(0);

	/** @type {number} Total limit for corpus budgets */
	corpusLimit = $state(0);

	/** @type {string} Authenticated user's display name */
	userName = $state('User');

	/** @type {string | null} Authenticated user's ID */
	userId = $state(null);

	/**
	 * @description Derived total variable expenses used in the current period.
	 * Calculated by summing the categoryTotals for all variable budgets.
	 */
	totalVariableUsed = $derived(
		this.budgets.reduce((sum, b) => sum + (this.categoryTotals[b.category] || 0), 0)
	);

	/**
	 * @description Derived total limit for all variable expenses combined.
	 */
	totalVariableLimit = $derived(
		this.budgets.reduce((sum, b) => sum + Number(b.limit_amount || 0), 0)
	);

	/**
	 * @description Derived dynamic text providing insights based on the current spending pace.
	 */
	insightLine = $derived.by(() => {
		if (this.loading) return 'Fetching your insights...';
		if (this.totalVariableLimit > 0) {
			const usedPercentage = (this.totalVariableUsed / this.totalVariableLimit) * 100;
			if (usedPercentage > 90) return "You're spending too fast!";
			if (usedPercentage > 75) return 'Watch out, budget is getting tight.';
			if (usedPercentage > 50) return 'Halfway through your budget.';
			return 'Looking good this period!';
		}
		return 'Welcome to your financial hub.';
	});

	/**
	 * @description Fetches all required dashboard data asynchronously in parallel.
	 * @param {boolean} background If true, skips setting loading state to prevent UI flashes.
	 */
	async loadData(background = false) {
		if (!background) this.loading = true;

		// Fetch user profile securely
		const fetchProfile = async () => {
			if (this.userId) return this.userId;
			const { data: sessionData } = await supabase.auth.getSession();
			if (sessionData?.session?.user) {
				const id = sessionData.session.user.id;
				this.userId = id;
				const { data: profile } = await supabase
					.from('profiles')
					.select('first_name')
					.eq('id', id)
					.single();

				if (profile?.first_name) {
					this.userName = profile.first_name;
				} else if (sessionData.session.user.user_metadata?.first_name) {
					this.userName = sessionData.session.user.user_metadata.first_name;
				} else if (sessionData.session.user.email) {
					this.userName = sessionData.session.user.email.split('@')[0];
				}
				return id;
			}
			return null;
		};

		const userId = await fetchProfile();

		// Execute all Supabase queries concurrently
		const [budgetRes, rpcRes, allHistoryRes] = await Promise.all([
			userId ? supabase.from('budgets').select('*').eq('user_id', userId).order('sort_order', { ascending: true }) : { data: [] },
			userId ? supabase.rpc('get_budget_usage', { p_user_id: userId }) : { data: [] },
			userId ? supabase.from('transactions').select('amount, transaction_type, transaction_date, category_id').eq('user_id', userId) : { data: [] }
		]);

		// 1. Process Budgets
		const budgetData = budgetRes.data || [];
		let totalLimits = 0;
		let currentCorpusLimit = 0;
		/** @type {Record<string, string>} */
		const categoryIdMap = {};

		budgetData.forEach((b) => {
			if (b.category_id) categoryIdMap[b.category_id] = b.category;
			const limit = Number(b.limit_amount || 0);
			if (limit !== -1) {
				totalLimits += limit;
				if (b.budget_type === 'corpus') {
					currentCorpusLimit += limit;
				}
			}
		});
		this.corpusLimit = currentCorpusLimit;

		// 2. Process RPC Usage Data first so we can attach period_start to budgetData
		/** @type {Record<string, number>} */
		const totals = {};
		const cats = new Set();
		const rpcData = rpcRes?.data || [];

		// Map RPC response to totals and attach to budgetData
		rpcData.forEach((/** @type {any} */ row) => {
			const catName = categoryIdMap[row.category_id];
			if (catName) {
				totals[catName] = row.used_amount;
				if (row.used_amount > 0) {
					cats.add(catName); // For checklist
				}
			}
			// Save period start to budget object
			const bIdx = budgetData.findIndex(b => b.category_id === row.category_id);
			if (bIdx > -1) {
				budgetData[bIdx].current_period_start = row.period_start;
			}
		});

		this.budgets = budgetData
			.filter(b => b.budget_type === 'variable' && Number(b.limit_amount || 0) !== -1)
			.map(b => ({ ...b, id: b.category_id || b.category, category_id: b.category_id || b.category }));

		this.corpusBudgets = budgetData
			.filter(b => b.budget_type === 'corpus' && Number(b.limit_amount || 0) !== -1)
			.map(b => ({ ...b, id: b.category_id || b.category, category_id: b.category_id || b.category }));

		this.fixedBudgets = budgetData
			.filter(b => b.budget_type === 'fixed' && Number(b.limit_amount || 0) !== -1)
			.map(b => ({ ...b, id: b.category_id || b.category, category_id: b.category_id || b.category }));

		this.transactionCategories = cats;
		this.categoryTotals = totals;
		this.currentPeriodTransactions = []; // No longer tracking a specific period of txs here

		// 3. Process Full History for Balances
		/** @type {any[]} */
		const allHistory = allHistoryRes.data || [];
		let totalBalance = 0;
		let periodCorpusSum = 0;
		let corpusSum = 0;

		if (allHistory) {
			allHistory.forEach((tx) => {
				tx.category = categoryIdMap[tx.category_id] || tx.category || 'Unknown';
				const amount = Number(tx.amount);

				totalBalance += amount;

				// Corpus calculation: Past transactions only
				let isPast = false;
				const b = budgetData.find(b => b.category_id === tx.category_id);
				if (b && Number(b.limit_amount || 0) !== -1) {
					// Budgeted category
					if (b.current_period_start) {
						if (new Date(tx.transaction_date) < new Date(b.current_period_start)) {
							isPast = true;
						}
					} else {
						isPast = true;
					}
				} else {
					// Unbudgeted category (limit is -1 or no budget). Always past/unallocated.
					isPast = true;
				}

				if (isPast) {
					corpusSum += amount;
				}

				if (tx.category && tx.category.toLowerCase() === 'personal corpus' && !isPast) {
					periodCorpusSum += amount;
				}
			});
		}

		this.globalLiquidBalance = corpusSum - totalLimits;
		this.currentPeriodCorpusUsed = periodCorpusSum;
		this.totalAccountBalance = totalBalance;

		this.loading = false;
	}
}

export const appData = new DataStore();
