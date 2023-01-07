import { Release, Semaphore } from "../src";

jest.setTimeout(100000);

describe("Semaphore", () => {
	test("Up", () => {
		const semaphore = new Semaphore(3);

		expect(semaphore.space).toBe(3);
		expect(semaphore.used).toBe(0);

		expect(semaphore.up()).resolves.toBe(1);
		expect(semaphore.used).toBe(1);
		expect(semaphore.up()).resolves.toBe(2);
		expect(semaphore.used).toBe(2);
		expect(semaphore.up()).resolves.toBe(3);
		expect(semaphore.used).toBe(3);
	});

	test("Down", (done) => {
		const semaphore = new Semaphore(3);

		expect(semaphore.space).toBe(3);
		expect(semaphore.used).toBe(0);

		expect(semaphore.up()).resolves.toBe(1);
		expect(semaphore.used).toBe(1);
		expect(semaphore.up()).resolves.toBe(2);
		expect(semaphore.used).toBe(2);
		expect(semaphore.up()).resolves.toBe(3);
		expect(semaphore.used).toBe(3);

		semaphore.once("all-clear", () => {
			expect(semaphore.space).toBe(3);
			expect(semaphore.used).toBe(0);
			done();
		});

		expect(semaphore.down()).toBe(2);
		expect(semaphore.used).toBe(2);
		expect(semaphore.down()).toBe(1);
		expect(semaphore.used).toBe(1);
		expect(semaphore.down()).toBe(0);
		expect(semaphore.used).toBe(0);
	});

	test("Down when empty", () => {
		const semaphore = new Semaphore(3);

		expect(semaphore.space).toBe(3);
		expect(semaphore.used).toBe(0);
		expect(semaphore.empty()).toBe(true);

		expect(semaphore.down()).toBe(0);
		expect(semaphore.used).toBe(0);
	});

	test("Up when full", (done) => {
		const semaphore = new Semaphore(3);

		expect(semaphore.space).toBe(3);
		expect(semaphore.used).toBe(0);

		expect(semaphore.up()).resolves.toBe(1);
		expect(semaphore.used).toBe(1);
		expect(semaphore.up()).resolves.toBe(2);
		expect(semaphore.used).toBe(2);
		expect(semaphore.up()).resolves.toBe(3);
		expect(semaphore.used).toBe(3);

		expect(semaphore.full()).toBe(true);

		const delay = 100;
		const t = Date.now();
		semaphore.up().then(() => {
			expect(Date.now() - t).toBeGreaterThanOrEqual(delay * 0.8);
			done();
		});

		setTimeout(() => {
			expect(semaphore.used).toBe(3);
			semaphore.down();
		}, delay);
	});

	test("Resize", (done) => {
		const semaphore = new Semaphore(3);

		expect(semaphore.space).toBe(3);
		expect(semaphore.used).toBe(0);

		expect(semaphore.up()).resolves.toBe(1);
		expect(semaphore.used).toBe(1);
		expect(semaphore.up()).resolves.toBe(2);
		expect(semaphore.used).toBe(2);
		expect(semaphore.up()).resolves.toBe(3);
		expect(semaphore.used).toBe(3);

		const delay = 100;
		const t = Date.now();
		semaphore.up().then(() => {
			expect(Date.now() - t).toBeLessThanOrEqual(delay * 0.2);
			done();
		});

		semaphore.resize(4);
	});

	test("Release in queue", (done) => {
		const semaphore = new Semaphore(3);

		expect(semaphore.space).toBe(3);
		expect(semaphore.used).toBe(0);

		expect(semaphore.up()).resolves.toBe(1);
		expect(semaphore.used).toBe(1);
		expect(semaphore.up()).resolves.toBe(2);
		expect(semaphore.used).toBe(2);
		expect(semaphore.up()).resolves.toBe(3);
		expect(semaphore.used).toBe(3);

		const delay = 100;
		const callback = ({ release }: { release: Release }) => {
			setTimeout(() => {
				expect(semaphore.waiting).toBe(1);
				release();
				expect(semaphore.waiting).toBe(0);
			}, delay);
		};
		semaphore.on("wait", callback);

		const t = Date.now();
		semaphore.up().then(() => {
			expect(Date.now() - t).toBeGreaterThanOrEqual(delay * 0.8);
			semaphore.off("wait", callback);
			done();
		});
	});
});
