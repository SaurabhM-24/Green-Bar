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
	
	/** @type {Record<string, number>} Total spent per category in the current month */
	categoryTotals = $state({});
	
	/** @type {any[]} List of corpus (savings) budgets */
	corpusBudgets = $state([]);
	
	/** @type {any[]} List of fixed budgets */
	fixedBudgets = $state([]);
	
	/** @type {Set<string>} Unique categories used in transactions this month */
	transactionCategories = $state(new Set());
	
	/** @type {number} Total liquid balance (all time credits minus debits prior to this month) */
	globalLiquidBalance = $state(0);
	
	/** @type {number} Amount added/removed from personal corpus this month */
	currentMonthCorpusUsed = $state(0);
	
	/** @type {number} Net total account balance all time */
	totalAccountBalance = $state(0);
	
	/** @type {number} Total monthly limit for corpus budgets */
	corpusLimit = $state(0);
	
	/** @type {string} Authenticated user's display name */
	userName = $state('User');

	/**
	 * @description Derived total variable expenses used in the current month.
	 * Calculated by summing the categoryTotals for all variable budgets.
	 */
	totalVariableUsed = $derived(
		this.budgets.reduce((sum, b) => sum + (this.categoryTotals[b.category] || 0), 0)
	);
	
	/**
	 * @description Derived total limit for all variable expenses combined.
	 */
	totalVariableLimit = $derived(
		this.budgets.reduce((sum, b) => sum + Number(b.monthly_limit || 0), 0)
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
			return 'Looking good this month!';
		}
		return 'Welcome to your financial hub.';
	});

	/**
	 * @description Fetches all required dashboard data asynchronously in parallel.
	 * @param {number} m - Month (1-12)
	 * @param {number} y - Year (e.g., 2026)
	 */
	async loadData(m, y) {
		this.loading = true;
		const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
		const lastDay = new Date(y, m, 0).getDate();
		const endDate = `${y}-${String(m).padStart(2, '0')}-${lastDay}T23:59:59`;

		const pmList = new Date(y, m - 2, 1);
		const prevM = pmList.getMonth() + 1;
		const prevY = pmList.getFullYear();
		const prevMonthStart = `${prevY}-${String(prevM).padStart(2, '0')}-01`;

		// Fetch user profile securely
		const fetchProfile = async () => {
			if (this.userName !== 'User') return;
			const { data: sessionData } = await supabase.auth.getSession();
			if (sessionData?.session?.user) {
				const { data: profile } = await supabase
					.from('profiles')
					.select('first_name')
					.eq('id', sessionData.session.user.id)
					.single();
					
				if (profile?.first_name) {
					this.userName = profile.first_name;
				} else if (sessionData.session.user.user_metadata?.first_name) {
					this.userName = sessionData.session.user.user_metadata.first_name;
				} else if (sessionData.session.user.email) {
					this.userName = sessionData.session.user.email.split('@')[0];
				}
			}
		};

		// Execute all Supabase queries concurrently
		const [budgetRes, txRes, allHistoryRes] = await Promise.all([
			supabase.from('budgets').select('*').order('sort_order', { ascending: true }),
			supabase.from('transactions').select('category, amount, transaction_type, transaction_date')
				.gte('transaction_date', prevMonthStart).lte('transaction_date', endDate),
			supabase.from('transactions').select('amount, transaction_type, transaction_date, category'),
			fetchProfile()
		]);

		// 1. Process Budgets
		const budgetData = budgetRes.data;
		let totalMonthlyLimits = 0;
		let currentCorpusLimit = 0;
		
		if (budgetData) {
			this.budgets = budgetData
				.filter(b => b.budget_type === 'variable')
				.map(b => ({ ...b, id: b.category_id || b.category, category_id: b.category_id || b.category }));
				
			this.corpusBudgets = budgetData
				.filter(b => b.budget_type === 'corpus')
				.map(b => ({ ...b, id: b.category_id || b.category, category_id: b.category_id || b.category }));
				
			this.fixedBudgets = budgetData
				.filter(b => b.budget_type === 'fixed')
				.map(b => ({ ...b, id: b.category_id || b.category, category_id: b.category_id || b.category }));

			budgetData.forEach((b) => {
				totalMonthlyLimits += Number(b.monthly_limit || 0);
				if (b.budget_type === 'corpus') {
					currentCorpusLimit += Number(b.monthly_limit || 0);
				}
			});
		}
		this.corpusLimit = currentCorpusLimit;

		// 2. Process Transactions (Current & Previous month for checklist and totals)
		const txData = txRes.data;
		const cats = new Set();
		/** @type {Record<string, number>} */
		const totals = {};

		if (txData) {
			txData.forEach((tx) => {
				if (!tx.category) return;
				
				// Fixed checklist logic
				if (tx.category === 'Salary') {
					if (tx.transaction_date >= prevMonthStart && tx.transaction_date < startDate) {
						cats.add(tx.category);
					}
				} else {
					if (tx.transaction_date >= startDate) {
						cats.add(tx.category);
					}
				}

				// Variable totals logic (Current month only)
				if (tx.transaction_date >= startDate && tx.transaction_date <= endDate) {
					// tx.amount is stored correctly signed in the DB (negative for debit)
					// So subtracting negative adds to the total used.
					totals[tx.category] = (totals[tx.category] || 0) - Number(tx.amount);
				}
			});
		}
		this.transactionCategories = cats;
		this.categoryTotals = totals;

		// 3. Process Global All-Time Sums
		const allHistory = allHistoryRes.data;
		let liquidTillLastMonth = 0;
		let monthCorpusSum = 0;
		let totalBalance = 0;

		if (allHistory) {
			allHistory.forEach((tx) => {
				const val = Math.abs(Number(tx.amount));
				const isCredit = tx.transaction_type.toLowerCase() === 'credit';

				if (isCredit) totalBalance += val;
				else totalBalance -= val;

				if (tx.transaction_date < startDate) {
					if (isCredit) liquidTillLastMonth += val;
					else liquidTillLastMonth -= val;
				}

				if (
					tx.transaction_date >= startDate &&
					tx.transaction_date <= endDate &&
					tx.category &&
					tx.category.toLowerCase() === 'personal corpus'
				) {
					if (isCredit) monthCorpusSum += val;
					else monthCorpusSum -= val;
				}
			});
		}
		
		this.globalLiquidBalance = liquidTillLastMonth - totalMonthlyLimits;
		this.currentMonthCorpusUsed = monthCorpusSum;
		this.totalAccountBalance = totalBalance;

		this.loading = false;
	}
}

export const appData = new DataStore();
