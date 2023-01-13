const { matchers } = require('jest-json-schema');
const pinoSyslog = require('pino-syslog/lib/utils');

const {
  DEFAULT_OPTIONS,
  ENV_VERSION,
  createParseFunction,
  createTransformFunction,
  format,
  getStackdriverSeverity,
  parseOptions,
} = require('../../src/pino-mozlog/index');
const mozlogSchema = require('./mozlog-schema');

describe(__filename, () => {
  // Setup JSON schema matchers.
  expect.extend(matchers);

  let _console;

  const createPinoRecord = (fields = {}) => {
    return {
      hostname: 'host.example.org',
      level: 10,
      msg: 'some message',
      name: 'app',
      pid: 12345,
      time: Date.now(),
      v: 1,
      ...fields,
    };
  };

  beforeEach(() => {
    _console = { error: jest.fn() };
  });

  describe('parse', () => {
    let parse;

    beforeEach(() => {
      parse = createParseFunction({ _console });
    });

    it('parses a JSON string', () => {
      const data = { some: 'object' };

      expect(parse(JSON.stringify(data))).toEqual(data);
      expect(_console.error).not.toHaveBeenCalled();
    });

    it('returns an empty object when invalid JSON is supplied', () => {
      const data = 'not JSON data';
      expect(parse(data)).toEqual({});
      expect(_console.error).toHaveBeenCalledWith(
        '[pino-mozlog] could not parse:',
        {
          error: 'SyntaxError: Unexpected token o in JSON at position 1',
          data,
        },
      );
    });

    it('returns an empty object when an empty string is supplied', () => {
      const data = '';
      expect(parse(data)).toEqual({});
      expect(_console.error).toHaveBeenCalledWith(
        '[pino-mozlog] could not parse:',
        {
          error: 'SyntaxError: Unexpected end of JSON input',
          data,
        },
      );
    });

    describe('with --silent', () => {
      const options = {
        ...DEFAULT_OPTIONS,
        silent: true,
      };

      beforeEach(() => {
        parse = createParseFunction({ _console, options });
      });

      it('returns an empty object when invalid JSON is supplied', () => {
        parse('not JSON data');
        expect(_console.error).not.toHaveBeenCalled();
      });

      it('returns an empty object when an empty string is supplied', () => {
        parse('');
        expect(_console.error).not.toHaveBeenCalled();
      });
    });
  });

  describe('format', () => {
    it('formats a record using the mozlog format', () => {
      const record = createPinoRecord();

      expect(format(record)).toEqual({
        EnvVersion: ENV_VERSION,
        Fields: {
          msg: record.msg,
        },
        Hostname: record.hostname,
        Logger: record.name,
        Pid: record.pid,
        Severity: 7,
        Timestamp: record.time,
        Type: DEFAULT_OPTIONS.type,
        severity: 100,
      });
    });

    it('adds extra information to Fields', () => {
      const fields = { other: 'value', msg: 'important' };
      const record = createPinoRecord(fields);

      expect(format(record).Fields).toEqual(fields);
    });

    it('can be configured with a user-defined type', () => {
      const record = createPinoRecord();

      const type = 'some-type';
      const options = {
        ...DEFAULT_OPTIONS,
        type,
      };

      expect(format(record, options).Type).toEqual(type);
    });

    it('omits the "v" attribute', () => {
      const record = createPinoRecord({ msg: undefined, v: 123 });

      expect(format(record).Fields).toEqual({});
    });

    it('complies with the mozlog JSON schema', () => {
      const record = createPinoRecord({ foo: 'foo', bar: true, baz: 123 });

      expect(format(record)).toMatchSchema(mozlogSchema);
    });
  });

  describe('createTransformFunction', () => {
    it('calls the format function when transforming a record', () => {
      const record = createPinoRecord();
      const callback = jest.fn();

      const _format = jest.fn();
      _format.mockImplementation(() => 'a mozlog');

      const transform = createTransformFunction({ _format });
      transform(record, null, callback);

      expect(_format).toHaveBeenCalledWith(record, DEFAULT_OPTIONS);
      expect(callback).toHaveBeenCalled();
    });

    it('does not call the format function when the record is an empty object', () => {
      const _format = jest.fn();
      const record = {};

      const transform = createTransformFunction({ _console, _format });
      transform(record, null, jest.fn());

      expect(_format).not.toHaveBeenCalled();
      expect(_console.error).toHaveBeenCalledWith(
        '[pino-mozlog] could not format:',
        {
          error: 'Error: invalid pino record',
          record,
        },
      );
    });

    it('calls the callback even in case of an error', () => {
      const callback = jest.fn();

      const transform = createTransformFunction({ _console });
      transform({}, null, callback);

      expect(callback).toHaveBeenCalled();
      expect(_console.error).toHaveBeenCalled();
    });

    describe('with --silent', () => {
      const options = {
        ...DEFAULT_OPTIONS,
        silent: true,
      };

      it('does not call the format function when the record is an empty object', () => {
        const record = {};

        const transform = createTransformFunction({
          _console,
          options,
        });
        transform(record, null, jest.fn());

        expect(_console.error).not.toHaveBeenCalled();
      });
    });
  });

  describe('parseOptions', () => {
    it('returns the default options', () => {
      const options = parseOptions([]);

      expect(options).toEqual(DEFAULT_OPTIONS);
    });

    it('accepts the --silent boolean option', () => {
      const options = parseOptions(['--silent']);

      expect(options).toEqual({
        ...DEFAULT_OPTIONS,
        silent: true,
      });
    });

    it('accepts the --type string option', () => {
      const type = 'some-type';
      const options = parseOptions(['--type', type]);

      expect(options).toEqual({
        ...DEFAULT_OPTIONS,
        type,
      });
    });

    it('ignores unknown options', () => {
      const options = parseOptions(['--unknown', 'option']);

      expect(options).toEqual(DEFAULT_OPTIONS);
    });
  });

  describe('getStackdriverSeverity', () => {
    it.each([
      [pinoSyslog.severity.emergency, 800],
      [pinoSyslog.severity.alert, 700],
      [pinoSyslog.severity.critical, 600],
      [pinoSyslog.severity.error, 500],
      [pinoSyslog.severity.warning, 400],
      [pinoSyslog.severity.notice, 300],
      [pinoSyslog.severity.info, 200],
      [pinoSyslog.severity.debug, 100],
    ])(
      'returns the stackdriver level for (syslog) severity = %d',
      (syslogSeverity, stackdriverSeverity) => {
        expect(getStackdriverSeverity(syslogSeverity)).toEqual(
          stackdriverSeverity,
        );
      },
    );
  });

  it('returns 0 for unsupported syslog severities', () => {
    expect(getStackdriverSeverity(-1)).toEqual(0);
    expect(getStackdriverSeverity(123)).toEqual(0);
  });
});
