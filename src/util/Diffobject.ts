import _ from "lodash";

/**
 * Deep diff between two objects - i.e. an object with the new value of new & changed fields.
 * Removed fields will be set as undefined on the result.
 * Only plain objects will be deeply compared (@see _.isPlainObject)
 *
 * Inspired by: https://gist.github.com/Yimiprod/7ee176597fef230d1451#gistcomment-2565071
 * This fork: https://gist.github.com/TeNNoX/5125ab5770ba287012316dd62231b764/
 *
 * @param  {Object} base   Object to compare with (if falsy we return object)
 * @param  {Object} object Object compared
 * @return {Object}        Return a new object who represent the changed & new values
 */
export function diffObject(base: any, object: any) {
    return _.transform(object, (result: any, value, key) => {
        if (!_.isEqual(value, base[key])) {
            result[key] =
                _.isObject(value) && _.isObject(base[key])
                    ? diffObject(value, base[key])
                    : value;
        }
    });
}
