"use strict";
/**
 * JSON Utilities - Comprehensive JSON parsing, validation, and manipulation
 * Supports JSONPath queries, comparisons, and all JSON operations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONComparator = exports.JSONPropertyManipulator = exports.JSONArrayUtility = exports.JSONNodeValidator = exports.JSONNodeAccessor = exports.JSONParser = void 0;
const jsonpath_plus_1 = __importDefault(require("jsonpath-plus"));
// ==========================================
// JSON Parser
// ==========================================
class JSONParser {
    /**
     * Safely parse JSON string
     */
    static parse(jsonString) {
        try {
            return JSON.parse(jsonString);
        }
        catch (error) {
            throw new Error(`Failed to parse JSON: ${error}`);
        }
    }
    /**
     * Check if string is valid JSON
     */
    static isValidJSON(jsonString) {
        try {
            JSON.parse(jsonString);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Stringify object with pretty formatting
     */
    static stringify(obj, indent = 2) {
        return JSON.stringify(obj, null, indent);
    }
}
exports.JSONParser = JSONParser;
// ==========================================
// JSON Node Accessor (JSONPath)
// ==========================================
class JSONNodeAccessor {
    /**
     * Get value at JSONPath
     * Usage: getValue(data, '$.user.profile.email')
     */
    static getValue(json, path) {
        try {
            const results = jsonpath_plus_1.default.JSONPath({ path, json, resultType: 'value' });
            return results.length > 0 ? results[0] : undefined;
        }
        catch (error) {
            throw new Error(`Failed to get value at path ${path}: ${error}`);
        }
    }
    /**
     * Get all values matching JSONPath (supports wildcards)
     * Usage: getValues(data, '$.users[*].email')
     */
    static getValues(json, path) {
        try {
            return jsonpath_plus_1.default.JSONPath({ path, json, resultType: 'value' });
        }
        catch (error) {
            throw new Error(`Failed to get values at path ${path}: ${error}`);
        }
    }
    /**
     * Get the path to all matching values
     * Usage: getValuePaths(data, '$.users[*]')
     */
    static getValuePaths(json, path) {
        try {
            return jsonpath_plus_1.default.JSONPath({ path, json, resultType: 'path' });
        }
        catch (error) {
            throw new Error(`Failed to get paths at ${path}: ${error}`);
        }
    }
    /**
     * Check if path exists in JSON
     */
    static nodeExists(json, path) {
        try {
            const results = jsonpath_plus_1.default.JSONPath({ path, json, resultType: 'value' });
            return results.length > 0;
        }
        catch {
            return false;
        }
    }
    /**
     * Get value with detailed info
     */
    static getNodeInfo(json, path) {
        try {
            const values = jsonpath_plus_1.default.JSONPath({ path, json, resultType: 'value' });
            const exists = values.length > 0;
            return {
                path,
                value: exists ? values[0] : undefined,
                exists,
            };
        }
        catch (error) {
            return {
                path,
                value: undefined,
                exists: false,
            };
        }
    }
}
exports.JSONNodeAccessor = JSONNodeAccessor;
// ==========================================
// JSON Node Validator
// ==========================================
class JSONNodeValidator {
    /**
     * Check if node value is null
     */
    static isNull(json, path) {
        const value = JSONNodeAccessor.getValue(json, path);
        return value === null;
    }
    /**
     * Check if node value is undefined or null
     */
    static isNullOrUndefined(json, path) {
        const value = JSONNodeAccessor.getValue(json, path);
        return value === null || value === undefined;
    }
    /**
     * Check if node value is not null
     */
    static isNotNull(json, path) {
        return !this.isNull(json, path);
    }
    /**
     * Check if node exists and has a value
     */
    static hasValue(json, path) {
        const value = JSONNodeAccessor.getValue(json, path);
        return value !== null && value !== undefined && value !== '';
    }
    /**
     * Check if node value is empty
     */
    static isEmpty(json, path) {
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
    static getType(json, path) {
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
    static isType(json, path, expectedType) {
        const actualType = this.getType(json, path);
        return actualType === expectedType;
    }
    /**
     * Check if value equals expected
     */
    static equals(json, path, expected) {
        const value = JSONNodeAccessor.getValue(json, path);
        return value === expected;
    }
    /**
     * Check if value contains string
     */
    static contains(json, path, searchValue) {
        const value = JSONNodeAccessor.getValue(json, path);
        if (typeof value === 'string') {
            return value.includes(searchValue);
        }
        if (Array.isArray(value)) {
            return value.some((item) => typeof item === 'string' ? item.includes(searchValue) : false);
        }
        return false;
    }
    /**
     * Check if value matches regex
     */
    static matchesRegex(json, path, pattern) {
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
    static isGreaterThan(json, path, compareValue) {
        const value = JSONNodeAccessor.getValue(json, path);
        return typeof value === 'number' && value > compareValue;
    }
    /**
     * Check if numeric value is less than
     */
    static isLessThan(json, path, compareValue) {
        const value = JSONNodeAccessor.getValue(json, path);
        return typeof value === 'number' && value < compareValue;
    }
    /**
     * Check if numeric value is in range
     */
    static isInRange(json, path, min, max) {
        const value = JSONNodeAccessor.getValue(json, path);
        return (typeof value === 'number' && value >= min && value <= max);
    }
}
exports.JSONNodeValidator = JSONNodeValidator;
// ==========================================
// JSON Array Utilities
// ==========================================
class JSONArrayUtility {
    /**
     * Get array size
     */
    static getArraySize(json, path) {
        const value = JSONNodeAccessor.getValue(json, path);
        if (!Array.isArray(value)) {
            throw new Error(`Path ${path} does not point to an array`);
        }
        return value.length;
    }
    /**
     * Check if array size equals expected
     */
    static arraySizeEquals(json, path, expectedSize) {
        try {
            return this.getArraySize(json, path) === expectedSize;
        }
        catch {
            return false;
        }
    }
    /**
     * Check if array size is greater than
     */
    static arraySizeGreaterThan(json, path, size) {
        try {
            return this.getArraySize(json, path) > size;
        }
        catch {
            return false;
        }
    }
    /**
     * Check if array is empty
     */
    static isArrayEmpty(json, path) {
        try {
            return this.getArraySize(json, path) === 0;
        }
        catch {
            return false;
        }
    }
    /**
     * Get array item by index
     */
    static getArrayItem(json, path, index) {
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
    static arrayContains(json, path, item) {
        try {
            const value = JSONNodeAccessor.getValue(json, path);
            if (!Array.isArray(value)) {
                return false;
            }
            return value.some((arrItem) => JSON.stringify(arrItem) === JSON.stringify(item));
        }
        catch {
            return false;
        }
    }
    /**
     * Check if array contains object with property value
     */
    static arrayContainsObjectWithProperty(json, path, propertyName, propertyValue) {
        try {
            const value = JSONNodeAccessor.getValue(json, path);
            if (!Array.isArray(value)) {
                return false;
            }
            return value.some((item) => typeof item === 'object' &&
                item !== null &&
                item[propertyName] === propertyValue);
        }
        catch {
            return false;
        }
    }
    /**
     * Add item to array
     */
    static addArrayItem(json, path, item) {
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
    static removeArrayItem(json, path, index) {
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
    static filterArray(json, path, propertyName, propertyValue) {
        const value = JSONNodeAccessor.getValue(json, path);
        if (!Array.isArray(value)) {
            throw new Error(`Path ${path} does not point to an array`);
        }
        return value.filter((item) => typeof item === 'object' &&
            item !== null &&
            item[propertyName] === propertyValue);
    }
}
exports.JSONArrayUtility = JSONArrayUtility;
// ==========================================
// JSON Property Manipulator
// ==========================================
class JSONPropertyManipulator {
    /**
     * Set value at JSONPath
     */
    static setNodeValue(json, path, value) {
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
    static addProperty(json, parentPath, key, value) {
        const cloned = JSON.parse(JSON.stringify(json));
        if (parentPath === '$') {
            cloned[key] = value;
        }
        else {
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
    static removeProperty(json, path) {
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
    static renameProperty(json, path, newName) {
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
    static mergeProperties(json, path, updateObject) {
        const cloned = JSON.parse(JSON.stringify(json));
        const current = JSONNodeAccessor.getValue(cloned, path);
        if (typeof current !== 'object' || current === null) {
            throw new Error(`Path ${path} does not point to an object`);
        }
        Object.assign(current, updateObject);
        return cloned;
    }
}
exports.JSONPropertyManipulator = JSONPropertyManipulator;
// ==========================================
// JSON Comparison Engine
// ==========================================
class JSONComparator {
    /**
     * Deep equality check
     */
    static deepEquals(obj1, obj2) {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }
    /**
     * Partial match (check if actual contains all properties of expected)
     */
    static partialMatch(actual, expected) {
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
    static compare(json1, json2) {
        const differences = [];
        const compare = (obj1, obj2, path = '$') => {
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
                }
                else if (value1 !== value2) {
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
    static ignoreFields(json, fieldsToIgnore) {
        const cloned = JSON.parse(JSON.stringify(json));
        const removeFields = (obj) => {
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
    static normalizeForComparison(json, fieldsToRemove) {
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
exports.JSONComparator = JSONComparator;
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
