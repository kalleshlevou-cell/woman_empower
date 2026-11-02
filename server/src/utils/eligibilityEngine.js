/**
 * Pure eligibility matching engine — no DB calls inside.
 *
 * @param {Object} answers - User answers from eligibility questionnaire
 *   Shape: { maritalStatus, age, bplCard, pregnant, shmMember, district }
 * @param {Array}  schemes - Array of Mongoose scheme documents (or plain objects)
 * @returns {Array} Matched schemes with added field matchLabel: 'संभावित मिलान'
 */
function matchSchemes(answers, schemes) {
  if (!answers || !Array.isArray(schemes)) return [];

  return schemes.filter((scheme) => {
    const criteria = scheme.eligibilityCriteria;
    if (!Array.isArray(criteria) || criteria.length === 0) return false;

    // AND logic — every criterion must pass
    return criteria.every((criterion) => {
      const { field, operator, value } = criterion;
      const userValue = answers[field];

      switch (operator) {
        case 'eq':
          return userValue === value;

        case 'gte': {
          const num = Number(userValue);
          return !isNaN(num) && num >= value;
        }

        case 'lte': {
          const num = Number(userValue);
          return !isNaN(num) && num <= value;
        }

        case 'includes':
          if (Array.isArray(userValue)) return userValue.includes(value);
          return false;

        case 'bool':
          // Accept boolean true/false or string 'true'/'false'
          if (typeof userValue === 'boolean') return userValue === value;
          if (typeof userValue === 'string') return (userValue === 'true') === value;
          return false;

        default:
          return false;
      }
    });
  }).map((scheme) => ({
    ...scheme.toObject ? scheme.toObject() : scheme,
    matchLabel: 'संभावित मिलान',
  }));
}

module.exports = { matchSchemes };
