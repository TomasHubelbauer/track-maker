/** @param {string[]} args */
/** @param {({ name: string; } & ({ type: 'string'; } | { type: 'number'; } | { type: 'enum'; options: string[]; }))[]} requiredParams */
/** @param {({ name: string; } & ({ type: 'string'; default: string; } | { type: 'number'; default: number; } | { type: 'enum'; options: string[]; default: string; }))[]} optionalParams */
export default function checkArguments(args, requiredParams, optionalParams = []) {
  const values = {};
  const hints = [];

  const params = [...requiredParams, ...optionalParams];
  for (let index = 0; index < params.length; index++) {
    const arg = args[index];
    const param = params[index];

    // Short-circuit in case not all arguments are provided yet, are `undefined`
    if (arg === undefined) {
      // Generate an error only if the param is required, not already optional
      if (index < requiredParams.length) {
        hints.push('argument missing: ' + param.name);
        break;
      }

      // Use the fallback value as the value of the optional argument
      // Note that this will be `undefined` if no default is defined and also
      // the default value is not type-checked as it bypasses the type checks,
      // so invalid enum value or a non-numerical number can be returned.
      values[param.name] = param.default;
      continue;
    }

    switch (param.type) {
      // Pass string arguments as-is, no parsing is needed
      case 'string': {
        values[param.name] = arg;
        break;
      }
      // Convert numerical arguments to actual JavaScript numbers
      case 'number': {
        const value = +arg;

        if (Number.isNaN(value)) {
          hints.push(`${param.name}: '${arg}' is not a number`);
        }
        else {
          values[param.name] = value;
        }

        break;
      }
      case 'enum': {
        if (!param.options.includes(arg)) {
          hints.push(`${param.name}: '${arg}' is not in ${param.options}`);
        }
        else {
          values[param.name] = value;
        }

        break;
      }
      case 'boolean': {
        if (arg !== 'true' && arg !== 'false' && arg !== '0' && arg !== '1') {
          hints.push(`${param.name}: '${arg}' is not a boolean (true/false, 1/0)`);
        }
        else {
          values[param.name] = arg === 'true' || arg === '1';
        }

        break;
      }
      default: {
        throw new Error(`Invalid '${param.name}' param type '${param.type}'! Need one of string, number, enum.`);
      }
    }
  }

  if (args.length > params.length) {
    hints.push((args.length - params.length) + ' too many arguments');
  }

  return { hint: hints.join(' | '), values };
}
