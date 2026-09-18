class GitManager {
    constructor(options = {}) {
        this.api = options.api;
        this.workspace = options.workspace || null;
    }

    setWorkspace(workspace) {
        this.workspace = workspace || null;
    }

    async run(operation, ...args) {
        if (!this.workspace) throw new Error('Open a folder to use Git.');
        if (!this.api || typeof this.api.run !== 'function') throw new Error('Git API is unavailable.');
        const result = await this.api.run(operation, this.workspace, args);
        if (!result.ok) {
            const error = new Error(result.stderr || result.stdout || 'Git command failed.');
            error.code = result.code;
            throw error;
        }
        return result.stdout;
    }

    async init() {
        return this.run('init');
    }

    async addAll() {
        return this.run('addAll');
    }

    async commit(message) {
        return this.run('commit', message);
    }

    async status() {
        return this.run('status');
    }

    async push() {
        return this.run('push');
    }

    async pull() {
        return this.run('pull');
    }
}

module.exports = GitManager;
