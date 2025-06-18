import { ItemView, WorkspaceLeaf } from 'obsidian';
import { SourceFolder } from './formatted-file';

export const VIEW_TYPE_CUSTOM_EXPLORER = 'custom-explorer-view';

export class CustomExplorerView extends ItemView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_CUSTOM_EXPLORER;
	}

	getDisplayText() {
		return 'Example view';
	}

	async onOpen() {
		const wrapper = this.containerEl.children[1];
		wrapper.empty();
		const mainContainer = wrapper.createDiv('cfe-main-display');
		const homePage = mainContainer.createDiv('cfe-home-page');
		homePage.createEl('h4', { text: 'Path to Source:' } );
		const existingSourcePathInput = homePage.createEl('input', { type: 'text', value: 'source' } );
		const submitButton = homePage.createEl('button', { text: 'submit' } );
		const vault = this.app.vault;
		submitButton.onclick = async () => {
			const path = existingSourcePathInput.value;
			const sf = <SourceFolder> await SourceFolder.CreateOrLoadSourceFolder(path, vault);
			await sf.Display(mainContainer, vault);
		}
		homePage.onkeydown = async (keyPressEvent) => {
			if (keyPressEvent.key === 'Enter') {
				const path = existingSourcePathInput.value;
				const sf = await SourceFolder.CreateOrLoadSourceFolder(path, vault);
				await sf.Display(mainContainer, vault);
			}
		}
	}

	async onClose() {
		// Nothing to clean up.
	}
}
