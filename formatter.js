exports.format = function formatMessages(msgs, ...args) {
  console.log({ msgs, args });
  const results = {};
  for (const [id, msg] of Object.entries(msgs)) {
    results[id] = {
      string: msg.defaultMessage,
      comment: msg.description,
    };
  }
  return results;
};
