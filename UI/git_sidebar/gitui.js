const GitManager = require('./gitman');
const { generateUnifiedDiff } = require('../../patchgen');

class GitUi {
    constructor(containerEl, gitBar) {
        this.gitman = new GitManager();
        this.containerEl = containerEl;
        this.patch = generateUnifiedDiff;
        this.gitBar = gitBar;
    }

    init_listners() {
        this.containerEl.addEventListener('click', (e) => {
            if (e.target.id === 'git-init-btn') {
                this.gitman.init().then((output) => {
                    console.log("[GitUi MSG] : ", output);
                });
            }
        });

        this.containerEl.addEventListener('click', (e) => {
            if (e.target.id === 'git-add-btn') {
                this.gitman.addAll().then((output) => {
                    console.log("[GitUi MSG] : ", output);
                });
            }
        });

        this.containerEl.addEventListener('click', (e) => {
            if (e.target.id === 'git-patch-btn') {
                const oldFile = this.containerEl.querySelector('#git-old-file').files[0];
                const newFile = this.containerEl.querySelector('#git-new-file').files[0];
                if (!oldFile || !newFile) return;

                const oldFilePath = this.gitBar.getPathForFile(oldFile);
                const newFilePath = this.gitBar.getPathForFile(newFile);
                const output = this.patch(oldFilePath, newFilePath);
                console.log("[GitUi MSG] : ", output);
            }
        });
    }

    render() {
        if (!this.containerEl) return;

        this.containerEl.innerHTML = `
            <div class="git_bar">
                <button id="git-init-btn" class="init_btn">Init</button>
                <button id="git-add-btn" class="add_btn">Add all files to git tracking</button>
                <label for="git-old-file">Old file</label>
                <input id="git-old-file" type="file">
                <label for="git-new-file">New file</label>
                <input id="git-new-file" type="file">
                <button id="git-patch-btn" class="patch_btn">Generate Patch</button>
            </div>
        `;
    }
}

module.exports = { GitUi };
