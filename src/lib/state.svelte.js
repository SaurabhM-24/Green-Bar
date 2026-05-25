/**
 * @class State
 * @description Manages global temporal state (month and year) for the Expense Tracker.
 */
class State {
	/** @type {number} The currently selected month (1-12) */
	month = $state(new Date().getMonth() + 1);
	
	/** @type {number} The currently selected year (e.g., 2026) */
	year = $state(new Date().getFullYear());

	/**
	 * @description Returns the full localized string name of the currently selected month.
	 * @returns {string} e.g., 'January'
	 */
	get monthName() {
		return new Date(this.year, this.month - 1).toLocaleString('default', { month: 'long' });
	}

	/**
	 * @description Decrements the global month, rolling back the year if crossing January.
	 */
	prevMonth() {
		if (this.month === 1) {
			this.month = 12;
			this.year--;
		} else {
			this.month--;
		}
	}

	/**
	 * @description Increments the global month, rolling forward the year if crossing December.
	 */
	nextMonth() {
		if (this.month === 12) {
			this.month = 1;
			this.year++;
		} else {
			this.month++;
		}
	}
}

export const appState = new State();
