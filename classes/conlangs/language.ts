export class Language {
	static CreateOneLineEditor(cleanDiv: HTMLDivElement, div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = true): ConlangOneLineEditor {
		throw Error('Do not call this method on the Language class itself');
	}

	static CreateMultiLineEditor(cleanDiv: HTMLDivElement, div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = true): ConlangMultiLineEditor {
		throw Error('Do not call this method on the Language class itself');
	}

	static Display(cleanDiv: HTMLDivElement, div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = true): ConlangElement {
		throw Error('Do not call this method on the Language class itself');
	}

	static SpeakOrAnimate(cleanDiv: HTMLDivElement, div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = true): ConlangElement {
		throw Error('Do not call this method on the Language class itself');
	}

}

export abstract class ConlangElement {
	realFontSize: number;
	abstract get style(): CSSStyleDeclaration;
	abstract get className(): string;
	abstract set className(newValue: string);
	abstract get classList(): DOMTokenList;
	abstract get value(): string;
	abstract set value(newValue: string);
	abstract get isVertical(): boolean;
	abstract set isVertical(newValue: boolean);
	get fontSize() {
		return this.realFontSize;
	}
	set fontSize(newValue: number) {
		this.realFontSize = newValue;
		this.style.fontSize = newValue + 'px';
	}
	onclick: () => Promise<void> | void = () => {
		return;
	}
}

export abstract class ConlangOneLineEditor extends ConlangElement {
	oninput: () => Promise<void> | void = () => {
		return;
	}
	onchange: () => Promise<void> | void = () => {
		return;
	}
}

export abstract class ConlangMultiLineEditor extends ConlangElement {
	oninput: () => Promise<void> | void = () => {
		return;
	}
	onchange: () => Promise<void> | void = () => {
		return;
	}
}
