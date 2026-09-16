const { exec, execFile } = require("child_process");

class GitManager {
    constructor(options = {}) {
        // Directory where Git commands will run
        this.cwd = options.cwd || process.cwd();

        // Optional: enable verbose logging
        this.verbose = options.verbose || false;
    }

    run(cmd) {
        return new Promise((resolve, reject) => {
            exec(cmd, { cwd: this.cwd }, (err, stdout, stderr) => {
                if (this.verbose) {
                    console.log("[GitManager] CMD: ", cmd);
                    console.log("[GitManager] OUT: ", stdout);
                    console.log("[GitManager] ERR: ", stderr);
                }
                if (err) {
                    const msg = stdout.trim() || stderr.trim();
                    reject(msg);
                    return;
                }
                resolve(stdout.trim());
            });
        });
    }

    async init() { // Function to handle git init
        return this.run("git init");
    }

    async addAll() { // Function to handle git add .
        return this.run("git add .");
    }

    async commit(message) { // Function to handle git commit -m ""
        return new Promise((resolve, reject) => {
            execFile("git", ["commit", "-m", message], { cwd: this.cwd }, (err, stdout, stderr) => {
                if (this.verbose) {
                    console.log("[GitManager] CMD: ", "git commit -m", message);
                    console.log("[GitManager] OUT: ", stdout);
                    console.log("[GitManager] ERR: ", stderr);
                }
                if (err) {
                    const msg = stdout.trim() || stderr.trim();
                    reject(msg);
                    return;
                }
                resolve(stdout.trim());
            });
        });
    }

    async status() { // Function to handle git status
        return this.run("git status --short");
    }

    async push() { // Function to handle git push
        return this.run("git push");
    }

    async pull() { // Function to handle git pull
        return this.run("git pull");
    }

    async branch(name) { // Function to handle git branch
        return this.run(`git branch ${name}`);
    }

    async switch(name) { // Function to handle git switch branch
        return this.run(`git switch ${name}`);
    }
}

module.exports = GitManager;
