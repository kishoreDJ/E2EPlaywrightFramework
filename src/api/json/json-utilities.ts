/**
 * JSON Utilities - Comprehensive JSON parsing, validation, and manipulation
 * Supports JSONPath queries, comparisons, and all JSON operations
 */

import jp from 'jsonpath-plus';

// ==========================================
// Types & Interfaces
// ==========================================

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

// ==========================================
// JSON Parser
// ==========================================

export class JSONParser {
  /**
   * Safely parse JSON string
   */
  public static parse(jsonString: string): object {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error}`);
    }
  }

  /**
   * Check if string is valid JSON
   */
  public static isValidJSON(jsonString: string): boolean {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Stringify object with pretty formatting
   */
  public static stringify(obj: any, indent: number = 2): string {
    return JSON.stringify(obj, null, indent);
  }
}

// ==========================================
// JSON Node Accessor (JSONPath)
// ==========================================

export class JSONNodeAccessor {
  /**
   * Get value at JSONPath
   * Usage: getValue(data, '$.user.profile.email')
   */
  public static getValue(
    json: object,
    path: string
  ): any {
    try {
      const results = jp.JSONPath({ path, json, resultType: 'value' });
      return results.length > 0 ? results[0] : undefined;
    } catch (error) {
      throw new Error(`Failed to get value at path ${path}: ${error}`);
    }
  }

  /**
   * Get all values matching JSONPath (supports wildcards)
   * Usage: getValues(data, '$.users[*].email')
   */
  public static getValues(
    json: object,
    path: string
  ): any[] {
    try {
      return jp.JSONPath({ path, json, resultType: 'value' });
    } catch (error) {
      throw new Error(`Failed to get values at path ${path}: ${error}`);
    }
  }

  /**
   * Get the path to all matching values
   * Usage: getValuePaths(data, '$.users[*]')
   */
  public static getValuePaths(
    json: object,
    path: string
  ): string[] {
    try {
      return jp.JSONPath({ path, json, resultType: 'path' });
    } catch (error) {
      throw new Error(`Failed to get paths at ${path}: ${error}`);
    }
  }

  /**
   * Check if path exists in JSON
   */
  public static nodeExists(json: object, path: string): boolean {
    try {
      const results = jp.JSONPath({ path, json, resultType: 'value' });
      return results.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get value with detailed info
   */
  public static getNodeInfo(
    json: object,
    path: string
  ): JSONPathResult {
    try {
      const values = jp.JSONPath({ path, json, resultType: 'value' });
      const exists = values.length > 0;

      return {
        path,
        value: exists ? values[0] : undefined,
        exists,
      };
    } catch (error) {
      return {
        path,
        value: undefined,
        exists: false,
      };
    }
  }
}

// ==========================================
// JSON Node Validator
// ==========================================

export class JSONNodeValidator {
  /**
   * Check if node value is null
   */
  public static isNull(json: object, path: string): boolean {
    const value = JSONNodeAccessor.getValue(json, path);
    return value === null;
  }

  /**
   * Check if node value is undefined or null
   */
  public static isNullOrUndefined(json: object, path: string): boolean {
    const value = JSONNodeAccessor.getValue(json, path);
    return value === null || value === undefined;
  }

  /**
   * Check if node value is not null
   */
  public static isNotNull(json: object, path: string): boolean {
    return !this.isNull(json, path);
  }

  /**
   * Check if node exists and has a value
   */
  public static hasValue(json: object, path: string): boolean {
    const value = JSONNodeAccessor.getValue(json, path);
    return value !== null && value !== undefined && value !== '';
  }

  /**
   * Check if node value is empty
   */
  public static isEmpty(json: object, path: string): boolean {
    const value = JSONNodeAccessor.getValue(json, path);

    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === 'string') {
      return value.trim() === '';
    }

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }

    return false;
  }

  /**
   * Validate node type
   */
  public static getType(json: object, path: string): string {
    const value = JSONNodeAccessor.getValue(json, path);

    if (value === null) {
      return 'null';
    }

    if (Array.isArray(value)) {
      return 'array';
    }

    return typeof value;
  }

  /**
   * Check if value matches type
   */
  public static isType(
    json: object,
    path: string,
    expectedType: string
  ): boolean {
    const actualType = this.getType(json, path);
    return actualType === expectedType;
  }

  /**
   * Check if value equals expected
   */
  public static equals(
    json: object,
    path: string,
    expected: any
  ): boolean {
    const value = JSONNodeAccessor.getValue(json, path);
    return value === expected;
  }

  /**
   * Check if value contains string
   */
  public static contains(
    json: object,
    path: string,
    searchValue: string
  ): boolean {
    const value = JSONNodeAccessor.getValue(json, path);

    if (typeof value === 'string') {
      return value.includes(searchValue);
    }

    if (Array.isArray(value)) {
      return value.some((item) =>
        typeof item === 'string' ? item.includes(searchValue) : false
      );
    }

    return false;
  }

  /**
   * Check if value matches regex
   */
  public static matchesRegex(
    json: object,
    path: string,
    pattern: RegExp | string
  ): boolean {
    const value = JSONNodeAccessor.getValue(json, path);
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    if (typeof value === 'string') {
      return regex.test(value);
    }

    return false;
  }

  /**
   * Check if numeric value is greater than
   */
  public static isGreaterThan(
    json: object,
    path: string,
    compareValue: number
  ): boolean {
    const value = JSONNodeAccessor.getValue(json, path);
    return typeof value === 'number' && value > compareValue;
  }

  /**
   * Check if numeric value is less than
   */
  public static isLessThan(
    json: object,
    path: string,
    compareValue: number
  ): boolean {
    const value = JSONNodeAccessor.getValue(json, path);
    return typeof value === 'number' && value < compareValue;
  }

  /**
   * Check if numeric value is in range
   */
  public static isInRange(
    json: object,
    path: string,
    min: number,
    max: number
  ): boolean {
    const value = JSONNodeAccessor.getValue(json, path);
    return (
      typeof value === 'number' && value >= min && value <= max
    );
  }
}

// ==========================================
// JSON Array Utilities
// ==========================================

export class JSONArrayUtility {
  /**
   * Get array size
   */
  public static getArraySize(json: object, path: string): number {
    const value = JSONNodeAccessor.getValue(json, path);

    if (!Array.isArray(value)) {
      throw new Error(`Path ${path} does not point to an array`);
    }

    return value.length;
  }

  /**
   * Check if array size equals expected
   */
  public static arraySizeEquals(
    json: object,
    path: string,
    expectedSize: number
  ): boolean {
    try {
      return this.getArraySize(json, path) === expectedSize;
    } catch {
      return false;
    }
  }

  /**
   * Check if array size is greater than
   */
  public static arraySizeGreaterThan(
    json: object,
    path: string,
    size: number
  ): boolean {
    try {
      return this.getArraySize(json, path) > size;
    } catch {
      return false;
    }
  }

  /**
   * Check if array is empty
   */
  public static isArrayEmpty(json: object, path: string): boolean {
    try {
      return this.getArraySize(json, path) === 0;
    } catch {
      return false;
    }
  }

  /**
   * Get array item by index
   */
  public static getArrayItem(
    json: object,
    path: string,
    index: number
  ): any {
    const value = JSONNodeAccessor.getValue(json, path);

    if (!Array.isArray(value)) {
      throw new Error(`Path ${path} does not point to an array`);
    }

    if (index < 0 || index >= value.length) {
      throw new Error(`Index ${index} out of bounds for array of size ${value.length}`);
    }

    return value[index];
  }

  /**
   * Check if array contains item
   */
  public static arrayContains(
    json: object,
    path: string,
    item: any
  ): boolean {
    try {
      const value = JSONNodeAccessor.getValue(json, path);

      if (!Array.isArray(value)) {
        return false;
      }

      return value.some((arrItem) => JSON.stringify(arrItem) === JSON.stringify(item));
    } catch {
      return false;
    }
  }

  /**
   * Check if array contains object with property value
   */
  public static arrayContainsObjectWithProperty(
    json: object,
    path: string,
    propertyName: string,
    propertyValue: any
  ): boolean {
    try {
      const value = JSONNodeAccessor.getValue(json, path);

      if (!Array.isArray(value)) {
        return false;
      }

      return value.some(
        (item) =>
          typeof item === 'object' &&
          item !== null &&
          item[propertyName] === propertyValue
      );
    } catch {
      return false;
    }
  }

  /**
   * Add item to array
   */
  public static addArrayItem(
    json: object,
    path: string,
    item: any
  ): object {
    const cloned = JSON.parse(JSON.stringify(json));
    const value = JSONNodeAccessor.getValue(cloned, path);

    if (!Array.isArray(value)) {
      throw new Error(`Path ${path} does not point to an array`);
    }

    value.push(item);
    return cloned;
  }

  /**
   * Remove item from array by index
   */
  public static removeArrayItem(
    json: object,
    path: string,
    index: number
  ): object {
    const cloned = JSON.parse(JSON.stringify(json));
    const value = JSONNodeAccessor.getValue(cloned, path);

    if (!Array.isArray(value)) {
      throw new Error(`Path ${path} does not point to an array`);
    }

    value.splice(index, 1);
    return cloned;
  }

  /**
   * Filter array by property value
   */
  public static filterArray(
    json: object,
    path: string,
    propertyName: string,
    propertyValue: any
  ): any[] {
    const value = JSONNodeAccessor.getValue(json, path);

    if (!Array.isArray(value)) {
      throw new Error(`Path ${path} does not point to an array`);
    }

    return value.filter(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        item[propertyName] === propertyValue
    );
  }
}

// ==========================================
// JSON Property Manipulator
// ==========================================

export class JSONPropertyManipulator {
  /**
   * Set value at JSONPath
   */
  public static setNodeValue(
    json: object,
    path: string,
    value: any
  ): object {
    const cloned = JSON.parse(JSON.stringify(json));

    // Handle nested path by creating intermediate objects
    const parts = path.replace(/^\$\./, '').split('.');
    let current = cloned;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      if (!current[part]) {
        current[part] = {};
      }

      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
    return cloned;
  }

  /**
   * Add new property to object
   */
  public static addProperty(
    json: object,
    parentPath: string,
    key: string,
    value: any
  ): object {
    const cloned = JSON.parse(JSON.stringify(json));

    if (parentPath === '$') {
      cloned[key] = value;
    } else {
      const parent = JSONNodeAccessor.getValue(cloned, parentPath);

      if (typeof parent !== 'object' || parent === null) {
        throw new Error(`Parent path ${parentPath} does not point to an object`);
      }

      parent[key] = value;
    }

    return cloned;
  }

  /**
   * Remove property from object
   */
  public static removeProperty(
    json: object,
    path: string
  ): object {
    const cloned = JSON.parse(JSON.stringify(json));

    // Handle root-level properties
    if (path === '$') {
      return cloned;
    }

    const parts = path.replace(/^\$\./, '').split('.');
    let current = cloned;

    // Navigate to parent
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        return cloned;
      }
      current = current[parts[i]];
    }

    // Delete property
    const lastPart = parts[parts.length - 1];
    if (typeof current === 'object' && current !== null) {
      delete current[lastPart];
    }

    return cloned;
  }

  /**
   * Rename property
   */
  public static renameProperty(
    json: object,
    path: string,
    newName: string
  ): object {
    const cloned = JSON.parse(JSON.stringify(json));
    const value = JSONNodeAccessor.getValue(cloned, path);

    if (value === undefined) {
      throw new Error(`Property at path ${path} not found`);
    }

    // Remove old property
    const clonedAfterRemove = this.removeProperty(cloned, path);

    // Add new property with new name
    const parentPath = path.substring(0, path.lastIndexOf('.'));
    return this.addProperty(clonedAfterRemove, parentPath, newName, value);
  }

  /**
   * Update nested object
   */
  public static mergeProperties(
    json: object,
    path: string,
    updateObject: Record<string, any>
  ): object {
    const cloned = JSON.parse(JSON.stringify(json));
    const current = JSONNodeAccessor.getValue(cloned, path);

    if (typeof current !== 'object' || current === null) {
      throw new Error(`Path ${path} does not point to an object`);
    }

    Object.assign(current, updateObject);
    return cloned;
  }
}

// ==========================================
// JSON Comparison Engine
// ==========================================

export class JSONComparator {
  /**
   * Deep equality check
   */
  public static deepEquals(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  /**
   * Partial match (check if actual contains all properties of expected)
   */
  public static partialMatch(actual: Record<string, any>, expected: Record<string, any>): boolean {
    return Object.entries(expected).every(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return this.partialMatch(actual[key] || {}, value);
      }
      return actual[key] === value;
    });
  }

  /**
   * Compare two JSON objects and return differences
   */
  public static compare(json1: object, json2: object): ComparisonResult {
    const differences: ComparisonResult['differences'] = [];

    const compare = (obj1: any, obj2: any, path: string = '$'): void => {
      const keys1 = Object.keys(obj1 || {});
      const keys2 = Object.keys(obj2 || {});
      const allKeys = new Set([...keys1, ...keys2]);

      allKeys.forEach((key) => {
        const newPath = `${path}.${key}`;
        const value1 = obj1?.[key];
        const value2 = obj2?.[key];

        if (typeof value1 === 'object' && typeof value2 === 'object' &&
            value1 !== null && value2 !== null) {
          compare(value1, value2, newPath);
        } else if (value1 !== value2) {
          differences.push({
            path: newPath,
            expected: value1,
            actual: value2,
          });
        }
      });
    };

    compare(json1, json2);

    return {
      matches: differences.length === 0,
      differences,
    };
  }

  /**
   * Remove specified fields before comparison
   */
  public static ignoreFields(
    json: object,
    fieldsToIgnore: string[]
  ): object {
    const cloned = JSON.parse(JSON.stringify(json));

    const removeFields = (obj: any): void => {
      if (typeof obj !== 'object' || obj === null) {
        return;
      }

      fieldsToIgnore.forEach((field) => {
        delete obj[field];
      });

      Object.values(obj).forEach((value) => {
        if (typeof value === 'object' && value !== null) {
          removeFields(value);
        }
      });
    };

    removeFields(cloned);
    return cloned;
  }

  /**
   * Normalize JSON for comparison (remove dynamic fields)
   */
  public static normalizeForComparison(
    json: object,
    fieldsToRemove?: string[]
  ): object {
    const defaultRemoveFields = [
      'id',
      '_id',
      'createdAt',
      'updatedAt',
      'timestamp',
      'requestId',
    ];

    const toRemove = fieldsToRemove || defaultRemoveFields;
    return this.ignoreFields(json, toRemove);
  }
}

// ==========================================
// Usage Examples
// ==========================================

/**
 * Example 1: Parse and Access JSON
 */
function example1_ParseAndAccess() {
  const json = {
    user: {
      id: 123,
      name: 'John Doe',
      email: 'john@example.com',
      roles: ['ADMIN', 'USER'],
    },
  };

  console.log('Email:', JSONNodeAccessor.getValue(json, '$.user.email'));
  console.log('Roles:', JSONNodeAccessor.getValues(json, '$.user.roles[*]'));
  console.log('Email exists:', JSONNodeAccessor.nodeExists(json, '$.user.email'));
}

/**
 * Example 2: Validate Node Values
 */
function example2_ValidateValues() {
  const json = { user: { status: 'ACTIVE', deletedAt: null } };

  console.log('Status equals ACTIVE:', JSONNodeValidator.equals(json, '$.user.status', 'ACTIVE'));
  console.log('DeletedAt is null:', JSONNodeValidator.isNull(json, '$.user.deletedAt'));
  console.log('Type of status:', JSONNodeValidator.getType(json, '$.user.status'));
}

/**
 * Example 3: Array Operations
 */
function example3_ArrayOps() {
  const json = {
    items: [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ],
  };

  console.log('Array size:', JSONArrayUtility.getArraySize(json, '$.items'));
  console.log('Contains item:', JSONArrayUtility.arrayContains(json, '$.items', { id: 1, name: 'Item 1' }));

  const updated = JSONArrayUtility.addArrayItem(json, '$.items', { id: 3, name: 'Item 3' });
  console.log('Updated:', updated);
}

/**
 * Example 4: Compare JSON Objects
 */
function example4_CompareJSON() {
  const json1 = { user: { name: 'John', email: 'john@example.com' } };
  const json2 = { user: { name: 'John', email: 'jane@example.com' } };

  const result = JSONComparator.compare(json1, json2);
  console.log('Matches:', result.matches);
  console.log('Differences:', result.differences);
}

