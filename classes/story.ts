import { CFEFile } from "./cfe-file";
import { CFEFileHandler } from "./cfe-file-handler";
import { LanguageHandler } from "./conlangs/language-handler";
import { SingleMediaFile } from "./single-media-file";
import { SourceAndVault } from "./snv";

export class Story extends CFEFile {
	private currentPageIndex: number;
	private pages: Page[];
	private characters: Character[];
	private language: string;
	private doVertical: boolean;
	private fontSize: number;

	private MakeVertical(el: HTMLElement) {
		el.style.writingMode = 'vertical-lr';
		el.style.textOrientation = 'upright';
	}

	private DisplayLineEdit(mainDiv: HTMLDivElement, div: HTMLDivElement, line: DialogueLine) {
		const input = LanguageHandler.CreateMultiLineEditor(mainDiv, div, this.language, line.content);
		const speaker = this.characters[line.speakerIndex];
		if (this.language !== 'Color Lang') {
			input.style.backgroundColor = speaker.backgroundColor;
			input.style.color = speaker.color;
		}
		input.isVertical = this.doVertical;
		return input;
	}

	static override async CreateNewFileForLayer(snv: SourceAndVault, fileType: string, parentFolderID: number, name: string): Promise<Story> {
		const newStoryFile = <Story> (await super.CreateNewFileForLayer(snv, fileType, parentFolderID, name));
		newStoryFile.currentPageIndex = 0;
		newStoryFile.pages = [];
		newStoryFile.characters = [];
		newStoryFile.language = 'English';
		newStoryFile.doVertical = false;
		return newStoryFile;
	}

	override async Display(snv: SourceAndVault, mainDiv: HTMLDivElement) {
		await super.Display(snv, mainDiv);
		this.LoadStoryUI(snv, mainDiv.createDiv('vbox'));
	}

	private LoadStoryUI(snv: SourceAndVault, mainDiv: HTMLDivElement) {
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

		mainDiv.createEl('p', { text: 'Font Size (in px):' } );
		const fontSizeInput = mainDiv.createEl('input', { type: 'text' } );
		fontSizeInput.value = this.fontSize ? '' + this.fontSize : '17.5';
		fontSizeInput.onchange = async () => {
			this.fontSize = parseFloat(fontSizeInput.value);
			await this.Save(snv);
			this.LoadStoryUI(snv, mainDiv);
		}

		mainDiv.createEl('p', { text: 'Language:' } );
		const languageInput = mainDiv.createEl('select');
		for (let i = 0; i < LanguageHandler.knownLanguages.length; i++) {
			languageInput.createEl('option', { text: LanguageHandler.knownLanguages[i], value: LanguageHandler.knownLanguages[i] } );
		}
		languageInput.value = this.language;
		languageInput.onchange = async () => {
			this.language = languageInput.value;
			await this.Save(snv);
			this.LoadStoryUI(snv, mainDiv);
		}

		mainDiv.createEl('p', { text: 'Vertical Text' } );
		const doVerticalBox = mainDiv.createEl('input', { type: 'checkbox' } );
		doVerticalBox.checked = this.doVertical;
		doVerticalBox.onclick = async () => {
			this.doVertical = doVerticalBox.checked;
			await this.Save(snv);
			this.LoadStoryUI(snv, mainDiv);
		}

		this.LoadCharacterEditorUI(snv, mainDiv);
	}

	private LoadCharacterEditorUI(snv: SourceAndVault, div: HTMLDivElement) {
		const charEditorDiv = div.createDiv();
		charEditorDiv.className = this.doVertical ? 'hbox' : 'vbox';
		for (let i = 0; i < this.characters.length; i++) {
			const currentIndex = i;
			const charDiv = charEditorDiv.createDiv();
			charDiv.className = this.doVertical ? 'vbox' : 'hbox';

			charDiv.createEl('p', { text: 'Name: ' } );
			const nameInput = LanguageHandler.CreateOneLineEditor(div, charDiv, this.language, this.characters[currentIndex].name, this.fontSize, this.doVertical);
			if (this.language !== 'Color Lang') {
				nameInput.style.backgroundColor = this.characters[currentIndex].backgroundColor;
				nameInput.style.color = this.characters[currentIndex].color;
			}
			nameInput.onchange = async () => {
				this.characters[currentIndex].name = nameInput.value;
				await this.Save(snv);
				this.LoadStoryUI(snv, div);
			}
			if (this.doVertical) {
				nameInput.style.height = 'fit-content';
			} else {
				nameInput.style.width = 'fit-content';
			}
			if (this.language !== 'Color Lang') {
				this.LoadCharacterColorSelectionUI(snv, div, charEditorDiv, currentIndex);
			}
		}
		const addCharButton = charEditorDiv.createEl('button', { text: 'Add Character' } );
		addCharButton.onclick = async () => {
			this.characters.push(new Character());
			await this.Save(snv);
			charEditorDiv.remove();
			this.LoadCharacterEditorUI(snv, div);
		}
	}

	private LoadCharacterColorSelectionUI(snv: SourceAndVault, div: HTMLDivElement, charEditorDiv: HTMLDivElement, currentIndex: number) {
		const colorDiv = charEditorDiv.createDiv();
		colorDiv.className = this.doVertical ? 'vbox' : 'hbox';

		colorDiv.createEl('p', { text: 'Text Color:' } );
		const colorInput = colorDiv.createEl('input', { type: 'color', value: this.characters[currentIndex].color } );
		const swapButton = colorDiv.createEl('button', { text: 'Swap' } );
		colorInput.onchange = async () => {
			this.characters[currentIndex].color = colorInput.value;
			await this.Save(snv);
			charEditorDiv.remove();
			this.LoadCharacterEditorUI(snv, div);
		}
		colorDiv.createEl('p', { text: 'Background Color:' } );
		const backgroundInput = colorDiv.createEl('input', { type: 'color', value: this.characters[currentIndex].backgroundColor } );
		backgroundInput.onchange = async () => {
			this.characters[currentIndex].backgroundColor = backgroundInput.value;
			await this.Save(snv);
			charEditorDiv.remove();
			this.LoadCharacterEditorUI(snv, div);
		}
		swapButton.onclick = async () => {
			this.characters[currentIndex].backgroundColor = colorInput.value;
			this.characters[currentIndex].color = backgroundInput.value;
			await this.Save(snv);
			charEditorDiv.remove();
			this.LoadCharacterEditorUI(snv, div);
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
			await this.LoadCurrentPageEdit(snv, mainDiv);
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
			await this.LoadCurrentPageEdit(snv, mainDiv);
		}
	}

	private async LoadCurrentPageEdit(snv: SourceAndVault, mainDiv: HTMLDivElement) {
		mainDiv.empty();
		this.LoadPageSelector(snv, mainDiv);

		mainDiv.createEl('p', { text: 'Media File ID:' } );
		const mediaFileIDInput = mainDiv.createEl('input', { type: 'text' } );
		
		const panelDiv = mainDiv.createDiv('hbox');
		const outerMediaDiv = panelDiv.createDiv('vbox');
		outerMediaDiv.style.position = 'relative';
		const linesDiv = panelDiv.createDiv('vbox');

		const speakDiv = outerMediaDiv.createDiv();
		speakDiv.style.position = 'absolute';
		speakDiv.style.top = '0px';
		speakDiv.style.left = '0px';

		const mediaWidthInput = outerMediaDiv.createEl('input', { type: 'text' } );
		mediaWidthInput.onchange = async () => {
			outerMediaDiv.style.width = mediaWidthInput.value + '%';
			linesDiv.style.width = 100 - parseInt(mediaWidthInput.value) + '%';
			this.pages[this.currentPageIndex].mediaSizePercentage = parseInt(mediaWidthInput.value);
			await this.Save(snv);
		}

		const mediaDiv = outerMediaDiv.createDiv('vbox');
		outerMediaDiv.style.width = '50%';
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
		await this.LoadDialogueLinesEdit(snv, linesDiv, speakDiv, mainDiv);
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
		outerMediaDiv.style.position = 'relative';
		const linesDiv = panelDiv.createDiv('vbox');
		
		const speakDiv = outerMediaDiv.createDiv();
		speakDiv.style.position = 'absolute';
		speakDiv.style.top = '0px';
		speakDiv.style.left = '0px';

		const mediaDiv = outerMediaDiv.createDiv('vbox');
		outerMediaDiv.style.width = '50%';
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
		await this.LoadDialogueLinesDisplayOnly(linesDiv, speakDiv, mainDiv);
	}

	private async LoadDialogueLinesEdit(snv: SourceAndVault, linesDiv: HTMLDivElement, speakDiv: HTMLDivElement, cleanDiv: HTMLDivElement) {
		linesDiv.empty();

		const existingLinesDiv = linesDiv.createDiv();
		existingLinesDiv.className = this.doVertical ? 'hbox' : 'vbox';
		if (this.doVertical) {
			existingLinesDiv.style.overflowX = 'scroll';
		} else {
			existingLinesDiv.style.overflowY = 'scroll';
		}
		for (let i = 0; i < this.pages[this.currentPageIndex].lines.length; i++) {
			const currentIndex = i;
			const currentLine = this.pages[this.currentPageIndex].lines[i];
			const speaker = this.characters[currentLine.speakerIndex];

			const lineDiv = existingLinesDiv.createDiv();
			lineDiv.className = this.doVertical ? 'vbox' : 'hbox';

			const deleteButton = lineDiv.createEl('button', { text: '-' } );
			deleteButton.className = 'cfe-remove-button';
			deleteButton.onclick = async () => {
				this.pages[this.currentPageIndex].lines.splice(currentIndex, 1);
				await this.Save(snv);
				await this.LoadDialogueLinesEdit(snv, linesDiv, speakDiv, cleanDiv);
			}
			if (this.doVertical) {
				this.MakeVertical(deleteButton);
			}

			const playButton = lineDiv.createEl('button', { text: '▷' } );
			playButton.onclick = () => {
				try {
					LanguageHandler.SpeakOrAnimate(cleanDiv, speakDiv, this.language, currentLine.content, 150, this.doVertical);
				} catch (e) {
					e.console.error();
				}
			}
			
			const charDropdownButton = lineDiv.createDiv();
			const charDropdownDiv = charDropdownButton.createDiv();
			charDropdownDiv.style.height = 'fit-content';
			charDropdownDiv.style.width = 'fit-content';
			charDropdownDiv.style.position = 'relative';
			charDropdownButton.onclick = () => {
				const selectDiv = charDropdownDiv.createDiv();
				selectDiv.className = this.doVertical ? 'hbox' : 'vbox';
				selectDiv.style.position = 'absolute';
				selectDiv.style.top = '0%';
				selectDiv.style.left = '0%';
				for (let i = 0; i < this.characters.length; i++) {
					const currentCharIndex = i;
					const currentChar = this.characters[currentCharIndex];
					const currentOption = selectDiv.createDiv();
					if (this.doVertical) {
						this.MakeVertical(currentOption);
					}
					if (this.language !== 'Color Lang') {
						currentOption.style.backgroundColor = currentChar.backgroundColor;
						currentOption.style.color = currentChar.color;
					}
					currentOption.style.zIndex = '2';
					LanguageHandler.Display(speakDiv, currentOption, this.language, currentChar.name, this.fontSize, this.doVertical);
					currentOption.onclick = async () => {
						this.pages[this.currentPageIndex].lines[currentIndex].speakerIndex = currentCharIndex;
						await this.Save(snv);
						this.LoadDialogueLinesEdit(snv, linesDiv, speakDiv, cleanDiv);
					}
				}
			}

			const nameEl = LanguageHandler.Display(speakDiv, charDropdownDiv, this.language, this.characters[currentLine.speakerIndex].name, this.fontSize, this.doVertical);
			if (this.language !== 'Color Lang') {
				nameEl.style.backgroundColor = speaker.backgroundColor;
				nameEl.style.color = speaker.color;
			}

			const lineInput = this.DisplayLineEdit(cleanDiv, lineDiv, currentLine);
			if (this.doVertical) {
				lineInput.style.height = '100%';
			} else {
				lineInput.style.width = '100%';
			}

			lineInput.onchange = async () => {
				currentLine.content = lineInput.value;
				await this.Save(snv);
			}
		}
		const addButton = existingLinesDiv.createEl('button', { text: '+' } );
		addButton.onclick = async () => {
			this.pages[this.currentPageIndex].lines.push(new DialogueLine(0));
			await this.Save(snv);
			await this.LoadDialogueLinesEdit(snv, linesDiv, speakDiv, cleanDiv);
		}
	}

	private async LoadDialogueLinesDisplayOnly(linesDiv: HTMLDivElement, speakDiv: HTMLDivElement, cleanDiv: HTMLDivElement) {
		linesDiv.empty();

		const existingLinesDiv = linesDiv.createDiv();
		existingLinesDiv.className = this.doVertical ? 'hbox' : 'vbox' ;
		if (this.doVertical) {
			existingLinesDiv.style.overflowX = 'scroll';
		} else {
			existingLinesDiv.style.overflowY = 'scroll';
		}

		for (let i = 0; i < this.pages[this.currentPageIndex].lines.length; i++) {
			const currentLine = this.pages[this.currentPageIndex].lines[i];
			const speaker = this.characters[currentLine.speakerIndex];
			
			const playButton = existingLinesDiv.createEl('button', { text: '▷' } );
			const nameDiv = existingLinesDiv.createDiv('');
			const lineDiv = existingLinesDiv.createDiv('');

			const nameEl = LanguageHandler.Display(cleanDiv, nameDiv, this.language, speaker.name, this.fontSize, this.doVertical);
			if (this.language !== 'Color Lang') {
				nameEl.style.backgroundColor = speaker.backgroundColor;
				nameEl.style.color = speaker.color;
			}

			const lineEl = LanguageHandler.Display(cleanDiv, lineDiv, this.language, currentLine.content, this.fontSize, this.doVertical);
			if (this.language !== 'Color Lang') {
				lineEl.style.backgroundColor = speaker.backgroundColor;
				lineEl.style.color = speaker.color;
			}

			playButton.onclick = () => {
				try {
					LanguageHandler.SpeakOrAnimate(cleanDiv, speakDiv, this.language, currentLine.content, 150, this.doVertical);
				} catch (e) {
					e.console.error();
				}
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

class Character {
	name: string;
	color: string;
	backgroundColor: string;
	constructor(name = '', color = '#FFFFFF', backgroundColor = '#000000') {
		this.name = name;
		this.color = color;
		this.backgroundColor = backgroundColor;
	}
}
