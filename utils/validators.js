// Validate MongoDB Object ID
exports.validateObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
