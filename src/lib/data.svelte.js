import { supabase } from '$lib/supabase';

class DataStore {
	loading = $state(true);
	
	/** @type {any[]} */
	budgets = $state([]);
	
	/** @type {Record<string, number>} */
	categoryTotals = $state({});
	
	/** @type {any[]} */
	corpusBudgets = $state([]);
	
	/** @type {any[]} */
	fixedBudgets = $state([]);
	
	/** @type {Set<string>} */
	transactionCategories = $state(new Set());
	
	globalLiquidBalance = $state(0);
	currentMonthCorpusUsed = $state(0);
	totalAccountBalance = $state(0);
	corpusLimit = $state(0);
	userName = $state('User');

	totalVariableUsed = $derived(
		this.budgets.reduce((sum, b) => sum + (this.categoryTotals[b.category] || 0), 0)
	);
	
	totalVariableLimit = $derived(
		this.budgets.reduce((sum, b) => sum + Number(b.monthly_limit || 0), 0)
	);

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
	 * @param {number} m
	 * @param {number} y
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

		// 1. Fetch Budgets
		const { data: budgetData } = await supabase
			.from('budgets')
			.select('*')
			.order('sort_order', { ascending: true });

		let totalMonthlyLimits = 0;
		let currentCorpusLimit = 0;
		if (budgetData) {
			this.budgets = budgetData.filter(b => b.budget_type === 'variable').map(b => ({ ...b, id: b.id || b.category }));
			this.corpusBudgets = budgetData.filter((b) => b.budget_type === 'corpus');
			this.fixedBudgets = budgetData
				.filter((b) => b.budget_type === 'fixed')
				.map((b) => ({ ...b, id: b.id || b.category }));
			budgetData.forEach((b) => {
				totalMonthlyLimits += Number(b.monthly_limit || 0);
				if (b.budget_type === 'corpus') {
					currentCorpusLimit += Number(b.monthly_limit || 0);
				}
			});
		}
		this.corpusLimit = currentCorpusLimit;

		// 2. Fetch Transactions for the checklist and totals
		const { data: txData } = await supabase
			.from('transactions')
			.select('category, amount, transaction_type, transaction_date')
			.gte('transaction_date', prevMonthStart)
			.lte('transaction_date', endDate);

		const cats = new Set();
		/** @type {Record<string, number>} */
		const totals = {};

		if (txData) {
			txData.forEach((tx) => {
				if (tx.category) {
					// Logic for fixed checklist
					if (tx.category === 'Salary') {
						if (tx.transaction_date >= prevMonthStart && tx.transaction_date < startDate) {
							cats.add(tx.category);
						}
					} else {
						if (tx.transaction_date >= startDate) {
							cats.add(tx.category);
						}
					}

					// Logic for variable totals (only current month)
					if (tx.transaction_date >= startDate && tx.transaction_date <= endDate) {
						totals[tx.category] = (totals[tx.category] || 0) - Number(tx.amount);
					}
				}
			});
		}
		this.transactionCategories = cats;
		this.categoryTotals = totals;

		// 3. Global All Time Sum query for Personal Corpus
		const { data: allHistory } = await supabase
			.from('transactions')
			.select('amount, transaction_type, transaction_date, category');

		let liquidTillLastMonth = 0;
		let monthCorpusSum = 0;
		let totalBalance = 0;
		if (allHistory) {
			allHistory.forEach((tx) => {
				const val = Math.abs(Number(tx.amount));

				if (tx.transaction_type.toLowerCase() === 'credit') totalBalance += val;
				else totalBalance -= val;

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
		this.globalLiquidBalance = liquidTillLastMonth - totalMonthlyLimits;
		this.currentMonthCorpusUsed = monthCorpusSum;
		this.totalAccountBalance = totalBalance;

		if (this.userName === 'User') {
			const { data: sessionData } = await supabase.auth.getSession();
			if (sessionData.session?.user) {
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
		}

		this.loading = false;
	}
}

export const appData = new DataStore();
