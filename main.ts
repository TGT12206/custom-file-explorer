import { CustomExplorerView, VIEW_TYPE_CUSTOM_EXPLORER } from 'classes/custom-explorer-view';
import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';

// Remember to rename these classes and interfaces!

interface CFECettings {
	defaultPath: string;
}

const DEFAULT_SETTINGS: CFECettings = {
	defaultPath: 'Source Folder'
}

export default class CFE extends Plugin {
	settings: CFECettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_CUSTOM_EXPLORER,
			(leaf) => new CustomExplorerView(leaf, this.settings.defaultPath)
		);

		this.addRibbonIcon('folder', 'Activate view', () => {
			this.activateView(VIEW_TYPE_CUSTOM_EXPLORER);
		});

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-cfe-view',
			name: 'Open Custom File Explorer View',
			callback: () => {
				this.activateView(VIEW_TYPE_CUSTOM_EXPLORER);
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView(view_type: string) {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;

		leaf = workspace.getLeaf('tab');
		if (leaf === null) {
			new Notice("Failed to create view: workspace leaf was null");
			return;
		}
		await leaf.setViewState({ type: view_type, active: true });

		// "Reveal" the leaf in case it is in a collapsed sidebar
		workspace.revealLeaf(leaf);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: CFE;

	constructor(app: App, plugin: CFE) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Default Source Path')
			.setDesc('The vault path to automatically fill in for the source path')
			.addText(text => text
				.setPlaceholder('Default Source Path')
				.setValue(this.plugin.settings.defaultPath)
				.onChange(async (value) => {
					this.plugin.settings.defaultPath = value;
					await this.plugin.saveSettings();
				}));
	}
}
