export class PhotoLang {
	static async Display(div: HTMLDivElement, text = '', fontSize = 10, moveSpeeds: number[] | null = null, durations: number[] | null = null, doLoop = false) {
		const line = new PhotoLine(text);
		if (!moveSpeeds) {
			moveSpeeds = [100, 250, 500];
		}
		if (!durations) {
			durations = [0, 500];
		}
		await line.Speak(div, fontSize, moveSpeeds, durations, doLoop);
	}
	static DisplayEditor(div: HTMLDivElement, existingText = '', fontSize = 17.5): HTMLInputElement | HTMLTextAreaElement {
		const textArea = div.createEl('textarea', { value: existingText } );
		textArea.style.fontSize = fontSize + 'px';
		return textArea;
	}
}

export class PhotoLine {
	glyphs: PhotoGlyph[];
	constructor(textContent = '') {
		this.glyphs = [];

		const textArray = textContent.split("   ").filter((c: string) => c !== "");
		for (let i = 0; i < textArray.length; i++) {
			const newGlyph = new PhotoGlyph();
			const glyphText = textArray[i];

			let j = 0;
			let skipNext = false;

			// move speed
			switch (glyphText[j]) {
				case '.':
					newGlyph.moveSpeed = 0;
					break;
				case '-':
					newGlyph.moveSpeed = 1;
					break;
				case '=':
					newGlyph.moveSpeed = 2;
					break;
			}
			j++;

			// duration
			switch (glyphText[j]) {
				case '.':
					newGlyph.duration = 0;
					break;
				case '-':
					newGlyph.duration = 1;
					break;
			}
			j++;

			// shape
			newGlyph.shape = glyphText[j];
			j++;

			// hue
			let hue1 = 0;
			switch (glyphText[j]) {
				case 'r':
					hue1 = 0;
					break;
				case 'o':
					hue1 = 40;
					break;
				case 'y':
					hue1 = 60;
					break;
				case 'g':
					hue1 = 120;
					break;
				case 'c':
					hue1 = 180;
					break;
				case 'b':
					hue1 = 240;
					break;
				case 'p':
					hue1 = 270;
					break;
				case '.':
					newGlyph.hue = 0;
					newGlyph.saturation = 0;
					skipNext = true;
					break;
			}
			j++;
			if (!skipNext) {
				let hue2 = 0;
				switch (glyphText[j]) {
					case 'r':
						hue2 = 0;
						break;
					case 'o':
						hue2 = 40;
						break;
					case 'y':
						hue2 = 60;
						break;
					case 'g':
						hue2 = 120;
						break;
					case 'c':
						hue2 = 180;
						break;
					case 'b':
						hue2 = 240;
						break;
					case 'p':
						hue2 = 270;
						break;
					default:
						newGlyph.hue = hue1;
						skipNext = true;
						break;
				}
				if (!skipNext) {
					if (hue1 === 0 && hue2 === 270 || hue1 === 270 && hue2 === 0) {
						newGlyph.hue = 315;
					} else {
						newGlyph.hue = (hue1 + hue2) / 2;
					}
					j++;
				}
			}
			skipNext = false;

			// saturation
			const saturationText = glyphText[j];
			switch (saturationText) {
				case '0':
					newGlyph.saturation = 0;
					break;
				case '1':
					newGlyph.saturation = 0.25;
					break;
				case '2':
					newGlyph.saturation = 0.5;
					break;
				case '3':
					newGlyph.saturation = 0.75;
					break;
				case '4':
					newGlyph.saturation = 1;
					break;
			}
			j++;

			// value
			const valueText = glyphText[j];
			switch (valueText) {
				case '0':
					newGlyph.value = 0;
					break;
				case '1':
					newGlyph.value = 0.1;
					break;
				case '2':
					newGlyph.value = 0.2;
					break;
				case '3':
					newGlyph.value = 0.5;
					break;
				case '4':
					newGlyph.value = 1;
					break;
			}
			j++;

			// opacity
			const opacityText = glyphText[j];
			switch (opacityText) {
				case '.':
					newGlyph.opacity = 0;
					break;
				case '-':
					newGlyph.opacity = 0.5;
					break;
				case '=':
					newGlyph.opacity = 1;
					break;
			}
			j++;

			// location
			// x
			if (glyphText.contains('<')) {
				newGlyph.x = 0;
			} else if (glyphText.contains('>')) {
				newGlyph.x = 2;
			} else {
				newGlyph.x = 1;
			}
			// y
			if (glyphText.contains('v')) {
				newGlyph.y = 0;
			} else if (glyphText.contains('^')) {
				newGlyph.y = 2;
			} else {
				newGlyph.y = 1;
			}
			this.glyphs.push(newGlyph);
		}
	}

	async Speak(div: HTMLDivElement, textSize: number, moveSpeeds: number[], durations: number[], doLoop = false) {
		div.style.fontSize = textSize + 'px';
		div.style.fontFamily = 'Photolang';
		div.style.position = 'relative';
		div.style.height = (textSize * 3.25) + 'px';
		div.style.width = (textSize * 3.25) + 'px';
		const textDiv = div.createDiv();
		textDiv.style.position = 'absolute';
		textDiv.style.bottom = textSize + 'px';
		textDiv.style.transitionProperty = 'bottom, left, color';
		for (let i = 0; i < this.glyphs.length; i++) {
			const photoGlyph = this.glyphs[i];

			textDiv.textContent = photoGlyph.shape;
			textDiv.style.left = (photoGlyph.x * textSize) + 'px';
			textDiv.style.bottom = (photoGlyph.y * textSize) + 'px';
			textDiv.style.color = photoGlyph.color;

			if (doLoop && i === this.glyphs.length - 1) {
				i = -1;
			}
			textDiv.style.transition = moveSpeeds[photoGlyph.moveSpeed] + 'ms';
			await sleep(moveSpeeds[photoGlyph.moveSpeed] + durations[photoGlyph.duration]);
		}
		div.remove();
	}

	async DisplayStatic(div: HTMLDivElement, textSize: number) {
		const lineDiv = div.createDiv('cfe-photolang-line');
		lineDiv.style.gridTemplateColumns = 'repeat(10, ' + (textSize * 3.25) + 'px)';
		lineDiv.style.gridTemplateRows = 'repeat(10, ' + (textSize * 3.25) + 'px)';
		for (let i = 0; i < this.glyphs.length; i++) {
			this.glyphs[i] = Object.assign(new PhotoGlyph(), this.glyphs[i]);
			this.glyphs[i].DisplayStatic(lineDiv.createDiv(), textSize);
		}
	}

}

export class PhotoGlyph {
	shape: string;
	x: number;
	y: number;
	hue: number;
	saturation: number;
	value: number;
	opacity: number;
	moveSpeed: number;
	duration: number;

	get color() {
		// hsv values are in [0, 1]
		let lightness = (2 - this.saturation) * this.value / 2;
		let newS = this.saturation * this.value / (lightness < 1 ? lightness * 2 : 2 - lightness * 2);

		// Handle the case where lightness is 0 or 1, which results in saturation being 0
		if (lightness === 0 || lightness === 1) {
			newS = 0;
		}

		lightness *= 100;
		newS *= 100;

		return 'hsla(' + this.hue + ',' + newS + '%,' + lightness + '%,' + this.opacity + ')';
	}

	DisplayStatic(div: HTMLDivElement, textSize: number) {
		const outerDiv = div.createDiv();
		outerDiv.style.position = 'relative';
		outerDiv.style.width = (textSize * 3.25) + 'px';
		outerDiv.style.height = (textSize * 3.25) + 'px';
		outerDiv.className = 'cfe-photoglyph';
		const glyphDiv = outerDiv.createDiv();
		glyphDiv.style.position = 'absolute';
		glyphDiv.textContent = this.shape;
		glyphDiv.style.left = (this.x * textSize) + 'px';
		glyphDiv.style.bottom = (this.y * textSize) + 'px';
		glyphDiv.style.color = this.color;
	}
}
