import { Semaphore } from "./semaphore";
import { Release } from "./types";

export class RateLimiter extends Semaphore {
	public interval: number;
	private time_semaphore: Semaphore;
	private count = 0;
	private last = 0;
	private timer?: NodeJS.Timeout;

	constructor({ limit = 20, interval = 10_000, concurrency = 1 } = {}) {
		super(concurrency);
		this.time_semaphore = new Semaphore(limit);
		this.interval = interval;

		this.time_semaphore.on("up", (...args) => this.emit("time-lock", ...args));
		this.time_semaphore.on("down", (...args) => this.emit("time-unlock", ...args));
	}

	public async lock(): Promise<number> {
		if (this.last + this.interval < Date.now()) {
			this.reset();
		} else if (this.time_semaphore.full() && !this.timer) {
			this.cleaner();
		}

		await this.time_semaphore.up();
		this.count++;
		return super.up();
	}

	public unlock(): number {
		return super.down();
	}

	public reset(): void {
		while (this.count > 0) {
			this.time_semaphore.down();
			this.count--;
		}

		this.last = Date.now();

		this.emit("timer-reset");
	}

	public cleaner(): void {
		this.timer = setTimeout(() => {
			this.reset();

			setTimeout(() => {
				if (this.time_semaphore.waiting > 0) {
					this.cleaner();
				} else {
					this.timer = undefined;
				}
			}, 0);
		}, this.last + this.interval - Date.now());
	}

	public emit(event: "up" | "down" | "all-clear"): boolean;
	public emit(event: "wait", data: { release: Release }): boolean;
	public emit(event: "time-lock" | "time-unlock" | "timer-reset"): boolean;
	public emit(event: string, ...args: any[]): boolean;
	public emit(event: string, ...args: any[]): boolean {
		return super.emit(event, ...args);
	}

	public on(event: "up" | "down" | "all-clear", listener: () => void): this;
	public on(event: "wait", listener: (data: { release: Release }) => void): this;
	public on(event: "time-lock" | "time-unlock" | "timer-reset", listener: () => void): this;
	public on(event: string, listener: (...args: any[]) => void): this {
		return super.on(event, listener);
	}

	public off(event: "up" | "down" | "all-clear", listener: () => void): this;
	public off(event: "wait", listener: (data: { release: Release }) => void): this;
	public off(event: "time-lock" | "time-unlock" | "timer-reset", listener: () => void): this;
	public off(event: string, listener: (...args: any[]) => void): this {
		return super.off(event, listener);
	}

	public once(event: "up" | "down" | "all-clear", listener: () => void): this;
	public once(event: "wait", listener: (data: { release: Release }) => void): this;
	public once(event: "time-lock" | "time-unlock" | "timer-reset", listener: () => void): this;
	public once(event: string, listener: (...args: any[]) => void): this {
		return super.once(event, listener);
	}
}
