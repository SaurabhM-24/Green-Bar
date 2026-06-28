/**
 * Svelte action that triggers a callback when a click happens outside the node.
 *
 * @param {HTMLElement} node
 * @param {{ enabled?: boolean, ignore?: HTMLElement | null, handler: () => void }} params
 */
export function clickOutside(node, { enabled = true, ignore = null, handler }) {
	/** @param {Event} event */
	const handleClick = (event) => {
		const target = /** @type {Node} */ (event.target);
		if (
			enabled &&
			node &&
			!node.contains(target) &&
			(!ignore || !ignore.contains(target)) &&
			!event.defaultPrevented
		) {
			handler();
		}
	};

	document.addEventListener('click', handleClick, true);

	return {
		/** @param {{ enabled?: boolean, ignore?: HTMLElement | null, handler: () => void }} newParams */
		update(newParams) {
			enabled = newParams.enabled ?? true;
			ignore = newParams.ignore ?? null;
			handler = newParams.handler;
		},
		destroy() {
			document.removeEventListener('click', handleClick, true);
		}
	};
}
