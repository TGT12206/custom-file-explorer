import { CFEFile } from "./cfe-file";
import { CFEFileHandler } from "./cfe-file-handler";
import { FileCreationData } from "./file-creation-data";
import { SingleMediaFile } from "./single-media-file";
import { SourceAndVault } from "./snv";

export class HwayuStory extends CFEFile {
	static CLASS_DEPTH = 1;

	fileType = 'Hwayu Story';

	private currentPageIndex: number;
	private pages: Page[];
	private characters: Character[];
	private get font() {
		return 'HwayuReal';
	}

	static override async CreateNewFileForLayer(data: FileCreationData): Promise<HwayuStory> {
		const newStoryFile = <HwayuStory> (await super.CreateNewFileForLayer(data));
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
			this.LoadCurrentPage(snv, mainDiv);
		}
		this.LoadCharacterEditorUI(snv, mainDiv);
	}

	private LoadCharacterEditorUI(snv: SourceAndVault, mainDiv: HTMLDivElement) {
		const editorDiv = mainDiv.createDiv('vbox');
		const addCharButton = mainDiv.createEl('button', { text: 'Add Character' } );
		let count = 0;
		for (let i = 0; i < this.characters.length; i++) {
			const currentIndex = count;
			count++;
			const charDiv = editorDiv.createDiv('vbox');
			const nameDiv = charDiv.createDiv('hbox');
			nameDiv.createEl('p', { text: 'Name: ' } );
			const nameInput = nameDiv.createEl('input', { type: 'text', value: this.characters[i].name } );
			const colorDiv = editorDiv.createDiv('hbox');
			colorDiv.createEl('p', { text: 'Text Color:' } );
			const colorInput = colorDiv.createEl('input', { type: 'color', value: this.characters[i].color } );
			colorDiv.createEl('p', { text: 'Background Color:' } );
			const backgroundInput = colorDiv.createEl('input', { type: 'color', value: this.characters[i].backgroundColor } );
			const swapButton = colorDiv.createEl('button', { text: 'Swap' } );
			nameInput.onchange = async () => {
				this.characters[currentIndex].name = nameInput.value;
				await this.Save(snv);
			}
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
				backgroundInput.value = this.characters[currentIndex].backgroundColor;
				colorInput.value = this.characters[currentIndex].color;
				await this.Save(snv);
			}
		}
		addCharButton.onclick = () => {
			const currentIndex = count;
			count++;
			this.characters.push(new Character('', 'white', 'black'));
			const charDiv = editorDiv.createDiv('vbox');
			const nameDiv = charDiv.createDiv('hbox');
			nameDiv.createEl('p', { text: 'Name: ' } );
			const nameInput = nameDiv.createEl('input', { type: 'text' } );
			const colorDiv = editorDiv.createDiv('hbox');
			colorDiv.createEl('p', { text: 'Text Color:' } );
			const colorInput = colorDiv.createEl('input', { type: 'color', value: this.characters[count - 1].color } );
			colorDiv.createEl('p', { text: 'Background Color:' } );
			const backgroundInput = colorDiv.createEl('input', { type: 'color', value: this.characters[count - 1].backgroundColor } );
			const swapButton = colorDiv.createEl('button', { text: 'Swap' } );
			nameInput.onchange = () => {
				this.characters[currentIndex].name = nameInput.value;
				this.Save(snv);
			}
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
				backgroundInput.value = this.characters[currentIndex].backgroundColor;
				colorInput.value = this.characters[currentIndex].color;
				await this.Save(snv);
			}
			this.Save(snv);
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
		backButton.onclick = async () => {
			if (this.currentPageIndex > 0) {
				this.currentPageIndex--;
				await this.LoadCurrentPage(snv, mainDiv);
			}
		}
		nextButton.onclick = async () => {
			if (this.currentPageIndex < this.pages.length) {
				this.currentPageIndex++;
				await this.LoadCurrentPage(snv, mainDiv);
			}
		}
		pageNumberInput.onchange = async () => {
			this.currentPageIndex = parseInt(pageNumberInput.value) - 1;
			await this.LoadCurrentPage(snv, mainDiv);
		}
		deleteButton.onclick = async () => {
			this.pages.splice(this.currentPageIndex, 1);
			await this.Save(snv);
			if (this.currentPageIndex !== 0) {
				this.currentPageIndex--;
			}
			await this.LoadCurrentPage(snv,mainDiv);
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
			await this.LoadCurrentPage(snv,mainDiv);
		}
	}

	private async LoadCurrentPage(snv: SourceAndVault, mainDiv: HTMLDivElement) {
		mainDiv.empty();
		const backButton = mainDiv.createEl('button', { text: 'Return to Story' } );
		backButton.onclick = async () => {
			await this.LoadStoryUI(snv, mainDiv);
		}
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
		await this.LoadDialogueLines(snv, linesDiv);
		mediaFileIDInput.onchange = async () => {
			const currentPage = this.pages[this.currentPageIndex];
			currentPage.mediaFileID = parseInt(mediaFileIDInput.value);
			await this.Save(snv);
			const mediaFile = <SingleMediaFile> await CFEFileHandler.LoadFile(snv, currentPage.mediaFileID);
			await mediaFile.DisplayMediaOnly(mediaDiv, snv);
		}
	}

	private async LoadDialogueLines(snv: SourceAndVault, linesDiv: HTMLDivElement) {
		const existingLinesDiv = linesDiv.createDiv('hbox');
		existingLinesDiv.style.overflowX = 'scroll';
		const fontSize = '17.5px';
		for (let i = 0; i < this.pages[this.currentPageIndex].lines.length; i++) {
			const currentIndex = i;
			const currentLine = this.pages[this.currentPageIndex].lines[i];
			const speakerIndex = currentLine.speakerIndex;
			const currentSpeaker = this.characters[speakerIndex];
			const lineDiv = existingLinesDiv.createDiv('vbox');
			const deleteButton = lineDiv.createEl('button', { text: '-' } );
			deleteButton.className = 'cfe-remove-button';
			deleteButton.style.writingMode = 'vertical-lr';
			deleteButton.style.textOrientation = 'upright';
			deleteButton.onclick = async () => {
				this.pages[this.currentPageIndex].lines.splice(currentIndex, 1);
				await this.Save(snv);
				await this.LoadDialogueLines(snv, linesDiv);
			}
			const indexElement = lineDiv.createEl('p', { text: '' +  currentIndex } );
			indexElement.style.color = currentSpeaker.color;
			indexElement.style.fontFamily = this.font;
			indexElement.style.writingMode = 'vertical-lr';
			indexElement.style.textOrientation = 'upright';
			const charDropdownDiv = lineDiv.createDiv();
			charDropdownDiv.style.position = 'relative';
			const charDropdown = charDropdownDiv.createEl('button');
			charDropdown.style.height = 'fit-content';
			charDropdown.onclick = () => {
				const selectDiv = charDropdownDiv.createDiv('hbox');
				selectDiv.style.position = 'absolute';
				selectDiv.style.top = '0%';
				selectDiv.style.left = '0%';
				for (let i = 0; i < this.characters.length; i++) {
					const currentCharIndex = i;
					const currentChar = this.characters[currentCharIndex];
					const currentOption = selectDiv.createEl('button', { text: currentChar.name, value: '' + i } );
					currentOption.style.color = currentChar.color;
					currentOption.style.fontFamily = this.font;
					currentOption.style.backgroundColor = currentChar.backgroundColor;
					currentOption.style.writingMode = 'vertical-lr';
					currentOption.style.textOrientation = 'upright';
					currentOption.style.height = 'fit-content';
					currentOption.style.zIndex = '2';
					currentOption.onclick = async () => {
						this.pages[this.currentPageIndex].lines[currentIndex].speakerIndex = currentCharIndex;
						const newSpeakerColor = this.characters[currentCharIndex].color;
						const newBackgroundColor = this.characters[currentCharIndex].backgroundColor;
						charDropdown.style.color = newSpeakerColor;
						charDropdown.style.backgroundColor = newBackgroundColor;
						charDropdown.textContent = this.characters[currentCharIndex].name;
						lineInput.style.color = newSpeakerColor;
						lineInput.style.backgroundColor = newBackgroundColor;
						indexElement.style.color = newSpeakerColor;
						await this.Save(snv);
						selectDiv.remove();
					}
				}
			}
			charDropdown.textContent = this.characters[currentLine.speakerIndex].name;
			charDropdown.style.color = currentSpeaker.color;
			charDropdown.style.backgroundColor = currentSpeaker.backgroundColor;
			charDropdown.style.fontFamily = this.font;
			charDropdown.style.writingMode = 'vertical-lr';
			charDropdown.style.textOrientation = 'upright';
			const lineInput = lineDiv.createEl('textarea');
			lineInput.spellcheck = false;
			lineInput.style.overflowX = 'scroll';
			lineInput.style.writingMode = 'vertical-lr';
			lineInput.style.textOrientation = 'upright';
			lineInput.defaultValue = currentLine.line
			lineInput.style.color = currentSpeaker.color;
			lineInput.style.backgroundColor = currentSpeaker.backgroundColor;
			lineInput.style.fontFamily = this.font;
			lineInput.style.fontSize = fontSize;
			lineInput.style.height = '100%';
			lineInput.onchange = async () => {
				this.pages[this.currentPageIndex].lines[currentIndex].line = lineInput.value;
				await this.Save(snv);
			}
		}
		const addButton = existingLinesDiv.createEl('button', { text: '+' } );
		addButton.style.height = '100%';
		addButton.onclick = async () => {
			this.pages[this.currentPageIndex].lines.push(new DialogueLine(0, ''));
			await this.Save(snv);
			await this.LoadDialogueLines(snv, linesDiv);
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
	line: string;
	constructor(speakerIndex: number, line: string) {
		this.speakerIndex = speakerIndex;
		this.line = line;
	}
}
class Character {
	name: string;
	color: string;
	backgroundColor: string;
	constructor(name: string, color: string, backgroundColor: string) {
		this.name = name;
		this.color = color;
		this.backgroundColor = backgroundColor;
	}
}
