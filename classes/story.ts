import { CFEFile } from "./cfe-file";
import { CFEFileHandler } from "./cfe-file-handler";
import { FileCreationData } from "./file-creation-data";
import { SingleMediaFile } from "./single-media-file";
import { SourceAndVault } from "./snv";
import { PhotoLang, PhotoLine } from "./conlangs/photolang-text";
import { Hwayu } from "./conlangs/hwayu-text";

export class Story extends CFEFile {
	private currentPageIndex: number;
	private pages: Page[];
	private characters: Character[];
	private language: string;
	private doVertical: boolean;

	private static knownLanguages = [
		'English',
		'Hwayu',
		'Photolang'
	]

	private MakeVertical(el: HTMLElement) {
		el.style.writingMode = 'vertical-lr';
		el.style.textOrientation = 'upright';
	}

	private CreateTextInput(div: HTMLDivElement, existingWord = '') {
		let input;
		switch(this.language) {
			case 'Hwayu':
				return Hwayu.CreateTextInput(div, existingWord, 25, this.doVertical);
			case 'Photolang':
				return PhotoLang.CreateTextInput(div, existingWord, 25);
			default:
				input = div.createEl('input', { type: 'text', value: existingWord } );
				input.style.fontSize = '25px';
				return input;
		}
	}

	private DisplayLineEdit(div: HTMLDivElement, line: DialogueLine) {
		const input = this.CreateTextArea(div, line.content);
		if (this.language !== 'Photolang') {
			const speaker = this.characters[line.speakerIndex];
			input.style.backgroundColor = speaker.backgroundColor;
			input.style.color = speaker.color;
		}
		if (this.doVertical) {
			this.MakeVertical(input);
		}
		return input;
	}

	private CreateTextArea(div: HTMLDivElement, existingWord = '') {
		let input;
		switch(this.language) {
			case 'Hwayu':
				return Hwayu.CreateTextArea(div, existingWord, 25, this.doVertical);
			case 'Photolang':
				return PhotoLang.CreateTextArea(div, existingWord, 25);
			default:
				input = div.createEl('textarea', { text: existingWord } );
				input.style.fontSize = '25px';
				return input;
		}
	}

	private DisplayText(div: HTMLDivElement, fontSize = 25, existingWord = '') {
		switch(this.language) {
			case 'Hwayu':
				return Hwayu.Display(div, existingWord, fontSize, this.doVertical);
			case 'Photolang':
				return PhotoLang.Display(div, existingWord, fontSize, null, null, true);
			default:
				return div.createEl('p', { text: existingWord } );
		}
	}

	static override async CreateNewFileForLayer(data: FileCreationData): Promise<Story> {
		const newStoryFile = <Story> (await super.CreateNewFileForLayer(data));
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

		const languageInput = mainDiv.createEl('select');
		for (let i = 0; i < Story.knownLanguages.length; i++) {
			languageInput.createEl('option', { text: Story.knownLanguages[i], value: Story.knownLanguages[i] } );
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
			const nameInput = this.CreateTextInput(charDiv, this.characters[currentIndex].name);
			if (this.language !== 'Photolang') {
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
			if (this.language !== 'Photolang') {
				this.LoadCharacterColorSelectionUI(snv, div, charEditorDiv, currentIndex);
			} else {
				this.DisplayText(charDiv, 25, this.characters[currentIndex].name);
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
		colorDiv.createEl('p', { text: 'Background Color:' } );
		const backgroundInput = colorDiv.createEl('input', { type: 'color', value: this.characters[currentIndex].backgroundColor } );
		const swapButton = colorDiv.createEl('button', { text: 'Swap' } );
		colorInput.onchange = async () => {
			this.characters[currentIndex].color = colorInput.value;
			await this.Save(snv);
		}
		backgroundInput.onchange = async () => {
			this.characters[currentIndex].backgroundColor = backgroundInput.value;
			await this.Save(snv);
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
		await this.LoadDialogueLinesEdit(snv, linesDiv);
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
		await this.LoadDialogueLinesDisplayOnly(linesDiv);
	}

	private async LoadDialogueLinesEdit(snv: SourceAndVault, linesDiv: HTMLDivElement) {
		linesDiv.empty();

		const speakDiv = linesDiv.createDiv();
		speakDiv.style.position = 'absolute';
		speakDiv.style.top = '0px';
		speakDiv.style.left = '0px';

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
				await this.LoadDialogueLinesEdit(snv, linesDiv);
			}
			if (this.doVertical) {
				this.MakeVertical(deleteButton);
			}

			const indexTextEl = this.DisplayText(lineDiv, 25, '' + currentIndex);
			if (this.doVertical) {
				this.MakeVertical(indexTextEl);
			}

			if (this.language === 'Photolang') {
				const playButton = lineDiv.createEl('button', { text: '▷' } );
				playButton.onclick = () => {
					const popup = speakDiv.createDiv();
					popup.style.position = 'absolute';
					popup.style.top = '0px';
					popup.style.left = '0px';
					const photoline = new PhotoLine(lineInput.value);
					photoline.Speak(popup, 200, [100, 250, 500], [0, 500], false);
				}
				if (this.doVertical) {
					this.MakeVertical(playButton);
				}
			}

			const charDropdownButton = lineDiv.createDiv();
			const charDropdownDiv = charDropdownButton.createDiv();
			if (this.doVertical) {
				charDropdownDiv.style.height = 'fit-content';
				this.MakeVertical(charDropdownDiv);
			} else {
				charDropdownDiv.style.width = 'fit-content';
			}
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
					if (this.language !== 'Photolang') {
						currentOption.style.backgroundColor = currentChar.backgroundColor;
						currentOption.style.color = currentChar.color;
					}
					currentOption.style.zIndex = '2';
					this.DisplayText(currentOption, 25, currentChar.name);
					currentOption.onclick = async () => {
						this.pages[this.currentPageIndex].lines[currentIndex].speakerIndex = currentCharIndex;
						await this.Save(snv);
						this.LoadDialogueLinesEdit(snv, linesDiv);
					}
				}
			}

			const nameEl = this.DisplayText(charDropdownDiv, 25, this.characters[currentLine.speakerIndex].name);
			if (this.doVertical) {
				this.MakeVertical(nameEl);
			}
			if (this.language !== 'Photolang') {
				nameEl.style.backgroundColor = speaker.backgroundColor;
				nameEl.style.color = speaker.color;
			}

			const lineInput = this.DisplayLineEdit(lineDiv, currentLine);
			if (this.doVertical) {
				lineInput.style.height = '100%';
				this.MakeVertical(lineInput);
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
			await this.LoadDialogueLinesEdit(snv, linesDiv);
		}
	}

	// private async LoadDialogueLinesEdit(snv: SourceAndVault, linesDiv: HTMLDivElement) {
	// 	const existingLinesDiv = linesDiv.createDiv('hbox');
	// 	existingLinesDiv.style.overflowX = 'scroll';
	// 	const fontSize = '17.5px';
	// 	for (let i = 0; i < this.pages[this.currentPageIndex].lines.length; i++) {
	// 		const currentIndex = i;
	// 		const currentLine = this.pages[this.currentPageIndex].lines[i];
	// 		const speakerIndex = currentLine.speakerIndex;
	// 		const currentSpeaker = this.characters[speakerIndex];
	// 		const lineDiv = existingLinesDiv.createDiv('vbox');
	// 		const deleteButton = lineDiv.createEl('button', { text: '-' } );
	// 		deleteButton.className = 'cfe-remove-button';
	// 		deleteButton.style.writingMode = 'vertical-lr';
	// 		deleteButton.style.textOrientation = 'upright';
	// 		deleteButton.onclick = async () => {
	// 			this.pages[this.currentPageIndex].lines.splice(currentIndex, 1);
	// 			await this.Save(snv);
	// 			await this.LoadDialogueLinesEdit(snv, linesDiv);
	// 		}
	// 		const indexElement = lineDiv.createEl('p', { text: '' +  currentIndex } );
	// 		indexElement.style.color = currentSpeaker.color;
	// 		indexElement.style.fontFamily = 'HwayuReal';
	// 		indexElement.style.writingMode = 'vertical-lr';
	// 		indexElement.style.textOrientation = 'upright';
	// 		const charDropdownDiv = lineDiv.createDiv();
	// 		charDropdownDiv.style.position = 'relative';
	// 		const charDropdown = charDropdownDiv.createEl('button');
	// 		charDropdown.style.height = 'fit-content';
	// 		charDropdown.onclick = () => {
	// 			const selectDiv = charDropdownDiv.createDiv('hbox');
	// 			selectDiv.style.position = 'absolute';
	// 			selectDiv.style.top = '0%';
	// 			selectDiv.style.left = '0%';
	// 			for (let i = 0; i < this.characters.length; i++) {
	// 				const currentCharIndex = i;
	// 				const currentChar = this.characters[currentCharIndex];
	// 				const currentOption = selectDiv.createEl('button', { text: currentChar.name, value: '' + i } );
	// 				currentOption.style.color = currentChar.color;
	// 				currentOption.style.fontFamily = 'HwayuReal';
	// 				currentOption.style.backgroundColor = currentChar.backgroundColor;
	// 				currentOption.style.writingMode = 'vertical-lr';
	// 				currentOption.style.textOrientation = 'upright';
	// 				currentOption.style.height = 'fit-content';
	// 				currentOption.style.zIndex = '2';
	// 				currentOption.onclick = async () => {
	// 					this.pages[this.currentPageIndex].lines[currentIndex].speakerIndex = currentCharIndex;
	// 					const newSpeakerColor = this.characters[currentCharIndex].color;
	// 					const newBackgroundColor = this.characters[currentCharIndex].backgroundColor;
	// 					charDropdown.style.color = newSpeakerColor;
	// 					charDropdown.style.backgroundColor = newBackgroundColor;
	// 					charDropdown.textContent = this.characters[currentCharIndex].name;
	// 					lineInput.style.color = newSpeakerColor;
	// 					lineInput.style.backgroundColor = newBackgroundColor;
	// 					indexElement.style.color = newSpeakerColor;
	// 					await this.Save(snv);
	// 					selectDiv.remove();
	// 				}
	// 			}
	// 		}
	// 		charDropdown.textContent = this.characters[currentLine.speakerIndex].name;
	// 		charDropdown.style.color = currentSpeaker.color;
	// 		charDropdown.style.backgroundColor = currentSpeaker.backgroundColor;
	// 		charDropdown.style.fontFamily = 'HwayuReal';
	// 		charDropdown.style.writingMode = 'vertical-lr';
	// 		charDropdown.style.textOrientation = 'upright';
	// 		const lineInput = lineDiv.createEl('textarea');
	// 		lineInput.spellcheck = false;
	// 		lineInput.style.overflowX = 'scroll';
	// 		lineInput.style.writingMode = 'vertical-lr';
	// 		lineInput.style.textOrientation = 'upright';
	// 		lineInput.defaultValue = currentLine.content;
	// 		lineInput.style.color = currentSpeaker.color;
	// 		lineInput.style.backgroundColor = currentSpeaker.backgroundColor;
	// 		lineInput.style.fontFamily = 'HwayuReal';
	// 		lineInput.style.fontSize = fontSize;
	// 		lineInput.style.height = '100%';
	// 		lineInput.onchange = async () => {
	// 			this.pages[this.currentPageIndex].lines[currentIndex].content = lineInput.value;
	// 			await this.Save(snv);
	// 		}
	// 	}
	// 	const addButton = existingLinesDiv.createEl('button', { text: '+' } );
	// 	addButton.style.height = '100%';
	// 	addButton.onclick = async () => {
	// 		this.pages[this.currentPageIndex].lines.push(new DialogueLine(0));
	// 		await this.Save(snv);
	// 		await this.LoadDialogueLinesEdit(snv, linesDiv);
	// 	}
	// }

	private async LoadDialogueLinesDisplayOnly(linesDiv: HTMLDivElement) {
		linesDiv.empty();

		const speakDiv = linesDiv.createDiv();
		speakDiv.style.position = 'absolute';
		speakDiv.style.top = '0px';
		speakDiv.style.left = '0px';

		const existingLinesDiv = linesDiv.createDiv('vbox');
		existingLinesDiv.className = this.doVertical ? 'hbox' : 'vbox' ;
		if (this.doVertical) {
			existingLinesDiv.style.overflowX = 'scroll';
			this.MakeVertical(existingLinesDiv);
		} else {
			existingLinesDiv.style.overflowY = 'scroll';
		}

		for (let i = 0; i < this.pages[this.currentPageIndex].lines.length; i++) {
			const currentLine = this.pages[this.currentPageIndex].lines[i];
			
			if (this.language === 'Photolang') {
				const playButton = existingLinesDiv.createEl('button', { text: '▷' } );
				playButton.onclick = () => {
					const popup = speakDiv.createDiv();
					popup.style.position = 'absolute';
					popup.style.top = '0px';
					popup.style.left = '0px';
					const photoline = new PhotoLine(currentLine.content);
					photoline.Speak(popup, 200, [100, 250, 500], [0, 500], false);
				}
			}

			const nameDiv = existingLinesDiv.createDiv('hbox');
			const lineDiv = existingLinesDiv.createDiv('hbox');
			lineDiv.style.width = '100%';

			this.DisplayText(nameDiv, 25, this.characters[currentLine.speakerIndex].name);
			
			if (this.language === 'Photolang') {
				const photoLine = new PhotoLine(currentLine.content);
				photoLine.DisplayStatic(lineDiv, 25);
			} else {
				this.DisplayText(lineDiv, 25, currentLine.content);
			}
		}
		if (this.language === 'Photolang') {
			for (let i = 0; i < this.pages[this.currentPageIndex].lines.length; i++) {
				const currentLine = this.pages[this.currentPageIndex].lines[i];

				const nameDiv = speakDiv.createDiv();
				nameDiv.style.position = 'absolute';
				nameDiv.style.top = '0px';
				nameDiv.style.left = '0px';
				
				const photoName = new PhotoLine(this.characters[currentLine.speakerIndex].name);
				await photoName.Speak(nameDiv, 100, [100, 250, 500], [0, 500], false);
				
				const popup = speakDiv.createDiv();
				popup.style.position = 'absolute';
				popup.style.top = '0px';
				popup.style.left = '0px';

				const photoLine = new PhotoLine(currentLine.content);
				await photoLine.Speak(popup, 200, [100, 250, 500], [0, 500], false);
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
	constructor(name = '', color = 'white', backgroundColor = 'white') {
		this.name = name;
		this.color = color;
		this.backgroundColor = backgroundColor;
	}
}
