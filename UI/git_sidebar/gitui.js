const { } = require('electron');
const { } = require('./gitman');
const { } = require('./gitstub');

class GitUi {
    constructor(containerEl, gitBar) {
        this.gitman = new GitMan();
        this.gitstub = new GitStub();
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
    }

    render() {
        if (!this.containerEl) return;

        this.containerEl.innerHTML = `
            <div class="git_bar">
                <button id="git-init-btn" class="init-btn">Init</button>
            </div>
        `;
    }
}