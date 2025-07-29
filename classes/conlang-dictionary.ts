import { CFEFile } from "./cfe-file";
import { LanguageHandler } from "./conlangs/language-handler";
import { SourceAndVault } from "./snv";

export class ConlangDictionary extends CFEFile {

	termLanguage: string;
	definitionLanguage: string;
	words: [string, string][];
	searchTerm: string;
	searchInConlang: boolean;

	static override async CreateNewFileForLayer(snv: SourceAndVault, fileType: string, parentFolderID: number, name: string): Promise<ConlangDictionary> {
		const unfinishedDictionary = <ConlangDictionary> await super.CreateNewFileForLayer(snv, fileType, parentFolderID, name);
		unfinishedDictionary.termLanguage = 'English';
		unfinishedDictionary.definitionLanguage = 'English';
		unfinishedDictionary.words = [];
		unfinishedDictionary.searchTerm = '';
		unfinishedDictionary.searchInConlang = false;
		return unfinishedDictionary;
	}

	override async Display(snv: SourceAndVault, mainDiv: HTMLDivElement): Promise<void> {
		await super.Display(snv, mainDiv);

		mainDiv.createEl('p', { text: 'Term Language' } );
		const termLanguageDropdown = mainDiv.createEl('select');
		for (let i = 0; i < LanguageHandler.knownLanguages.length; i++) {
			const currentLang = LanguageHandler.knownLanguages[i];
			termLanguageDropdown.createEl('option', { text: currentLang, value: currentLang } );
		}
		termLanguageDropdown.value = this.termLanguage;

		mainDiv.createEl('p', { text: 'Definition Language' } );
		const definitionLanguageDropdown = mainDiv.createEl('select');
		for (let i = 0; i < LanguageHandler.knownLanguages.length; i++) {
			const currentLang = LanguageHandler.knownLanguages[i];
			definitionLanguageDropdown.createEl('option', { text: currentLang, value: currentLang } );
		}
		definitionLanguageDropdown.value = this.definitionLanguage;

		const addWordDiv = mainDiv.createDiv('vbox');
		await this.CreateNewWordEditor(snv, mainDiv, addWordDiv);

		termLanguageDropdown.onchange = async () => {
			this.termLanguage = termLanguageDropdown.value;
			await this.Save(snv);
			await this.Display(snv, mainDiv);
		}
		definitionLanguageDropdown.onchange = async () => {
			this.definitionLanguage = definitionLanguageDropdown.value;
			await this.Save(snv);
			await this.Display(snv, mainDiv);
		}

		await this.DisplayList(snv, mainDiv);
	}

	private async DisplayWord(snv: SourceAndVault, mainDiv: HTMLDivElement, div: HTMLDivElement, index: number) {
		div.empty();

		const modeButton = div.createEl('button', { text: 'Edit' } );
		modeButton.style.top = '0';
		modeButton.style.right = '0';
		modeButton.onclick = async () => {
			await this.EditWord(snv, mainDiv, div, index);
		}

		const wordDiv = div.createDiv('hbox');
		wordDiv.style.gap = '1%';
		wordDiv.style.fontSize = '17.5px';
		const conlangWord = this.words[index][0];
		const definition = this.words[index][1];
		const conlangWordDiv = LanguageHandler.Display(wordDiv, this.termLanguage, conlangWord, 17.5);
		conlangWordDiv.classList.add('cfe-pointer-hover');
		wordDiv.createEl('div', { text: ':' } );
		wordDiv.createEl('div', { text: definition } );

		conlangWordDiv.onclick = async () => {
			try {
				await navigator.clipboard.writeText(conlangWord);
			} catch (err) {
				console.error('Failed to copy text: ', err);
			}
		}
	}

	private async EditWord(snv: SourceAndVault, mainDiv: HTMLDivElement, div: HTMLDivElement, index: number) {
		div.empty();
		const buttonsDiv = div.createDiv('hbox');

		const modeButton = buttonsDiv.createEl('button', { text: 'View' } );
		modeButton.onclick = async () => {
			await this.DisplayWord(snv, mainDiv, div, index);
		}

		const deleteButton = buttonsDiv.createEl('button', { text: 'Delete' } );
		deleteButton.classList = 'cfe-remove-button';
		deleteButton.onclick = async () => {
			this.words.splice(index, 1);
			await this.Save(snv);
			await this.Display(snv, mainDiv);
		}

		const wordDiv = div.createDiv('vbox');
		wordDiv.createEl('p', { text: 'Word in ' + this.termLanguage } );
		const conlangWord = this.words[index][0];
		const definition = this.words[index][1];
		const newWordInput = LanguageHandler.CreateOneLineEditor(wordDiv, this.termLanguage, conlangWord, 17.5, false);

		wordDiv.createEl('p', { text: 'Definition' } );
		const definitionInput = LanguageHandler.CreateOneLineEditor(wordDiv, this.definitionLanguage, definition, 17.5, false);

		const onSubmit = async () => {
			this.words[index] = [newWordInput.value, definitionInput.value];
			this.ReSort(index);
			await this.Save(snv);
			await this.Display(snv, mainDiv);
		}

		div.onkeydown = async (event) => {
			if (event.key === 'Enter') {
				await onSubmit();
			}
		}
	}

	private CreateNewWordEditor(snv: SourceAndVault, mainDiv: HTMLDivElement, div: HTMLDivElement) {
		div.createEl('p', { text: 'Add New Word:' } );
		div.createEl('p', { text: 'Word in ' + this.termLanguage } );
		const newWordInput = LanguageHandler.CreateOneLineEditor(div, this.termLanguage, undefined, 17.5, false);

		div.createEl('p', { text: 'Definition' } );
		const definitionInput = LanguageHandler.CreateOneLineEditor(div, this.definitionLanguage, undefined, 17.5, false);
		const submitButton = div.createEl('button', { text: 'submit' } );

		const onSubmit = async () => {
			this.words.push([newWordInput.value, definitionInput.value]);
			this.ReSort(this.words.length - 1);
			await this.Save(snv);
			await this.Display(snv, mainDiv);
		}

		submitButton.onclick = onSubmit;
		div.onkeydown = async (event) => {
			if (event.key === 'Enter') {
				await onSubmit();
			}
		}
	}

	private async DisplayList(snv: SourceAndVault, div: HTMLDivElement) {
		div.createEl('p', { text: 'Search in ' + this.termLanguage + '?' } );
		
		const checkbox = div.createEl('input', { type: 'checkbox' } );
		checkbox.checked = this.searchInConlang;

		div.createEl('p', { text: 'Search term' } );
		
		const conlangSearch = LanguageHandler.CreateOneLineEditor(div, this.termLanguage, this.searchTerm, 17.5, false);
		const definitionSearch = LanguageHandler.CreateOneLineEditor(div, this.definitionLanguage, this.searchTerm, 17.5, false);
		
		let prevElement = checkbox.checked ? definitionSearch : conlangSearch;
		let currentElement = checkbox.checked ? conlangSearch : definitionSearch;

		prevElement.style.width = '100%';
		currentElement.style.width = '100%';

		this.searchTerm = prevElement.value;
		
		prevElement.style.display = 'none';
		currentElement.value = this.searchTerm;
		currentElement.style.display = '';
		
		const resultsDiv = div.createDiv('cfe-dictionary-grid');
		
		const refreshResults = () => {
			this.searchTerm = currentElement.value;
			this.searchInConlang = checkbox.checked;
			resultsDiv.empty();
			for (let i = 0; i < this.words.length; i++) {
				if (this.words[i][checkbox.checked ? 0 : 1].contains(currentElement.value)) {
					const wordDiv = resultsDiv.createDiv('cfe-dictionary-word');
					this.DisplayWord(snv, div, wordDiv, i);
				}
			}
		}

		refreshResults();

		conlangSearch.oninput = refreshResults;
		definitionSearch.oninput = refreshResults;

		checkbox.onchange = () => {
			resultsDiv.empty();

			prevElement = checkbox.checked ? definitionSearch : conlangSearch;
			currentElement = checkbox.checked ? conlangSearch : definitionSearch;
			this.searchTerm = prevElement.value;

			prevElement.style.display = 'none';
			currentElement.value = this.searchTerm;
			currentElement.style.display = '';
			
			refreshResults();
		}
	}

	private ReSort(indexOfChangedWord: number) {
		const changedWord = this.words.splice(indexOfChangedWord, 1)[0];
		let i = 0;
		let left = 0;
		let right = this.words.length - 1;
		
		while (left <= right) {
			const mid = Math.floor((left + right) / 2);
			if (this.words[mid][0] < changedWord[0]) {
				left = mid + 1;
				i = left;
			} else {
				right = mid - 1;
				i = mid;
			}
		}

		this.words.splice(i, 0, changedWord);
	}

}
