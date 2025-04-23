// csvUtils.ts

/**
 * Compare two arrays of strings for equality.
 */
export const areArraysIdentical = (arr1: string[], arr2: string[]): boolean => {
	if (arr1.length !== arr2.length) return false;
	return arr1.every((value, index) => {
		if (value !== arr2[index]) {
			console.log(
				`Header mismatch at position ${index}: Expected '${arr1[index]}', but got '${arr2[index]}'`,
			);
			return false;
		}
		return true;
	});
};
