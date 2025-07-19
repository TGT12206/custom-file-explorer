import { CFEFile } from "./cfe-file";
import { Hwayu } from "./conlangs/hwayu-text";
import { PhotoLang } from "./conlangs/photolang-text";
import { FileCreationData } from "./file-creation-data";
import { SourceAndVault } from "./snv";

export class ConlangDictionary extends CFEFile {

	language: string;
	conlangWords: string[];
	definitions: string[];

	static override async CreateNewFileForLayer(data: FileCreationData): Promise<ConlangDictionary> {
		const unfinishedDictionary = <ConlangDictionary> await super.CreateNewFileForLayer(data);
		unfinishedDictionary.language = 'Hwayu';
		unfinishedDictionary.conlangWords = [];
		unfinishedDictionary.definitions = [];
		return unfinishedDictionary;
	}

	override async Display(snv: SourceAndVault, mainDiv: HTMLDivElement): Promise<void> {
		await super.Display(snv, mainDiv);

		const languageDropdown = mainDiv.createEl('select');
		languageDropdown.createEl('option', { text: 'Hwayu', value: 'Hwayu' } );
		languageDropdown.createEl('option', { text: 'Photolang', value: 'Photolang' } );
		languageDropdown.value = this.language;

		const addWordDiv = mainDiv.createDiv('vbox');
		await this.DisplayWord(snv, mainDiv, addWordDiv);

		languageDropdown.onchange = async () => {
			this.language = languageDropdown.value;
			await this.Save(snv);
			await this.Display(snv, mainDiv);
		}

		const sides = mainDiv.createDiv('hbox');

		const conlangSide = sides.createDiv('vbox');
		const definitionSide = sides.createDiv('vbox');
		conlangSide.style.width = '50%';
		definitionSide.style.width = '50%';
		conlangSide.createEl('p', { text: this.language } );
		definitionSide.createEl('p', { text: 'English' } );

		await this.DisplaySide(snv, mainDiv, this.conlangWords, conlangSide);
		await this.DisplaySide(snv, mainDiv, this.definitions, definitionSide);
	}

	private async DisplayWord(snv: SourceAndVault, mainDiv: HTMLDivElement, div: HTMLDivElement, index = -1) {
		div.createEl('p', { text: 'Word in ' + this.language } );
		let newWordInput;
		const isNewWord = index === -1;
		const conlangWord = isNewWord ? '' : this.conlangWords[index];
		const definition = isNewWord ? '' : this.definitions[index];
		switch(this.language) {
			case 'Hwayu':
			default:
				newWordInput = Hwayu.DisplayEditor(div, conlangWord, 17.5, false);
				break;
			case 'Photolang':
				newWordInput = PhotoLang.DisplayEditor(div, definition, 17.5);
				break;
		}
		div.createEl('p', { text: 'Definition' } );
		const definitionInput = div.createEl('input', { type: 'text' } );
		const submitButton = div.createEl('button', { text: 'submit' } );

		submitButton.onclick = async () => {
			if (isNewWord) {
				this.conlangWords.push(newWordInput.value);
				this.definitions.push(definitionInput.value);
				await this.Save(snv);
				return;
			}
			this.conlangWords[index] = newWordInput.value;
			this.definitions[index] = definitionInput.value;
		}
		if (!isNewWord) {
			const deleteButton = div.createEl('button', { text: 'remove' } );
			deleteButton.className = 'cfe-remove-button';
			this.conlangWords.remove(newWordInput.value);
			this.definitions.remove(definitionInput.value);
			await this.Save(snv);
			await this.Display(snv, mainDiv);
		}
	}

	private async DisplaySide(snv: SourceAndVault, mainDiv: HTMLDivElement, wordList: string[], div: HTMLDivElement) {
		div.createEl('p', { text: 'Search:' } );
		const wordInput = div.createEl('textarea');
		const resultsDiv = div.createDiv('vbox');

		wordInput.onchange = () => {
			resultsDiv.empty();
			for (let i = 0; i < wordList.length; i++) {
				if (wordList[i].contains(wordInput.value)) {
					this.DisplayWord(snv, mainDiv, resultsDiv.createDiv('vbox'), i);
				}
			}
		}
	}

}
