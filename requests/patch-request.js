import Filter from '../filter.js';
import ModelUtility from '../modeling/model-utility.js';
import Objects from '../utilities/objects.js';

/**
 * This class defines a StashKu PATCH request that instructs StashKu to update objects from storage with the specified
 * properties and values.
 */
export default class PatchRequest {
    /**
     * Creates a new `PatchRequest` instance. A PATCH request instructs StashKu to update objects from storage with 
     * the specified properties and values.
     * @param  {*} [template] - A template object with properties and values to update in matching objects.
     */
    constructor(template) {

        this.metadata = {
            /** @type {Boolean} */
            all: false,
            /** @type {*} */
            template: null,
            /** @type {Filter} */
            where: null,
            /** @type {String} */
            to: null, 
            /** @type {Boolean} */
            count: false,
            /** @type {*} */
            model: null,
            /** @type {Map.<String, *>} */
            headers: null
        };

        if (template) {
            this.template(template);
        }
    }

    /**
     * @type {String}
     */
    get method() {
        return 'patch';
    }

    /**
     * Applies a StahKu-compatible model's metadata & configuration *not already defined* to this request.
     * 
     * If a `null` value is passed, the model is removed - but metadata on the request will remain.
     * @throws Error when the `modelType` argument is not `null`, a class, or a constructor object.
     * @param {*} modelType - The model "class" or constructor function.
     * @returns {PatchRequest}
     * @private
     */
    model(modelType) {
        if (modelType !== null && ModelUtility.isValidType(modelType) === false) {
            throw new Error('Invalid "modelType" argument. The value must be null, a class, or a constructor object');
        }
        this.metadata.model = modelType;
        if (modelType) {
            this.to(ModelUtility.resource(modelType, this.method));
        }
        return this;
    }

    /**
     * Requests that the response return count numbers (total, affected, returned, etc.) but not objects.
     * 
     * This will result in a `Response` with an empty `data` array and may result in faster query execution if you
     * only need the resulting numbers.
     * 
     * Calling this function without an argument *enables* counting without data.
     * @param {Boolean} [enabled=true] - A `true` enables the count-only result. A `false` disables it.
     * @returns {GetRequest}
     */
    count(enabled) {
        if (typeof enabled === 'undefined') {
            this.metadata.count = true;
        } else {
            this.metadata.count = !!enabled;
        }
        return this;
    }

    /**
     * Enables the update of all objects in data storage if no `where` conditions are specified. If conditions are
     * specified, this setting will be ignored.
     * 
     * Calling this method without an argument will set the request to *enable* the deletion of all objects.
     * @param {Boolean} [enabled=true] - Enable or disable the deletion of all records when no `where` filters have
     * been defined.
     * @returns {DeleteRequest}
     */
    all(enabled) {
        if (arguments.length === 0) {
            enabled = true;
        }
        this.metadata.all = !!enabled;
        return this;
    }

    /**
     * Sets a template object with properties and values to update in objects matched by this PATCH request.
     * If a `null` value is passed, the template is removed and no updates will occur.
     * @param  {*} [template] - A template object with properties and values to update.
     * @returns {PatchRequest}
     */
    template(template) {
        let ttype = typeof template;
        if (ttype !== 'object' || Array.isArray(template)) {
            throw new Error('Invalid "template" argument. The template value must be null or an object.');
        }
        if (!template) {
            this.metadata.template = null;
        } else {
            this.metadata.template = template;
        }
        return this;
    }

    /**
     * @callback ConditionCallback
     * @param {Filter} f
     */

    /**
     * Creates a set of conditions on the request to match specific objects in storage.    
     * Any existing where conditions will be overwritten.    
     * If a `null` value is passed, the where conditions are cleared.
     * @throws Error if the "conditions" argument must be null or a Filter instance.
     * @param {Filter|ConditionCallback} conditions - The conditions to be used to filter out results.
     * @returns {PatchRequest}
     */
    where(conditions) {
        if (conditions === null) {
            this.metadata.where = null;
            return this;
        } else if (conditions instanceof Filter) {
            this.metadata.where = conditions;
        } else if (typeof conditions === 'function') {
            this.metadata.where = new Filter();
            conditions(this.metadata.where);
        } else {
            throw new Error('The "conditions" argument must be null, a callback, or a Filter instance.');
        }
        return this;
    }

    /**
     * Sets the target resource name for the request, optionally specifying an alias for use with specifying properties
     * across joins.
     * 
     * @throws Error if the "name" argument value is not a string or null.
     * @param {String} name - The name of the target resource in data storage.
     * @returns {PatchRequest}
     */
    to(name) {
        if (name === null) {
            this.metadata.to = null;
            return this;
        } else if (typeof name !== 'string') {
            throw new Error('Invalid "name" argument. The value must be a string or null.');
        }
        this.metadata.to = name;
        return this;
    }

    /**
     * Clears all configured metadata on the request, resetting it to a default state.
     * @returns {PatchRequest}
     */
    clear() {
        if (!this.metadata) {
            this.metadata = {};
        }
        this.metadata.template = null;
        this.metadata.where = null;
        this.metadata.to = null;
        this.metadata.headers = null;
        return this;
    }

    /**
     * Sets or clears headers on the request that can be used to set engine-specific options for the request.
     * If a `null` value is passed, the headers are cleared.
     * @throws Error when the dictionary argument uses a non-string key.
     * @throws Error when the dictionary argument is not an object, null, or a Map.
     * @param {Object | Map.<String, *>} dictionary - A map or object defining the headers and values.
     * @returns {DeleteRequest}
     */
    headers(dictionary) {
        if (!this.metadata.headers) {
            this.metadata.headers = new Map();
        }
        if (dictionary === null) {
            this.metadata.headers.clear();
        } else if (dictionary instanceof Map || typeof dictionary === 'object') {
            let iterable = dictionary;
            if ((dictionary instanceof Map) === false) {
                iterable = Object.entries(dictionary);
            }
            for (let [k, v] of iterable) {
                if (k !== null && typeof k !== 'undefined') {
                    if (typeof k !== 'string') {
                        throw new Error('An invalid non-string key value was provided in the "dictionary" argument. Only string-based keys may be used.');
                    }
                    if (v === null || typeof v === 'undefined') {
                        this.metadata.headers.delete(k);
                    } else {
                        this.metadata.headers.set(k, v);
                    }
                }
            }
        } else {
            throw new Error('The "dictionary" argument must be null, a Map, or an object.');
        }
        return this;
    }

    /**
     * Merges custom engine-specific request settings into the request metadata. Setting a `null` will remove all
     * non-standard metadata properties. You may not set standard metadata with this method, use the appropriate method calls.
     * @throws Error when a standardized request metadata property name is specified.
     * @param {*} metadata - An object with properties and values to set as request metadata for engine-specific functionality.
     * @returns {PatchRequest}
     * @deprecated Use new `headers` function for engine-specific options per-request.
     */
    meta(metadata) {
        if (metadata === null) {
            //clear non-standard metadata
            for (let k of Object.keys(this.metadata)) {
                if (STANDARD_METADATA.indexOf(k) < 0) {
                    delete this.metadata[k];
                }
            }
        } else {
            for (let k of Object.keys(metadata)) {
                if (STANDARD_METADATA.indexOf(k) >= 0) {
                    throw new Error(`The metadata property "${k}" is in use by a standard request method. Use the method to set this metadata should be used instead.`);
                }
            }
            this.metadata = Object.assign(this.metadata, metadata);
        }
        return this;
    }

    /**
     * Returns the metadata object to be utilized for stringifying into JSON.
     * @returns {*}
     */
    toJSON() {
        let metaClone = Object.assign({}, this.metadata);
        if (this.metadata.headers) {
            metaClone.headers = Objects.fromEntries(this.metadata.headers);
        }
        metaClone.model = this.metadata?.model?.name;
        return metaClone;
    }

}

const STANDARD_METADATA = ['template', 'where', 'to'];