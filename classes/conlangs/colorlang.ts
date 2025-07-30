import { ConlangElement, ConlangOneLineEditor, Language } from "./language";

export class ColorLang extends Language {
	static CreateOneLineEditor(cleanDiv: HTMLDivElement, div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = true): ColorLangEditor {
		const textElement = new ColorLangEditor(cleanDiv, div, value, fontSize, isVertical);
		return textElement;
	}

	static CreateMultiLineEditor(cleanDiv: HTMLDivElement, div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = true): ColorLangEditor {
		const textElement = new ColorLangEditor(cleanDiv, div, value, fontSize, isVertical);
		return textElement;
	}

	static Display(cleanDiv: HTMLDivElement, div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = true): StaticColorLangElement {
		const textElement = new StaticColorLangElement(cleanDiv, div, value, fontSize, isVertical);
		return textElement;
	}

	static SpeakOrAnimate(cleanDiv: HTMLDivElement, div: HTMLDivElement, value = '', fontSize = 17.5, isVertical = true): AnimatedColorLangElement {
		const textElement = new AnimatedColorLangElement(cleanDiv, div, value, fontSize, isVertical);
		return textElement;
	}
}

export class AnimatedColorLangElement extends ConlangElement {
	cleanDiv: HTMLDivElement;
	wrapperDiv: HTMLDivElement;
	content: ColorPhrase;
	realIsVertical: boolean;

	get style(): CSSStyleDeclaration {
		return this.wrapperDiv.style;
	}
	get value(): string {
		return JSON.stringify(this.content);
	}
	set value(newValue: string) {
		try {
			const plainPhrase = JSON.parse(newValue);
			this.content = Object.assign(new ColorPhrase(), plainPhrase);
			for (let i = 0; i < this.content.words.length; i++) {
				this.content.words[i] = Object.assign(new ColorWord(), this.content.words[i]);
				for (let j = 0; j < this.content.words[i].tracks.length; j++) {
					this.content.words[i].tracks[j] = Object.assign(new ColorWordTrack(), this.content.words[i].tracks[j]);
					for (let k = 0; k < this.content.words[i].tracks[j].glyphs.length; k++) {
						this.content.words[i].tracks[j].glyphs[k] = Object.assign(new ColorGlyph(), this.content.words[i].tracks[j].glyphs[k]);
					}
				}
			}
		} catch (e) {
			console.log('Color Lang text was not valid');
		}
		this.Display();
	}
	get className(): string {
		return this.wrapperDiv.className;
	}
	set className(newValue: string) {
		this.wrapperDiv.className = newValue;
	}
	get classList(): DOMTokenList {
		return this.wrapperDiv.classList;
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

	constructor(cleanDiv: HTMLDivElement, div: HTMLDivElement, value = '', fontSize = 10, isVertical = false) {
		super();
		this.cleanDiv = cleanDiv;
		this.wrapperDiv = div.createDiv();
		this.content = new ColorPhrase();
		this.fontSize = fontSize;
		this.value = value;
		this.isVertical = isVertical;
		this.wrapperDiv.onclick = async () => {
			await this.onclick();
		}
	}

	private async Display() {
		for (let i = 0; i < this.content.words.length; i++) {
			const word = this.content.words[i];
			console.log('c' + this.fontSize);
			await word.DisplayOnce(this.wrapperDiv, this.fontSize);
		}
		this.wrapperDiv.remove();
	}
}

export class StaticColorLangElement extends ConlangElement {
	cleanDiv: HTMLDivElement;
	wrapperDiv: HTMLDivElement;
	lineDiv: HTMLDivElement;
	content: ColorPhrase;
	realIsVertical: boolean;

	get style(): CSSStyleDeclaration {
		return this.wrapperDiv.style;
	}
	get value(): string {
		return JSON.stringify(this.content);
	}
	set value(newValue: string) {
		try {
			const plainPhrase = JSON.parse(newValue);
			this.content = Object.assign(new ColorPhrase(), plainPhrase);
			for (let i = 0; i < this.content.words.length; i++) {
				this.content.words[i] = Object.assign(new ColorWord(), this.content.words[i]);
				for (let j = 0; j < this.content.words[i].tracks.length; j++) {
					this.content.words[i].tracks[j] = Object.assign(new ColorWordTrack(), this.content.words[i].tracks[j]);
					for (let k = 0; k < this.content.words[i].tracks[j].glyphs.length; k++) {
						this.content.words[i].tracks[j].glyphs[k] = Object.assign(new ColorGlyph(), this.content.words[i].tracks[j].glyphs[k]);
					}
				}
			}
		} catch (e) {
			console.log('Color Lang text was not valid');
		}
		this.Display();
	}
	get className(): string {
		return this.wrapperDiv.className;
	}
	set className(newValue: string) {
		this.wrapperDiv.className = newValue;
	}
	get classList(): DOMTokenList {
		return this.wrapperDiv.classList;
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

	constructor(cleanDiv: HTMLDivElement, div: HTMLDivElement, value = '', fontSize = 10, isVertical = false) {
		super();
		this.cleanDiv = cleanDiv;
		this.wrapperDiv = div.createDiv();
		this.lineDiv = this.wrapperDiv.createDiv();
		this.content = new ColorPhrase();
		this.fontSize = fontSize;
		this.value = value;
		this.isVertical = isVertical;
		this.wrapperDiv.onclick = async () => {
			await this.onclick();
		}
	}

	private Display() {
		this.lineDiv.remove();
		this.lineDiv = this.wrapperDiv.createDiv();

		for (let i = 0; i < this.content.words.length; i++) {
			const word = this.content.words[i];
			word.DisplayLoop(this.lineDiv, this.fontSize);
		}
	}
}

export class ColorLangEditor extends ConlangOneLineEditor {
	cleanDiv: HTMLDivElement;
	wrapperDiv: HTMLDivElement;
	lineDiv: HTMLDivElement;
	content: ColorPhrase;
	realIsVertical: boolean;

	get style(): CSSStyleDeclaration {
		return this.wrapperDiv.style;
	}
	get value(): string {
		if (this.content.words.length > 0) {
			return JSON.stringify(this.content);
		}
		return '';
	}
	set value(newValue: string) {
		try {
			const plainPhrase = JSON.parse(newValue);
			this.content = Object.assign(new ColorPhrase(), plainPhrase);
			for (let i = 0; i < this.content.words.length; i++) {
				this.content.words[i] = Object.assign(new ColorWord(), this.content.words[i]);
				for (let j = 0; j < this.content.words[i].tracks.length; j++) {
					this.content.words[i].tracks[j] = Object.assign(new ColorWordTrack(), this.content.words[i].tracks[j]);
					for (let k = 0; k < this.content.words[i].tracks[j].glyphs.length; k++) {
						this.content.words[i].tracks[j].glyphs[k] = Object.assign(new ColorGlyph(), this.content.words[i].tracks[j].glyphs[k]);
					}
				}
			}
		} catch (e) {
			console.log('Color Lang text was not valid');
		}
		this.onchange();
		this.Display();
	}
	get className(): string {
		return this.wrapperDiv.className;
	}
	set className(newValue: string) {
		this.wrapperDiv.className = newValue;
	}
	get classList(): DOMTokenList {
		return this.wrapperDiv.classList;
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

	constructor(cleanDiv: HTMLDivElement, div: HTMLDivElement, value = '', fontSize = 10, isVertical = false) {
		super();
		this.cleanDiv = cleanDiv;
		this.wrapperDiv = div.createDiv();
		this.lineDiv = this.wrapperDiv.createDiv();
		this.content = new ColorPhrase();
		this.fontSize = fontSize;
		this.value = value;
		this.isVertical = isVertical;
		this.wrapperDiv.onclick = async () => {
			await this.onclick();
		}
	}

	private Display() {
		this.wrapperDiv.empty();
		this.lineDiv = this.wrapperDiv.createDiv(this.isVertical ? 'vbox' : 'hbox');

		for (let i = 0; i < this.content.words.length; i++) {
			const index = i;
			const wordCard = this.lineDiv.createDiv(this.isVertical ? 'hbox' : 'vbox');
			const deleteButton = wordCard.createEl('button', { text: '-' } );
			deleteButton.className = 'cfe-remove-button';

			const wordDiv = wordCard.createDiv();
			wordDiv.classList.add('cfe-pointer-hover');
			const word = this.content.words[i];
			word.DisplayLoop(wordDiv, this.fontSize);
			wordDiv.onclick = () => {
				word.DisplayEditor(this.cleanDiv.createDiv());
			}

			const fullWordInput = wordCard.createEl('input', { type: 'text', value: JSON.stringify(word) } );
			fullWordInput.onchange = () => {
				const plainWord = JSON.parse(fullWordInput.value);
				this.content.words[index] = Object.assign(new ColorWord(), plainWord);
				for (let j = 0; j < this.content.words[index].tracks.length; j++) {
					this.content.words[index].tracks[j] = Object.assign(new ColorWordTrack(), this.content.words[index].tracks[j]);
					for (let k = 0; k < this.content.words[index].tracks[j].glyphs.length; k++) {
						this.content.words[index].tracks[j].glyphs[k] = Object.assign(new ColorGlyph(), this.content.words[index].tracks[j].glyphs[k]);
					}
				}
			}
			this.isVertical ? fullWordInput.style.height : fullWordInput.style.width = (this.fontSize * 3.25) + 'px';

			this.isVertical ? deleteButton.style.height : deleteButton.style.width = (this.fontSize * 3.25) + 'px';
			deleteButton.onclick = () => {
				this.content.words.splice(index, 1);
				this.value = JSON.stringify(this.content);
			}
		}

		const addButton = this.lineDiv.createEl('button', { text: '+' } );

		const fullInput = this.lineDiv.createEl('input', { type: 'text', value: this.value } );
		this.isVertical ? fullInput.style.height : fullInput.style.width = (this.fontSize * 3.25) + 'px';

		const saveButton = this.lineDiv.createEl('button', { text: 'save' } );

		addButton.onclick = () => {
			this.content.words.push(new ColorWord());
			this.Display();
		}
		fullInput.onchange = () => {
			this.value = fullInput.value;
		}
		saveButton.onclick = () => {
			this.value = JSON.stringify(this.content);
		}
	}
}

class ColorPhrase {
	words: ColorWord[];

	constructor() {
		this.words = [];
	}

	async DisplayOnce(div: HTMLDivElement, fontSize = 17.5) {
		for (let i = 0; i < this.words.length; i++) {
			await this.words[i].DisplayOnce(div, fontSize);
		}
	}

	async DisplayLoop(div: HTMLDivElement, fontSize = 17.5) {
		for (let i = 0; i < this.words.length; i++) {
			for (let j = 0; j < this.words.length; j++) {
				await this.words[j].DisplayOnce(div, fontSize);
			}
			if (i === this.words.length - 1) {
				i = -1;
			}
		}
	}
}

class ColorWord {
	tracks: ColorWordTrack[];

	constructor() {
		this.tracks = [];
		this.tracks.push(new ColorWordTrack());
	}

	get duration() {
		let max = 0;
		for (let i = 0; i < this.tracks.length; i++) {
			let ms = 0;
			ms += this.tracks[i].duration;
			if (ms > max) {
				max = ms;
			}
		}
		return max;
	}

	async DisplayOnce(div: HTMLDivElement, fontSize = 17.5) {
		const wordDiv = div.createDiv();
		wordDiv.style.position = 'relative';
		wordDiv.style.width = (fontSize * 3.25) + 'px';
		wordDiv.style.height = (fontSize * 3.25) + 'px';

		for (let i = 0; i < this.tracks.length; i++) {
			this.tracks[i].DisplayOnce(wordDiv, fontSize);
		}
		await sleep(this.duration);

		wordDiv.remove();
	}

	async DisplayStatic(div: HTMLDivElement, fontSize = 17.5) {
		div.empty();
		const wordDiv = div.createDiv();
		wordDiv.style.position = 'relative';
		wordDiv.style.width = (fontSize * 3.25) + 'px';
		wordDiv.style.height = (fontSize * 3.25) + 'px';

		for (let i = 0; i < this.tracks.length; i++) {
			const track = this.tracks[i];
			track.DisplayStatic(wordDiv, fontSize);
		}
	}

	async DisplayLoop(div: HTMLDivElement, fontSize = 17.5) {
		div.empty();
		const wordDiv = div.createDiv();
		wordDiv.style.position = 'relative';
		wordDiv.style.width = (fontSize * 3.25) + 'px';
		wordDiv.style.height = (fontSize * 3.25) + 'px';

		let doLoop = true;
		doLoop = true;
		while (doLoop) {
			for (let i = 0; i < this.tracks.length; i++) {
				const track = this.tracks[i];
				track.DisplayOnce(wordDiv, fontSize);
			}
			await sleep(this.duration);
		}
	}

	DisplayEditor(div: HTMLDivElement) {
		div.empty();
		const popup = div.createDiv('cfe-popup');
		
		const exitButtonDiv = popup.createDiv();
		exitButtonDiv.style.position = 'relative';

		const exitButton = exitButtonDiv.createEl('button', { text: 'X' } );
		exitButton.className = 'cfe-remove-button';
		exitButton.style.position = 'absolute';
		exitButton.style.top = '0%';
		exitButton.style.right = '0%';
		exitButton.onclick = () => {
			div.remove();
		}

		const halves = popup.createDiv('hbox');
		halves.style.width = '100%';
		halves.style.height = '100%';
		const leftSide = halves.createDiv('vbox');
		leftSide.style.width = '40%';
		const glyphsDiv = halves.createDiv('vbox');
		glyphsDiv.style.width = '60%';

		const speakDiv = leftSide.createDiv();
		speakDiv.style.height = '50%';
		this.DisplayLoop(speakDiv, 100);

		const tracksDiv = leftSide.createDiv();
		tracksDiv.style.height = '50%';
		for (let i = 0; i < this.tracks.length; i++) {
			const index = i;
			const trackDiv = tracksDiv.createDiv('hbox');
			trackDiv.style.width = '100%';
			trackDiv.style.borderStyle = 'solid';
			trackDiv.style.borderColor = '#FFFFFF';
			const trackNumber = trackDiv.createEl('div', { text: 'track ' + i } );
			trackNumber.style.width = '100%';
			trackNumber.className = 'cfe-pointer-hover';
			const deleteButton = trackDiv.createEl('button', { text: '-' } );
			deleteButton.className = 'cfe-remove-button';
			trackNumber.onclick = () => {
				this.tracks[index].DisplayEditor(glyphsDiv);
			}
			deleteButton.onclick = () => {
				this.tracks.splice(index, 1);
				trackDiv.remove();
				this.DisplayEditor(div);
			}
		}

		const addButton = tracksDiv.createEl('button', { text: '+' } );
		addButton.onclick = () => {
			this.tracks.push(new ColorWordTrack());
			this.DisplayEditor(div);
		}
	}
}

class ColorWordTrack {
	glyphs: ColorGlyph[];

	constructor() {
		this.glyphs = [];
		this.glyphs.push(new ColorGlyph());
	}
	get duration() {
		let ms = 0;
		for (let i = 0; i < this.glyphs.length; i++) {
			ms += this.glyphs[i].transitionTime;
			ms += this.glyphs[i].duration;
		}
		return ms;
	}

	DisplayStatic(div: HTMLDivElement, fontSize = 17.5) {
		if (this.glyphs.length < 1) {
			return;
		}
		const trackDiv = div.createDiv();
		trackDiv.style.position = 'absolute';

		trackDiv.style.fontFamily = 'ColorLang';
		trackDiv.style.fontSize = fontSize + 'px';
		trackDiv.style.transitionProperty = 'all';

		this.glyphs[0].DisplayStatic(trackDiv, fontSize);
	}

	async DisplayOnce(div: HTMLDivElement, fontSize = 17.5) {
		const trackDiv = div.createDiv();
		trackDiv.style.position = 'absolute';

		trackDiv.style.fontFamily = 'ColorLang';
		trackDiv.style.fontSize = fontSize + 'px';
		trackDiv.style.transitionProperty = 'all';

		for (let i = 0; i < this.glyphs.length; i++) {
			const glyph = this.glyphs[i];
			await glyph.Display(trackDiv, fontSize);
		}

		trackDiv.remove();
	}

	async DisplayLoop(div: HTMLDivElement, fontSize = 17.5) {
		const trackDiv = div.createDiv();
		trackDiv.style.position = 'absolute';

		trackDiv.style.fontFamily = 'ColorLang';
		trackDiv.style.fontSize = fontSize + 'px';
		trackDiv.style.transitionProperty = 'all';

		for (let i = 0; i < this.glyphs.length; i++) {
			const glyph = this.glyphs[i];

			await glyph.Display(trackDiv, fontSize);

			if (i === this.glyphs.length - 1) {
				i = -1;
			}
		}

		trackDiv.remove();
	}

	DisplayEditor(glyphsDiv: HTMLDivElement) {
		glyphsDiv.empty();
		for (let i = 0; i < this.glyphs.length; i++) {
			const index = i;
			const glyphDiv = glyphsDiv.createDiv('hbox');
			glyphDiv.style.width = '100%';
			this.glyphs[i].DisplayEditor(glyphDiv);
			const deleteButton = glyphDiv.createEl('button', { text: '-' } );
			deleteButton.className = 'cfe-remove-button';
			deleteButton.onclick = () => {
				glyphDiv.remove();
				this.glyphs.splice(index, 1);
				this.DisplayEditor(glyphsDiv);
			}
		}
		const addButton = glyphsDiv.createEl('button', { text: '+' } );
		addButton.onclick = () => {
			this.glyphs.push(new ColorGlyph());
			this.DisplayEditor(glyphsDiv);
		}
	}
}

class ColorGlyph {
	shape: string;
	color: string;
	opacity: number;
	transitionTime: number;
	duration: number;
	size: number;
	x: number;
	y: number;
	z: number;
	r: number;

	constructor() {
		this.shape = 'o';
		this.color = '#FFFFFF';
		this.opacity = 100;
		this.transitionTime = 100;
		this.duration = 500;
		this.size = 100;
		this.x = 0;
		this.y = 0;
		this.z = 0;
		this.r = 0;
	}
	
	// Full disclosure, ChatGPT wrote this one
	private hexToRGBA(hex: string, opacity: number): string {
		// Remove '#' if present
		hex = hex.replace('#', '');

		// Parse hex components
		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);

		// Convert opacity percentage to a float between 0 and 1
		const alpha = opacity / 100;

		// Construct RGBA string
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	DisplayStatic(div: HTMLDivElement, fontSize: number) {
		div.textContent = this.shape;
		div.style.color = this.hexToRGBA(this.color, this.opacity);
		div.style.fontSize = (fontSize * this.size / 100) + 'px';
		div.style.transform = 'translate(-50%, 50%) rotate(' + this.r + 'deg)';
		div.style.left = (this.x + 50) + '%';
		div.style.bottom = (this.y + 50) + '%';
		div.style.zIndex = this.z + '';
	}

	async Display(div: HTMLDivElement, fontSize: number) {
		div.textContent = this.shape;
		div.style.color = this.hexToRGBA(this.color, this.opacity);
		div.style.fontSize = (fontSize * this.size / 100) + 'px';
		div.style.transform = 'translate(-50%, 50%) rotate(' + this.r + 'deg)';
		div.style.left = (this.x + 50) + '%';
		div.style.bottom = (this.y + 50) + '%';
		div.style.zIndex = this.z + '';
		div.style.transitionDuration = this.transitionTime + 'ms';
		await sleep(this.duration + this.transitionTime);
	}

	DisplayEditor(div: HTMLDivElement) {
		const shapeInput = div.createEl('input', { type: 'text', value: this.shape } );
		shapeInput.style.fontFamily = 'ColorLang';
		shapeInput.style.width = '5%';

		const colorInput = div.createEl('input', { type: 'color', value: this.color } );
		
		div.createEl('div', { text: 'Alpha' } );
		const opacityInput = div.createEl('input', { type: 'text', value: this.opacity + '' } );
		opacityInput.style.width = '7%';

		div.createEl('div', { text: 'TTime' } );
		const transitionTimeInput = div.createEl('input', { type: 'text', value: this.transitionTime + '' } );
		transitionTimeInput.style.width = '8%';
		
		div.createEl('div', { text: 'Duration' } );
		const durationInput = div.createEl('input', { type: 'text', value: this.duration + '' } );
		durationInput.style.width = '8%';

		div.createEl('div', { text: 'Size' } );
		const sizeInput = div.createEl('input', { type: 'text', value: this.size + '' } );
		sizeInput.style.width = '7%';
		
		div.createEl('div', { text: 'x' } );
		const xInput = div.createEl('input', { type: 'text', value: this.x + '' } );
		xInput.style.width = '5%';
		
		div.createEl('div', { text: 'y' } );
		const yInput = div.createEl('input', { type: 'text', value: this.y + '' } );
		yInput.style.width = '5%';
		
		div.createEl('div', { text: 'z' } );
		const zInput = div.createEl('input', { type: 'text', value: this.z + '' } );
		zInput.style.width = '5%';

		div.createEl('div', { text: 'r' } );
		const rInput = div.createEl('input', { type: 'text', value: this.r + '' } );
		rInput.style.width = '5%';

		shapeInput.onchange = () => {
			this.shape = shapeInput.value;
		}
		colorInput.onchange = () => {
			this.color = colorInput.value;
		}
		opacityInput.onchange = () => {
			this.opacity = parseInt(opacityInput.value);
		}
		transitionTimeInput.onchange = () => {
			this.transitionTime = parseFloat(transitionTimeInput.value);
		}
		durationInput.onchange = () => {
			this.duration = parseFloat(durationInput.value);
		}
		sizeInput.onchange = () => {
			this.size = parseInt(sizeInput.value);
		}
		xInput.onchange = () => {
			this.x = parseFloat(xInput.value);
		}
		yInput.onchange = () => {
			this.y = parseFloat(yInput.value);
		}
		zInput.onchange = () => {
			this.z = parseFloat(zInput.value);
		}
		rInput.onchange = () => {
			this.r = parseFloat(rInput.value);
		}
	}
}
