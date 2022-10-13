// A saga is a generator that yields any effect creator (such as put(action))
// and receives any value (such as response = yield call(someApiFunction).
// This type is loose; we don't use it to cover what a given saga can yield/receive.
export type Saga = Generator<any, void, any>;