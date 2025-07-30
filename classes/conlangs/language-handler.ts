import { Hwayu } from "./hwayu";
import { English } from "./english";
import { ConlangElement, ConlangMultiLineEditor, ConlangOneLineEditor } from "./language";
import { ColorLang } from "./colorlang";

export class LanguageHandler {
	static knownLanguages = [
		'English',
		'Hwayu',
		'Color Lang'
	]

	static CreateOneLineEditor(cleanDiv: HTMLDivElement, div: HTMLDivElement, language: string, value: string | undefined = undefined, fontSize: number | undefined = undefined, isVertical: boolean | undefined = undefined): ConlangOneLineEditor {
		switch(language) {
			case 'English':
			default:
				return English.CreateOneLineEditor(cleanDiv, div, value, fontSize, isVertical);
			case 'Hwayu':
				return Hwayu.CreateOneLineEditor(cleanDiv, div, value, fontSize, isVertical);
			case 'Color Lang':
				return ColorLang.CreateOneLineEditor(cleanDiv, div, value, fontSize, isVertical);
		}
	}

	static CreateMultiLineEditor(cleanDiv: HTMLDivElement, div: HTMLDivElement, language: string, value: string | undefined = undefined, fontSize: number | undefined = undefined, isVertical: boolean | undefined = undefined): ConlangMultiLineEditor {
		switch(language) {
			case 'English':
			default:
				return English.CreateMultiLineEditor(cleanDiv, div, value, fontSize, isVertical);
			case 'Hwayu':
				return Hwayu.CreateMultiLineEditor(cleanDiv, div, value, fontSize, isVertical);
			case 'Color Lang':
				return ColorLang.CreateMultiLineEditor(cleanDiv, div, value, fontSize, isVertical);
		}
	}

	static Display(cleanDiv: HTMLDivElement, div: HTMLDivElement, language: string, value: string | undefined = undefined, fontSize: number | undefined = undefined, isVertical: boolean | undefined = undefined): ConlangElement {
		switch(language) {
			case 'English':
			default:
				return English.Display(cleanDiv, div, value, fontSize, isVertical);
			case 'Hwayu':
				return Hwayu.Display(cleanDiv, div, value, fontSize, isVertical);
			case 'Color Lang':
				return ColorLang.Display(cleanDiv, div, value, fontSize, isVertical);
		}
	}

	static SpeakOrAnimate(cleanDiv: HTMLDivElement, div: HTMLDivElement, language: string, value: string | undefined = undefined, fontSize: number | undefined = undefined, isVertical: boolean | undefined = undefined): ConlangElement {
		switch(language) {
			case 'English':
			default:
				throw Error('This language does not have an animating or speaking function');
			case 'Hwayu':
				throw Error('This language does not have an animating or speaking function');
			case 'Color Lang':
				return ColorLang.SpeakOrAnimate(cleanDiv, div, value, fontSize, isVertical);
		}
	}
}
