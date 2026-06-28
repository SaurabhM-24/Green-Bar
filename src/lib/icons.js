/** @type {Record<string, string>} */
const webpFiles = /** @type {any} */ (
	import.meta.glob('/src/lib/assets/icons/*.webp', {
		eager: true,
		query: '?url',
		import: 'default'
	})
);

/** @type {Record<string, string>} */
const avifFiles = /** @type {any} */ (
	import.meta.glob('/src/lib/assets/icons/*.avif', {
		eager: true,
		query: '?url',
		import: 'default'
	})
);

/**
 * @typedef {Object} IconData
 * @property {string} name
 * @property {string} webp
 * @property {string | null} avif
 */

/** @type {IconData[]} */
export const iconsList = [];

/** @type {Record<string, IconData>} */
export const iconMap = {};

for (const path in webpFiles) {
	const filename = path.split('/').pop();
	const name = (filename || '').replace('.webp', '');
	const avifPath = path.replace('.webp', '.avif');

	/** @type {IconData} */
	const iconObj = {
		name,
		webp: webpFiles[path],
		avif: avifFiles[avifPath] || null
	};

	iconsList.push(iconObj);
	iconMap[name] = iconObj;
}
