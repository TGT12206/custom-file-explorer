export class Hwayu {
	static Display(div: HTMLDivElement, text = '', fontSize = 17.5, isVertical = true) {
		const textElement = div.createEl('p', { text: text } );
		textElement.style.fontFamily = isVertical ? 'HwayuReal' : 'HwayuHorizontal';
		textElement.style.fontSize = fontSize + 'px';
		if (isVertical) {
			textElement.style.writingMode = 'vertical-lr';
			textElement.style.textOrientation = 'upright';
		}
	}
	static DisplayEditor(div: HTMLDivElement, existingText = '', fontSize = 17.5, isVertical = true): HTMLInputElement | HTMLTextAreaElement {
		const textArea = div.createEl('textarea', { value: existingText } );
		textArea.style.fontFamily = isVertical ? 'HwayuReal' : 'HwayuHorizontal';
		textArea.style.fontSize = fontSize + 'px';
		if (isVertical) {
			textArea.style.writingMode = 'vertical-lr';
			textArea.style.textOrientation = 'upright';
		}
		return textArea;
	}
}
