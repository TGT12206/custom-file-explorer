import { CFEFile } from "./cfe-file";
import { CFEFileHandler } from "./cfe-file-handler";
import { FileCreationData } from "./file-creation-data";
import { SingleMediaFile } from "./single-media-file";
import { SourceAndVault } from "./snv";
import { PhotoLine } from "./conlangs/photolang-text";

export class PhotolangStory extends CFEFile {
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
			photoName.Speak(charDiv.createDiv(), 50, [100, 250, 500], [0, 500], true);
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
			const playButton = lineDiv.createEl('button', { text: '▷' } );

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
					photoName.Speak(currentOption, 10, [100, 250, 500], [0, 500], true);
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
			photoName.Speak(charDropdownDiv, 10, [100, 250, 500], [0, 500], true);

			const lineInput = lineDiv.createEl('input', { type: 'text', value: currentLine.content } );
			lineInput.style.width = '100%';
			lineInput.onchange = async () => {
				currentLine.content = lineInput.value;
				await this.Save(snv);
			}

			playButton.onclick = () => {
				const popup = mainDiv.createDiv();
				popup.style.position = 'absolute';
				popup.style.top = '0px';
				popup.style.left = '0px';
				const photoline = new PhotoLine(lineInput.value);
				photoline.Speak(popup, 200, [100, 250, 500], [0, 500], false);
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

			const playButton = existingLinesDiv.createEl('button', { text: '▷' } );
			
			const nameDiv = existingLinesDiv.createDiv('hbox');
			const lineDiv = existingLinesDiv.createDiv('hbox');

			const photoName = new PhotoLine(this.characters[currentLine.speakerIndex].name);
			photoName.Speak(nameDiv, 10, [100, 250, 500], [0, 500], true);
			
			const photoLine = new PhotoLine(currentLine.content);
			photoLine.DisplayStatic(lineDiv, 10);
			
			playButton.onclick = () => {
				const popup = mainDiv.createDiv();
				popup.style.position = 'absolute';
				popup.style.top = '0px';
				popup.style.left = '0px';
				photoLine.Speak(popup, 200, [100, 250, 500], [0, 500], false);
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
	constructor(name = '') {
		this.name = name;
	}
}
