class StatusStub {
    static parse(raw) {
        if (!raw || !raw.trim()) {
            return [];
        }

        return raw.split(/\r?\n/).filter(Boolean).map(line => {
            const code = line.slice(0, 2);
            const file = line.slice(2).trim();
            return { code, file };
        });
    }
}

class BranchStub {
    static parse(raw) {
        const lines = raw.split("\n").filter(Boolean);

        let current = null;
        const branches = [];

        for (const line of lines) {
            if (line.startsWith("*")) {
                current = line.replace(/^\*\s*/, "").trim();
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
        if (!raw || !raw.trim()) return [];

        return raw.split(/\r?\n/).flatMap((line) => {
            const separator = line.indexOf('\x1f');
            if (separator < 0) return line.trim() ? [{ graph: line, graphOnly: true }] : [];
            const [hash, parents, author, date, refs, message] = line.slice(separator + 1).split('\x1f');
            if (!hash || !author) return [];
            return [{ graph: line.slice(0, separator), hash, parents: parents ? parents.split(' ').filter(Boolean) : [], author, date, refs: refs || '', message }];
        });
    }
}


module.exports = {
    StatusStub,
    BranchStub,
    LogStub
};
