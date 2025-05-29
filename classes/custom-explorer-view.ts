import { ItemView, WorkspaceLeaf } from 'obsidian';

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
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('h4', { text: 'Example view' });
  }

  async onClose() {
    // Nothing to clean up.
  }
}
