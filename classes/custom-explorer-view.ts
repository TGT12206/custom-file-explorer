import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Source } from './formatted-file';

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
			new Source(path, vault, mainContainer);
		}
		homePage.onkeydown = (keyPressEvent) => {
			if (keyPressEvent.key === 'Enter') {
				const path = existingSourcePathInput.value;
				new Source(path, vault, mainContainer);
			}
		}
	}

	async onClose() {
		// Nothing to clean up.
	}
}
