import _ from 'lodash';
export default function UniqLabelUtilService() {

  /*
   * Accepts an array of data objects and a formatter function.
   * Returns a unique list of formatted labels (strings).
   */
  return function (arr) {
    if (!_.isArray(arr)) {
      throw new TypeError('UniqLabelUtil expects an array of objects');
    }

    return _(arr)
    .pluck('label')
    .unique()
    .value();
  };
};
