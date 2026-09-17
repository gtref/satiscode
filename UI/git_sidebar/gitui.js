const { GitManager } = require('./gitman');
const { StatusStub } = require('./gitstub');

class GitUi {
    constructor(containerEl, gitBar) {
        this.gitman = new GitManager();
        this.statusStub = new StatusStub();
        this.containerEl = containerEl;
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
                this.gitman.init().then((output) => {
                    console.log("[GitUi MSG] : ", output);
                });
            }
        });
    }

    render() {
        if (!this.containerEl) return;

        this.containerEl.innerHTML = `
            <div class="git_bar">
                <button id="git-init-btn" class="init_btn">Init</button>
                <button id="git-add-btn" class="add_btn">Add all files to git tracking</button>
            </div>
        `;
    }
}