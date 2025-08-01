import { CFEFile } from "./cfe-file";
import { SourceAndVault } from "./snv";

export class StorageOrganizer extends CFEFile {
	itemList: StoredItem[];
	searchTerm: string;
	currentItem: number;

	static override async CreateNewFileForLayer(snv: SourceAndVault, fileType: string, parentFolderID: number, name: string): Promise<StorageOrganizer> {
		const newOrganizer = <StorageOrganizer> await super.CreateNewFileForLayer(snv, fileType, parentFolderID, name);
		newOrganizer.itemList = [new StoredItem(0)];
		newOrganizer.searchTerm = '';
		newOrganizer.currentItem = 0;
		return newOrganizer;
	}

	override async Display(snv: SourceAndVault, div: HTMLDivElement): Promise<void> {
		await super.Display(snv, div);

		const buttonDiv = div.createDiv('hbox');
		const searchButton = buttonDiv.createEl('button', { text: 'Go Search' } );
		const viewButton = buttonDiv.createEl('button', { text: 'Go to Visualizer' } );

		const displayDiv = div.createDiv('vbox');

		searchButton.onclick = () => {
			this.LoadSearch(snv, div, displayDiv);
		}
		viewButton.onclick = () => {
			this.itemList[this.currentItem].Display(snv, div, displayDiv, this);
		}

		this.itemList[this.currentItem].Display(snv, div, displayDiv, this);
	}

	LoadAllInnerObjects(): StorageOrganizer {
		for (let i = 0; i < this.itemList.length; i++) {
			const plainObject = this.itemList[i];
			this.itemList[i] = Object.assign(new StoredItem(plainObject.id, plainObject.containerId), plainObject);
		}
		return this;
	}

	LoadSearch(snv: SourceAndVault, mainDiv: HTMLDivElement, searchDiv: HTMLDivElement) {
		searchDiv.empty();
		const resultsDiv = searchDiv.createDiv();

		const searchBar = searchDiv.createEl('input', { type: 'text', value: this.searchTerm } );
		const loadResults = (div: HTMLDivElement) => {
			div.empty();
			for (let i = 0; i < this.itemList.length; i++) {
				const currentItem = this.itemList[i]
				if (currentItem.name.toLowerCase().contains(this.searchTerm.toLowerCase()) || currentItem.description.toLowerCase().contains(this.searchTerm.toLowerCase())) {
					let directions = '';
					const index = i;
					const directionsArray = currentItem.GetDirections(this.itemList);
					for (let j = 0; j < directionsArray.length; j++) {
						const currentContainer = this.itemList[directionsArray[j]];
						if (j > 0) {
							directions += ' -> ';
						}
						directions += 'ID: ' + currentContainer.id + ', Name: ' + currentContainer.name;
					}
					const itemElement = div.createEl('div', { text: directions } );
					itemElement.onclick = () => {
						this.itemList[index].Display(snv, mainDiv, searchDiv, this);
					}
				}
			}
		}

		loadResults(resultsDiv);
		
		searchBar.oninput = async () => {
			this.searchTerm = searchBar.value;
			loadResults(resultsDiv);
		}
	}

}

class StoredItem {
	containerId: number;
	id: number;
	name: string;
	description: string;
	storedIds: number[];
	x: number;
	y: number;
	z: number;
	width: number;
	height: number;
	degreesRotated: number;

	GetDirections(itemList: StoredItem[]): number[] {
		const path = this.containerId === 0 ? [0] : itemList[this.containerId].GetDirections(itemList);
		path.push(this.id);
		return path;
	}

	constructor(id: number, containerId = 0) {
		this.containerId = containerId;
		this.id = id;
		this.name = 'Unnamed';
		this.description = 'description';
		this.storedIds = [];
		this.x = 150;
		this.y = 50;
		this.z = 0;
		this.width = 25;
		this.height = 25;
		this.degreesRotated = 0;
	}

	async Display(snv: SourceAndVault, mainDiv: HTMLDivElement, displayDiv: HTMLDivElement, organizer: StorageOrganizer) {
		displayDiv.empty();

		organizer.currentItem = this.id;

		const backButton = displayDiv.createEl('button', { text: 'back' } );
		backButton.onclick = () => {
			organizer.itemList[this.containerId].Display(snv, mainDiv, displayDiv, organizer);
		}

		const containerDiv = displayDiv.createDiv();
		containerDiv.style.width = '40vw';
		containerDiv.style.height = '40vw';
		containerDiv.style.position = 'relative';

		const longerSide = this.width > this.height ? this.width : this.height;

		const thisItem = containerDiv.createDiv();
		thisItem.style.position = 'absolute';
		thisItem.style.borderStyle = 'solid';
		thisItem.style.borderColor = 'white';
		thisItem.style.width = (this.width / longerSide * 100) + '%';
		thisItem.style.height = (this.height / longerSide * 100) + '%';
		thisItem.style.left = '0%';
		thisItem.style.bottom = '0%';

		for (let i = 0; i < this.storedIds.length; i++) {
			organizer.itemList[this.storedIds[i]].DisplayWithinParent(snv, mainDiv, displayDiv, containerDiv, organizer);
		}

		const editDiv = displayDiv.createDiv();
		this.DisplayEditor(snv, mainDiv, displayDiv, editDiv, organizer);
	}

	private async DisplayWithinParent(snv: SourceAndVault, mainDiv: HTMLDivElement, displayDiv: HTMLDivElement, parentDiv: HTMLDivElement, organizer: StorageOrganizer) {
		const container = organizer.itemList[this.containerId];
		const longerSide = container.width > container.height ? container.width : container.height;

		const thisItem = parentDiv.createDiv('cfe-pointer-hover');
		thisItem.style.borderStyle = 'solid';
		thisItem.style.borderColor = 'white';
		thisItem.style.color = 'white';
		thisItem.textContent = this.name;
		thisItem.style.textAlign = 'center';
		thisItem.style.alignContent = 'center';
		thisItem.style.position = 'absolute';
		thisItem.style.width = (this.width * longerSide / 100) + '%';
		thisItem.style.height = (this.height * longerSide / 100) + '%';
		thisItem.style.left = this.x + '%';
		thisItem.style.bottom = this.y + '%';
		thisItem.style.zIndex = this.z + '';
		thisItem.style.transform = 'translate(-50%, 50%) rotate(' + this.degreesRotated + 'deg)';
		thisItem.draggable = true;
		thisItem.style.resize = 'both';
		thisItem.style.overflow = 'auto';

		thisItem.onclick = async () => {
			this.Display(snv, mainDiv, displayDiv, organizer);
		}
		
		document.addEventListener("dragstart", (event: DragEvent) => {
			//#region The following region was written by the AI overview in google search
			const img = new Image();
			img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
			event.dataTransfer?.setDragImage(img, 0, 0);
			//#endregion
		});

		thisItem.addEventListener('drag', (event: DragEvent) => {
			//#region The following region was written by the AI overview in google search
			const rect = parentDiv.getBoundingClientRect();

			// Calculate mouse position relative to the div
			const mouseXRelativeToDiv = event.clientX - rect.left;
			const mouseYRelativeToDiv = rect.bottom - event.clientY;

			// Convert to percentage
			const mouseXPercentage = ((mouseXRelativeToDiv / rect.width) * 100).toFixed(2);
			const mouseYPercentage = ((mouseYRelativeToDiv / rect.height) * 100).toFixed(2);

			// One can use these percentage values for various interactive features
			//#endregion

			thisItem.style.left = mouseXPercentage + '%';
			thisItem.style.bottom = mouseYPercentage + '%';
		});
		
		thisItem.addEventListener('dragend', async (event: DragEvent) => {
			//#region The following region was written by the AI overview in google search
			const rect = parentDiv.getBoundingClientRect();

			// Calculate mouse position relative to the div
			const mouseXRelativeToDiv = event.clientX - rect.left;
			const mouseYRelativeToDiv = rect.bottom - event.clientY;

			// Convert to percentage
			const mouseXPercentage = ((mouseXRelativeToDiv / rect.width) * 100).toFixed(2);
			const mouseYPercentage = ((mouseYRelativeToDiv / rect.height) * 100).toFixed(2);

			// One can use these percentage values for various interactive features
			//#endregion

			this.x = parseInt(mouseXPercentage);
			this.y = parseInt(mouseYPercentage);
			thisItem.style.left = mouseXPercentage + '%';
			thisItem.style.bottom = mouseYPercentage + '%';
			await organizer.Save(snv);
		});
	}

	private async DisplayEditor(snv: SourceAndVault, mainDiv: HTMLDivElement, displayDiv: HTMLDivElement, editorDiv: HTMLDivElement, organizer: StorageOrganizer) {
		editorDiv.empty();
		const inputDiv = editorDiv.createDiv('hbox');
		inputDiv.createEl('p', { text: 'ID: ' + this.id } );
		inputDiv.createEl('p', { text: 'Name:' } );
		const name = inputDiv.createEl('input', { type: 'text', value: this.name } );
		inputDiv.createEl('p', { text: 'Description:' } );
		const description = inputDiv.createEl('textarea', { text: this.description } );
		inputDiv.createEl('p', { text: 'Z:' } );
		const z = inputDiv.createEl('input', { type: 'text', value: this.z + '' } );
		z.style.width = '5%';
		inputDiv.createEl('p', { text: 'Rotation:' } );
		const rotation = inputDiv.createEl('input', { type: 'text', value: this.degreesRotated + '' } );
		rotation.style.width = '5%';
		inputDiv.createEl('p', { text: 'Width:' } );
		const width = inputDiv.createEl('input', { type: 'text', value: this.width + '' } );
		width.style.width = '5%';
		inputDiv.createEl('p', { text: 'Height:' } );
		const height = inputDiv.createEl('input', { type: 'text', value: this.height + '' } );
		height.style.width = '5%';

		name.onchange = async () => {
			this.name = name.value;
			await organizer.Save(snv);
			this.DisplayEditor(snv, mainDiv, displayDiv, editorDiv, organizer);
		}
		description.onchange = async () => {
			this.description = description.value;
			await organizer.Save(snv);
			this.DisplayEditor(snv, mainDiv, displayDiv, editorDiv, organizer);
		}
		z.onchange = async () => {
			this.z = parseFloat(z.value);
			await organizer.Save(snv);
			this.DisplayEditor(snv, mainDiv, displayDiv, editorDiv, organizer);
		}
		rotation.onchange = async () => {
			this.degreesRotated = parseFloat(rotation.value);
			await organizer.Save(snv);
			this.DisplayEditor(snv, mainDiv, displayDiv, editorDiv, organizer);
		}
		width.onchange = async () => {
			this.width = parseFloat(width.value);
			await organizer.Save(snv);
			organizer.Display(snv, mainDiv);
		}
		height.onchange = async () => {
			this.height = parseFloat(height.value);
			await organizer.Save(snv);
			organizer.Display(snv, mainDiv);
		}
		
		const storedItemsDiv = editorDiv.createDiv('vbox');
		for (let i = 0; i < this.storedIds.length; i++) {
			const index = i;
			const currentItem = storedItemsDiv.createEl('input', { type: 'text', value: this.storedIds[i] + '' } );
			currentItem.onchange = async () => {
				organizer.itemList[this.storedIds[index]].id = parseInt(currentItem.value);
				this.storedIds[index] = parseInt(currentItem.value);
				await organizer.Save(snv);
				organizer.Display(snv, mainDiv);
			}
		}
		const addButton = storedItemsDiv.createEl('button', { text: '+' } );
		addButton.onclick = async () => {
			const newId = organizer.itemList.length;
			organizer.itemList.push(new StoredItem(newId, this.id));
			this.storedIds.push(newId);
			await organizer.Save(snv);
			organizer.Display(snv, mainDiv);
		}
	}

}
