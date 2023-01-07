import { Mutex } from "../src";

describe("Mutex", () => {
	test("should work as binary semaphore", () => {
		const mutex = new Mutex();

		expect(mutex.space).toBe(1);
		expect(mutex.used).toBe(0);

		expect(mutex.up()).resolves.toBe(1);
		expect(mutex.used).toBe(1);

		expect(mutex.down()).toBe(0);
		expect(mutex.used).toBe(0);
	});
});
