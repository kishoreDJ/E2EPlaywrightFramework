/**
 * JSON Utilities - Comprehensive JSON parsing, validation, and manipulation
 * Supports JSONPath queries, comparisons, and all JSON operations
 */
export interface JSONPathResult {
    path: string;
    value: any;
    exists: boolean;
}
export interface ComparisonResult {
    matches: boolean;
    differences: Array<{
        path: string;
        expected: any;
        actual: any;
    }>;
}
export declare class JSONParser {
    /**
     * Safely parse JSON string
     */
    static parse(jsonString: string): object;
    /**
     * Check if string is valid JSON
     */
    static isValidJSON(jsonString: string): boolean;
    /**
     * Stringify object with pretty formatting
     */
    static stringify(obj: any, indent?: number): string;
}
export declare class JSONNodeAccessor {
    /**
     * Get value at JSONPath
     * Usage: getValue(data, '$.user.profile.email')
     */
    static getValue(json: object, path: string): any;
    /**
     * Get all values matching JSONPath (supports wildcards)
     * Usage: getValues(data, '$.users[*].email')
     */
    static getValues(json: object, path: string): any[];
    /**
     * Get the path to all matching values
     * Usage: getValuePaths(data, '$.users[*]')
     */
    static getValuePaths(json: object, path: string): string[];
    /**
     * Check if path exists in JSON
     */
    static nodeExists(json: object, path: string): boolean;
    /**
     * Get value with detailed info
     */
    static getNodeInfo(json: object, path: string): JSONPathResult;
}
export declare class JSONNodeValidator {
    /**
     * Check if node value is null
     */
    static isNull(json: object, path: string): boolean;
    /**
     * Check if node value is undefined or null
     */
    static isNullOrUndefined(json: object, path: string): boolean;
    /**
     * Check if node value is not null
     */
    static isNotNull(json: object, path: string): boolean;
    /**
     * Check if node exists and has a value
     */
    static hasValue(json: object, path: string): boolean;
    /**
     * Check if node value is empty
     */
    static isEmpty(json: object, path: string): boolean;
    /**
     * Validate node type
     */
    static getType(json: object, path: string): string;
    /**
     * Check if value matches type
     */
    static isType(json: object, path: string, expectedType: string): boolean;
    /**
     * Check if value equals expected
     */
    static equals(json: object, path: string, expected: any): boolean;
    /**
     * Check if value contains string
     */
    static contains(json: object, path: string, searchValue: string): boolean;
    /**
     * Check if value matches regex
     */
    static matchesRegex(json: object, path: string, pattern: RegExp | string): boolean;
    /**
     * Check if numeric value is greater than
     */
    static isGreaterThan(json: object, path: string, compareValue: number): boolean;
    /**
     * Check if numeric value is less than
     */
    static isLessThan(json: object, path: string, compareValue: number): boolean;
    /**
     * Check if numeric value is in range
     */
    static isInRange(json: object, path: string, min: number, max: number): boolean;
}
export declare class JSONArrayUtility {
    /**
     * Get array size
     */
    static getArraySize(json: object, path: string): number;
    /**
     * Check if array size equals expected
     */
    static arraySizeEquals(json: object, path: string, expectedSize: number): boolean;
    /**
     * Check if array size is greater than
     */
    static arraySizeGreaterThan(json: object, path: string, size: number): boolean;
    /**
     * Check if array is empty
     */
    static isArrayEmpty(json: object, path: string): boolean;
    /**
     * Get array item by index
     */
    static getArrayItem(json: object, path: string, index: number): any;
    /**
     * Check if array contains item
     */
    static arrayContains(json: object, path: string, item: any): boolean;
    /**
     * Check if array contains object with property value
     */
    static arrayContainsObjectWithProperty(json: object, path: string, propertyName: string, propertyValue: any): boolean;
    /**
     * Add item to array
     */
    static addArrayItem(json: object, path: string, item: any): object;
    /**
     * Remove item from array by index
     */
    static removeArrayItem(json: object, path: string, index: number): object;
    /**
     * Filter array by property value
     */
    static filterArray(json: object, path: string, propertyName: string, propertyValue: any): any[];
}
export declare class JSONPropertyManipulator {
    /**
     * Set value at JSONPath
     */
    static setNodeValue(json: object, path: string, value: any): object;
    /**
     * Add new property to object
     */
    static addProperty(json: object, parentPath: string, key: string, value: any): object;
    /**
     * Remove property from object
     */
    static removeProperty(json: object, path: string): object;
    /**
     * Rename property
     */
    static renameProperty(json: object, path: string, newName: string): object;
    /**
     * Update nested object
     */
    static mergeProperties(json: object, path: string, updateObject: Record<string, any>): object;
}
export declare class JSONComparator {
    /**
     * Deep equality check
     */
    static deepEquals(obj1: any, obj2: any): boolean;
    /**
     * Partial match (check if actual contains all properties of expected)
     */
    static partialMatch(actual: Record<string, any>, expected: Record<string, any>): boolean;
    /**
     * Compare two JSON objects and return differences
     */
    static compare(json1: object, json2: object): ComparisonResult;
    /**
     * Remove specified fields before comparison
     */
    static ignoreFields(json: object, fieldsToIgnore: string[]): object;
    /**
     * Normalize JSON for comparison (remove dynamic fields)
     */
    static normalizeForComparison(json: object, fieldsToRemove?: string[]): object;
}
//# sourceMappingURL=json-utilities.d.ts.map