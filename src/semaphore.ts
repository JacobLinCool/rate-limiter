import EventEmitter from "eventemitter3";
import { Release } from "./types";

export class Semaphore extends EventEmitter {
	protected _space: number;
	protected _used: number;
	protected _releases: Release[];

	public get space(): number {
		return this._space;
	}

	public get used(): number {
		return this._used;
	}

	public get waiting(): number {
		return this._releases.length;
	}

	constructor(space: number) {
		super();
		this._space = space;
		this._used = 0;
		this._releases = [];
	}

	public async up(): Promise<number> {
		if (this._used >= this._space) {
			const lock = new Promise<void>((r) => {
				this._releases.push(r);
				const release = () => {
					const idx = this._releases.indexOf(r);
					if (idx >= 0) {
						this._releases.splice(idx, 1);
					}
					r();
				};
				this.emit("wait", { release });
			});
			await lock;
		}
		this._used++;
		this.emit("up");

		return this._used;
	}

	public down(): number {
		if (this._used <= 0) {
			return 0;
		}

		if (this._releases.length > 0) {
			this._releases.shift()?.();
		}
		this._used--;
		this.emit("down");

		if (this._used <= 0) {
			this.emit("all-clear");
		}

		return this._used;
	}

	public resize(space: number): this {
		this._space = space;

		while (this._used < space && this._releases.length > 0) {
			this._releases.shift()?.();
		}

		return this;
	}

	public full(): boolean {
		return this._used >= this._space;
	}

	public empty(): boolean {
		return this._used === 0;
	}

	public emit(event: "up" | "down" | "all-clear"): boolean;
	public emit(event: "wait", data: { release: Release }): boolean;
	public emit(event: string, ...args: any[]): boolean;
	public emit(event: string, ...args: any[]): boolean {
		return super.emit(event, ...args);
	}

	public on(event: "up" | "down" | "all-clear", listener: () => void): this;
	public on(event: "wait", listener: (data: { release: Release }) => void): this;
	public on(event: string, listener: (...args: any[]) => void): this;
	public on(event: string, listener: (...args: any[]) => void): this {
		return super.on(event, listener);
	}

	public off(event: "up" | "down" | "all-clear", listener: () => void): this;
	public off(event: "wait", listener: (data: { release: Release }) => void): this;
	public off(event: string, listener: (...args: any[]) => void): this;
	public off(event: string, listener: (...args: any[]) => void): this {
		return super.off(event, listener);
	}

	public once(event: "up" | "down" | "all-clear", listener: () => void): this;
	public once(event: "wait", listener: (data: { release: Release }) => void): this;
	public once(event: string, listener: (...args: any[]) => void): this;
	public once(event: string, listener: (...args: any[]) => void): this {
		return super.once(event, listener);
	}
}
