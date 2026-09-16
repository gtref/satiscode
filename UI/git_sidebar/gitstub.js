class StatusStub {
    static parse(raw) {
        if (!raw.trim()) {
            return [];
        }

        return raw.split("\n").map(line => {
            const code = line.slice(0, 2).trim();
            const file = line.slice(2).trim();
            return { code, file };
        });
    }
}

class BranchStub {
    static parse(raw) {
        const lines = raw.split("\n").filter(Bolean);

        let curr = null;
        const branches = [];

        for (const line of lines) {
            if (line.startsWith("*")) {
                current = line.replace("*", "").trim();
                branches.push(current);
            } else {
                branches.push(line.trim());
            }
        }
        return { current, branches };
    }
}

class LogStub {
    static parse(raw) {
        if (!raw.trim()) return [];

        return raw.split("\n").filter(Boolean).map(line => {
            const [hash, author, message, date] = line.split("|");
            return { hash, author, message, date };
        });
    }
}


module.exports = {
    StatusStub,
    BranchStub,
    LogStub
}