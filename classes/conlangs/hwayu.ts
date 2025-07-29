import { ConlangElement, ConlangMultiLineEditor, ConlangOneLineEditor, Language } from "./language";

export class Hwayu extends Language {
	static CreateOneLineEditor(div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = true): HwayuOneLineEditor {
		const textElement = new HwayuOneLineEditor(div, value, fontSize, isVertical);
		return textElement;
	}

	static CreateMultiLineEditor(div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = true): HwayuMultiLineEditor {
		const textElement = new HwayuMultiLineEditor(div, value, fontSize, isVertical);
		return textElement;
	}

	static Display(div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = true): HwayuElement {
		const textElement = new HwayuElement(div, value, fontSize, isVertical);
		return textElement;
	}
}

export class HwayuElement extends ConlangElement {
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
		this.style.fontFamily = newValue ? 'HwayuReal' : 'HwayuHorizontal';
		if (newValue) {
			this.style.writingMode = 'vertical-lr';
			this.style.textOrientation = 'upright';
		} else {
			this.style.writingMode = 'horizontal-tb';
			this.style.textOrientation = 'unset';
		}
	}

	constructor(div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = true) {
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

export class HwayuOneLineEditor extends ConlangOneLineEditor {
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
		this.style.fontFamily = newValue ? 'HwayuReal' : 'HwayuHorizontal';
		if (newValue) {
			this.style.writingMode = 'vertical-lr';
			this.style.textOrientation = 'upright';
		} else {
			this.style.writingMode = 'horizontal-tb';
			this.style.textOrientation = 'unset';
		}
	}

	constructor(div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = true) {
		super();
		this.inputElement = div.createEl('input', { type: 'text' } );
		this.inputElement.spellcheck = false;
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

export class HwayuMultiLineEditor extends ConlangMultiLineEditor {
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
		this.style.fontFamily = newValue ? 'HwayuReal' : 'HwayuHorizontal';
		if (newValue) {
			this.style.writingMode = 'vertical-lr';
			this.style.textOrientation = 'upright';
		} else {
			this.style.writingMode = 'horizontal-tb';
			this.style.textOrientation = 'unset';
		}
	}

	constructor(div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = true) {
		super();
		this.inputElement = div.createEl('textarea');
		this.inputElement.spellcheck = false;
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
