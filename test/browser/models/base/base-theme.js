///<reference path="./modeling.d.js" />
import Model from './model.js';

/**
 * The base class for `ThemeModel` instances for the "themes" storage resource.
 * Exported: 2022-05-26T03:58:45.545Z
 *
 * **WARNING**    
 * THIS CLASS IS AUTOMATICALLY GENERATED DURING STASHKU OPTIONS EXPORTS.    
 * CUSTOMIZATIONS WILL BE OVERWRITTEN ON NEW OPTIONS EXPORTS.    
 * Use the non-autogenerated (base) class files to add unique customizations.
 */
class BaseThemeModel extends Model {
    constructor() {
        super();
        
        /**
         * @type {String}
         */
        this.HexCode = this.constructor.HexCode.default ?? null;
        
        /**
         * @type {Number}
         */
        this.ID = this.constructor.ID.default ?? null;
        
        /**
         * @type {String}
         */
        this.Name = this.constructor.Name.default ?? null;
        
    }
    
    /**
     * StashKu property definition for HexCode.
     * @type {Modeling.PropertyDefinition}
     */
    static get HexCode() {
        return {
            target: 'Hex_Code',
            type: 'String'
        };
    }
    
    /**
     * StashKu property definition for ID.
     * @type {Modeling.PropertyDefinition}
     */
    static get ID() {
        return {
            target: 'ID',
            pk: true,
            type: 'Number'
        };
    }
    
    /**
     * StashKu property definition for Name.
     * @type {Modeling.PropertyDefinition}
     */
    static get Name() {
        return {
            target: 'Name',
            type: 'String'
        };
    }
    
    /**
     * The StashKu resource configuration for this model.
     * @type {Modeling.Configuration}
     */
    static get $stashku() {
        return {
            resource: 'themes',
            name: 'Theme-API',
            slug: 'theme-api',
            plural: {
                name: 'Themes-API',
                slug: 'themes-api'
            }
        };
    }
    
}

export default BaseThemeModel;
