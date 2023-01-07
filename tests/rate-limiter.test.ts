import { RateLimiter } from "../src";

describe("RateLimiter", () => {
	test("Time-based rate limiting", async () => {
		const rl = new RateLimiter({ limit: 3, interval: 100 });

		expect(rl.space).toBe(1);
		expect(rl.used).toBe(0);

		const t1 = Date.now();
		for (let i = 0; i < 3; i++) {
			await rl.lock();
			rl.unlock();
		}
		const t2 = Date.now();
		expect(t2 - t1).toBeLessThanOrEqual(100 * 0.2);

		const t3 = Date.now();
		for (let i = 0; i < 3; i++) {
			await rl.lock();
			rl.unlock();
		}
		const t4 = Date.now();
		expect(t4 - t3).toBeGreaterThanOrEqual(100 * 0.8);

		const arr: Promise<number>[] = [];
		for (let i = 0; i < 6; i++) {
			arr.push(rl.lock().then(() => rl.unlock()));
		}

		rl.unlock();
		await Promise.all(arr);

		await rl.lock();
		rl.unlock();
		await new Promise((resolve) => setTimeout(resolve, 100 * 1.2));

		const t5 = Date.now();
		for (let i = 0; i < 3; i++) {
			await rl.lock();
			rl.unlock();
		}
		const t6 = Date.now();
		expect(t6 - t5).toBeLessThanOrEqual(100 * 0.2);
	});

	test("events", async () => {
		const rl = new RateLimiter({ limit: 3, interval: 100, concurrency: 2 });

		const locked = () => {
			console.log("locked");
		};

		const unlocked = () => {
			console.log("unlocked");
		};

		const time_locked = () => {
			console.log("time_locked");
		};

		const time_unlocked = () => {
			console.log("time_unlocked");
		};

		const timer_reset = () => {
			console.log("timer_reset");
		};

		rl.on("up", locked);
		rl.on("down", unlocked);
		rl.on("time-lock", time_locked);
		rl.on("time-unlock", time_unlocked);
		rl.on("timer-reset", timer_reset);

		rl.once("all-clear", () => {
			rl.off("up", locked);
			rl.off("down", unlocked);
			rl.off("time-lock", time_locked);
			rl.off("time-unlock", time_unlocked);
			rl.off("timer-reset", timer_reset);
		});

		for (let i = 0; i < 10; i++) {
			await rl.lock();
			setTimeout(() => rl.unlock(), 10);
		}
	});
});
