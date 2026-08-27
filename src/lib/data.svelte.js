import { supabase } from '$lib/supabase';
import { cryptoStore } from '$lib/cryptoStore.svelte';
import { decryptData } from '$lib/crypto';

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

	/** @type {any[]} List of all transactions all time */
	allTransactions = $state([]);

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
		this.budgets.reduce((sum, b) => sum + (this.categoryTotals[b.id] || 0), 0)
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

		if (!cryptoStore.dmk) {
			console.warn("DMK not available. Cannot decrypt data.");
			this.loading = false;
			return;
		}

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
		if (!userId) {
			this.loading = false;
			return;
		}

		// Execute all Supabase queries concurrently against ENCRYPTED tables
		const [budgetRes, allHistoryRes] = await Promise.all([
			supabase
				.from('budgets_encrypted')
				.select('*')
				.eq('user_id', userId),
			supabase
				.from('transactions_encrypted')
				.select('*')
				.eq('user_id', userId)
		]);

		const rawBudgets = budgetRes.data || [];
		const rawTransactions = allHistoryRes.data || [];

		// Decrypt all budgets concurrently
		const budgetPromises = rawBudgets.map(async (row) => {
			try {
				const plaintext = await decryptData(row.encrypted_data, /** @type {CryptoKey} */ (cryptoStore.dmk));
				const data = JSON.parse(plaintext);
				return { ...data, category_id: row.category_id };
			} catch (err) {
				console.error("Failed to decrypt budget", row.category_id, err);
				return null;
			}
		});

		// Decrypt all transactions concurrently
		const transactionPromises = rawTransactions.map(async (row) => {
			try {
				const plaintext = await decryptData(row.encrypted_data, /** @type {CryptoKey} */ (cryptoStore.dmk));
				const data = JSON.parse(plaintext);
				return { ...data, id: row.id, user_id: row.user_id };
			} catch (err) {
				console.error("Failed to decrypt transaction", row.id, err);
				return null;
			}
		});

		const budgetData = (await Promise.all(budgetPromises)).filter(Boolean);
		// Sort budgets natively (replacing Postgres ORDER BY)
		budgetData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

		const allHistory = (await Promise.all(transactionPromises)).filter(Boolean);
		this.allTransactions = allHistory;

		// 1. Process Budgets
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

		// --- DATE MATH: Replacing Postgres get_budget_usage RPC ---
		const today = new Date();
		const todayYear = today.getFullYear();
		const todayMonth = today.getMonth();
		const todayDate = today.getDate();
		const todayDayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
		
		const todayMidnight = new Date(todayYear, todayMonth, todayDate);

		budgetData.forEach((b) => {
			let calcStart = null;
			
			if (b.period_type === 'monthly') {
				const resetDate = parseInt(b.reset_date) || 1;
				if (todayDate < resetDate) {
					calcStart = new Date(todayYear, todayMonth - 1, resetDate);
				} else {
					calcStart = new Date(todayYear, todayMonth, resetDate);
				}
			} else if (b.period_type === 'weekly') {
				const resetDate = parseInt(b.reset_date) || 0;
				let diff = todayDayOfWeek - resetDate;
				if (diff < 0) diff += 7;
				calcStart = new Date(todayYear, todayMonth, todayDate - diff);
			} else if (b.period_type === 'yearly') {
				const resetDate = parseInt(b.reset_date) || 1; 
				const startOfYear = new Date(todayYear, 0, 1);
				const currentDOY = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
				
				if (currentDOY < resetDate) {
					calcStart = new Date(todayYear - 1, 0, 1);
					calcStart.setDate(calcStart.getDate() + resetDate - 1);
				} else {
					calcStart = new Date(todayYear, 0, 1);
					calcStart.setDate(calcStart.getDate() + resetDate - 1);
				}
			} else if (b.period_type === 'daily') {
				calcStart = todayMidnight;
			} else if (b.period_type === 'manual') {
				calcStart = b.last_manual_reset ? new Date(b.last_manual_reset) : null;
			}

			b.current_period_start = calcStart;
		});

		// 2. Process Transactions (replacing RPC sum logic & history balances)
		/** @type {Record<string, number>} */
		const totals = {};
		const cats = new Set();
		let totalBalance = 0;
		let periodCorpusSum = 0;
		let corpusSum = 0;

		allHistory.forEach((tx) => {
			const txDate = new Date(tx.transaction_date || tx.created_at);
			const catName = categoryIdMap[tx.category_id] || tx.category || 'Unknown';
			const catId = tx.category_id || 'unknown';
			const amount = Number(tx.amount);
			tx.category = catName;

			totalBalance += amount;

			// --- Current Period Usage (Replacing get_budget_usage) ---
			const b = budgetData.find((b) => b.category_id === tx.category_id);
			if (b) {
				if (b.current_period_start && txDate >= b.current_period_start) {
					totals[catId] = (totals[catId] || 0) + Math.abs(amount); 
					cats.add(catId);
				}
			}

			// --- Corpus Calculation ---
			let isPast = false;
			if (b && Number(b.limit_amount || 0) !== -1) {
				if (b.current_period_start) {
					if (txDate < b.current_period_start) isPast = true;
				} else {
					isPast = true;
				}
			} else {
				isPast = true;
			}
			if (isPast) corpusSum += amount;
			if ((catName.toLowerCase() === 'personal corpus' || catName.toLowerCase() === 'leftover') && !isPast) periodCorpusSum += amount;
		});

		this.categoryTotals = totals;
		this.transactionCategories = cats;
		this.currentPeriodTransactions = [];

		this.budgets = budgetData
			.filter((b) => b.budget_type === 'variable' && Number(b.limit_amount || 0) !== -1)
			.map((b) => ({
				...b,
				id: b.category_id || b.category
			}));

		this.corpusBudgets = budgetData
			.filter((b) => b.budget_type === 'corpus' && Number(b.limit_amount || 0) !== -1)
			.map((b) => ({
				...b,
				id: b.category_id || b.category
			}));

		this.fixedBudgets = budgetData
			.filter((b) => b.budget_type === 'fixed' && Number(b.limit_amount || 0) !== -1)
			.map((b) => ({
				...b,
				id: b.category_id || b.category
			}));

		this.globalLiquidBalance = corpusSum - totalLimits;
		this.currentPeriodCorpusUsed = periodCorpusSum;
		this.totalAccountBalance = totalBalance;

		this.loading = false;
	}


}

export const appData = new DataStore();
