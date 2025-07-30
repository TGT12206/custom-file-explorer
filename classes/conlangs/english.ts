import { ConlangElement, ConlangMultiLineEditor, ConlangOneLineEditor, Language } from "./language";

export class English extends Language {
	static CreateOneLineEditor(cleanDiv: HTMLDivElement, div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = true): EnglishOneLineEditor {
		const textElement = new EnglishOneLineEditor(div, value, fontSize, isVertical);
		return textElement;
	}

	static CreateMultiLineEditor(cleanDiv: HTMLDivElement, div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = true): EnglishMultiLineEditor {
		const textElement = new EnglishMultiLineEditor(div, value, fontSize, isVertical);
		return textElement;
	}

	static Display(cleanDiv: HTMLDivElement, div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = false): EnglishElement {
		const textElement = new EnglishElement(div, value, fontSize, isVertical);
		return textElement;
	}
}

export class EnglishElement extends ConlangElement {
	textElement: HTMLDivElement;
	realIsVertical: boolean;

	get style(): CSSStyleDeclaration {
		return this.textElement.style;
	}
	get value(): string {
		return this.textElement.textContent ? this.textElement.textContent : '';
	}
	set value(newValue: string) {
		this.textElement.textContent = newValue;
	}
	get className(): string {
		return this.textElement.className;
	}
	set className(newValue: string) {
		this.textElement.className = newValue;
	}
	get classList(): DOMTokenList {
		return this.textElement.classList;
	}
	get isVertical(): boolean {
		return this.realIsVertical;
	}
	set isVertical(newValue: boolean) {
		this.realIsVertical = newValue;
		if (newValue) {
			this.style.writingMode = 'vertical-lr';
			this.style.textOrientation = 'upright';
		} else {
			this.style.writingMode = 'horizontal-tb';
			this.style.textOrientation = 'unset';
		}
	}

	constructor(div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = false) {
		super();
		this.textElement = div.createDiv();
		this.value = value;
		this.fontSize = fontSize;
		this.isVertical = isVertical;
		this.textElement.onclick = async () => {
			await this.onclick();
		}
	}
}

export class EnglishOneLineEditor extends ConlangOneLineEditor {
	inputElement: HTMLInputElement;
	realIsVertical: boolean;

	get style(): CSSStyleDeclaration {
		return this.inputElement.style;
	}
	get value(): string {
		return this.inputElement.value;
	}
	set value(newValue: string) {
		this.inputElement.value = newValue;
	}
	get className(): string {
		return this.inputElement.className;
	}
	set className(newValue: string) {
		this.inputElement.className = newValue;
	}
	get classList(): DOMTokenList {
		return this.inputElement.classList;
	}
	get isVertical(): boolean {
		return this.realIsVertical;
	}
	set isVertical(newValue: boolean) {
		this.realIsVertical = newValue;
		if (newValue) {
			this.style.writingMode = 'vertical-lr';
			this.style.textOrientation = 'upright';
		} else {
			this.style.writingMode = 'horizontal-tb';
			this.style.textOrientation = 'unset';
		}
	}

	constructor(div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = false) {
		super();
		this.inputElement = div.createEl('input', { type: 'text' } );
		this.value = value;
		this.fontSize = fontSize;
		this.isVertical = isVertical;
		this.inputElement.oninput = async () => {
			this.value = this.inputElement.value;
			await this.oninput();
		}
		this.inputElement.onchange = async () => {
			this.value = this.inputElement.value;
			await this.onchange();
		}
		this.inputElement.onclick = async () => {
			await this.onclick();
		}
	}
}

export class EnglishMultiLineEditor extends ConlangMultiLineEditor {
	inputElement: HTMLTextAreaElement;
	realIsVertical: boolean;

	get style(): CSSStyleDeclaration {
		return this.inputElement.style;
	}
	get value(): string {
		return this.inputElement.value;
	}
	set value(newValue: string) {
		this.inputElement.value = newValue;
	}
	get className(): string {
		return this.inputElement.className;
	}
	set className(newValue: string) {
		this.inputElement.className = newValue;
	}
	get classList(): DOMTokenList {
		return this.inputElement.classList;
	}
	get isVertical(): boolean {
		return this.realIsVertical;
	}
	set isVertical(newValue: boolean) {
		this.realIsVertical = newValue;
		if (newValue) {
			this.style.writingMode = 'vertical-lr';
			this.style.textOrientation = 'upright';
		} else {
			this.style.writingMode = 'horizontal-tb';
			this.style.textOrientation = 'unset';
		}
	}

	constructor(div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = false) {
		super();
		this.inputElement = div.createEl('textarea');
		this.value = value;
		this.fontSize = fontSize;
		this.isVertical = isVertical;
		this.inputElement.oninput = async () => {
			this.value = this.inputElement.value;
			await this.oninput();
		}
		this.inputElement.onchange = async () => {
			this.value = this.inputElement.value;
			await this.onchange();
		}
		this.inputElement.onclick = async () => {
			await this.onclick();
		}
	}
}
