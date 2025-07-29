import { Hwayu } from "./hwayu";
import { English } from "./english";
import { ConlangElement, ConlangMultiLineEditor, ConlangOneLineEditor } from "./language";

export class LanguageHandler {
	static knownLanguages = [
		'English',
		'Hwayu'
	]

	static CreateOneLineEditor(div: HTMLDivElement, language: string, value: string | undefined = undefined, fontSize: number | undefined = undefined, isVertical: boolean | undefined = undefined): ConlangOneLineEditor {
		switch(language) {
			case 'Hwayu':
				return Hwayu.CreateOneLineEditor(div, value, fontSize, isVertical);
			case 'English':
			default:
				return English.CreateOneLineEditor(div, value, fontSize, isVertical);
		}
	}

	static CreateMultiLineEditor(div: HTMLDivElement, language: string, value: string | undefined = undefined, fontSize: number | undefined = undefined, isVertical: boolean | undefined = undefined): ConlangMultiLineEditor {
		switch(language) {
			case 'Hwayu':
				return Hwayu.CreateMultiLineEditor(div, value, fontSize, isVertical);
			case 'English':
			default:
				return English.CreateMultiLineEditor(div, value, fontSize, isVertical);
		}
	}

	static Display(div: HTMLDivElement, language: string, value: string | undefined = undefined, fontSize: number | undefined = undefined, isVertical: boolean | undefined = undefined): ConlangElement {
		switch(language) {
			case 'Hwayu':
				return Hwayu.Display(div, value, fontSize, isVertical);
			case 'English':
			default:
				return English.Display(div, value, fontSize, isVertical);
		}
	}

	static AnimateOrSpeak(div: HTMLDivElement, language: string, value: string | undefined = undefined, fontSize: number | undefined = undefined, isVertical: boolean | undefined = undefined): ConlangElement {
		switch(language) {
			case 'Hwayu':
				throw Error('This language does not have an animating or speaking function');
			case 'English':
			default:
				throw Error('This language does not have an animating or speaking function');
		}
	}
}
