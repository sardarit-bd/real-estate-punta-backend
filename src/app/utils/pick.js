export const pick = (obj, keys) => {
  // Validate input parameters
  if (obj === null || obj === undefined) {
    console.warn('Warning: First parameter (obj) is null or undefined. Returning empty object.');
    return {};
  }
  
  if (typeof obj !== 'object') {
    throw new TypeError(`First parameter must be an object, got ${typeof obj}`);
  }
  
  if (Array.isArray(obj)) {
    throw new TypeError('First parameter must be a plain object, not an array');
  }
  
  if (!keys || !Array.isArray(keys)) {
    throw new TypeError('Second parameter (keys) must be an array');
  }
  
  if (keys.length === 0) {
    console.warn('Warning: keys array is empty. Returning empty object.');
    return {};
  }
  
  // Validate each key in the keys array
  const invalidKeys = keys.filter(key => typeof key !== 'string');
  if (invalidKeys.length > 0) {
    throw new TypeError(`All keys must be strings. Invalid keys: ${invalidKeys.join(', ')}`);
  }
  
  // Create result object
  const result = {};
  
  keys.forEach(key => {
    // Check if key exists in object using proper property check
    if (obj !== null && obj !== undefined && Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = obj[key];
    }
  });
  
  // Optional: Log if no keys were found (for debugging)
  if (Object.keys(result).length === 0 && keys.length > 0) {
    console.warn(`No matching keys found. Requested keys: ${keys.join(', ')}, Available keys: ${Object.keys(obj).join(', ')}`);
  }
  
  return result;
};