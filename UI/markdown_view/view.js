class mdView {

    constructor(containerEl) {
        // Basic constructor for the markdown viewer.
        this.containerEl = containerEl;
        this.MD = null;
    }

    render() {
        // Logic to create the markdown viewer section.
        if (!this.containerEl || this.containerEl.ownerDocument) return;
        const panel = this.create('section', { className: 'md-view'});
        panel.append(this.create('h2', { className: 'md-view-title' }, 'MarkDown Viewer'));

    }
}

module.exports = {mdView};