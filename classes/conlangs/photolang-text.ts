export class PhotoLang {
	static Display(div: HTMLDivElement, text = '', fontSize = 10, moveSpeeds: number[] | null = null, durations: number[] | null = null, doLoop = false): HTMLElement {
		const line = new PhotoLine(text);
		if (!moveSpeeds) {
			moveSpeeds = [100, 250, 500];
		}
		if (!durations) {
			durations = [0, 500];
		}
		const displayDiv = div.createDiv();
		line.Speak(displayDiv, fontSize, moveSpeeds, durations, doLoop);
		return displayDiv;
	}
	static CreateTextArea(div: HTMLDivElement, existingText = '', fontSize = 17.5): HTMLTextAreaElement {
		const textArea = div.createEl('textarea', { text: existingText } );
		textArea.style.fontSize = fontSize + 'px';
		textArea.spellcheck = false;
		return textArea;
	}
	static CreateTextInput(div: HTMLDivElement, existingText = '', fontSize = 17.5): PhotoLangInput {
		return new PhotoLangInput(div, existingText, fontSize, [100, 250, 500], [0, 500]);
	}
}

export class PhotoLangInput {
	line: PhotoLine;
	get value() {
		return this.line.toText();
	}
	onchange: () => Promise<null> | null;

	constructor(div: HTMLDivElement, value: string, fontSize = 17.5, moveSpeeds: number[], durations: number[]) {
		const hbox = div.createDiv('hbox');
		this.line = new PhotoLine(value);
		for (let i = 0; i < this.line.words.length; i++) {
			const index = i;
			const word = this.line.words[i];
			const wordDiv = hbox.createDiv('vbox');
			wordDiv.style.width = (fontSize * 3.25) + 'px';
			const speakDiv = wordDiv.createDiv();
			speakDiv.style.fontSize = fontSize + 'px';
			speakDiv.style.fontFamily = 'Photolang';
			speakDiv.style.position = 'relative';
			speakDiv.style.height = (fontSize * 3.25) + 'px';
			speakDiv.style.width = (fontSize * 3.25) + 'px';
			word.Speak(speakDiv, fontSize, moveSpeeds, durations, true);
			const input = wordDiv.createEl('input', { type: 'text', value: word.toText() } );
			input.spellcheck = false;
			input.style.fontSize = (fontSize * 0.5) + 'px';
			input.onchange = async () => {
				this.line.words[index] = new PhotoWord(input.value);
				await this.onchange();
			}
		}
	}
}

export class PhotoLine {
	words: PhotoWord[];

	toText(): string {
		let output = '';
		for (let i = 0; i < this.words.length; i++) {
			output += this.words[i].toText();
			output += '|||';
		}
		return output;
	}

	constructor(textContent = '') {
		this.words = [];

		const textArray = textContent.split("|||").filter((c: string) => c !== "");

		for (let i = 0; i < textArray.length; i++) {
			const wordText = textArray[i];
			const newWord = new PhotoWord(wordText);
			this.words.push(newWord);
		}

	}

	async Speak(div: HTMLDivElement, textSize: number, moveSpeeds: number[], durations: number[], doLoop = false) {
		div.style.fontSize = textSize + 'px';
		div.style.fontFamily = 'Photolang';
		div.style.position = 'relative';
		div.style.height = (textSize * 3.25) + 'px';
		div.style.width = (textSize * 3.25) + 'px';

		for (let i = 0; i < this.words.length; i++) {
			const photoword = this.words[i];

			await photoword.Speak(div, textSize, moveSpeeds, durations, false);
			await sleep(200);
			if (doLoop && i === this.words.length - 1) {
				i = -1;
			}
		}
		div.remove();
	}

	async DisplayStatic(div: HTMLDivElement, textSize: number, moveSpeeds: number[] | null, durations: number[] | null) {
		if (!moveSpeeds) {
			moveSpeeds = [100, 250, 500];
		}
		if (!durations) {
			durations = [0, 500];
		}
		const lineDiv = div.createDiv('hbox');
		for (let i = 0; i < this.words.length; i++) {
			const wordDiv = lineDiv.createDiv();
			wordDiv.className = 'cfe-photoglyph';
			wordDiv.style.fontSize = textSize + 'px';
			wordDiv.style.fontFamily = 'Photolang';
			wordDiv.style.position = 'relative';
			wordDiv.style.height = (textSize * 3.25) + 'px';
			wordDiv.style.width = (textSize * 3.25) + 'px';
			this.words[i].Speak(wordDiv, textSize, moveSpeeds, durations, true);
		}
	}

}

export class PhotoWord {
	glyphs: PhotoGlyph[];

	toText(): string {
		let output = '';
		for (let i = 0; i < this.glyphs.length; i++) {
			output += this.glyphs[i].toText();
			output += '   ';
		}
		return output;
	}

	constructor(textContent = '') {
		this.glyphs = [];

		const textArray = textContent.split("   ").filter((c: string) => c !== "");

		for (let i = 0; i < textArray.length; i++) {
			const glyphText = textArray[i];
			const newGlyph = new PhotoGlyph(glyphText);
			this.glyphs.push(newGlyph);
		}
	}

	async Speak(div: HTMLDivElement, textSize: number, moveSpeeds: number[], durations: number[], doLoop = false) {
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
		textDiv.remove();
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
	
	constructor(glyphText: string) {
		let j = 0;
		let skipNext = false;

		// move speed
		switch (glyphText[j]) {
			case '.':
				this.moveSpeed = 0;
				break;
			case '-':
				this.moveSpeed = 1;
				break;
			case '=':
				this.moveSpeed = 2;
				break;
		}
		j++;

		// duration
		switch (glyphText[j]) {
			case '.':
				this.duration = 0;
				break;
			case '-':
				this.duration = 1;
				break;
		}
		j++;

		// shape
		this.shape = glyphText[j];
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
				this.hue = 0;
				this.saturation = 0;
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
					this.hue = hue1;
					skipNext = true;
					break;
			}
			if (!skipNext) {
				if (hue1 === 0 && hue2 === 270 || hue1 === 270 && hue2 === 0) {
					this.hue = 315;
				} else {
					this.hue = (hue1 + hue2) / 2;
				}
				j++;
			}
		}
		skipNext = false;

		// saturation
		const saturationText = glyphText[j];
		switch (saturationText) {
			case '0':
				this.saturation = 0;
				break;
			case '1':
				this.saturation = 0.25;
				break;
			case '2':
				this.saturation = 0.5;
				break;
			case '3':
				this.saturation = 0.75;
				break;
			case '4':
				this.saturation = 1;
				break;
		}
		j++;

		// value
		const valueText = glyphText[j];
		switch (valueText) {
			case '0':
				this.value = 0;
				break;
			case '1':
				this.value = 0.1;
				break;
			case '2':
				this.value = 0.2;
				break;
			case '3':
				this.value = 0.5;
				break;
			case '4':
				this.value = 1;
				break;
		}
		j++;

		// opacity
		const opacityText = glyphText[j];
		switch (opacityText) {
			case '.':
				this.opacity = 0;
				break;
			case '-':
				this.opacity = 0.5;
				break;
			case '=':
				this.opacity = 1;
				break;
		}
		j++;

		const locationInfo = glyphText.substring(j);

		// location
		// x
		if (locationInfo.contains('<')) {
			this.x = 0;
		} else if (locationInfo.contains('>')) {
			this.x = 2;
		} else {
			this.x = 1;
		}
		// y
		if (locationInfo.contains('v')) {
			this.y = 0;
		} else if (locationInfo.contains('^')) {
			this.y = 2;
		} else {
			this.y = 1;
		}
	}

	toText(): string {
		let output = '';
		switch (this.moveSpeed) {
			case 0:
				output += '.';
				break;
			case 1:
				output += '-';
				break;
			case 2:
				output += '=';
				break;
		}

		switch (this.duration) {
			case 0:
				output += '.';
				break;
			case 1:
				output += '-';
				break;
		}

		output += this.shape;

		switch (this.hue) {
			case 0:
				output += 'r';
				break;
			case 20:
				output += 'ro';
				break;
			case 40:
				output += 'o';
				break;
			case 50:
				output += 'yo';
				break;
			case 60:
				output += 'yo';
				break;
			case 90:
				output += 'yg';
				break;
			case 120:
				output += 'g';
				break;
			case 150:
				output += 'cg';
				break;
			case 180:
				output += 'c';
				break;
			case 210:
				output += 'cb';
				break;
			case 240:
				output += 'b';
				break;
			case 255:
				output += 'bp';
				break;
			case 270:
				output += 'p';
				break;
			case 315:
				output += 'pr';
				break;
		}

		switch (this.saturation) {
			case 0:
				output += '0';
				break;
			case 0.25:
				output += '1';
				break;
			case 0.5:
				output += '2';
				break;
			case 0.75:
				output += '3';
				break;
			case 1:
				output += '4';
				break;
		}

		switch (this.value) {
			case 0:
				output += '0';
				break;
			case 0.1:
				output += '1';
				break;
			case 0.2:
				output += '2';
				break;
			case 0.5:
				output += '3';
				break;
			case 1:
				output += '4';
				break;
		}

		switch (this.opacity) {
			case 0:
				output += '.';
				break;
			case 0.5:
				output += '-';
				break;
			case 1:
				output += '=';
				break;
		}

		switch (this.x) {
			case 0:
				output += '<';
				break;
			case 2:
				output += '>';
				break;
		}

		switch (this.y) {
			case 0:
				output += 'v';
				break;
			case 2:
				output += '^';
				break;
		}
		
		return output;
	}

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
