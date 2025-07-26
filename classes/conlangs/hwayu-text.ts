export class Hwayu {
	static Display(div: HTMLDivElement, text = '', fontSize = 20, isVertical = true): HTMLElement {
		const textElement = div.createDiv();
		textElement.textContent = text;
		textElement.style.fontFamily = isVertical ? 'HwayuReal' : 'HwayuHorizontal';
		textElement.style.fontSize = fontSize + 'px';
		if (isVertical) {
			textElement.style.writingMode = 'vertical-lr';
			textElement.style.textOrientation = 'upright';
		}
		return textElement;
	}

	static CreateTextArea(div: HTMLDivElement, existingText = '', fontSize = 20, isVertical = true): HTMLTextAreaElement {
		const textArea = div.createEl('textarea', { text: existingText } );
		textArea.style.fontFamily = isVertical ? 'HwayuReal' : 'HwayuHorizontal';
		textArea.style.fontSize = fontSize + 'px';
		if (isVertical) {
			textArea.style.writingMode = 'vertical-lr';
			textArea.style.textOrientation = 'upright';
		}
		textArea.spellcheck = false;
		return textArea;
	}

	static CreateTextInput(div: HTMLDivElement, existingText = '', fontSize = 20, isVertical = true): HTMLInputElement {
		const textInput = div.createEl('input', { type: 'text', value: existingText } );
		textInput.style.fontFamily = isVertical ? 'HwayuReal' : 'HwayuHorizontal';
		textInput.style.fontSize = fontSize + 'px';
		if (isVertical) {
			textInput.style.writingMode = 'vertical-lr';
			textInput.style.textOrientation = 'upright';
		}
		textInput.spellcheck = false;
		return textInput;
	}
}
