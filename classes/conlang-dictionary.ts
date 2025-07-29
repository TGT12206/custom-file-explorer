import { CFEFile } from "./cfe-file";
import { Hwayu } from "./conlangs/hwayu-text";
import { PhotoLang } from "./conlangs/photolang-text";
import { SourceAndVault } from "./snv";

export class ConlangDictionary extends CFEFile {

	language: string;
	words: [string, string][];
	searchTerm: string;
	searchInConlang: boolean;

	static override async CreateNewFileForLayer(snv: SourceAndVault, fileType: string, parentFolderID: number, name: string): Promise<ConlangDictionary> {
		const unfinishedDictionary = <ConlangDictionary> await super.CreateNewFileForLayer(snv, fileType, parentFolderID, name);
		unfinishedDictionary.language = 'Hwayu';
		unfinishedDictionary.words = [];
		unfinishedDictionary.searchTerm = '';
		unfinishedDictionary.searchInConlang = false;
		return unfinishedDictionary;
	}

	override async Display(snv: SourceAndVault, mainDiv: HTMLDivElement): Promise<void> {
		await super.Display(snv, mainDiv);

		const languageDropdown = mainDiv.createEl('select');
		languageDropdown.createEl('option', { text: 'Hwayu', value: 'Hwayu' } );
		languageDropdown.createEl('option', { text: 'Photolang', value: 'Photolang' } );
		languageDropdown.value = this.language;

		const addWordDiv = mainDiv.createDiv('vbox');
		await this.CreateNewWordEditor(snv, mainDiv, addWordDiv);

		languageDropdown.onchange = async () => {
			this.language = languageDropdown.value;
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
		wordDiv.style.fontSize = '25px';
		const conlangWord = this.words[index][0];
		const definition = this.words[index][1];
		const conlangWordDiv = this.DisplayConlangText(wordDiv, conlangWord);
		conlangWordDiv.classList.add('cfe-pointer-hover');
		wordDiv.createEl('p', { text: ':' } );
		wordDiv.createEl('p', { text: definition } );

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
		wordDiv.style.fontSize = '25px';
		wordDiv.createEl('p', { text: 'Word in ' + this.language } );
		const conlangWord = this.words[index][0];
		const definition = this.words[index][1];
		const newWordInput = this.DisplayConlangEditor(wordDiv, conlangWord);

		wordDiv.createEl('p', { text: 'Definition' } );
		const definitionInput = wordDiv.createEl('input', { type: 'text', value: definition } );
		definitionInput.style.fontSize = '25px';

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
		div.createEl('p', { text: 'Word in ' + this.language } );
		const newWordInput = this.DisplayConlangEditor(div);

		div.createEl('p', { text: 'Definition' } );
		const definitionInput = div.createEl('input', { type: 'text', value: '' } );
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

	private DisplayConlangEditor(div: HTMLDivElement, existingWord = '') {
		switch(this.language) {
			case 'Hwayu':
			default:
				return Hwayu.CreateTextInput(div, existingWord, 25, false);
			case 'Photolang':
				return PhotoLang.CreateTextInput(div, existingWord, 25);
		}
	}

	private DisplayConlangText(div: HTMLDivElement, existingWord = '') {
		switch(this.language) {
			case 'Hwayu':
			default:
				return Hwayu.Display(div, existingWord, 25, false);
			case 'Photolang':
				return PhotoLang.Display(div, existingWord, 25, null, null, true);
		}
	}

	private async DisplayList(snv: SourceAndVault, div: HTMLDivElement) {
		div.createEl('p', { text: 'Search in ' + this.language + '?' } );
		
		const checkbox = div.createEl('input', { type: 'checkbox' } );
		checkbox.checked = this.searchInConlang;

		div.createEl('p', { text: 'Search term' } );
		
		const conlangSearch = this.DisplayConlangEditor(div, this.searchTerm);
		const englishSearch = div.createEl('input', { type: 'text', value: this.searchTerm } );
		
		let prevElement = checkbox.checked ? englishSearch : conlangSearch;
		let currentElement = checkbox.checked ? conlangSearch : englishSearch;
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

		englishSearch.oninput = refreshResults;

		checkbox.onchange = () => {
			resultsDiv.empty();

			prevElement = checkbox.checked ? englishSearch : conlangSearch;
			currentElement = checkbox.checked ? conlangSearch : englishSearch;
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
