/* eslint-disable no-console */
///<reference path="../../modeling/modeling.d.js" />
import BaseProcessor from './base-processor.js';
import dot from 'dot';
import StashKu from '../../stashku.js';
import OptionsRequest from '../../requests/options-request.js';
import ModelUtility from '../../modeling/model-utility.js';
import fairu, { Util as FairuUtil } from '@appku/fairu';
import strings from '../../utilities/strings.js';
import path from 'path';

const __dirname = (
    process.platform === 'win32' ?
        path.dirname(decodeURI(new URL(import.meta.url).pathname)).substring(1) :
        path.dirname(decodeURI(new URL(import.meta.url).pathname))
);

dot.templateSettings.strip = false;
dot.log = false; //disable console output
const dots = dot.process({ path: path.resolve(__dirname + '/../templates') });

/**
 * Runs a standard RESTful StashKu OPTIONS request using command line options to create a model type definition
 * that can be exported to a directory with a base-class and extending class file (if not already present).
 */
class ExportProcessor extends BaseProcessor {
    // eslint-disable-next-line valid-jsdoc
    /**
     * Runs a standard RESTful StashKu OPTIONS request using command line options to create a model type definition
     * that can be exported to a directory with a base-class and extending class file (if not already present).
     * @param {import('../main.js').ExportCommandLineOptions} options - The command line options of the request.
     */
    constructor(options) {
        super(options);

        /**
         * @type {import('../main.js').ExportCommandLineOptions}
         */
        this.options = options;
    }

    /**
     * @inheritdoc
     */
    async start() {
        if (this.options.cli.test) {
            this.stash = new StashKu({ engine: 'memory' });
            this.stash.engine.data.set('themes', fairu.including('./test/cli/data-themes.json').parse().readSync()[0].data);
        }
        if (!this.options.cli.quiet && this.options.cli.verbose) {
            console.debug(`Running OPTIONS request on "${this.stash.engine.name}" engine for the "${this.options.resource}" resource.`);
        }
        let res = await this.stash.options(o => o.from(this.options.resource));
        if (!this.options.cli.quiet) {
            let outputObj = Object.assign({}, res, { data: [] });
            for (let i = 0; i < res.returned; i++) {
                outputObj.data.push(ModelUtility.schema(res.data[i]));
            }
            console.log(FairuUtil.stringify(this.options.cli.format, outputObj));
        }
        if (res.returned > 0) {
            for (let mt of res.data) {
                if (!this.options.cli.quiet && this.options.cli.verbose) {
                    console.debug(`Exporting model type "${mt.name}".`);
                }
                let blueprint = {
                    name: mt.name,
                    slug: strings.slugify(mt.name, '-', true, true),
                    config: mt.$stashku,
                    timestamp: new Date(),
                    resource: this.options.resource,
                    mapping: ModelUtility.map(mt),
                    makeJSDefinition: this.makeJSDefinition,
                    makePropertyJSDoc: this.makePropertyJSDoc,
                    makeJSDefault: this.makeJSDefault,
                    makeJSConfiguration: this.makeJSConfiguration,
                    makeJSFunctionOrArrayFunctions: this.makeJSFunctionOrArrayFunctions
                };
                let baseModelContent = dots['base-model'](blueprint);
                let extModelContent = dots.model(blueprint);
                // if (this.options.dryRun) {
                //     console.log(baseModelContent);
                //     console.log(extModelContent);
                // }
            }
        }
    }

    /**
     * Creates a string representation of the property definition object.
     * @param {Modeling.PropertyDefinition} definition - The property definition object.
     * @param {Number} indentLevel - The level of indent applied to contents (4-spaces per level).
     * @param {Boolean} indentFirstLine - Enable or disable indenting the first line of the returned string.
     * @returns {String}
     */
    makeJSDefinition(definition, indentLevel = 0, indentFirstLine = false) {
        let indent = '    ';
        let indentRoot = indent.repeat(indentLevel);
        let output = (indentFirstLine ? indentRoot : '') + '{';
        if (definition && definition.target) {
            output += `\n${indentRoot}${indent}target: '${definition.target}'`;
            if (definition.type) {
                output += `,\n${indentRoot}${indent}type: '${definition.type}'`;
            }
            if (typeof definition.default !== 'undefined') {
                output += `,\n${indentRoot}${indent}default: ${this.makeJSDefault(definition)}`;
            }
            // if (definition.precision) {
            //     output += `${indent}    precision: ${definition.precision}\n`;
            // }
            // if (definition.radix) {
            //     output += `${indent}    radix: ${definition.radix}\n`;
            // }
            // if (definition.charLength) {
            //     output += `${indent}    charLength: ${definition.charLength}\n`;
            // }
            if (definition.omit) {
                if (typeof definition.omit === 'boolean') {
                    output += `,\n${indentRoot}${indent}omit: ${definition.omit}`;
                } else if (Array.isArray(definition.omit)) {
                    output += `,\n${indentRoot}${indent}omit: ${this.makeJSFunctionOrArrayFunctions(definition.omit, indentLevel + 1, false)}`;
                }
            }
            if (definition.pk) {
                output += `,\n${indentRoot}${indent}pk: ${definition.pk}`;
            }
            if (definition.transform) {
                output += `,\n${indentRoot}${indent}transform: ${this.makeJSFunctionOrArrayFunctions(definition.transform, indentLevel + 1, false)}`;
            }
            if (definition.validate) {
                output += `,\n${indentRoot}${indent}validate: ${this.makeJSFunctionOrArrayFunctions(definition.validate, indentLevel + 1, false)}`;
            }
            output += '\n' + indentRoot;
        }
        return output + '}';
    }

    /**
     * Creates a string representation of the property definition object.
     * @param {String} property - The property name.
     * @param {Modeling.PropertyDefinition} definition - The property definition object.
     * @param {Number} indentLevel - The level of indent applied to contents (4-spaces per level).
     * @param {Boolean} indentFirstLine - Enable or disable indenting the first line of the returned string.
     * @returns {String}
     */
    makePropertyJSDoc(property, definition, indentLevel, indentFirstLine = false) {
        let indent = '    ';
        let indentRoot = indent.repeat(indentLevel);
        let output = (indentFirstLine ? indentRoot + '/**' : '/**');
        if (definition.precision) {
            output += (output ? '\n' + indentRoot : '') + ` * The precision (max. amount of numbers) is ${definition.precision}.`;
        }
        if (typeof definition.scale !== 'undefined' && definition.scale !== null) {
            output += (output ? '\n' + indentRoot : '') + ` * The number of decimal places is set to ${definition.scale}.`;
        }
        if (typeof definition.length !== 'undefined' && definition.length !== null) {
            output += (output ? '\n' + indentRoot : '') + ` * Maximum length in data storage: ${definition.length}.`;
        }
        if (definition.pk === true) {
            output += (output ? '\n' + indentRoot : '') + ' * This is a primary-key property (it helps uniquely identify a model).';
        }
        //determine type
        output += (output ? '\n' + indentRoot : '') + ` * @type {${definition.type}}`;
        //determine default
        if (definition.default) {
            output += (output ? '\n' + indentRoot : '') + ` * @default ${this.makeJSDefault(definition)}`;
        }
        return `${output}\n${indentRoot} */`;
    }

    /**
     * Returns the computed JavaScript value string for a property definition's default value.
     * @param {*} definition - The StashKu property definition.
     * @param {String} className - The name of the model class.
     * @param {String} propertyName - The name of the property we are creating a default value for.
     * @returns {String}
     */
    makeJSDefault(definition, className, propertyName) {
        if (typeof definition.default !== 'undefined') {
            //handle special JS values
            if (definition.default === null) {
                return 'null';
            } else if (definition.default === Infinity) {
                return 'Infinity';
                // eslint-disable-next-line use-isnan
            } else if (definition.default === NaN) {
                return 'NaN';
            }
            //output JS representation by type.
            if (definition.type === 'Boolean' || definition.type === 'Number') {
                return definition.default.toString();
            } else if (definition.type === 'String') {
                return `'${definition.default}'`;
            } else if (definition.type === 'Date') {
                return `new Date('${definition.default.toISOString()}')`;
            } else if (definition.type === 'Buffer') {
                if (definition.default.byteLength) {
                    return `Buffer.from('${definition.default.toString('base64')}', 'base64')`;
                } else {
                    return 'Buffer.alloc(0)';
                }
            }
        } else if (definition.required) {
            switch (definition.type) {
                case 'Boolean': return 'false';
                case 'Number': return '0';
                case 'String': return '\'\'';
                case 'Date': return 'new Date()';
                case 'Buffer': return 'Buffer.alloc(0)';
            }
        }
    }

    /**
     * Outputs a string of JavaScript that describes a model `$stashku` property.
     * @param {Modeling.Configuration} config - The `$stashku` definition object.
     * @param {Number} indentLevel - The level of indent applied to contents (4-spaces per level).
     * @param {Boolean} indentFirstLine - Enable or disable indenting the first line of the returned string.
     * @returns {String}
     */
    makeJSConfiguration(config, indentLevel, indentFirstLine = false) {
        let indent = '    ';
        let indentRoot = indent.repeat(indentLevel);
        if (config && config.resource) {
            let output = (indentFirstLine ? indentRoot : '') + '{';
            output += `\n${indentRoot}${indent}resource: '${config.resource}'`;
            if (config.name) {
                output += `\n${indentRoot}${indent}name: '${config.name}'`;
            }
            if (config.slug) {
                output += `\n${indentRoot}${indent}slug: '${config.slug}'`;
            }
            if (config.plural) {
                output += `\n${indentRoot}${indent}plural: {`;
                if (config.plural.name) {
                    output += `\n${indentRoot}${indent}${indent}name: '${config.plural.name}'`;
                }
                if (config.plural.slug) {
                    output += `\n${indentRoot}${indent}${indent}name: '${config.plural.slug}'`;
                }
                output += `\n${indentRoot}${indent}}`;
            }
            return output + '\n' + indentRoot + '}';
        }
        return '{}';
    }

    /**
     * Outputs a string of JavaScript defining a function or array of functions.
     * @param {Array.<Function>|Function} func - The property definition object.
     * @param {Number} indentLevel - The level of indent applied to contents (4-spaces per level).
     * @param {Boolean} indentFirstLine - Enable or disable indenting the first line of the returned string.
     * @returns {String}
     */
    makeJSFunctionOrArrayFunctions(func, indentLevel, indentFirstLine = false) {
        let indent = '   ';
        let indentRoot = indent.repeat(indentLevel);
        if (Array.isArray(func)) {
            let output = (indentFirstLine ? indentRoot : '') + '{\n';
            return output + indent + '}';
        } else if (typeof obj === 'function') {
            let output = func.toString();
            return output;
        }
        return 'null';
    }

    /**
     * Exports a model or model type to folder or file.
     * 
     * When exporting a *model*, it will be written with all keys and values into JSON (default), YAML, or TOML,
     * depending on the file extension used. If a directory is given, the model will be exported using the primary 
     * key(s) as a file name (*.json). If no primary keys are defined, it will be exported using a random file name.
     * 
     * When exporting a *model type*, the `exportPath` must be a new or existing directory path, the model type will 
     * be written as JavaScript base and inherited class file when a file is targetted. If the inherited class 
     * file already exists, it will not be altered.
     * 
     * @throws Error if the `m` argument is missing.
     * @throws Error when passing a model and specifying an invalid "format" argument value.
     * @param {*} m - The model or model type to export.
     * @param {String} exportPath - The file or folder to write the model or model type to.
     * @param {String} [format=json] - Optional format for models being written when specifying a target directory. 
     * Can be `json`, `yaml`, or `toml`.
     * @returns {Array.<String>} Returns the file path(s) of the file(s) written or checked. When a model type is
     * given, the file at index `0` will be the inheriting model class, and the file at index `1` will be the
     * base model class.
     */
    // async export(m, exportPath, format) {
    //     let filePaths = [];
    //     if (!exportPath) {
    //         throw new RESTError(500, 'The "exportPath" argument is required.');
    //     }
    //     if (m) {
    //         let pathInfo = await Files.including(exportPath).nullify().stat();
    //         if (m.$stashku || m.constructor.name === 'Function') {
    //             //model type

    //         } else {
    //             //model
    //             if ((pathInfo.stat && pathInfo.stat.isDir) || exportPath.endsWith(Files.sep)) { //directory
    //                 let pks = ModelUtility.pk(m.constructor);
    //                 let fileName;
    //                 format = format ? format : 'json';
    //                 if (format && !format.match(/json|toml|yaml/)) {
    //                     throw new RESTError(500, `Invalid "format" argument: expected "json", "yaml", or "toml", but found "${format}".`);
    //                 }
    //                 if (pks && pks.length) {
    //                     fileName = `${pks.reduce((pv, cv) => m[cv], '')}.${format}`;
    //                 } else {
    //                     fileName = `${Randomization.uuidv4()}.${format}`;
    //                 }
    //                 exportPath = Files.join(exportPath, fileName);
    //             }
    //             await Files.including(exportPath).ensure().stringify().write(m);
    //             filePaths.push(Files.resolve(exportPath));
    //         }
    //     } else {
    //         throw new RESTError(500, 'The first argument (model or model-type) is required.');
    //     }
    //     return filePaths;
    // }
}

export default ExportProcessor;