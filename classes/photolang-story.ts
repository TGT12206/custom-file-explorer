import { CFEFile } from "./cfe-file";
import { CFEFileHandler } from "./cfe-file-handler";
import { FileCreationData } from "./file-creation-data";
import { SingleMediaFile } from "./single-media-file";
import { SourceAndVault } from "./snv";

export class PhotolangStory extends CFEFile {
	static CLASS_DEPTH = 1;

	fileType = 'Photolang Story';

	private currentPageIndex: number;
	private pages: Page[];
	private characters: Character[];

	static override async CreateNewFileForLayer(data: FileCreationData): Promise<PhotolangStory> {
		const newStoryFile = <PhotolangStory> (await super.CreateNewFileForLayer(data));
		newStoryFile.currentPageIndex = 0;
		newStoryFile.pages = [];
		newStoryFile.characters = [];
		return newStoryFile;
	}

	override async Display(snv: SourceAndVault, mainDiv: HTMLDivElement) {
		await super.Display(snv, mainDiv);
		await this.LoadStoryUI(snv, mainDiv.createDiv('vbox'));
	}

	private async LoadStoryUI(snv: SourceAndVault, mainDiv: HTMLDivElement) {
		mainDiv.empty();
		mainDiv.createEl('p', { text: 'Go to page number:' } );
		const pageSelectDiv = mainDiv.createDiv('hbox');
		const pageNumberInput = pageSelectDiv.createEl('input', { type: 'text', value: '' + (this.currentPageIndex + 1) } );
		pageSelectDiv.createEl('p', { text: '' + '/' + this.pages.length } );
		const goButton = pageSelectDiv.createEl('button', { text: 'Go' } );
		goButton.onclick = () => {
			this.currentPageIndex = parseInt(pageNumberInput.value) - 1;
			this.LoadCurrentPageEdit(snv, mainDiv);
		}
		await this.LoadCharacterEditorUI(snv, mainDiv);
	}

	private async LoadCharacterEditorUI(snv: SourceAndVault, div: HTMLDivElement) {
		const charEditorDiv = div.createDiv('vbox');
		for (let i = 0; i < this.characters.length; i++) {
			const currentIndex = i;
			const charDiv = charEditorDiv.createDiv('vbox');

			charDiv.createEl('p', { text: 'Name: ' } );
			const nameInput = charDiv.createEl('input', { type: 'text', value: this.characters[i].name } );
			nameInput.onchange = async () => {
				this.characters[currentIndex].name = nameInput.value;
				await this.Save(snv);
				await this.LoadStoryUI(snv, div);
			}
			const photoName = new PhotoLine(this.characters[i].name);
			photoName.Speak(charDiv.createDiv(), 50, [100, 250, 500], true);
		}
		const addCharButton = charEditorDiv.createEl('button', { text: 'Add Character' } );
		addCharButton.onclick = async () => {
			this.characters.push(new Character());
			await this.Save(snv);
			charEditorDiv.remove();
			await this.LoadCharacterEditorUI(snv, div);
		}
	}

	private LoadPageSelector(snv: SourceAndVault, mainDiv: HTMLDivElement) {
		const buttonsDiv = mainDiv.createDiv('hbox');
		const backButton = buttonsDiv.createEl('button', { text: '-' } );
		const pageNumberInput = buttonsDiv.createEl('input', { type: 'text', value: '' + (this.currentPageIndex + 1) } );
		buttonsDiv.createEl('p', { text: '' + '/' + this.pages.length } );
		const nextButton = buttonsDiv.createEl('button', { text: '+' } );
		const deleteButton = buttonsDiv.createEl('button', { text: 'Delete Page' } );
		deleteButton.className = 'cfe-remove-button';
		const addButton = buttonsDiv.createEl('button', { text: 'Add Page' } );
		const editModeButton = buttonsDiv.createEl('button', { text: 'Edit Mode' } );
		const viewModeButton = buttonsDiv.createEl('button', { text: 'View Mode' } );
		const homeButton = buttonsDiv.createEl('button', { text: 'Return to Story' } );
		homeButton.onclick = async () => {
			await this.LoadStoryUI(snv, mainDiv);
		}
		editModeButton.onclick = async () => {
			await this.LoadCurrentPageEdit(snv, mainDiv);
		}
		viewModeButton.onclick = async () => {
			await this.LoadCurrentPageDisplayOnly(snv, mainDiv);
		}
		backButton.onclick = async () => {
			if (this.currentPageIndex > 0) {
				this.currentPageIndex--;
				await this.LoadCurrentPageEdit(snv, mainDiv);
			}
		}
		nextButton.onclick = async () => {
			if (this.currentPageIndex < this.pages.length) {
				this.currentPageIndex++;
				await this.LoadCurrentPageEdit(snv, mainDiv);
			}
		}
		pageNumberInput.onchange = async () => {
			this.currentPageIndex = parseInt(pageNumberInput.value) - 1;
			await this.LoadCurrentPageEdit(snv, mainDiv);
		}
		deleteButton.onclick = async () => {
			this.pages.splice(this.currentPageIndex, 1);
			await this.Save(snv);
			if (this.currentPageIndex !== 0) {
				this.currentPageIndex--;
			}
			await this.LoadCurrentPageEdit(snv,mainDiv);
		}
		addButton.onclick = async () => {
			const defaultPage = new Page();
			const thisPageFileID = this.pages[this.currentPageIndex].mediaFileID;
			if (thisPageFileID !== -1 && thisPageFileID < snv.sourceFolder.fileCount) {
				defaultPage.mediaFileID = thisPageFileID;
			}
			this.pages.splice(this.currentPageIndex + 1, 0, defaultPage);
			await this.Save(snv);
			this.currentPageIndex++;
			await this.LoadCurrentPageEdit(snv,mainDiv);
		}
	}

	private async LoadCurrentPageEdit(snv: SourceAndVault, mainDiv: HTMLDivElement) {
		mainDiv.empty();
		this.LoadPageSelector(snv, mainDiv);

		mainDiv.createEl('p', { text: 'Media File ID:' } );
		const mediaFileIDInput = mainDiv.createEl('input', { type: 'text' } );
		
		const panelDiv = mainDiv.createDiv('hbox');
		const outerMediaDiv = panelDiv.createDiv('vbox');
		const linesDiv = panelDiv.createDiv('vbox');
		const mediaWidthInput = outerMediaDiv.createEl('input', { type: 'text' } );
		mediaWidthInput.onchange = async () => {
			outerMediaDiv.style.width = mediaWidthInput.value + '%';
			linesDiv.style.width = 100 - parseInt(mediaWidthInput.value) + '%';
			this.pages[this.currentPageIndex].mediaSizePercentage = parseInt(mediaWidthInput.value);
			await this.Save(snv);
		}
		outerMediaDiv.style.width = '50%';
		const mediaDiv = outerMediaDiv.createDiv('vbox');
		mediaDiv.style.objectFit = 'contain';
		linesDiv.style.width = '50%';
		linesDiv.style.maxHeight = '80vh';
		linesDiv.style.position = 'sticky';
		linesDiv.style.top = '0%';

		if (this.currentPageIndex < this.pages.length) {
			const currentPage = this.pages[this.currentPageIndex];
			const mediaFileID = currentPage.mediaFileID;
			mediaFileIDInput.value = '' + currentPage.mediaFileID;
			if (mediaFileID > 0) {
				const mediaFile = <SingleMediaFile> await CFEFileHandler.LoadFile(snv, mediaFileID);
				await mediaFile.DisplayMediaOnly(mediaDiv, snv);
			}
			if (this.pages[this.currentPageIndex].mediaSizePercentage) {
				mediaWidthInput.value = '' + this.pages[this.currentPageIndex].mediaSizePercentage;
				outerMediaDiv.style.width = mediaWidthInput.value + '%';
				linesDiv.style.width = 100 - parseInt(mediaWidthInput.value) + '%';
			} else {
				mediaWidthInput.value = '50';
				this.pages[this.currentPageIndex].mediaSizePercentage = 50;
				await this.Save(snv);
			}
		} else {
			const defaultPage = new Page();
			const lastPage = this.currentPageIndex - 1;
			if (lastPage >= 0 && this.currentPageIndex !== 0) {
				const lastPageFileID = this.pages[lastPage].mediaFileID;
				const lastPageSize = this.pages[lastPage].mediaSizePercentage;
				defaultPage.mediaSizePercentage = lastPageSize;
				mediaWidthInput.value = '' + lastPageSize;
				outerMediaDiv.style.width = mediaWidthInput.value + '%';
				linesDiv.style.width = 100 - parseInt(mediaWidthInput.value) + '%';
				if (lastPageFileID !== -1 && lastPageFileID < snv.sourceFolder.fileCount) {
					const mediaFileID = lastPageFileID + 1;
					defaultPage.mediaFileID = mediaFileID;
					mediaFileIDInput.value = '' + mediaFileID;
					if (mediaFileID > 0) {
						const mediaFile = <SingleMediaFile> await CFEFileHandler.LoadFile(snv, mediaFileID);
						await mediaFile.DisplayMediaOnly(mediaDiv, snv);
					}
				}
			}
			this.pages.push(defaultPage);
			await this.Save(snv);
		}
		await this.LoadDialogueLinesEdit(snv, linesDiv, mainDiv);
		mediaFileIDInput.onchange = async () => {
			const currentPage = this.pages[this.currentPageIndex];
			currentPage.mediaFileID = parseInt(mediaFileIDInput.value);
			await this.Save(snv);
			const mediaFile = <SingleMediaFile> await CFEFileHandler.LoadFile(snv, currentPage.mediaFileID);
			await mediaFile.DisplayMediaOnly(mediaDiv, snv);
		}
	}

	private async LoadCurrentPageDisplayOnly(snv: SourceAndVault, mainDiv: HTMLDivElement) {
		mainDiv.empty();

		this.LoadPageSelector(snv, mainDiv);
		
		const panelDiv = mainDiv.createDiv('hbox');
		const outerMediaDiv = panelDiv.createDiv('vbox');
		const linesDiv = panelDiv.createDiv('vbox');

		outerMediaDiv.style.width = '50%';
		const mediaDiv = outerMediaDiv.createDiv('vbox');
		mediaDiv.style.objectFit = 'contain';
		linesDiv.style.width = '50%';
		linesDiv.style.maxHeight = '80vh';
		linesDiv.style.position = 'sticky';
		linesDiv.style.top = '0%';

		const currentPage = this.pages[this.currentPageIndex];
		const mediaFileID = currentPage.mediaFileID;
		if (mediaFileID > 0) {
			const mediaFile = <SingleMediaFile> await CFEFileHandler.LoadFile(snv, mediaFileID);
			await mediaFile.DisplayMediaOnly(mediaDiv, snv);
		}
		if (this.pages[this.currentPageIndex].mediaSizePercentage) {
			const width = this.pages[this.currentPageIndex].mediaSizePercentage;
			outerMediaDiv.style.width = width + '%';
			linesDiv.style.width = 100 - width + '%';
		}
		await this.LoadDialogueLinesDisplayOnly(snv, linesDiv, mainDiv);
	}

	private async LoadDialogueLinesEdit(snv: SourceAndVault, linesDiv: HTMLDivElement, mainDiv: HTMLDivElement) {
		const existingLinesDiv = linesDiv.createDiv('vbox');
		existingLinesDiv.style.overflowY = 'scroll';
		for (let i = 0; i < this.pages[this.currentPageIndex].lines.length; i++) {
			const currentIndex = i;
			const currentLine = this.pages[this.currentPageIndex].lines[i];
			const lineDiv = existingLinesDiv.createDiv('hbox');

			const deleteButton = lineDiv.createEl('button', { text: '-' } );
			deleteButton.className = 'cfe-remove-button';
			deleteButton.onclick = async () => {
				this.pages[this.currentPageIndex].lines.splice(currentIndex, 1);
				await this.Save(snv);
				await this.LoadDialogueLinesEdit(snv, linesDiv, mainDiv);
			}

			lineDiv.createEl('p', { text: '' +  currentIndex } );

			const charDropdownButton = lineDiv.createDiv();
			const charDropdownDiv = charDropdownButton.createDiv();
			charDropdownDiv.style.position = 'relative';
			charDropdownButton.onclick = () => {
				charDropdownDiv.empty();
				const selectDiv = charDropdownDiv.createDiv('hbox');
				selectDiv.style.position = 'absolute';
				selectDiv.style.top = '0%';
				selectDiv.style.left = '0%';
				for (let i = 0; i < this.characters.length; i++) {
					const currentCharIndex = i;
					const currentChar = this.characters[currentCharIndex];
					const currentOption = selectDiv.createEl('div');
					const photoName = new PhotoLine(currentChar.name);
					photoName.Speak(currentOption, 10, [100, 250, 500], true);
					currentOption.style.zIndex = '2';
					currentOption.onclick = async () => {
						this.pages[this.currentPageIndex].lines[currentIndex].speakerIndex = currentCharIndex;
						await this.Save(snv);
						linesDiv.empty();
						this.LoadDialogueLinesEdit(snv, linesDiv, mainDiv);
					}
				}
			}

			const photoName = new PhotoLine(this.characters[currentLine.speakerIndex].name);
			photoName.Speak(charDropdownDiv, 10, [100, 250, 500], true);

			const lineInput = lineDiv.createEl('input', { type: 'text', value: currentLine.content } );
			lineInput.style.width = '100%';
			lineInput.onchange = async () => {
				currentLine.content = lineInput.value;
				await this.Save(snv);
			}

			const playButton = existingLinesDiv.createEl('button', { text: 'play' } );
			playButton.onclick = () => {
				const popup = mainDiv.createDiv();
				popup.style.position = 'absolute';
				popup.style.top = '0px';
				popup.style.left = '0px';
				const photoline = new PhotoLine(lineInput.value);
				photoline.Speak(popup, 200, [100, 250, 500], false);
			}
		}
		const addButton = existingLinesDiv.createEl('button', { text: '+' } );
		addButton.style.width = '10px';
		addButton.onclick = async () => {
			this.pages[this.currentPageIndex].lines.push(new DialogueLine(0));
			await this.Save(snv);
			await this.LoadDialogueLinesEdit(snv, linesDiv, mainDiv);
		}
	}

	private async LoadDialogueLinesDisplayOnly(snv: SourceAndVault, linesDiv: HTMLDivElement, mainDiv: HTMLDivElement) {
		const existingLinesDiv = linesDiv.createDiv('vbox');
		existingLinesDiv.style.overflowY = 'scroll';
		for (let i = 0; i < this.pages[this.currentPageIndex].lines.length; i++) {
			const currentLine = this.pages[this.currentPageIndex].lines[i];
			const lineDiv = existingLinesDiv.createDiv('hbox');
			
			const photoName = new PhotoLine(this.characters[currentLine.speakerIndex].name);
			photoName.Speak(lineDiv, 10, [100, 250, 500], true);
			
			const photoLine = new PhotoLine(currentLine.content);
			photoLine.DisplayStatic(lineDiv, 10);
			
			const playButton = existingLinesDiv.createEl('button', { text: 'play' } );
			playButton.onclick = () => {
				const popup = mainDiv.createDiv();
				popup.style.position = 'absolute';
				popup.style.top = '0px';
				popup.style.left = '0px';
				photoLine.Speak(popup, 200, [100, 250, 500], false);
			}
		}
	}

}

class Page {
	mediaFileID: number;
	lines: DialogueLine[];
	mediaSizePercentage: number;
	constructor() {
		this.mediaFileID = -1;
		this.lines = [];
		this.mediaSizePercentage = 50;
	}
}

class DialogueLine {
	speakerIndex: number;
	content: string;
	constructor(speakerIndex: number) {
		this.speakerIndex = speakerIndex;
		this.content = '';
	}
}

class PhotoLine {
	glyphs: PhotoGlyph[];
	constructor(textContent = '') {
		this.glyphs = [];

		const textArray = textContent.split("   ").filter((c: string) => c !== "");
		for (let i = 0; i < textArray.length; i++) {
			const newGlyph = new PhotoGlyph();
			const glyphText = textArray[i];

			let skipNext = false;

			// speed
			switch (glyphText[0]) {
				case '.':
					newGlyph.speed = 0;
					break;
				case '-':
					newGlyph.speed = 1;
					break;
				case '=':
					newGlyph.speed = 2;
					break;
			}
			// shape
			newGlyph.shape = glyphText[1];

			// hue
			let hue1 = 0;
			let j = 2;
			switch (glyphText[2]) {
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
				case '.':
					newGlyph.saturation = 0;
					break;
				case '-':
					newGlyph.saturation = 0.5;
					break;
				case '=':
					newGlyph.saturation = 1;
					break;
			}
			j++;

			// value
			const valueText = glyphText[j];
			switch (valueText) {
				case '.':
					newGlyph.value = 0;
					break;
				case '-':
					newGlyph.value = 0.1;
					break;
				case '=':
					newGlyph.value = 0.2;
					break;
				case '+':
					newGlyph.value = 0.5;
					break;
				case '*':
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

	async Speak(div: HTMLDivElement, textSize: number, speeds: number[], doLoop = false) {
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
			textDiv.style.transition = speeds[photoGlyph.speed] + 'ms';
			await sleep(speeds[photoGlyph.speed] + speeds[0]);
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

class PhotoGlyph {
	shape: string;
	x: number;
	y: number;
	hue: number;
	saturation: number;
	value: number;
	opacity: number;
	speed: number;

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

class Character {
	name: string;
	constructor(name = '') {
		this.name = name;
	}
}
